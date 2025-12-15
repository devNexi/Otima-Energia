import { db } from "./db";
import { 
  type User, type InsertUser, 
  type Lead, type InsertLead, 
  type Client, type InsertClient,
  type UploadSession, type InsertUploadSession,
  type ConsumptionProfile, type InsertConsumptionProfile,
  type QuoteRequest, type InsertQuoteRequest,
  type SupplierQuote, type InsertSupplierQuote,
  type BillUpload, type InsertBillUpload,
  type Supplier, type InsertSupplier,
  type RfoRequest, type InsertRfoRequest, type UpdateRfoRequest,
  type RfoSupplierTracking, type InsertRfoSupplierTracking,
  type SupplierContact, type InsertSupplierContact,
  type SupplierPortal, type InsertSupplierPortal,
  type RfoTemplate, type InsertRfoTemplate,
  type Proposal, type InsertProposal,
  type ProposalTemplate, type InsertProposalTemplate,
  type ProposalView, type InsertProposalView,
  type ClientContract, type InsertClientContract,
  type MarketPriceBenchmark, type InsertMarketPriceBenchmark,
  type EcosSettings, type InsertEcosSettings,
  type EcosDecisionLog, type InsertEcosDecisionLog,
  type QuarterlyReport, type InsertQuarterlyReport,
  type AdminAuditLog, type InsertAdminAuditLog,
  type AdminSession, type InsertAdminSession,
  type PortalAccessLog, type InsertPortalAccessLog,
  users, leads, clients, uploadSessions, consumptionProfiles, quoteRequests, supplierQuotes, billUploads, suppliers,
  rfoRequests, rfoSupplierTracking, supplierContacts, supplierPortals, rfoTemplates,
  proposals, proposalTemplates, proposalViews,
  clientContracts, marketPriceBenchmarks, ecosSettings, ecosDecisionLogs, quarterlyReports,
  adminAuditLog, adminSessions, portalAccessLogs
} from "@shared/schema";
import { eq, desc, and, sql, lte, gte } from "drizzle-orm";
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
  
  // Suppliers (Master List)
  getSuppliers(): Promise<Supplier[]>;
  getActiveSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  
  // Supplier Quotes
  createSupplierQuote(quote: InsertSupplierQuote): Promise<SupplierQuote>;
  getSupplierQuotes(rfqId: number): Promise<SupplierQuote[]>;
  getSupplierQuotesForClient(clientId: number): Promise<SupplierQuote[]>;
  getSupplierQuote(id: number): Promise<SupplierQuote | undefined>;
  updateSupplierQuote(id: number, data: Partial<InsertSupplierQuote>): Promise<SupplierQuote | undefined>;
  selectSupplierQuote(id: number): Promise<void>;
  markQuoteAsWon(id: number, clientId: number): Promise<void>;
  
  // Bill Uploads
  createBillUpload(billUpload: InsertBillUpload): Promise<BillUpload>;
  getBillUploads(clientId: number): Promise<BillUpload[]>;
  getBillUpload(id: number): Promise<BillUpload | undefined>;
  updateBillUpload(id: number, data: Partial<InsertBillUpload>): Promise<BillUpload | undefined>;
  
  // RFO Requests
  createRfoRequest(rfo: InsertRfoRequest): Promise<RfoRequest>;
  getRfoRequests(): Promise<RfoRequest[]>;
  getRfoRequestsForClient(clientId: number): Promise<RfoRequest[]>;
  getRfoRequest(id: number): Promise<RfoRequest | undefined>;
  getRfoRequestByNumber(rfoNumber: string): Promise<RfoRequest | undefined>;
  updateRfoRequest(id: number, data: UpdateRfoRequest): Promise<RfoRequest | undefined>;
  generateRfoNumber(): Promise<string>;
  
  // RFO Supplier Tracking
  createRfoSupplierTracking(tracking: InsertRfoSupplierTracking): Promise<RfoSupplierTracking>;
  getRfoSupplierTracking(rfoId: number): Promise<RfoSupplierTracking[]>;
  getRfoSupplierTrackingById(id: number): Promise<RfoSupplierTracking | undefined>;
  updateRfoSupplierTracking(id: number, data: Partial<InsertRfoSupplierTracking>): Promise<RfoSupplierTracking | undefined>;
  markRfoSupplierResponded(trackingId: number, quoteId: number): Promise<void>;
  
  // Supplier Contacts
  createSupplierContact(contact: InsertSupplierContact): Promise<SupplierContact>;
  getSupplierContacts(supplierId: number): Promise<SupplierContact[]>;
  getPrimarySupplierContact(supplierId: number): Promise<SupplierContact | undefined>;
  getAllActiveSupplierContacts(): Promise<SupplierContact[]>;
  updateSupplierContact(id: number, data: Partial<InsertSupplierContact>): Promise<SupplierContact | undefined>;
  deleteSupplierContact(id: number): Promise<void>;
  markContactContacted(id: number): Promise<void>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  getSuppliersWithContacts(): Promise<(Supplier & { contacts: SupplierContact[] })[]>;
  
  // Supplier Portals
  createSupplierPortal(portal: InsertSupplierPortal): Promise<SupplierPortal>;
  getSupplierPortals(supplierId: number): Promise<SupplierPortal[]>;
  updateSupplierPortal(id: number, data: Partial<InsertSupplierPortal>): Promise<SupplierPortal | undefined>;
  deleteSupplierPortal(id: number): Promise<void>;
  
  // RFO Templates
  getRfoTemplates(): Promise<RfoTemplate[]>;
  getActiveRfoTemplates(): Promise<RfoTemplate[]>;
  getRfoTemplateByFormat(formatType: string): Promise<RfoTemplate | undefined>;
  createRfoTemplate(template: InsertRfoTemplate): Promise<RfoTemplate>;
  updateRfoTemplate(id: number, data: Partial<InsertRfoTemplate>): Promise<RfoTemplate | undefined>;
  
  // Proposals
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  getProposals(): Promise<Proposal[]>;
  getProposal(id: number): Promise<Proposal | undefined>;
  getProposalByToken(token: string): Promise<Proposal | undefined>;
  getProposalByNumber(proposalNumber: string): Promise<Proposal | undefined>;
  getProposalsForClient(clientId: number): Promise<Proposal[]>;
  updateProposal(id: number, data: Partial<InsertProposal>): Promise<Proposal | undefined>;
  updateProposalStatus(id: number, status: string): Promise<Proposal | undefined>;
  generateProposalNumber(): Promise<string>;
  incrementProposalViews(id: number): Promise<void>;
  
  // Proposal Views
  recordProposalView(view: InsertProposalView): Promise<ProposalView>;
  getProposalViews(proposalId: number): Promise<ProposalView[]>;
  
  // Proposal Templates
  getProposalTemplates(): Promise<ProposalTemplate[]>;
  getDefaultProposalTemplate(templateType: string): Promise<ProposalTemplate | undefined>;
  
  // ECOS - Client Contracts
  createClientContract(contract: InsertClientContract): Promise<ClientContract>;
  getClientContracts(clientId: number): Promise<ClientContract[]>;
  getActiveClientContract(clientId: number): Promise<ClientContract | undefined>;
  getClientContract(id: number): Promise<ClientContract | undefined>;
  updateClientContract(id: number, data: Partial<InsertClientContract>): Promise<ClientContract | undefined>;
  getExpiringContracts(withinDays: number): Promise<ClientContract[]>;
  
  // ECOS - Market Price Benchmarks
  createBenchmark(benchmark: InsertMarketPriceBenchmark): Promise<MarketPriceBenchmark>;
  getBenchmarks(): Promise<MarketPriceBenchmark[]>;
  getActiveBenchmarks(): Promise<MarketPriceBenchmark[]>;
  getBenchmark(id: number): Promise<MarketPriceBenchmark | undefined>;
  getBenchmarkForClient(segment: string, region: string, contractMonths: number): Promise<MarketPriceBenchmark | undefined>;
  updateBenchmark(id: number, data: Partial<InsertMarketPriceBenchmark>): Promise<MarketPriceBenchmark | undefined>;
  
  // ECOS - Settings
  getEcosSettings(segment: string): Promise<EcosSettings | undefined>;
  getAllEcosSettings(): Promise<EcosSettings[]>;
  upsertEcosSettings(settings: InsertEcosSettings): Promise<EcosSettings>;
  
  // ECOS - Decision Logs
  createDecisionLog(log: InsertEcosDecisionLog): Promise<EcosDecisionLog>;
  getDecisionLogs(clientId: number): Promise<EcosDecisionLog[]>;
  getDecisionLog(id: number): Promise<EcosDecisionLog | undefined>;
  getLatestDecisionLog(clientId: number): Promise<EcosDecisionLog | undefined>;
  updateDecisionLog(id: number, data: Partial<InsertEcosDecisionLog>): Promise<EcosDecisionLog | undefined>;
  getDecisionLogsByStatus(status: string): Promise<EcosDecisionLog[]>;
  
  // ECOS - Quarterly Reports
  createQuarterlyReport(report: InsertQuarterlyReport): Promise<QuarterlyReport>;
  getQuarterlyReports(clientId: number): Promise<QuarterlyReport[]>;
  getQuarterlyReport(id: number): Promise<QuarterlyReport | undefined>;
  updateQuarterlyReport(id: number, data: Partial<InsertQuarterlyReport>): Promise<QuarterlyReport | undefined>;
  getPendingApprovalReports(): Promise<QuarterlyReport[]>;
  approveReport(id: number, approvedBy: string): Promise<QuarterlyReport | undefined>;
  
  // ECOS - Admin Audit Log
  logAdminAction(log: InsertAdminAuditLog): Promise<AdminAuditLog>;
  getAdminAuditLogs(limit?: number): Promise<AdminAuditLog[]>;
  
  // ECOS - Admin Sessions  
  createAdminSession(session: InsertAdminSession): Promise<AdminSession>;
  getAdminSession(id: string): Promise<AdminSession | undefined>;
  deleteAdminSession(id: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
  
  // ECOS - Portal Access Logs
  logPortalAccess(log: InsertPortalAccessLog): Promise<PortalAccessLog>;
  getPortalAccessLogs(clientId: number): Promise<PortalAccessLog[]>;
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

  // Suppliers (Master List)
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(suppliers.name);
  }

  async getActiveSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(suppliers.name);
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const result = await db.insert(suppliers).values(supplier).returning();
    return result[0];
  }

  // Supplier Quotes
  async createSupplierQuote(quote: InsertSupplierQuote): Promise<SupplierQuote> {
    const result = await db.insert(supplierQuotes).values(quote).returning();
    return result[0];
  }

  async getSupplierQuotes(rfqId: number): Promise<SupplierQuote[]> {
    return await db.select().from(supplierQuotes).where(eq(supplierQuotes.rfqId, rfqId));
  }

  async getSupplierQuotesForClient(clientId: number): Promise<SupplierQuote[]> {
    return await db.select().from(supplierQuotes)
      .where(eq(supplierQuotes.clientId, clientId))
      .orderBy(desc(supplierQuotes.createdAt));
  }

  async getSupplierQuote(id: number): Promise<SupplierQuote | undefined> {
    const result = await db.select().from(supplierQuotes).where(eq(supplierQuotes.id, id));
    return result[0];
  }

  async updateSupplierQuote(id: number, data: Partial<InsertSupplierQuote>): Promise<SupplierQuote | undefined> {
    const result = await db.update(supplierQuotes).set({ ...data, updatedAt: new Date() }).where(eq(supplierQuotes.id, id)).returning();
    return result[0];
  }

  async selectSupplierQuote(id: number): Promise<void> {
    const quote = await db.select().from(supplierQuotes).where(eq(supplierQuotes.id, id));
    if (quote[0] && quote[0].rfqId) {
      await db.update(supplierQuotes).set({ status: "active" }).where(eq(supplierQuotes.rfqId, quote[0].rfqId));
      await db.update(supplierQuotes).set({ status: "won" }).where(eq(supplierQuotes.id, id));
    }
  }

  async markQuoteAsWon(id: number, clientId: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.update(supplierQuotes).set({ status: "lost" }).where(eq(supplierQuotes.clientId, clientId));
      await tx.update(supplierQuotes).set({ status: "won" }).where(eq(supplierQuotes.id, id));
      await tx.update(clients).set({ selectedQuoteId: id, status: "active" }).where(eq(clients.id, clientId));
    });
  }

  // Bill Uploads
  async createBillUpload(billUpload: InsertBillUpload): Promise<BillUpload> {
    const result = await db.insert(billUploads).values(billUpload).returning();
    return result[0];
  }

  async getBillUploads(clientId: number): Promise<BillUpload[]> {
    return await db.select().from(billUploads).where(eq(billUploads.clientId, clientId)).orderBy(desc(billUploads.createdAt));
  }

  async getBillUpload(id: number): Promise<BillUpload | undefined> {
    const result = await db.select().from(billUploads).where(eq(billUploads.id, id));
    return result[0];
  }

  async updateBillUpload(id: number, data: Partial<InsertBillUpload>): Promise<BillUpload | undefined> {
    const result = await db.update(billUploads).set({ ...data, updatedAt: new Date() }).where(eq(billUploads.id, id)).returning();
    return result[0];
  }

  // RFO Requests
  async createRfoRequest(rfo: InsertRfoRequest): Promise<RfoRequest> {
    const result = await db.insert(rfoRequests).values(rfo).returning();
    return result[0];
  }

  async getRfoRequests(): Promise<RfoRequest[]> {
    return await db.select().from(rfoRequests).orderBy(desc(rfoRequests.createdAt));
  }

  async getRfoRequestsForClient(clientId: number): Promise<RfoRequest[]> {
    return await db.select().from(rfoRequests).where(eq(rfoRequests.clientId, clientId)).orderBy(desc(rfoRequests.createdAt));
  }

  async getRfoRequest(id: number): Promise<RfoRequest | undefined> {
    const result = await db.select().from(rfoRequests).where(eq(rfoRequests.id, id));
    return result[0];
  }

  async getRfoRequestByNumber(rfoNumber: string): Promise<RfoRequest | undefined> {
    const result = await db.select().from(rfoRequests).where(eq(rfoRequests.rfoNumber, rfoNumber));
    return result[0];
  }

  async updateRfoRequest(id: number, data: UpdateRfoRequest): Promise<RfoRequest | undefined> {
    const result = await db.update(rfoRequests).set({ ...data, updatedAt: new Date() }).where(eq(rfoRequests.id, id)).returning();
    return result[0];
  }

  async generateRfoNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `RFO-${year}${month}${day}`;
    
    const existing = await db.select({ rfoNumber: rfoRequests.rfoNumber })
      .from(rfoRequests)
      .where(sql`${rfoRequests.rfoNumber} LIKE ${datePrefix + '%'}`)
      .orderBy(desc(rfoRequests.rfoNumber))
      .limit(1);
    
    let sequence = 1;
    if (existing.length > 0) {
      const lastNumber = existing[0].rfoNumber;
      const lastSequence = parseInt(lastNumber.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }
    
    return `${datePrefix}-${String(sequence).padStart(3, '0')}`;
  }

  // RFO Supplier Tracking
  async createRfoSupplierTracking(tracking: InsertRfoSupplierTracking): Promise<RfoSupplierTracking> {
    const result = await db.insert(rfoSupplierTracking).values(tracking).returning();
    return result[0];
  }

  async getRfoSupplierTracking(rfoId: number): Promise<RfoSupplierTracking[]> {
    return await db.select().from(rfoSupplierTracking).where(eq(rfoSupplierTracking.rfoId, rfoId));
  }

  async getRfoSupplierTrackingById(id: number): Promise<RfoSupplierTracking | undefined> {
    const result = await db.select().from(rfoSupplierTracking).where(eq(rfoSupplierTracking.id, id));
    return result[0];
  }

  async updateRfoSupplierTracking(id: number, data: Partial<InsertRfoSupplierTracking>): Promise<RfoSupplierTracking | undefined> {
    const result = await db.update(rfoSupplierTracking).set({ ...data, updatedAt: new Date() }).where(eq(rfoSupplierTracking.id, id)).returning();
    return result[0];
  }

  async markRfoSupplierResponded(trackingId: number, quoteId: number): Promise<void> {
    await db.transaction(async (tx) => {
      const tracking = await tx.select().from(rfoSupplierTracking).where(eq(rfoSupplierTracking.id, trackingId));
      if (!tracking[0]) return;
      
      await tx.update(rfoSupplierTracking).set({
        responseStatus: 'responded',
        responseDate: new Date(),
        responseQuoteId: quoteId,
        updatedAt: new Date()
      }).where(eq(rfoSupplierTracking.id, trackingId));
      
      const rfoId = tracking[0].rfoId;
      await tx.update(rfoRequests).set({
        responseCount: sql`${rfoRequests.responseCount} + 1`,
        updatedAt: new Date()
      }).where(eq(rfoRequests.id, rfoId));
      
      const allTracking = await tx.select().from(rfoSupplierTracking).where(eq(rfoSupplierTracking.rfoId, rfoId));
      const allResponded = allTracking.every(t => t.responseStatus !== 'waiting');
      
      if (allResponded) {
        await tx.update(rfoRequests).set({ status: 'complete', updatedAt: new Date() }).where(eq(rfoRequests.id, rfoId));
      } else {
        await tx.update(rfoRequests).set({ status: 'partial_response', updatedAt: new Date() }).where(eq(rfoRequests.id, rfoId));
      }
    });
  }

  // Supplier Contacts
  async createSupplierContact(contact: InsertSupplierContact): Promise<SupplierContact> {
    const result = await db.insert(supplierContacts).values(contact).returning();
    return result[0];
  }

  async getSupplierContacts(supplierId: number): Promise<SupplierContact[]> {
    return await db.select().from(supplierContacts).where(eq(supplierContacts.supplierId, supplierId));
  }

  async getPrimarySupplierContact(supplierId: number): Promise<SupplierContact | undefined> {
    const result = await db.select().from(supplierContacts)
      .where(and(eq(supplierContacts.supplierId, supplierId), eq(supplierContacts.isPrimary, true)));
    if (result.length > 0) return result[0];
    
    const anyContact = await db.select().from(supplierContacts)
      .where(and(eq(supplierContacts.supplierId, supplierId), eq(supplierContacts.isActive, true)))
      .limit(1);
    return anyContact[0];
  }

  async getAllActiveSupplierContacts(): Promise<SupplierContact[]> {
    return await db.select().from(supplierContacts).where(eq(supplierContacts.isActive, true));
  }

  async updateSupplierContact(id: number, data: Partial<InsertSupplierContact>): Promise<SupplierContact | undefined> {
    const result = await db.update(supplierContacts).set({ ...data, updatedAt: new Date() }).where(eq(supplierContacts.id, id)).returning();
    return result[0];
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const result = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return result[0];
  }

  async deleteSupplierContact(id: number): Promise<void> {
    await db.delete(supplierContacts).where(eq(supplierContacts.id, id));
  }

  async markContactContacted(id: number): Promise<void> {
    await db.update(supplierContacts).set({ 
      lastContacted: new Date(),
      updatedAt: new Date()
    }).where(eq(supplierContacts.id, id));
  }

  async getSuppliersWithContacts(): Promise<(Supplier & { contacts: SupplierContact[] })[]> {
    const allSuppliers = await db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(suppliers.name);
    const allContacts = await db.select().from(supplierContacts).where(eq(supplierContacts.isActive, true));
    
    return allSuppliers.map(supplier => ({
      ...supplier,
      contacts: allContacts.filter(c => c.supplierId === supplier.id)
    }));
  }

  // Supplier Portals
  async createSupplierPortal(portal: InsertSupplierPortal): Promise<SupplierPortal> {
    const result = await db.insert(supplierPortals).values(portal).returning();
    return result[0];
  }

  async getSupplierPortals(supplierId: number): Promise<SupplierPortal[]> {
    return await db.select().from(supplierPortals).where(eq(supplierPortals.supplierId, supplierId));
  }

  async updateSupplierPortal(id: number, data: Partial<InsertSupplierPortal>): Promise<SupplierPortal | undefined> {
    const result = await db.update(supplierPortals).set(data).where(eq(supplierPortals.id, id)).returning();
    return result[0];
  }

  async deleteSupplierPortal(id: number): Promise<void> {
    await db.delete(supplierPortals).where(eq(supplierPortals.id, id));
  }

  // RFO Templates
  async getRfoTemplates(): Promise<RfoTemplate[]> {
    return await db.select().from(rfoTemplates).orderBy(rfoTemplates.name);
  }

  async getActiveRfoTemplates(): Promise<RfoTemplate[]> {
    return await db.select().from(rfoTemplates).where(eq(rfoTemplates.isActive, true)).orderBy(rfoTemplates.name);
  }

  async getRfoTemplateByFormat(formatType: string): Promise<RfoTemplate | undefined> {
    const result = await db.select().from(rfoTemplates)
      .where(and(eq(rfoTemplates.formatType, formatType), eq(rfoTemplates.isActive, true)))
      .limit(1);
    return result[0];
  }

  async createRfoTemplate(template: InsertRfoTemplate): Promise<RfoTemplate> {
    const result = await db.insert(rfoTemplates).values(template).returning();
    return result[0];
  }

  async updateRfoTemplate(id: number, data: Partial<InsertRfoTemplate>): Promise<RfoTemplate | undefined> {
    const result = await db.update(rfoTemplates).set(data).where(eq(rfoTemplates.id, id)).returning();
    return result[0];
  }

  // Proposals
  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const result = await db.insert(proposals).values(proposal).returning();
    return result[0];
  }

  async getProposals(): Promise<Proposal[]> {
    return await db.select().from(proposals).orderBy(desc(proposals.createdAt));
  }

  async getProposal(id: number): Promise<Proposal | undefined> {
    const result = await db.select().from(proposals).where(eq(proposals.id, id));
    return result[0];
  }

  async getProposalByToken(token: string): Promise<Proposal | undefined> {
    const result = await db.select().from(proposals).where(eq(proposals.trackingToken, token));
    return result[0];
  }

  async getProposalByNumber(proposalNumber: string): Promise<Proposal | undefined> {
    const result = await db.select().from(proposals).where(eq(proposals.proposalNumber, proposalNumber));
    return result[0];
  }

  async getProposalsForClient(clientId: number): Promise<Proposal[]> {
    return await db.select().from(proposals).where(eq(proposals.clientId, clientId)).orderBy(desc(proposals.createdAt));
  }

  async updateProposal(id: number, data: Partial<InsertProposal>): Promise<Proposal | undefined> {
    const result = await db.update(proposals).set({ ...data, updatedAt: new Date() }).where(eq(proposals.id, id)).returning();
    return result[0];
  }

  async updateProposalStatus(id: number, status: string): Promise<Proposal | undefined> {
    const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
    if (status === 'sent') updateData.sentDate = new Date();
    if (status === 'accepted' || status === 'rejected') updateData.responseDate = new Date();
    
    const result = await db.update(proposals).set(updateData).where(eq(proposals.id, id)).returning();
    return result[0];
  }

  async generateProposalNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(proposals)
      .where(sql`to_char(created_at, 'YYYY-MM') = ${`${year}-${month}`}`);
    
    const count = (countResult[0]?.count || 0) + 1;
    return `PROP-${year}${month}-${String(count).padStart(3, '0')}`;
  }

  async incrementProposalViews(id: number): Promise<void> {
    await db.update(proposals).set({
      viewedCount: sql`COALESCE(viewed_count, 0) + 1`,
      lastViewed: new Date(),
      viewedDate: sql`COALESCE(viewed_date, NOW())`,
      status: sql`CASE WHEN status = 'sent' THEN 'viewed' ELSE status END`,
      updatedAt: new Date()
    }).where(eq(proposals.id, id));
  }

  // Proposal Views
  async recordProposalView(view: InsertProposalView): Promise<ProposalView> {
    const result = await db.insert(proposalViews).values(view).returning();
    await this.incrementProposalViews(view.proposalId);
    return result[0];
  }

  async getProposalViews(proposalId: number): Promise<ProposalView[]> {
    return await db.select().from(proposalViews).where(eq(proposalViews.proposalId, proposalId)).orderBy(desc(proposalViews.viewDate));
  }

  // Proposal Templates
  async getProposalTemplates(): Promise<ProposalTemplate[]> {
    return await db.select().from(proposalTemplates).where(eq(proposalTemplates.isActive, true)).orderBy(proposalTemplates.name);
  }

  async getDefaultProposalTemplate(templateType: string): Promise<ProposalTemplate | undefined> {
    const result = await db.select().from(proposalTemplates)
      .where(and(eq(proposalTemplates.templateType, templateType), eq(proposalTemplates.isDefault, true), eq(proposalTemplates.isActive, true)))
      .limit(1);
    return result[0];
  }

  // ============================================
  // ECOS - Energy Contract Operating System
  // ============================================

  // Client Contracts
  async createClientContract(contract: InsertClientContract): Promise<ClientContract> {
    const result = await db.insert(clientContracts).values(contract).returning();
    return result[0];
  }

  async getClientContracts(clientId: number): Promise<ClientContract[]> {
    return await db.select().from(clientContracts)
      .where(eq(clientContracts.clientId, clientId))
      .orderBy(desc(clientContracts.createdAt));
  }

  async getActiveClientContract(clientId: number): Promise<ClientContract | undefined> {
    const result = await db.select().from(clientContracts)
      .where(and(eq(clientContracts.clientId, clientId), eq(clientContracts.status, 'active')))
      .orderBy(desc(clientContracts.contractEnd))
      .limit(1);
    return result[0];
  }

  async getClientContract(id: number): Promise<ClientContract | undefined> {
    const result = await db.select().from(clientContracts).where(eq(clientContracts.id, id));
    return result[0];
  }

  async updateClientContract(id: number, data: Partial<InsertClientContract>): Promise<ClientContract | undefined> {
    const result = await db.update(clientContracts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clientContracts.id, id))
      .returning();
    return result[0];
  }

  async getExpiringContracts(withinDays: number): Promise<ClientContract[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);
    return await db.select().from(clientContracts)
      .where(and(
        eq(clientContracts.status, 'active'),
        lte(clientContracts.contractEnd, futureDate.toISOString().split('T')[0])
      ))
      .orderBy(clientContracts.contractEnd);
  }

  // Market Price Benchmarks
  async createBenchmark(benchmark: InsertMarketPriceBenchmark): Promise<MarketPriceBenchmark> {
    const result = await db.insert(marketPriceBenchmarks).values(benchmark).returning();
    return result[0];
  }

  async getBenchmarks(): Promise<MarketPriceBenchmark[]> {
    return await db.select().from(marketPriceBenchmarks).orderBy(desc(marketPriceBenchmarks.effectiveDate));
  }

  async getActiveBenchmarks(): Promise<MarketPriceBenchmark[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db.select().from(marketPriceBenchmarks)
      .where(and(
        lte(marketPriceBenchmarks.effectiveDate, today),
        sql`(${marketPriceBenchmarks.expiresAt} IS NULL OR ${marketPriceBenchmarks.expiresAt} >= ${today})`
      ))
      .orderBy(desc(marketPriceBenchmarks.effectiveDate));
  }

  async getBenchmark(id: number): Promise<MarketPriceBenchmark | undefined> {
    const result = await db.select().from(marketPriceBenchmarks).where(eq(marketPriceBenchmarks.id, id));
    return result[0];
  }

  async getBenchmarkForClient(segment: string, region: string, contractMonths: number): Promise<MarketPriceBenchmark | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.select().from(marketPriceBenchmarks)
      .where(and(
        eq(marketPriceBenchmarks.segment, segment),
        eq(marketPriceBenchmarks.region, region),
        eq(marketPriceBenchmarks.contractLengthMonths, contractMonths),
        lte(marketPriceBenchmarks.effectiveDate, today),
        sql`(${marketPriceBenchmarks.expiresAt} IS NULL OR ${marketPriceBenchmarks.expiresAt} >= ${today})`
      ))
      .orderBy(desc(marketPriceBenchmarks.effectiveDate))
      .limit(1);
    return result[0];
  }

  async updateBenchmark(id: number, data: Partial<InsertMarketPriceBenchmark>): Promise<MarketPriceBenchmark | undefined> {
    const result = await db.update(marketPriceBenchmarks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(marketPriceBenchmarks.id, id))
      .returning();
    return result[0];
  }

  // ECOS Settings
  async getEcosSettings(segment: string): Promise<EcosSettings | undefined> {
    const result = await db.select().from(ecosSettings).where(eq(ecosSettings.segment, segment));
    return result[0];
  }

  async getAllEcosSettings(): Promise<EcosSettings[]> {
    return await db.select().from(ecosSettings);
  }

  async upsertEcosSettings(settings: InsertEcosSettings): Promise<EcosSettings> {
    const existing = await this.getEcosSettings(settings.segment);
    if (existing) {
      const result = await db.update(ecosSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(ecosSettings.segment, settings.segment))
        .returning();
      return result[0];
    }
    const result = await db.insert(ecosSettings).values(settings).returning();
    return result[0];
  }

  // Decision Logs
  async createDecisionLog(log: InsertEcosDecisionLog): Promise<EcosDecisionLog> {
    const result = await db.insert(ecosDecisionLogs).values(log).returning();
    return result[0];
  }

  async getDecisionLogs(clientId: number): Promise<EcosDecisionLog[]> {
    return await db.select().from(ecosDecisionLogs)
      .where(eq(ecosDecisionLogs.clientId, clientId))
      .orderBy(desc(ecosDecisionLogs.decisionDate));
  }

  async getDecisionLog(id: number): Promise<EcosDecisionLog | undefined> {
    const result = await db.select().from(ecosDecisionLogs).where(eq(ecosDecisionLogs.id, id));
    return result[0];
  }

  async getLatestDecisionLog(clientId: number): Promise<EcosDecisionLog | undefined> {
    const result = await db.select().from(ecosDecisionLogs)
      .where(eq(ecosDecisionLogs.clientId, clientId))
      .orderBy(desc(ecosDecisionLogs.decisionDate))
      .limit(1);
    return result[0];
  }

  async updateDecisionLog(id: number, data: Partial<InsertEcosDecisionLog>): Promise<EcosDecisionLog | undefined> {
    const result = await db.update(ecosDecisionLogs)
      .set(data)
      .where(eq(ecosDecisionLogs.id, id))
      .returning();
    return result[0];
  }

  async getDecisionLogsByStatus(status: string): Promise<EcosDecisionLog[]> {
    return await db.select().from(ecosDecisionLogs)
      .where(eq(ecosDecisionLogs.statusResult, status))
      .orderBy(desc(ecosDecisionLogs.decisionDate));
  }

  // Quarterly Reports
  async createQuarterlyReport(report: InsertQuarterlyReport): Promise<QuarterlyReport> {
    const result = await db.insert(quarterlyReports).values(report).returning();
    return result[0];
  }

  async getQuarterlyReports(clientId: number): Promise<QuarterlyReport[]> {
    return await db.select().from(quarterlyReports)
      .where(eq(quarterlyReports.clientId, clientId))
      .orderBy(desc(quarterlyReports.periodEnd));
  }

  async getQuarterlyReport(id: number): Promise<QuarterlyReport | undefined> {
    const result = await db.select().from(quarterlyReports).where(eq(quarterlyReports.id, id));
    return result[0];
  }

  async updateQuarterlyReport(id: number, data: Partial<InsertQuarterlyReport>): Promise<QuarterlyReport | undefined> {
    const result = await db.update(quarterlyReports)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(quarterlyReports.id, id))
      .returning();
    return result[0];
  }

  async getPendingApprovalReports(): Promise<QuarterlyReport[]> {
    return await db.select().from(quarterlyReports)
      .where(eq(quarterlyReports.approved, false))
      .orderBy(quarterlyReports.periodEnd);
  }

  async approveReport(id: number, approvedBy: string): Promise<QuarterlyReport | undefined> {
    const result = await db.update(quarterlyReports)
      .set({ approved: true, approvedBy, approvedAt: new Date(), updatedAt: new Date() })
      .where(eq(quarterlyReports.id, id))
      .returning();
    return result[0];
  }

  // Admin Audit Log
  async logAdminAction(log: InsertAdminAuditLog): Promise<AdminAuditLog> {
    const result = await db.insert(adminAuditLog).values(log).returning();
    return result[0];
  }

  async getAdminAuditLogs(limit: number = 100): Promise<AdminAuditLog[]> {
    return await db.select().from(adminAuditLog)
      .orderBy(desc(adminAuditLog.timestamp))
      .limit(limit);
  }

  // Admin Sessions
  async createAdminSession(session: InsertAdminSession): Promise<AdminSession> {
    const result = await db.insert(adminSessions).values(session).returning();
    return result[0];
  }

  async getAdminSession(id: string): Promise<AdminSession | undefined> {
    const result = await db.select().from(adminSessions).where(eq(adminSessions.id, id));
    return result[0];
  }

  async deleteAdminSession(id: string): Promise<void> {
    await db.delete(adminSessions).where(eq(adminSessions.id, id));
  }

  async deleteExpiredSessions(): Promise<void> {
    await db.delete(adminSessions).where(lte(adminSessions.expiresAt, new Date()));
  }

  // Portal Access Logs
  async logPortalAccess(log: InsertPortalAccessLog): Promise<PortalAccessLog> {
    const result = await db.insert(portalAccessLogs).values(log).returning();
    return result[0];
  }

  async getPortalAccessLogs(clientId: number): Promise<PortalAccessLog[]> {
    return await db.select().from(portalAccessLogs)
      .where(eq(portalAccessLogs.clientId, clientId))
      .orderBy(desc(portalAccessLogs.timestamp));
  }
}

export const storage = new Storage();
