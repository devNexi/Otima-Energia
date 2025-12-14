import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, boolean, decimal, jsonb, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for admin authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Leads table - from website contact form or manual entry
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  companyName: text("company_name"),
  message: text("message"),
  source: text("source").default("website"), // 'website', 'manual_entry', 'referral'
  portalToken: text("portal_token").unique(), // Unique token for portal access
  portalSentAt: timestamp("portal_sent_at"),
  zohoId: text("zoho_id"), // Zoho CRM Lead ID for future sync
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  portalToken: true,
  portalSentAt: true,
  zohoId: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Clients table - qualified leads with full data
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  salesOwner: text("sales_owner").default("Renan"),
  companyName: text("company_name").notNull(),
  cnpj: text("cnpj"),
  ucCode: text("uc_code"),
  email: text("email"),
  phone: text("phone"),
  contactPerson: text("contact_person"),
  status: text("status").default("prospect"), // 'prospect', 'awaiting_quote', 'negotiating', 'active', 'closed', 'lost'
  currentSupplier: text("current_supplier"), // Current distributor/supplier
  currentPriceRmwh: decimal("current_price_rmwh", { precision: 10, scale: 2 }), // Current price for savings comparison
  avgConsumptionKwh: decimal("avg_consumption_kwh", { precision: 12, scale: 2 }), // Average monthly consumption
  selectedQuoteId: integer("selected_quote_id"), // References supplier_quotes(id) - added later to avoid circular ref
  zohoId: text("zoho_id"), // Zoho CRM Contact ID for future sync
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  zohoId: true,
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Bill Uploads - OCR-extracted energy bill data
export const billUploads = pgTable("bill_uploads", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type"), // 'pdf', 'jpg', 'png'
  fileSize: integer("file_size"), // in bytes
  ocrRawText: text("ocr_raw_text"), // First 5000 chars of OCR output
  ocrConfidence: decimal("ocr_confidence", { precision: 3, scale: 2 }), // 0.00 to 1.00
  ocrStatus: text("ocr_status").default("pending"), // 'pending', 'success', 'failed', 'manual'
  ucCode: text("uc_code"), // Unidade Consumidora
  consumoKwh: decimal("consumo_kwh", { precision: 10, scale: 2 }),
  demandaKw: decimal("demanda_kw", { precision: 10, scale: 2 }),
  valorTotal: decimal("valor_total", { precision: 10, scale: 2 }),
  distribuidora: text("distribuidora"), // Utility company
  mesReferencia: text("mes_referencia"), // MM/AAAA
  extractionMethod: text("extraction_method"), // 'tesseract', 'manual'
  reviewedBy: text("reviewed_by").default("system"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBillUploadSchema = createInsertSchema(billUploads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBillUpload = z.infer<typeof insertBillUploadSchema>;
export type BillUpload = typeof billUploads.$inferSelect;

// Upload Sessions - portal access tokens for clients
export const uploadSessions = pgTable("upload_sessions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  token: text("token").unique().notNull(),
  accessCode: text("access_code"), // Optional 6-digit PIN
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").default(sql`NOW() + INTERVAL '7 days'`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUploadSessionSchema = createInsertSchema(uploadSessions).omit({
  id: true,
  createdAt: true,
  isUsed: true,
});

export type InsertUploadSession = z.infer<typeof insertUploadSessionSchema>;
export type UploadSession = typeof uploadSessions.$inferSelect;

// Consumption Profiles - energy usage data from uploaded bills
export const consumptionProfiles = pgTable("consumption_profiles", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  billingCycle: text("billing_cycle"),
  dataSource: text("data_source"), // 'bill_upload', 'manual_entry', 'api'
  fileUrl: text("file_url"),
  originalFilename: text("original_filename"),
  monthlyConsumptionKwh: jsonb("monthly_consumption_kwh"),
  demandKw: decimal("demand_kw", { precision: 10, scale: 2 }),
  voltage: text("voltage"),
  distributor: text("distributor"),
  uploadSessionId: integer("upload_session_id").references(() => uploadSessions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConsumptionProfileSchema = createInsertSchema(consumptionProfiles).omit({
  id: true,
  createdAt: true,
});

export type InsertConsumptionProfile = z.infer<typeof insertConsumptionProfileSchema>;
export type ConsumptionProfile = typeof consumptionProfiles.$inferSelect;

// Suppliers master table
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  shortCode: text("short_code").notNull().unique(),
  category: text("category"), // 'large', 'medium', 'small', 'renewable'
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  website: text("website"),
  commissionTerms: text("commission_terms"), // Standard terms with this supplier
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// Quote Requests (RFQs)
export const quoteRequests = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  profileId: integer("profile_id").references(() => consumptionProfiles.id),
  status: text("status").default("draft"), // 'draft', 'awaiting_bill', 'pending_quotes', 'quotes_ready', 'expired'
  priority: text("priority").default("normal"), // 'high', 'normal', 'low'
  notes: text("notes"),
  zohoId: text("zoho_id"), // Zoho CRM Deal ID for future sync
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuoteRequestSchema = createInsertSchema(quoteRequests).omit({
  id: true,
  createdAt: true,
  zohoId: true,
});

export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;
export type QuoteRequest = typeof quoteRequests.$inferSelect;

// Supplier Quotes - Brazilian ACL Market Pricing Structure
export const supplierQuotes = pgTable("supplier_quotes", {
  id: serial("id").primaryKey(),
  
  // Relationships
  clientId: integer("client_id").references(() => clients.id).notNull(),
  billUploadId: integer("bill_upload_id").references(() => billUploads.id),
  rfqId: integer("rfq_id").references(() => quoteRequests.id), // Keep for backwards compatibility
  
  // Supplier Information
  supplierName: text("supplier_name").notNull(),
  supplierContact: text("supplier_contact"),
  quoteReference: text("quote_reference"),
  
  // Quote Dates
  quoteDate: date("quote_date").defaultNow().notNull(),
  validUntil: date("valid_until").notNull(),
  
  // Pricing Structure (Brazilian ACL Specific)
  priceRmwh: decimal("price_rmwh", { precision: 10, scale: 2 }), // Fixed price R$/MWh
  pldSpreadRmwh: decimal("pld_spread_rmwh", { precision: 10, scale: 2 }), // Spread over PLD
  demandaPriceRkwMes: decimal("demanda_price_rkw_mes", { precision: 10, scale: 2 }), // R$/kW/month
  
  // Contract Details
  contractStart: date("contract_start"),
  contractDuration: integer("contract_duration"), // Months (12, 24, 36, 48)
  contractType: text("contract_type"), // 'Convencional', '11', '15', 'Bior'
  
  // Modulation (Time-of-Day Rates)
  modulacaoPontaRmwh: decimal("modulacao_ponta_rmwh", { precision: 10, scale: 2 }),
  modulacaoForaPontaRmwh: decimal("modulacao_fora_ponta_rmwh", { precision: 10, scale: 2 }),
  modulacaoReservadaRmwh: decimal("modulacao_reservada_rmwh", { precision: 10, scale: 2 }),
  
  // Seasonality (Sazonalidade)
  sazonalidadeSecaRmwh: decimal("sazonalidade_seca_rmwh", { precision: 10, scale: 2 }),
  sazonalidadeUmidaRmwh: decimal("sazonalidade_umida_rmwh", { precision: 10, scale: 2 }),
  
  // Flexibility
  flexibilidadePercent: decimal("flexibilidade_percent", { precision: 5, scale: 2 }),
  flexibilidadePenaltyRmwh: decimal("flexibilidade_penalty_rmwh", { precision: 10, scale: 2 }),
  
  // Commission & Financials
  ourCommissionRmwh: decimal("our_commission_rmwh", { precision: 10, scale: 2 }),
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }),
  commissionPaidBy: text("commission_paid_by").default("supplier"), // 'supplier' or 'client'
  
  // Calculated Fields
  totalClientCostAnnual: decimal("total_client_cost_annual", { precision: 12, scale: 2 }),
  ourCommissionAnnual: decimal("our_commission_annual", { precision: 12, scale: 2 }),
  clientSavingsAnnual: decimal("client_savings_annual", { precision: 12, scale: 2 }),
  effectivePriceRmwh: decimal("effective_price_rmwh", { precision: 10, scale: 2 }),
  
  // Status & Metadata
  status: text("status").default("draft"), // 'draft', 'active', 'won', 'lost', 'expired'
  notes: text("notes"),
  attachmentUrl: text("attachment_url"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSupplierQuoteSchema = createInsertSchema(supplierQuotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSupplierQuote = z.infer<typeof insertSupplierQuoteSchema>;
export type SupplierQuote = typeof supplierQuotes.$inferSelect;

// Relations
export const leadsRelations = relations(leads, ({ one }) => ({
  client: one(clients, {
    fields: [leads.id],
    references: [clients.leadId],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  lead: one(leads, {
    fields: [clients.leadId],
    references: [leads.id],
  }),
  uploadSessions: many(uploadSessions),
  consumptionProfiles: many(consumptionProfiles),
  quoteRequests: many(quoteRequests),
  billUploads: many(billUploads),
  supplierQuotes: many(supplierQuotes),
}));

export const billUploadsRelations = relations(billUploads, ({ one }) => ({
  client: one(clients, {
    fields: [billUploads.clientId],
    references: [clients.id],
  }),
}));

export const uploadSessionsRelations = relations(uploadSessions, ({ one, many }) => ({
  client: one(clients, {
    fields: [uploadSessions.clientId],
    references: [clients.id],
  }),
  consumptionProfiles: many(consumptionProfiles),
}));

export const consumptionProfilesRelations = relations(consumptionProfiles, ({ one }) => ({
  client: one(clients, {
    fields: [consumptionProfiles.clientId],
    references: [clients.id],
  }),
  uploadSession: one(uploadSessions, {
    fields: [consumptionProfiles.uploadSessionId],
    references: [uploadSessions.id],
  }),
}));

export const quoteRequestsRelations = relations(quoteRequests, ({ one, many }) => ({
  client: one(clients, {
    fields: [quoteRequests.clientId],
    references: [clients.id],
  }),
  profile: one(consumptionProfiles, {
    fields: [quoteRequests.profileId],
    references: [consumptionProfiles.id],
  }),
  supplierQuotes: many(supplierQuotes),
}));

export const supplierQuotesRelations = relations(supplierQuotes, ({ one }) => ({
  client: one(clients, {
    fields: [supplierQuotes.clientId],
    references: [clients.id],
  }),
  billUpload: one(billUploads, {
    fields: [supplierQuotes.billUploadId],
    references: [billUploads.id],
  }),
  quoteRequest: one(quoteRequests, {
    fields: [supplierQuotes.rfqId],
    references: [quoteRequests.id],
  }),
}));
