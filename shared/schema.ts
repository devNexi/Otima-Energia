import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, boolean, decimal, jsonb, integer, date, unique, type AnyPgColumn, pgEnum, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for admin authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("admin"), // 'admin', 'sales', 'ops'
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
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
  segment: text("segment"), // 'SME', 'Industrial' - for ECOS benchmark matching
  region: text("region"), // 'Sudeste', 'Sul', 'Nordeste', 'Norte', 'Centro-Oeste' - for ECOS benchmark matching
  zohoId: text("zoho_id"), // Zoho CRM Contact ID for future sync
  isDemo: boolean("is_demo").default(false), // Demo/sandbox data flag
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  zohoId: true,
  isDemo: true,
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
// Supplier status enum
export const SUPPLIER_STATUSES = ['active', 'inactive', 'prc_only'] as const;
export type SupplierStatus = typeof SUPPLIER_STATUSES[number];

// Supplier source enum
export const SUPPLIER_SOURCES = ['manual', 'prc_import', 'zoho_sync'] as const;
export type SupplierSource = typeof SUPPLIER_SOURCES[number];

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  shortCode: text("short_code").notNull().unique(),
  category: text("category"), // 'large', 'medium', 'small', 'renewable'
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  financeEmail: text("finance_email"), // billing@/financeiro@ for invoice sending
  financeWhatsapp: text("finance_whatsapp"), // Optional WhatsApp for finance contact
  website: text("website"),
  commissionTerms: text("commission_terms"), // Standard terms with this supplier
  isActive: boolean("is_active").default(true),
  status: text("status").default("active"), // 'active', 'inactive', 'prc_only'
  source: text("source").default("manual"), // 'manual', 'prc_import', 'zoho_sync'
  isDemo: boolean("is_demo").default(false), // Demo/sandbox data flag
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  isDemo: true,
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
  
  // RFO Integration
  rfoId: integer("rfo_id"),
  rfoTrackingId: integer("rfo_tracking_id"),
  receivedVia: text("received_via").default("manual"), // 'rfo_email', 'rfo_portal', 'manual'
  
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

// RFO Requests - Automated quote requests to suppliers
export const rfoRequests = pgTable("rfo_requests", {
  id: serial("id").primaryKey(),
  
  // Relationships
  clientId: integer("client_id").references(() => clients.id).notNull(),
  billUploadId: integer("bill_upload_id").references(() => billUploads.id),
  
  // RFO Metadata
  rfoNumber: varchar("rfo_number", { length: 50 }).unique().notNull(),
  rfoDate: timestamp("rfo_date").defaultNow(),
  status: text("status").default("draft"), // 'draft', 'sent', 'partial_response', 'complete', 'expired'
  
  // Request Details
  responseDeadline: date("response_deadline").notNull(),
  priority: text("priority").default("normal"), // 'baixa', 'normal', 'alta', 'urgente'
  
  // Client Data Snapshot (frozen at time of RFO)
  snapshotConsumptionKwh: decimal("snapshot_consumption_kwh", { precision: 10, scale: 2 }),
  snapshotDemandaKw: decimal("snapshot_demanda_kw", { precision: 10, scale: 2 }),
  snapshotUc: varchar("snapshot_uc", { length: 50 }),
  snapshotDistribuidora: varchar("snapshot_distribuidora", { length: 100 }),
  snapshotContractEnd: date("snapshot_contract_end"),
  
  // Tracking
  sentCount: integer("sent_count").default(0),
  responseCount: integer("response_count").default(0),
  lastSentDate: timestamp("last_sent_date"),
  
  // Email Content
  emailSubject: varchar("email_subject", { length: 200 }),
  emailBody: text("email_body"),
  attachments: jsonb("attachments"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRfoRequestSchema = createInsertSchema(rfoRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentCount: true,
  responseCount: true,
  lastSentDate: true,
});

// Update schema includes tracking fields
export const updateRfoRequestSchema = createInsertSchema(rfoRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type InsertRfoRequest = z.infer<typeof insertRfoRequestSchema>;
export type UpdateRfoRequest = z.infer<typeof updateRfoRequestSchema>;
export type RfoRequest = typeof rfoRequests.$inferSelect;

// RFO Supplier Tracking - Track individual supplier responses
export const rfoSupplierTracking = pgTable("rfo_supplier_tracking", {
  id: serial("id").primaryKey(),
  rfoId: integer("rfo_id").references(() => rfoRequests.id).notNull(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  
  // Contact Info
  contactName: varchar("contact_name", { length: 100 }),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }),
  
  // Send Status
  sentStatus: text("sent_status").default("pending"), // 'pending', 'sent', 'failed', 'opened'
  sentDate: timestamp("sent_date"),
  sentMethod: text("sent_method"), // 'email', 'portal', 'api'
  
  // Response Tracking
  responseStatus: text("response_status").default("waiting"), // 'waiting', 'responded', 'no_quote', 'expired'
  responseDate: timestamp("response_date"),
  responseQuoteId: integer("response_quote_id").references(() => supplierQuotes.id),
  
  // Communication Log
  openCount: integer("open_count").default(0),
  lastOpened: timestamp("last_opened"),
  reminderSent: boolean("reminder_sent").default(false),
  reminderDate: timestamp("reminder_date"),
  
  // Error Tracking
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRfoSupplierTrackingSchema = createInsertSchema(rfoSupplierTracking).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  openCount: true,
  retryCount: true,
});

export type InsertRfoSupplierTracking = z.infer<typeof insertRfoSupplierTrackingSchema>;
export type RfoSupplierTracking = typeof rfoSupplierTracking.$inferSelect;

// Supplier Contacts - Multiple contacts per supplier with multi-channel preferences
export const supplierContacts = pgTable("supplier_contacts", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  
  // Contact Details
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  role: varchar("role", { length: 100 }), // 'comercial', 'vendas', 'orcamento', 'gerente'
  department: varchar("department", { length: 100 }),
  
  // Multi-Channel Preferences
  preferredFormat: text("preferred_format").default("email"), // 'email', 'whatsapp', 'portal', 'phone'
  formatDetails: jsonb("format_details"), // Portal URL, WhatsApp number, submission format, etc.
  
  // Response Expectations
  typicalResponseHours: integer("typical_response_hours").default(48),
  bestContactTime: varchar("best_contact_time", { length: 50 }), // "9-12h manhã", "14-17h tarde"
  responsivenessScore: integer("responsiveness_score").default(3), // 1-5 scale
  lastContacted: timestamp("last_contacted"),
  
  // Template Overrides
  customSubjectTemplate: varchar("custom_subject_template", { length: 200 }),
  customBodyTemplate: text("custom_body_template"),
  emailTemplate: varchar("email_template", { length: 50 }),
  
  // Status
  isActive: boolean("is_active").default(true),
  isPrimary: boolean("is_primary").default(false),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSupplierContactSchema = createInsertSchema(supplierContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastContacted: true,
});

export type InsertSupplierContact = z.infer<typeof insertSupplierContactSchema>;
export type SupplierContact = typeof supplierContacts.$inferSelect;

// Supplier Portals - Portal submission details for suppliers that require portal access
export const supplierPortals = pgTable("supplier_portals", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  
  // Portal Info
  portalName: varchar("portal_name", { length: 100 }), // "TXM", "2W Trade", "NEO", "Portal Comerc"
  portalUrl: varchar("portal_url", { length: 500 }).notNull(),
  loginRequired: boolean("login_required").default(true),
  
  // Submission Details
  submissionFormat: varchar("submission_format", { length: 50 }), // "excel_upload", "web_form", "pdf_email"
  requiredFields: jsonb("required_fields"), // ["UC", "Consumo", "Demanda", "Histórico 12m"]
  
  // Portal Notes
  notes: text("notes"), // "Usar planilha modelo do portal", "Upload apenas .xlsx"
  lastUsed: timestamp("last_used"),
  successRate: decimal("success_rate", { precision: 3, scale: 2 }), // 0-1.0
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSupplierPortalSchema = createInsertSchema(supplierPortals).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
});

export type InsertSupplierPortal = z.infer<typeof insertSupplierPortalSchema>;
export type SupplierPortal = typeof supplierPortals.$inferSelect;

// RFO Templates - Multi-format message templates for different channels
export const rfoTemplates = pgTable("rfo_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // "WhatsApp Rápido", "Email Completo", "Planilha Modelo"
  formatType: varchar("format_type", { length: 20 }).notNull(), // 'whatsapp', 'email', 'pdf', 'excel', 'portal_form'
  
  // Template Content
  subjectTemplate: varchar("subject_template", { length: 200 }),
  bodyTemplate: text("body_template").notNull(),
  variables: jsonb("variables").notNull(), // Available variables: {client_name}, {consumption}, etc.
  
  // Attachments
  generatePdf: boolean("generate_pdf").default(false),
  generateExcel: boolean("generate_excel").default(false),
  attachmentTemplate: varchar("attachment_template", { length: 50 }), // Which template to use for attachments
  
  // Usage
  defaultForFormat: varchar("default_for_format", { length: 20 }),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRfoTemplateSchema = createInsertSchema(rfoTemplates).omit({
  id: true,
  createdAt: true,
});

export type InsertRfoTemplate = z.infer<typeof insertRfoTemplateSchema>;
export type RfoTemplate = typeof rfoTemplates.$inferSelect;

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
  rfoRequests: many(rfoRequests),
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
  rfoRequest: one(rfoRequests, {
    fields: [supplierQuotes.rfoId],
    references: [rfoRequests.id],
  }),
}));

// RFO Relations
export const rfoRequestsRelations = relations(rfoRequests, ({ one, many }) => ({
  client: one(clients, {
    fields: [rfoRequests.clientId],
    references: [clients.id],
  }),
  billUpload: one(billUploads, {
    fields: [rfoRequests.billUploadId],
    references: [billUploads.id],
  }),
  supplierTracking: many(rfoSupplierTracking),
  supplierQuotes: many(supplierQuotes),
}));

export const rfoSupplierTrackingRelations = relations(rfoSupplierTracking, ({ one }) => ({
  rfoRequest: one(rfoRequests, {
    fields: [rfoSupplierTracking.rfoId],
    references: [rfoRequests.id],
  }),
  supplier: one(suppliers, {
    fields: [rfoSupplierTracking.supplierId],
    references: [suppliers.id],
  }),
  responseQuote: one(supplierQuotes, {
    fields: [rfoSupplierTracking.responseQuoteId],
    references: [supplierQuotes.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  contacts: many(supplierContacts),
  portals: many(supplierPortals),
  rfoTracking: many(rfoSupplierTracking),
}));

export const supplierContactsRelations = relations(supplierContacts, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierContacts.supplierId],
    references: [suppliers.id],
  }),
}));

export const supplierPortalsRelations = relations(supplierPortals, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierPortals.supplierId],
    references: [suppliers.id],
  }),
}));

// ============================================
// PROPOSAL SYSTEM
// ============================================

// Proposals - Generated commercial proposals from selected quotes
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  
  // Relationships
  clientId: integer("client_id").references(() => clients.id).notNull(),
  quoteId: integer("quote_id").references(() => supplierQuotes.id).notNull(),
  rfoId: integer("rfo_id").references(() => rfoRequests.id),
  
  // Proposal Info
  proposalNumber: varchar("proposal_number", { length: 50 }).unique().notNull(),
  proposalDate: date("proposal_date").defaultNow().notNull(),
  validUntil: date("valid_until").notNull(),
  
  // Document Paths (stored in object storage)
  proposalPdfPath: varchar("proposal_pdf_path", { length: 500 }),
  contractPdfPath: varchar("contract_pdf_path", { length: 500 }),
  summaryPdfPath: varchar("summary_pdf_path", { length: 500 }),
  
  // Client Snapshot (frozen at time of proposal)
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientCnpj: varchar("client_cnpj", { length: 50 }),
  ucCode: varchar("uc_code", { length: 50 }),
  consumptionMwh: decimal("consumption_mwh", { precision: 12, scale: 2 }),
  demandaKw: decimal("demanda_kw", { precision: 10, scale: 2 }),
  distribuidora: varchar("distribuidora", { length: 100 }),
  
  // Quote Snapshot
  supplierName: varchar("supplier_name", { length: 255 }).notNull(),
  priceStructure: varchar("price_structure", { length: 200 }),
  contractDuration: integer("contract_duration"),
  contractStart: date("contract_start"),
  contractType: varchar("contract_type", { length: 50 }),
  
  // Financial Details (calculated at creation time)
  currentAnnualCost: decimal("current_annual_cost", { precision: 12, scale: 2 }),
  proposedAnnualCost: decimal("proposed_annual_cost", { precision: 12, scale: 2 }),
  annualSavings: decimal("annual_savings", { precision: 12, scale: 2 }),
  savingsPercentage: decimal("savings_percentage", { precision: 5, scale: 2 }),
  
  // Commission Details
  ourCommissionAnnual: decimal("our_commission_annual", { precision: 10, scale: 2 }),
  commissionStructure: varchar("commission_structure", { length: 100 }),
  commissionPaidBy: varchar("commission_paid_by", { length: 50 }).default("supplier"),
  paymentTerms: varchar("payment_terms", { length: 200 }),
  
  // Status Tracking
  status: text("status").default("draft"), // 'draft', 'sent', 'viewed', 'negotiating', 'accepted', 'rejected', 'expired'
  sentDate: timestamp("sent_date"),
  viewedDate: timestamp("viewed_date"),
  viewedCount: integer("viewed_count").default(0),
  lastViewed: timestamp("last_viewed"),
  
  // Client Response
  responseDate: timestamp("response_date"),
  responseNotes: text("response_notes"),
  rejectionReason: text("rejection_reason"),
  
  // Tracking Token (for client portal view)
  trackingToken: varchar("tracking_token", { length: 100 }).unique(),
  
  // Metadata
  createdBy: varchar("created_by", { length: 100 }).default("system"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewedCount: true,
  viewedDate: true,
  lastViewed: true,
});

export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposals.$inferSelect;

