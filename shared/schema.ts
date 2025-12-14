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

export type InsertRfoRequest = z.infer<typeof insertRfoRequestSchema>;
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
