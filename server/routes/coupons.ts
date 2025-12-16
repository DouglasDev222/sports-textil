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

export default router;
