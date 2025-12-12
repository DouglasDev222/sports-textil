import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { createPixPayment, createCardPayment, getPaymentStatus, isConfigured } from "../services/mercadopago-service";

const router = Router();

const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  paymentMethod: z.enum(["pix", "credit_card"]),
  cardToken: z.string().optional(),
  installments: z.number().min(1).max(12).optional().default(1),
  paymentMethodId: z.string().optional(),
  issuerId: z.string().optional()
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

    const { orderId, paymentMethod, cardToken, installments, paymentMethodId, issuerId } = parsed.data;

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

      return res.json({
        success: true,
        data: {
          paymentId: result.paymentId,
          status: result.status,
          qrCode: result.qrCode,
          qrCodeBase64: result.qrCodeBase64,
          expirationDate: result.expirationDate,
          orderId: order.id,
          dataExpiracao: order.dataExpiracao
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
        externalReference
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

export default router;
