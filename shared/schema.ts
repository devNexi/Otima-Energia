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
  source: text("source"), // e.g., 'Internal analysis', 'Supplier quote avg', 'Market report XYZ'
  notes: text("notes"),
  updatedBy: text("updated_by").default("admin"),
  
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
  
  // Market Data Used
  benchmarkId: integer("benchmark_id").references(() => marketPriceBenchmarks.id),
  benchmarkLowerRmwh: decimal("benchmark_lower_rmwh", { precision: 10, scale: 2 }),
  benchmarkUpperRmwh: decimal("benchmark_upper_rmwh", { precision: 10, scale: 2 }),
  
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
