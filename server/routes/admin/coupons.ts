import { Router } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { requireAuth, requireRole, checkEventOwnership } from "../../middleware/auth";
import { utcToBrazilLocal, localToBrazilUTC } from "../../utils/timezone";

const router = Router({ mergeParams: true });

function formatCouponForResponse(coupon: any) {
  return {
    ...coupon,
    validFrom: utcToBrazilLocal(coupon.validFrom),
    validUntil: utcToBrazilLocal(coupon.validUntil),
    createdAt: utcToBrazilLocal(coupon.createdAt),
  };
}

const couponCreateSchema = z.object({
  code: z.string().min(2, "Codigo deve ter pelo menos 2 caracteres").max(50, "Codigo deve ter no maximo 50 caracteres"),
  discountType: z.enum(["percentage", "fixed", "full"], { errorMap: () => ({ message: "Tipo de desconto invalido" }) }),
  discountValue: z.number().min(0, "Valor do desconto deve ser positivo").optional().nullable(),
  maxUses: z.number().int().min(1).optional().nullable(),
  maxUsesPerUser: z.number().int().min(1).default(1),
  validFrom: z.string().refine(val => !isNaN(Date.parse(val)), "Data de inicio invalida"),
  validUntil: z.string().refine(val => !isNaN(Date.parse(val)), "Data de termino invalida"),
  isActive: z.boolean().default(true),
});

const couponUpdateSchema = z.object({
  code: z.string().min(2).max(50).optional(),
  discountType: z.enum(["percentage", "fixed", "full"]).optional(),
  discountValue: z.number().min(0).optional().nullable(),
  maxUses: z.number().int().min(1).optional().nullable(),
  maxUsesPerUser: z.number().int().min(1).optional(),
  validFrom: z.string().refine(val => !isNaN(Date.parse(val)), "Data de inicio invalida").optional(),
  validUntil: z.string().refine(val => !isNaN(Date.parse(val)), "Data de termino invalida").optional(),
  isActive: z.boolean().optional(),
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Evento nao encontrado" }
      });
    }

    const hasAccess = await checkEventOwnership(req, res, eventId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Sem permissao para acessar este evento" }
      });
    }

    const coupons = await storage.getCouponsByEvent(eventId);
    res.json({ success: true, data: coupons.map(formatCouponForResponse) });
  } catch (error) {
    console.error("Get coupons error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" }
    });
  }
});

router.post("/", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Evento nao encontrado" }
      });
    }

    const validation = couponCreateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: validation.error.errors[0].message }
      });
    }

    if (validation.data.discountType === "percentage" && validation.data.discountValue) {
      if (validation.data.discountValue > 100) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Porcentagem de desconto nao pode exceder 100%" }
        });
      }
    }

    const uniqueCheck = await storage.isCodeGloballyUnique(eventId, validation.data.code);
    if (!uniqueCheck.isUnique) {
      return res.status(400).json({
        success: false,
        error: { 
          code: "DUPLICATE_CODE", 
          message: uniqueCheck.type === "voucher" 
            ? "Este codigo ja esta em uso como voucher" 
            : "Codigo de cupom ja existe para este evento" 
        }
      });
    }

    const coupon = await storage.createCoupon({
      eventId,
      code: validation.data.code,
      discountType: validation.data.discountType,
      discountValue: validation.data.discountValue?.toString(),
      maxUses: validation.data.maxUses,
      maxUsesPerUser: validation.data.maxUsesPerUser,
      validFrom: localToBrazilUTC(validation.data.validFrom),
      validUntil: localToBrazilUTC(validation.data.validUntil),
      isActive: validation.data.isActive,
    });

    res.status(201).json({ success: true, data: formatCouponForResponse(coupon) });
  } catch (error) {
    console.error("Create coupon error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" }
    });
  }
});

const bulkCouponCreateSchema = z.object({
  codes: z.array(z.string().min(2).max(50)).min(1, "Pelo menos um codigo e necessario"),
  discountType: z.enum(["percentage", "fixed", "full"]),
  discountValue: z.number().min(0).optional().nullable(),
  maxUses: z.number().int().min(1).optional().nullable(),
  maxUsesPerUser: z.number().int().min(1).default(1),
  validFrom: z.string().refine(val => !isNaN(Date.parse(val)), "Data de inicio invalida"),
  validUntil: z.string().refine(val => !isNaN(Date.parse(val)), "Data de termino invalida"),
  isActive: z.boolean().default(true),
});