// Proposal Templates - HTML templates with variables
export const proposalTemplates = pgTable("proposal_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  templateType: varchar("template_type", { length: 30 }).notNull(), // 'proposal', 'contract', 'summary'
  language: varchar("language", { length: 10 }).default("pt-BR"),
  
  // Template Content
  htmlTemplate: text("html_template").notNull(),
  cssStyles: text("css_styles"),
  variables: jsonb("variables").notNull(), // Available placeholder variables
  
  // Document Settings
  paperSize: varchar("paper_size", { length: 20 }).default("A4"),
  orientation: varchar("orientation", { length: 10 }).default("portrait"),
  marginTop: integer("margin_top").default(20),
  marginBottom: integer("margin_bottom").default(20),
  marginLeft: integer("margin_left").default(20),
  marginRight: integer("margin_right").default(20),
  
  // Branding
  includeHeader: boolean("include_header").default(true),
  includeFooter: boolean("include_footer").default(true),
  headerHtml: text("header_html"),
  footerHtml: text("footer_html"),
  
  // Legal Sections
  sections: jsonb("sections"),
  
  // Status
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProposalTemplateSchema = createInsertSchema(proposalTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProposalTemplate = z.infer<typeof insertProposalTemplateSchema>;
export type ProposalTemplate = typeof proposalTemplates.$inferSelect;

// Proposal Views - Track client engagement
export const proposalViews = pgTable("proposal_views", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").references(() => proposals.id).notNull(),
  
  // View Information
  viewDate: timestamp("view_date").defaultNow().notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  
  // Engagement
  timeSpentSeconds: integer("time_spent_seconds"),
  pagesViewed: integer("pages_viewed").default(1),
  downloaded: boolean("downloaded").default(false),
  downloadDate: timestamp("download_date"),
  
  // Client Info (if known)
  clientEmail: varchar("client_email", { length: 255 }),
  clientName: varchar("client_name", { length: 255 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProposalViewSchema = createInsertSchema(proposalViews).omit({
  id: true,
  createdAt: true,
});

export type InsertProposalView = z.infer<typeof insertProposalViewSchema>;
export type ProposalView = typeof proposalViews.$inferSelect;

// Contract Templates - Brazilian energy contract clauses
export const contractTemplates = pgTable("contract_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  templateType: varchar("template_type", { length: 50 }).notNull(), // 'supply_contract', 'brokerage_agreement', 'service_contract'
  
  // Legal Content
  clauses: jsonb("clauses").notNull(), // Array of contract clauses
  variables: jsonb("variables").notNull(), // Placeholder variables
  
  // Brazilian Legal Requirements
  includesAneelClauses: boolean("includes_aneel_clauses").default(true),
  includesLgpdClauses: boolean("includes_lgpd_clauses").default(true),
  includesConsumerClauses: boolean("includes_consumer_clauses").default(true),
  
  // Supplier Specific
  supplierId: integer("supplier_id").references(() => suppliers.id),
  isGeneric: boolean("is_generic").default(true),
  
  // Status
  isActive: boolean("is_active").default(true),
  lastReviewed: date("last_reviewed"),
  reviewedBy: varchar("reviewed_by", { length: 100 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContractTemplateSchema = createInsertSchema(contractTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertContractTemplate = z.infer<typeof insertContractTemplateSchema>;
export type ContractTemplate = typeof contractTemplates.$inferSelect;

// Proposal Relations
export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  client: one(clients, {
    fields: [proposals.clientId],
    references: [clients.id],
  }),
  quote: one(supplierQuotes, {
    fields: [proposals.quoteId],
    references: [supplierQuotes.id],
  }),
  rfoRequest: one(rfoRequests, {
    fields: [proposals.rfoId],
    references: [rfoRequests.id],
  }),
  views: many(proposalViews),
}));

export const proposalViewsRelations = relations(proposalViews, ({ one }) => ({
  proposal: one(proposals, {
    fields: [proposalViews.proposalId],
    references: [proposals.id],
  }),
}));

export const contractTemplatesRelations = relations(contractTemplates, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [contractTemplates.supplierId],
    references: [suppliers.id],
  }),
}));

// ============================================
// ECOS - Energy Contract Operating System
// ============================================

// Client Contracts - Active energy contracts per client
export const clientContracts = pgTable("client_contracts", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  
  // Contract Details
  contractStart: date("contract_start").notNull(),
  contractEnd: date("contract_end").notNull(),
  priceRmwh: decimal("price_rmwh", { precision: 10, scale: 2 }).notNull(),
  volumeMwhMonth: decimal("volume_mwh_month", { precision: 10, scale: 2 }),
  supplierName: text("supplier_name").notNull(),
  
  // Flexibility
  flexibilityNotes: text("flexibility_notes"),
  flexibilityPercent: decimal("flexibility_percent", { precision: 5, scale: 2 }),
  
  // Commission
  commissionType: text("commission_type").default("supplier_paid"), // 'supplier_paid', 'client_paid', 'hybrid'
  commissionRmwh: decimal("commission_rmwh", { precision: 10, scale: 2 }),
  
  // Status
  status: text("status").default("active"), // 'active', 'expiring', 'expired', 'renewed'
  
  // ECOS Renewal Tracking
  renewalStatus: text("renewal_status").default("hold"), // 'hold', 'review', 'renegotiate'
  alertLevel: text("alert_level"), // '180_days', '120_days', '90_days', 'critical'
  lastEcosReviewAt: timestamp("last_ecos_review_at"),
  lastEcosReviewBy: text("last_ecos_review_by"),
  renewalNotes: text("renewal_notes"),
  linkedBenchmarkId: integer("linked_benchmark_id").references(() => marketPriceBenchmarks.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClientContractSchema = createInsertSchema(clientContracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertClientContract = z.infer<typeof insertClientContractSchema>;
export type ClientContract = typeof clientContracts.$inferSelect;

// Market Price Benchmarks - Manual price band inputs + PRC-derived benchmarks
export const marketPriceBenchmarks = pgTable("market_price_benchmarks", {
  id: serial("id").primaryKey(),
  
  // Segment Info (legacy fields - keep for backwards compat)
  segment: text("segment").notNull(), // 'SME', 'Industrial', 'UNKNOWN'
  region: text("region").notNull(), // 'Sudeste', 'Sul', 'Nordeste', 'Norte', 'Centro-Oeste'
  contractLengthMonths: integer("contract_length_months").notNull(), // 12, 24, 36
  
  // NEW: PRC-derived fields (for structured benchmarks)
  referenceMonth: text("reference_month"), // YYYY-MM format for monthly versioning
  submarket: text("submarket"), // 'SECO', 'SUL', 'NNE', 'NORTE', 'NE' - Brazilian submarkets
  productType: text("product_type"), // 'CONVENCIONAL', 'INCENTIVADA', 'INC_I0', etc.
  termMonths: integer("term_months"), // 12, 24, 36, 60 (replaces contractLengthMonths for PRC)
  
  // Price Band (R$/MWh) - enhanced for PRC
  lowerBoundRmwh: decimal("lower_bound_rmwh", { precision: 10, scale: 2 }).notNull(),
  upperBoundRmwh: decimal("upper_bound_rmwh", { precision: 10, scale: 2 }).notNull(),
  midPriceRmwh: decimal("mid_price_rmwh", { precision: 10, scale: 2 }), // Median price
  numSources: integer("num_sources"), // Number of PRCs/sources used
  
  // Metadata
  effectiveDate: date("effective_date").notNull(),
  expiresAt: date("expires_at"),
  source: text("source"), // Legacy field - use sourceType + sourceDetails instead
  notes: text("notes"),
  updatedBy: text("updated_by").default("admin"),
  
  // Governance Fields
  sourceType: text("source_type"), // 'SupplierQuote', 'BrokerIntel', 'PublicSignal', 'InternalDeal', 'PRC', 'Other'
  sourceName: text("source_name"), // Name/label of source (e.g., "PRCs 2025-12 (8 suppliers)")
  sourceDetails: text("source_details"), // Free text for additional context
  sourceUrl: text("source_url"), // Optional link to source document
  sourceDocId: integer("source_doc_id"), // FK to dealDocuments table for evidence linking
  sourcePrcBatchId: integer("source_prc_batch_id"), // FK to prc_publish_batches for PRC evidence
  confidence: text("confidence").default("Medium"), // 'Low', 'Medium', 'High'
  reviewCadence: text("review_cadence").default("Quarterly"), // 'Monthly', 'Quarterly'
  nextReviewDate: date("next_review_date"),
  lastReviewedAt: timestamp("last_reviewed_at"),
  lastReviewedBy: text("last_reviewed_by"),
  
  // Publishing status
  status: text("status").default("DRAFT"), // 'DRAFT', 'PUBLISHED', 'ARCHIVED'
  publishedAt: timestamp("published_at"),
  publishedByUserId: text("published_by_user_id"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMarketPriceBenchmarkSchema = createInsertSchema(marketPriceBenchmarks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMarketPriceBenchmark = z.infer<typeof insertMarketPriceBenchmarkSchema>;
export type MarketPriceBenchmark = typeof marketPriceBenchmarks.$inferSelect;

// ECOS Settings - Band calculation settings
export const ecosSettings = pgTable("ecos_settings", {
  id: serial("id").primaryKey(),
  segment: text("segment").notNull().unique(), // 'SME', 'Industrial'
  
  // Band Calculation
  bandWidthPercent: decimal("band_width_percent", { precision: 5, scale: 2 }).default("10.00"),
  frictionBufferRmwh: decimal("friction_buffer_rmwh", { precision: 10, scale: 2 }).default("5.00"),
  
  // Action Thresholds
  priceGapThresholdPercent: decimal("price_gap_threshold_percent", { precision: 5, scale: 2 }).default("15.00"),
  minAnnualSavingsR: decimal("min_annual_savings_r", { precision: 12, scale: 2 }).default("10000.00"),
  minRemainingMonths: integer("min_remaining_months").default(6),
  renewalWindowMonths: integer("renewal_window_months").default(6),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEcosSettingsSchema = createInsertSchema(ecosSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEcosSettings = z.infer<typeof insertEcosSettingsSchema>;
export type EcosSettings = typeof ecosSettings.$inferSelect;

// ECOS Decision Logs - Every decision is logged
export const ecosDecisionLogs = pgTable("ecos_decision_logs", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  contractId: integer("contract_id").references(() => clientContracts.id),
  
  // Decision Context
  decisionDate: timestamp("decision_date").defaultNow().notNull(),
  triggerType: text("trigger_type").notNull(), // 'bill_upload', 'benchmark_update', 'quarterly_check', 'manual'
  
  // Market Data Used (snapshot for audit trail)
  benchmarkId: integer("benchmark_id").references(() => marketPriceBenchmarks.id),
  benchmarkLowerRmwh: decimal("benchmark_lower_rmwh", { precision: 10, scale: 2 }),
  benchmarkUpperRmwh: decimal("benchmark_upper_rmwh", { precision: 10, scale: 2 }),
  snapshotConfidence: text("snapshot_confidence"), // 'high', 'medium', 'low' - frozen at decision time
  snapshotSourceType: text("snapshot_source_type"), // 'market_survey', 'internal_deals', etc - frozen at decision time
  
  // Client Data
  clientPriceRmwh: decimal("client_price_rmwh", { precision: 10, scale: 2 }).notNull(),
  clientConsumptionMwh: decimal("client_consumption_mwh", { precision: 10, scale: 2 }),
  contractRemainingMonths: integer("contract_remaining_months"),
  
  // ECOS Output
  statusResult: text("status_result").notNull(), // 'within_band', 'at_risk', 'above_band'
  recommendation: text("recommendation").notNull(), // 'hold', 'monitor', 'prepare_renegotiation', 'renegotiate_now'
  explanationPt: text("explanation_pt").notNull(), // Portuguese explanation
  potentialSavingsR: decimal("potential_savings_r", { precision: 12, scale: 2 }),
  
  // Human Actions
  actionTaken: text("action_taken"), // Manual field: what was actually done
  actionDate: timestamp("action_date"),
  actionBy: text("action_by"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEcosDecisionLogSchema = createInsertSchema(ecosDecisionLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertEcosDecisionLog = z.infer<typeof insertEcosDecisionLogSchema>;
export type EcosDecisionLog = typeof ecosDecisionLogs.$inferSelect;

// Quarterly Reports - Auto-generated client reports
export const quarterlyReports = pgTable("quarterly_reports", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  contractId: integer("contract_id").references(() => clientContracts.id),
  decisionLogId: integer("decision_log_id").references(() => ecosDecisionLogs.id),
  
  // Report Period
  periodLabel: text("period_label").notNull(), // 'Q1 2025', 'Q2 2025'
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  
  // Report Content
  marketSummaryPt: text("market_summary_pt"), // Generic market summary in Portuguese
  clientPositionPt: text("client_position_pt"), // Client-specific position analysis
  healthScore: integer("health_score"), // 0-100
  
  // Status
  statusClassification: text("status_classification").notNull(), // 'within_band', 'at_risk', 'above_band'
  recommendation: text("recommendation").notNull(),
  explanationPt: text("explanation_pt").notNull(),
  
  // Financial Summary
  currentPriceRmwh: decimal("current_price_rmwh", { precision: 10, scale: 2 }),
  benchmarkMedianRmwh: decimal("benchmark_median_rmwh", { precision: 10, scale: 2 }),
  optimisedReferencePriceRmwh: decimal("optimised_reference_price_rmwh", { precision: 10, scale: 2 }),
  estimatedAnnualSavingsR: decimal("estimated_annual_savings_r", { precision: 12, scale: 2 }),
  
  // Next Review
  nextReviewDate: date("next_review_date"),
  
  // Approval Workflow
  approved: boolean("approved").default(false),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  
  // Delivery
  sentToClient: boolean("sent_to_client").default(false),
  sentAt: timestamp("sent_at"),
  viewedByClient: boolean("viewed_by_client").default(false),
  viewedAt: timestamp("viewed_at"),
  
  // PDF Storage
  pdfPath: text("pdf_path"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertQuarterlyReportSchema = createInsertSchema(quarterlyReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertQuarterlyReport = z.infer<typeof insertQuarterlyReportSchema>;
export type QuarterlyReport = typeof quarterlyReports.$inferSelect;

// Lead ECOS Snapshots - Point-in-time ECOS analysis for leads
export const leadEcosSnapshots = pgTable("lead_ecos_snapshots", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  
  // Benchmark Used
  benchmarkIdUsed: integer("benchmark_id_used").references(() => marketPriceBenchmarks.id),
  benchmarkLowerRmwh: decimal("benchmark_lower_rmwh", { precision: 10, scale: 2 }),
  benchmarkUpperRmwh: decimal("benchmark_upper_rmwh", { precision: 10, scale: 2 }),
  benchmarkSegment: text("benchmark_segment"),
  benchmarkRegion: text("benchmark_region"),
  benchmarkConfidence: text("benchmark_confidence"), // 'Low', 'Medium', 'High' - frozen at snapshot time
  benchmarkLastReviewedAt: timestamp("benchmark_last_reviewed_at"), // frozen at snapshot time
  
  // Lead Data Snapshot
  estimatedConsumptionKwh: decimal("estimated_consumption_kwh", { precision: 12, scale: 2 }),
  estimatedPriceRmwh: decimal("estimated_price_rmwh", { precision: 10, scale: 2 }),
  segment: text("segment"), // 'SME', 'Industrial'
  region: text("region"), // 'Sudeste', 'Sul', etc.
  voltageLevel: text("voltage_level"), // 'AT', 'MT', 'BT'
  contractStatus: text("contract_status"), // 'ACL', 'ACR', 'Unknown'
  monthlySpendR: decimal("monthly_spend_r", { precision: 12, scale: 2 }),
  
  // Risk Flags
  volatilityExposure: text("volatility_exposure"), // 'low', 'medium', 'high'
  contractRigidity: text("contract_rigidity"), // 'low', 'medium', 'high'
  timingRisk: text("timing_risk"), // 'low', 'medium', 'high'
  
  // Eligibility
  eligibilityStatus: text("eligibility_status"), // 'eligible_now', 'eligible_future', 'not_eligible'
  eligibilityWindow: text("eligibility_window"), // e.g., 'Q2 2026', 'H1 2027'
  
  // ECOS Analysis Result
  bandResult: text("band_result").notNull(), // 'within_band', 'at_risk', 'above_band', 'no_data'
  summaryText: text("summary_text").notNull(), // Portuguese summary for lead
  potentialSavingsR: decimal("potential_savings_r", { precision: 12, scale: 2 }),
  
  // Generation Metadata
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  generatedBy: text("generated_by").notNull(), // Username who generated
  
  // Watermark & Restrictions
  isSnapshot: boolean("is_snapshot").default(true), // Always true - indicates limited analysis
  watermarkText: text("watermark_text").default("ECOS Snapshot — Not a Full Analysis"),
  
  // PDF & Lock
  pdfUrl: text("pdf_url"),
  locked: boolean("locked").default(false),
  lockedAt: timestamp("locked_at"),
  lockedBy: text("locked_by"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLeadEcosSnapshotSchema = createInsertSchema(leadEcosSnapshots).omit({
  id: true,
  createdAt: true,
  lockedAt: true,
  lockedBy: true,
});

export type InsertLeadEcosSnapshot = z.infer<typeof insertLeadEcosSnapshotSchema>;
export type LeadEcosSnapshot = typeof leadEcosSnapshots.$inferSelect;

// Standardized Audit Action Types
export const AUDIT_ACTION_TYPES = {
  // Authentication
  AUTH_LOGIN_SUCCESS: "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_FAILURE: "AUTH_LOGIN_FAILURE",
  AUTH_LOGOUT: "AUTH_LOGOUT",
  
  // User/Role management
  USER_CREATE: "USER_CREATE",
  USER_UPDATE: "USER_UPDATE",
  USER_ROLE_CHANGE: "USER_ROLE_CHANGE",
  
  // Client lifecycle
  CLIENT_CREATE: "CLIENT_CREATE",
  CLIENT_UPDATE: "CLIENT_UPDATE",
  CLIENT_DELETE: "CLIENT_DELETE",
  
  // Lead lifecycle
  LEAD_CREATE: "LEAD_CREATE",
  LEAD_UPDATE: "LEAD_UPDATE",
  LEAD_CONVERT: "LEAD_CONVERT",
  
  // Deal lifecycle
  DEAL_CREATE: "DEAL_CREATE",
  DEAL_UPDATE: "DEAL_UPDATE",
  DEAL_TRANSITION: "DEAL_TRANSITION",
  DEAL_MARK_LOST: "DEAL_MARK_LOST",
  DEAL_REOPEN_ATTEMPT: "DEAL_REOPEN_ATTEMPT",
  
  // Quotes
  QUOTE_ADD: "QUOTE_ADD",
  QUOTE_SELECT: "QUOTE_SELECT",
  QUOTE_REJECT: "QUOTE_REJECT",
  QUOTE_EDIT: "QUOTE_EDIT",
  QUOTE_ATTACHMENT_UPLOAD: "QUOTE_ATTACHMENT_UPLOAD",
  
  // Documents
  DOCUMENT_UPLOAD: "DOCUMENT_UPLOAD",
  DOCUMENT_DOWNLOAD: "DOCUMENT_DOWNLOAD",
  DOCUMENT_VERIFY: "DOCUMENT_VERIFY",
  DOCUMENT_REPLACE: "DOCUMENT_REPLACE",
  
  // Commission events
  COMMISSION_CREATE: "COMMISSION_CREATE",
  COMMISSION_UPDATE: "COMMISSION_UPDATE",
  COMMISSION_STATUS_CHANGE: "COMMISSION_STATUS_CHANGE",
  COMMISSION_DISPUTE_OPEN: "COMMISSION_DISPUTE_OPEN",
  COMMISSION_DISPUTE_RESOLVE: "COMMISSION_DISPUTE_RESOLVE",
  
  // Usage tracking
  USAGE_CREATE: "USAGE_CREATE",
  USAGE_UPDATE: "USAGE_UPDATE",
  USAGE_VERIFY: "USAGE_VERIFY",
  
  // Supplier playbooks
  PLAYBOOK_CREATE: "PLAYBOOK_CREATE",
  PLAYBOOK_UPDATE: "PLAYBOOK_UPDATE",
  PLAYBOOK_VERSION: "PLAYBOOK_VERSION",
  PLAYBOOK_SNAPSHOT: "PLAYBOOK_SNAPSHOT",
  
  // Reconciliation
  RECONCILIATION_RUN_CREATE: "RECONCILIATION_RUN_CREATE",
  RECONCILIATION_LINE_VARIANCE: "RECONCILIATION_LINE_VARIANCE",
  RECONCILIATION_APPROVE: "RECONCILIATION_APPROVE",
  RECONCILIATION_DISPUTE: "RECONCILIATION_DISPUTE",
  
  // Compliance
  COMPLIANCE_TEMPLATE_UPDATE: "COMPLIANCE_TEMPLATE_UPDATE",
  CHECKLIST_ITEM_COMPLETE: "CHECKLIST_ITEM_COMPLETE",
  CHECKLIST_ITEM_UNCOMPLETE: "CHECKLIST_ITEM_UNCOMPLETE",
  EVIDENCE_ATTACH: "EVIDENCE_ATTACH",
  
  // Communication log
  COMMUNICATION_CREATE: "COMMUNICATION_CREATE",
  COMMUNICATION_UPDATE: "COMMUNICATION_UPDATE",
  
  // ECOS
  ECOS_REPORT_GENERATE: "ECOS_REPORT_GENERATE",
  ECOS_REPORT_APPROVE: "ECOS_REPORT_APPROVE",
  BENCHMARK_UPDATE: "BENCHMARK_UPDATE",
  BENCHMARK_REVIEW: "BENCHMARK_REVIEW",
  
  // Contract
  CONTRACT_CREATE: "CONTRACT_CREATE",
  CONTRACT_UPDATE: "CONTRACT_UPDATE",
  CONTRACT_RENEWAL: "CONTRACT_RENEWAL",
  
  // Cases
  CASE_CREATE: "CASE_CREATE",
  CASE_UPDATE: "CASE_UPDATE",
  CASE_CONVERT_TO_LOST: "CASE_CONVERT_TO_LOST",
  
  // SLA
  SLA_BREACH: "SLA_BREACH",
  SLA_RESPONSE: "SLA_RESPONSE",
} as const;

export type AuditActionType = typeof AUDIT_ACTION_TYPES[keyof typeof AUDIT_ACTION_TYPES];

// Admin Audit Log - Compliance-grade audit trail
export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  
  // Actor
  actor: text("actor").notNull(), // Username or 'system'
  actorRole: text("actor_role"), // 'admin', 'ops', 'sales', 'system'
  actorIp: text("actor_ip"),
  userAgent: text("user_agent"),
  
  // Action
  action: text("action").notNull(), // Standardized action type from AUDIT_ACTION_TYPES
  entityType: text("entity_type"), // 'client', 'contract', 'benchmark', 'report', 'deal', etc.
  entityId: integer("entity_id"),
  
  // Parent context for filtering
  clientId: integer("client_id"),
  dealId: text("deal_id"),
  
  // Details
  detailsJson: jsonb("details_json"), // Additional context (sensitive data redacted)
  
  // Tamper-evidence hash chain
  eventHash: text("event_hash"), // SHA-256 of this event
  prevEventHash: text("prev_event_hash"), // SHA-256 of previous event in chain
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLog).omit({
  id: true,
  timestamp: true,
  eventHash: true,
  prevEventHash: true,
});

export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;
export type AdminAuditLog = typeof adminAuditLog.$inferSelect;

// Saved Audit Filter Presets - Admin-specific saved views
export const savedAuditFilters = pgTable("saved_audit_filters", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  name: text("name").notNull(),
  description: text("description"),
  
  // Filter configuration stored as JSON
  filtersJson: jsonb("filters_json").notNull(), // { actor, action, entityType, clientId, dealId, dateFrom, dateTo }
  
  isDefault: boolean("is_default").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSavedAuditFilterSchema = createInsertSchema(savedAuditFilters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSavedAuditFilter = z.infer<typeof insertSavedAuditFilterSchema>;
export type SavedAuditFilter = typeof savedAuditFilters.$inferSelect;

// Admin Sessions - For session-based auth
export const adminSessions = pgTable("admin_sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdminSessionSchema = createInsertSchema(adminSessions).omit({
  createdAt: true,
});

export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;
export type AdminSession = typeof adminSessions.$inferSelect;

// Portal Access Logs - Track client portal access
export const portalAccessLogs = pgTable("portal_access_logs", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  sessionToken: text("session_token"),
  
  action: text("action").notNull(), // 'login', 'view_report', 'view_status', etc.
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertPortalAccessLogSchema = createInsertSchema(portalAccessLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertPortalAccessLog = z.infer<typeof insertPortalAccessLogSchema>;
export type PortalAccessLog = typeof portalAccessLogs.$inferSelect;

// ============== DEAL OS SCHEMA ==============
// Revenue-control and deal-execution system
// Financial truth lives ONLY in this system

// Deal states - explicit, irreversible transitions
export const DEAL_STATES = [
  'DRAFT',
  'RFQ_SENT',
  'QUOTES_RECEIVED',
  'OFFER_SELECTED',
  'ONBOARDING_PENDING',  // NEW: Client delays docs/compliance/CCEE steps
  'CONTRACT_SIGNED',
  'SUPPLY_LIVE',
  'CONTRACT_ENDED',
  'CLOSED',
  'LOST'  // NEW: Dead deals (can be reached from pre-signature states)
] as const;

export type DealState = typeof DEAL_STATES[number];

// Valid state transitions (cannot skip states)
export const DEAL_STATE_TRANSITIONS: Record<DealState, DealState[]> = {
  'DRAFT': ['RFQ_SENT', 'LOST'],
  'RFQ_SENT': ['QUOTES_RECEIVED', 'LOST'],
  'QUOTES_RECEIVED': ['OFFER_SELECTED', 'LOST'],
  'OFFER_SELECTED': ['ONBOARDING_PENDING', 'CONTRACT_SIGNED', 'LOST'],
  'ONBOARDING_PENDING': ['CONTRACT_SIGNED', 'LOST'],
  'CONTRACT_SIGNED': ['SUPPLY_LIVE', 'LOST'],  // LOST requires admin approval
  'SUPPLY_LIVE': ['CONTRACT_ENDED'],
  'CONTRACT_ENDED': ['CLOSED'],
  'CLOSED': [],
  'LOST': []  // Terminal state
};

// Commission event status transitions
export const COMMISSION_EVENT_STATES = [
  'FUTURE',
  'PENDING', 
  'INVOICED',
  'PAID',
  'OVERDUE',
  'DISPUTED',
  'WRITTEN_OFF',
  'CANCELLED'
] as const;

export type CommissionEventState = typeof COMMISSION_EVENT_STATES[number];

export const COMMISSION_EVENT_STATE_TRANSITIONS: Record<CommissionEventState, CommissionEventState[]> = {
  'FUTURE': ['PENDING', 'CANCELLED'],
  'PENDING': ['INVOICED', 'OVERDUE', 'DISPUTED', 'CANCELLED'],
  'INVOICED': ['PAID', 'OVERDUE', 'DISPUTED'],
  'PAID': [],  // Terminal
  'OVERDUE': ['PAID', 'DISPUTED', 'WRITTEN_OFF'],
  'DISPUTED': ['PAID', 'WRITTEN_OFF', 'PENDING'],  // Can return to pending after resolution
  'WRITTEN_OFF': [],  // Terminal
  'CANCELLED': []  // Terminal
};

// LOST Deal Reason Taxonomy (structured, not free text)
export const LOST_DEAL_REASONS = [
  // Client-side reasons
  'CLIENT_WITHDREW',           // Client no longer interested
  'CLIENT_BUDGET_ISSUE',       // Budget constraints
  'CLIENT_INTERNAL_DECISION',  // Internal company decision
  'CLIENT_CREDIT_REJECTED',    // Client credit not approved
  'CLIENT_DOCS_NOT_PROVIDED',  // Failed to provide required documents
  
  // Supplier-side reasons
  'SUPPLIER_NO_QUOTE',         // Supplier didn't respond
  'SUPPLIER_PRICE_UNCOMPETITIVE', // Supplier pricing too high
  'SUPPLIER_TERMS_REJECTED',   // Client rejected supplier terms
  'SUPPLIER_CREDIT_DENIED',    // Supplier denied client credit
  
  // Competitive reasons
  'LOST_TO_COMPETITOR',        // Client chose another broker
  'LOST_TO_DIRECT_SUPPLIER',   // Client went direct with supplier
  'LOST_TO_INCUMBENT',         // Client stayed with current supplier
  
  // Process reasons
  'DEAL_STALLED_TOO_LONG',     // Deal inactive for too long
  'COMPLIANCE_FAILURE',        // Failed compliance requirements
  'METERING_ISSUE',            // CCEE/metering problems
  'CONTRACT_NEGOTIATION_FAILED', // Failed to agree on contract terms
  
  // Other
  'DUPLICATE_DEAL',            // Duplicate of another deal
  'TEST_DEAL',                 // Was only for testing
  'OTHER',                     // Requires explanation in notes
] as const;

export type LostDealReason = typeof LOST_DEAL_REASONS[number];

// RETURNED/STUCK Deal Reason Taxonomy
export const RETURNED_DEAL_REASONS = [
  'DOCS_INCOMPLETE',           // Missing required documents
  'CREDIT_PENDING',            // Awaiting credit approval
  'METERING_DELAY',            // CCEE metering setup delayed
  'CLIENT_UNRESPONSIVE',       // Client not responding
  'SUPPLIER_DELAY',            // Supplier not responding
  'COMPLIANCE_PENDING',        // Awaiting compliance items
  'INTERNAL_REVIEW',           // Internal review required
  'CONTRACT_REVISION',         // Contract needs revision
  'PAYMENT_PENDING',           // Awaiting payment
  'OTHER',                     // Requires explanation
] as const;

export type ReturnedDealReason = typeof RETURNED_DEAL_REASONS[number];

// Dispute reason taxonomy
export const DISPUTE_REASONS = [
  'late_payment',
  'underpayment',
  'wrong_calculation_basis',
  'missing_deal_reference',
  'volume_mismatch',
  'rate_mismatch',
  'supplier_dispute',
  'client_dispute',
  'other'
] as const;

export type DisputeReason = typeof DISPUTE_REASONS[number];

// Dispute resolution outcomes
export const DISPUTE_RESOLUTIONS = [
  'paid_in_full',
  'paid_partial',
  'credit_note',
  'rolled_forward',
  'written_off',
  'dismissed'
] as const;

export type DisputeResolution = typeof DISPUTE_RESOLUTIONS[number];

// Quote received via channels
export const QUOTE_CHANNELS = [
  'email',
  'whatsapp',
  'portal',
  'pdf',
  'excel',
  'phone_summary'
] as const;

export type QuoteChannel = typeof QUOTE_CHANNELS[number];

// Commission calculation types
export const COMMISSION_CALC_TYPES = [
  'fixed_amount',
  'per_mwh',
  'percent_spread',
  'hybrid'
] as const;

export type CommissionCalcType = typeof COMMISSION_CALC_TYPES[number];

// Commission accrual basis - how commission is calculated
export const COMMISSION_ACCRUAL_BASIS = [
  'contracted_volume',   // Commission based on contracted MW
  'actual_consumption',  // Commission based on actual measured MWh
  'hybrid'              // Mix of both (e.g., min on contracted, bonus on actual)
] as const;

export type CommissionAccrualBasis = typeof COMMISSION_ACCRUAL_BASIS[number];

// Core Deals table - the heart of Ótima
export const deals = pgTable("deals", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  
  // Identity
  clientId: integer("client_id").references(() => clients.id).notNull(),
  zohoOpportunityId: text("zoho_opportunity_id"), // Reference only, never source of truth
  internalOwner: text("internal_owner").default("Renan").notNull(), // Deal owner
  opsOwner: text("ops_owner"), // Analyst assigned
  
  // State machine
  status: text("status").default("DRAFT").notNull(), // DEAL_STATES
  
  // Commercial context
  supplierId: integer("supplier_id").references(() => suppliers.id),
  
  // Party structure (who is counterparty) - CRITICAL for Brazil market
  supplierLegalEntityId: text("supplier_legal_entity_id"), // CNPJ of actual legal entity
  supplierLegalEntityName: text("supplier_legal_entity_name"), // Razão social
  supplierBrandName: text("supplier_brand_name"), // Commercial brand (may differ from legal)
  intermediaryPartnerId: integer("intermediary_partner_id"), // If agente varejista/gestor involved
  intermediaryPartnerName: text("intermediary_partner_name"),
  commissionPayerEntityId: text("commission_payer_entity_id"), // CNPJ of who actually pays commission
  commissionPayerEntityName: text("commission_payer_entity_name"), // Who pays (may differ from supplier)
  
  energyType: text("energy_type"), // 'convencional', 'incentivada_50', 'incentivada_100', 'gas'
  submarket: text("submarket"), // 'SE_CO', 'S', 'NE', 'N'
  volumeType: text("volume_type"), // 'flat', 'modulated', 'linked_to_load'
  
  // Contract dates
  contractStartDate: date("contract_start_date"),
  contractEndDate: date("contract_end_date"),
  contractTermMonths: integer("contract_term_months"),
  
  // Volume
  volumeMwhYear: decimal("volume_mwh_year", { precision: 12, scale: 2 }),
  volumeMwhMonth: decimal("volume_mwh_month", { precision: 12, scale: 2 }),
  
  // Pricing (normalized internal view)
  priceStructure: text("price_structure"), // 'fixed', 'indexed_ipca', 'indexed_igpm', 'pld_spread'
  baseEnergyPriceRmwh: decimal("base_energy_price_rmwh", { precision: 10, scale: 4 }),
  indexationRules: jsonb("indexation_rules"), // JSON: { index: 'IPCA', base_date: '2025-01', spread: 0.05 }
  flexibilityClauses: jsonb("flexibility_clauses"), // JSON: { min_percent: 80, max_percent: 120, penalty: 'X' }
  penaltyClauses: jsonb("penalty_clauses"), // JSON: early termination, non-payment, etc.
  
  // Raw supplier quote (NEVER overwrite)
  rawSupplierQuoteJson: jsonb("raw_supplier_quote_json"),
  selectedQuoteId: varchar("selected_quote_id", { length: 255 }),
  
  // Commission block (DO NOT simplify)
  commissionModel: text("commission_model"), // 'rmwh', 'percent_spread', 'hybrid'
  commissionValueRmwh: decimal("commission_value_rmwh", { precision: 10, scale: 4 }),
  commissionPercentSpread: decimal("commission_percent_spread", { precision: 5, scale: 4 }),
  commissionCurrency: text("commission_currency").default("BRL"),
  commissionPayer: text("commission_payer"), // Supplier legal entity
  commissionPaymentType: text("commission_payment_type"), // 'upfront', 'monthly', 'hybrid'
  
  // Expected commission totals (calculated)
  expectedCommissionTotal: decimal("expected_commission_total", { precision: 14, scale: 2 }),
  expectedCommissionMonthly: decimal("expected_commission_monthly", { precision: 12, scale: 2 }),
  
  // Risk & control fields
  creditRiskRating: text("credit_risk_rating"), // 'low', 'medium', 'high', 'critical'
  contractRiskFlags: jsonb("contract_risk_flags"), // Array of flags
  commissionRiskScore: integer("commission_risk_score"), // 0-100
  missingDocuments: jsonb("missing_documents"), // Array of document types
  manualOverrideRequired: boolean("manual_override_required").default(false),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  
  // State timestamps (for tracking)
  rfqSentAt: timestamp("rfq_sent_at"),
  quotesReceivedAt: timestamp("quotes_received_at"),
  offerSelectedAt: timestamp("offer_selected_at"),
  onboardingPendingAt: timestamp("onboarding_pending_at"),
  contractSignedAt: timestamp("contract_signed_at"),
  supplyLiveAt: timestamp("supply_live_at"),
  contractEndedAt: timestamp("contract_ended_at"),
  closedAt: timestamp("closed_at"),
  lostAt: timestamp("lost_at"),
  lostReason: text("lost_reason"), // Why deal was lost (free text - legacy)
  lostReasonCategory: text("lost_reason_category"), // Structured reason from LOST_DEAL_REASONS taxonomy
  lostSupplierId: integer("lost_supplier_id").references(() => suppliers.id), // Supplier involved in loss
  lostStage: text("lost_stage"), // Stage at which deal was lost (from DEAL_STATES)
  lostByUserId: text("lost_by_user_id"), // Sales user who was handling the deal
  lostNotes: text("lost_notes"),
  isDemo: boolean("is_demo").default(false), // Demo/sandbox data flag
  
  // Zoho Lead Intake fields (populated when deal created from Zoho)
  zohoLeadId: text("zoho_lead_id").unique(), // Unique nullable - Zoho lead ID
  zohoLeadSourceAgent: text("zoho_lead_source_agent"), // 'Clara', 'Sophia', 'Unknown'
  zohoLeadOutcome: text("zoho_lead_outcome"), // 'Hotkey', 'Warm', 'Tepid'
  zohoCallbackAt: timestamp("zoho_callback_at"), // Requested callback time
  zohoQuickNote: text("zoho_quick_note"), // Note from Zoho call
  brMarket: text("br_market"), // 'ACL', 'ACR', 'Unknown'
  brGroup: text("br_group"), // 'A', 'B', 'Unknown'
  dmName: text("dm_name"), // Decision maker name
  dmRole: text("dm_role"), // 'Owner', 'Finance', 'Admin', etc.
  dmDirectPhone: text("dm_direct_phone"), // Decision maker phone
  dmAvailability: text("dm_availability"), // When DM is available
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isDemo: true,
});

export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;

// Deal State Transitions - Audit log for every state change
export const dealStateTransitions = pgTable("deal_state_transitions", {
  id: serial("id").primaryKey(),
  dealId: varchar("deal_id", { length: 255 }).references(() => deals.id).notNull(),
  
  fromState: text("from_state").notNull(),
  toState: text("to_state").notNull(),
  
  // Actor
  triggeredBy: text("triggered_by").notNull(), // Username, 'system', or 'ai_agent'
  triggeredByType: text("triggered_by_type").notNull(), // 'user', 'system', 'ai'
  
  // Reason & context
  reason: text("reason"), // Why this transition happened
  notes: text("notes"),
  
  // Approval (some transitions require approval)
  requiresApproval: boolean("requires_approval").default(false),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  
  // Metadata
  metadataJson: jsonb("metadata_json"), // Additional context
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertDealStateTransitionSchema = createInsertSchema(dealStateTransitions).omit({
  id: true,
  timestamp: true,
});

export type InsertDealStateTransition = z.infer<typeof insertDealStateTransitionSchema>;
export type DealStateTransition = typeof dealStateTransitions.$inferSelect;

// Deal Quotes - Supplier quotes for a deal (separate from RFQ quotes)
export const dealQuotes = pgTable("deal_quotes", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  dealId: varchar("deal_id", { length: 255 }).references(() => deals.id).notNull(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  
  // Quote identity
  quoteReference: text("quote_reference"), // Supplier's quote ID/reference
  supplierEntity: text("supplier_entity"), // Legal entity if different from main
  
  // Raw quote (NEVER modify)
  rawQuoteJson: jsonb("raw_quote_json").notNull(),
  rawQuoteHash: text("raw_quote_hash"), // SHA-256 hash for immutability proof
  rawQuoteSource: text("raw_quote_source"), // 'email', 'portal', 'phone', 'meeting'
  rawQuoteFileUrl: text("raw_quote_file_url"),
  
  // Quote provenance (who sent it, how, when)
  receivedVia: text("received_via"), // 'email', 'whatsapp', 'portal', 'pdf', 'excel', 'phone_summary'
  receivedFromName: text("received_from_name"), // Contact name
  receivedFromEmail: text("received_from_email"), // Contact email
  receivedFromPhone: text("received_from_phone"), // Contact phone
  attachmentDocIds: jsonb("attachment_doc_ids"), // Array of deal_documents.id references
  rfqDispatchId: integer("rfq_dispatch_id").references(() => rfqDispatches.id), // Link to RFQ dispatch if quote came from blind auction
  
  // Normalized fields (parsed from raw)
  energyType: text("energy_type"),
  priceStructure: text("price_structure"),
  baseEnergyPriceRmwh: decimal("base_energy_price_rmwh", { precision: 10, scale: 4 }),
  
  // Client-facing uplifted price (base + commission markup) - ONLY this shown to client
  clientEnergyPriceRmwh: decimal("client_energy_price_rmwh", { precision: 10, scale: 4 }),
  
  // Uplift tracking (INTERNAL ONLY - never shown to client)
  upliftType: text("uplift_type"), // 'R_PER_MWH' or 'PERCENT' - how margin was applied
  upliftValue: decimal("uplift_value", { precision: 10, scale: 4 }), // The actual uplift amount/percentage
  clientPriceSetBy: text("client_price_set_by"), // User who set the client price
  clientPriceSetAt: timestamp("client_price_set_at"), // When client price was set
  
  // Proposal eligibility gate - MUST be true to use in proposals
  isProposalEligible: boolean("is_proposal_eligible").default(false),
  
  // Term for proposal grouping (each supplier×term = distinct quote row)
  termMonths: integer("term_months"),
  
  indexationRules: jsonb("indexation_rules"),
  flexibilityClauses: jsonb("flexibility_clauses"),
  penaltyClauses: jsonb("penalty_clauses"),
  
  // Quote completeness (required for proposal eligibility)
  isComplete: boolean("is_complete").default(false), // All required fields populated
  isRiskFlagged: boolean("is_risk_flagged").default(false), // AI or manual risk flag
  
  // Commission terms offered
  commissionModel: text("commission_model"),
  commissionValueRmwh: decimal("commission_value_rmwh", { precision: 10, scale: 4 }),
  commissionPercentSpread: decimal("commission_percent_spread", { precision: 5, scale: 4 }),
  commissionPaymentType: text("commission_payment_type"),
  
  // Validity
  validUntil: date("valid_until"),
  isExpired: boolean("is_expired").default(false),
  
  // Selection status
  isSelected: boolean("is_selected").default(false),
  selectedAt: timestamp("selected_at"),
  selectionReason: text("selection_reason"),
  
  // Rejection (if not selected)
  isRejected: boolean("is_rejected").default(false),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  
  // Risk assessment
  riskFlags: jsonb("risk_flags"), // AI-detected issues
  normalizationConfidence: decimal("normalization_confidence", { precision: 3, scale: 2 }), // 0.00-1.00
  
  // Metadata
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  normalizedBy: text("normalized_by"), // 'ai', 'user:xxx'
  normalizedAt: timestamp("normalized_at"),
  isDemo: boolean("is_demo").default(false), // Demo/sandbox data flag
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDealQuoteSchema = createInsertSchema(dealQuotes).omit({
  id: true,
  createdAt: true,
  receivedAt: true,
});

export type InsertDealQuote = z.infer<typeof insertDealQuoteSchema>;
export type DealQuote = typeof dealQuotes.$inferSelect;

// Deal Commission Events - Payment schedule for a deal
export const dealCommissionEvents = pgTable("deal_commission_events", {
  id: serial("id").primaryKey(),
  dealId: varchar("deal_id", { length: 255 }).references(() => deals.id).notNull(),
  
  // Event type - Milestone commission model: M1 at CONTRACT_SIGNED (50%), M2 at SUPPLY_LIVE (50%)
  eventType: text("event_type").notNull(), // 'MILESTONE_1', 'MILESTONE_2', 'ADJUSTMENT', 'MONTHLY', 'BONUS', 'PENALTY' (legacy: 'UPFRONT', 'RECONCILIATION')
  eventIndex: integer("event_index"), // For milestone: 0=M1, 1=M2, 2+=adjustments
  paymentTrigger: text("payment_trigger"), // e.g. "50% due on Contract Signed", "50% due on CCEE Activation"
  
  // Calculation type and inputs (explicit, not vibes)
  calcType: text("calc_type"), // 'fixed_amount', 'per_mwh', 'percent_spread', 'hybrid'
  calcInputs: jsonb("calc_inputs"), // { volume_mwh, rate_rmwh, spread_percent, caps, floors }
  sourceOfTruth: text("source_of_truth"), // 'supplier_report', 'internal_calc', 'contract_clause'
  evidenceDocId: integer("evidence_doc_id"), // Reference to deal_documents.id
  
  // Amount
  amountBrl: decimal("amount_brl", { precision: 14, scale: 2 }),
  amountRmwh: decimal("amount_rmwh", { precision: 14, scale: 4 }), // Alternative: rate per MWh
  amountFormula: text("amount_formula"), // For calculated amounts: 'actual_consumption * commission_rate'
  isEstimated: boolean("is_estimated").default(true), // True until actual consumption known
  
  // Trigger condition
  dueCondition: text("due_condition"), // 'SUPPLY_LIVE', 'CONTRACT_END', 'MONTHLY', specific date
  expectedDate: date("expected_date"),
  
  // Payment status
  status: text("status").default("FUTURE").notNull(), // 'FUTURE', 'PENDING', 'INVOICED', 'PAID', 'OVERDUE', 'DISPUTED', 'CANCELLED'
  
  // Payment tracking
  confirmedAt: timestamp("confirmed_at"), // When milestone event was confirmed (e.g. CONTRACT_SIGNED date)
  invoicedAt: timestamp("invoiced_at"),
  invoiceNumber: text("invoice_number"),
  paidDate: date("paid_date"), // Simple date paid (not timestamp)
  paidAt: timestamp("paid_at"),
  paidAmount: decimal("paid_amount", { precision: 14, scale: 2 }),
  paymentReference: text("payment_reference"),
  
  // Overdue tracking
  daysOverdue: integer("days_overdue").default(0),
  lastReminderSent: timestamp("last_reminder_sent"),
  reminderCount: integer("reminder_count").default(0),
  
  // Notes
  notes: text("notes"),
  isDemo: boolean("is_demo").default(false), // Demo/sandbox data flag
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDealCommissionEventSchema = createInsertSchema(dealCommissionEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isDemo: true,
});

export type InsertDealCommissionEvent = z.infer<typeof insertDealCommissionEventSchema>;
export type DealCommissionEvent = typeof dealCommissionEvents.$inferSelect;

// Deal Documents - Contracts, evidence, communications
export const dealDocuments = pgTable("deal_documents", {
  id: serial("id").primaryKey(),
  dealId: varchar("deal_id", { length: 255 }).references(() => deals.id).notNull(),
  
  // Document type
  documentType: text("document_type").notNull(), // 'CONTRACT', 'QUOTE', 'AMENDMENT', 'EMAIL', 'WHATSAPP', 'EVIDENCE'
  documentSubtype: text("document_subtype"), // 'signed', 'draft', 'counter-proposal', etc.
  
  // File info
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  
  // Metadata
  description: text("description"),
  uploadedBy: text("uploaded_by").notNull(),
  
  // Verification (for contracts)
  isVerified: boolean("is_verified").default(false),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at"),
  
  // Extracted data (for contracts)
  extractedDataJson: jsonb("extracted_data_json"), // AI-extracted: dates, prices, clauses
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDealDocumentSchema = createInsertSchema(dealDocuments).omit({
  id: true,
  createdAt: true,
});

export type InsertDealDocument = z.infer<typeof insertDealDocumentSchema>;
export type DealDocument = typeof dealDocuments.$inferSelect;

// ============== DEAL ECOS SNAPSHOTS (Pre-Sales Insight Tool) ==============

// Trigger types for ECOS snapshots
export const ECOS_SNAPSHOT_TRIGGER = [
  "MANUAL",
  "BILL_UPLOAD",
  "RENEWAL_REVIEW"
] as const;
export type EcosSnapshotTrigger = typeof ECOS_SNAPSHOT_TRIGGER[number];

// ECOS snapshot status
export const ECOS_SNAPSHOT_STATUS = [
  "BELOW_BAND",
  "WITHIN_BAND",
  "ABOVE_BAND",
  "NO_DATA"
] as const;
export type EcosSnapshotStatus = typeof ECOS_SNAPSHOT_STATUS[number];

// Confidence levels
export const ECOS_CONFIDENCE_LEVEL = [
  "LOW",
  "MEDIUM",
  "HIGH"
] as const;
export type EcosConfidenceLevel = typeof ECOS_CONFIDENCE_LEVEL[number];

// Recommended next steps
export const ECOS_NEXT_STEP = [
  "REQUEST_RFQ",
  "WAIT",
  "NEED_MORE_DATA"
] as const;
export type EcosNextStep = typeof ECOS_NEXT_STEP[number];

// Deal ECOS Snapshots - Pre-sales insight tool for deals
export const dealEcosSnapshots = pgTable("deal_ecos_snapshots", {
  id: serial("id").primaryKey(),
  dealId: varchar("deal_id", { length: 255 }).references(() => deals.id).notNull(),
  version: integer("version").default(1).notNull(),
  
  // Creation context
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdByUserId: varchar("created_by_user_id").references(() => users.id),
  triggerType: text("trigger_type").notNull(), // MANUAL, BILL_UPLOAD, RENEWAL_REVIEW
  
  // Input data (frozen snapshot of inputs used)
  inputData: jsonb("input_data").notNull(), // { uc, distributor, submarket, segment, contractTermAssumption, volumeMwh12m, demandKw, billMonthsUsed, estimatedPriceRmwh, etc. }
  
  // Benchmark matching (which benchmark row(s) used + bounds)
  benchmarkMatch: jsonb("benchmark_match"), // { benchmarkId, segment, region, contractLength, lowerBoundRmwh, upperBoundRmwh, lastUpdated, confidence }
  
  // Computed results
  results: jsonb("results").notNull(), // { clientEstimatedPriceRmwh, gapPercent, potentialSavingsMin, potentialSavingsMax, etc. }
  
  // Status classification
  status: text("status").notNull(), // BELOW_BAND, WITHIN_BAND, ABOVE_BAND, NO_DATA
  
  // Confidence model
  confidenceLevel: text("confidence_level").notNull(), // LOW, MEDIUM, HIGH
  confidenceReasons: jsonb("confidence_reasons"), // ["Only 1 bill month uploaded", "Benchmark outdated 120 days", etc.]
  
  // Actionable output
  recommendedNextStep: text("recommended_next_step").notNull(), // REQUEST_RFQ, WAIT, NEED_MORE_DATA
  talkTrack: text("talk_track"), // Sales script generated from logic/template
  talkTrackPt: text("talk_track_pt"), // Portuguese version
  
  // PDF generation
  pdfDocumentId: integer("pdf_document_id").references(() => dealDocuments.id),
});

export const insertDealEcosSnapshotSchema = createInsertSchema(dealEcosSnapshots).omit({
  id: true,
  createdAt: true,
});

export type InsertDealEcosSnapshot = z.infer<typeof insertDealEcosSnapshotSchema>;
export type DealEcosSnapshot = typeof dealEcosSnapshots.$inferSelect;

// Commission Terms Snapshot - Immutable record at CONTRACT_SIGNED
export const dealCommissionTermsSnapshots = pgTable("deal_commission_terms_snapshots", {
  id: serial("id").primaryKey(),
  dealId: varchar("deal_id", { length: 255 }).references(() => deals.id).notNull(),
  
  // Snapshot timing
  snapshotTakenAt: timestamp("snapshot_taken_at").defaultNow().notNull(),
  snapshotTakenBy: text("snapshot_taken_by").notNull(), // Username or 'system'
  snapshotTrigger: text("snapshot_trigger").notNull(), // 'CONTRACT_SIGNED', 'AMENDMENT', 'RENEGOTIATION'
  
  // Commission terms (immutable after creation)
  commissionModel: text("commission_model").notNull(), // 'rmwh', 'percent_spread', 'hybrid'
  commissionValueRmwh: decimal("commission_value_rmwh", { precision: 10, scale: 4 }),
  commissionPercentSpread: decimal("commission_percent_spread", { precision: 5, scale: 4 }),
  commissionPaymentType: text("commission_payment_type"), // 'upfront', 'monthly', 'hybrid'
  commissionPayerEntityId: text("commission_payer_entity_id"),
  commissionPayerEntityName: text("commission_payer_entity_name"),
  
  // Accrual basis - how commission is calculated (critical for reconciliation)
  accrualBasis: text("accrual_basis"), // 'contracted_volume', 'actual_consumption', 'hybrid'
  
  // Contract context at time of snapshot
  contractStartDate: date("contract_start_date"),
  contractEndDate: date("contract_end_date"),
  volumeMwhYear: decimal("volume_mwh_year", { precision: 12, scale: 2 }),
  priceStructure: text("price_structure"),
  baseEnergyPriceRmwh: decimal("base_energy_price_rmwh", { precision: 10, scale: 4 }),
  
  // Full terms as JSON (human-readable + parseable)
  termsJson: jsonb("terms_json").notNull(), // Complete commission terms
  termsHumanReadable: text("terms_human_readable"), // Plain language version
  
  // Expected totals at time of snapshot
  expectedCommissionTotal: decimal("expected_commission_total", { precision: 14, scale: 2 }),
  expectedCommissionMonthly: decimal("expected_commission_monthly", { precision: 12, scale: 2 }),
  
  // Amendment tracking
  supersedesSnapshotId: integer("supersedes_snapshot_id"), // If this amends a previous snapshot
  isActive: boolean("is_active").default(true), // False if superseded
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDealCommissionTermsSnapshotSchema = createInsertSchema(dealCommissionTermsSnapshots).omit({
  id: true,
  createdAt: true,
  snapshotTakenAt: true,
});

export type InsertDealCommissionTermsSnapshot = z.infer<typeof insertDealCommissionTermsSnapshotSchema>;
export type DealCommissionTermsSnapshot = typeof dealCommissionTermsSnapshots.$inferSelect;

// Deal Disputes - Explicit dispute workflow
export const dealDisputes = pgTable("deal_disputes", {
  id: serial("id").primaryKey(),
  dealId: varchar("deal_id", { length: 255 }).references(() => deals.id).notNull(),
  commissionEventId: integer("commission_event_id"), // Link to specific commission event
  
  // Dispute identity
  disputeReference: text("dispute_reference"), // Internal reference number
  
  // Reason taxonomy
  disputeReason: text("dispute_reason").notNull(), // From DISPUTE_REASONS
  disputeReasonDetail: text("dispute_reason_detail"), // Freeform explanation
  
  // Amounts
  disputedAmountBrl: decimal("disputed_amount_brl", { precision: 14, scale: 2 }),
  claimedAmountBrl: decimal("claimed_amount_brl", { precision: 14, scale: 2 }),
  
  // Ownership
  disputeOwner: text("dispute_owner").notNull(), // Who is handling this
  disputeWithParty: text("dispute_with_party"), // 'supplier', 'client', 'intermediary'
  
  // SLA tracking
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  slaDueDate: date("sla_due_date"), // When this should be resolved
  isSlaBreach: boolean("is_sla_breach").default(false),
  
  // Status
  status: text("status").default("OPEN").notNull(), // 'OPEN', 'IN_PROGRESS', 'PENDING_RESPONSE', 'RESOLVED', 'ESCALATED'
  
  // Resolution
  resolution: text("resolution"), // From DISPUTE_RESOLUTIONS
  resolutionNotes: text("resolution_notes"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"),
  resolvedAmountBrl: decimal("resolved_amount_brl", { precision: 14, scale: 2 }),
  
  // Communications log
  communicationsLog: jsonb("communications_log"), // Array of { date, type, from, to, summary, docId }
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDealDisputeSchema = createInsertSchema(dealDisputes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  openedAt: true,
});

export type InsertDealDispute = z.infer<typeof insertDealDisputeSchema>;
export type DealDispute = typeof dealDisputes.$inferSelect;

// Deal Checklist Gating - Required fields/docs per state
export const dealChecklistRequirements = pgTable("deal_checklist_requirements", {
  id: serial("id").primaryKey(),
  
  // Which state this applies to
  targetState: text("target_state").notNull(), // State you're trying to reach
  
  // Requirement definition
  requirementType: text("requirement_type").notNull(), // 'field', 'document', 'approval', 'custom'
  requirementKey: text("requirement_key").notNull(), // Field name or doc type
  requirementLabel: text("requirement_label").notNull(), // Human-readable label
  
  // Validation
  isMandatory: boolean("is_mandatory").default(true),
  validationRule: text("validation_rule"), // 'not_empty', 'document_verified', 'approval_granted'
  validationParams: jsonb("validation_params"), // Additional params for validation
  
  // Ordering
  displayOrder: integer("display_order").default(0),
  
  // Active/inactive
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDealChecklistRequirementSchema = createInsertSchema(dealChecklistRequirements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDealChecklistRequirement = z.infer<typeof insertDealChecklistRequirementSchema>;
export type DealChecklistRequirement = typeof dealChecklistRequirements.$inferSelect;

// Supplier SLA Tracking - Response time tracking
export const supplierSlaTracking = pgTable("supplier_sla_tracking", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  
  // Context
  dealId: varchar("deal_id", { length: 255 }), // Optional link to deal
  rfoId: integer("rfo_id"), // Optional link to RFO
  
  // Request tracking
  requestType: text("request_type").notNull(), // 'RFQ', 'QUOTE_UPDATE', 'CONTRACT_REVIEW', 'AMENDMENT'
  requestSentAt: timestamp("request_sent_at").notNull(),
  
  // Response tracking
  firstResponseAt: timestamp("first_response_at"),
  quoteValidityExpiry: date("quote_validity_expiry"),
  
  // SLA measurement
  expectedResponseHours: integer("expected_response_hours").default(48),
  actualResponseHours: decimal("actual_response_hours", { precision: 8, scale: 2 }),
  isSlaBreach: boolean("is_sla_breach").default(false),
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSupplierSlaTrackingSchema = createInsertSchema(supplierSlaTracking).omit({
  id: true,
  createdAt: true,
});

export type InsertSupplierSlaTracking = z.infer<typeof insertSupplierSlaTrackingSchema>;
export type SupplierSlaTracking = typeof supplierSlaTracking.$inferSelect;

// Deal OS Relations
export const dealsRelations = relations(deals, ({ one, many }) => ({
  client: one(clients, {
    fields: [deals.clientId],
    references: [clients.id],
  }),
  supplier: one(suppliers, {
    fields: [deals.supplierId],
    references: [suppliers.id],
  }),
  stateTransitions: many(dealStateTransitions),
  quotes: many(dealQuotes),
  commissionEvents: many(dealCommissionEvents),
  documents: many(dealDocuments),
  commissionTermsSnapshots: many(dealCommissionTermsSnapshots),
  disputes: many(dealDisputes),
  ecosSnapshots: many(dealEcosSnapshots),
}));

export const dealCommissionTermsSnapshotsRelations = relations(dealCommissionTermsSnapshots, ({ one }) => ({
  deal: one(deals, {
    fields: [dealCommissionTermsSnapshots.dealId],
    references: [deals.id],
  }),
}));

export const dealDisputesRelations = relations(dealDisputes, ({ one }) => ({
  deal: one(deals, {
    fields: [dealDisputes.dealId],
    references: [deals.id],
  }),
  commissionEvent: one(dealCommissionEvents, {
    fields: [dealDisputes.commissionEventId],
    references: [dealCommissionEvents.id],
  }),
}));

export const supplierSlaTrackingRelations = relations(supplierSlaTracking, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierSlaTracking.supplierId],
    references: [suppliers.id],
  }),
  deal: one(deals, {
    fields: [supplierSlaTracking.dealId],
    references: [deals.id],
  }),
}));

export const dealStateTransitionsRelations = relations(dealStateTransitions, ({ one }) => ({
  deal: one(deals, {
    fields: [dealStateTransitions.dealId],
    references: [deals.id],
  }),
}));

export const dealQuotesRelations = relations(dealQuotes, ({ one }) => ({
  deal: one(deals, {
    fields: [dealQuotes.dealId],
    references: [deals.id],
  }),
  supplier: one(suppliers, {
    fields: [dealQuotes.supplierId],
    references: [suppliers.id],
  }),
}));

export const dealCommissionEventsRelations = relations(dealCommissionEvents, ({ one }) => ({
  deal: one(deals, {
    fields: [dealCommissionEvents.dealId],
    references: [deals.id],
  }),
}));

export const dealDocumentsRelations = relations(dealDocuments, ({ one }) => ({
  deal: one(deals, {
    fields: [dealDocuments.dealId],
    references: [deals.id],
  }),
}));

export const dealEcosSnapshotsRelations = relations(dealEcosSnapshots, ({ one }) => ({
  deal: one(deals, {
    fields: [dealEcosSnapshots.dealId],
    references: [deals.id],
  }),
  createdByUser: one(users, {
    fields: [dealEcosSnapshots.createdByUserId],
    references: [users.id],
  }),
  pdfDocument: one(dealDocuments, {
    fields: [dealEcosSnapshots.pdfDocumentId],
    references: [dealDocuments.id],
  }),
}));

// ============== COMMISSION OS: USAGE, RECONCILIATION, CASES ==============

// Usage source types
export const USAGE_SOURCE_TYPES = [
  "BILL_OCR",
  "CLIENT_CSV", 
  "SUPPLIER_REPORT",
  "MANUAL"
] as const;
export type UsageSourceType = typeof USAGE_SOURCE_TYPES[number];

// Usage verification status
export const USAGE_STATUS = [
  "DRAFT",
  "VERIFIED",
  "INVALID"
] as const;
export type UsageStatus = typeof USAGE_STATUS[number];

// Supplier payment cadence
export const PAYMENT_CADENCE = [
  "UPFRONT",
  "MONTHLY",
  "QUARTERLY",
  "MIXED"
] as const;
export type PaymentCadence = typeof PAYMENT_CADENCE[number];

// Supplier report import parsing status
export const IMPORT_PARSING_STATUS = [
  "RECEIVED",
  "PARSED",
  "NEEDS_MAPPING",
  "FAILED"
] as const;
export type ImportParsingStatus = typeof IMPORT_PARSING_STATUS[number];

// Reconciliation run types
export const RECONCILIATION_RUN_TYPE = [
  "MONTHLY_CLOSE",
  "ADHOC"
] as const;
export type ReconciliationRunType = typeof RECONCILIATION_RUN_TYPE[number];

// Reconciliation run status
export const RECONCILIATION_RUN_STATUS = [
  "OPEN",
  "FINALIZED"
] as const;
export type ReconciliationRunStatus = typeof RECONCILIATION_RUN_STATUS[number];

// Reconciliation line variance reasons
export const VARIANCE_REASON = [
  "MISSING_REPORT",
  "UNDERPAID",
  "OVERPAID",
  "USAGE_VARIANCE",
  "CLAWBACK",
  "DATA_ERROR",
  "OTHER"
] as const;
export type VarianceReason = typeof VARIANCE_REASON[number];

// Reconciliation line status
export const RECONCILIATION_LINE_STATUS = [
  "UNRECONCILED",
  "RECONCILED",
  "DISPUTED"
] as const;
export type ReconciliationLineStatus = typeof RECONCILIATION_LINE_STATUS[number];

// Deal case types (expanded per spec)
export const DEAL_CASE_TYPE = [
  "RETURNED",
  "STUCK",
  "CREDIT_REJECTED",
  "METERING_DELAY",
  "DOCS_PENDING",
  "CLIENT_WITHDREW",
  "CLIENT_SWITCHED_SUPPLIER",
  "SUPPLIER_WITHDREW",
  "SUPPLIER_BACKED_OUT",
  "CCEE_REGISTRATION_FAILED",
  "DOCUMENTATION_INCOMPLETE",
  "REGULATORY_BLOCK",
  "PAYMENT_GUARANTEE_FAILED",
  "START_DATE_DELAYED",
  "OTHER"
] as const;
export type DealCaseType = typeof DEAL_CASE_TYPE[number];

// Communication types for logging
export const COMMUNICATION_TYPE = [
  "CALL",
  "EMAIL",
  "WHATSAPP",
  "MEETING",
  "OTHER"
] as const;
export type CommunicationType = typeof COMMUNICATION_TYPE[number];

// Confidence levels for usage data
export const CONFIDENCE_LEVEL = [
  "HIGH",
  "MEDIUM",
  "LOW",
  "UNVERIFIED"
] as const;
export type ConfidenceLevel = typeof CONFIDENCE_LEVEL[number];

// Deal case severity
export const DEAL_CASE_SEVERITY = [
  "LOW",
  "MED",
  "HIGH"
] as const;
export type DealCaseSeverity = typeof DEAL_CASE_SEVERITY[number];

// Deal case status
export const DEAL_CASE_STATUS = [
  "OPEN",
  "IN_PROGRESS",
  "ESCALATED",
  "RESOLVED",
  "CONVERTED_TO_LOST"
] as const;
export type DealCaseStatus = typeof DEAL_CASE_STATUS[number];

// 1) client_usage_periods - tracks real energy consumption
export const clientUsagePeriods = pgTable("client_usage_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  dealId: varchar("deal_id").references(() => deals.id),
  ucCode: text("uc_code"),
  periodStartDate: date("period_start_date").notNull(),
  periodEndDate: date("period_end_date").notNull(),
  energyKwh: decimal("energy_kwh", { precision: 12, scale: 2 }).notNull(),
  demandKw: decimal("demand_kw", { precision: 10, scale: 2 }),
  billedAmountBrl: decimal("billed_amount_brl", { precision: 12, scale: 2 }),
  sourceType: text("source_type").notNull(), // USAGE_SOURCE_TYPES
  sourceDocId: integer("source_doc_id"),
  extractionConfidence: decimal("extraction_confidence", { precision: 3, scale: 2 }),
  status: text("status").default("DRAFT").notNull(), // USAGE_STATUS
  verifiedByUserId: varchar("verified_by_user_id").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  notes: text("notes"),
  isDemo: boolean("is_demo").default(false), // Demo/sandbox data flag
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClientUsagePeriodSchema = createInsertSchema(clientUsagePeriods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
  isDemo: true,
});
export type InsertClientUsagePeriod = z.infer<typeof insertClientUsagePeriodSchema>;
export type ClientUsagePeriod = typeof clientUsagePeriods.$inferSelect;

// 2) supplier_playbooks - encodes how each supplier works (versioned, jsonb-flexible)
export const supplierPlaybooks = pgTable("supplier_playbooks", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  commissionPayerEntity: text("commission_payer_entity"),
  paymentCadence: text("payment_cadence").default("MONTHLY"), // PAYMENT_CADENCE
  reportFormatsSupported: jsonb("report_formats_supported").default([]),
  requiredFields: jsonb("required_fields").default({}),
  calcDefaults: jsonb("calc_defaults").default({}),
  submissionRequirements: jsonb("submission_requirements").default({}),
  contacts: jsonb("contacts").default({}),
  slaTargets: jsonb("sla_targets").default({}),
  rules: jsonb("rules").default({}), // Lightweight rule engine storage
  
  // Milestone Commission Model (50/50 default)
  commissionModel: text("commission_model").default("MILESTONE"), // 'MILESTONE', 'MONTHLY', 'HYBRID'
  milestone1Name: text("milestone_1_name").default("Contract Signed"),
  milestone1Percent: integer("milestone_1_percent").default(50),
  milestone1Trigger: text("milestone_1_trigger").default("CONTRACT_SIGNED"),
  milestone2Name: text("milestone_2_name").default("CCEE Activation / Supply Live"),
  milestone2Percent: integer("milestone_2_percent").default(50),
  milestone2Trigger: text("milestone_2_trigger").default("SUPPLY_LIVE"),
  adjustmentsOnly: boolean("adjustments_only").default(true), // Reconciliation is adjustments-only, not third tranche
  paymentTermsNotes: text("payment_terms_notes"),
  defaultPaymentDueDays: integer("default_payment_due_days").default(7),
  
  version: integer("version").default(1).notNull(),
  isActive: boolean("is_active").default(true),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSupplierPlaybookSchema = createInsertSchema(supplierPlaybooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSupplierPlaybook = z.infer<typeof insertSupplierPlaybookSchema>;
export type SupplierPlaybook = typeof supplierPlaybooks.$inferSelect;

// 3) supplier_report_imports - tracks raw supplier reports and parsing
export const supplierReportImports = pgTable("supplier_report_imports", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  importedBy: varchar("imported_by").references(() => users.id).notNull(),
  importedAt: timestamp("imported_at").defaultNow().notNull(),
  fileDocId: integer("file_doc_id"),
  fileName: text("file_name"),
  fileType: text("file_type"), // xlsx, csv, pdf
  parsingStatus: text("parsing_status").default("RECEIVED").notNull(), // IMPORT_PARSING_STATUS
  detectedColumns: jsonb("detected_columns").default([]),
  mappingConfig: jsonb("mapping_config").default({}),
  parsedData: jsonb("parsed_data").default([]),
  rowCount: integer("row_count").default(0),
  errorLog: text("error_log"),
  hashSha256: text("hash_sha256"),
});

export const insertSupplierReportImportSchema = createInsertSchema(supplierReportImports).omit({
  id: true,
  importedAt: true,
});
export type InsertSupplierReportImport = z.infer<typeof insertSupplierReportImportSchema>;
export type SupplierReportImport = typeof supplierReportImports.$inferSelect;

// 4) commission_reconciliation_runs - monthly or ad-hoc close process
export const commissionReconciliationRuns = pgTable("commission_reconciliation_runs", {
  id: serial("id").primaryKey(),
  runType: text("run_type").default("MONTHLY_CLOSE").notNull(), // RECONCILIATION_RUN_TYPE
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").default("OPEN").notNull(), // RECONCILIATION_RUN_STATUS
  totalExpected: decimal("total_expected", { precision: 14, scale: 2 }),
  totalReported: decimal("total_reported", { precision: 14, scale: 2 }),
  totalPaid: decimal("total_paid", { precision: 14, scale: 2 }),
  totalVariance: decimal("total_variance", { precision: 14, scale: 2 }),
  lineCount: integer("line_count").default(0),
  notes: text("notes"),
  finalizedAt: timestamp("finalized_at"),
  finalizedBy: varchar("finalized_by").references(() => users.id),
});

export const insertCommissionReconciliationRunSchema = createInsertSchema(commissionReconciliationRuns).omit({
  id: true,
  createdAt: true,
  finalizedAt: true,
  finalizedBy: true,
});
export type InsertCommissionReconciliationRun = z.infer<typeof insertCommissionReconciliationRunSchema>;
export type CommissionReconciliationRun = typeof commissionReconciliationRuns.$inferSelect;

// 5) commission_reconciliation_lines - line-by-line commission truth
export const commissionReconciliationLines = pgTable("commission_reconciliation_lines", {
  id: serial("id").primaryKey(),
  reconciliationRunId: integer("reconciliation_run_id").references(() => commissionReconciliationRuns.id).notNull(),
  dealId: varchar("deal_id").references(() => deals.id).notNull(),
  commissionEventId: integer("commission_event_id").references(() => dealCommissionEvents.id),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  expectedAmountBrl: decimal("expected_amount_brl", { precision: 12, scale: 2 }).notNull(),
  supplierReportedAmountBrl: decimal("supplier_reported_amount_brl", { precision: 12, scale: 2 }),
  paidAmountBrl: decimal("paid_amount_brl", { precision: 12, scale: 2 }),
  varianceAmountBrl: decimal("variance_amount_brl", { precision: 12, scale: 2 }),
  varianceReason: text("variance_reason"), // VARIANCE_REASON
  status: text("status").default("UNRECONCILED").notNull(), // RECONCILIATION_LINE_STATUS
  evidenceDocIds: jsonb("evidence_doc_ids").default([]),
  usagePeriodId: varchar("usage_period_id").references(() => clientUsagePeriods.id),
  notes: text("notes"),
  reconciledAt: timestamp("reconciled_at"),
  reconciledBy: varchar("reconciled_by").references(() => users.id),
});

export const insertCommissionReconciliationLineSchema = createInsertSchema(commissionReconciliationLines).omit({
  id: true,
  reconciledAt: true,
  reconciledBy: true,
});
export type InsertCommissionReconciliationLine = z.infer<typeof insertCommissionReconciliationLineSchema>;
export type CommissionReconciliationLine = typeof commissionReconciliationLines.$inferSelect;

// 6) deal_cases - for returned / stuck / failed deals after signing
export const dealCases = pgTable("deal_cases", {
  id: serial("id").primaryKey(),
  dealId: varchar("deal_id").references(() => deals.id).notNull(),
  caseType: text("case_type").notNull(), // DEAL_CASE_TYPE
  severity: text("severity").default("MED").notNull(), // DEAL_CASE_SEVERITY
  status: text("status").default("OPEN").notNull(), // DEAL_CASE_STATUS
  ownerUserId: varchar("owner_user_id").references(() => users.id),
  nextActionDate: date("next_action_date"),
  slaDueDate: date("sla_due_date"),
  rootCause: text("root_cause"),
  resolutionSummary: text("resolution_summary"),
  isDemo: boolean("is_demo").default(false), // Demo/sandbox data flag
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDealCaseSchema = createInsertSchema(dealCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isDemo: true,
});
export type InsertDealCase = z.infer<typeof insertDealCaseSchema>;
export type DealCase = typeof dealCases.$inferSelect;

// 7) communication_log - tracks calls, emails, WhatsApp interactions
export const communicationLog = pgTable("communication_log", {
  id: serial("id").primaryKey(),
  dealId: varchar("deal_id").references(() => deals.id),
  clientId: integer("client_id").references(() => clients.id),
  leadId: integer("lead_id").references(() => leads.id),
  communicationType: text("communication_type").notNull(), // COMMUNICATION_TYPE
  direction: text("direction").default("outbound"), // 'inbound', 'outbound'
  subject: text("subject"),
  summary: text("summary"),
  externalCallId: text("external_call_id"),
  externalSystemLink: text("external_system_link"),
  contactPerson: text("contact_person"),
  contactInfo: text("contact_info"),
  loggedBy: varchar("logged_by").references(() => users.id).notNull(),
  occurredAt: timestamp("occurred_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommunicationLogSchema = createInsertSchema(communicationLog).omit({
  id: true,
  createdAt: true,
});
export type InsertCommunicationLog = z.infer<typeof insertCommunicationLogSchema>;
export type CommunicationLog = typeof communicationLog.$inferSelect;

// 8) compliance_checklist_requirements - configurable checklists per state transition
export const complianceChecklistRequirements = pgTable("compliance_checklist_requirements", {
  id: serial("id").primaryKey(),
  transitionFrom: text("transition_from").notNull(), // DEAL_STATES
  transitionTo: text("transition_to").notNull(), // DEAL_STATES
  requirementKey: text("requirement_key").notNull(), // Unique per transition (composite constraint)
  requirementLabel: text("requirement_label").notNull(),
  description: text("description"),
  isRequired: boolean("is_required").default(true),
  requiredForRoles: jsonb("required_for_roles").default(["all"]),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  transitionKeyUnique: unique("compliance_checklist_requirements_transition_key_unique").on(
    table.transitionFrom,
    table.transitionTo,
    table.requirementKey
  ),
}));

export const insertComplianceChecklistRequirementSchema = createInsertSchema(complianceChecklistRequirements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertComplianceChecklistRequirement = z.infer<typeof insertComplianceChecklistRequirementSchema>;
export type ComplianceChecklistRequirement = typeof complianceChecklistRequirements.$inferSelect;

// 9) deal_checklist_items - completed checklist items per deal
export const dealChecklistItems = pgTable("deal_checklist_items", {
  id: serial("id").primaryKey(),
  dealId: varchar("deal_id").references(() => deals.id).notNull(),
  requirementId: integer("requirement_id").references(() => complianceChecklistRequirements.id).notNull(),
  completedBy: varchar("completed_by").references(() => users.id).notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  
  // Response and confirmation
  response: text("response"), // YES / NO / N_A
  confirmationMethod: text("confirmation_method"), // CALL / EMAIL / WHATSAPP / DOCUMENT / MEETING
  confidenceLevel: text("confidence_level"), // LOW / MEDIUM / HIGH
  
  // Evidence linking
  notes: text("notes"),
  evidenceDocId: integer("evidence_doc_id"),
  communicationLogId: integer("communication_log_id").references(() => communicationLog.id),
});

export const insertDealChecklistItemSchema = createInsertSchema(dealChecklistItems).omit({
  id: true,
  completedAt: true,
});
export type InsertDealChecklistItem = z.infer<typeof insertDealChecklistItemSchema>;
export type DealChecklistItem = typeof dealChecklistItems.$inferSelect;

// 10) playbook_deal_snapshots - immutable snapshot of playbook at CONTRACT_SIGNED
export const playbookDealSnapshots = pgTable("playbook_deal_snapshots", {
  id: serial("id").primaryKey(),
  dealId: varchar("deal_id").references(() => deals.id).notNull().unique(),
  playbookId: integer("playbook_id").references(() => supplierPlaybooks.id).notNull(),
  playbookVersion: integer("playbook_version").notNull(),
  snapshotData: jsonb("snapshot_data").notNull(), // Full playbook config at time of snapshot
  snapshotedBy: varchar("snapshoted_by").references(() => users.id).notNull(),
  snapshotedAt: timestamp("snapshoted_at").defaultNow().notNull(),
});

export const insertPlaybookDealSnapshotSchema = createInsertSchema(playbookDealSnapshots).omit({
  id: true,
  snapshotedAt: true,
});
export type InsertPlaybookDealSnapshot = z.infer<typeof insertPlaybookDealSnapshotSchema>;
export type PlaybookDealSnapshot = typeof playbookDealSnapshots.$inferSelect;

// Commission OS Relations
export const clientUsagePeriodsRelations = relations(clientUsagePeriods, ({ one }) => ({
  client: one(clients, {
    fields: [clientUsagePeriods.clientId],
    references: [clients.id],
  }),
  deal: one(deals, {
    fields: [clientUsagePeriods.dealId],
    references: [deals.id],
  }),
  verifiedBy: one(users, {
    fields: [clientUsagePeriods.verifiedByUserId],
    references: [users.id],
  }),
}));

export const supplierPlaybooksRelations = relations(supplierPlaybooks, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierPlaybooks.supplierId],
    references: [suppliers.id],
  }),
  updatedByUser: one(users, {
    fields: [supplierPlaybooks.updatedBy],
    references: [users.id],
  }),
}));

export const supplierReportImportsRelations = relations(supplierReportImports, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierReportImports.supplierId],
    references: [suppliers.id],
  }),
  importedByUser: one(users, {
    fields: [supplierReportImports.importedBy],
    references: [users.id],
  }),
}));

export const commissionReconciliationRunsRelations = relations(commissionReconciliationRuns, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [commissionReconciliationRuns.createdBy],
    references: [users.id],
  }),
  finalizedByUser: one(users, {
    fields: [commissionReconciliationRuns.finalizedBy],
    references: [users.id],
  }),
  lines: many(commissionReconciliationLines),
}));

export const commissionReconciliationLinesRelations = relations(commissionReconciliationLines, ({ one }) => ({
  run: one(commissionReconciliationRuns, {
    fields: [commissionReconciliationLines.reconciliationRunId],
    references: [commissionReconciliationRuns.id],
  }),
  deal: one(deals, {
    fields: [commissionReconciliationLines.dealId],
    references: [deals.id],
  }),
  client: one(clients, {
    fields: [commissionReconciliationLines.clientId],
    references: [clients.id],
  }),
  supplier: one(suppliers, {
    fields: [commissionReconciliationLines.supplierId],
    references: [suppliers.id],
  }),
  commissionEvent: one(dealCommissionEvents, {
    fields: [commissionReconciliationLines.commissionEventId],
    references: [dealCommissionEvents.id],
  }),
  usagePeriod: one(clientUsagePeriods, {
    fields: [commissionReconciliationLines.usagePeriodId],
    references: [clientUsagePeriods.id],
  }),
}));

export const dealCasesRelations = relations(dealCases, ({ one }) => ({
  deal: one(deals, {
    fields: [dealCases.dealId],
    references: [deals.id],
  }),
  owner: one(users, {
    fields: [dealCases.ownerUserId],
    references: [users.id],
  }),
}));

export const communicationLogRelations = relations(communicationLog, ({ one }) => ({
  deal: one(deals, {
    fields: [communicationLog.dealId],
    references: [deals.id],
  }),
  client: one(clients, {
    fields: [communicationLog.clientId],
    references: [clients.id],
  }),
  lead: one(leads, {
    fields: [communicationLog.leadId],
    references: [leads.id],
  }),
  loggedByUser: one(users, {
    fields: [communicationLog.loggedBy],
    references: [users.id],
  }),
}));

export const dealChecklistItemsRelations = relations(dealChecklistItems, ({ one }) => ({
  deal: one(deals, {
    fields: [dealChecklistItems.dealId],
    references: [deals.id],
  }),
  requirement: one(complianceChecklistRequirements, {
    fields: [dealChecklistItems.requirementId],
    references: [complianceChecklistRequirements.id],
  }),
  completedByUser: one(users, {
    fields: [dealChecklistItems.completedBy],
    references: [users.id],
  }),
}));

export const playbookDealSnapshotsRelations = relations(playbookDealSnapshots, ({ one }) => ({
  deal: one(deals, {
    fields: [playbookDealSnapshots.dealId],
    references: [deals.id],
  }),
  playbook: one(supplierPlaybooks, {
    fields: [playbookDealSnapshots.playbookId],
    references: [supplierPlaybooks.id],
  }),
  snapshotedByUser: one(users, {
    fields: [playbookDealSnapshots.snapshotedBy],
    references: [users.id],
  }),
}));

// ============== NOTIFICATION QUEUE ==============

export const notificationQueue = pgTable("notification_queue", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // DEAL_BLOCKED, SLA_BREACH, COMMISSION_OVERDUE
  recipientEmail: text("recipient_email").notNull(),
  recipientUserId: varchar("recipient_user_id").references(() => users.id),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  dealId: varchar("deal_id").references(() => deals.id),
  metadata: jsonb("metadata").default({}),
  status: text("status").default("PENDING").notNull(), // PENDING, SENT, FAILED
  sentAt: timestamp("sent_at"),
  failReason: text("fail_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationQueueSchema = createInsertSchema(notificationQueue).omit({
  id: true,
  sentAt: true,
  failReason: true,
  createdAt: true,
});

export type InsertNotificationQueue = z.infer<typeof insertNotificationQueueSchema>;
export type NotificationQueue = typeof notificationQueue.$inferSelect;

export const notificationQueueRelations = relations(notificationQueue, ({ one }) => ({
  deal: one(deals, {
    fields: [notificationQueue.dealId],
    references: [deals.id],
  }),
  recipientUser: one(users, {
    fields: [notificationQueue.recipientUserId],
    references: [users.id],
  }),
}));

// ============== END NOTIFICATION QUEUE ==============

// ============== PARTNER REFERRAL PROGRAM ==============

export const partnerStatusEnum = ["PENDING", "APPROVED", "REJECTED"] as const;
export type PartnerStatus = typeof partnerStatusEnum[number];

export const referralSourceEnum = ["google", "indicacao", "instagram", "outro"] as const;
export type ReferralSource = typeof referralSourceEnum[number];

export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  cpfCnpj: text("cpf_cnpj").notNull(),
  profession: text("profession"),
  referralSource: text("referral_source"), // google, indicacao, instagram, outro
  status: text("status").default("PENDING").notNull(), // PENDING, APPROVED, REJECTED
  referralCode: text("referral_code").unique(), // Unique code for tracking referrals
  referredByPartnerId: integer("referred_by_partner_id").references((): AnyPgColumn => partners.id),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectedReason: text("rejected_reason"),
  termsAcceptedAt: timestamp("terms_accepted_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  status: true,
  referralCode: true,
  approvedAt: true,
  approvedBy: true,
  rejectedAt: true,
  rejectedReason: true,
  createdAt: true,
});

export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;

export const partnerReferrals = pgTable("partner_referrals", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").references(() => partners.id).notNull(),
  leadId: integer("lead_id").references(() => leads.id),
  clientId: integer("client_id").references(() => clients.id),
  dealId: varchar("deal_id").references(() => deals.id),
  referralStatus: text("referral_status").default("PENDING").notNull(), // PENDING, QUALIFIED, CONTRACTED, CANCELLED
  commissionEarned: decimal("commission_earned", { precision: 12, scale: 2 }),
  commissionPaid: decimal("commission_paid", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPartnerReferralSchema = createInsertSchema(partnerReferrals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPartnerReferral = z.infer<typeof insertPartnerReferralSchema>;
export type PartnerReferral = typeof partnerReferrals.$inferSelect;

export const partnersRelations = relations(partners, ({ one, many }) => ({
  referredBy: one(partners, {
    fields: [partners.referredByPartnerId],
    references: [partners.id],
  }),
  approvedByUser: one(users, {
    fields: [partners.approvedBy],
    references: [users.id],
  }),
  referrals: many(partnerReferrals),
}));

export const partnerReferralsRelations = relations(partnerReferrals, ({ one }) => ({
  partner: one(partners, {
    fields: [partnerReferrals.partnerId],
    references: [partners.id],
  }),
  lead: one(leads, {
    fields: [partnerReferrals.leadId],
    references: [leads.id],
  }),
  client: one(clients, {
    fields: [partnerReferrals.clientId],
    references: [clients.id],
  }),
  deal: one(deals, {
    fields: [partnerReferrals.dealId],
    references: [deals.id],
  }),
}));

// ============== END PARTNER REFERRAL PROGRAM ==============

// ============== SUPPLIER RFQ ADAPTER LAYER ==============

export const adapterStatusEnum = ["ACTIVE", "RETIRED"] as const;
export type AdapterStatus = typeof adapterStatusEnum[number];

export const packetStatusEnum = ["DRAFT", "READY", "SENT", "FAILED"] as const;
export type PacketStatus = typeof packetStatusEnum[number];

export const sendMethodEnum = ["EMAIL", "WHATSAPP", "PORTAL", "MANUAL"] as const;
export type SendMethod = typeof sendMethodEnum[number];

// Supplier RFQ Adapters - Configuration for how to request quotes from each supplier
export const supplierRfqAdapters = pgTable("supplier_rfq_adapters", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  version: integer("version").notNull().default(1),
  status: text("status").default("ACTIVE").notNull(), // ACTIVE, RETIRED
  name: text("name").notNull(), // e.g. "Default RFQ Method"
  
  // Submission Channels Configuration
  submissionChannels: jsonb("submission_channels").default({
    email: { enabled: true },
    whatsapp: { enabled: false },
    portal: { enabled: false },
    excelTemplate: { enabled: false }
  }),
  
  // Email Configuration
  emailConfig: jsonb("email_config").default({
    to: [],
    cc: [],
    subjectTemplate: "RFQ #{{RFO_NUMBER}} - {{CLIENT_NAME}} - Solicitação de Cotação",
    bodyTemplate: "Prezado(a) {{CONTACT_NAME}},\n\nSolicitamos cotação para o cliente {{CLIENT_NAME}} (CNPJ: {{CNPJ}}).\n\nConsumo anual: {{ANNUAL_MWH}} MWh\nInício do suprimento: {{START_DATE}}\nPrazo para resposta: {{DEADLINE_HOURS}} horas\n\nAtenciosamente,\n{{OTIMA_CONTACT}}"
  }),
  
  // WhatsApp Configuration
  whatsappConfig: jsonb("whatsapp_config").default({
    messageTemplate: "Olá {{CONTACT_NAME}}, tudo bem?\n\nEnvio RFQ #{{RFO_NUMBER}} para {{CLIENT_NAME}}.\nConsumo: {{ANNUAL_MWH}} MWh/ano\nInício: {{START_DATE}}\n\nPrazo: {{DEADLINE_HOURS}}h\n\nObrigado!"
  }),
  
  // Portal Configuration
  portalConfig: jsonb("portal_config").default({
    url: "",
    instructions: ""
  }),
  
  // Required Fields Schema - What data must be provided for this supplier
  requiredFieldsSchema: jsonb("required_fields_schema").default([
    { key: "client_company_name", label: "Razão Social", type: "text", required: true },
    { key: "cnpj", label: "CNPJ", type: "text", required: true },
    { key: "ucs", label: "UC(s)", type: "list", required: true, minItems: 1 },
    { key: "annual_mwh", label: "Consumo Anual (MWh)", type: "number", required: true },
    { key: "start_date", label: "Início do Suprimento", type: "date", required: true }
  ]),
  
  // Required Attachments Schema
  requiredAttachmentsSchema: jsonb("required_attachments_schema").default([
    { key: "bill_pdf_last_12_months", label: "Últimas 12 faturas (PDF)", required: true },
    { key: "load_dossier_pdf", label: "Dossiê de Consumo (PDF)", required: false },
    { key: "credit_docs", label: "Documentos de Crédito (se aplicável)", required: false }
  ]),
  
  // Response Format Hints
  responseFormatHints: jsonb("response_format_hints").default({
    expected: "EMAIL_PDF_OR_EXCEL",
    notes: ""
  }),
  
  // Relationship Intelligence
  relationshipNotes: text("relationship_notes"), // Free-form notes about supplier relationship
  preferredContactId: integer("preferred_contact_id").references(() => supplierContacts.id), // FK to preferred contact
  responseBehavior: jsonb("response_behavior").default({
    preferred_channel: null,
    best_hours: null,
    format_preference: null,
    notes: null
  }), // { preferred_channel: "WHATSAPP", best_hours: "14:00–18:00", format_preference: "EXCEL", notes: "..." }
  
  // Internal Notes
  internalNotes: text("internal_notes"),
  
  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  retiredAt: timestamp("retired_at"),
  retiredBy: varchar("retired_by").references(() => users.id),
});

export const insertSupplierRfqAdapterSchema = createInsertSchema(supplierRfqAdapters).omit({
  id: true,
  version: true,
  status: true,
  createdAt: true,
  retiredAt: true,
  retiredBy: true,
});

export type InsertSupplierRfqAdapter = z.infer<typeof insertSupplierRfqAdapterSchema>;
export type SupplierRfqAdapter = typeof supplierRfqAdapters.$inferSelect;

// RFQ Packets - Generated RFQ packet per supplier per RFO (immutable snapshot)
// Supports both adapter-generated packets AND manual sends outside the system
export const rfqPackets = pgTable("rfq_packets", {
  id: serial("id").primaryKey(),
  rfoRequestId: integer("rfo_request_id").references(() => rfoRequests.id).notNull(),
  dealId: varchar("deal_id").references(() => deals.id), // nullable - some RFOs are from deals
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  adapterId: integer("adapter_id").references(() => supplierRfqAdapters.id), // nullable for manual sends
  adapterVersion: integer("adapter_version"), // nullable for manual sends
  
  // Status
  packetStatus: text("packet_status").default("DRAFT").notNull(), // DRAFT, READY, SENT, FAILED, MANUAL_SENT
  
  // Manual Send Flag - true if sent outside the system
  isManualSend: boolean("is_manual_send").default(false).notNull(),
  manualSendNotes: text("manual_send_notes"), // What was sent, how, to whom
  manualSendChannel: text("manual_send_channel"), // EMAIL, WHATSAPP, PHONE, PORTAL, OTHER
  
  // Generated Payload - snapshot of resolved tokens and compiled content
  generatedPayload: jsonb("generated_payload").default({
    email: { to: [], cc: [], subject: "", body: "" },
    whatsapp: { message: "" },
    portal: { url: "", instructions: "" },
    requiredFields: {},
    attachments: []
  }),
  
  // Missing Requirements
  missingRequirements: jsonb("missing_requirements").default([]),
  
  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  sentAt: timestamp("sent_at"),
  sentBy: varchar("sent_by").references(() => users.id),
  sendMethodUsed: text("send_method_used"), // EMAIL, WHATSAPP, PORTAL, MANUAL
  
  // Communication Log Link
  communicationLogId: integer("communication_log_id").references(() => communicationLog.id),
});

export const insertRfqPacketSchema = createInsertSchema(rfqPackets).omit({
  id: true,
  packetStatus: true,
  createdAt: true,
  sentAt: true,
  sentBy: true,
  sendMethodUsed: true,
  communicationLogId: true,
});

export type InsertRfqPacket = z.infer<typeof insertRfqPacketSchema>;
export type RfqPacket = typeof rfqPackets.$inferSelect;

// Relations
export const supplierRfqAdaptersRelations = relations(supplierRfqAdapters, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [supplierRfqAdapters.supplierId],
    references: [suppliers.id],
  }),
  preferredContact: one(supplierContacts, {
    fields: [supplierRfqAdapters.preferredContactId],
    references: [supplierContacts.id],
  }),
  createdByUser: one(users, {
    fields: [supplierRfqAdapters.createdBy],
    references: [users.id],
  }),
  retiredByUser: one(users, {
    fields: [supplierRfqAdapters.retiredBy],
    references: [users.id],
  }),
  packets: many(rfqPackets),
}));

export const rfqPacketsRelations = relations(rfqPackets, ({ one }) => ({
  rfoRequest: one(rfoRequests, {
    fields: [rfqPackets.rfoRequestId],
    references: [rfoRequests.id],
  }),
  deal: one(deals, {
    fields: [rfqPackets.dealId],
    references: [deals.id],
  }),
  supplier: one(suppliers, {
    fields: [rfqPackets.supplierId],
    references: [suppliers.id],
  }),
  adapter: one(supplierRfqAdapters, {
    fields: [rfqPackets.adapterId],
    references: [supplierRfqAdapters.id],
  }),
  createdByUser: one(users, {
    fields: [rfqPackets.createdBy],
    references: [users.id],
  }),
  sentByUser: one(users, {
    fields: [rfqPackets.sentBy],
    references: [users.id],
  }),
  communicationLogEntry: one(communicationLog, {
    fields: [rfqPackets.communicationLogId],
    references: [communicationLog.id],
  }),
}));

// ============== END SUPPLIER RFQ ADAPTER LAYER ==============

// ============== CLIENT DOSSIER v2 ==============

// Dossier Status
export const DOSSIER_STATUS = ['DRAFT', 'READY', 'LOCKED'] as const;
export type DossierStatus = typeof DOSSIER_STATUS[number];

// Connection Type
export const CONNECTION_TYPE = ['GROUP_A', 'GROUP_B'] as const;
export type ConnectionType = typeof CONNECTION_TYPE[number];

// Eligibility Type
export const ELIGIBILITY_TYPE = ['ACL_DIRECT', 'ACL_VAREJISTA', 'NOT_ELIGIBLE_YET'] as const;
export type EligibilityType = typeof ELIGIBILITY_TYPE[number];

// Submarket
export const SUBMARKET = ['SE/CO', 'S', 'NE', 'N'] as const;
export type Submarket = typeof SUBMARKET[number];

// Confidence Score
export const CONFIDENCE_SCORE = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type ConfidenceScore = typeof CONFIDENCE_SCORE[number];

// Client Dossiers - Canonical energy profile for each client
export const clientDossiers = pgTable("client_dossiers", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull().unique(),
  
  // Identification
  legalName: text("legal_name").notNull(),
  tradeName: text("trade_name"),
  cnpj: text("cnpj").notNull(),
  
  // Energy Structure
  distributor: text("distributor"),
  submarket: text("submarket"), // SE/CO, S, NE, N
  connectionType: text("connection_type"), // GROUP_A, GROUP_B
  eligibilityType: text("eligibility_type"), // ACL_DIRECT, ACL_VAREJISTA, NOT_ELIGIBLE_YET
  
  // Consumption Profile
  annualConsumptionMWh: decimal("annual_consumption_mwh", { precision: 12, scale: 2 }),
  averageMonthlyMWh: decimal("average_monthly_mwh", { precision: 12, scale: 2 }),
  peakDemandKW: decimal("peak_demand_kw", { precision: 10, scale: 2 }),
  numberOfUCs: integer("number_of_ucs").default(1),
  tariffClass: text("tariff_class"), // A4, A3, A2, etc.
  
  // Source & Confidence
  dataSources: jsonb("data_sources").default([]), // ['OCR', 'MANUAL', 'CLIENT_CONFIRMATION']
  confidenceScore: text("confidence_score").default("LOW"), // LOW, MEDIUM, HIGH
  lastValidatedAt: timestamp("last_validated_at"),
  validatedBy: varchar("validated_by").references(() => users.id),
  
  // Operational Status
  status: text("status").default("DRAFT").notNull(), // DRAFT, READY, LOCKED
  lockedAt: timestamp("locked_at"),
  lockedBy: varchar("locked_by").references(() => users.id),
  
  // Notes
  opsNotes: text("ops_notes"),
  isDemo: boolean("is_demo").default(false), // Demo/sandbox data flag
  
  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertClientDossierSchema = createInsertSchema(clientDossiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lockedAt: true,
  lockedBy: true,
  lastValidatedAt: true,
  isDemo: true,
});

export type InsertClientDossier = z.infer<typeof insertClientDossierSchema>;
export type ClientDossier = typeof clientDossiers.$inferSelect;

// Client Dossier Snapshots - Immutable snapshots for RFQ attachment
export const clientDossierSnapshots = pgTable("client_dossier_snapshots", {
  id: serial("id").primaryKey(),
  clientDossierId: integer("client_dossier_id").references(() => clientDossiers.id).notNull(),
  dealId: varchar("deal_id").references(() => deals.id),
  rfoRequestId: integer("rfo_request_id").references(() => rfoRequests.id),
  
  // Full snapshot data
  snapshotData: jsonb("snapshot_data").notNull(), // Full dossier JSON
  
  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertClientDossierSnapshotSchema = createInsertSchema(clientDossierSnapshots).omit({
  id: true,
  createdAt: true,
});

export type InsertClientDossierSnapshot = z.infer<typeof insertClientDossierSnapshotSchema>;
export type ClientDossierSnapshot = typeof clientDossierSnapshots.$inferSelect;

// Relations
export const clientDossiersRelations = relations(clientDossiers, ({ one, many }) => ({
  client: one(clients, {
    fields: [clientDossiers.clientId],
    references: [clients.id],
  }),
  validatedByUser: one(users, {
    fields: [clientDossiers.validatedBy],
    references: [users.id],
  }),
  lockedByUser: one(users, {
    fields: [clientDossiers.lockedBy],
    references: [users.id],
  }),
  snapshots: many(clientDossierSnapshots),
}));

export const clientDossierSnapshotsRelations = relations(clientDossierSnapshots, ({ one }) => ({
  dossier: one(clientDossiers, {
    fields: [clientDossierSnapshots.clientDossierId],
    references: [clientDossiers.id],
  }),
  deal: one(deals, {
    fields: [clientDossierSnapshots.dealId],
    references: [deals.id],
  }),
  rfoRequest: one(rfoRequests, {
    fields: [clientDossierSnapshots.rfoRequestId],
    references: [rfoRequests.id],
  }),
  createdByUser: one(users, {
    fields: [clientDossierSnapshots.createdBy],
    references: [users.id],
  }),
}));

// ============== END CLIENT DOSSIER ==============

// ============== END COMMISSION OS SCHEMA ==============

// ============== END DEAL OS SCHEMA ==============

// ECOS Relations
export const clientContractsRelations = relations(clientContracts, ({ one, many }) => ({
  client: one(clients, {
    fields: [clientContracts.clientId],
    references: [clients.id],
  }),
  decisionLogs: many(ecosDecisionLogs),
  quarterlyReports: many(quarterlyReports),
}));

export const ecosDecisionLogsRelations = relations(ecosDecisionLogs, ({ one }) => ({
  client: one(clients, {
    fields: [ecosDecisionLogs.clientId],
    references: [clients.id],
  }),
  contract: one(clientContracts, {
    fields: [ecosDecisionLogs.contractId],
    references: [clientContracts.id],
  }),
  benchmark: one(marketPriceBenchmarks, {
    fields: [ecosDecisionLogs.benchmarkId],
    references: [marketPriceBenchmarks.id],
  }),
}));

export const quarterlyReportsRelations = relations(quarterlyReports, ({ one }) => ({
  client: one(clients, {
    fields: [quarterlyReports.clientId],
    references: [clients.id],
  }),
  contract: one(clientContracts, {
    fields: [quarterlyReports.contractId],
    references: [clientContracts.id],
  }),
  decisionLog: one(ecosDecisionLogs, {
    fields: [quarterlyReports.decisionLogId],
    references: [ecosDecisionLogs.id],
  }),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  user: one(users, {
    fields: [adminSessions.userId],
    references: [users.id],
  }),
}));

export const leadEcosSnapshotsRelations = relations(leadEcosSnapshots, ({ one }) => ({
  lead: one(leads, {
    fields: [leadEcosSnapshots.leadId],
    references: [leads.id],
  }),
  benchmark: one(marketPriceBenchmarks, {
    fields: [leadEcosSnapshots.benchmarkIdUsed],
    references: [marketPriceBenchmarks.id],
  }),
}));

// ============== SUPPLIER RFQ ADAPTER ==============

// Supplier RFQ Playbooks - per-supplier RFQ preferences and templates
export const supplierRfqPlaybooks = pgTable("supplier_rfq_playbooks", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  version: integer("version").default(1).notNull(),
  status: text("status").default("ACTIVE").notNull(), // ACTIVE, RETIRED
  
  // Channel preference
  preferredChannel: text("preferred_channel").notNull(), // EMAIL, WHATSAPP, PORTAL, OTHER
  
  // Required data fields for RFQ
  requiredFields: jsonb("required_fields").default([]), // ['ucCodes', 'demandKw', 'monthlyMwh', ...]
  
  // Email configuration
  emailConfig: jsonb("email_config"), // { toEmails[], ccEmails[], subjectTemplate, bodyTemplate, attachmentsRequired[] }
  
  // WhatsApp configuration  
  whatsappConfig: jsonb("whatsapp_config"), // { phoneNumbers[], messageTemplate }
  
  // Portal configuration
  portalConfig: jsonb("portal_config"), // { portalUrl, loginNotes, uploadSteps[] }
  
  // SLA configuration
  slaConfig: jsonb("sla_config"), // { quoteDueHours, followupCadenceHours[] }
  
  // Internal notes
  internalNotes: text("internal_notes"),
  
  // ============== OPERATIONAL DIFFERENTIATORS (VAREJISTA PLAYBOOK) ==============
  
  // A) Onboarding SLA + Response Behavior
  onboardingSlaDays: integer("onboarding_sla_days"), // Days to complete onboarding
  quoteResponseSlaHours: integer("quote_response_sla_hours"), // Hours expected for quote response
  relationshipNotes: text("relationship_notes"), // "Falar com Maria, responde depois das 15h"
  
  // B) Products Quoted
  productsSupported: text("products_supported").array(), // ['CONVENCIONAL', 'INCENTIVADA_50', 'INCENTIVADA_100']
  
  // C) Submarkets Covered
  submarketsCovered: text("submarkets_covered").array(), // ['SE_CO', 'S', 'NE', 'N']
  
  // D) RFQ Intake Format
  rfqIntakeMethod: text("rfq_intake_method"), // EMAIL, PORTAL, WHATSAPP, OTHER
  rfqTemplateRequired: boolean("rfq_template_required").default(false),
  rfqTemplateId: text("rfq_template_id"), // Link to template doc
  rfqRequiredFields: jsonb("rfq_required_fields").default([]), // Checklist of required fields
  rfqAttachmentRequirements: jsonb("rfq_attachment_requirements").default([]), // ['bills', 'UC list', 'contrato atual']
  
  // E) Required Docs / Guarantees / Credit Turnaround
  docsRequired: jsonb("docs_required").default([]), // Required documents for onboarding
  guaranteesSupported: text("guarantees_supported").array(), // ['none', 'deposito', 'fiança', 'seguro_garantia']
  creditTurnaroundDays: integer("credit_turnaround_days"), // Days for credit approval
  commonCreditRejectReasons: jsonb("common_credit_reject_reasons").default([]), // Common rejection reasons
  
  // F) Commission Reporting
  commissionReportFormat: text("commission_report_format"), // PDF, EXCEL, CSV, PORTAL, EMAIL_BODY
  commissionReportFrequency: text("commission_report_frequency"), // MONTHLY, QUARTERLY, UPFRONT, MIXED
  commissionReportFieldsExpected: jsonb("commission_report_fields_expected").default([]), // Expected fields
  
  // G) Consumption Variance Treatment
  varianceMethod: text("variance_method"), // TRUE_UP, CLAWBACK, OFFSET, OTHER
  varianceFrequency: text("variance_frequency"), // MONTHLY, QUARTERLY, ANNUAL
  varianceNotes: text("variance_notes"), // "faz compensação no mês seguinte"
  
  // ============== END OPERATIONAL DIFFERENTIATORS ==============
  
  // Audit
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  retiredAt: timestamp("retired_at"),
  retiredBy: varchar("retired_by").references(() => users.id),
  isDemo: boolean("is_demo").default(false), // Demo/sandbox data flag
});

export const insertSupplierRfqPlaybookSchema = createInsertSchema(supplierRfqPlaybooks).omit({
  id: true,
  createdAt: true,
  retiredAt: true,
  isDemo: true,
});

export type InsertSupplierRfqPlaybook = z.infer<typeof insertSupplierRfqPlaybookSchema>;
export type SupplierRfqPlaybook = typeof supplierRfqPlaybooks.$inferSelect;

// RFQ Dispatches - individual RFQ sends to suppliers
export const rfqDispatches = pgTable("rfq_dispatches", {
  id: serial("id").primaryKey(),
  dealId: varchar("deal_id").references(() => deals.id).notNull(),
  rfqRequestId: integer("rfq_request_id").references(() => rfoRequests.id),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  
  // Playbook snapshot
  supplierRfqPlaybookId: integer("supplier_rfq_playbook_id").references(() => supplierRfqPlaybooks.id),
  playbookVersion: integer("playbook_version"),
  
  // Dossier snapshot reference
  dossierSnapshotId: integer("dossier_snapshot_id").references(() => clientDossierSnapshots.id),
  
  // Channel and status
  channelUsed: text("channel_used").notNull(), // EMAIL, WHATSAPP, PORTAL, MANUAL
  status: text("status").default("DRAFT").notNull(), // DRAFT, PENDING, SENT, DELIVERED, RESPONDED, CLOSED
  
  // Timing
  sentAt: timestamp("sent_at"),
  dueAt: timestamp("due_at"),
  respondedAt: timestamp("responded_at"),
  
  // Follow-up tracking
  lastFollowupAt: timestamp("last_followup_at"),
  followupCount: integer("followup_count").default(0),
  
  // Assignment
  assignedToUserId: varchar("assigned_to_user_id").references(() => users.id),
  
  // Message content
  messageSubject: text("message_subject"),
  messageBody: text("message_body"),
  attachments: jsonb("attachments").default([]), // [{ fileName, fileUrl, docType }]
  
  // Local overrides (edits for this dispatch only)
  localOverrides: jsonb("local_overrides"), // { subject, body, attachments }
  overrideReason: text("override_reason"),
  
  // Evidence
  evidenceCommunicationLogId: integer("evidence_communication_log_id"),
  
  // Demo flag
  isDemo: boolean("is_demo").default(false),
  
  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRfqDispatchSchema = createInsertSchema(rfqDispatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isDemo: true,
  sentAt: true,
  respondedAt: true,
});

export type InsertRfqDispatch = z.infer<typeof insertRfqDispatchSchema>;
export type RfqDispatch = typeof rfqDispatches.$inferSelect;

// Dossier Edit Audit Log - tracks edits after READY status
export const dossierEditLogs = pgTable("dossier_edit_logs", {
  id: serial("id").primaryKey(),
  dossierId: integer("dossier_id").references(() => clientDossiers.id).notNull(),
  
  // Edit details
  editedFields: jsonb("edited_fields").notNull(), // [{ field, oldValue, newValue }]
  editReason: text("edit_reason").notNull(),
  
  // Audit
  editedBy: varchar("edited_by").references(() => users.id).notNull(),
  editedAt: timestamp("edited_at").defaultNow().notNull(),
});

export const insertDossierEditLogSchema = createInsertSchema(dossierEditLogs).omit({
  id: true,
  editedAt: true,
});

export type InsertDossierEditLog = z.infer<typeof insertDossierEditLogSchema>;
export type DossierEditLog = typeof dossierEditLogs.$inferSelect;

// Deal Transition Override Logs - admin overrides of blockers
export const dealTransitionOverrides = pgTable("deal_transition_overrides", {
  id: serial("id").primaryKey(),
  dealId: varchar("deal_id").references(() => deals.id).notNull(),
  
  // Transition details
  fromState: text("from_state").notNull(),
  toState: text("to_state").notNull(),
  
  // Blockers overridden
  blockersOverridden: jsonb("blockers_overridden").notNull(), // [{ code, title, description }]
  
  // Override justification
  overrideReason: text("override_reason").notNull(),
  typedConfirmation: text("typed_confirmation").notNull(), // Must be "OVERRIDE"
  
  // Audit
  overriddenBy: varchar("overridden_by").references(() => users.id).notNull(),
  overriddenAt: timestamp("overridden_at").defaultNow().notNull(),
});

export const insertDealTransitionOverrideSchema = createInsertSchema(dealTransitionOverrides).omit({
  id: true,
  overriddenAt: true,
});

export type InsertDealTransitionOverride = z.infer<typeof insertDealTransitionOverrideSchema>;
export type DealTransitionOverride = typeof dealTransitionOverrides.$inferSelect;

// Supplier RFQ Playbook Relations
export const supplierRfqPlaybooksRelations = relations(supplierRfqPlaybooks, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierRfqPlaybooks.supplierId],
    references: [suppliers.id],
  }),
  createdByUser: one(users, {
    fields: [supplierRfqPlaybooks.createdBy],
    references: [users.id],
  }),
}));

// RFQ Dispatch Relations
export const rfqDispatchesRelations = relations(rfqDispatches, ({ one }) => ({
  deal: one(deals, {
    fields: [rfqDispatches.dealId],
    references: [deals.id],
  }),
  supplier: one(suppliers, {
    fields: [rfqDispatches.supplierId],
    references: [suppliers.id],
  }),
  playbook: one(supplierRfqPlaybooks, {
    fields: [rfqDispatches.supplierRfqPlaybookId],
    references: [supplierRfqPlaybooks.id],
  }),
  dossierSnapshot: one(clientDossierSnapshots, {
    fields: [rfqDispatches.dossierSnapshotId],
    references: [clientDossierSnapshots.id],
  }),
  assignedUser: one(users, {
    fields: [rfqDispatches.assignedToUserId],
    references: [users.id],
  }),
}));

// ============== END SUPPLIER RFQ ADAPTER ==============

// ============== OPS GUARDRAILS SYSTEM ==============

// User Tooltip State - tracks which tooltips user has dismissed
export const userTooltipState = pgTable("user_tooltip_state", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  tooltipKey: text("tooltip_key").notNull(), // unique identifier like 'dossier.first_open', 'rfq.send_warning'
  dismissedAt: timestamp("dismissed_at").defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.tooltipKey),
]);

export const insertUserTooltipStateSchema = createInsertSchema(userTooltipState).omit({
  id: true,
  dismissedAt: true,
});

export type InsertUserTooltipState = z.infer<typeof insertUserTooltipStateSchema>;
export type UserTooltipState = typeof userTooltipState.$inferSelect;

// Ops Checklists - checklist templates per deal stage
export const opsChecklists = pgTable("ops_checklists", {
  id: serial("id").primaryKey(),
  dealStage: text("deal_stage").notNull(), // DRAFT, PROSPECTING, QUALIFICATION, etc.
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOpsChecklistSchema = createInsertSchema(opsChecklists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOpsChecklist = z.infer<typeof insertOpsChecklistSchema>;
export type OpsChecklist = typeof opsChecklists.$inferSelect;

// Ops Checklist Items - individual items within a checklist
export const opsChecklistItems = pgTable("ops_checklist_items", {
  id: serial("id").primaryKey(),
  checklistId: integer("checklist_id").references(() => opsChecklists.id).notNull(),
  itemKey: text("item_key").notNull(), // unique key like 'dossier_verified', 'bills_uploaded'
  label: text("label").notNull(), // "Dossiê verificado e completo"
  description: text("description"), // Why this matters
  helpText: text("help_text"), // How to complete this
  isBlocking: boolean("is_blocking").default(false).notNull(), // If true, blocks deal transition
  requiresEvidence: boolean("requires_evidence").default(false), // If true, needs file upload
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOpsChecklistItemSchema = createInsertSchema(opsChecklistItems).omit({
  id: true,
  createdAt: true,
});

export type InsertOpsChecklistItem = z.infer<typeof insertOpsChecklistItemSchema>;
export type OpsChecklistItem = typeof opsChecklistItems.$inferSelect;

// Deal Checklist Completions - tracks completion of checklist items per deal
export const dealChecklistCompletions = pgTable("deal_checklist_completions", {
  id: serial("id").primaryKey(),
  dealId: varchar("deal_id").references(() => deals.id).notNull(),
  checklistItemId: integer("checklist_item_id").references(() => opsChecklistItems.id).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by").references(() => users.id),
  notes: text("notes"),
  evidenceDocId: integer("evidence_doc_id"), // Reference to uploaded evidence
  evidenceUrl: text("evidence_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique().on(table.dealId, table.checklistItemId),
]);

export const insertDealChecklistCompletionSchema = createInsertSchema(dealChecklistCompletions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDealChecklistCompletion = z.infer<typeof insertDealChecklistCompletionSchema>;
export type DealChecklistCompletion = typeof dealChecklistCompletions.$inferSelect;

// Ops Playbooks - error scenarios with actions ("If X → Do Y")
export const opsPlaybooks = pgTable("ops_playbooks", {
  id: serial("id").primaryKey(),
  scenarioKey: text("scenario_key").notNull().unique(), // 'supplier_no_response', 'quote_incoherent', etc.
  title: text("title").notNull(), // "Varejista não respondeu"
  description: text("description"), // Longer explanation
  triggerConditions: jsonb("trigger_conditions").default([]), // Conditions that trigger this playbook
  severity: text("severity").default("MEDIUM"), // LOW, MEDIUM, HIGH, CRITICAL
  applicableStages: text("applicable_stages").array(), // ['RFQ_SENT', 'QUOTE_ANALYSIS']
  actionSteps: jsonb("action_steps").default([]), // [{ order, action, description, dueHours }]
  escalationPath: jsonb("escalation_path"), // { afterHours, escalateTo, method }
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOpsPlaybookSchema = createInsertSchema(opsPlaybooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOpsPlaybook = z.infer<typeof insertOpsPlaybookSchema>;
export type OpsPlaybook = typeof opsPlaybooks.$inferSelect;

// Ops Error Events - tracks mistakes/failures for heatmap and metrics
export const opsErrorEvents = pgTable("ops_error_events", {
  id: serial("id").primaryKey(),
  dealId: varchar("deal_id").references(() => deals.id),
  userId: varchar("user_id").references(() => users.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  errorType: text("error_type").notNull(), // 'CHECKLIST_FAILURE', 'SLA_BREACH', 'DEAL_REVERSAL', 'RFQ_RESTART', 'DISPUTE'
  errorCategory: text("error_category"), // 'DOCUMENTATION', 'COMMUNICATION', 'PROCESS', 'DATA_QUALITY'
  dealStage: text("deal_stage"), // Stage when error occurred
  severity: text("severity").default("MEDIUM"), // LOW, MEDIUM, HIGH, CRITICAL
  description: text("description"),
  rootCause: text("root_cause"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOpsErrorEventSchema = createInsertSchema(opsErrorEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertOpsErrorEvent = z.infer<typeof insertOpsErrorEventSchema>;
export type OpsErrorEvent = typeof opsErrorEvents.$inferSelect;

// Ops Performance Snapshots - daily/weekly aggregated metrics per user
export const opsPerformanceSnapshots = pgTable("ops_performance_snapshots", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  periodType: text("period_type").notNull(), // 'DAILY', 'WEEKLY', 'MONTHLY'
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  dealsHandled: integer("deals_handled").default(0),
  dealsWon: integer("deals_won").default(0),
  dealsLost: integer("deals_lost").default(0),
  avgDealDurationDays: decimal("avg_deal_duration_days", { precision: 10, scale: 2 }),
  avgRfqResponseHours: decimal("avg_rfq_response_hours", { precision: 10, scale: 2 }),
  slaBreachCount: integer("sla_breach_count").default(0),
  checklistRetries: integer("checklist_retries").default(0),
  rfqRestarts: integer("rfq_restarts").default(0),
  errorCount: integer("error_count").default(0),
  disputeCount: integer("dispute_count").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.periodType, table.periodStart),
]);

export const insertOpsPerformanceSnapshotSchema = createInsertSchema(opsPerformanceSnapshots).omit({
  id: true,
  createdAt: true,
});

export type InsertOpsPerformanceSnapshot = z.infer<typeof insertOpsPerformanceSnapshotSchema>;
export type OpsPerformanceSnapshot = typeof opsPerformanceSnapshots.$inferSelect;

// ============== END OPS GUARDRAILS SYSTEM ==============

// ============== ZOHO INTAKE EVENTS ==============

export const zohoIntakeEvents = pgTable("zoho_intake_events", {
  id: serial("id").primaryKey(),
  zohoLeadId: text("zoho_lead_id").notNull(),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  payloadJson: jsonb("payload_json").notNull(), // Full intake payload for audit
  resultStatus: text("result_status").notNull(), // 'CREATED', 'EXISTING', 'REJECTED', 'ERROR'
  portalDealId: varchar("portal_deal_id", { length: 255 }),
  portalClientId: integer("portal_client_id"),
  errorMessage: text("error_message"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const insertZohoIntakeEventSchema = createInsertSchema(zohoIntakeEvents).omit({
  id: true,
  receivedAt: true,
});

export type InsertZohoIntakeEvent = z.infer<typeof insertZohoIntakeEventSchema>;
export type ZohoIntakeEvent = typeof zohoIntakeEvents.$inferSelect;

// ============== END ZOHO INTAKE EVENTS ==============

// ============== ZOHO INTAKE ERRORS (DEAD-LETTER LOG) ==============

export const zohoIntakeErrors = pgTable("zoho_intake_errors", {
  id: serial("id").primaryKey(),
  zohoLeadId: text("zoho_lead_id"), // May be null if payload was malformed
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  payloadJson: jsonb("payload_json"), // Full incoming payload for debugging
  errorType: text("error_type").notNull(), // 'AUTH_FAILED', 'VALIDATION_ERROR', 'DUPLICATE_REJECTED', 'INTERNAL_ERROR'
  errorMessage: text("error_message").notNull(),
  errorDetails: jsonb("error_details"), // Validation errors, stack trace, etc.
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"),
  resolvedNotes: text("resolved_notes"),
});

export const insertZohoIntakeErrorSchema = createInsertSchema(zohoIntakeErrors).omit({
  id: true,
  receivedAt: true,
  resolved: true,
  resolvedAt: true,
  resolvedBy: true,
  resolvedNotes: true,
});

export type InsertZohoIntakeError = z.infer<typeof insertZohoIntakeErrorSchema>;
export type ZohoIntakeError = typeof zohoIntakeErrors.$inferSelect;

// ============== END ZOHO INTAKE ERRORS ==============

// ============== PRC DOCUMENTS & BENCHMARK PUBLISHING ==============

// PRC Parse Status enum values
export const PRC_PARSE_STATUS = ['UPLOADED', 'PARSING', 'PARSED', 'NEEDS_REVIEW', 'VERIFIED', 'PUBLISHED', 'FAILED'] as const;
export type PrcParseStatus = typeof PRC_PARSE_STATUS[number];

// PRC Submarket enum values (Brazilian electricity submarkets - PRC format)
export const PRC_SUBMARKETS = ['SECO', 'SUL', 'NNE', 'NORTE', 'NE', 'UNKNOWN'] as const;
export type PrcSubmarket = typeof PRC_SUBMARKETS[number];

// Product type enum values
export const PRODUCT_TYPES = ['CONVENCIONAL', 'INCENTIVADA', 'INC_I0', 'INC_I50', 'INC_I100', 'UNKNOWN'] as const;
export type ProductType = typeof PRODUCT_TYPES[number];

// Benchmark status enum values
export const BENCHMARK_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type BenchmarkStatus = typeof BENCHMARK_STATUSES[number];

// PRC Documents - Raw PRC PDF uploads + metadata
export const prcDocuments = pgTable("prc_documents", {
  id: serial("id").primaryKey(),
  
  // Supplier reference
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  
  // Reference period
  referenceMonth: text("reference_month").notNull(), // YYYY-MM format
  
  // Source metadata
  sourceName: text("source_name").notNull(), // Auto-generated: "PRC <Supplier> <YYYY-MM>"
  
  // File storage
  fileStorageKey: text("file_storage_key").notNull(), // Object storage key
  fileUrl: text("file_url"), // Public URL if available
  originalFilename: text("original_filename").notNull(),
  fileSizeBytes: integer("file_size_bytes"),
  
  // Upload metadata
  uploadedByUserId: text("uploaded_by_user_id").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  
  // Parse status and quality
  parseStatus: text("parse_status").default("UPLOADED").notNull(), // PRC_PARSE_STATUS
  parseConfidence: integer("parse_confidence"), // 0-100
  parseErrors: jsonb("parse_errors"), // Array of error messages
  parseStartedAt: timestamp("parse_started_at"),
  parseCompletedAt: timestamp("parse_completed_at"),
  
  // Row counts (denormalized for quick display)
  rowsExtracted: integer("rows_extracted").default(0),
  rowsFlagged: integer("rows_flagged").default(0),
  
  // Review/verification
  verifiedByUserId: text("verified_by_user_id").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  
  // Ops notes
  notes: text("notes"),
  
  // Submarket hint (uploader hint for parsing)
  submarketHint: text("submarket_hint"),
  
  // Demo mode flag
  isDemo: boolean("is_demo").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPrcDocumentSchema = createInsertSchema(prcDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  parseStatus: true,
  parseConfidence: true,
  parseErrors: true,
  parseStartedAt: true,
  parseCompletedAt: true,
  rowsExtracted: true,
  rowsFlagged: true,
  verifiedByUserId: true,
  verifiedAt: true,
});

export type InsertPrcDocument = z.infer<typeof insertPrcDocumentSchema>;
export type PrcDocument = typeof prcDocuments.$inferSelect;

// PRC Rows - Parsed structured rows from PRC PDFs
export const prcRows = pgTable("prc_rows", {
  id: serial("id").primaryKey(),
  
  // Parent document
  prcDocumentId: integer("prc_document_id").references(() => prcDocuments.id).notNull(),
  
  // Denormalized for speed
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  referenceMonth: text("reference_month").notNull(), // YYYY-MM
  
  // Market segment
  submarket: text("submarket").notNull(), // SUBMARKETS enum
  
  // Product classification
  productType: text("product_type").notNull(), // PRODUCT_TYPES enum
  
  // Contract term
  termMonths: integer("term_months"), // 12, 24, 36, 60
  termLabel: text("term_label"), // "ANUAL", "TRIANUAL", "QUINQUENAL", "2026-2028"
  
  // Price data
  priceRPerMWh: decimal("price_r_per_mwh", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("BRL").notNull(),
  
  // Parse quality
  confidence: integer("confidence").notNull(), // 0-100
  rawSnippet: text("raw_snippet"), // Exact extracted text fragment
  
  // Deduplication
  rowHash: text("row_hash"), // Hash for detecting duplicates
  
  // Flags
  isOutlierFlag: boolean("is_outlier_flag").default(false),
  outlierReason: text("outlier_reason"),
  
  // Manual corrections
  wasManuallyEdited: boolean("was_manually_edited").default(false),
  editedByUserId: text("edited_by_user_id").references(() => users.id),
  editedAt: timestamp("edited_at"),
  originalValues: jsonb("original_values"), // Pre-edit values for audit
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPrcRowSchema = createInsertSchema(prcRows).omit({
  id: true,
  createdAt: true,
  wasManuallyEdited: true,
  editedByUserId: true,
  editedAt: true,
  originalValues: true,
});

export type InsertPrcRow = z.infer<typeof insertPrcRowSchema>;
export type PrcRow = typeof prcRows.$inferSelect;

// PRC Publish Batches - Track benchmark publishing events
export const prcPublishBatches = pgTable("prc_publish_batches", {
  id: serial("id").primaryKey(),
  
  // Reference period
  referenceMonth: text("reference_month").notNull(), // YYYY-MM
  
  // Batch metadata
  batchName: text("batch_name").notNull(), // e.g., "PRCs 2025-12 (8 suppliers)"
  
  // Source documents
  documentIds: jsonb("document_ids").notNull(), // Array of prc_document IDs
  documentCount: integer("document_count").notNull(),
  totalRowsUsed: integer("total_rows_used").notNull(),
  
  // Published benchmarks
  benchmarkIds: jsonb("benchmark_ids"), // Array of benchmark IDs created
  benchmarksCreated: integer("benchmarks_created").default(0),
  
  // Coverage stats
  coverageStats: jsonb("coverage_stats"), // { submarkets, products, terms }
  
  // Status
  status: text("status").default("DRAFT").notNull(), // DRAFT, PUBLISHED, ARCHIVED
  
  // Audit
  publishedByUserId: text("published_by_user_id").references(() => users.id),
  publishedAt: timestamp("published_at"),
  
  notes: text("notes"),
  isDemo: boolean("is_demo").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPrcPublishBatchSchema = createInsertSchema(prcPublishBatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  benchmarkIds: true,
  benchmarksCreated: true,
  publishedByUserId: true,
  publishedAt: true,
});

export type InsertPrcPublishBatch = z.infer<typeof insertPrcPublishBatchSchema>;
export type PrcPublishBatch = typeof prcPublishBatches.$inferSelect;

// Relations for PRC tables
export const prcDocumentsRelations = relations(prcDocuments, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [prcDocuments.supplierId],
    references: [suppliers.id],
  }),
  uploadedBy: one(users, {
    fields: [prcDocuments.uploadedByUserId],
    references: [users.id],
  }),
  verifiedBy: one(users, {
    fields: [prcDocuments.verifiedByUserId],
    references: [users.id],
  }),
  rows: many(prcRows),
}));

export const prcRowsRelations = relations(prcRows, ({ one }) => ({
  document: one(prcDocuments, {
    fields: [prcRows.prcDocumentId],
    references: [prcDocuments.id],
  }),
  supplier: one(suppliers, {
    fields: [prcRows.supplierId],
    references: [suppliers.id],
  }),
}));

// ============== END PRC DOCUMENTS ==============

// ============== BRAND KIT ==============
// Admin-editable branding configuration for customer-facing documents

export const brandKit = pgTable("brand_kit", {
  id: serial("id").primaryKey(),
  
  // Brand identity
  brandName: text("brand_name").default("Ótima Energia").notNull(),
  tagline: text("tagline"),
  
  // Colors (hex values matching website CSS tokens)
  primaryColor: text("primary_color").default("#9e3ffd").notNull(),
  secondaryColor: text("secondary_color").default("#df0af2").notNull(),
  darkColor: text("dark_color").default("#16163f").notNull(),
  lightBgColor: text("light_bg_color").default("#eee7f1").notNull(),
  textColor: text("text_color").default("#736d77").notNull(),
  
  // Typography
  fontFamily: text("font_family").default("Inter").notNull(),
  headingFontFamily: text("heading_font_family"),
  
  // Logo assets (references to object storage)
  logoUrl: text("logo_url"),
  logoLightUrl: text("logo_light_url"),
  faviconUrl: text("favicon_url"),
  
  // Footer content
  footerText: text("footer_text").default("Ótima Energia • contato@otimaenergia.com • Rio de Janeiro - Brasil"),
  footerPhone: text("footer_phone"),
  footerAddress: text("footer_address"),
  
  // Website reference
  websiteUrl: text("website_url").default("https://otimaenergia.com"),
  websiteStyleRef: text("website_style_ref"),
  
  // Audit
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedByUserId: text("updated_by_user_id").references(() => users.id),
});

export const insertBrandKitSchema = createInsertSchema(brandKit).omit({
  id: true,
  updatedAt: true,
});

export type InsertBrandKit = z.infer<typeof insertBrandKitSchema>;
export type BrandKit = typeof brandKit.$inferSelect;

// ============== END BRAND KIT ==============

// ============== PROPOSAL OS (Deal-Centric) ==============
// Proposals generated from dealQuotes (immutable Deal OS quotes)
// NOTE: This is separate from legacy `proposals` table which uses supplierQuotes

export const dealProposalStatusEnum = ["DRAFT", "GENERATED", "SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"] as const;
export type DealProposalStatus = typeof dealProposalStatusEnum[number];

export const dealProposals = pgTable("deal_proposals", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  
  // Relationships
  dealId: varchar("deal_id", { length: 255 }).references(() => deals.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  
  // Status & lifecycle
  status: text("status").default("DRAFT").notNull(), // DRAFT, GENERATED, SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED
  
  // Public access
  publicId: varchar("public_id", { length: 50 }).unique(), // URL-safe slug for public access
  publicEnabled: boolean("public_enabled").default(true),
  
  // PDF document reference
  pdfDocId: integer("pdf_doc_id").references(() => dealDocuments.id),
  
  // ============ BASELINE (Bill-derived) ============
  // Frozen at proposal creation from client bill data
  baselineConsumptionMwh12m: decimal("baseline_consumption_mwh_12m", { precision: 12, scale: 3 }), // Annual consumption (last 12mo or annualized)
  baselineEnergySupplyCost12m: decimal("baseline_energy_supply_cost_12m", { precision: 14, scale: 2 }), // R$ energy supply component only (extracted or manual)
  baselineIsAnnualized: boolean("baseline_is_annualized").default(false), // True if <12 months data extrapolated
  baselineSourceNote: text("baseline_source_note"), // "Últimos 12 meses" or "Anualizado de X meses"
  
  // ============ BASELINE FALLBACK (when extraction fails) ============
  baselineEnergySupplyCostManual: decimal("baseline_energy_supply_cost_manual", { precision: 14, scale: 2 }), // Manually entered cost
  baselineCostIsProxy: boolean("baseline_cost_is_proxy").default(false), // True if conservative proxy applied
  baselineProxyLabel: text("baseline_proxy_label"), // "Estimativa conservadora" when proxy used
  
  // ============ IMMUTABLE SNAPSHOT ============
  proposalSnapshotJson: jsonb("proposal_snapshot_json"), // Frozen: baseline + quotes + savings + recommendation
  
  // ============ RECOMMENDED OPTION ============
  recommendedItemId: integer("recommended_item_id"), // FK to dealProposalItems.id (operator-selected)
  recommendedReason: text("recommended_reason"), // Preset reason why this is recommended
  
  // ============ PROPOSAL METADATA ============
  proposalTitle: text("proposal_title"), // Custom title if desired
  validUntil: date("valid_until"), // Proposal expiry date
  preparedByName: text("prepared_by_name"), // Sales rep name for PDF
  customNotes: text("custom_notes"), // Additional notes for client
  
  // View tracking
  viewCount: integer("view_count").default(0),
  lastViewedAt: timestamp("last_viewed_at"),
  sentAt: timestamp("sent_at"),
  sentToEmail: text("sent_to_email"),
  sentMessage: text("sent_message"),
  
  // Audit
  createdByUserId: text("created_by_user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  
  // Demo mode
  isDemo: boolean("is_demo").default(false),
});

export const insertDealProposalSchema = createInsertSchema(dealProposals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  lastViewedAt: true,
});

export type InsertDealProposal = z.infer<typeof insertDealProposalSchema>;
export type DealProposal = typeof dealProposals.$inferSelect;

// Deal Proposal Items - Individual quote lines in a deal proposal
export const dealProposalMarginTypeEnum = ["ADD_R_PER_MWH", "ADD_PERCENT"] as const;
export type DealProposalMarginType = typeof dealProposalMarginTypeEnum[number];

export const dealProposalItems = pgTable("deal_proposal_items", {
  id: serial("id").primaryKey(),
  
  // Relationships
  proposalId: varchar("proposal_id", { length: 255 }).references(() => dealProposals.id).notNull(),
  dealQuoteId: varchar("deal_quote_id", { length: 255 }).references(() => dealQuotes.id).notNull(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  
  // Denormalized for stability
  supplierName: text("supplier_name").notNull(),
  
  // Energy product details
  productType: text("product_type"), // CONVENCIONAL, INCENTIVADA, etc.
  energyType: text("energy_type"), // convencional, incentivada (for display)
  submarket: text("submarket"), // SECO, S, NE, N
  termMonths: integer("term_months").notNull(), // Required for term-specific pricing
  validUntil: date("valid_until"),
  indexationType: text("indexation_type"), // IPCA, IGPM, Fixed, etc. (display only)
  
  // Pricing (AUDIT ONLY - supplier base price NEVER shown publicly)
  supplierBaseEnergyPriceRmwh: decimal("supplier_base_energy_price_rmwh", { precision: 10, scale: 4 }),
  
  // Margin calculation
  marginType: text("margin_type").default("ADD_R_PER_MWH").notNull(), // ADD_R_PER_MWH, ADD_PERCENT
  marginValue: decimal("margin_value", { precision: 12, scale: 4 }).default("0").notNull(),
  
  // Client-facing price (SHOWN to customer) - Uplifted price with commission
  clientEnergyPriceRmwh: decimal("client_energy_price_rmwh", { precision: 10, scale: 4 }).notNull(),
  
  // Legacy field for backward compatibility (same as clientEnergyPriceRmwh)
  finalEnergyPriceRmwh: decimal("final_energy_price_rmwh", { precision: 10, scale: 4 }),
  
  // ============ COMPUTED SAVINGS (frozen at proposal creation) ============
  // Based on: baseline_cost_12m vs (MWh_annual × client_price)
  proposedCost12m: decimal("proposed_cost_12m", { precision: 14, scale: 2 }), // Annual cost with this quote
  savings12m: decimal("savings_12m", { precision: 14, scale: 2 }), // baseline_cost_12m - proposed_cost_12m
  savingsTotal: decimal("savings_total", { precision: 14, scale: 2 }), // savings_12m × (term_months / 12)
  savingsMonthlyAvg: decimal("savings_monthly_avg", { precision: 14, scale: 2 }), // savings_total / term_months
  isNegativeSavings: boolean("is_negative_savings").default(false), // True if savings_total < 0
  
  // Display flags
  isRecommended: boolean("is_recommended").default(false),
  displayOrder: integer("display_order").default(0),
  
  // Notes
  publicNotes: text("public_notes"), // Customer-safe notes (max 8-10 words qualitative)
  notesInternal: text("notes_internal"), // Never shown publicly
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDealProposalItemSchema = createInsertSchema(dealProposalItems).omit({
  id: true,
  createdAt: true,
});

export type InsertDealProposalItem = z.infer<typeof insertDealProposalItemSchema>;
export type DealProposalItem = typeof dealProposalItems.$inferSelect;

// Deal Proposal Snapshots - Immutable record of proposal at generation time
export const dealProposalSnapshots = pgTable("deal_proposal_snapshots", {
  id: serial("id").primaryKey(),
  
  // One snapshot per proposal
  proposalId: varchar("proposal_id", { length: 255 }).references(() => dealProposals.id).unique().notNull(),
  
  // Immutable snapshot data
  snapshotJson: jsonb("snapshot_json").notNull(),
  sha256Hash: text("sha256_hash").notNull(),
  
  // Audit
  createdByUserId: text("created_by_user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  isDemo: boolean("is_demo").default(false),
});

export const insertDealProposalSnapshotSchema = createInsertSchema(dealProposalSnapshots).omit({
  id: true,
  createdAt: true,
});

export type InsertDealProposalSnapshot = z.infer<typeof insertDealProposalSnapshotSchema>;
export type DealProposalSnapshot = typeof dealProposalSnapshots.$inferSelect;

// Deal Proposal Views - Track each view of public proposal
export const dealProposalViews = pgTable("deal_proposal_views", {
  id: serial("id").primaryKey(),
  
  proposalId: varchar("proposal_id", { length: 255 }).references(() => dealProposals.id).notNull(),
  
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
  ipHash: text("ip_hash"), // Hashed for privacy
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  
  isDemo: boolean("is_demo").default(false),
});

export const insertDealProposalViewSchema = createInsertSchema(dealProposalViews).omit({
  id: true,
  viewedAt: true,
});

export type InsertDealProposalView = z.infer<typeof insertDealProposalViewSchema>;
export type DealProposalView = typeof dealProposalViews.$inferSelect;

// Relations for Deal Proposal OS
export const dealProposalsRelations = relations(dealProposals, ({ one, many }) => ({
  deal: one(deals, {
    fields: [dealProposals.dealId],
    references: [deals.id],
  }),
  client: one(clients, {
    fields: [dealProposals.clientId],
    references: [clients.id],
  }),
  createdBy: one(users, {
    fields: [dealProposals.createdByUserId],
    references: [users.id],
  }),
  pdfDocument: one(dealDocuments, {
    fields: [dealProposals.pdfDocId],
    references: [dealDocuments.id],
  }),
  items: many(dealProposalItems),
  snapshot: one(dealProposalSnapshots),
  views: many(dealProposalViews),
}));

export const dealProposalItemsRelations = relations(dealProposalItems, ({ one }) => ({
  proposal: one(dealProposals, {
    fields: [dealProposalItems.proposalId],
    references: [dealProposals.id],
  }),
  dealQuote: one(dealQuotes, {
    fields: [dealProposalItems.dealQuoteId],
    references: [dealQuotes.id],
  }),
  supplier: one(suppliers, {
    fields: [dealProposalItems.supplierId],
    references: [suppliers.id],
  }),
}));

export const dealProposalSnapshotsRelations = relations(dealProposalSnapshots, ({ one }) => ({
  proposal: one(dealProposals, {
    fields: [dealProposalSnapshots.proposalId],
    references: [dealProposals.id],
  }),
  createdBy: one(users, {
    fields: [dealProposalSnapshots.createdByUserId],
    references: [users.id],
  }),
}));

export const dealProposalViewsRelations = relations(dealProposalViews, ({ one }) => ({
  proposal: one(dealProposals, {
    fields: [dealProposalViews.proposalId],
    references: [dealProposals.id],
  }),
}));

// ============== END PROPOSAL OS (Deal-Centric) ==============

// ============== FINANCE OS LITE (INVOICING) ==============

export const invoiceAccessLevelEnum = pgEnum("invoice_access_level", [
  "VIEW_ONLY",
  "SEND_ONLY", 
  "MANAGE"
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "DRAFT",
  "SENT",
  "PAID",
  "OVERDUE",
  "CANCELLED"
]);

export const invoiceTypeEnum = pgEnum("invoice_type", [
  "UPFRONT",
  "MONTHLY", 
  "QUARTERLY",
  "FINAL",
  "SUCCESS_FEE",
  "MILESTONE_1",
  "MILESTONE_2",
  "ADJUSTMENT"
]);

export const invoiceEventTypeEnum = pgEnum("invoice_event_type", [
  "CREATED",
  "EDITED",
  "SENT",
  "REMINDER_SENT",
  "PAYMENT_LOGGED",
  "STATUS_CHANGE",
  "CANCELLED"
]);

export const invoicePermissions = pgTable("invoice_permissions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  accessLevel: invoiceAccessLevelEnum("access_level").notNull().default("VIEW_ONLY"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInvoicePermissionSchema = createInsertSchema(invoicePermissions);
export type InsertInvoicePermission = z.infer<typeof insertInvoicePermissionSchema>;
export type InvoicePermission = typeof invoicePermissions.$inferSelect;

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  dealId: varchar("deal_id", { length: 64 }).notNull(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  clientId: integer("client_id").references(() => clients.id),
  commissionEventId: integer("commission_event_id").references(() => dealCommissionEvents.id), // Link to milestone event
  
  invoiceNumber: varchar("invoice_number", { length: 32 }).notNull().unique(),
  invoiceType: invoiceTypeEnum("invoice_type").notNull(),
  status: invoiceStatusEnum("status").notNull().default("DRAFT"),
  
  issueDate: timestamp("issue_date").defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  
  grossAmountBrl: numeric("gross_amount_brl", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("BRL"),
  
  serviceDescription: text("service_description"),
  contractReference: varchar("contract_reference", { length: 128 }),
  paymentTrigger: text("payment_trigger"), // e.g. "Ativação na CCEE", "Assinatura do contrato"
  paymentInstructions: text("payment_instructions"),
  
  pdfUrl: text("pdf_url"),
  emailRecipients: text("email_recipients").array(),
  
  sentAt: timestamp("sent_at"),
  paidAt: timestamp("paid_at"),
  paymentReference: varchar("payment_reference", { length: 128 }),
  
  notes: text("notes"),
  
  // Overdue escalation tracking
  lastReminderSentAt: timestamp("last_reminder_sent_at"),
  reminderCount: integer("reminder_count").default(0),
  opsTaskCreated: boolean("ops_task_created").default(false),
  escalatedAt: timestamp("escalated_at"),
  
  createdBy: varchar("created_by", { length: 64 }),
  updatedBy: varchar("updated_by", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  isDemo: boolean("is_demo").default(false),
});

export const insertInvoiceSchema = createInsertSchema(invoices);
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export const invoiceEvents = pgTable("invoice_events", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  eventType: invoiceEventTypeEnum("event_type").notNull(),
  eventSource: varchar("event_source", { length: 32 }).notNull().default("system"),
  actorId: varchar("actor_id", { length: 64 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvoiceEventSchema = createInsertSchema(invoiceEvents);
export type InsertInvoiceEvent = z.infer<typeof insertInvoiceEventSchema>;
export type InvoiceEvent = typeof invoiceEvents.$inferSelect;

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  deal: one(deals, {
    fields: [invoices.dealId],
    references: [deals.id],
  }),
  supplier: one(suppliers, {
    fields: [invoices.supplierId],
    references: [suppliers.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  createdByUser: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  commissionEvent: one(dealCommissionEvents, {
    fields: [invoices.commissionEventId],
    references: [dealCommissionEvents.id],
  }),
  events: many(invoiceEvents),
}));

export const invoiceEventsRelations = relations(invoiceEvents, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceEvents.invoiceId],
    references: [invoices.id],
  }),
  actor: one(users, {
    fields: [invoiceEvents.actorId],
    references: [users.id],
  }),
}));

export const invoicePermissionsRelations = relations(invoicePermissions, ({ one }) => ({
  user: one(users, {
    fields: [invoicePermissions.userId],
    references: [users.id],
  }),
}));

// ============== END FINANCE OS LITE ==============

// ============== QA TEST RUNS ==============

export const qaTestRuns = pgTable("qa_test_runs", {
  id: serial("id").primaryKey(),
  testKey: text("test_key").notNull(), // e.g., 'suppliers.create', 'bills.upload', 'proposal.generate_pdf'
  status: text("status").notNull(), // 'PASS' or 'FAIL'
  errorMessage: text("error_message"),
  metadataJson: jsonb("metadata_json"), // Additional context (duration, assertions, etc.)
  ranByUserId: varchar("ran_by_user_id").references(() => users.id),
  ranAt: timestamp("ran_at").defaultNow().notNull(),
  isDemo: boolean("is_demo").default(false),
});

export const insertQaTestRunSchema = createInsertSchema(qaTestRuns).omit({
  id: true,
  ranAt: true,
});

export type InsertQaTestRun = z.infer<typeof insertQaTestRunSchema>;
export type QaTestRun = typeof qaTestRuns.$inferSelect;

export const qaTestRunsRelations = relations(qaTestRuns, ({ one }) => ({
  ranBy: one(users, {
    fields: [qaTestRuns.ranByUserId],
    references: [users.id],
  }),
}));

// ============== END QA TEST RUNS ==============

// ============== INBOUND EMAIL LOG ==============

export const inboundEmails = pgTable("inbound_emails", {
  id: serial("id").primaryKey(),
  
  fromEmail: text("from_email"),
  fromName: text("from_name"),
  toEmail: text("to_email"),
  subject: text("subject"),
  textBody: text("text_body"),
  htmlBody: text("html_body"),
  
  envelope: jsonb("envelope"),
  headers: text("headers"),
  
  attachmentCount: integer("attachment_count").default(0),
  attachmentNames: jsonb("attachment_names"),
  
  status: text("status").default("PENDING").notNull(),
  dealId: varchar("deal_id", { length: 255 }),
  quoteId: varchar("quote_id", { length: 255 }),
  
  processedAt: timestamp("processed_at"),
  errorMessage: text("error_message"),
  
  rawPayload: jsonb("raw_payload"),
  
  receivedAt: timestamp("received_at").defaultNow().notNull(),
});

export const insertInboundEmailSchema = createInsertSchema(inboundEmails).omit({
  id: true,
  receivedAt: true,
});

export type InsertInboundEmail = z.infer<typeof insertInboundEmailSchema>;
export type InboundEmail = typeof inboundEmails.$inferSelect;

// ============== END INBOUND EMAIL LOG ==============

// ============== DIAGNOSTIC SUBMISSIONS ==============

export const diagnosticSubmissions = pgTable("diagnostic_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company").notNull(),
  businessType: text("business_type").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  distributor: text("distributor").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  fileKeys: text("file_keys").array(),
  lgpdConsent: boolean("lgpd_consent").default(false).notNull(),
  leadId: integer("lead_id").references(() => leads.id),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDiagnosticSubmissionSchema = createInsertSchema(diagnosticSubmissions).omit({
  id: true,
  createdAt: true,
  leadId: true,
  status: true,
});

export type InsertDiagnosticSubmission = z.infer<typeof insertDiagnosticSubmissionSchema>;
export type DiagnosticSubmission = typeof diagnosticSubmissions.$inferSelect;

// ============== END DIAGNOSTIC SUBMISSIONS ==============

// ============== DEAL TRACKS ==============

export const TRACK_TYPES = ['GDL', 'ACL', 'ACR', 'OTHER'] as const;
export type TrackType = typeof TRACK_TYPES[number];

export const GDL_TRACK_STATUSES = [
  'GDL_NEW',
  'GDL_ELIGIBILITY_PASSED',
  'GDL_DOCS_COMPLETE',
  'GDL_SUBMITTED_TO_PRIME',
  'GDL_PRIME_APPROVED',
  'GDL_PRIME_REJECTED',
  'GDL_PROPOSAL_SENT',
  'GDL_CLIENT_ACCEPTED',
  'GDL_CONTRACT_SENT',
  'GDL_CONTRACT_SIGNED',
  'GDL_CLOSED_WON',
  'GDL_CLOSED_LOST',
] as const;
export type GdlTrackStatus = typeof GDL_TRACK_STATUSES[number];

export const ACL_TRACK_STATUSES = [
  'ACL_NEW',
  'ACL_DOSSIER_READY',
  'ACL_RFQ_SENT',
  'ACL_QUOTES_IN',
  'ACL_NEGOTIATION',
  'ACL_CONTRACT_SIGNED',
  'ACL_CLOSED_WON',
  'ACL_CLOSED_LOST',
] as const;
export type AclTrackStatus = typeof ACL_TRACK_STATUSES[number];

export const ACR_TRACK_STATUSES = [
  'ACR_NEW',
  'ACR_ASSESSMENT',
  'ACR_PROPOSAL_SENT',
  'ACR_ACCEPTED',
  'ACR_CLOSED_WON',
  'ACR_CLOSED_LOST',
] as const;
export type AcrTrackStatus = typeof ACR_TRACK_STATUSES[number];

export const OTHER_TRACK_STATUSES = [
  'OTHER_NEW',
  'OTHER_IN_PROGRESS',
  'OTHER_CLOSED_WON',
  'OTHER_CLOSED_LOST',
] as const;
export type OtherTrackStatus = typeof OTHER_TRACK_STATUSES[number];

export type TrackStatus = GdlTrackStatus | AclTrackStatus | AcrTrackStatus | OtherTrackStatus;

export const TRACK_STATUS_TRANSITIONS: Record<string, string[]> = {
  GDL_NEW: ['GDL_ELIGIBILITY_PASSED', 'GDL_CLOSED_LOST'],
  GDL_ELIGIBILITY_PASSED: ['GDL_DOCS_COMPLETE', 'GDL_CLOSED_LOST'],
  GDL_DOCS_COMPLETE: ['GDL_SUBMITTED_TO_PRIME', 'GDL_CLOSED_LOST'],
  GDL_SUBMITTED_TO_PRIME: ['GDL_PRIME_APPROVED', 'GDL_PRIME_REJECTED'],
  GDL_PRIME_APPROVED: ['GDL_PROPOSAL_SENT', 'GDL_CLOSED_LOST'],
  GDL_PRIME_REJECTED: ['GDL_CLOSED_LOST'],
  GDL_PROPOSAL_SENT: ['GDL_CLIENT_ACCEPTED', 'GDL_CLOSED_LOST'],
  GDL_CLIENT_ACCEPTED: ['GDL_CONTRACT_SENT', 'GDL_CLOSED_LOST'],
  GDL_CONTRACT_SENT: ['GDL_CONTRACT_SIGNED', 'GDL_CLOSED_LOST'],
  GDL_CONTRACT_SIGNED: ['GDL_CLOSED_WON', 'GDL_CLOSED_LOST'],
  GDL_CLOSED_WON: [],
  GDL_CLOSED_LOST: [],

  ACL_NEW: ['ACL_DOSSIER_READY', 'ACL_CLOSED_LOST'],
  ACL_DOSSIER_READY: ['ACL_RFQ_SENT', 'ACL_CLOSED_LOST'],
  ACL_RFQ_SENT: ['ACL_QUOTES_IN', 'ACL_CLOSED_LOST'],
  ACL_QUOTES_IN: ['ACL_NEGOTIATION', 'ACL_CLOSED_LOST'],
  ACL_NEGOTIATION: ['ACL_CONTRACT_SIGNED', 'ACL_CLOSED_LOST'],
  ACL_CONTRACT_SIGNED: ['ACL_CLOSED_WON', 'ACL_CLOSED_LOST'],
  ACL_CLOSED_WON: [],
  ACL_CLOSED_LOST: [],

  ACR_NEW: ['ACR_ASSESSMENT', 'ACR_CLOSED_LOST'],
  ACR_ASSESSMENT: ['ACR_PROPOSAL_SENT', 'ACR_CLOSED_LOST'],
  ACR_PROPOSAL_SENT: ['ACR_ACCEPTED', 'ACR_CLOSED_LOST'],
  ACR_ACCEPTED: ['ACR_CLOSED_WON', 'ACR_CLOSED_LOST'],
  ACR_CLOSED_WON: [],
  ACR_CLOSED_LOST: [],

  OTHER_NEW: ['OTHER_IN_PROGRESS', 'OTHER_CLOSED_LOST'],
  OTHER_IN_PROGRESS: ['OTHER_CLOSED_WON', 'OTHER_CLOSED_LOST'],
  OTHER_CLOSED_WON: [],
  OTHER_CLOSED_LOST: [],
};

export const INITIAL_TRACK_STATUS: Record<TrackType, string> = {
  GDL: 'GDL_NEW',
  ACL: 'ACL_NEW',
  ACR: 'ACR_NEW',
  OTHER: 'OTHER_NEW',
};

export const GDL_REQUIRED_DOC_TYPES = ['ENERGY_BILL', 'CNPJ_CARD', 'LGPD_CONSENT'] as const;
export const TRACK_DOC_TYPES = ['ENERGY_BILL', 'CNPJ_CARD', 'LGPD_CONSENT', 'OTHER'] as const;
export type TrackDocType = typeof TRACK_DOC_TYPES[number];

export const GDL_TRANSITION_GATES: Record<string, (track: any, documents: any[]) => { allowed: boolean; reason?: string }> = {
  GDL_SUBMITTED_TO_PRIME: (track, documents) => {
    const meta = (track.metadata as any) || {};
    const elig = meta.eligibility || {};
    const allElig = elig.hasDistributor && elig.hasCCEEProfile && elig.monthlyDemandKw && elig.voltageLevel;
    if (!allElig) return { allowed: false, reason: 'Eligibility checklist incomplete' };
    const hasBill = documents.some((d: any) => d.documentType === 'ENERGY_BILL');
    const hasConsent = documents.some((d: any) => d.documentType === 'LGPD_CONSENT') || elig.lgpdConsentDigital;
    if (!hasBill) return { allowed: false, reason: 'Energy bill required' };
    if (!hasConsent) return { allowed: false, reason: 'LGPD consent required' };
    return { allowed: true };
  },
  GDL_PRIME_APPROVED: (track) => {
    if (track.status !== 'GDL_SUBMITTED_TO_PRIME') return { allowed: false, reason: 'Must submit to Prime first' };
    return { allowed: true };
  },
  GDL_CLIENT_ACCEPTED: (track) => {
    if (track.status !== 'GDL_PROPOSAL_SENT') return { allowed: false, reason: 'Proposal must be sent first' };
    return { allowed: true };
  },
  GDL_CLOSED_WON: (track) => {
    if (track.status !== 'GDL_CONTRACT_SIGNED') return { allowed: false, reason: 'Contract must be signed first' };
    return { allowed: true };
  },
};

export const dealTracks = pgTable("deal_tracks", {
  id: serial("id").primaryKey(),
  dealId: varchar("deal_id", { length: 255 }).references(() => deals.id).notNull(),
  type: text("type").notNull(),
  partnerId: integer("partner_id"),
  partnerName: text("partner_name"),
  status: text("status").notNull(),
  createdByUserId: text("created_by_user_id"),
  metadata: jsonb("metadata"),
  nextActionAt: timestamp("next_action_at"),
  nextActionText: text("next_action_text"),
  staleAfterDays: integer("stale_after_days").default(7),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDealTrackSchema = createInsertSchema(dealTracks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDealTrack = z.infer<typeof insertDealTrackSchema>;
export type DealTrack = typeof dealTracks.$inferSelect;

export const dealTrackEvents = pgTable("deal_track_events", {
  id: serial("id").primaryKey(),
  trackId: integer("track_id").references(() => dealTracks.id).notNull(),
  eventType: text("event_type").notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status"),
  payload: jsonb("payload"),
  createdByUserId: text("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDealTrackEventSchema = createInsertSchema(dealTrackEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertDealTrackEvent = z.infer<typeof insertDealTrackEventSchema>;
export type DealTrackEvent = typeof dealTrackEvents.$inferSelect;

export const dealTrackDocuments = pgTable("deal_track_documents", {
  id: serial("id").primaryKey(),
  trackId: integer("track_id").references(() => dealTracks.id).notNull(),
  documentType: text("document_type"),
  fileName: text("file_name"),
  fileKey: text("file_key"),
  uploadedByUserId: text("uploaded_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDealTrackDocumentSchema = createInsertSchema(dealTrackDocuments).omit({
  id: true,
  createdAt: true,
});

export type InsertDealTrackDocument = z.infer<typeof insertDealTrackDocumentSchema>;
export type DealTrackDocument = typeof dealTrackDocuments.$inferSelect;

// ============== END DEAL TRACKS ==============
