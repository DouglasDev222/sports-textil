import { pool } from '../db';
import type { PoolClient } from 'pg';

export interface RegistrationData {
  eventId: string;
  athleteId: string;
  modalityId: string;
  batchId: string;
  orderId: string;
  numeroInscricao: number;
  tamanhoCamisa: string | null;
  equipe: string | null;
  valorUnitario: string;
  taxaComodidade: string;
  status: string;
  nomeCompleto: string;
  cpf: string;
  dataNascimento: string;
  sexo: string;
}

export interface OrderData {
  numeroPedido: number;
  eventId: string;
  compradorId: string;
  valorTotal: string;
  valorDesconto: string;
  status: string;
  metodoPagamento: string | null;
  ipComprador: string | null;
}

export type RegistrationErrorCode = 
  | 'EVENT_FULL'
  | 'MODALITY_FULL'
  | 'LOT_FULL'
  | 'LOT_SOLD_OUT_OR_CHANGED'
  | 'MODALITY_NOT_FOUND'
  | 'LOT_NOT_FOUND'
  | 'EVENT_NOT_FOUND'
  | 'VAGAS_ESGOTADAS'
  | 'JA_INSCRITO'
  | 'ALREADY_REGISTERED'
  | 'INTERNAL_ERROR';

export interface AtomicRegistrationResult {
  success: boolean;
  order?: {
    id: string;
    numeroPedido: string;
    valorTotal: number;
    status: string;
  };
  registration?: {
    id: string;
    numeroInscricao: string;
    status: string;
    batchId: string;
    valorUnitario: number;
  };
  error?: string;
  errorCode?: RegistrationErrorCode;
}

async function closeBatchAndActivateNext(
  client: PoolClient, 
  currentBatchId: string, 
  eventId: string,
  modalityId: string | null
): Promise<void> {
  await client.query(
    `UPDATE registration_batches SET ativo = false, status = 'closed' WHERE id = $1`,
    [currentBatchId]
  );

  const currentBatchOrder = await client.query(
    `SELECT ordem FROM registration_batches WHERE id = $1`,
    [currentBatchId]
  );

  if (currentBatchOrder.rows.length > 0) {
    const currentOrder = currentBatchOrder.rows[0].ordem;
    
    const nextBatchQuery = modalityId 
      ? `UPDATE registration_batches 
         SET ativo = true, status = 'active'
         WHERE id = (
           SELECT id FROM registration_batches
           WHERE event_id = $1 
             AND (modality_id = $2 OR modality_id IS NULL)
             AND ordem > $3
             AND (status = 'future' OR (ativo = false AND status != 'closed'))
           ORDER BY ordem ASC
           LIMIT 1
         )
         RETURNING id`
      : `UPDATE registration_batches 
         SET ativo = true, status = 'active'
         WHERE id = (
           SELECT id FROM registration_batches
           WHERE event_id = $1 
             AND modality_id IS NULL
             AND ordem > $2
             AND (status = 'future' OR (ativo = false AND status != 'closed'))
           ORDER BY ordem ASC
           LIMIT 1
         )
         RETURNING id`;

    if (modalityId) {
      await client.query(nextBatchQuery, [eventId, modalityId, currentOrder]);
    } else {
      await client.query(nextBatchQuery, [eventId, currentOrder]);
    }
  }
}

