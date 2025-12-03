import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";

const router = Router();

const createRegistrationSchema = z.object({
  eventId: z.string().uuid(),
  modalityId: z.string().uuid(),
  tamanhoCamisa: z.string().optional(),
  equipe: z.string().optional()
});

router.get("/events/:slug/registration-info", async (req, res) => {
  try {
    const { slug } = req.params;
    
    const event = await storage.getEventBySlug(slug);
    if (!event) {
      return res.status(404).json({ success: false, error: "Evento nao encontrado" });
    }

    if (event.status !== "publicado") {
      return res.status(400).json({ success: false, error: "Evento nao disponivel para inscricoes" });
    }

    const now = new Date();
    const abertura = new Date(event.aberturaInscricoes);
    const encerramento = new Date(event.encerramentoInscricoes);

    if (now < abertura) {
      return res.status(400).json({ 
        success: false, 
        error: "Inscricoes ainda nao abertas",
        aberturaInscricoes: event.aberturaInscricoes
      });
    }

    if (now > encerramento) {
      return res.status(400).json({ 
        success: false, 
        error: "Inscricoes encerradas" 
      });
    }

    const modalities = await storage.getModalitiesByEvent(event.id);
    const activeBatch = await storage.getActiveBatch(event.id);
    const allPrices = await storage.getPricesByEvent(event.id);
    const attachments = await storage.getAttachmentsByEvent(event.id);

    let shirtSizes;
    if (event.usarGradePorModalidade) {
      const allSizes: { modalityId: string; sizes: any[] }[] = [];
      for (const mod of modalities) {
        const sizes = await storage.getShirtSizesByModality(mod.id);
        allSizes.push({ 
          modalityId: mod.id, 
          sizes: sizes.map(s => ({
            id: s.id,
            tamanho: s.tamanho,
            disponivel: s.quantidadeDisponivel
          }))
        });
      }
      shirtSizes = { byModality: true, data: allSizes };
    } else {
      const sizes = await storage.getShirtSizesByEvent(event.id);
      shirtSizes = { 
        byModality: false, 
        data: sizes.map(s => ({
          id: s.id,
          tamanho: s.tamanho,
          disponivel: s.quantidadeDisponivel
        }))
      };
    }

    const currentRegistrations = await storage.getRegistrationsByEvent(event.id);
    const confirmedRegistrations = currentRegistrations.filter(r => r.status === "confirmada");
    const vagasRestantes = event.limiteVagasTotal - confirmedRegistrations.length;

    const modalitiesWithInfo = modalities.map(mod => {
      const modalityRegistrations = confirmedRegistrations.filter(r => r.modalityId === mod.id);
      const modalityPrice = allPrices.find(p => p.modalityId === mod.id && activeBatch && p.batchId === activeBatch.id);
      
      let vagasModalidade = null;
      if (mod.limiteVagas) {
        vagasModalidade = mod.limiteVagas - modalityRegistrations.length;
      }

      return {
        id: mod.id,
        nome: mod.nome,
        distancia: mod.distancia,
        unidadeDistancia: mod.unidadeDistancia,
        horarioLargada: mod.horarioLargada,
        descricao: mod.descricao,
        tipoAcesso: mod.tipoAcesso,
        preco: modalityPrice ? parseFloat(modalityPrice.valor) : 0,
        taxaComodidade: parseFloat(mod.taxaComodidade) || 0,
        limiteVagas: mod.limiteVagas,
        vagasDisponiveis: vagasModalidade,
        idadeMinima: mod.idadeMinima ?? event.idadeMinimaEvento,
        ordem: mod.ordem
      };
    }).sort((a, b) => a.ordem - b.ordem);

    res.json({
      success: true,
      data: {
        event: {
          id: event.id,
          nome: event.nome,
          slug: event.slug,
          descricao: event.descricao,
          dataEvento: event.dataEvento,
          endereco: event.endereco,
          cidade: event.cidade,
          estado: event.estado,
          limiteVagasTotal: event.limiteVagasTotal,
          vagasRestantes,
          entregaCamisaNoKit: event.entregaCamisaNoKit,
          idadeMinimaEvento: event.idadeMinimaEvento
        },
        modalities: modalitiesWithInfo,
        activeBatch: activeBatch ? {
          id: activeBatch.id,
          nome: activeBatch.nome,
          dataInicio: activeBatch.dataInicio,
          dataTermino: activeBatch.dataTermino
        } : null,
        shirtSizes,
        attachments: attachments.map(a => ({
          id: a.id,
          nome: a.nome,
          url: a.url,
          obrigatorioAceitar: a.obrigatorioAceitar
        }))
      }
    });
  } catch (error) {
    console.error("Erro ao buscar informacoes de inscricao:", error);
    res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

router.post("/", async (req, res) => {
  try {
    const sessionAthleteId = (req.session as any)?.athleteId;
    if (!sessionAthleteId) {
      return res.status(401).json({ success: false, error: "Nao autenticado" });
    }

    const parsed = createRegistrationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Dados invalidos",
        details: parsed.error.flatten() 
      });
    }

    const { eventId, modalityId, tamanhoCamisa, equipe } = parsed.data;
    const athleteId = sessionAthleteId;

    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: "Evento nao encontrado" });
    }

    if (event.status !== "publicado") {
      return res.status(400).json({ success: false, error: "Evento nao disponivel para inscricoes" });
    }

    const now = new Date();
    if (now < new Date(event.aberturaInscricoes) || now > new Date(event.encerramentoInscricoes)) {
      return res.status(400).json({ success: false, error: "Periodo de inscricoes encerrado" });
    }

    const modality = await storage.getModality(modalityId);
    if (!modality || modality.eventId !== eventId) {
      return res.status(404).json({ success: false, error: "Modalidade nao encontrada" });
    }

    const activeBatch = await storage.getActiveBatch(eventId);
    if (!activeBatch) {
      return res.status(400).json({ success: false, error: "Nenhum lote disponivel" });
    }

    const existingRegistrations = await storage.getRegistrationsByAthlete(athleteId);
    const duplicateRegistration = existingRegistrations.find(
      r => r.eventId === eventId && r.modalityId === modalityId && r.status === "confirmada"
    );
    if (duplicateRegistration) {
      return res.status(409).json({ 
        success: false, 
        error: "Voce ja possui inscricao confirmada nesta modalidade" 
      });
    }

    const price = await storage.getPrice(modalityId, activeBatch.id);
    const valorInscricao = price ? parseFloat(price.valor) : 0;
    const taxaComodidade = parseFloat(modality.taxaComodidade) || 0;
    const valorTotal = valorInscricao + taxaComodidade;

    const isGratuita = modality.tipoAcesso === "gratuita" || valorTotal === 0;

    const orderNumber = await storage.getNextOrderNumber();
    const order = await storage.createOrder({
      numeroPedido: orderNumber,
      eventId,
      compradorId: athleteId,
      valorTotal: valorTotal.toString(),
      valorDesconto: "0",
      status: isGratuita ? "pago" : "pendente",
      metodoPagamento: isGratuita ? "gratuito" : null,
      ipComprador: req.ip || null
    });

    const registrationNumber = await storage.getNextRegistrationNumber();
    const registration = await storage.createRegistration({
      numeroInscricao: registrationNumber,
      orderId: order.id,
      eventId,
      modalityId,
      batchId: activeBatch.id,
      athleteId,
      tamanhoCamisa: tamanhoCamisa || null,
      valorUnitario: valorInscricao.toString(),
      taxaComodidade: taxaComodidade.toString(),
      status: isGratuita ? "confirmada" : "pendente",
      equipe: equipe || null
    });

    res.status(201).json({
      success: true,
      data: {
        order: {
          id: order.id,
          numeroPedido: order.numeroPedido,
          valorTotal: parseFloat(order.valorTotal),
          status: order.status
        },
        registration: {
          id: registration.id,
          numeroInscricao: registration.numeroInscricao,
          modalidade: modality.nome,
          tamanhoCamisa: registration.tamanhoCamisa,
          status: registration.status
        },
        evento: {
          nome: event.nome,
          dataEvento: event.dataEvento,
          endereco: event.endereco,
          cidade: event.cidade,
          estado: event.estado
        }
      }
    });

  } catch (error: any) {
    console.error("Erro ao criar inscricao:", error);
    
    if (error.message?.includes("Lote esgotado")) {
      return res.status(400).json({ success: false, error: "Lote esgotado" });
    }
    if (error.message?.includes("Idade minima")) {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (error.message?.includes("esgotado") || error.message?.includes("nao disponivel")) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

router.get("/orders/:orderId", async (req, res) => {
  try {
    const athleteId = (req.session as any)?.athleteId;
    if (!athleteId) {
      return res.status(401).json({ success: false, error: "Nao autenticado" });
    }

    const { orderId } = req.params;
    const order = await storage.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, error: "Pedido nao encontrado" });
    }

    if (order.compradorId !== athleteId) {
      return res.status(403).json({ success: false, error: "Acesso nao autorizado" });
    }

    const event = await storage.getEvent(order.eventId);
    const registrations = await storage.getRegistrationsByOrder(orderId);
    
    const registrationsWithDetails = await Promise.all(
      registrations.map(async (reg) => {
        const modality = await storage.getModality(reg.modalityId);
        return {
          id: reg.id,
          numeroInscricao: reg.numeroInscricao,
          tamanhoCamisa: reg.tamanhoCamisa,
          equipe: reg.equipe,
          valorUnitario: parseFloat(reg.valorUnitario),
          taxaComodidade: parseFloat(reg.taxaComodidade),
          modalidade: modality ? {
            id: modality.id,
            nome: modality.nome,
            distancia: modality.distancia,
            unidadeDistancia: modality.unidadeDistancia,
            tipoAcesso: modality.tipoAcesso
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: {
        order: {
          id: order.id,
          numeroPedido: order.numeroPedido,
          valorTotal: parseFloat(order.valorTotal),
          valorDesconto: parseFloat(order.valorDesconto),
          status: order.status,
          metodoPagamento: order.metodoPagamento,
          codigoVoucher: order.codigoVoucher
        },
        evento: event ? {
          id: event.id,
          nome: event.nome,
          slug: event.slug,
          dataEvento: event.dataEvento,
          cidade: event.cidade,
          estado: event.estado
        } : null,
        registrations: registrationsWithDetails
      }
    });
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

router.get("/my-registrations", async (req, res) => {
  try {
    const athleteId = (req.session as any)?.athleteId;
    if (!athleteId) {
      return res.status(401).json({ success: false, error: "Nao autenticado" });
    }

    const registrations = await storage.getRegistrationsByAthlete(athleteId);
    
    const registrationsWithDetails = await Promise.all(
      registrations.map(async (reg) => {
        const event = await storage.getEvent(reg.eventId);
        const modality = await storage.getModality(reg.modalityId);
        const order = await storage.getOrder(reg.orderId);
        
        return {
          id: reg.id,
          numeroInscricao: reg.numeroInscricao,
          status: reg.status,
          tamanhoCamisa: reg.tamanhoCamisa,
          equipe: reg.equipe,
          dataInscricao: reg.dataInscricao,
          valorPago: parseFloat(reg.valorUnitario) + parseFloat(reg.taxaComodidade),
          evento: event ? {
            id: event.id,
            nome: event.nome,
            slug: event.slug,
            dataEvento: event.dataEvento,
            cidade: event.cidade,
            estado: event.estado
          } : null,
          modalidade: modality ? {
            id: modality.id,
            nome: modality.nome,
            distancia: modality.distancia,
            unidadeDistancia: modality.unidadeDistancia
          } : null,
          pedido: order ? {
            numeroPedido: order.numeroPedido,
            status: order.status
          } : null
        };
      })
    );

    res.json({ success: true, data: registrationsWithDetails });
  } catch (error) {
    console.error("Erro ao buscar inscricoes:", error);
    res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

export default router;
