import { sql } from "drizzle-orm";
import { pgTable, text, varchar, date, integer } from "drizzle-orm/pg-core";
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
  slug: text("slug").notNull().unique(),
  nome: text("nome").notNull(),
  descricao: text("descricao").notNull(),
  data: date("data").notNull(),
  local: text("local").notNull(),
  cidade: text("cidade").notNull(),
  estado: varchar("estado", { length: 2 }).notNull(),
  distancias: text("distancias").notNull(),
  horariosLargada: text("horarios_largada").notNull(),
  imagemUrl: text("imagem_url").notNull(),
  valor: text("valor").notNull(),
  retiradaKit: text("retirada_kit"),
  regulamentoUrl: text("regulamento_url"),
  documentos: text("documentos"),
});

export const pedidos = pgTable("pedidos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numeroPedido: integer("numero_pedido").notNull().unique(),
  usuarioId: varchar("usuario_id").notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  valorTotal: text("valor_total").notNull(),
  cupomDesconto: text("cupom_desconto"),
  valorDesconto: text("valor_desconto"),
  dataPedido: date("data_pedido").notNull(),
});

export const inscricoes = pgTable("inscricoes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numeroInscricao: integer("numero_inscricao").notNull().unique(),
  pedidoId: varchar("pedido_id").notNull(),
  atletaId: varchar("atleta_id").notNull(),
  eventoId: varchar("evento_id").notNull(),
  modalidade: text("modalidade").notNull(),
  tamanhoCamisa: varchar("tamanho_camisa", { length: 10 }).notNull(),
  equipe: text("equipe"),
  codigoComprovacao: text("codigo_comprovacao"),
  valorOriginal: text("valor_original").notNull(),
  valorPago: text("valor_pago").notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  dataInscricao: date("data_inscricao").notNull(),
});

export const insertAthleteSchema = createInsertSchema(athletes).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertPedidoSchema = createInsertSchema(pedidos).omit({ id: true });
export const insertInscricaoSchema = createInsertSchema(inscricoes).omit({ id: true });

export type InsertAthlete = z.infer<typeof insertAthleteSchema>;
export type Athlete = typeof athletes.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertPedido = z.infer<typeof insertPedidoSchema>;
export type Pedido = typeof pedidos.$inferSelect;

export type InsertInscricao = z.infer<typeof insertInscricaoSchema>;
export type Inscricao = typeof inscricoes.$inferSelect;
