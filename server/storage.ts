import {
  type Organizer, type InsertOrganizer,
  type Event, type InsertEvent,
  type Modality, type InsertModality,
  type ShirtSize, type InsertShirtSize,
  type RegistrationBatch, type InsertRegistrationBatch,
  type Price, type InsertPrice,
  type Attachment, type InsertAttachment,
  type Athlete, type InsertAthlete,
  type Registration, type InsertRegistration,
  type DocumentAcceptance, type InsertDocumentAcceptance,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getOrganizer(id: string): Promise<Organizer | undefined>;
  getOrganizers(): Promise<Organizer[]>;
  createOrganizer(organizer: InsertOrganizer): Promise<Organizer>;

  getEvent(id: string): Promise<Event | undefined>;
  getEventBySlug(slug: string): Promise<Event | undefined>;
  getEvents(): Promise<Event[]>;
  getEventsByOrganizer(organizerId: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;

  getModality(id: string): Promise<Modality | undefined>;
  getModalitiesByEvent(eventId: string): Promise<Modality[]>;
  createModality(modality: InsertModality): Promise<Modality>;
  updateModality(id: string, modality: Partial<InsertModality>): Promise<Modality | undefined>;
  deleteModality(id: string): Promise<boolean>;

  getShirtSizesByEvent(eventId: string): Promise<ShirtSize[]>;
  getShirtSizesByModality(modalityId: string): Promise<ShirtSize[]>;
  createShirtSize(shirtSize: InsertShirtSize): Promise<ShirtSize>;
  updateShirtSize(id: string, shirtSize: Partial<InsertShirtSize>): Promise<ShirtSize | undefined>;
  decrementShirtSize(id: string): Promise<boolean>;

  getBatchesByEvent(eventId: string): Promise<RegistrationBatch[]>;
  getActiveBatch(eventId: string): Promise<RegistrationBatch | undefined>;
  createBatch(batch: InsertRegistrationBatch): Promise<RegistrationBatch>;
  updateBatch(id: string, batch: Partial<InsertRegistrationBatch>): Promise<RegistrationBatch | undefined>;

  getPrice(modalityId: string, batchId: string): Promise<Price | undefined>;
  getPricesByModality(modalityId: string): Promise<Price[]>;
  getPricesByBatch(batchId: string): Promise<Price[]>;
  createPrice(price: InsertPrice): Promise<Price>;
  updatePrice(id: string, price: Partial<InsertPrice>): Promise<Price | undefined>;

  getAttachmentsByEvent(eventId: string): Promise<Attachment[]>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  deleteAttachment(id: string): Promise<boolean>;

  getAthlete(id: string): Promise<Athlete | undefined>;
  getAthleteByCpf(cpf: string): Promise<Athlete | undefined>;
  createAthlete(athlete: InsertAthlete): Promise<Athlete>;
  updateAthlete(id: string, athlete: Partial<InsertAthlete>): Promise<Athlete | undefined>;

  getRegistration(id: string): Promise<Registration | undefined>;
  getRegistrationsByEvent(eventId: string): Promise<Registration[]>;
  getRegistrationsByAthlete(athleteId: string): Promise<Registration[]>;
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  updateRegistration(id: string, registration: Partial<InsertRegistration>): Promise<Registration | undefined>;

  getDocumentAcceptancesByRegistration(registrationId: string): Promise<DocumentAcceptance[]>;
  createDocumentAcceptance(acceptance: InsertDocumentAcceptance): Promise<DocumentAcceptance>;
}

export class MemStorage implements IStorage {
  private organizers: Map<string, Organizer> = new Map();
  private events: Map<string, Event> = new Map();
  private modalities: Map<string, Modality> = new Map();
  private shirtSizes: Map<string, ShirtSize> = new Map();
  private batches: Map<string, RegistrationBatch> = new Map();
  private prices: Map<string, Price> = new Map();
  private attachments: Map<string, Attachment> = new Map();
  private athletes: Map<string, Athlete> = new Map();
  private registrations: Map<string, Registration> = new Map();
  private documentAcceptances: Map<string, DocumentAcceptance> = new Map();

  async getOrganizer(id: string): Promise<Organizer | undefined> {
    return this.organizers.get(id);
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

  async decrementShirtSize(id: string): Promise<boolean> {
    const shirtSize = this.shirtSizes.get(id);
    if (!shirtSize || shirtSize.quantidadeDisponivel <= 0) return false;
    shirtSize.quantidadeDisponivel--;
    return true;
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

  async getPrice(modalityId: string, batchId: string): Promise<Price | undefined> {
    return Array.from(this.prices.values()).find(p => p.modalityId === modalityId && p.batchId === batchId);
  }

  async getPricesByModality(modalityId: string): Promise<Price[]> {
    return Array.from(this.prices.values()).filter(p => p.modalityId === modalityId);
  }

  async getPricesByBatch(batchId: string): Promise<Price[]> {
    return Array.from(this.prices.values()).filter(p => p.batchId === batchId);
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

  async getRegistration(id: string): Promise<Registration | undefined> {
    return this.registrations.get(id);
  }

  async getRegistrationsByEvent(eventId: string): Promise<Registration[]> {
    return Array.from(this.registrations.values()).filter(r => r.eventId === eventId);
  }

  async getRegistrationsByAthlete(athleteId: string): Promise<Registration[]> {
    return Array.from(this.registrations.values()).filter(r => r.athleteId === athleteId);
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
      codigoVoucher: insertRegistration.codigoVoucher ?? null,
      dataPagamento: insertRegistration.dataPagamento ?? null,
      idPagamentoGateway: insertRegistration.idPagamentoGateway ?? null,
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
