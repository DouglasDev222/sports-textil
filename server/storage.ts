import {
  type Organizer, type InsertOrganizer,
  type AdminUser, type InsertAdminUser,
  type Event, type InsertEvent,
  type Modality, type InsertModality,
  type ShirtSize, type InsertShirtSize,
  type RegistrationBatch, type InsertRegistrationBatch,
  type Price, type InsertPrice,
  type Attachment, type InsertAttachment,
  type Athlete, type InsertAthlete,
  type Order, type InsertOrder,
  type Registration, type InsertRegistration,
  type DocumentAcceptance, type InsertDocumentAcceptance,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Admin Users
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  getAdminUsers(): Promise<AdminUser[]>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(id: string, user: Partial<InsertAdminUser>): Promise<AdminUser | undefined>;
  deleteAdminUser(id: string): Promise<boolean>;
  updateAdminUserLastLogin(id: string): Promise<void>;

  // Organizers
  getOrganizer(id: string): Promise<Organizer | undefined>;
  getOrganizerByCpfCnpj(cpfCnpj: string): Promise<Organizer | undefined>;
  getOrganizers(): Promise<Organizer[]>;
  createOrganizer(organizer: InsertOrganizer): Promise<Organizer>;
  updateOrganizer(id: string, organizer: Partial<InsertOrganizer>): Promise<Organizer | undefined>;
  deleteOrganizer(id: string): Promise<boolean>;

  // Events
  getEvent(id: string): Promise<Event | undefined>;
  getEventBySlug(slug: string): Promise<Event | undefined>;
  getEvents(): Promise<Event[]>;
  getEventsByOrganizer(organizerId: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  // Modalities
  getModality(id: string): Promise<Modality | undefined>;
  getModalitiesByEvent(eventId: string): Promise<Modality[]>;
  createModality(modality: InsertModality): Promise<Modality>;
  updateModality(id: string, modality: Partial<InsertModality>): Promise<Modality | undefined>;
  deleteModality(id: string): Promise<boolean>;

  // Shirt Sizes
  getShirtSize(id: string): Promise<ShirtSize | undefined>;
  getShirtSizesByEvent(eventId: string): Promise<ShirtSize[]>;
  getShirtSizesByModality(modalityId: string): Promise<ShirtSize[]>;
  createShirtSize(shirtSize: InsertShirtSize): Promise<ShirtSize>;
  updateShirtSize(id: string, shirtSize: Partial<InsertShirtSize>): Promise<ShirtSize | undefined>;
  deleteShirtSize(id: string): Promise<boolean>;
  decrementShirtSize(id: string): Promise<boolean>;

  // Batches (Lotes)
  getBatch(id: string): Promise<RegistrationBatch | undefined>;
  getBatchesByEvent(eventId: string): Promise<RegistrationBatch[]>;
  getActiveBatch(eventId: string): Promise<RegistrationBatch | undefined>;
  createBatch(batch: InsertRegistrationBatch): Promise<RegistrationBatch>;
  updateBatch(id: string, batch: Partial<InsertRegistrationBatch>): Promise<RegistrationBatch | undefined>;
  deleteBatch(id: string): Promise<boolean>;

  // Prices
  getPrice(modalityId: string, batchId: string): Promise<Price | undefined>;
  getPriceById(id: string): Promise<Price | undefined>;
  getPricesByModality(modalityId: string): Promise<Price[]>;
  getPricesByBatch(batchId: string): Promise<Price[]>;
  getPricesByEvent(eventId: string): Promise<Price[]>;
  createPrice(price: InsertPrice): Promise<Price>;
  updatePrice(id: string, price: Partial<InsertPrice>): Promise<Price | undefined>;
  deletePrice(id: string): Promise<boolean>;

  // Attachments
  getAttachment(id: string): Promise<Attachment | undefined>;
  getAttachmentsByEvent(eventId: string): Promise<Attachment[]>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  updateAttachment(id: string, attachment: Partial<InsertAttachment>): Promise<Attachment | undefined>;
  deleteAttachment(id: string): Promise<boolean>;

  // Athletes
  getAthlete(id: string): Promise<Athlete | undefined>;
  getAthleteByCpf(cpf: string): Promise<Athlete | undefined>;
  createAthlete(athlete: InsertAthlete): Promise<Athlete>;
  updateAthlete(id: string, athlete: Partial<InsertAthlete>): Promise<Athlete | undefined>;

  // Orders
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByEvent(eventId: string): Promise<Order[]>;
  getOrdersByBuyer(buyerId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  getNextOrderNumber(eventId: string): Promise<number>;

  // Registrations
  getRegistration(id: string): Promise<Registration | undefined>;
  getRegistrationsByEvent(eventId: string): Promise<Registration[]>;
  getRegistrationsByAthlete(athleteId: string): Promise<Registration[]>;
  getRegistrationsByOrder(orderId: string): Promise<Registration[]>;
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  updateRegistration(id: string, registration: Partial<InsertRegistration>): Promise<Registration | undefined>;
  getNextRegistrationNumber(eventId: string): Promise<number>;

  // Document Acceptances
  getDocumentAcceptancesByRegistration(registrationId: string): Promise<DocumentAcceptance[]>;
  createDocumentAcceptance(acceptance: InsertDocumentAcceptance): Promise<DocumentAcceptance>;
}

export class MemStorage implements IStorage {
  private adminUsers: Map<string, AdminUser> = new Map();
  private organizers: Map<string, Organizer> = new Map();
  private events: Map<string, Event> = new Map();
  private modalities: Map<string, Modality> = new Map();
  private shirtSizes: Map<string, ShirtSize> = new Map();
  private batches: Map<string, RegistrationBatch> = new Map();
  private prices: Map<string, Price> = new Map();
  private attachments: Map<string, Attachment> = new Map();
  private athletes: Map<string, Athlete> = new Map();
  private orders: Map<string, Order> = new Map();
  private registrations: Map<string, Registration> = new Map();
  private documentAcceptances: Map<string, DocumentAcceptance> = new Map();

  // Admin Users
  async getAdminUser(id: string): Promise<AdminUser | undefined> {
    return this.adminUsers.get(id);
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    return Array.from(this.adminUsers.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  async getAdminUsers(): Promise<AdminUser[]> {
    return Array.from(this.adminUsers.values());
  }

  async createAdminUser(insertUser: InsertAdminUser): Promise<AdminUser> {
    const id = randomUUID();
    const user: AdminUser = {
      ...insertUser,
      id,
      status: insertUser.status ?? "ativo",
      organizerId: insertUser.organizerId ?? null,
      ultimoLogin: null,
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    };
    this.adminUsers.set(id, user);
    return user;
  }

  async updateAdminUser(id: string, userData: Partial<InsertAdminUser>): Promise<AdminUser | undefined> {
    const user = this.adminUsers.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...userData, dataAtualizacao: new Date() };
    this.adminUsers.set(id, updated);
    return updated;
  }

  async deleteAdminUser(id: string): Promise<boolean> {
    return this.adminUsers.delete(id);
  }

  async updateAdminUserLastLogin(id: string): Promise<void> {
    const user = this.adminUsers.get(id);
    if (user) {
      user.ultimoLogin = new Date();
      this.adminUsers.set(id, user);
    }
  }

  // Organizers
  async getOrganizer(id: string): Promise<Organizer | undefined> {
    return this.organizers.get(id);
  }

  async getOrganizerByCpfCnpj(cpfCnpj: string): Promise<Organizer | undefined> {
    return Array.from(this.organizers.values()).find(o => o.cpfCnpj === cpfCnpj);
  }

  async getOrganizers(): Promise<Organizer[]> {
    return Array.from(this.organizers.values());
  }

  async createOrganizer(insertOrganizer: InsertOrganizer): Promise<Organizer> {
    const id = randomUUID();
    const organizer: Organizer = { 
      ...insertOrganizer, 
      id, 
      dataCadastro: new Date() 
    };
    this.organizers.set(id, organizer);
    return organizer;
  }

  async updateOrganizer(id: string, organizerData: Partial<InsertOrganizer>): Promise<Organizer | undefined> {
    const organizer = this.organizers.get(id);
    if (!organizer) return undefined;
    const updated = { ...organizer, ...organizerData };
    this.organizers.set(id, updated);
    return updated;
  }

  async deleteOrganizer(id: string): Promise<boolean> {
    return this.organizers.delete(id);
  }

  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEventBySlug(slug: string): Promise<Event | undefined> {
    return Array.from(this.events.values()).find(e => e.slug === slug);
  }

  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async getEventsByOrganizer(organizerId: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(e => e.organizerId === organizerId);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = { 
      ...insertEvent, 
      id, 
      bannerUrl: insertEvent.bannerUrl ?? null,
      status: insertEvent.status ?? "rascunho",
      entregaCamisaNoKit: insertEvent.entregaCamisaNoKit ?? true,
      usarGradePorModalidade: insertEvent.usarGradePorModalidade ?? false,
      dataCriacao: new Date() 
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: string, eventData: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    const updated = { ...event, ...eventData };
    this.events.set(id, updated);
    return updated;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.events.delete(id);
  }

  async getModality(id: string): Promise<Modality | undefined> {
    return this.modalities.get(id);
  }

  async getModalitiesByEvent(eventId: string): Promise<Modality[]> {
    return Array.from(this.modalities.values()).filter(m => m.eventId === eventId);
  }

  async createModality(insertModality: InsertModality): Promise<Modality> {
    const id = randomUUID();
    const modality: Modality = { 
      ...insertModality, 
      id,
      unidadeDistancia: insertModality.unidadeDistancia ?? "km",
      descricao: insertModality.descricao ?? null,
      imagemUrl: insertModality.imagemUrl ?? null,
      mapaPercursoUrl: insertModality.mapaPercursoUrl ?? null,
      limiteVagas: insertModality.limiteVagas ?? null,
      tipoAcesso: insertModality.tipoAcesso ?? "paga",
      taxaComodidade: insertModality.taxaComodidade ?? "0",
      ordem: insertModality.ordem ?? 0
    };
    this.modalities.set(id, modality);
    return modality;
  }

  async updateModality(id: string, modalityData: Partial<InsertModality>): Promise<Modality | undefined> {
    const modality = this.modalities.get(id);
    if (!modality) return undefined;
    const updated = { ...modality, ...modalityData };
    this.modalities.set(id, updated);
    return updated;
  }

  async deleteModality(id: string): Promise<boolean> {
    return this.modalities.delete(id);
  }

  async getShirtSize(id: string): Promise<ShirtSize | undefined> {
    return this.shirtSizes.get(id);
  }

  async getShirtSizesByEvent(eventId: string): Promise<ShirtSize[]> {
    return Array.from(this.shirtSizes.values()).filter(s => s.eventId === eventId && !s.modalityId);
  }

  async getShirtSizesByModality(modalityId: string): Promise<ShirtSize[]> {
    return Array.from(this.shirtSizes.values()).filter(s => s.modalityId === modalityId);
  }

  async createShirtSize(insertShirtSize: InsertShirtSize): Promise<ShirtSize> {
    const id = randomUUID();
    const shirtSize: ShirtSize = { 
      ...insertShirtSize, 
      id,
      modalityId: insertShirtSize.modalityId ?? null
    };
    this.shirtSizes.set(id, shirtSize);
    return shirtSize;
  }

  async updateShirtSize(id: string, shirtSizeData: Partial<InsertShirtSize>): Promise<ShirtSize | undefined> {
    const shirtSize = this.shirtSizes.get(id);
    if (!shirtSize) return undefined;
    const updated = { ...shirtSize, ...shirtSizeData };
    this.shirtSizes.set(id, updated);
    return updated;
  }

  async deleteShirtSize(id: string): Promise<boolean> {
    return this.shirtSizes.delete(id);
  }

  async decrementShirtSize(id: string): Promise<boolean> {
    const shirtSize = this.shirtSizes.get(id);
    if (!shirtSize || shirtSize.quantidadeDisponivel <= 0) return false;
    shirtSize.quantidadeDisponivel--;
    return true;
  }

  async getBatch(id: string): Promise<RegistrationBatch | undefined> {
    return this.batches.get(id);
  }

  async getBatchesByEvent(eventId: string): Promise<RegistrationBatch[]> {
    return Array.from(this.batches.values()).filter(b => b.eventId === eventId);
  }

  async getActiveBatch(eventId: string): Promise<RegistrationBatch | undefined> {
    const now = new Date();
    return Array.from(this.batches.values()).find(b => 
      b.eventId === eventId && 
      b.ativo && 
      new Date(b.dataInicio) <= now &&
      (!b.dataTermino || new Date(b.dataTermino) > now) &&
      (!b.quantidadeMaxima || b.quantidadeUtilizada < b.quantidadeMaxima)
    );
  }

  async createBatch(insertBatch: InsertRegistrationBatch): Promise<RegistrationBatch> {
    const id = randomUUID();
    const batch: RegistrationBatch = { 
      ...insertBatch, 
      id,
      dataTermino: insertBatch.dataTermino ?? null,
      quantidadeMaxima: insertBatch.quantidadeMaxima ?? null,
      quantidadeUtilizada: insertBatch.quantidadeUtilizada ?? 0,
      ativo: insertBatch.ativo ?? true,
      ordem: insertBatch.ordem ?? 0
    };
    this.batches.set(id, batch);
    return batch;
  }

  async updateBatch(id: string, batchData: Partial<InsertRegistrationBatch>): Promise<RegistrationBatch | undefined> {
    const batch = this.batches.get(id);
    if (!batch) return undefined;
    const updated = { ...batch, ...batchData };
    this.batches.set(id, updated);
    return updated;
  }

  async deleteBatch(id: string): Promise<boolean> {
    return this.batches.delete(id);
  }

  async getPrice(modalityId: string, batchId: string): Promise<Price | undefined> {
    return Array.from(this.prices.values()).find(p => p.modalityId === modalityId && p.batchId === batchId);
  }

  async getPriceById(id: string): Promise<Price | undefined> {
    return this.prices.get(id);
  }

  async getPricesByModality(modalityId: string): Promise<Price[]> {
    return Array.from(this.prices.values()).filter(p => p.modalityId === modalityId);
  }

  async getPricesByBatch(batchId: string): Promise<Price[]> {
    return Array.from(this.prices.values()).filter(p => p.batchId === batchId);
  }

  async getPricesByEvent(eventId: string): Promise<Price[]> {
    const eventModalities = await this.getModalitiesByEvent(eventId);
    const modalityIds = new Set(eventModalities.map(m => m.id));
    return Array.from(this.prices.values()).filter(p => modalityIds.has(p.modalityId));
  }

  async createPrice(insertPrice: InsertPrice): Promise<Price> {
    const id = randomUUID();
    const price: Price = { ...insertPrice, id };
    this.prices.set(id, price);
    return price;
  }

  async updatePrice(id: string, priceData: Partial<InsertPrice>): Promise<Price | undefined> {
    const price = this.prices.get(id);
    if (!price) return undefined;
    const updated = { ...price, ...priceData };
    this.prices.set(id, updated);
    return updated;
  }

  async deletePrice(id: string): Promise<boolean> {
    return this.prices.delete(id);
  }

  async getAttachment(id: string): Promise<Attachment | undefined> {
    return this.attachments.get(id);
  }

  async getAttachmentsByEvent(eventId: string): Promise<Attachment[]> {
    return Array.from(this.attachments.values()).filter(a => a.eventId === eventId);
  }

  async createAttachment(insertAttachment: InsertAttachment): Promise<Attachment> {
    const id = randomUUID();
    const attachment: Attachment = { 
      ...insertAttachment, 
      id,
      obrigatorioAceitar: insertAttachment.obrigatorioAceitar ?? false,
      ordem: insertAttachment.ordem ?? 0
    };
    this.attachments.set(id, attachment);
    return attachment;
  }

  async updateAttachment(id: string, attachmentData: Partial<InsertAttachment>): Promise<Attachment | undefined> {
    const attachment = this.attachments.get(id);
    if (!attachment) return undefined;
    const updated = { ...attachment, ...attachmentData };
    this.attachments.set(id, updated);
    return updated;
  }

  async deleteAttachment(id: string): Promise<boolean> {
    return this.attachments.delete(id);
  }

  async getAthlete(id: string): Promise<Athlete | undefined> {
    return this.athletes.get(id);
  }

  async getAthleteByCpf(cpf: string): Promise<Athlete | undefined> {
    return Array.from(this.athletes.values()).find(a => a.cpf === cpf);
  }

  async createAthlete(insertAthlete: InsertAthlete): Promise<Athlete> {
    const id = randomUUID();
    const athlete: Athlete = { 
      ...insertAthlete, 
      id, 
      escolaridade: insertAthlete.escolaridade ?? null,
      profissao: insertAthlete.profissao ?? null,
      dataCadastro: new Date() 
    };
    this.athletes.set(id, athlete);
    return athlete;
  }

  async updateAthlete(id: string, athleteData: Partial<InsertAthlete>): Promise<Athlete | undefined> {
    const athlete = this.athletes.get(id);
    if (!athlete) return undefined;
    const updated = { ...athlete, ...athleteData };
    this.athletes.set(id, updated);
    return updated;
  }

  // Orders
  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByEvent(eventId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(o => o.eventId === eventId);
  }

  async getOrdersByBuyer(buyerId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(o => o.compradorId === buyerId);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      ...insertOrder,
      id,
      valorDesconto: insertOrder.valorDesconto ?? "0",
      codigoVoucher: insertOrder.codigoVoucher ?? null,
      status: insertOrder.status ?? "pendente",
      idPagamentoGateway: insertOrder.idPagamentoGateway ?? null,
      metodoPagamento: insertOrder.metodoPagamento ?? null,
      dataPedido: new Date(),
      dataPagamento: insertOrder.dataPagamento ?? null,
      dataExpiracao: insertOrder.dataExpiracao ?? null,
      ipComprador: insertOrder.ipComprador ?? null
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, orderData: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    const updated = { ...order, ...orderData };
    this.orders.set(id, updated);
    return updated;
  }

  async getNextOrderNumber(eventId: string): Promise<number> {
    const orders = await this.getOrdersByEvent(eventId);
    if (orders.length === 0) return 1;
    return Math.max(...orders.map(o => o.numeroPedido)) + 1;
  }

  // Registrations
  async getRegistration(id: string): Promise<Registration | undefined> {
    return this.registrations.get(id);
  }

  async getRegistrationsByEvent(eventId: string): Promise<Registration[]> {
    return Array.from(this.registrations.values()).filter(r => r.eventId === eventId);
  }

  async getRegistrationsByAthlete(athleteId: string): Promise<Registration[]> {
    return Array.from(this.registrations.values()).filter(r => r.athleteId === athleteId);
  }

  async getRegistrationsByOrder(orderId: string): Promise<Registration[]> {
    return Array.from(this.registrations.values()).filter(r => r.orderId === orderId);
  }

  async getNextRegistrationNumber(eventId: string): Promise<number> {
    const registrations = await this.getRegistrationsByEvent(eventId);
    if (registrations.length === 0) return 1;
    return Math.max(...registrations.map(r => r.numeroInscricao)) + 1;
  }

  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const batch = this.batches.get(insertRegistration.batchId);
    if (batch && batch.quantidadeMaxima && batch.quantidadeUtilizada >= batch.quantidadeMaxima) {
      throw new Error("Lote esgotado");
    }

    let shirtSizeToUpdate: { id: string; size: ShirtSize } | null = null;
    
    if (insertRegistration.tamanhoCamisa) {
      const event = this.events.get(insertRegistration.eventId);
      const shirtSizeEntries = Array.from(this.shirtSizes.entries());
      
      if (event?.usarGradePorModalidade) {
        for (const [id, size] of shirtSizeEntries) {
          if (size.modalityId === insertRegistration.modalityId && size.tamanho === insertRegistration.tamanhoCamisa) {
            if (size.quantidadeDisponivel <= 0) {
              throw new Error(`Tamanho ${size.tamanho} esgotado`);
            }
            shirtSizeToUpdate = { id, size };
            break;
          }
        }
      } else {
        for (const [id, size] of shirtSizeEntries) {
          if (size.eventId === insertRegistration.eventId && !size.modalityId && size.tamanho === insertRegistration.tamanhoCamisa) {
            if (size.quantidadeDisponivel <= 0) {
              throw new Error(`Tamanho ${size.tamanho} esgotado`);
            }
            shirtSizeToUpdate = { id, size };
            break;
          }
        }
      }

      if (!shirtSizeToUpdate) {
        throw new Error(`Tamanho ${insertRegistration.tamanhoCamisa} nao disponivel para este evento/modalidade`);
      }
    }

    if (batch) {
      batch.quantidadeUtilizada++;
      this.batches.set(batch.id, batch);
    }

    if (shirtSizeToUpdate) {
      shirtSizeToUpdate.size.quantidadeDisponivel--;
      this.shirtSizes.set(shirtSizeToUpdate.id, shirtSizeToUpdate.size);
    }

    const id = randomUUID();
    const registration: Registration = { 
      ...insertRegistration, 
      id,
      status: insertRegistration.status ?? "pendente",
      tamanhoCamisa: insertRegistration.tamanhoCamisa ?? null,
      taxaComodidade: insertRegistration.taxaComodidade ?? "0",
      equipe: insertRegistration.equipe ?? null,
      dataInscricao: new Date() 
    };
    this.registrations.set(id, registration);
    return registration;
  }

  async updateRegistration(id: string, registrationData: Partial<InsertRegistration>): Promise<Registration | undefined> {
    const registration = this.registrations.get(id);
    if (!registration) return undefined;
    const updated = { ...registration, ...registrationData };
    this.registrations.set(id, updated);
    return updated;
  }

  async getDocumentAcceptancesByRegistration(registrationId: string): Promise<DocumentAcceptance[]> {
    return Array.from(this.documentAcceptances.values()).filter(d => d.registrationId === registrationId);
  }

  async createDocumentAcceptance(insertAcceptance: InsertDocumentAcceptance): Promise<DocumentAcceptance> {
    const id = randomUUID();
    const acceptance: DocumentAcceptance = { 
      ...insertAcceptance, 
      id, 
      ipAceite: insertAcceptance.ipAceite ?? null,
      dataAceite: new Date() 
    };
    this.documentAcceptances.set(id, acceptance);
    return acceptance;
  }
}

export const storage = new MemStorage();
