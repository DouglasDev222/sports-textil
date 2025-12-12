import { pool } from '../db';
import { decrementVagasOcupadas } from '../services/registration-service';

interface ExpiredOrder {
  id: string;
  numeroPedido: number;
  eventId: string;
}

interface ExpiredRegistration {
  id: string;
  eventId: string;
  modalityId: string;
  batchId: string;
  tamanhoCamisa: string | null;
}

export async function expireOrders(): Promise<{
  processedOrders: number;
  releasedSpots: number;
  errors: number;
}> {
  const client = await pool.connect();
  let processedOrders = 0;
  let releasedSpots = 0;
  let errors = 0;

  try {
    const expiredOrdersResult = await client.query<ExpiredOrder>(
      `SELECT id, numero_pedido as "numeroPedido", event_id as "eventId"
       FROM orders 
       WHERE status = 'pendente' 
         AND data_expiracao IS NOT NULL 
         AND data_expiracao < NOW()
       FOR UPDATE SKIP LOCKED`
    );

    if (expiredOrdersResult.rows.length === 0) {
      return { processedOrders: 0, releasedSpots: 0, errors: 0 };
    }

    console.log(`[order-expiration-job] Encontrados ${expiredOrdersResult.rows.length} pedidos expirados`);

    for (const order of expiredOrdersResult.rows) {
      try {
        await client.query('BEGIN');

        const registrationsResult = await client.query<ExpiredRegistration>(
          `SELECT id, event_id as "eventId", modality_id as "modalityId", 
                  batch_id as "batchId", tamanho_camisa as "tamanhoCamisa"
           FROM registrations 
           WHERE order_id = $1 AND status = 'pendente'
           FOR UPDATE`,
          [order.id]
        );

        for (const registration of registrationsResult.rows) {
          await decrementVagasOcupadas(
            registration.eventId,
            registration.modalityId,
            registration.batchId,
            registration.tamanhoCamisa
          );

          await client.query(
            `UPDATE registrations SET status = 'cancelada' WHERE id = $1`,
            [registration.id]
          );

          releasedSpots++;
        }

        await client.query(
          `UPDATE orders SET status = 'expirado' WHERE id = $1`,
          [order.id]
        );

        await client.query('COMMIT');
        processedOrders++;

        console.log(
          `[order-expiration-job] Pedido #${order.numeroPedido} (${order.id}) expirado. ` +
          `${registrationsResult.rows.length} vaga(s) liberada(s).`
        );

      } catch (orderError) {
        await client.query('ROLLBACK');
        errors++;
        console.error(
          `[order-expiration-job] Erro ao expirar pedido #${order.numeroPedido}:`,
          orderError
        );
      }
    }

  } catch (error) {
    console.error('[order-expiration-job] Erro geral ao buscar pedidos expirados:', error);
    errors++;
  } finally {
    client.release();
  }

  if (processedOrders > 0 || errors > 0) {
    console.log(
      `[order-expiration-job] Resumo: ${processedOrders} pedidos expirados, ` +
      `${releasedSpots} vagas liberadas, ${errors} erros`
    );
  }

  return { processedOrders, releasedSpots, errors };
}

let jobInterval: NodeJS.Timeout | null = null;

export function startOrderExpirationJob(intervalMs: number = 60000): void {
  if (jobInterval) {
    console.log('[order-expiration-job] Job já está rodando');
    return;
  }

  console.log(`[order-expiration-job] Iniciando job de expiração (intervalo: ${intervalMs}ms)`);
  
  expireOrders().catch(err => {
    console.error('[order-expiration-job] Erro na execução inicial:', err);
  });

  jobInterval = setInterval(async () => {
    try {
      await expireOrders();
    } catch (err) {
      console.error('[order-expiration-job] Erro na execução periódica:', err);
    }
  }, intervalMs);
}

export function stopOrderExpirationJob(): void {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
    console.log('[order-expiration-job] Job parado');
  }
}
