import {
  type Organizer, type InsertOrganizer,
  type AdminUser, type InsertAdminUser,
  type Event, type InsertEvent,
  type Modality, type InsertModality,
  type ShirtSize, type InsertShirtSize,
  type RegistrationBatch, type InsertRegistrationBatch,
  type Price, type InsertPrice,
  type Attachment, type InsertAttachment,
  type EventBanner, type InsertEventBanner,
  type Athlete, type InsertAthlete,
  type Order, type InsertOrder,
  type Registration, type InsertRegistration,
  type DocumentAcceptance, type InsertDocumentAcceptance,
  organizers, adminUsers, events, modalities, shirtSizes,
  registrationBatches, prices, attachments, eventBanners, athletes, orders,
  registrations, documentAcceptances
} from "@shared/schema";
import { db } from "./db";
import { eq, and, isNull, lte, gt, sql, max } from "drizzle-orm";

export interface IStorage {
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  getAdminUsers(): Promise<AdminUser[]>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(id: string, user: Partial<InsertAdminUser>): Promise<AdminUser | undefined>;
  deleteAdminUser(id: string): Promise<boolean>;
  updateAdminUserLastLogin(id: string): Promise<void>;
  getAdminUsersByOrganizer(organizerId: string): Promise<AdminUser[]>;

  getOrganizer(id: string): Promise<Organizer | undefined>;
  getOrganizerByCpfCnpj(cpfCnpj: string): Promise<Organizer | undefined>;
  getOrganizers(): Promise<Organizer[]>;
  createOrganizer(organizer: InsertOrganizer): Promise<Organizer>;
  updateOrganizer(id: string, organizer: Partial<InsertOrganizer>): Promise<Organizer | undefined>;
  deleteOrganizer(id: string): Promise<boolean>;

  getEvent(id: string): Promise<Event | undefined>;
  getEventBySlug(slug: string): Promise<Event | undefined>;
  getEvents(): Promise<Event[]>;
  getEventsByOrganizer(organizerId: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  getModality(id: string): Promise<Modality | undefined>;
  getModalitiesByEvent(eventId: string): Promise<Modality[]>;
  createModality(modality: InsertModality): Promise<Modality>;
  updateModality(id: string, modality: Partial<InsertModality>): Promise<Modality | undefined>;
  deleteModality(id: string): Promise<boolean>;

  getShirtSize(id: string): Promise<ShirtSize | undefined>;
  getShirtSizesByEvent(eventId: string): Promise<ShirtSize[]>;
  getShirtSizesByModality(modalityId: string): Promise<ShirtSize[]>;
  createShirtSize(shirtSize: InsertShirtSize): Promise<ShirtSize>;
  updateShirtSize(id: string, shirtSize: Partial<InsertShirtSize>): Promise<ShirtSize | undefined>;
  deleteShirtSize(id: string): Promise<boolean>;
  decrementShirtSize(id: string): Promise<boolean>;

  getBatch(id: string): Promise<RegistrationBatch | undefined>;
  getBatchesByEvent(eventId: string): Promise<RegistrationBatch[]>;
  getActiveBatch(eventId: string): Promise<RegistrationBatch | undefined>;
  createBatch(batch: InsertRegistrationBatch): Promise<RegistrationBatch>;
  updateBatch(id: string, batch: Partial<InsertRegistrationBatch>): Promise<RegistrationBatch | undefined>;
  deleteBatch(id: string): Promise<boolean>;

  getPrice(modalityId: string, batchId: string): Promise<Price | undefined>;
  getPriceById(id: string): Promise<Price | undefined>;
  getPricesByModality(modalityId: string): Promise<Price[]>;
  getPricesByBatch(batchId: string): Promise<Price[]>;
  getPricesByEvent(eventId: string): Promise<Price[]>;
  createPrice(price: InsertPrice): Promise<Price>;
  updatePrice(id: string, price: Partial<InsertPrice>): Promise<Price | undefined>;
  deletePrice(id: string): Promise<boolean>;

  getAttachment(id: string): Promise<Attachment | undefined>;
  getAttachmentsByEvent(eventId: string): Promise<Attachment[]>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  updateAttachment(id: string, attachment: Partial<InsertAttachment>): Promise<Attachment | undefined>;
  deleteAttachment(id: string): Promise<boolean>;

  getEventBanner(id: string): Promise<EventBanner | undefined>;
  getEventBannersByEvent(eventId: string): Promise<EventBanner[]>;
  createEventBanner(banner: InsertEventBanner): Promise<EventBanner>;
  updateEventBanner(id: string, banner: Partial<InsertEventBanner>): Promise<EventBanner | undefined>;
  deleteEventBanner(id: string): Promise<boolean>;
  deleteEventBannersByEvent(eventId: string): Promise<boolean>;

  getAthlete(id: string): Promise<Athlete | undefined>;
  getAthleteByCpf(cpf: string): Promise<Athlete | undefined>;
  createAthlete(athlete: InsertAthlete): Promise<Athlete>;
  updateAthlete(id: string, athlete: Partial<InsertAthlete>): Promise<Athlete | undefined>;

  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByEvent(eventId: string): Promise<Order[]>;
  getOrdersByBuyer(buyerId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  getNextOrderNumber(eventId: string): Promise<number>;

  getRegistration(id: string): Promise<Registration | undefined>;
  getRegistrationsByEvent(eventId: string): Promise<Registration[]>;
  getRegistrationsByAthlete(athleteId: string): Promise<Registration[]>;
  getRegistrationsByOrder(orderId: string): Promise<Registration[]>;
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  updateRegistration(id: string, registration: Partial<InsertRegistration>): Promise<Registration | undefined>;
  getNextRegistrationNumber(eventId: string): Promise<number>;

  getDocumentAcceptancesByRegistration(registrationId: string): Promise<DocumentAcceptance[]>;
  createDocumentAcceptance(acceptance: InsertDocumentAcceptance): Promise<DocumentAcceptance>;
}

export class DbStorage implements IStorage {
  async getAdminUser(id: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email.toLowerCase()));
    return user;
  }

