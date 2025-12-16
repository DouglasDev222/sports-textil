import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";

const router = Router();

const validateCouponSchema = z.object({
  code: z.string().min(1, "Codigo do cupom e obrigatorio"),
  eventId: z.string().min(1, "ID do evento e obrigatorio"),
  userId: z.string().min(1, "ID do usuario e obrigatorio"),
  orderValue: z.number().min(0, "Valor do pedido deve ser positivo"),
});

router.post("/validate", async (req, res) => {
  try {
    const validation = validateCouponSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        valid: false,
        error: "validation_error",
        message: validation.error.errors[0].message
      });
    }

    const { code, eventId, userId, orderValue } = validation.data;
    
    const coupon = await storage.getCouponByCode(eventId, code);
    
    if (!coupon) {
      return res.status(400).json({
        valid: false,
        error: "coupon_not_found",
        message: "Cupom nao encontrado para este evento"
      });
    }

    if (!coupon.isActive) {
      return res.status(400).json({
        valid: false,
        error: "coupon_inactive",
        message: "Este cupom esta inativo"
      });
    }

    const now = new Date();
    
    if (new Date(coupon.validFrom) > now) {
      return res.status(400).json({
        valid: false,
        error: "coupon_not_valid_yet",
        message: "Este cupom ainda nao esta valido"
      });
    }

    if (new Date(coupon.validUntil) < now) {
      return res.status(400).json({
        valid: false,
        error: "coupon_expired",
        message: "Este cupom expirou"
      });
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return res.status(400).json({
        valid: false,
        error: "coupon_max_uses_reached",
        message: "Este cupom atingiu o limite maximo de usos"
      });
    }

    const userUsages = await storage.getCouponUsagesByUser(coupon.id, userId);
    if (userUsages.length >= coupon.maxUsesPerUser) {
      return res.status(400).json({
        valid: false,
        error: "coupon_max_uses_per_user_reached",
        message: "Voce ja utilizou este cupom o numero maximo de vezes permitido"
      });
    }

    let discountAmount = 0;
    switch (coupon.discountType) {
      case "percentage":
        discountAmount = orderValue * (parseFloat(coupon.discountValue || "0") / 100);
        break;
      case "fixed":
        discountAmount = parseFloat(coupon.discountValue || "0");
        break;
      case "full":
        discountAmount = orderValue;
        break;
    }

    discountAmount = Math.min(discountAmount, orderValue);

    res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discountAmount.toFixed(2),
        finalValue: (orderValue - discountAmount).toFixed(2),
      }
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    res.status(500).json({
      valid: false,
      error: "internal_error",
      message: "Erro interno do servidor"
    });
  }
});

const applyCouponSchema = z.object({
  orderId: z.string().uuid("ID do pedido invalido"),
  couponCode: z.string().min(1, "Codigo do cupom e obrigatorio"),
});

router.post("/apply", async (req, res) => {
  try {
    const athleteId = (req.session as any)?.athleteId;
    if (!athleteId) {
      return res.status(401).json({ success: false, error: "Nao autenticado" });
    }

    const validation = applyCouponSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "validation_error",
        message: validation.error.errors[0].message
      });
    }

    const { orderId, couponCode } = validation.data;

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Pedido nao encontrado" });
    }

    if (order.compradorId !== athleteId) {
      return res.status(403).json({ success: false, error: "Acesso nao autorizado" });
    }

    if (order.status !== "pendente") {
      return res.status(400).json({
        success: false,
        error: "Cupom so pode ser aplicado em pedidos pendentes"
      });
    }

    const coupon = await storage.getCouponByCode(order.eventId, couponCode.toUpperCase());
    if (!coupon) {
      return res.status(400).json({
        success: false,
        error: "Cupom nao encontrado para este evento"
      });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ success: false, error: "Cupom inativo" });
    }

    const now = new Date();
    if (new Date(coupon.validFrom) > now) {
      return res.status(400).json({ success: false, error: "Cupom ainda nao esta valido" });
    }
    if (new Date(coupon.validUntil) < now) {
      return res.status(400).json({ success: false, error: "Cupom expirado" });
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return res.status(400).json({ success: false, error: "Cupom atingiu limite de usos" });
    }

    const userUsages = await storage.getCouponUsagesByUser(coupon.id, athleteId);
    if (userUsages.length >= coupon.maxUsesPerUser) {
      return res.status(400).json({
        success: false,
        error: "Voce ja utilizou este cupom o numero maximo de vezes"
      });
    }

    const valorOriginal = parseFloat(order.valorTotal);
    let discountAmount = 0;

    switch (coupon.discountType) {
      case "percentage":
        discountAmount = valorOriginal * (parseFloat(coupon.discountValue || "0") / 100);
        break;
      case "fixed":
        discountAmount = parseFloat(coupon.discountValue || "0");
        break;
      case "full":
        discountAmount = valorOriginal;
        break;
    }

    discountAmount = Math.min(discountAmount, valorOriginal);
    const valorFinal = valorOriginal - discountAmount;

    await storage.updateOrder(orderId, {
      valorDesconto: discountAmount.toFixed(2),
      valorTotal: valorFinal.toFixed(2),
      codigoCupom: coupon.code,
    });

    await storage.incrementCouponUsage(coupon.id);
    await storage.createCouponUsage({
      couponId: coupon.id,
      userId: athleteId,
      orderId: orderId,
    });

    res.json({
      success: true,
      data: {
        couponCode: coupon.code,
        discountAmount: discountAmount.toFixed(2),
        valorOriginal: valorOriginal.toFixed(2),
        valorFinal: valorFinal.toFixed(2),
      }
    });
  } catch (error) {
    console.error("Apply coupon error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

router.post("/remove", async (req, res) => {
  try {
    const athleteId = (req.session as any)?.athleteId;
    if (!athleteId) {
      return res.status(401).json({ success: false, error: "Nao autenticado" });
    }

    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: "orderId e obrigatorio" });
    }

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Pedido nao encontrado" });
    }

    if (order.compradorId !== athleteId) {
      return res.status(403).json({ success: false, error: "Acesso nao autorizado" });
    }

    if (order.status !== "pendente") {
      return res.status(400).json({
        success: false,
        error: "Cupom so pode ser removido de pedidos pendentes"
      });
    }

    if (!order.codigoCupom) {
      return res.status(400).json({
        success: false,
        error: "Nenhum cupom aplicado neste pedido"
      });
    }

    const registrations = await storage.getRegistrationsByOrder(orderId);
    let valorOriginal = 0;
    for (const reg of registrations) {
      valorOriginal += parseFloat(reg.valorUnitario) + parseFloat(reg.taxaComodidade || "0");
    }

    await storage.updateOrder(orderId, {
      valorDesconto: "0",
      valorTotal: valorOriginal.toFixed(2),
      codigoCupom: null,
    });

    res.json({
      success: true,
      data: {
        valorTotal: valorOriginal.toFixed(2),
      }
    });
  } catch (error) {
    console.error("Remove coupon error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

export default router;
