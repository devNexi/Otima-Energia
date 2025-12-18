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

// Market Price Benchmarks - Manual price band inputs
export const marketPriceBenchmarks = pgTable("market_price_benchmarks", {
  id: serial("id").primaryKey(),
  
  // Segment Info
  segment: text("segment").notNull(), // 'SME', 'Industrial'
  region: text("region").notNull(), // 'Sudeste', 'Sul', 'Nordeste', 'Norte', 'Centro-Oeste'
  contractLengthMonths: integer("contract_length_months").notNull(), // 12, 24, 36
  
  // Price Band (R$/MWh)
  lowerBoundRmwh: decimal("lower_bound_rmwh", { precision: 10, scale: 2 }).notNull(),
  upperBoundRmwh: decimal("upper_bound_rmwh", { precision: 10, scale: 2 }).notNull(),
  
  // Metadata
  effectiveDate: date("effective_date").notNull(),
  expiresAt: date("expires_at"),
  source: text("source"), // Legacy field - use sourceType + sourceDetails instead
  notes: text("notes"),
  updatedBy: text("updated_by").default("admin"),
  
  // Governance Fields
  sourceType: text("source_type"), // 'SupplierQuote', 'BrokerIntel', 'PublicSignal', 'InternalDeal', 'Other'
  sourceDetails: text("source_details"), // Free text for additional context
  sourceUrl: text("source_url"), // Optional link to source document
  confidence: text("confidence").default("Medium"), // 'Low', 'Medium', 'High'
  reviewCadence: text("review_cadence").default("Quarterly"), // 'Monthly', 'Quarterly'
  nextReviewDate: date("next_review_date"),
  lastReviewedAt: timestamp("last_reviewed_at"),
  lastReviewedBy: text("last_reviewed_by"),
  
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

// Admin Audit Log - Track all admin actions
export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  
  // Actor
  actor: text("actor").notNull(), // Username or 'system'
  actorIp: text("actor_ip"),
  
  // Action
  action: text("action").notNull(), // 'login', 'create_client', 'approve_report', 'update_benchmark', etc.
  entityType: text("entity_type"), // 'client', 'contract', 'benchmark', 'report', etc.
  entityId: integer("entity_id"),
  
  // Details
  detailsJson: jsonb("details_json"), // Additional context
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLog).omit({
  id: true,
  timestamp: true,
});

export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;
export type AdminAuditLog = typeof adminAuditLog.$inferSelect;

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
  lostReason: text("lost_reason"), // Why deal was lost
  lostNotes: text("lost_notes"),
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
  
  // Normalized fields (parsed from raw)
  energyType: text("energy_type"),
  priceStructure: text("price_structure"),
  baseEnergyPriceRmwh: decimal("base_energy_price_rmwh", { precision: 10, scale: 4 }),
  indexationRules: jsonb("indexation_rules"),
  flexibilityClauses: jsonb("flexibility_clauses"),
  penaltyClauses: jsonb("penalty_clauses"),
  
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
  
  // Event type
  eventType: text("event_type").notNull(), // 'UPFRONT', 'MONTHLY', 'RECONCILIATION', 'BONUS', 'PENALTY'
  eventIndex: integer("event_index"), // For monthly: 1, 2, 3... etc
  
  // Calculation type and inputs (explicit, not vibes)
  calcType: text("calc_type"), // 'fixed_amount', 'per_mwh', 'percent_spread', 'hybrid'
  calcInputs: jsonb("calc_inputs"), // { volume_mwh, rate_rmwh, spread_percent, caps, floors }
  sourceOfTruth: text("source_of_truth"), // 'supplier_report', 'internal_calc', 'contract_clause'
  evidenceDocId: integer("evidence_doc_id"), // Reference to deal_documents.id
  
  // Amount
  amountBrl: decimal("amount_brl", { precision: 14, scale: 2 }),
  amountFormula: text("amount_formula"), // For calculated amounts: 'actual_consumption * commission_rate'
  isEstimated: boolean("is_estimated").default(true), // True until actual consumption known
  
  // Trigger condition
  dueCondition: text("due_condition"), // 'SUPPLY_LIVE', 'CONTRACT_END', 'MONTHLY', specific date
  expectedDate: date("expected_date"),
  
  // Payment status
  status: text("status").default("FUTURE").notNull(), // 'FUTURE', 'PENDING', 'INVOICED', 'PAID', 'OVERDUE', 'DISPUTED', 'CANCELLED'
  
  // Payment tracking
  invoicedAt: timestamp("invoiced_at"),
  invoiceNumber: text("invoice_number"),
  paidAt: timestamp("paid_at"),
  paidAmount: decimal("paid_amount", { precision: 14, scale: 2 }),
  paymentReference: text("payment_reference"),
  
  // Overdue tracking
  daysOverdue: integer("days_overdue").default(0),
  lastReminderSent: timestamp("last_reminder_sent"),
  reminderCount: integer("reminder_count").default(0),
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDealCommissionEventSchema = createInsertSchema(dealCommissionEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