  async getAdminUsers(): Promise<AdminUser[]> {
    return db.select().from(adminUsers);
  }

  async createAdminUser(insertUser: InsertAdminUser): Promise<AdminUser> {
    const [user] = await db.insert(adminUsers).values({
      ...insertUser,
      email: insertUser.email.toLowerCase()
    }).returning();
    return user;
  }

  async updateAdminUser(id: string, userData: Partial<InsertAdminUser>): Promise<AdminUser | undefined> {
    const [user] = await db.update(adminUsers)
      .set({ ...userData, dataAtualizacao: new Date() })
      .where(eq(adminUsers.id, id))
      .returning();
    return user;
  }

  async deleteAdminUser(id: string): Promise<boolean> {
    const result = await db.delete(adminUsers).where(eq(adminUsers.id, id)).returning();
    return result.length > 0;
  }

  async updateAdminUserLastLogin(id: string): Promise<void> {
    await db.update(adminUsers)
      .set({ ultimoLogin: new Date() })
      .where(eq(adminUsers.id, id));
  }

  async getAdminUsersByOrganizer(organizerId: string): Promise<AdminUser[]> {
    return db.select().from(adminUsers).where(eq(adminUsers.organizerId, organizerId));
  }

  async getOrganizer(id: string): Promise<Organizer | undefined> {
    const [organizer] = await db.select().from(organizers).where(eq(organizers.id, id));
    return organizer;
  }

  async getOrganizerByCpfCnpj(cpfCnpj: string): Promise<Organizer | undefined> {
    const [organizer] = await db.select().from(organizers).where(eq(organizers.cpfCnpj, cpfCnpj));
    return organizer;
  }

  async getOrganizers(): Promise<Organizer[]> {
    return db.select().from(organizers);
  }

  async createOrganizer(insertOrganizer: InsertOrganizer): Promise<Organizer> {
    const [organizer] = await db.insert(organizers).values(insertOrganizer).returning();
    return organizer;
  }

  async updateOrganizer(id: string, organizerData: Partial<InsertOrganizer>): Promise<Organizer | undefined> {
    const [organizer] = await db.update(organizers)
      .set(organizerData)
      .where(eq(organizers.id, id))
      .returning();
    return organizer;
  }

