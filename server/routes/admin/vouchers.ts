import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { storage } from "../../storage";
import { requireAuth, requireRole, checkEventOwnership } from "../../middleware/auth";
import { utcToBrazilLocal, localToBrazilUTC } from "../../utils/timezone";

const router = Router({ mergeParams: true });

function generateVoucherCode(length: number = 8): string {
  return crypto.randomBytes(length / 2).toString("hex").toUpperCase();
}

function formatVoucherBatchForResponse(batch: any) {
  return {
    ...batch,
    validFrom: utcToBrazilLocal(batch.validFrom),
    validUntil: utcToBrazilLocal(batch.validUntil),
    createdAt: utcToBrazilLocal(batch.createdAt),
  };
}

function formatVoucherForResponse(voucher: any) {
  return {
    ...voucher,
    validFrom: utcToBrazilLocal(voucher.validFrom),
    validUntil: utcToBrazilLocal(voucher.validUntil),
    createdAt: utcToBrazilLocal(voucher.createdAt),
  };
}

const batchCreateSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  quantidade: z.number().int().min(1).max(50000, "Maximo de 50.000 vouchers por lote"),
  validFrom: z.string().refine(val => !isNaN(Date.parse(val)), "Data de inicio invalida"),
  validUntil: z.string().refine(val => !isNaN(Date.parse(val)), "Data de termino invalida"),
  descricao: z.string().optional().nullable(),
});

const voucherCreateSchema = z.object({
  code: z.string().min(4, "Codigo deve ter pelo menos 4 caracteres").max(20, "Codigo deve ter no maximo 20 caracteres").optional(),
  validFrom: z.string().refine(val => !isNaN(Date.parse(val)), "Data de inicio invalida"),
  validUntil: z.string().refine(val => !isNaN(Date.parse(val)), "Data de termino invalida"),
});

router.get("/batches", requireAuth, async (req, res) => {
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

    const batches = await storage.getVoucherBatchesByEvent(eventId);
    res.json({ success: true, data: batches.map(formatVoucherBatchForResponse) });
  } catch (error) {
    console.error("Get voucher batches error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" }
    });
  }
});

router.post("/batches", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Evento nao encontrado" }
      });
    }

    const validation = batchCreateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: validation.error.errors[0].message }
      });
    }

    const userId = (req as any).user?.id;
    
    const batch = await storage.createVoucherBatch({
      eventId,
      nome: validation.data.nome,
      quantidade: validation.data.quantidade,
      validFrom: localToBrazilUTC(validation.data.validFrom),
      validUntil: localToBrazilUTC(validation.data.validUntil),
      descricao: validation.data.descricao,
      createdBy: userId,
    });

    const vouchers: any[] = [];
    const existingCodes = new Set<string>();
    
    for (let i = 0; i < validation.data.quantidade; i++) {
      let code: string;
      let attempts = 0;
      do {
        code = generateVoucherCode(8);
        attempts++;
        if (attempts > 100) {
          throw new Error("Falha ao gerar codigos unicos");
        }
      } while (existingCodes.has(code));
      
      existingCodes.add(code);
      vouchers.push({
        eventId,
        batchId: batch.id,
        code,
        validFrom: localToBrazilUTC(validation.data.validFrom),
        validUntil: localToBrazilUTC(validation.data.validUntil),
      });
    }

    await storage.createVouchersBulk(vouchers);

    res.status(201).json({ 
      success: true, 
      data: {
        batch: formatVoucherBatchForResponse(batch),
        vouchersCreated: vouchers.length
      }
    });
  } catch (error) {
    console.error("Create voucher batch error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" }
    });
  }
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

    const vouchers = await storage.getVouchersByEvent(eventId);
    
    const vouchersWithUsage = await Promise.all(
      vouchers.map(async (voucher) => {
        const usage = await storage.getVoucherUsage(voucher.id);
        return {
          ...formatVoucherForResponse(voucher),
          usage: usage ? {
            usedAt: utcToBrazilLocal(usage.usedAt),
            userId: usage.userId,
            registrationId: usage.registrationId,
          } : null,
        };
      })
    );

    res.json({ success: true, data: vouchersWithUsage });
  } catch (error) {
    console.error("Get vouchers error:", error);
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

    const validation = voucherCreateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: validation.error.errors[0].message }
      });
    }

    const code = validation.data.code || generateVoucherCode(8);
    
    const existingVoucher = await storage.getVoucherByCode(eventId, code);
    if (existingVoucher) {
      return res.status(400).json({
        success: false,
        error: { code: "DUPLICATE_CODE", message: "Codigo de voucher ja existe para este evento" }
      });
    }

    const voucher = await storage.createVoucher({
      eventId,
      code,
      validFrom: localToBrazilUTC(validation.data.validFrom),
      validUntil: localToBrazilUTC(validation.data.validUntil),
    });

    res.status(201).json({ success: true, data: formatVoucherForResponse(voucher) });
  } catch (error) {
    console.error("Create voucher error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" }
    });
  }
});

router.delete("/:voucherId", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const voucherId = req.params.voucherId;
    
    const voucher = await storage.getVoucher(voucherId);
    if (!voucher || voucher.eventId !== eventId) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Voucher nao encontrado" }
      });
    }

    if (voucher.status === "used") {
      return res.status(400).json({
        success: false,
        error: { code: "VOUCHER_USED", message: "Nao e possivel excluir voucher ja utilizado" }
      });
    }

    await storage.deleteVoucher(voucherId);
    res.json({ success: true, data: { message: "Voucher removido com sucesso" } });
  } catch (error) {
    console.error("Delete voucher error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" }
    });
  }
});

router.get("/report", requireAuth, async (req, res) => {
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

    const vouchers = await storage.getVouchersByEvent(eventId);
    const now = new Date();
    
    const report = {
      total: vouchers.length,
      available: vouchers.filter(v => v.status === "available" && new Date(v.validUntil) >= now).length,
      used: vouchers.filter(v => v.status === "used").length,
      expired: vouchers.filter(v => v.status === "expired" || (v.status === "available" && new Date(v.validUntil) < now)).length,
    };

    res.json({ success: true, data: report });
  } catch (error) {
    console.error("Get voucher report error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" }
    });
  }
});

export default router;
