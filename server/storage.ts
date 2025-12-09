import { db } from "./db";
import { 
  type User, type InsertUser, 
  type Lead, type InsertLead, 
  type Client, type InsertClient,
  type UploadSession, type InsertUploadSession,
  type ConsumptionProfile, type InsertConsumptionProfile,
  type QuoteRequest, type InsertQuoteRequest,
  type SupplierQuote, type InsertSupplierQuote,
  users, leads, clients, uploadSessions, consumptionProfiles, quoteRequests, supplierQuotes
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Leads
  createLead(lead: InsertLead): Promise<Lead>;
  getLeads(): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  updateLead(id: number, data: Partial<InsertLead>): Promise<Lead | undefined>;
  generatePortalToken(leadId: number): Promise<string>;
  getLeadByPortalToken(token: string): Promise<Lead | undefined>;
  
  // Clients
  createClient(client: InsertClient): Promise<Client>;
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  getClientByLeadId(leadId: number): Promise<Client | undefined>;
  updateClient(id: number, data: Partial<InsertClient>): Promise<Client | undefined>;
  createClientFromLead(leadId: number): Promise<Client>;
  
  // Upload Sessions
  createUploadSession(session: InsertUploadSession): Promise<UploadSession>;
  getUploadSessionByToken(token: string): Promise<UploadSession | undefined>;
  markUploadSessionUsed(id: number): Promise<void>;
  generateClientUploadLink(clientId: number): Promise<{ token: string; accessCode?: string }>;
  
  // Consumption Profiles
  createConsumptionProfile(profile: InsertConsumptionProfile): Promise<ConsumptionProfile>;
  getConsumptionProfiles(clientId: number): Promise<ConsumptionProfile[]>;
  getConsumptionProfile(id: number): Promise<ConsumptionProfile | undefined>;
  
  // Quote Requests (RFQs)
  createQuoteRequest(request: InsertQuoteRequest): Promise<QuoteRequest>;
  getQuoteRequests(): Promise<QuoteRequest[]>;
  getQuoteRequest(id: number): Promise<QuoteRequest | undefined>;
  updateQuoteRequest(id: number, data: Partial<InsertQuoteRequest>): Promise<QuoteRequest | undefined>;
  getQuoteRequestsForClient(clientId: number): Promise<QuoteRequest[]>;
  
  // Supplier Quotes
  createSupplierQuote(quote: InsertSupplierQuote): Promise<SupplierQuote>;
  getSupplierQuotes(rfqId: number): Promise<SupplierQuote[]>;
  updateSupplierQuote(id: number, data: Partial<InsertSupplierQuote>): Promise<SupplierQuote | undefined>;
  selectSupplierQuote(id: number): Promise<void>;
}

