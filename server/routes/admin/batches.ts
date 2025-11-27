import { Router } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { requireAuth, requireRole, checkEventOwnership } from "../../middleware/auth";
import { localToBrazilUTC, localToBrazilUTCOptional, utcToBrazilLocal } from "../../utils/timezone";

const router = Router({ mergeParams: true });

function formatBatchForResponse(batch: any) {
  return {
    ...batch,
    dataInicio: utcToBrazilLocal(batch.dataInicio),
    dataTermino: batch.dataTermino ? utcToBrazilLocal(batch.dataTermino) : null,
  };
}

const batchSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  dataInicio: z.string().refine(val => !isNaN(Date.parse(val)), "Data de inicio invalida"),
  dataTermino: z.string().refine(val => !isNaN(Date.parse(val)), "Data de termino invalida").optional().nullable(),
  quantidadeMaxima: z.number().int().positive().optional().nullable(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().optional()
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

    const batches = await storage.getBatchesByEvent(eventId);
    res.json({ success: true, data: batches.map(formatBatchForResponse) });
  } catch (error) {
    console.error("Get batches error:", error);
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

    const validation = batchSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: validation.error.errors[0].message }
      });
    }

    const currentBatches = await storage.getBatchesByEvent(eventId);
    const nextOrder = currentBatches.length > 0 
      ? Math.max(...currentBatches.map(b => b.ordem)) + 1 
      : 0;

    const batch = await storage.createBatch({
      ...validation.data,
      eventId,
      dataInicio: localToBrazilUTC(validation.data.dataInicio),
      dataTermino: localToBrazilUTCOptional(validation.data.dataTermino),
      ativo: validation.data.ativo ?? true,
      ordem: validation.data.ordem ?? nextOrder
    });

    res.status(201).json({ success: true, data: formatBatchForResponse(batch) });
  } catch (error) {
    console.error("Create batch error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" }
    });
  }
});

router.patch("/:id", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Evento nao encontrado" }
      });
    }

    const batch = await storage.getBatch(req.params.id);
    if (!batch || batch.eventId !== eventId) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Lote nao encontrado" }
      });
    }

    const updateSchema = batchSchema.partial();
    const validation = updateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: validation.error.errors[0].message }
      });
    }

    const updateData: Record<string, unknown> = { ...validation.data };
    if (validation.data.dataInicio) {
      updateData.dataInicio = localToBrazilUTC(validation.data.dataInicio);
    }
    if (validation.data.dataTermino !== undefined) {
      updateData.dataTermino = localToBrazilUTCOptional(validation.data.dataTermino);
    }

    const updated = await storage.updateBatch(req.params.id, updateData);
    res.json({ success: true, data: formatBatchForResponse(updated) });
  } catch (error) {
    console.error("Update batch error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" }
    });
  }
});

router.delete("/:id", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Evento nao encontrado" }
      });
    }

    const batch = await storage.getBatch(req.params.id);
    if (!batch || batch.eventId !== eventId) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Lote nao encontrado" }
      });
    }

    if (batch.quantidadeUtilizada > 0) {
      return res.status(400).json({
        success: false,
        error: { code: "HAS_REGISTRATIONS", message: "Lote possui inscricoes e nao pode ser excluido" }
      });
    }

    await storage.deleteBatch(req.params.id);
    res.json({ success: true, data: { message: "Lote removido com sucesso" } });
  } catch (error) {
    console.error("Delete batch error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" }
    });
  }
});

export default router;
