import { sql } from "drizzle-orm";
import { pgTable, text, varchar, date, integer, timestamp, boolean, decimal, pgEnum, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const eventStatusEnum = pgEnum("event_status", ["rascunho", "publicado", "cancelado", "finalizado"]);
export const modalityAccessEnum = pgEnum("modality_access", ["gratuita", "paga", "voucher", "pcd", "aprovacao_manual"]);
export const registrationStatusEnum = pgEnum("registration_status", ["pendente", "confirmada", "cancelada", "no_show"]);
export const orderStatusEnum = pgEnum("order_status", ["pendente", "pago", "cancelado", "reembolsado", "expirado"]);
export const userRoleEnum = pgEnum("user_role", ["superadmin", "admin", "organizador"]);
export const userStatusEnum = pgEnum("user_status", ["ativo", "inativo", "bloqueado"]);
export const batchStatusEnum = pgEnum("batch_status", ["active", "closed", "future"]);

export const organizers = pgTable("organizers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  cpfCnpj: varchar("cpf_cnpj", { length: 20 }).notNull().unique(),
  email: text("email").notNull(),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  dataCadastro: timestamp("data_cadastro", { withTimezone: true }).defaultNow().notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nome: text("nome").notNull(),
  role: userRoleEnum("role").notNull(),
  status: userStatusEnum("status").default("ativo").notNull(),
  organizerId: varchar("organizer_id").references(() => organizers.id),
  ultimoLogin: timestamp("ultimo_login", { withTimezone: true }),
  dataCriacao: timestamp("data_criacao", { withTimezone: true }).defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao", { withTimezone: true }).defaultNow().notNull(),
});

export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codigo: varchar("codigo", { length: 100 }).notNull().unique(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  modulo: varchar("modulo", { length: 50 }).notNull(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: userRoleEnum("role").notNull(),
  permissionId: varchar("permission_id").notNull().references(() => permissions.id),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizerId: varchar("organizer_id").notNull().references(() => organizers.id),
  slug: text("slug").notNull().unique(),
  nome: text("nome").notNull(),
  descricao: text("descricao").notNull(),
  dataEvento: date("data_evento").notNull(),
  endereco: text("endereco").notNull(),
  cidade: text("cidade").notNull(),
  estado: varchar("estado", { length: 2 }).notNull(),
  bannerUrl: text("banner_url"),
  aberturaInscricoes: timestamp("abertura_inscricoes", { withTimezone: true }).notNull(),
  encerramentoInscricoes: timestamp("encerramento_inscricoes", { withTimezone: true }).notNull(),
  limiteVagasTotal: integer("limite_vagas_total").notNull(),
  vagasOcupadas: integer("vagas_ocupadas").default(0).notNull(),
  status: eventStatusEnum("status").default("rascunho").notNull(),
  entregaCamisaNoKit: boolean("entrega_camisa_no_kit").default(true).notNull(),
  usarGradePorModalidade: boolean("usar_grade_por_modalidade").default(false).notNull(),
  informacoesRetiradaKit: text("informacoes_retirada_kit"),
  imagemPercursoUrl: text("imagem_percurso_url"),
  idadeMinimaEvento: integer("idade_minima_evento").default(18).notNull(),
  permitirMultiplasModalidades: boolean("permitir_multiplas_modalidades").default(false).notNull(),
  dataCriacao: timestamp("data_criacao", { withTimezone: true }).defaultNow().notNull(),
});

export const modalities = pgTable("modalities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  nome: text("nome").notNull(),
  distancia: decimal("distancia", { precision: 10, scale: 2 }).notNull(),
  unidadeDistancia: varchar("unidade_distancia", { length: 10 }).default("km").notNull(),
  horarioLargada: text("horario_largada").notNull(),
  descricao: text("descricao"),
  imagemUrl: text("imagem_url"),
  mapaPercursoUrl: text("mapa_percurso_url"),
  limiteVagas: integer("limite_vagas"),
  vagasOcupadas: integer("vagas_ocupadas").default(0).notNull(),
  tipoAcesso: modalityAccessEnum("tipo_acesso").default("paga").notNull(),
  taxaComodidade: decimal("taxa_comodidade", { precision: 10, scale: 2 }).default("0").notNull(),
  idadeMinima: integer("idade_minima"),
  ordem: integer("ordem").default(0).notNull(),
});