export class Storage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Leads
  async createLead(insertLead: InsertLead): Promise<Lead> {
    const result = await db.insert(leads).values(insertLead).returning();
    return result[0];
  }

  async getLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const result = await db.select().from(leads).where(eq(leads.id, id));
    return result[0];
  }

  async updateLead(id: number, data: Partial<InsertLead>): Promise<Lead | undefined> {
    const result = await db.update(leads).set(data).where(eq(leads.id, id)).returning();
    return result[0];
  }

  async generatePortalToken(leadId: number): Promise<string> {
    const token = randomBytes(32).toString("hex");
    await db.update(leads).set({ 
      portalToken: token, 
      portalSentAt: new Date() 
    }).where(eq(leads.id, leadId));
    return token;
  }

  async getLeadByPortalToken(token: string): Promise<Lead | undefined> {
    const result = await db.select().from(leads).where(eq(leads.portalToken, token));
    return result[0];
  }

  // Clients
  async createClient(insertClient: InsertClient): Promise<Client> {
    const result = await db.insert(clients).values(insertClient).returning();
    return result[0];
  }

  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id));
    return result[0];
  }

  async getClientByLeadId(leadId: number): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.leadId, leadId));
    return result[0];
  }

  async updateClient(id: number, data: Partial<InsertClient>): Promise<Client | undefined> {
    const result = await db.update(clients).set(data).where(eq(clients.id, id)).returning();
    return result[0];
  }

  async createClientFromLead(leadId: number): Promise<Client> {
    const lead = await this.getLead(leadId);
    if (!lead) throw new Error("Lead not found");
    
    const client = await this.createClient({
      leadId: lead.id,
      companyName: lead.companyName || lead.name,
      email: lead.email,
      phone: lead.phone || undefined,
      contactPerson: lead.name,
      status: "prospect"
    });
    return client;
  }

  // Upload Sessions
  async createUploadSession(session: InsertUploadSession): Promise<UploadSession> {
    const result = await db.insert(uploadSessions).values(session).returning();
    return result[0];
  }

  async getUploadSessionByToken(token: string): Promise<UploadSession | undefined> {
    const result = await db.select().from(uploadSessions).where(eq(uploadSessions.token, token));
    return result[0];
  }

  async markUploadSessionUsed(id: number): Promise<void> {
    await db.update(uploadSessions).set({ isUsed: true }).where(eq(uploadSessions.id, id));
  }

  async generateClientUploadLink(clientId: number): Promise<{ token: string; accessCode?: string }> {
    const token = randomBytes(32).toString("hex");
    const accessCode = Math.random().toString().slice(2, 8);
    
    await this.createUploadSession({
      clientId,
      token,
      accessCode,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    return { token, accessCode };
  }

  // Consumption Profiles
  async createConsumptionProfile(profile: InsertConsumptionProfile): Promise<ConsumptionProfile> {
    const result = await db.insert(consumptionProfiles).values(profile).returning();
    return result[0];
  }

  async getConsumptionProfiles(clientId: number): Promise<ConsumptionProfile[]> {
    return await db.select().from(consumptionProfiles).where(eq(consumptionProfiles.clientId, clientId));
  }

  async getConsumptionProfile(id: number): Promise<ConsumptionProfile | undefined> {
    const result = await db.select().from(consumptionProfiles).where(eq(consumptionProfiles.id, id));
    return result[0];
  }

  // Quote Requests
  async createQuoteRequest(request: InsertQuoteRequest): Promise<QuoteRequest> {
    const result = await db.insert(quoteRequests).values(request).returning();
    return result[0];
  }

  async getQuoteRequests(): Promise<QuoteRequest[]> {
    return await db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt));
  }

  async getQuoteRequest(id: number): Promise<QuoteRequest | undefined> {
    const result = await db.select().from(quoteRequests).where(eq(quoteRequests.id, id));
    return result[0];
  }

  async updateQuoteRequest(id: number, data: Partial<InsertQuoteRequest>): Promise<QuoteRequest | undefined> {
    const result = await db.update(quoteRequests).set(data).where(eq(quoteRequests.id, id)).returning();
    return result[0];
  }

  async getQuoteRequestsForClient(clientId: number): Promise<QuoteRequest[]> {
    return await db.select().from(quoteRequests).where(eq(quoteRequests.clientId, clientId));
  }

  // Supplier Quotes
  async createSupplierQuote(quote: InsertSupplierQuote): Promise<SupplierQuote> {
    const result = await db.insert(supplierQuotes).values(quote).returning();
    return result[0];
  }

  async getSupplierQuotes(rfqId: number): Promise<SupplierQuote[]> {
    return await db.select().from(supplierQuotes).where(eq(supplierQuotes.rfqId, rfqId));
  }

  async updateSupplierQuote(id: number, data: Partial<InsertSupplierQuote>): Promise<SupplierQuote | undefined> {
    const result = await db.update(supplierQuotes).set(data).where(eq(supplierQuotes.id, id)).returning();
    return result[0];
  }

  async selectSupplierQuote(id: number): Promise<void> {
    const quote = await db.select().from(supplierQuotes).where(eq(supplierQuotes.id, id));
    if (quote[0] && quote[0].rfqId) {
      await db.update(supplierQuotes).set({ isSelected: false }).where(eq(supplierQuotes.rfqId, quote[0].rfqId));
      await db.update(supplierQuotes).set({ isSelected: true }).where(eq(supplierQuotes.id, id));
    }
  }
}

export const storage = new Storage();
