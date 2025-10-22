import { sql } from "drizzle-orm";
import { pgTable, text, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const athletes = pgTable("athletes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cpf: varchar("cpf", { length: 14 }).notNull().unique(),
  nome: text("nome").notNull(),
  dataNascimento: date("data_nascimento").notNull(),
  sexo: varchar("sexo", { length: 20 }).notNull(),
  email: text("email").notNull(),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  estado: varchar("estado", { length: 2 }).notNull(),
  cidade: text("cidade").notNull(),
  escolaridade: text("escolaridade").notNull(),
  profissao: text("profissao").notNull(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  descricao: text("descricao").notNull(),
  data: date("data").notNull(),
  local: text("local").notNull(),
  cidade: text("cidade").notNull(),
  estado: varchar("estado", { length: 2 }).notNull(),
  distancias: text("distancias").notNull(),
  imagemUrl: text("imagem_url").notNull(),
  valor: text("valor").notNull(),
  vagasDisponiveis: text("vagas_disponiveis").notNull(),
});

export const inscricoes = pgTable("inscricoes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  atletaId: varchar("atleta_id").notNull(),
  eventoId: varchar("evento_id").notNull(),
  distancia: text("distancia").notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  dataInscricao: date("data_inscricao").notNull(),
});

export const insertAthleteSchema = createInsertSchema(athletes).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertInscricaoSchema = createInsertSchema(inscricoes).omit({ id: true });

export type InsertAthlete = z.infer<typeof insertAthleteSchema>;
export type Athlete = typeof athletes.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertInscricao = z.infer<typeof insertInscricaoSchema>;
export type Inscricao = typeof inscricoes.$inferSelect;