export const shirtSizes = pgTable("shirt_sizes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  modalityId: varchar("modality_id").references(() => modalities.id),
  tamanho: varchar("tamanho", { length: 10 }).notNull(),
  quantidadeTotal: integer("quantidade_total").notNull(),
  quantidadeDisponivel: integer("quantidade_disponivel").notNull(),
});

export const registrationBatches = pgTable("registration_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  modalityId: varchar("modality_id").references(() => modalities.id),
  nome: text("nome").notNull(),
  dataInicio: timestamp("data_inicio", { withTimezone: true }).notNull(),
  dataTermino: timestamp("data_termino", { withTimezone: true }),
  quantidadeMaxima: integer("quantidade_maxima"),
  quantidadeUtilizada: integer("quantidade_utilizada").default(0).notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  status: batchStatusEnum("status").default("future").notNull(),
  precoCentavos: integer("preco_centavos"),
  ordem: integer("ordem").default(0).notNull(),
});

export const prices = pgTable("prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modalityId: varchar("modality_id").notNull().references(() => modalities.id),
  batchId: varchar("batch_id").notNull().references(() => registrationBatches.id),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  dataCriacao: timestamp("data_criacao", { withTimezone: true }).defaultNow().notNull(),
});

export const attachments = pgTable("attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  nome: text("nome").notNull(),
  url: text("url").notNull(),
  obrigatorioAceitar: boolean("obrigatorio_aceitar").default(false).notNull(),
  ordem: integer("ordem").default(0).notNull(),
});

export const eventBanners = pgTable("event_banners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  imagemUrl: text("imagem_url").notNull(),
  ordem: integer("ordem").default(0).notNull(),
  dataCriacao: timestamp("data_criacao", { withTimezone: true }).defaultNow().notNull(),
});

export const athletes = pgTable("athletes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cpf: varchar("cpf", { length: 14 }).notNull().unique(),
  nome: text("nome").notNull(),
  dataNascimento: date("data_nascimento").notNull(),
  sexo: varchar("sexo", { length: 20 }).notNull(),
  email: text("email").notNull().unique(),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  estado: varchar("estado", { length: 2 }).notNull(),
  cidade: text("cidade").notNull(),
  cep: varchar("cep", { length: 9 }),
  rua: text("rua"),
  numero: varchar("numero", { length: 20 }),
  complemento: text("complemento"),
  escolaridade: text("escolaridade"),
  profissao: text("profissao"),
  dataCadastro: timestamp("data_cadastro", { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numeroPedido: integer("numero_pedido").notNull(),
  eventId: varchar("event_id").notNull().references(() => events.id),
  compradorId: varchar("comprador_id").notNull().references(() => athletes.id),
  valorTotal: decimal("valor_total", { precision: 10, scale: 2 }).notNull(),
  valorDesconto: decimal("valor_desconto", { precision: 10, scale: 2 }).default("0").notNull(),
  codigoVoucher: text("codigo_voucher"),
  status: orderStatusEnum("status").default("pendente").notNull(),
  idPagamentoGateway: text("id_pagamento_gateway"),
  metodoPagamento: text("metodo_pagamento"),
  dataPedido: timestamp("data_pedido", { withTimezone: true }).defaultNow().notNull(),
  dataPagamento: timestamp("data_pagamento", { withTimezone: true }),
  dataExpiracao: timestamp("data_expiracao", { withTimezone: true }),
  ipComprador: varchar("ip_comprador", { length: 45 }),
});

export const registrations = pgTable("registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numeroInscricao: integer("numero_inscricao").notNull(),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  eventId: varchar("event_id").notNull().references(() => events.id),
  modalityId: varchar("modality_id").notNull().references(() => modalities.id),
  batchId: varchar("batch_id").notNull().references(() => registrationBatches.id),
  athleteId: varchar("athlete_id").notNull().references(() => athletes.id),
  tamanhoCamisa: varchar("tamanho_camisa", { length: 10 }),
  valorUnitario: decimal("valor_unitario", { precision: 10, scale: 2 }).notNull(),
  taxaComodidade: decimal("taxa_comodidade", { precision: 10, scale: 2 }).default("0").notNull(),
  status: registrationStatusEnum("status").default("pendente").notNull(),
  equipe: text("equipe"),
  nomeCompleto: text("nome_completo"),
  cpf: varchar("cpf", { length: 14 }),
  dataNascimento: date("data_nascimento"),
  sexo: varchar("sexo", { length: 20 }),
  dataInscricao: timestamp("data_inscricao", { withTimezone: true }).defaultNow().notNull(),
});

