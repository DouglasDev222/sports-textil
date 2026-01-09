import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { createPixPayment, createCardPayment, getPaymentStatus, isConfigured } from "../services/mercadopago-service";

const router = Router();

router.get("/config", async (req, res) => {
  try {
    const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;
    
    return res.json({
      success: true,
      data: {
        publicKey: publicKey || null,
        configured: isConfigured() && !!publicKey
      }
    });
  } catch (error) {
    console.error("[payments] Erro ao obter configuração:", error);
    return res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  paymentMethod: z.enum(["pix", "credit_card"]),
  cardToken: z.string().optional(),
  installments: z.number().min(1).max(12).optional().default(1),
  paymentMethodId: z.string().optional(),
  issuerId: z.string().optional(),
  payerIdentification: z.object({
    type: z.string(),
    number: z.string()
  }).optional(),
  cardholderName: z.string().optional()
});

router.post("/create", async (req, res) => {
  try {
    const athleteId = (req.session as any)?.athleteId;
    if (!athleteId) {
      return res.status(401).json({ success: false, error: "Não autenticado" });
    }

    if (!isConfigured()) {
      return res.status(503).json({ 
        success: false, 
        error: "Sistema de pagamento não configurado. Por favor, tente novamente mais tarde." 
      });
    }

    const parsed = createPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Dados inválidos",
        details: parsed.error.flatten() 
      });
    }

    const { orderId, paymentMethod, cardToken, installments, paymentMethodId, issuerId, payerIdentification, cardholderName } = parsed.data;

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Pedido não encontrado" });
    }

    if (order.compradorId !== athleteId) {
      return res.status(403).json({ success: false, error: "Acesso não autorizado" });
    }

    if (order.status !== "pendente") {
      return res.status(400).json({ 
        success: false, 
        error: order.status === "pago" 
          ? "Este pedido já foi pago" 
          : "Este pedido não está disponível para pagamento"
      });
    }

    if (order.dataExpiracao) {
      const expirationDate = new Date(order.dataExpiracao);
      if (new Date() >= expirationDate) {
        return res.status(400).json({ 
          success: false, 
          error: "Tempo de pagamento expirado. Por favor, faça uma nova inscrição.",
          errorCode: "ORDER_EXPIRED"
        });
      }
    }

    const event = await storage.getEvent(order.eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: "Evento não encontrado" });
    }

    const athlete = await storage.getAthlete(athleteId);
    if (!athlete) {
      return res.status(404).json({ success: false, error: "Atleta não encontrado" });
    }

    const amount = parseFloat(order.valorTotal);
    const description = `Inscrição - ${event.nome}`;
    const externalReference = `order_${order.id}`;

    if (paymentMethod === "pix") {
      // Verificar se já existe um PIX válido para este pedido
      if (order.pixQrCode && order.pixQrCodeBase64 && order.pixExpiracao && order.idPagamentoGateway) {
        const pixExpiration = new Date(order.pixExpiracao);
        const now = new Date();
        
        // Se o PIX ainda não expirou, reutilizar o código existente
        if (pixExpiration > now) {
          console.log(`[payments] Reutilizando PIX existente para pedido ${order.id}`);
          return res.json({
            success: true,
            data: {
              paymentId: order.idPagamentoGateway,
              status: "pending",
              qrCode: order.pixQrCode,
              qrCodeBase64: order.pixQrCodeBase64,
              expirationDate: order.pixExpiracao,
              orderId: order.id,
              dataExpiracao: order.dataExpiracao,
              reutilizado: true
            }
          });
        } else {
          console.log(`[payments] PIX anterior expirado para pedido ${order.id}, criando novo`);
        }
      }

      const result = await createPixPayment(
        order.id,
        amount,
        description,
        athlete.email,
        externalReference
      );

      if (!result.success) {
        return res.status(500).json({ 
          success: false, 
          error: result.error || "Erro ao criar pagamento PIX" 
        });
      }

      await storage.updateOrderPaymentId(order.id, result.paymentId!, "pix");

      if (result.qrCode && result.qrCodeBase64 && result.expirationDate) {
        await storage.updateOrderPixData(order.id, {
          qrCode: result.qrCode,
          qrCodeBase64: result.qrCodeBase64,
          expiracao: new Date(result.expirationDate)
        });
      }

      return res.json({
        success: true,
        data: {
          paymentId: result.paymentId,
          status: result.status,
          qrCode: result.qrCode,
          qrCodeBase64: result.qrCodeBase64,
          expirationDate: result.expirationDate,
          orderId: order.id,
          dataExpiracao: order.dataExpiracao,
          reutilizado: false
        }
      });
    } else if (paymentMethod === "credit_card") {
      if (!cardToken || !paymentMethodId) {
        return res.status(400).json({ 
          success: false, 
          error: "Token do cartão e método de pagamento são obrigatórios" 
        });
      }

      const result = await createCardPayment(
        order.id,
        amount,
        cardToken,
        installments || 1,
        athlete.email,
        paymentMethodId,
        issuerId || "",
        externalReference,
        payerIdentification,
        cardholderName,
        description
      );

      if (!result.success) {
        return res.status(500).json({ 
          success: false, 
          error: result.error || "Erro ao processar pagamento com cartão" 
        });
      }

      await storage.updateOrderPaymentId(order.id, result.paymentId!, "credit_card");

      if (result.status === "approved") {
        await storage.confirmOrderPayment(order.id, result.paymentId!);
      }

      return res.json({
        success: true,
        data: {
          paymentId: result.paymentId,
          status: result.status,
          statusDetail: result.statusDetail,
          orderId: order.id
        }
      });
    }

    return res.status(400).json({ success: false, error: "Método de pagamento inválido" });
  } catch (error) {
    console.error("[payments] Erro ao criar pagamento:", error);
    return res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

router.get("/order/:orderId", async (req, res) => {
  try {
    const athleteId = (req.session as any)?.athleteId;
    if (!athleteId) {
      return res.status(401).json({ success: false, error: "Não autenticado" });
    }

    const { orderId } = req.params;
    const order = await storage.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ success: false, error: "Pedido não encontrado" });
    }

    if (order.compradorId !== athleteId) {
      return res.status(403).json({ success: false, error: "Acesso não autorizado" });
    }

    const [registrations, event, athlete] = await Promise.all([
      storage.getRegistrationsByOrder(orderId),
      storage.getEvent(order.eventId),
      storage.getAthlete(order.compradorId)
    ]);

    const registrationsWithDetails = await Promise.all(
      registrations.map(async (reg) => {
        const [modality, participantAthlete] = await Promise.all([
          storage.getModality(reg.modalityId),
          storage.getAthlete(reg.athleteId)
        ]);
        return {
          id: reg.id,
          numeroInscricao: reg.numeroInscricao,
          status: reg.status,
          tamanhoCamisa: reg.tamanhoCamisa,
          equipe: reg.equipe,
          valorUnitario: parseFloat(reg.valorUnitario),
          taxaComodidade: parseFloat(reg.taxaComodidade),
          dataInscricao: reg.dataInscricao,
          participanteNome: reg.nomeCompleto || participantAthlete?.nome || "Participante",
          participanteCpf: reg.cpf || participantAthlete?.cpf,
          modalidade: modality ? {
            id: modality.id,
            nome: modality.nome,
            distancia: modality.distancia,
            unidadeDistancia: modality.unidadeDistancia
          } : null
        };
      })
    );

    const now = new Date();
    const pixExpired = order.pixExpiracao ? new Date(order.pixExpiracao) <= now : true;
    const orderExpired = order.dataExpiracao ? new Date(order.dataExpiracao) <= now : false;

    return res.json({
      success: true,
      data: {
        id: order.id,
        numeroPedido: order.numeroPedido,
        status: order.status,
        valorTotal: parseFloat(order.valorTotal),
        valorDesconto: parseFloat(order.valorDesconto),
        metodoPagamento: order.metodoPagamento,
        dataPedido: order.dataPedido,
        dataPagamento: order.dataPagamento,
        dataExpiracao: order.dataExpiracao,
        pixQrCode: !pixExpired ? order.pixQrCode : null,
        pixQrCodeBase64: !pixExpired ? order.pixQrCodeBase64 : null,
        pixExpiracao: order.pixExpiracao,
        pixDataGeracao: order.pixDataGeracao,
        pixExpired,
        orderExpired,
        evento: event ? {
          id: event.id,
          nome: event.nome,
          slug: event.slug,
          dataEvento: event.dataEvento,
          cidade: event.cidade,
          estado: event.estado,
          bannerUrl: event.bannerUrl
        } : null,
        comprador: athlete ? {
          id: athlete.id,
          nome: athlete.nome,
          email: athlete.email
        } : null,
        inscricoes: registrationsWithDetails
      }
    });
  } catch (error) {
    console.error("[payments] Erro ao buscar pedido:", error);
    return res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

router.post("/change-method/:orderId", async (req, res) => {
  try {
    const athleteId = (req.session as any)?.athleteId;
    if (!athleteId) {
      return res.status(401).json({ success: false, error: "Não autenticado" });
    }

    const { orderId } = req.params;
    const order = await storage.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ success: false, error: "Pedido não encontrado" });
    }

    if (order.compradorId !== athleteId) {
      return res.status(403).json({ success: false, error: "Acesso não autorizado" });
    }

    if (order.status !== "pendente") {
      return res.status(400).json({ 
        success: false, 
        error: "Só é possível trocar método de pagamento para pedidos pendentes"
      });
    }

    if (order.dataExpiracao && new Date(order.dataExpiracao) <= new Date()) {
      return res.status(400).json({ 
        success: false, 
        error: "O prazo para pagamento deste pedido expirou"
      });
    }

    await storage.clearOrderPixData(orderId);
    await storage.updateOrder(orderId, { metodoPagamento: null, idPagamentoGateway: null });

    return res.json({
      success: true,
      message: "Método de pagamento limpo. Você pode escolher um novo método."
    });
  } catch (error) {
    console.error("[payments] Erro ao trocar método:", error);
    return res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

router.get("/status/:orderId", async (req, res) => {
  try {
    const athleteId = (req.session as any)?.athleteId;
    if (!athleteId) {
      return res.status(401).json({ success: false, error: "Não autenticado" });
    }

    const { orderId } = req.params;
    const order = await storage.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ success: false, error: "Pedido não encontrado" });
    }

    if (order.compradorId !== athleteId) {
      return res.status(403).json({ success: false, error: "Acesso não autorizado" });
    }

    if (!order.idPagamentoGateway) {
      return res.json({
        success: true,
        data: {
          orderId: order.id,
          orderStatus: order.status,
          paymentCreated: false
        }
      });
    }

    if (!isConfigured()) {
      return res.json({
        success: true,
        data: {
          orderId: order.id,
          orderStatus: order.status,
          paymentCreated: true,
          paymentId: order.idPagamentoGateway
        }
      });
    }

    const result = await getPaymentStatus(order.idPagamentoGateway);

    if (result.success && result.status === "approved" && order.status === "pendente") {
      await storage.confirmOrderPayment(order.id, order.idPagamentoGateway);
    }

    return res.json({
      success: true,
      data: {
        orderId: order.id,
        orderStatus: order.status,
        paymentCreated: true,
        paymentId: order.idPagamentoGateway,
        paymentStatus: result.status,
        paymentStatusDetail: result.statusDetail
      }
    });
  } catch (error) {
    console.error("[payments] Erro ao consultar status:", error);
    return res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

router.post("/confirm-free", async (req, res) => {
  try {
    const athleteId = (req.session as any)?.athleteId;
    if (!athleteId) {
      return res.status(401).json({ success: false, error: "Não autenticado" });
    }

    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: "ID do pedido é obrigatório" });
    }

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Pedido não encontrado" });
    }

    if (order.compradorId !== athleteId) {
      return res.status(403).json({ success: false, error: "Acesso não autorizado" });
    }

    if (order.status !== "pendente") {
      return res.status(400).json({ 
        success: false, 
        error: order.status === "pago" 
          ? "Este pedido já foi confirmado" 
          : "Este pedido não está disponível para confirmação"
      });
    }

    const valorTotal = parseFloat(order.valorTotal);
    if (valorTotal > 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Este pedido requer pagamento. Utilize PIX ou cartão de crédito."
      });
    }

    if (order.dataExpiracao) {
      const expirationDate = new Date(order.dataExpiracao);
      if (new Date() >= expirationDate) {
        return res.status(400).json({ 
          success: false, 
          error: "Tempo de pagamento expirado. Por favor, faça uma nova inscrição.",
          errorCode: "ORDER_EXPIRED"
        });
      }
    }

    await storage.confirmOrderPayment(order.id, "FREE_ORDER");

    const registrations = await storage.getRegistrationsByOrder(order.id);

    return res.json({
      success: true,
      data: {
        orderId: order.id,
        status: "pago",
        message: "Inscrição confirmada com sucesso!",
        registrationId: registrations[0]?.id
      }
    });
  } catch (error) {
    console.error("[payments] Erro ao confirmar pedido gratuito:", error);
    return res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

export default router;
