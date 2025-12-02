import { Router } from "express";
import { storage } from "../storage";
import { insertAthleteSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

const loginSchema = z.object({
  cpf: z.string().min(11).max(14),
  dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
});

const registerSchema = insertAthleteSchema.extend({
  cpf: z.string().min(11).max(14),
  dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
});

router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Dados invalidos",
        details: parsed.error.flatten() 
      });
    }

    const { cpf, dataNascimento } = parsed.data;
    
    const athlete = await storage.getAthleteByCpf(cpf);
    
    if (!athlete) {
      return res.status(404).json({ 
        success: false, 
        error: "Atleta nao encontrado. Verifique o CPF ou faca seu cadastro." 
      });
    }

    const athleteBirthDate = new Date(athlete.dataNascimento).toISOString().split('T')[0];
    if (athleteBirthDate !== dataNascimento) {
      return res.status(401).json({ 
        success: false, 
        error: "Data de nascimento incorreta" 
      });
    }

    (req.session as any).athleteId = athlete.id;

    res.json({ 
      success: true, 
      data: {
        id: athlete.id,
        nome: athlete.nome,
        cpf: athlete.cpf,
        email: athlete.email,
        telefone: athlete.telefone,
        cidade: athlete.cidade,
        estado: athlete.estado,
        dataNascimento: athlete.dataNascimento,
        sexo: athlete.sexo
      }
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Dados invalidos",
        details: parsed.error.flatten() 
      });
    }

    const existingAthlete = await storage.getAthleteByCpf(parsed.data.cpf);
    if (existingAthlete) {
      return res.status(409).json({ 
        success: false, 
        error: "CPF ja cadastrado. Faca login com suas credenciais." 
      });
    }

    const athlete = await storage.createAthlete(parsed.data);
    
    (req.session as any).athleteId = athlete.id;

    res.status(201).json({ 
      success: true, 
      data: {
        id: athlete.id,
        nome: athlete.nome,
        cpf: athlete.cpf,
        email: athlete.email,
        telefone: athlete.telefone,
        cidade: athlete.cidade,
        estado: athlete.estado,
        dataNascimento: athlete.dataNascimento,
        sexo: athlete.sexo
      }
    });
  } catch (error) {
    console.error("Erro ao cadastrar atleta:", error);
    res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const athleteId = (req.session as any)?.athleteId;
    
    if (!athleteId) {
      return res.status(401).json({ 
        success: false, 
        error: "Nao autenticado" 
      });
    }

    const athlete = await storage.getAthlete(athleteId);
    
    if (!athlete) {
      return res.status(404).json({ 
        success: false, 
        error: "Atleta nao encontrado" 
      });
    }

    res.json({ 
      success: true, 
      data: {
        id: athlete.id,
        nome: athlete.nome,
        cpf: athlete.cpf,
        email: athlete.email,
        telefone: athlete.telefone,
        cidade: athlete.cidade,
        estado: athlete.estado,
        dataNascimento: athlete.dataNascimento,
        sexo: athlete.sexo
      }
    });
  } catch (error) {
    console.error("Erro ao buscar dados do atleta:", error);
    res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

router.post("/logout", (req, res) => {
  (req.session as any).athleteId = null;
  res.json({ success: true });
});

export default router;