export const documentAcceptances = pgTable("document_acceptances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  registrationId: varchar("registration_id").notNull().references(() => registrations.id),
  attachmentId: varchar("attachment_id").notNull().references(() => attachments.id),
  dataAceite: timestamp("data_aceite", { withTimezone: true }).defaultNow().notNull(),
  ipAceite: varchar("ip_aceite", { length: 45 }),
});

export const insertOrganizerSchema = createInsertSchema(organizers).omit({ id: true, dataCadastro: true });
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({ id: true, dataCriacao: true, dataAtualizacao: true, ultimoLogin: true });
export const insertPermissionSchema = createInsertSchema(permissions).omit({ id: true });
export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, dataCriacao: true });
export const insertModalitySchema = createInsertSchema(modalities).omit({ id: true });
export const insertShirtSizeSchema = createInsertSchema(shirtSizes).omit({ id: true });
export const insertRegistrationBatchSchema = createInsertSchema(registrationBatches).omit({ id: true });
export const insertPriceSchema = createInsertSchema(prices).omit({ id: true, dataCriacao: true });
export const insertAttachmentSchema = createInsertSchema(attachments).omit({ id: true });
export const insertEventBannerSchema = createInsertSchema(eventBanners).omit({ id: true, dataCriacao: true });
export const insertAthleteSchema = createInsertSchema(athletes).omit({ id: true, dataCadastro: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, dataPedido: true });
export const insertRegistrationSchema = createInsertSchema(registrations).omit({ id: true, dataInscricao: true });
export const insertDocumentAcceptanceSchema = createInsertSchema(documentAcceptances).omit({ id: true, dataAceite: true });

export type InsertOrganizer = z.infer<typeof insertOrganizerSchema>;
export type Organizer = typeof organizers.$inferSelect;

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;

export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

export type UserRole = "superadmin" | "admin" | "organizador";
export type UserStatus = "ativo" | "inativo" | "bloqueado";

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertModality = z.infer<typeof insertModalitySchema>;
export type Modality = typeof modalities.$inferSelect;

export type InsertShirtSize = z.infer<typeof insertShirtSizeSchema>;
export type ShirtSize = typeof shirtSizes.$inferSelect;

export type InsertRegistrationBatch = z.infer<typeof insertRegistrationBatchSchema>;
export type RegistrationBatch = typeof registrationBatches.$inferSelect;

export type InsertPrice = z.infer<typeof insertPriceSchema>;
export type Price = typeof prices.$inferSelect;

export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = typeof attachments.$inferSelect;

export type InsertEventBanner = z.infer<typeof insertEventBannerSchema>;
export type EventBanner = typeof eventBanners.$inferSelect;

export type InsertAthlete = z.infer<typeof insertAthleteSchema>;
export type Athlete = typeof athletes.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrations.$inferSelect;

export type InsertDocumentAcceptance = z.infer<typeof insertDocumentAcceptanceSchema>;
export type DocumentAcceptance = typeof documentAcceptances.$inferSelect;