  async deleteOrganizer(id: string): Promise<boolean> {
    const result = await db.delete(organizers).where(eq(organizers.id, id)).returning();
    return result.length > 0;
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEventBySlug(slug: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.slug, slug));
    return event;
  }

  async getEvents(): Promise<Event[]> {
    return db.select().from(events);
  }

  async getEventsByOrganizer(organizerId: string): Promise<Event[]> {
    return db.select().from(events).where(eq(events.organizerId, organizerId));
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async updateEvent(id: string, eventData: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db.update(events)
      .set(eventData)
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id)).returning();
    return result.length > 0;
  }

  async getModality(id: string): Promise<Modality | undefined> {
    const [modality] = await db.select().from(modalities).where(eq(modalities.id, id));
    return modality;
  }

  async getModalitiesByEvent(eventId: string): Promise<Modality[]> {
    return db.select().from(modalities).where(eq(modalities.eventId, eventId));
  }

  async createModality(insertModality: InsertModality): Promise<Modality> {
    const [modality] = await db.insert(modalities).values(insertModality).returning();
    return modality;
  }

  async updateModality(id: string, modalityData: Partial<InsertModality>): Promise<Modality | undefined> {
    const [modality] = await db.update(modalities)
      .set(modalityData)
      .where(eq(modalities.id, id))
      .returning();
    return modality;
  }

  async deleteModality(id: string): Promise<boolean> {
    const result = await db.delete(modalities).where(eq(modalities.id, id)).returning();
    return result.length > 0;
  }

  async getShirtSize(id: string): Promise<ShirtSize | undefined> {
    const [size] = await db.select().from(shirtSizes).where(eq(shirtSizes.id, id));
    return size;
  }

  async getShirtSizesByEvent(eventId: string): Promise<ShirtSize[]> {
    return db.select().from(shirtSizes).where(
      and(eq(shirtSizes.eventId, eventId), isNull(shirtSizes.modalityId))
    );
  }

  async getShirtSizesByModality(modalityId: string): Promise<ShirtSize[]> {
    return db.select().from(shirtSizes).where(eq(shirtSizes.modalityId, modalityId));
  }

  async createShirtSize(insertShirtSize: InsertShirtSize): Promise<ShirtSize> {
    const [size] = await db.insert(shirtSizes).values(insertShirtSize).returning();
    return size;
  }

  async updateShirtSize(id: string, shirtSizeData: Partial<InsertShirtSize>): Promise<ShirtSize | undefined> {
    const [size] = await db.update(shirtSizes)
      .set(shirtSizeData)
      .where(eq(shirtSizes.id, id))
      .returning();
    return size;
  }

  async deleteShirtSize(id: string): Promise<boolean> {
    const result = await db.delete(shirtSizes).where(eq(shirtSizes.id, id)).returning();
    return result.length > 0;
  }

  async decrementShirtSize(id: string): Promise<boolean> {
    const [size] = await db.select().from(shirtSizes).where(eq(shirtSizes.id, id));
    if (!size || size.quantidadeDisponivel <= 0) return false;
    
    await db.update(shirtSizes)
      .set({ quantidadeDisponivel: size.quantidadeDisponivel - 1 })
      .where(eq(shirtSizes.id, id));
    return true;
  }

  async getBatch(id: string): Promise<RegistrationBatch | undefined> {
    const [batch] = await db.select().from(registrationBatches).where(eq(registrationBatches.id, id));
    return batch;
  }

  async getBatchesByEvent(eventId: string): Promise<RegistrationBatch[]> {
    return db.select().from(registrationBatches).where(eq(registrationBatches.eventId, eventId));
  }

  async getActiveBatch(eventId: string): Promise<RegistrationBatch | undefined> {
    const now = new Date();
    const allBatches = await db.select().from(registrationBatches)
      .where(and(
        eq(registrationBatches.eventId, eventId),
        eq(registrationBatches.ativo, true),
        lte(registrationBatches.dataInicio, now)
      ));
    
    return allBatches.find(b => 
      (!b.dataTermino || new Date(b.dataTermino) > now) &&
      (!b.quantidadeMaxima || b.quantidadeUtilizada < b.quantidadeMaxima)
    );
  }

  async createBatch(insertBatch: InsertRegistrationBatch): Promise<RegistrationBatch> {
    const [batch] = await db.insert(registrationBatches).values(insertBatch).returning();
    return batch;
  }

  async updateBatch(id: string, batchData: Partial<InsertRegistrationBatch>): Promise<RegistrationBatch | undefined> {
    const [batch] = await db.update(registrationBatches)
      .set(batchData)
      .where(eq(registrationBatches.id, id))
      .returning();
    return batch;
  }

  async deleteBatch(id: string): Promise<boolean> {
    const result = await db.delete(registrationBatches).where(eq(registrationBatches.id, id)).returning();
    return result.length > 0;
  }

  async getPrice(modalityId: string, batchId: string): Promise<Price | undefined> {
    const [price] = await db.select().from(prices).where(
      and(eq(prices.modalityId, modalityId), eq(prices.batchId, batchId))
    );
    return price;
  }

  async getPriceById(id: string): Promise<Price | undefined> {
    const [price] = await db.select().from(prices).where(eq(prices.id, id));
    return price;
  }

  async getPricesByModality(modalityId: string): Promise<Price[]> {
    return db.select().from(prices).where(eq(prices.modalityId, modalityId));
  }

  async getPricesByBatch(batchId: string): Promise<Price[]> {
    return db.select().from(prices).where(eq(prices.batchId, batchId));
  }

  async getPricesByEvent(eventId: string): Promise<Price[]> {
    const eventModalities = await this.getModalitiesByEvent(eventId);
    const modalityIds = eventModalities.map(m => m.id);
    if (modalityIds.length === 0) return [];
    
    const allPrices: Price[] = [];
    for (const modId of modalityIds) {
      const modalityPrices = await db.select().from(prices).where(eq(prices.modalityId, modId));
      allPrices.push(...modalityPrices);
    }
    return allPrices;
  }

  async createPrice(insertPrice: InsertPrice): Promise<Price> {
    const [price] = await db.insert(prices).values(insertPrice).returning();
    return price;
  }

  async updatePrice(id: string, priceData: Partial<InsertPrice>): Promise<Price | undefined> {
    const [price] = await db.update(prices)
      .set(priceData)
      .where(eq(prices.id, id))
      .returning();
    return price;
  }

  async deletePrice(id: string): Promise<boolean> {
    const result = await db.delete(prices).where(eq(prices.id, id)).returning();
    return result.length > 0;
  }

  async getAttachment(id: string): Promise<Attachment | undefined> {
    const [attachment] = await db.select().from(attachments).where(eq(attachments.id, id));
    return attachment;
  }

  async getAttachmentsByEvent(eventId: string): Promise<Attachment[]> {
    return db.select().from(attachments).where(eq(attachments.eventId, eventId));
  }

  async createAttachment(insertAttachment: InsertAttachment): Promise<Attachment> {
    const [attachment] = await db.insert(attachments).values(insertAttachment).returning();
    return attachment;
  }

  async updateAttachment(id: string, attachmentData: Partial<InsertAttachment>): Promise<Attachment | undefined> {
    const [attachment] = await db.update(attachments)
      .set(attachmentData)
      .where(eq(attachments.id, id))
      .returning();
    return attachment;
  }

  async deleteAttachment(id: string): Promise<boolean> {
    const result = await db.delete(attachments).where(eq(attachments.id, id)).returning();
    return result.length > 0;
  }

  async getEventBanner(id: string): Promise<EventBanner | undefined> {
    const [banner] = await db.select().from(eventBanners).where(eq(eventBanners.id, id));
    return banner;
  }

  async getEventBannersByEvent(eventId: string): Promise<EventBanner[]> {
    return db.select().from(eventBanners).where(eq(eventBanners.eventId, eventId));
  }

  async createEventBanner(insertBanner: InsertEventBanner): Promise<EventBanner> {
    const [banner] = await db.insert(eventBanners).values(insertBanner).returning();
    return banner;
  }

  async updateEventBanner(id: string, bannerData: Partial<InsertEventBanner>): Promise<EventBanner | undefined> {
    const [banner] = await db.update(eventBanners)
      .set(bannerData)
      .where(eq(eventBanners.id, id))
      .returning();
    return banner;
  }

  async deleteEventBanner(id: string): Promise<boolean> {
    const result = await db.delete(eventBanners).where(eq(eventBanners.id, id)).returning();
    return result.length > 0;
  }

  async deleteEventBannersByEvent(eventId: string): Promise<boolean> {
    const result = await db.delete(eventBanners).where(eq(eventBanners.eventId, eventId)).returning();
    return result.length >= 0;
  }

  async getAthlete(id: string): Promise<Athlete | undefined> {
    const [athlete] = await db.select().from(athletes).where(eq(athletes.id, id));
    return athlete;
  }

  async getAthleteByCpf(cpf: string): Promise<Athlete | undefined> {
    const [athlete] = await db.select().from(athletes).where(eq(athletes.cpf, cpf));
    return athlete;
  }

  async createAthlete(insertAthlete: InsertAthlete): Promise<Athlete> {
    const [athlete] = await db.insert(athletes).values(insertAthlete).returning();
    return athlete;
  }

  async updateAthlete(id: string, athleteData: Partial<InsertAthlete>): Promise<Athlete | undefined> {
    const [athlete] = await db.update(athletes)
      .set(athleteData)
      .where(eq(athletes.id, id))
      .returning();
    return athlete;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByEvent(eventId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.eventId, eventId));
  }

  async getOrdersByBuyer(buyerId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.compradorId, buyerId));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async updateOrder(id: string, orderData: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set(orderData)
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getNextOrderNumber(eventId: string): Promise<number> {
    const result = await db.select({ maxNum: max(orders.numeroPedido) })
      .from(orders)
      .where(eq(orders.eventId, eventId));
    return (result[0]?.maxNum ?? 0) + 1;
  }

  async getRegistration(id: string): Promise<Registration | undefined> {
    const [reg] = await db.select().from(registrations).where(eq(registrations.id, id));
    return reg;
  }

  async getRegistrationsByEvent(eventId: string): Promise<Registration[]> {
    return db.select().from(registrations).where(eq(registrations.eventId, eventId));
  }

  async getRegistrationsByAthlete(athleteId: string): Promise<Registration[]> {
    return db.select().from(registrations).where(eq(registrations.athleteId, athleteId));
  }

  async getRegistrationsByOrder(orderId: string): Promise<Registration[]> {
    return db.select().from(registrations).where(eq(registrations.orderId, orderId));
  }

  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const batch = await this.getBatch(insertRegistration.batchId);
    if (batch && batch.quantidadeMaxima && batch.quantidadeUtilizada >= batch.quantidadeMaxima) {
      throw new Error("Lote esgotado");
    }

    const event = await this.getEvent(insertRegistration.eventId);
    if (!event) {
      throw new Error("Evento nao encontrado");
    }

    const modality = await this.getModality(insertRegistration.modalityId);
    if (!modality) {
      throw new Error("Modalidade nao encontrada");
    }

    const athlete = await this.getAthlete(insertRegistration.athleteId);
    if (!athlete) {
      throw new Error("Atleta nao encontrado");
    }

    const idadeMinima = modality.idadeMinima ?? event.idadeMinimaEvento ?? 18;
    
    const eventDate = new Date(event.dataEvento);
    const birthDate = new Date(athlete.dataNascimento);
    let age = eventDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = eventDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && eventDate.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < idadeMinima) {
      throw new Error(`Idade minima para esta modalidade e ${idadeMinima} anos. O participante tera ${age} anos na data do evento.`);
    }

    if (insertRegistration.tamanhoCamisa) {
      let shirtSize: ShirtSize | undefined;
      
      if (event.usarGradePorModalidade) {
        const sizes = await this.getShirtSizesByModality(insertRegistration.modalityId);
        shirtSize = sizes.find(s => s.tamanho === insertRegistration.tamanhoCamisa);
      } else {
        const sizes = await this.getShirtSizesByEvent(insertRegistration.eventId);
        shirtSize = sizes.find(s => s.tamanho === insertRegistration.tamanhoCamisa);
      }

      if (!shirtSize) {
        throw new Error(`Tamanho ${insertRegistration.tamanhoCamisa} nao disponivel para este evento/modalidade`);
      }

      if (shirtSize.quantidadeDisponivel <= 0) {
        throw new Error(`Tamanho ${shirtSize.tamanho} esgotado`);
      }

      await this.decrementShirtSize(shirtSize.id);
    }

    if (batch) {
      await db.update(registrationBatches)
        .set({ quantidadeUtilizada: batch.quantidadeUtilizada + 1 })
        .where(eq(registrationBatches.id, batch.id));
    }

    const [registration] = await db.insert(registrations).values(insertRegistration).returning();
    return registration;
  }

  async updateRegistration(id: string, registrationData: Partial<InsertRegistration>): Promise<Registration | undefined> {
    const [registration] = await db.update(registrations)
      .set(registrationData)
      .where(eq(registrations.id, id))
      .returning();
    return registration;
  }

  async getNextRegistrationNumber(eventId: string): Promise<number> {
    const result = await db.select({ maxNum: max(registrations.numeroInscricao) })
      .from(registrations)
      .where(eq(registrations.eventId, eventId));
    return (result[0]?.maxNum ?? 0) + 1;
  }

  async getDocumentAcceptancesByRegistration(registrationId: string): Promise<DocumentAcceptance[]> {
    return db.select().from(documentAcceptances).where(eq(documentAcceptances.registrationId, registrationId));
  }

  async createDocumentAcceptance(insertAcceptance: InsertDocumentAcceptance): Promise<DocumentAcceptance> {
    const [acceptance] = await db.insert(documentAcceptances).values(insertAcceptance).returning();
    return acceptance;
  }
}

export const storage = new DbStorage();