export async function registerForEventAtomic(
  orderData: OrderData,
  registrationData: RegistrationData
): Promise<AtomicRegistrationResult> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. LOCK EVENT - Check event capacity first (hard cap)
    const eventResult = await client.query(
      `SELECT id, limite_vagas_total, vagas_ocupadas, permitir_multiplas_modalidades 
       FROM events 
       WHERE id = $1 
       FOR UPDATE`,
      [registrationData.eventId]
    );
    
    if (!eventResult.rows[0]) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: 'Evento nao encontrado',
        errorCode: 'EVENT_NOT_FOUND'
      };
    }
    
    const event = eventResult.rows[0];
    
    if (event.vagas_ocupadas >= event.limite_vagas_total) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: 'Evento lotado - vagas esgotadas',
        errorCode: 'EVENT_FULL'
      };
    }

    // 2. LOCK MODALITY - Check modality capacity (optional limit)
    const modalityResult = await client.query(
      `SELECT id, limite_vagas, vagas_ocupadas, nome
       FROM modalities 
       WHERE id = $1 
       FOR UPDATE`,
      [registrationData.modalityId]
    );
    
    if (!modalityResult.rows[0]) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: 'Modalidade nao encontrada',
        errorCode: 'MODALITY_NOT_FOUND'
      };
    }
    
    const modality = modalityResult.rows[0];
    
    if (modality.limite_vagas !== null && modality.vagas_ocupadas >= modality.limite_vagas) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: `Modalidade ${modality.nome} lotada - vagas esgotadas`,
        errorCode: 'MODALITY_FULL'
      };
    }

    // 3. LOCK ACTIVE BATCH - Check batch capacity and get price
    const batchResult = await client.query(
      `SELECT rb.id, rb.quantidade_maxima, rb.quantidade_utilizada, rb.modality_id, p.valor
       FROM registration_batches rb
       LEFT JOIN prices p ON p.batch_id = rb.id AND p.modality_id = $2
       WHERE rb.event_id = $1 
         AND rb.ativo = true
         AND (rb.modality_id = $2 OR rb.modality_id IS NULL)
         AND rb.data_inicio <= NOW()
         AND (rb.data_termino IS NULL OR rb.data_termino > NOW())
       ORDER BY rb.ordem ASC
       LIMIT 1
       FOR UPDATE OF rb`,
      [registrationData.eventId, registrationData.modalityId]
    );

    // CRITICAL: If no active batch is found, reject the registration
    // Never trust the client-supplied batchId - always use the active batch from DB
    if (batchResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: 'Nao ha lote ativo disponivel para inscricao. Por favor, tente novamente.',
        errorCode: 'LOT_SOLD_OUT_OR_CHANGED'
      };
    }

    const batch = batchResult.rows[0];
    const batchId = batch.id;
    let valorUnitario = batch.valor || registrationData.valorUnitario;
    
    // Check if batch has reached capacity
    if (batch.quantidade_maxima !== null && batch.quantidade_utilizada >= batch.quantidade_maxima) {
      await closeBatchAndActivateNext(client, batchId, registrationData.eventId, batch.modality_id);
      await client.query('ROLLBACK');
      return {
        success: false,
        error: 'Lote esgotado ou alterado. Por favor, tente novamente.',
        errorCode: 'LOT_SOLD_OUT_OR_CHANGED'
      };
    }
    
    // 4. CHECK DUPLICATE REGISTRATION
    if (!event.permitir_multiplas_modalidades) {
      const existingRegistration = await client.query(
        `SELECT id FROM registrations 
         WHERE event_id = $1 AND athlete_id = $2 
         AND status != 'cancelada'
         LIMIT 1`,
        [registrationData.eventId, registrationData.athleteId]
      );
      
      if (existingRegistration.rows.length > 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: 'Voce ja possui inscricao neste evento',
          errorCode: 'JA_INSCRITO'
        };
      }
    } else {
      const existingModalityRegistration = await client.query(
        `SELECT id FROM registrations 
         WHERE event_id = $1 AND athlete_id = $2 AND modality_id = $3
         AND status != 'cancelada'
         LIMIT 1`,
        [registrationData.eventId, registrationData.athleteId, registrationData.modalityId]
      );
      
      if (existingModalityRegistration.rows.length > 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: 'Voce ja possui inscricao nesta modalidade',
          errorCode: 'JA_INSCRITO'
        };
      }
    }
    
    // 5. CREATE ORDER
    const orderResult = await client.query(
      `INSERT INTO orders (
        id, numero_pedido, event_id, comprador_id, valor_total, 
        valor_desconto, status, metodo_pagamento, ip_comprador
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8
      ) RETURNING id, numero_pedido, valor_total, status`,
      [
        orderData.numeroPedido,
        orderData.eventId,
        orderData.compradorId,
        orderData.valorTotal,
        orderData.valorDesconto,
        orderData.status,
        orderData.metodoPagamento,
        orderData.ipComprador
      ]
    );
    
    const order = orderResult.rows[0];
    
    // 6. CREATE REGISTRATION
    const registrationResult = await client.query(
      `INSERT INTO registrations (
        id, numero_inscricao, order_id, event_id, modality_id, batch_id,
        athlete_id, tamanho_camisa, valor_unitario, taxa_comodidade,
        status, equipe, nome_completo, cpf, data_nascimento, sexo
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING id, numero_inscricao, status`,
      [
        registrationData.numeroInscricao,
        order.id,
        registrationData.eventId,
        registrationData.modalityId,
        batchId,
        registrationData.athleteId,
        registrationData.tamanhoCamisa,
        valorUnitario,
        registrationData.taxaComodidade,
        registrationData.status,
        registrationData.equipe,
        registrationData.nomeCompleto,
        registrationData.cpf,
        registrationData.dataNascimento,
        registrationData.sexo
      ]
    );
    
    const registration = registrationResult.rows[0];
    
    // 7. UPDATE COUNTERS ATOMICALLY
    await client.query(
      'UPDATE events SET vagas_ocupadas = vagas_ocupadas + 1 WHERE id = $1',
      [registrationData.eventId]
    );

    await client.query(
      'UPDATE modalities SET vagas_ocupadas = vagas_ocupadas + 1 WHERE id = $1',
      [registrationData.modalityId]
    );

    await client.query(
      'UPDATE registration_batches SET quantidade_utilizada = quantidade_utilizada + 1 WHERE id = $1',
      [batchId]
    );

    // 8. CHECK IF BATCH IS NOW FULL AND CLOSE IT
    // Note: batch is guaranteed to exist at this point (we return early if not found)
    const updatedBatch = await client.query(
      `SELECT quantidade_maxima, quantidade_utilizada, modality_id FROM registration_batches WHERE id = $1`,
      [batchId]
    );
    
    if (updatedBatch.rows[0].quantidade_maxima !== null && 
        updatedBatch.rows[0].quantidade_utilizada >= updatedBatch.rows[0].quantidade_maxima) {
      await closeBatchAndActivateNext(client, batchId, registrationData.eventId, updatedBatch.rows[0].modality_id);
    }
    
    await client.query('COMMIT');
    
    return {
      success: true,
      order: {
        id: order.id,
        numeroPedido: order.numero_pedido,
        valorTotal: parseFloat(order.valor_total),
        status: order.status
      },
      registration: {
        id: registration.id,
        numeroInscricao: registration.numero_inscricao,
        status: registration.status,
        batchId: batchId,
        valorUnitario: parseFloat(valorUnitario)
      }
    };
    
  } catch (e: any) {
    await client.query('ROLLBACK');
    
    if (e.code === '23505') {
      return {
        success: false,
        error: 'Voce ja possui inscricao nesta modalidade',
        errorCode: 'JA_INSCRITO'
      };
    }
    
    console.error('Erro na inscricao atomica:', e);
    return {
      success: false,
      error: 'Erro interno do servidor',
      errorCode: 'INTERNAL_ERROR'
    };
    
  } finally {
    client.release();
  }
}

