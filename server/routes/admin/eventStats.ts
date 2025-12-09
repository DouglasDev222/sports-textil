import { Router } from "express";
import { storage } from "../../storage";
import { requireAuth, checkEventOwnership } from "../../middleware/auth";

const router = Router({ mergeParams: true });

router.get("/:eventId/stats", requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Evento nao encontrado" }
      });
    }

    const hasAccess = await checkEventOwnership(req, res, eventId, event);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Sem permissao para acessar este evento" }
      });
    }

    const [registrations, modalities, orders, batches, shirtSizes] = await Promise.all([
      storage.getRegistrationsByEvent(eventId),
      storage.getModalitiesByEvent(eventId),
      storage.getOrdersByEvent(eventId),
      storage.getBatchesByEvent(eventId),
      storage.getShirtSizesByEvent(eventId)
    ]);

    const confirmedRegistrations = registrations.filter(r => r.status === "confirmada");
    const pendingRegistrations = registrations.filter(r => r.status === "pendente");

    const byModality = modalities.map(mod => {
      const modRegistrations = confirmedRegistrations.filter(r => r.modalityId === mod.id);
      return {
        modalityId: mod.id,
        modalityName: mod.nome,
        total: modRegistrations.length,
        masculino: modRegistrations.filter(r => r.sexo === "masculino").length,
        feminino: modRegistrations.filter(r => r.sexo === "feminino").length,
      };
    });

    const paidOrders = orders.filter(o => o.status === "pago");
    const totalFaturamento = paidOrders.reduce((sum, o) => sum + parseFloat(o.valorTotal), 0);
    const totalDescontos = paidOrders.reduce((sum, o) => sum + parseFloat(o.valorDesconto), 0);
    const totalTaxaComodidade = confirmedRegistrations.reduce((sum, r) => sum + parseFloat(r.taxaComodidade), 0);

    const shirtSizeConsumo = confirmedRegistrations.reduce((acc, reg) => {
      if (reg.tamanhoCamisa) {
        acc[reg.tamanhoCamisa] = (acc[reg.tamanhoCamisa] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const shirtGrid = shirtSizes.map(size => ({
      id: size.id,
      tamanho: size.tamanho,
      quantidadeTotal: size.quantidadeTotal,
      quantidadeDisponivel: size.quantidadeDisponivel,
      consumo: shirtSizeConsumo[size.tamanho] || 0
    }));

    const now = new Date();
    const activeBatch = batches.find(b => 
      b.ativo && 
      new Date(b.dataInicio) <= now &&
      (!b.dataTermino || new Date(b.dataTermino) > now) &&
      (!b.quantidadeMaxima || b.quantidadeUtilizada < b.quantidadeMaxima)
    );

    const batchesInfo = batches.map(batch => ({
      id: batch.id,
      nome: batch.nome,
      dataInicio: batch.dataInicio,
      dataTermino: batch.dataTermino,
      quantidadeMaxima: batch.quantidadeMaxima,
      quantidadeUtilizada: batch.quantidadeUtilizada,
      ativo: batch.ativo,
      isVigente: activeBatch?.id === batch.id
    }));

    res.json({
      success: true,
      data: {
        totalInscritos: confirmedRegistrations.length,
        totalPendentes: pendingRegistrations.length,
        masculino: confirmedRegistrations.filter(r => r.sexo === "masculino").length,
        feminino: confirmedRegistrations.filter(r => r.sexo === "feminino").length,
        byModality,
        faturamento: {
          total: totalFaturamento,
          descontos: totalDescontos,
          taxaComodidade: totalTaxaComodidade,
          liquido: totalFaturamento - totalDescontos
        },
        vagas: {
          total: event.limiteVagasTotal,
          ocupadas: event.vagasOcupadas,
          disponiveis: event.limiteVagasTotal - event.vagasOcupadas
        },
        shirtGrid,
        batches: batchesInfo,
        activeBatchId: activeBatch?.id || null
      }
    });
  } catch (error) {
    console.error("Get event stats error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" }
    });
  }
});

router.get("/:eventId/registrations", requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Evento nao encontrado" }
      });
    }

    const hasAccess = await checkEventOwnership(req, res, eventId, event);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Sem permissao para acessar este evento" }
      });
    }

    const [registrations, modalities, athletes] = await Promise.all([
      storage.getRegistrationsByEvent(eventId),
      storage.getModalitiesByEvent(eventId),
      Promise.resolve([])
    ]);

    const modalityMap = new Map(modalities.map(m => [m.id, m]));

    const athleteIds = Array.from(new Set(registrations.map(r => r.athleteId)));
    const athletesData = await Promise.all(athleteIds.map(id => storage.getAthlete(id)));
    const athleteMap = new Map(athletesData.filter(Boolean).map(a => [a!.id, a!]));

    const enrichedRegistrations = registrations.map(reg => {
      const modality = modalityMap.get(reg.modalityId);
      const athlete = athleteMap.get(reg.athleteId);
      
      return {
        ...reg,
        modalityName: modality?.nome || "N/A",
        athleteName: reg.nomeCompleto || athlete?.nome || "N/A",
        athleteEmail: athlete?.email || "N/A",
        athletePhone: athlete?.telefone || "N/A",
      };
    });

    res.json({
      success: true,
      data: enrichedRegistrations
    });
  } catch (error) {
    console.error("Get event registrations error:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" }
    });
  }
});

export default router;