router.post("/bulk", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Evento nao encontrado" }
      });
    }

    const validation = bulkCouponCreateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: validation.error.errors[0].message }
      });
    }

    if (validation.data.discountType === "percentage" && validation.data.discountValue) {
      if (validation.data.discountValue > 100) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Porcentagem de desconto nao pode exceder 100%" }
        });
      }
    }

    const codes = [...new Set(validation.data.codes.map(c => c.toUpperCase().trim()).filter(c => c.length >= 2))];
    
    const duplicates: string[] = [];
    const voucherConflicts: string[] = [];
    for (const code of codes) {
      const uniqueCheck = await storage.isCodeGloballyUnique(eventId, code);
      if (!uniqueCheck.isUnique) {
        if (uniqueCheck.type === "voucher") {
          voucherConflicts.push(code);
        } else {
          duplicates.push(code);
        }
      }
    }
    
    if (voucherConflicts.length > 0) {
      return res.status(400).json({
        success: false,
        error: { 
          code: "VOUCHER_CONFLICT", 
          message: `Codigos ja em uso como vouchers: ${voucherConflicts.slice(0, 5).join(", ")}${voucherConflicts.length > 5 ? ` e mais ${voucherConflicts.length - 5}` : ""}` 
        }
      });
    }
    
    if (duplicates.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: "DUPLICATE_CODES", message: `Codigos duplicados: ${duplicates.slice(0, 5).join(", ")}${duplicates.length > 5 ? ` e mais ${duplicates.length - 5}` : ""}` }
      });
    }

    const createdCoupons = [];
    for (const code of codes) {
      const coupon = await storage.createCoupon({
        eventId,
        code,
        discountType: validation.data.discountType,
        discountValue: validation.data.discountValue?.toString(),
        maxUses: validation.data.maxUses,
        maxUsesPerUser: validation.data.maxUsesPerUser,
        validFrom: localToBrazilUTC(validation.data.validFrom),
        validUntil: localToBrazilUTC(validation.data.validUntil),
        isActive: validation.data.isActive,
      });
      createdCoupons.push(coupon);
    }

    res.status(201).json({ 
      success: true, 
      data: { 
        created: createdCoupons.length,
        coupons: createdCoupons.map(formatCouponForResponse) 
      } 
    });
  } catch (error) {
    console.error("Bulk create coupons error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" }
    });
  }
});

router.patch("/:couponId", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const couponId = req.params.couponId;
    
    const coupon = await storage.getCoupon(couponId);
    if (!coupon || coupon.eventId !== eventId) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Cupom nao encontrado" }
      });
    }

    const validation = couponUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: validation.error.errors[0].message }
      });
    }

    if (validation.data.code && validation.data.code !== coupon.code) {
      const existingCoupon = await storage.getCouponByCode(eventId, validation.data.code);
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          error: { code: "DUPLICATE_CODE", message: "Codigo de cupom ja existe para este evento" }
        });
      }
    }

    const updateData: any = { ...validation.data };
    if (validation.data.validFrom) {
      updateData.validFrom = localToBrazilUTC(validation.data.validFrom);
    }
    if (validation.data.validUntil) {
      updateData.validUntil = localToBrazilUTC(validation.data.validUntil);
    }
    if (validation.data.discountValue !== undefined) {
      updateData.discountValue = validation.data.discountValue?.toString();
    }

    const updated = await storage.updateCoupon(couponId, updateData);
    res.json({ success: true, data: formatCouponForResponse(updated) });
  } catch (error) {
    console.error("Update coupon error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" }
    });
  }
});

router.delete("/:couponId", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const couponId = req.params.couponId;
    
    const coupon = await storage.getCoupon(couponId);
    if (!coupon || coupon.eventId !== eventId) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Cupom nao encontrado" }
      });
    }

    await storage.deleteCoupon(couponId);
    res.json({ success: true, data: { message: "Cupom removido com sucesso" } });
  } catch (error) {
    console.error("Delete coupon error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" }
    });
  }
});

export default router;