export async function decrementVagasOcupadas(eventId: string, modalityId?: string, batchId?: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      'UPDATE events SET vagas_ocupadas = GREATEST(vagas_ocupadas - 1, 0) WHERE id = $1',
      [eventId]
    );

    if (modalityId) {
      await client.query(
        'UPDATE modalities SET vagas_ocupadas = GREATEST(vagas_ocupadas - 1, 0) WHERE id = $1',
        [modalityId]
      );
    }

    if (batchId) {
      await client.query(
        'UPDATE registration_batches SET quantidade_utilizada = GREATEST(quantidade_utilizada - 1, 0) WHERE id = $1',
        [batchId]
      );
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getAvailableSpots(eventId: string): Promise<{
  event: { total: number; occupied: number; available: number };
  modalities: Array<{ id: string; name: string; total: number | null; occupied: number; available: number | null }>;
  activeBatch: { id: string; name: string; total: number | null; occupied: number; available: number | null } | null;
}> {
  const client = await pool.connect();
  
  try {
    const eventResult = await client.query(
      `SELECT id, nome, limite_vagas_total, vagas_ocupadas FROM events WHERE id = $1`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      throw new Error("Evento nao encontrado");
    }

    const event = eventResult.rows[0];
    
    const modalitiesResult = await client.query(
      `SELECT id, nome, limite_vagas, vagas_ocupadas FROM modalities WHERE event_id = $1 ORDER BY ordem`,
      [eventId]
    );

    const batchResult = await client.query(
      `SELECT id, nome, quantidade_maxima, quantidade_utilizada 
       FROM registration_batches 
       WHERE event_id = $1 AND ativo = true
       ORDER BY ordem ASC
       LIMIT 1`,
      [eventId]
    );

    return {
      event: {
        total: event.limite_vagas_total,
        occupied: event.vagas_ocupadas,
        available: event.limite_vagas_total - event.vagas_ocupadas
      },
      modalities: modalitiesResult.rows.map(m => ({
        id: m.id,
        name: m.nome,
        total: m.limite_vagas,
        occupied: m.vagas_ocupadas,
        available: m.limite_vagas !== null ? m.limite_vagas - m.vagas_ocupadas : null
      })),
      activeBatch: batchResult.rows.length > 0 ? {
        id: batchResult.rows[0].id,
        name: batchResult.rows[0].nome,
        total: batchResult.rows[0].quantidade_maxima,
        occupied: batchResult.rows[0].quantidade_utilizada,
        available: batchResult.rows[0].quantidade_maxima !== null 
          ? batchResult.rows[0].quantidade_maxima - batchResult.rows[0].quantidade_utilizada 
          : null
      } : null
    };

  } finally {
    client.release();
  }
}
