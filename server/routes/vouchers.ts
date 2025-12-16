import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";

const router = Router();

const validateVoucherSchema = z.object({
  code: z.string().min(1, "Codigo do voucher e obrigatorio"),
  eventId: z.string().min(1, "ID do evento e obrigatorio"),
});

router.post("/validate", async (req, res) => {
  try {
    const validation = validateVoucherSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        valid: false,
        error: "validation_error",
        message: validation.error.errors[0].message
      });
    }

    const { code, eventId } = validation.data;
    
    const voucher = await storage.getVoucherByCode(eventId, code);
    
    if (!voucher) {
      return res.status(400).json({
        valid: false,
        error: "voucher_not_found",
        message: "Voucher nao encontrado para este evento"
      });
    }

    const now = new Date();
    
    if (new Date(voucher.validFrom) > now) {
      return res.status(400).json({
        valid: false,
        error: "voucher_not_valid_yet",
        message: "Este voucher ainda nao esta valido"
      });
    }

    if (new Date(voucher.validUntil) < now) {
      return res.status(400).json({
        valid: false,
        error: "voucher_expired",
        message: "Este voucher expirou"
      });
    }

    if (voucher.status === "used") {
      return res.status(400).json({
        valid: false,
        error: "voucher_already_used",
        message: "Este voucher ja foi utilizado"
      });
    }

    if (voucher.status === "expired") {
      return res.status(400).json({
        valid: false,
        error: "voucher_expired",
        message: "Este voucher expirou"
      });
    }

    let batchName = null;
    if (voucher.batchId) {
      const batch = await storage.getVoucherBatch(voucher.batchId);
      batchName = batch?.nome;
    }

    res.json({
      valid: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        batchName,
        validUntil: voucher.validUntil,
      }
    });
  } catch (error) {
    console.error("Validate voucher error:", error);
    res.status(500).json({
      valid: false,
      error: "internal_error",
      message: "Erro interno do servidor"
    });
  }
});

export default router;
