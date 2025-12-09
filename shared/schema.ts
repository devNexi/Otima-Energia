import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, boolean, decimal, jsonb, integer } from "drizzle-orm/pg-core";
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

// Supplier Quotes
export const supplierQuotes = pgTable("supplier_quotes", {
  id: serial("id").primaryKey(),
  rfqId: integer("rfq_id").references(() => quoteRequests.id),
  supplierName: text("supplier_name").notNull(),
  pricePerMwh: decimal("price_per_mwh", { precision: 10, scale: 2 }),
  contractTerms: text("contract_terms"),
  validityDays: integer("validity_days"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
  isSelected: boolean("is_selected").default(false),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
});

export const insertSupplierQuoteSchema = createInsertSchema(supplierQuotes).omit({
  id: true,
  receivedAt: true,
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
  quoteRequest: one(quoteRequests, {
    fields: [supplierQuotes.rfqId],
    references: [quoteRequests.id],
  }),
}));
