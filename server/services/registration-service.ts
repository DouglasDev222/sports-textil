import { pool } from '../db';

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
  };
  error?: string;
  errorCode?: 'VAGAS_ESGOTADAS' | 'JA_INSCRITO' | 'EVENT_NOT_FOUND' | 'INTERNAL_ERROR';
}

export async function registerForEventAtomic(
  orderData: OrderData,
  registrationData: RegistrationData
): Promise<AtomicRegistrationResult> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const eventResult = await client.query(
      `SELECT id, limite_vagas_total, vagas_ocupadas 
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
    const limiteVagas = event.limite_vagas_total;
    const vagasOcupadas = event.vagas_ocupadas;
    
    if (vagasOcupadas >= limiteVagas) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: 'Inscricoes esgotadas para este evento',
        errorCode: 'VAGAS_ESGOTADAS'
      };
    }
    
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
        registrationData.batchId,
        registrationData.athleteId,
        registrationData.tamanhoCamisa,
        registrationData.valorUnitario,
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
    
    await client.query(
      'UPDATE events SET vagas_ocupadas = vagas_ocupadas + 1 WHERE id = $1',
      [registrationData.eventId]
    );
    
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
        status: registration.status
      }
    };
    
  } catch (e: any) {
    await client.query('ROLLBACK');
    
    if (e.code === '23505') {
      return {
        success: false,
        error: 'Voce ja possui inscricao neste evento',
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

export async function decrementVagasOcupadas(eventId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE events SET vagas_ocupadas = GREATEST(vagas_ocupadas - 1, 0) WHERE id = $1',
      [eventId]
    );
  } finally {
    client.release();
  }
}
