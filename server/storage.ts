import { db } from "./db";
export { db };
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
  type LeadEcosSnapshot, type InsertLeadEcosSnapshot,
  type Deal, type InsertDeal,
  type DealStateTransition, type InsertDealStateTransition,
  type DealQuote, type InsertDealQuote,
  type DealCommissionEvent, type InsertDealCommissionEvent,
  type DealDocument, type InsertDealDocument,
  type DealCommissionTermsSnapshot, type InsertDealCommissionTermsSnapshot,
  type DealDispute, type InsertDealDispute,
  type DealChecklistRequirement, type InsertDealChecklistRequirement,
  type SupplierSlaTracking, type InsertSupplierSlaTracking,
  type ClientUsagePeriod, type InsertClientUsagePeriod,
  type SupplierPlaybook, type InsertSupplierPlaybook,
  type SupplierReportImport, type InsertSupplierReportImport,
  type CommissionReconciliationRun, type InsertCommissionReconciliationRun,
  type CommissionReconciliationLine, type InsertCommissionReconciliationLine,
  type DealCase, type InsertDealCase,
  type ComplianceChecklistRequirement, type InsertComplianceChecklistRequirement,
  type DealChecklistItem, type InsertDealChecklistItem,
  type CommunicationLog, type InsertCommunicationLog,
  type PlaybookDealSnapshot, type InsertPlaybookDealSnapshot,
  type SavedAuditFilter, type InsertSavedAuditFilter,
  type NotificationQueue, type InsertNotificationQueue,
  type Partner, type InsertPartner,
  type PartnerReferral, type InsertPartnerReferral,
  type SupplierRfqAdapter, type InsertSupplierRfqAdapter,
  type RfqPacket, type InsertRfqPacket,
  type ClientDossier, type InsertClientDossier,
  type ClientDossierSnapshot, type InsertClientDossierSnapshot,
  type SupplierRfqPlaybook, type InsertSupplierRfqPlaybook,
  type RfqDispatch, type InsertRfqDispatch,
  type DossierEditLog, type InsertDossierEditLog,
  type DealTransitionOverride, type InsertDealTransitionOverride,
  type UserTooltipState, type InsertUserTooltipState,
  type OpsChecklist, type InsertOpsChecklist,
  type OpsChecklistItem, type InsertOpsChecklistItem,
  type DealChecklistCompletion, type InsertDealChecklistCompletion,
  type OpsPlaybook, type InsertOpsPlaybook,
  type OpsErrorEvent, type InsertOpsErrorEvent,
  type OpsPerformanceSnapshot, type InsertOpsPerformanceSnapshot,
  type DealEcosSnapshot, type InsertDealEcosSnapshot,
  type PrcDocument, type InsertPrcDocument,
  type PrcRow, type InsertPrcRow,
  type PrcPublishBatch, type InsertPrcPublishBatch,
  type BrandKit, type InsertBrandKit,
  type DealProposal, type InsertDealProposal,
  type DealProposalItem, type InsertDealProposalItem,
  type DealProposalSnapshot, type InsertDealProposalSnapshot,
  type DealProposalView, type InsertDealProposalView,
  type Invoice, type InsertInvoice,
  type InvoiceEvent, type InsertInvoiceEvent,
  type InvoicePermission, type InsertInvoicePermission,
  type DealState, DEAL_STATES, DEAL_STATE_TRANSITIONS,
  users, leads, clients, uploadSessions, consumptionProfiles, quoteRequests, supplierQuotes, billUploads, suppliers,
  rfoRequests, rfoSupplierTracking, supplierContacts, supplierPortals, rfoTemplates,
  proposals, proposalTemplates, proposalViews,
  clientContracts, marketPriceBenchmarks, ecosSettings, ecosDecisionLogs, quarterlyReports,
  adminAuditLog, adminSessions, portalAccessLogs, leadEcosSnapshots, savedAuditFilters,
  deals, dealStateTransitions, dealQuotes, dealCommissionEvents, dealDocuments,
  dealCommissionTermsSnapshots, dealDisputes, dealChecklistRequirements, supplierSlaTracking,
  clientUsagePeriods, supplierPlaybooks, supplierReportImports,
  commissionReconciliationRuns, commissionReconciliationLines, dealCases,
  complianceChecklistRequirements, dealChecklistItems, communicationLog, playbookDealSnapshots, notificationQueue,
  partners, partnerReferrals,
  supplierRfqAdapters, rfqPackets,
  clientDossiers, clientDossierSnapshots,
  supplierRfqPlaybooks, rfqDispatches, dossierEditLogs, dealTransitionOverrides,
  userTooltipState, opsChecklists, opsChecklistItems, dealChecklistCompletions,
  opsPlaybooks, opsErrorEvents, opsPerformanceSnapshots, dealEcosSnapshots,
  prcDocuments, prcRows, prcPublishBatches,
  brandKit, dealProposals, dealProposalItems, dealProposalSnapshots, dealProposalViews,
  invoices, invoiceEvents, invoicePermissions
} from "@shared/schema";
import { eq, desc, and, sql, lte, gte, lt } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: { username?: string; role?: string }): Promise<User | undefined>;
  updateUserPassword(id: string, hashedPassword: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
  hasAnyUsers(): Promise<boolean>;
  
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
  deleteBenchmark(id: number): Promise<boolean>;
  getOverdueBenchmarks(): Promise<MarketPriceBenchmark[]>;
  markBenchmarkReviewed(id: number, reviewedBy: string): Promise<MarketPriceBenchmark | undefined>;
  
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
  getAuditTrail(filters: {
    actor?: string;
    action?: string;
    entityType?: string;
    entityId?: number;
    clientId?: number;
    dealId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ logs: AdminAuditLog[]; totalCount: number; page: number; pageSize: number }>;
  
  // Saved Audit Filters
  getSavedAuditFilters(userId: string): Promise<SavedAuditFilter[]>;
  createSavedAuditFilter(filter: InsertSavedAuditFilter): Promise<SavedAuditFilter>;
  deleteSavedAuditFilter(id: number, userId: string): Promise<boolean>;
  
  // ECOS - Admin Sessions  
  createAdminSession(session: InsertAdminSession): Promise<AdminSession>;
  getAdminSession(id: string): Promise<AdminSession | undefined>;
  deleteAdminSession(id: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
  
  // ECOS - Portal Access Logs
  logPortalAccess(log: InsertPortalAccessLog): Promise<PortalAccessLog>;
  getPortalAccessLogs(clientId: number): Promise<PortalAccessLog[]>;
  
  // ECOS - Lead Snapshots
  createLeadEcosSnapshot(snapshot: InsertLeadEcosSnapshot): Promise<LeadEcosSnapshot>;
  getLeadEcosSnapshots(leadId: number): Promise<LeadEcosSnapshot[]>;
  getLeadEcosSnapshot(id: number): Promise<LeadEcosSnapshot | undefined>;
  updateLeadEcosSnapshot(id: number, data: Partial<InsertLeadEcosSnapshot>): Promise<LeadEcosSnapshot | undefined>;
  lockLeadEcosSnapshot(id: number, lockedBy: string): Promise<LeadEcosSnapshot | undefined>;
  
  // ECOS - Contract Renewal Alerts (computed)
  getContractsRequiringAction(): Promise<(ClientContract & { daysUntilExpiry: number; computedAlertLevel: string })[]>;
  updateContractRenewalStatus(id: number, renewalStatus: string, notes?: string, reviewedBy?: string): Promise<ClientContract | undefined>;
  
  // ECOS - Benchmark Review Status (computed)
  getBenchmarksRequiringReview(): Promise<(MarketPriceBenchmark & { reviewStatus: string; daysOverdue: number })[]>;
  
  // ECOS - Audit Trail
  getAuditTrailForClient(clientId: number): Promise<any[]>;
  
  // ECOS - Deal Snapshots (Pre-Sales Insight Tool)
  createDealEcosSnapshot(snapshot: InsertDealEcosSnapshot): Promise<DealEcosSnapshot>;
  getDealEcosSnapshots(dealId: string): Promise<DealEcosSnapshot[]>;
  getDealEcosSnapshot(id: number): Promise<DealEcosSnapshot | undefined>;
  getLatestDealEcosSnapshot(dealId: string): Promise<DealEcosSnapshot | undefined>;
  updateDealEcosSnapshot(id: number, data: Partial<InsertDealEcosSnapshot>): Promise<DealEcosSnapshot | undefined>;
  getNextSnapshotVersion(dealId: string): Promise<number>;
  
  // ============== DEAL OS ==============
  // Deals
  createDeal(deal: InsertDeal): Promise<Deal>;
  getDeals(): Promise<Deal[]>;
  getDeal(id: string): Promise<Deal | undefined>;
  getDealsForClient(clientId: number): Promise<Deal[]>;
  updateDeal(id: string, data: Partial<InsertDeal>): Promise<Deal | undefined>;
  getDealsByStatus(status: DealState): Promise<Deal[]>;
  getDealsByOwner(owner: string): Promise<Deal[]>;
  
  // Deal State Machine
  transitionDealState(
    dealId: string, 
    toState: DealState, 
    triggeredBy: string, 
    triggeredByType: 'user' | 'system' | 'ai',
    reason?: string,
    notes?: string,
    requiresApproval?: boolean
  ): Promise<{ success: boolean; deal?: Deal; error?: string }>;
  
  // Deal State Transitions (audit)
  getDealStateTransitions(dealId: string): Promise<DealStateTransition[]>;
  
  // Deal Quotes
  createDealQuote(quote: InsertDealQuote): Promise<DealQuote>;
  getDealQuotes(dealId: string): Promise<DealQuote[]>;
  getDealQuote(id: string): Promise<DealQuote | undefined>;
  updateDealQuote(id: string, data: Partial<InsertDealQuote>): Promise<DealQuote | undefined>;
  selectDealQuote(quoteId: string, reason: string): Promise<DealQuote | undefined>;
  rejectDealQuote(quoteId: string, reason: string): Promise<DealQuote | undefined>;
  setDealQuoteClientPrice(quoteId: string, data: {
    clientEnergyPriceRmwh: string;
    upliftType: string;
    upliftValue: string;
    clientPriceSetBy: string;
    clientPriceSetAt: Date;
    isProposalEligible: boolean;
  }): Promise<DealQuote | undefined>;
  getProposalEligibleQuotes(dealId: string): Promise<DealQuote[]>;
  
  // Deal Commission Events
  createDealCommissionEvent(event: InsertDealCommissionEvent): Promise<DealCommissionEvent>;
  getDealCommissionEvents(dealId: string): Promise<DealCommissionEvent[]>;
  updateDealCommissionEvent(id: number, data: Partial<InsertDealCommissionEvent>): Promise<DealCommissionEvent | undefined>;
  getUpcomingCommissionEvents(daysAhead: number): Promise<DealCommissionEvent[]>;
  getOverdueCommissionEvents(): Promise<DealCommissionEvent[]>;
  
  // Deal Documents
  createDealDocument(document: InsertDealDocument): Promise<DealDocument>;
  getDealDocuments(dealId: string): Promise<DealDocument[]>;
  getDealDocument(id: number): Promise<DealDocument | undefined>;
  verifyDealDocument(id: number, verifiedBy: string): Promise<DealDocument | undefined>;
  
  // Deal OS Dashboard
  getDealOsDashboard(): Promise<{
    totalDeals: number;
    dealsByStatus: Record<string, number>;
    activeCommissionValue: string;
    upcomingPayments: number;
    overduePayments: number;
    dealsRequiringAction: Deal[];
  }>;
  
  // ============== DEAL OS - NEW TABLES ==============
  
  // Commission Terms Snapshots (immutable at CONTRACT_SIGNED)
  createCommissionTermsSnapshot(snapshot: InsertDealCommissionTermsSnapshot): Promise<DealCommissionTermsSnapshot>;
  getCommissionTermsSnapshots(dealId: string): Promise<DealCommissionTermsSnapshot[]>;
  getActiveCommissionTermsSnapshot(dealId: string): Promise<DealCommissionTermsSnapshot | undefined>;
  supersedeCommissionTermsSnapshot(snapshotId: number, newSnapshot: InsertDealCommissionTermsSnapshot): Promise<DealCommissionTermsSnapshot>;
  
  // Deal Disputes
  createDealDispute(dispute: InsertDealDispute): Promise<DealDispute>;
  getDealDisputes(dealId: string): Promise<DealDispute[]>;
  getDealDispute(id: number): Promise<DealDispute | undefined>;
  updateDealDispute(id: number, data: Partial<InsertDealDispute>): Promise<DealDispute | undefined>;
  getOpenDisputes(): Promise<DealDispute[]>;
  getDisputesByStatus(status: string): Promise<DealDispute[]>;
  resolveDealDispute(id: number, resolution: string, resolvedBy: string, resolvedAmount?: string, notes?: string): Promise<DealDispute | undefined>;
  
  // Deal Checklist Requirements (config - what's required per state)
  createChecklistRequirement(requirement: InsertDealChecklistRequirement): Promise<DealChecklistRequirement>;
  getChecklistRequirements(targetState: string): Promise<DealChecklistRequirement[]>;
  getAllChecklistRequirements(): Promise<DealChecklistRequirement[]>;
  updateChecklistRequirement(id: number, data: Partial<InsertDealChecklistRequirement>): Promise<DealChecklistRequirement | undefined>;
  deleteChecklistRequirement(id: number): Promise<void>;
  
  // Supplier SLA Tracking
  createSupplierSlaTracking(tracking: InsertSupplierSlaTracking): Promise<SupplierSlaTracking>;
  getSupplierSlaTrackingForDeal(dealId: string): Promise<SupplierSlaTracking[]>;
  getSupplierSlaTrackingForSupplier(supplierId: number): Promise<SupplierSlaTracking[]>;
  updateSupplierSlaTracking(id: number, data: Partial<InsertSupplierSlaTracking>): Promise<SupplierSlaTracking | undefined>;
  recordSupplierResponse(id: number, responseAt: Date): Promise<SupplierSlaTracking | undefined>;
  getSlaBreach(): Promise<SupplierSlaTracking[]>;

  // ============== COMMISSION OS: USAGE, RECONCILIATION, CASES ==============
  
  // Client Usage Periods
  createUsagePeriod(data: InsertClientUsagePeriod): Promise<ClientUsagePeriod>;
  getUsagePeriods(filters?: { clientId?: number; dealId?: string; from?: string; to?: string }): Promise<ClientUsagePeriod[]>;
  getUsagePeriod(id: string): Promise<ClientUsagePeriod | undefined>;
  updateUsagePeriod(id: string, data: Partial<InsertClientUsagePeriod>): Promise<ClientUsagePeriod | undefined>;
  verifyUsagePeriod(id: string, verifiedByUserId: string): Promise<ClientUsagePeriod | undefined>;
  
  // Supplier Playbooks
  getSupplierPlaybooks(): Promise<SupplierPlaybook[]>;
  getSupplierPlaybook(supplierId: number): Promise<SupplierPlaybook | undefined>;
  getSupplierPlaybookVersions(supplierId: number): Promise<SupplierPlaybook[]>;
  createSupplierPlaybook(data: InsertSupplierPlaybook): Promise<SupplierPlaybook>;
  updateSupplierPlaybook(id: number, data: Partial<InsertSupplierPlaybook>): Promise<SupplierPlaybook>;
  
  // Supplier Report Imports
  createSupplierReportImport(data: InsertSupplierReportImport): Promise<SupplierReportImport>;
  getSupplierReportImports(supplierId?: number): Promise<SupplierReportImport[]>;
  getSupplierReportImport(id: number): Promise<SupplierReportImport | undefined>;
  updateSupplierReportImport(id: number, data: Partial<InsertSupplierReportImport>): Promise<SupplierReportImport | undefined>;
  
  // Commission Reconciliation Runs
  createReconciliationRun(data: InsertCommissionReconciliationRun): Promise<CommissionReconciliationRun>;
  getReconciliationRuns(): Promise<CommissionReconciliationRun[]>;
  getReconciliationRun(id: number): Promise<CommissionReconciliationRun | undefined>;
  updateReconciliationRun(id: number, data: Partial<InsertCommissionReconciliationRun>): Promise<CommissionReconciliationRun | undefined>;
  finalizeReconciliationRun(id: number, finalizedBy: string): Promise<CommissionReconciliationRun | undefined>;
  
  // Commission Reconciliation Lines
  createReconciliationLine(data: InsertCommissionReconciliationLine): Promise<CommissionReconciliationLine>;
  getReconciliationLines(runId: number): Promise<CommissionReconciliationLine[]>;
  getReconciliationLine(id: number): Promise<CommissionReconciliationLine | undefined>;
  updateReconciliationLine(id: number, data: Partial<InsertCommissionReconciliationLine>): Promise<CommissionReconciliationLine | undefined>;
  reconcileLine(id: number, reconciledBy: string): Promise<CommissionReconciliationLine | undefined>;
  
  // Deal Cases
  createDealCase(data: InsertDealCase): Promise<DealCase>;
  getDealCases(dealId: string): Promise<DealCase[]>;
  getOpenDealCases(): Promise<DealCase[]>;
  getDealCase(id: number): Promise<DealCase | undefined>;
  updateDealCase(id: number, data: Partial<InsertDealCase>): Promise<DealCase | undefined>;
  convertCaseToLost(caseId: number, triggeredBy: string, reason: string): Promise<{ success: boolean; case?: DealCase; deal?: Deal; error?: string }>;
  
  // ============== COMPLIANCE LAYER ==============
  
  // Compliance Checklist Requirements (config per transition)
  createComplianceRequirement(data: InsertComplianceChecklistRequirement): Promise<ComplianceChecklistRequirement>;
  getComplianceRequirements(fromState: string, toState: string): Promise<ComplianceChecklistRequirement[]>;
  getAllComplianceRequirements(): Promise<ComplianceChecklistRequirement[]>;
  updateComplianceRequirement(id: number, data: Partial<InsertComplianceChecklistRequirement>): Promise<ComplianceChecklistRequirement | undefined>;
  deleteComplianceRequirement(id: number): Promise<void>;
  
  // Deal Checklist Items (completed items per deal)
  createDealChecklistItem(data: InsertDealChecklistItem): Promise<DealChecklistItem>;
  getDealChecklistItems(dealId: string): Promise<DealChecklistItem[]>;
  getDealChecklistItem(id: number): Promise<DealChecklistItem | undefined>;
  updateDealChecklistItem(id: number, data: Partial<InsertDealChecklistItem>): Promise<DealChecklistItem | undefined>;
  deleteDealChecklistItem(id: number): Promise<void>;
  
  // Compliance Validation
  validateTransitionCompliance(dealId: string, fromState: string, toState: string): Promise<{
    canTransition: boolean;
    missingRequirements: Array<{
      requirementId: number;
      requirementKey: string;
      requirementLabel: string;
      requiredForRoles: string[];
    }>;
    completedRequirements: Array<{
      requirementId: number;
      requirementKey: string;
      completedAt: Date;
      completedBy: string;
    }>;
  }>;
  
  // Communication Log CRUD
  createCommunicationLog(data: InsertCommunicationLog): Promise<CommunicationLog>;
  getCommunicationLogs(filters?: { dealId?: string; clientId?: number; leadId?: number }): Promise<CommunicationLog[]>;
  getCommunicationLog(id: number): Promise<CommunicationLog | undefined>;
  updateCommunicationLog(id: number, data: Partial<InsertCommunicationLog>): Promise<CommunicationLog | undefined>;
  deleteCommunicationLog(id: number): Promise<void>;
  
  // Playbook Deal Snapshots
  createPlaybookDealSnapshot(data: InsertPlaybookDealSnapshot): Promise<PlaybookDealSnapshot>;
  getPlaybookDealSnapshot(dealId: string): Promise<PlaybookDealSnapshot | undefined>;
  
  // Lost Deal Analytics
  getLostDeals(): Promise<Deal[]>;
  
  // Ops Dashboard
  getOpsDashboardTasks(): Promise<{
    dealsBlockedByCompliance: Array<{ deal: Deal; missingCount: number }>;
    openCasesBreachingSla: DealCase[];
    commissionEventsOverdue: DealCommissionEvent[];
    dealsWaitingOnSupplier: Deal[];
  }>;
  
  // Notification Queue
  createNotification(data: InsertNotificationQueue): Promise<NotificationQueue>;
  getPendingNotifications(): Promise<NotificationQueue[]>;
  markNotificationSent(id: number): Promise<void>;
  markNotificationFailed(id: number, reason: string): Promise<void>;
  
  // Partners
  createPartner(data: InsertPartner): Promise<Partner>;
  getPartners(): Promise<Partner[]>;
  getPartner(id: number): Promise<Partner | undefined>;
  getPartnerByEmail(email: string): Promise<Partner | undefined>;
  updatePartner(id: number, data: Partial<InsertPartner & { status?: string; approvedAt?: Date; approvedBy?: string; rejectedAt?: Date; rejectedReason?: string; referralCode?: string }>): Promise<Partner | undefined>;
  
  // Supplier RFQ Adapters
  createSupplierRfqAdapter(data: InsertSupplierRfqAdapter): Promise<SupplierRfqAdapter>;
  getSupplierRfqAdapters(supplierId: number): Promise<SupplierRfqAdapter[]>;
  getActiveSupplierRfqAdapter(supplierId: number): Promise<SupplierRfqAdapter | undefined>;
  getSupplierRfqAdapter(id: number): Promise<SupplierRfqAdapter | undefined>;
  retireSupplierRfqAdapter(id: number, retiredBy: string): Promise<SupplierRfqAdapter | undefined>;
  
  // RFQ Packets
  createRfqPacket(data: InsertRfqPacket): Promise<RfqPacket>;
  getRfqPacketsForRfo(rfoRequestId: number): Promise<RfqPacket[]>;
  getRfqPacket(id: number): Promise<RfqPacket | undefined>;
  updateRfqPacket(id: number, data: Partial<RfqPacket>): Promise<RfqPacket | undefined>;
  markRfqPacketSent(id: number, sentBy: string, sendMethod: string, communicationLogId?: number): Promise<RfqPacket | undefined>;
  recordManualSend(rfoRequestId: number, supplierId: number, userId: string, channel: string, notes: string): Promise<RfqPacket>;
  
  // Client Dossiers
  getClientDossier(clientId: number): Promise<ClientDossier | undefined>;
  getDossierById(id: number): Promise<ClientDossier | undefined>;
  createClientDossier(data: InsertClientDossier): Promise<ClientDossier>;
  updateClientDossier(id: number, data: Partial<InsertClientDossier>, userId: string): Promise<ClientDossier | undefined>;
  markDossierReady(id: number, userId: string): Promise<ClientDossier | undefined>;
  lockDossier(id: number, userId: string): Promise<ClientDossier | undefined>;
  
  // Client Dossier Snapshots
  createDossierSnapshot(data: InsertClientDossierSnapshot): Promise<ClientDossierSnapshot>;
  getDossierSnapshot(id: number): Promise<ClientDossierSnapshot | undefined>;
  getDossierSnapshots(dossierId: number): Promise<ClientDossierSnapshot[]>;
  
  // ============== SUPPLIER RFQ ADAPTER ==============
  // Supplier RFQ Playbooks
  createSupplierRfqPlaybook(data: InsertSupplierRfqPlaybook): Promise<SupplierRfqPlaybook>;
  getSupplierRfqPlaybook(id: number): Promise<SupplierRfqPlaybook | undefined>;
  getActivePlaybookForSupplier(supplierId: number): Promise<SupplierRfqPlaybook | undefined>;
  getSupplierRfqPlaybooks(supplierId: number): Promise<SupplierRfqPlaybook[]>;
  getAllActivePlaybooks(): Promise<SupplierRfqPlaybook[]>;
  retirePlaybook(id: number, userId: string): Promise<SupplierRfqPlaybook | undefined>;
  
  // RFQ Dispatches
  createRfqDispatch(data: InsertRfqDispatch): Promise<RfqDispatch>;
  getRfqDispatch(id: number): Promise<RfqDispatch | undefined>;
  getRfqDispatchesForDeal(dealId: string): Promise<RfqDispatch[]>;
  getRfqDispatchesForSupplier(supplierId: number): Promise<RfqDispatch[]>;
  updateRfqDispatch(id: number, data: Partial<InsertRfqDispatch>): Promise<RfqDispatch | undefined>;
  markRfqDispatchSent(id: number, dueAt: Date): Promise<RfqDispatch | undefined>;
  markRfqDispatchResponded(id: number): Promise<RfqDispatch | undefined>;
  getOverdueRfqDispatches(): Promise<RfqDispatch[]>;
  getAwaitingResponseDispatches(): Promise<RfqDispatch[]>;
  incrementFollowupCount(id: number): Promise<RfqDispatch | undefined>;
  
  // Dossier Edit Logs
  createDossierEditLog(data: InsertDossierEditLog): Promise<DossierEditLog>;
  getDossierEditLogs(dossierId: number): Promise<DossierEditLog[]>;
  
  // Deal Transition Overrides
  createDealTransitionOverride(data: InsertDealTransitionOverride): Promise<DealTransitionOverride>;
  getDealTransitionOverrides(dealId: string): Promise<DealTransitionOverride[]>;
  
  // Supplier Scorecard
  getSupplierScorecard(): Promise<Array<{
    supplier: Supplier;
    totalRfqsSent: number;
    rfqsResponded: number;
    responseRate: number;
    avgResponseHours: number;
    totalQuotes: number;
    wonDeals: number;
    winRate: number;
    avgPrice: number;
  }>>;
  
  // ============== OPS GUARDRAILS ==============
  
  // Tooltips
  getDismissedTooltips(userId: string): Promise<UserTooltipState[]>;
  dismissTooltip(userId: string, tooltipKey: string): Promise<UserTooltipState>;
  resetTooltips(userId: string): Promise<void>;
  
  // Checklists
  getChecklists(dealStage?: string): Promise<OpsChecklist[]>;
  getChecklistItems(checklistId: number): Promise<OpsChecklistItem[]>;
  getDealChecklistCompletions(dealId: string): Promise<DealChecklistCompletion[]>;
  completeChecklistItem(data: InsertDealChecklistCompletion): Promise<DealChecklistCompletion>;
  getBlockingItems(dealId: string, targetStage?: string): Promise<OpsChecklistItem[]>;
  
  // Playbooks
  getPlaybooks(stage?: string, scenarioKey?: string): Promise<OpsPlaybook[]>;
  getPlaybookByKey(scenarioKey: string): Promise<OpsPlaybook | undefined>;
  createOpsPlaybook(data: InsertOpsPlaybook): Promise<OpsPlaybook>;
  
  // Checklists CRUD
  createOpsChecklist(data: InsertOpsChecklist): Promise<OpsChecklist>;
  createOpsChecklistItem(data: InsertOpsChecklistItem): Promise<OpsChecklistItem>;
  
  // Error Tracking
  logOpsError(data: InsertOpsErrorEvent): Promise<OpsErrorEvent>;
  getOpsErrors(filters: { dealId?: string; userId?: string; errorType?: string; limit?: number }): Promise<OpsErrorEvent[]>;
  getErrorHeatmap(options: { groupBy: string; dateFrom?: Date; dateTo?: Date }): Promise<Array<{ key: string; count: number }>>;
  
  // Performance Snapshots
  getPerformanceSnapshots(userId: string, periodType?: string): Promise<OpsPerformanceSnapshot[]>;
  getAllPerformanceSnapshots(options: { periodType?: string; periodStart?: Date; limit?: number }): Promise<OpsPerformanceSnapshot[]>;
  
  // ============== PRC INGESTION & BENCHMARK PUBLISHING ==============
  
  // PRC Documents
  createPrcDocument(data: InsertPrcDocument): Promise<PrcDocument>;
  getPrcDocuments(filters?: { supplierId?: number; referenceMonth?: string; parseStatus?: string; isDemo?: boolean }): Promise<PrcDocument[]>;
  getPrcDocument(id: number): Promise<PrcDocument | undefined>;
  updatePrcDocument(id: number, data: Partial<InsertPrcDocument>): Promise<PrcDocument | undefined>;
  updatePrcDocumentParseStatus(id: number, status: string, confidence?: number, errors?: any[]): Promise<PrcDocument | undefined>;
  verifyPrcDocument(id: number, verifiedByUserId: string): Promise<PrcDocument | undefined>;
  deletePrcDocument(id: number): Promise<void>;
  
  // PRC Rows
  createPrcRow(data: InsertPrcRow): Promise<PrcRow>;
  createPrcRows(rows: InsertPrcRow[]): Promise<PrcRow[]>;
  getPrcRows(documentId: number): Promise<PrcRow[]>;
  getPrcRowsForMonth(referenceMonth: string, isDemo?: boolean): Promise<PrcRow[]>;
  getPrcRow(id: number): Promise<PrcRow | undefined>;
  updatePrcRow(id: number, data: Partial<InsertPrcRow>, editedByUserId?: string): Promise<PrcRow | undefined>;
  deletePrcRow(id: number): Promise<void>;
  deletePrcRowsForDocument(documentId: number): Promise<void>;
  getFlaggedPrcRows(referenceMonth?: string): Promise<PrcRow[]>;
  
  // PRC Publish Batches
  createPrcPublishBatch(data: InsertPrcPublishBatch): Promise<PrcPublishBatch>;
  getPrcPublishBatches(filters?: { referenceMonth?: string; status?: string }): Promise<PrcPublishBatch[]>;
  getPrcPublishBatch(id: number): Promise<PrcPublishBatch | undefined>;
  updatePrcPublishBatch(id: number, data: Partial<InsertPrcPublishBatch>): Promise<PrcPublishBatch | undefined>;
  publishPrcBatch(id: number, publishedByUserId: string, benchmarkIds: number[]): Promise<PrcPublishBatch | undefined>;
  
  // PRC Stats
  getPrcMonthSummary(referenceMonth: string, isDemo?: boolean): Promise<{
    documentCount: number;
    verifiedCount: number;
    totalRows: number;
    flaggedRows: number;
    supplierCoverage: number[];
    submarketCoverage: string[];
    productCoverage: string[];
  }>;
  
  // ============== BRAND KIT ==============
  getBrandKit(): Promise<BrandKit | undefined>;
  updateBrandKit(id: number, data: Partial<InsertBrandKit>): Promise<BrandKit | undefined>;
  
  // ============== DEAL PROPOSALS (Proposal OS) ==============
  createDealProposal(data: InsertDealProposal): Promise<DealProposal>;
  getDealProposals(dealId: string): Promise<DealProposal[]>;
  getAllDealProposals(): Promise<DealProposal[]>;
  getDealProposal(id: string): Promise<DealProposal | undefined>;
  getDealProposalByPublicId(publicId: string): Promise<DealProposal | undefined>;
  updateDealProposal(id: string, data: Partial<InsertDealProposal>): Promise<DealProposal | undefined>;
  deleteDealProposal(id: string): Promise<void>;
  
  // Proposal Items
  createDealProposalItem(data: InsertDealProposalItem): Promise<DealProposalItem>;
  getDealProposalItems(proposalId: string): Promise<DealProposalItem[]>;
  updateDealProposalItem(id: number, data: Partial<InsertDealProposalItem>): Promise<DealProposalItem | undefined>;
  deleteDealProposalItem(id: number): Promise<void>;
  
  // Proposal Snapshots
  createDealProposalSnapshot(data: InsertDealProposalSnapshot): Promise<DealProposalSnapshot>;
  getDealProposalSnapshot(proposalId: string): Promise<DealProposalSnapshot | undefined>;
  
  // Proposal Views
  recordDealProposalView(data: InsertDealProposalView): Promise<DealProposalView>;
  getDealProposalViews(proposalId: string): Promise<DealProposalView[]>;
  incrementDealProposalViewCount(proposalId: string): Promise<void>;
  
  // ============== FINANCE OS (INVOICING) ==============
  // Invoices
  createInvoice(data: InsertInvoice): Promise<Invoice>;
  getInvoices(filters?: { status?: string; dealId?: string; supplierId?: number; isDemo?: boolean }): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  getInvoicesByDeal(dealId: string): Promise<Invoice[]>;
  getInvoiceSummary(isDemo?: boolean): Promise<{
    totalInvoiced: number;
    totalReceived: number;
    totalPending: number;
    totalOverdue: number;
    countByStatus: Record<string, number>;
  }>;
  generateInvoiceNumber(): Promise<string>;
  
  // Invoice Events
  createInvoiceEvent(data: InsertInvoiceEvent): Promise<InvoiceEvent>;
  getInvoiceEvents(invoiceId: number): Promise<InvoiceEvent[]>;
  
  // Invoice Permissions
  getInvoicePermission(userId: string): Promise<InvoicePermission | undefined>;
  setInvoicePermission(userId: string, accessLevel: 'VIEW_ONLY' | 'SEND_ONLY' | 'MANAGE'): Promise<InvoicePermission>;
  getAllInvoicePermissions(): Promise<InvoicePermission[]>;
  
  // Overdue Escalation
  getOverdueInvoices(): Promise<Invoice[]>;
  markReminderSent(invoiceId: number): Promise<Invoice | undefined>;
  markOpsTaskCreated(invoiceId: number): Promise<Invoice | undefined>;
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

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
  }

  async hasAnyUsers(): Promise<boolean> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return (result[0]?.count || 0) > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: string, data: { username?: string; role?: string }): Promise<User | undefined> {
    const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
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
    
    // 14-day expiration for portal upload links
    const PORTAL_TOKEN_EXPIRATION_DAYS = 14;
    
    await this.createUploadSession({
      clientId,
      token,
      accessCode,
      expiresAt: new Date(Date.now() + PORTAL_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000)
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

  async deleteBenchmark(id: number): Promise<boolean> {
    const result = await db.delete(marketPriceBenchmarks)
      .where(eq(marketPriceBenchmarks.id, id))
      .returning();
    return result.length > 0;
  }

  async getOverdueBenchmarks(): Promise<MarketPriceBenchmark[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db.select().from(marketPriceBenchmarks)
      .where(and(
        sql`${marketPriceBenchmarks.nextReviewDate} IS NOT NULL`,
        lte(marketPriceBenchmarks.nextReviewDate, today)
      ))
      .orderBy(marketPriceBenchmarks.nextReviewDate);
  }

  async markBenchmarkReviewed(id: number, reviewedBy: string): Promise<MarketPriceBenchmark | undefined> {
    const benchmark = await this.getBenchmark(id);
    if (!benchmark) return undefined;

    const now = new Date();
    let nextReviewDate: string | null = null;

    if (benchmark.reviewCadence) {
      const nextDate = new Date(now);
      if (benchmark.reviewCadence === 'Monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (benchmark.reviewCadence === 'Quarterly') {
        nextDate.setMonth(nextDate.getMonth() + 3);
      }
      nextReviewDate = nextDate.toISOString().split('T')[0];
    }

    const result = await db.update(marketPriceBenchmarks)
      .set({
        lastReviewedAt: now,
        lastReviewedBy: reviewedBy,
        nextReviewDate: nextReviewDate,
        updatedAt: now
      })
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

  async getAuditTrail(filters: {
    actor?: string;
    action?: string;
    entityType?: string;
    entityId?: number;
    clientId?: number;
    dealId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ logs: AdminAuditLog[]; totalCount: number; page: number; pageSize: number }> {
    const conditions = [];
    
    if (filters.actor) {
      conditions.push(sql`${adminAuditLog.actor} ILIKE ${'%' + filters.actor + '%'}`);
    }
    if (filters.action) {
      conditions.push(sql`${adminAuditLog.action} ILIKE ${'%' + filters.action + '%'}`);
    }
    if (filters.entityType) {
      conditions.push(eq(adminAuditLog.entityType, filters.entityType));
    }
    if (filters.entityId) {
      conditions.push(eq(adminAuditLog.entityId, filters.entityId));
    }
    if (filters.clientId) {
      conditions.push(eq(adminAuditLog.clientId, filters.clientId));
    }
    if (filters.dealId) {
      conditions.push(eq(adminAuditLog.dealId, filters.dealId));
    }
    if (filters.dateFrom) {
      conditions.push(sql`${adminAuditLog.timestamp} >= ${filters.dateFrom}::timestamp`);
    }
    if (filters.dateTo) {
      conditions.push(sql`${adminAuditLog.timestamp} <= ${filters.dateTo}::timestamp + interval '1 day'`);
    }
    
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;
    const offset = (page - 1) * pageSize;
    
    // Get total count
    const countQuery = conditions.length > 0
      ? db.select({ count: sql<number>`count(*)::int` }).from(adminAuditLog).where(and(...conditions))
      : db.select({ count: sql<number>`count(*)::int` }).from(adminAuditLog);
    
    const [countResult] = await countQuery;
    const totalCount = countResult?.count || 0;
    
    // Get paginated results
    const query = conditions.length > 0
      ? db.select().from(adminAuditLog).where(and(...conditions))
      : db.select().from(adminAuditLog);
    
    const logs = await query
      .orderBy(desc(adminAuditLog.timestamp))
      .limit(pageSize)
      .offset(offset);
    
    return { logs, totalCount, page, pageSize };
  }
  
  // Saved Audit Filters
  async getSavedAuditFilters(userId: string): Promise<SavedAuditFilter[]> {
    return await db.select().from(savedAuditFilters)
      .where(eq(savedAuditFilters.userId, userId))
      .orderBy(desc(savedAuditFilters.createdAt));
  }
  
  async createSavedAuditFilter(filter: InsertSavedAuditFilter): Promise<SavedAuditFilter> {
    const result = await db.insert(savedAuditFilters).values(filter).returning();
    return result[0];
  }
  
  async deleteSavedAuditFilter(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(savedAuditFilters)
      .where(and(eq(savedAuditFilters.id, id), eq(savedAuditFilters.userId, userId)))
      .returning();
    return result.length > 0;
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

  // Lead ECOS Snapshots
  async createLeadEcosSnapshot(snapshot: InsertLeadEcosSnapshot): Promise<LeadEcosSnapshot> {
    const result = await db.insert(leadEcosSnapshots).values(snapshot).returning();
    return result[0];
  }

  async getLeadEcosSnapshots(leadId: number): Promise<LeadEcosSnapshot[]> {
    return await db.select().from(leadEcosSnapshots)
      .where(eq(leadEcosSnapshots.leadId, leadId))
      .orderBy(desc(leadEcosSnapshots.generatedAt));
  }

  async getLeadEcosSnapshot(id: number): Promise<LeadEcosSnapshot | undefined> {
    const result = await db.select().from(leadEcosSnapshots).where(eq(leadEcosSnapshots.id, id));
    return result[0];
  }

  async updateLeadEcosSnapshot(id: number, data: Partial<InsertLeadEcosSnapshot>): Promise<LeadEcosSnapshot | undefined> {
    const result = await db.update(leadEcosSnapshots)
      .set(data)
      .where(eq(leadEcosSnapshots.id, id))
      .returning();
    return result[0];
  }

  async lockLeadEcosSnapshot(id: number, lockedBy: string): Promise<LeadEcosSnapshot | undefined> {
    const result = await db.update(leadEcosSnapshots)
      .set({ locked: true, lockedAt: new Date(), lockedBy })
      .where(eq(leadEcosSnapshots.id, id))
      .returning();
    return result[0];
  }

  async getSnapshotsByBenchmark(benchmarkId: number): Promise<LeadEcosSnapshot[]> {
    return await db.select().from(leadEcosSnapshots)
      .where(eq(leadEcosSnapshots.benchmarkIdUsed, benchmarkId))
      .orderBy(desc(leadEcosSnapshots.generatedAt));
  }

  // ECOS - Contract Renewal Alerts (computed)
  async getContractsRequiringAction(): Promise<(ClientContract & { daysUntilExpiry: number; computedAlertLevel: string })[]> {
    const today = new Date();
    const contracts = await db.select().from(clientContracts)
      .where(eq(clientContracts.status, 'active'))
      .orderBy(clientContracts.contractEnd);
    
    return contracts.map(contract => {
      const contractEnd = new Date(contract.contractEnd);
      const daysUntilExpiry = Math.ceil((contractEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let computedAlertLevel = 'ok';
      if (daysUntilExpiry <= 90) {
        computedAlertLevel = 'critical';
      } else if (daysUntilExpiry <= 120) {
        computedAlertLevel = '120_days';
      } else if (daysUntilExpiry <= 180) {
        computedAlertLevel = '180_days';
      }
      
      return {
        ...contract,
        daysUntilExpiry,
        computedAlertLevel
      };
    }).filter(c => c.computedAlertLevel !== 'ok');
  }

  async updateContractRenewalStatus(
    id: number, 
    renewalStatus: string, 
    notes?: string, 
    reviewedBy?: string
  ): Promise<ClientContract | undefined> {
    const updateData: Record<string, unknown> = {
      renewalStatus,
      lastEcosReviewAt: new Date(),
      updatedAt: new Date()
    };
    if (notes) updateData.renewalNotes = notes;
    if (reviewedBy) updateData.lastEcosReviewBy = reviewedBy;
    
    const result = await db.update(clientContracts)
      .set(updateData)
      .where(eq(clientContracts.id, id))
      .returning();
    return result[0];
  }

  // ECOS - Benchmark Review Status (computed)
  async getBenchmarksRequiringReview(): Promise<(MarketPriceBenchmark & { reviewStatus: string; daysOverdue: number })[]> {
    const today = new Date();
    const benchmarks = await this.getActiveBenchmarks();
    
    return benchmarks.map(benchmark => {
      let reviewStatus = 'Active';
      let daysOverdue = 0;
      
      if (benchmark.nextReviewDate) {
        const nextReview = new Date(benchmark.nextReviewDate);
        daysOverdue = Math.ceil((today.getTime() - nextReview.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysOverdue > 30) {
          reviewStatus = 'Archived';
        } else if (daysOverdue > 0) {
          reviewStatus = 'Needs Review';
        }
      }
      
      return {
        ...benchmark,
        reviewStatus,
        daysOverdue
      };
    }).filter(b => b.reviewStatus !== 'Active');
  }

  // ECOS - Audit Trail
  async getAuditTrailForClient(clientId: number): Promise<any[]> {
    const decisionLogs = await this.getDecisionLogs(clientId);
    const reports = await this.getQuarterlyReports(clientId);
    
    const trail: any[] = [];
    
    for (const log of decisionLogs) {
      const benchmark = log.benchmarkId ? await this.getBenchmark(log.benchmarkId) : null;
      trail.push({
        type: 'decision',
        id: log.id,
        date: log.decisionDate,
        clientId: log.clientId,
        statusResult: log.statusResult,
        recommendation: log.recommendation,
        benchmarkId: log.benchmarkId,
        benchmarkRange: benchmark ? `R$ ${benchmark.lowerBoundRmwh}-${benchmark.upperBoundRmwh}/MWh` : null,
        benchmarkConfidence: log.snapshotConfidence,
        benchmarkReviewedAt: benchmark?.lastReviewedAt,
        clientPrice: log.clientPriceRmwh,
        potentialSavings: log.potentialSavingsR
      });
    }
    
    for (const report of reports) {
      trail.push({
        type: 'report',
        id: report.id,
        date: report.createdAt,
        periodLabel: report.periodLabel,
        statusClassification: report.statusClassification,
        recommendation: report.recommendation,
        approved: report.approved,
        approvedBy: report.approvedBy,
        approvedAt: report.approvedAt
      });
    }
    
    return trail.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // ============== DEAL ECOS SNAPSHOTS (Pre-Sales Insight Tool) ==============
  
  async createDealEcosSnapshot(snapshot: InsertDealEcosSnapshot): Promise<DealEcosSnapshot> {
    const result = await db.insert(dealEcosSnapshots).values(snapshot).returning();
    return result[0];
  }

  async getDealEcosSnapshots(dealId: string): Promise<DealEcosSnapshot[]> {
    return await db.select().from(dealEcosSnapshots)
      .where(eq(dealEcosSnapshots.dealId, dealId))
      .orderBy(desc(dealEcosSnapshots.version));
  }

  async getDealEcosSnapshot(id: number): Promise<DealEcosSnapshot | undefined> {
    const result = await db.select().from(dealEcosSnapshots)
      .where(eq(dealEcosSnapshots.id, id));
    return result[0];
  }

  async getLatestDealEcosSnapshot(dealId: string): Promise<DealEcosSnapshot | undefined> {
    const result = await db.select().from(dealEcosSnapshots)
      .where(eq(dealEcosSnapshots.dealId, dealId))
      .orderBy(desc(dealEcosSnapshots.version))
      .limit(1);
    return result[0];
  }

  async updateDealEcosSnapshot(id: number, data: Partial<InsertDealEcosSnapshot>): Promise<DealEcosSnapshot | undefined> {
    const result = await db.update(dealEcosSnapshots)
      .set(data)
      .where(eq(dealEcosSnapshots.id, id))
      .returning();
    return result[0];
  }

  async getNextSnapshotVersion(dealId: string): Promise<number> {
    const result = await db.select({ maxVersion: sql<number>`COALESCE(MAX(version), 0)` })
      .from(dealEcosSnapshots)
      .where(eq(dealEcosSnapshots.dealId, dealId));
    return (result[0]?.maxVersion ?? 0) + 1;
  }

  // ============== DEAL OS IMPLEMENTATION ==============
  
  // Deals
  async createDeal(deal: InsertDeal): Promise<Deal> {
    const result = await db.insert(deals).values({
      ...deal,
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async getDeals(): Promise<Deal[]> {
    return await db.select().from(deals).orderBy(desc(deals.createdAt));
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    const result = await db.select().from(deals).where(eq(deals.id, id));
    return result[0];
  }

  async getDealsForClient(clientId: number): Promise<Deal[]> {
    return await db.select().from(deals)
      .where(eq(deals.clientId, clientId))
      .orderBy(desc(deals.createdAt));
  }

  async updateDeal(id: string, data: Partial<InsertDeal>): Promise<Deal | undefined> {
    const result = await db.update(deals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return result[0];
  }

  async getDealsByStatus(status: DealState): Promise<Deal[]> {
    return await db.select().from(deals)
      .where(eq(deals.status, status))
      .orderBy(desc(deals.createdAt));
  }

  async getDealsByOwner(owner: string): Promise<Deal[]> {
    return await db.select().from(deals)
      .where(eq(deals.internalOwner, owner))
      .orderBy(desc(deals.createdAt));
  }

  // Deal State Machine - core logic with validation and logging
  async transitionDealState(
    dealId: string,
    toState: DealState,
    triggeredBy: string,
    triggeredByType: 'user' | 'system' | 'ai',
    reason?: string,
    notes?: string,
    requiresApproval?: boolean
  ): Promise<{ success: boolean; deal?: Deal; error?: string }> {
    const deal = await this.getDeal(dealId);
    if (!deal) {
      return { success: false, error: 'Deal not found' };
    }

    const currentState = deal.status as DealState;
    const validTransitions = DEAL_STATE_TRANSITIONS[currentState];

    if (!validTransitions.includes(toState)) {
      return { 
        success: false, 
        error: `Invalid transition: cannot move from ${currentState} to ${toState}. Valid transitions: ${validTransitions.join(', ') || 'none'}` 
      };
    }

    // Log the transition
    await db.insert(dealStateTransitions).values({
      dealId,
      fromState: currentState,
      toState,
      triggeredBy,
      triggeredByType,
      reason,
      notes,
      requiresApproval: requiresApproval || false,
      timestamp: new Date()
    });

    // Update the deal status and corresponding timestamp
    const stateTimestampMap: Record<DealState, string> = {
      'DRAFT': 'createdAt',
      'RFQ_SENT': 'rfqSentAt',
      'QUOTES_RECEIVED': 'quotesReceivedAt',
      'OFFER_SELECTED': 'offerSelectedAt',
      'ONBOARDING_PENDING': 'onboardingPendingAt',
      'CONTRACT_SIGNED': 'contractSignedAt',
      'SUPPLY_LIVE': 'supplyLiveAt',
      'CONTRACT_ENDED': 'contractEndedAt',
      'CLOSED': 'closedAt',
      'LOST': 'lostAt'
    };

    const updateData: Record<string, unknown> = {
      status: toState,
      updatedAt: new Date()
    };

    const timestampField = stateTimestampMap[toState];
    if (timestampField && timestampField !== 'createdAt') {
      updateData[timestampField] = new Date();
    }

    const result = await db.update(deals)
      .set(updateData)
      .where(eq(deals.id, dealId))
      .returning();

    return { success: true, deal: result[0] };
  }

  // Deal State Transitions (audit)
  async getDealStateTransitions(dealId: string): Promise<DealStateTransition[]> {
    return await db.select().from(dealStateTransitions)
      .where(eq(dealStateTransitions.dealId, dealId))
      .orderBy(desc(dealStateTransitions.timestamp));
  }

  // Deal Quotes
  async createDealQuote(quote: InsertDealQuote): Promise<DealQuote> {
    const result = await db.insert(dealQuotes).values({
      ...quote,
      receivedAt: new Date(),
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async getDealQuotes(dealId: string): Promise<DealQuote[]> {
    return await db.select().from(dealQuotes)
      .where(eq(dealQuotes.dealId, dealId))
      .orderBy(desc(dealQuotes.receivedAt));
  }

  async getDealQuote(id: string): Promise<DealQuote | undefined> {
    const result = await db.select().from(dealQuotes).where(eq(dealQuotes.id, id));
    return result[0];
  }

  async updateDealQuote(id: string, data: Partial<InsertDealQuote>): Promise<DealQuote | undefined> {
    const result = await db.update(dealQuotes)
      .set(data)
      .where(eq(dealQuotes.id, id))
      .returning();
    return result[0];
  }

  async selectDealQuote(quoteId: string, reason: string): Promise<DealQuote | undefined> {
    // First, unselect any other selected quotes for this deal
    const quote = await this.getDealQuote(quoteId);
    if (!quote) return undefined;

    await db.update(dealQuotes)
      .set({ isSelected: false })
      .where(eq(dealQuotes.dealId, quote.dealId));

    // Select this quote
    const result = await db.update(dealQuotes)
      .set({ 
        isSelected: true, 
        selectedAt: new Date(),
        selectionReason: reason 
      })
      .where(eq(dealQuotes.id, quoteId))
      .returning();

    // Update the deal with selected quote
    await db.update(deals)
      .set({
        selectedQuoteId: quoteId,
        supplierId: quote.supplierId,
        supplierLegalEntityName: quote.supplierEntity,
        rawSupplierQuoteJson: quote.rawQuoteJson,
        priceStructure: quote.priceStructure,
        baseEnergyPriceRmwh: quote.baseEnergyPriceRmwh,
        indexationRules: quote.indexationRules,
        flexibilityClauses: quote.flexibilityClauses,
        penaltyClauses: quote.penaltyClauses,
        commissionModel: quote.commissionModel,
        commissionValueRmwh: quote.commissionValueRmwh,
        commissionPercentSpread: quote.commissionPercentSpread,
        commissionPaymentType: quote.commissionPaymentType,
        updatedAt: new Date()
      })
      .where(eq(deals.id, quote.dealId));

    return result[0];
  }

  async rejectDealQuote(quoteId: string, reason: string): Promise<DealQuote | undefined> {
    const result = await db.update(dealQuotes)
      .set({ 
        isRejected: true, 
        rejectedAt: new Date(),
        rejectionReason: reason 
      })
      .where(eq(dealQuotes.id, quoteId))
      .returning();
    return result[0];
  }

  async setDealQuoteClientPrice(quoteId: string, data: {
    clientEnergyPriceRmwh: string;
    upliftType: string;
    upliftValue: string;
    clientPriceSetBy: string;
    clientPriceSetAt: Date;
    isProposalEligible: boolean;
  }): Promise<DealQuote | undefined> {
    const result = await db.update(dealQuotes)
      .set({
        clientEnergyPriceRmwh: data.clientEnergyPriceRmwh,
        upliftType: data.upliftType,
        upliftValue: data.upliftValue,
        clientPriceSetBy: data.clientPriceSetBy,
        clientPriceSetAt: data.clientPriceSetAt,
        isProposalEligible: data.isProposalEligible
      })
      .where(eq(dealQuotes.id, quoteId))
      .returning();
    return result[0];
  }

  async getProposalEligibleQuotes(dealId: string): Promise<DealQuote[]> {
    return await db.select().from(dealQuotes)
      .where(and(
        eq(dealQuotes.dealId, dealId),
        eq(dealQuotes.isProposalEligible, true),
        eq(dealQuotes.isRejected, false)
      ))
      .orderBy(desc(dealQuotes.createdAt));
  }

  // Deal Commission Events
  async createDealCommissionEvent(event: InsertDealCommissionEvent): Promise<DealCommissionEvent> {
    const result = await db.insert(dealCommissionEvents).values({
      ...event,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async getDealCommissionEvents(dealId: string): Promise<DealCommissionEvent[]> {
    return await db.select().from(dealCommissionEvents)
      .where(eq(dealCommissionEvents.dealId, dealId))
      .orderBy(dealCommissionEvents.expectedDate);
  }

  async updateDealCommissionEvent(id: number, data: Partial<InsertDealCommissionEvent>): Promise<DealCommissionEvent | undefined> {
    const result = await db.update(dealCommissionEvents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dealCommissionEvents.id, id))
      .returning();
    return result[0];
  }

  async getUpcomingCommissionEvents(daysAhead: number): Promise<DealCommissionEvent[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return await db.select().from(dealCommissionEvents)
      .where(and(
        lte(dealCommissionEvents.expectedDate, futureDate.toISOString().split('T')[0]),
        eq(dealCommissionEvents.status, 'PENDING')
      ))
      .orderBy(dealCommissionEvents.expectedDate);
  }

  async getOverdueCommissionEvents(): Promise<DealCommissionEvent[]> {
    const today = new Date().toISOString().split('T')[0];
    
    return await db.select().from(dealCommissionEvents)
      .where(and(
        lte(dealCommissionEvents.expectedDate, today),
        eq(dealCommissionEvents.status, 'PENDING')
      ))
      .orderBy(dealCommissionEvents.expectedDate);
  }

  // Deal Documents
  async createDealDocument(document: InsertDealDocument): Promise<DealDocument> {
    const result = await db.insert(dealDocuments).values({
      ...document,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async getDealDocuments(dealId: string): Promise<DealDocument[]> {
    return await db.select().from(dealDocuments)
      .where(eq(dealDocuments.dealId, dealId))
      .orderBy(desc(dealDocuments.createdAt));
  }

  async getDealDocument(id: number): Promise<DealDocument | undefined> {
    const result = await db.select().from(dealDocuments).where(eq(dealDocuments.id, id));
    return result[0];
  }

  async verifyDealDocument(id: number, verifiedBy: string): Promise<DealDocument | undefined> {
    const result = await db.update(dealDocuments)
      .set({ 
        isVerified: true, 
        verifiedBy,
        verifiedAt: new Date() 
      })
      .where(eq(dealDocuments.id, id))
      .returning();
    return result[0];
  }

  // Deal OS Dashboard
  async getDealOsDashboard(): Promise<{
    totalDeals: number;
    dealsByStatus: Record<string, number>;
    activeCommissionValue: string;
    upcomingPayments: number;
    overduePayments: number;
    dealsRequiringAction: Deal[];
  }> {
    const allDeals = await this.getDeals();
    
    // Count by status
    const dealsByStatus: Record<string, number> = {};
    for (const state of DEAL_STATES) {
      dealsByStatus[state] = allDeals.filter(d => d.status === state).length;
    }

    // Calculate active commission value (deals in COMMISSION_ACTIVE state)
    const activeDeals = allDeals.filter(d => d.status === 'COMMISSION_ACTIVE');
    const activeCommissionValue = activeDeals.reduce((sum, d) => {
      return sum + (parseFloat(d.expectedCommissionMonthly || '0') || 0);
    }, 0);

    // Get upcoming and overdue payments
    const upcoming = await this.getUpcomingCommissionEvents(30);
    const overdue = await this.getOverdueCommissionEvents();

    // Deals requiring action (stuck too long or missing documents)
    const dealsRequiringAction = allDeals.filter(d => {
      if (d.manualOverrideRequired) return true;
      if (d.missingDocuments && Array.isArray(d.missingDocuments) && d.missingDocuments.length > 0) return true;
      // Check if deal is stuck (in certain states for too long)
      const daysInState = (Date.now() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (['DRAFT', 'RFQ_SENT', 'QUOTES_RECEIVED'].includes(d.status) && daysInState > 14) return true;
      return false;
    });

    return {
      totalDeals: allDeals.length,
      dealsByStatus,
      activeCommissionValue: activeCommissionValue.toFixed(2),
      upcomingPayments: upcoming.length,
      overduePayments: overdue.length,
      dealsRequiringAction
    };
  }

  // ============== DEAL OS - NEW TABLES ==============
  
  // Commission Terms Snapshots
  async createCommissionTermsSnapshot(snapshot: InsertDealCommissionTermsSnapshot): Promise<DealCommissionTermsSnapshot> {
    const result = await db.insert(dealCommissionTermsSnapshots).values({
      ...snapshot,
      snapshotTakenAt: new Date()
    }).returning();
    return result[0];
  }

  async getCommissionTermsSnapshots(dealId: string): Promise<DealCommissionTermsSnapshot[]> {
    return await db.select().from(dealCommissionTermsSnapshots)
      .where(eq(dealCommissionTermsSnapshots.dealId, dealId))
      .orderBy(desc(dealCommissionTermsSnapshots.snapshotTakenAt));
  }

  async getActiveCommissionTermsSnapshot(dealId: string): Promise<DealCommissionTermsSnapshot | undefined> {
    const result = await db.select().from(dealCommissionTermsSnapshots)
      .where(and(
        eq(dealCommissionTermsSnapshots.dealId, dealId),
        eq(dealCommissionTermsSnapshots.isActive, true)
      ));
    return result[0];
  }

  async supersedeCommissionTermsSnapshot(snapshotId: number, newSnapshot: InsertDealCommissionTermsSnapshot): Promise<DealCommissionTermsSnapshot> {
    // Mark old snapshot as inactive
    await db.update(dealCommissionTermsSnapshots)
      .set({ isActive: false })
      .where(eq(dealCommissionTermsSnapshots.id, snapshotId));
    
    // Create new snapshot with reference to old one
    const result = await db.insert(dealCommissionTermsSnapshots).values({
      ...newSnapshot,
      supersedesSnapshotId: snapshotId,
      snapshotTakenAt: new Date()
    }).returning();
    return result[0];
  }

  // Deal Disputes
  async createDealDispute(dispute: InsertDealDispute): Promise<DealDispute> {
    const result = await db.insert(dealDisputes).values({
      ...dispute,
      openedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async getDealDisputes(dealId: string): Promise<DealDispute[]> {
    return await db.select().from(dealDisputes)
      .where(eq(dealDisputes.dealId, dealId))
      .orderBy(desc(dealDisputes.openedAt));
  }

  async getDealDispute(id: number): Promise<DealDispute | undefined> {
    const result = await db.select().from(dealDisputes).where(eq(dealDisputes.id, id));
    return result[0];
  }

  async updateDealDispute(id: number, data: Partial<InsertDealDispute>): Promise<DealDispute | undefined> {
    const result = await db.update(dealDisputes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dealDisputes.id, id))
      .returning();
    return result[0];
  }

  async getOpenDisputes(): Promise<DealDispute[]> {
    return await db.select().from(dealDisputes)
      .where(sql`${dealDisputes.status} IN ('OPEN', 'IN_PROGRESS', 'PENDING_RESPONSE')`)
      .orderBy(desc(dealDisputes.openedAt));
  }

  async getDisputesByStatus(status: string): Promise<DealDispute[]> {
    return await db.select().from(dealDisputes)
      .where(eq(dealDisputes.status, status))
      .orderBy(desc(dealDisputes.openedAt));
  }

  async resolveDealDispute(id: number, resolution: string, resolvedBy: string, resolvedAmount?: string, notes?: string): Promise<DealDispute | undefined> {
    const result = await db.update(dealDisputes)
      .set({
        status: 'RESOLVED',
        resolution,
        resolvedBy,
        resolvedAt: new Date(),
        resolvedAmountBrl: resolvedAmount,
        resolutionNotes: notes,
        updatedAt: new Date()
      })
      .where(eq(dealDisputes.id, id))
      .returning();
    return result[0];
  }

  // Deal Checklist Requirements
  async createChecklistRequirement(requirement: InsertDealChecklistRequirement): Promise<DealChecklistRequirement> {
    const result = await db.insert(dealChecklistRequirements).values({
      ...requirement,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async getChecklistRequirements(targetState: string): Promise<DealChecklistRequirement[]> {
    return await db.select().from(dealChecklistRequirements)
      .where(and(
        eq(dealChecklistRequirements.targetState, targetState),
        eq(dealChecklistRequirements.isActive, true)
      ))
      .orderBy(dealChecklistRequirements.displayOrder);
  }

  async getAllChecklistRequirements(): Promise<DealChecklistRequirement[]> {
    return await db.select().from(dealChecklistRequirements)
      .orderBy(dealChecklistRequirements.targetState, dealChecklistRequirements.displayOrder);
  }

  async updateChecklistRequirement(id: number, data: Partial<InsertDealChecklistRequirement>): Promise<DealChecklistRequirement | undefined> {
    const result = await db.update(dealChecklistRequirements)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dealChecklistRequirements.id, id))
      .returning();
    return result[0];
  }

  async deleteChecklistRequirement(id: number): Promise<void> {
    await db.delete(dealChecklistRequirements).where(eq(dealChecklistRequirements.id, id));
  }

  // Supplier SLA Tracking
  async createSupplierSlaTracking(tracking: InsertSupplierSlaTracking): Promise<SupplierSlaTracking> {
    const result = await db.insert(supplierSlaTracking).values({
      ...tracking,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async getSupplierSlaTrackingForDeal(dealId: string): Promise<SupplierSlaTracking[]> {
    return await db.select().from(supplierSlaTracking)
      .where(eq(supplierSlaTracking.dealId, dealId))
      .orderBy(desc(supplierSlaTracking.requestSentAt));
  }

  async getSupplierSlaTrackingForSupplier(supplierId: number): Promise<SupplierSlaTracking[]> {
    return await db.select().from(supplierSlaTracking)
      .where(eq(supplierSlaTracking.supplierId, supplierId))
      .orderBy(desc(supplierSlaTracking.requestSentAt));
  }

  async updateSupplierSlaTracking(id: number, data: Partial<InsertSupplierSlaTracking>): Promise<SupplierSlaTracking | undefined> {
    const result = await db.update(supplierSlaTracking)
      .set(data)
      .where(eq(supplierSlaTracking.id, id))
      .returning();
    return result[0];
  }

  async recordSupplierResponse(id: number, responseAt: Date): Promise<SupplierSlaTracking | undefined> {
    // Get the tracking record to calculate hours
    const tracking = await db.select().from(supplierSlaTracking).where(eq(supplierSlaTracking.id, id));
    if (!tracking[0]) return undefined;

    const requestedAt = new Date(tracking[0].requestSentAt);
    const hoursElapsed = (responseAt.getTime() - requestedAt.getTime()) / (1000 * 60 * 60);
    const expectedHours = tracking[0].expectedResponseHours || 48;
    const isSlaBreach = hoursElapsed > expectedHours;

    const result = await db.update(supplierSlaTracking)
      .set({
        firstResponseAt: responseAt,
        actualResponseHours: hoursElapsed.toFixed(2),
        isSlaBreach
      })
      .where(eq(supplierSlaTracking.id, id))
      .returning();
    return result[0];
  }

  async getSlaBreach(): Promise<SupplierSlaTracking[]> {
    return await db.select().from(supplierSlaTracking)
      .where(eq(supplierSlaTracking.isSlaBreach, true))
      .orderBy(desc(supplierSlaTracking.requestSentAt));
  }

  // ============== COMMISSION OS: USAGE, RECONCILIATION, CASES ==============

  // Client Usage Periods
  async createUsagePeriod(data: InsertClientUsagePeriod): Promise<ClientUsagePeriod> {
    const result = await db.insert(clientUsagePeriods).values(data).returning();
    return result[0];
  }

  async getUsagePeriods(filters?: { clientId?: number; dealId?: string; from?: string; to?: string }): Promise<ClientUsagePeriod[]> {
    let query = db.select().from(clientUsagePeriods);
    const conditions = [];
    
    if (filters?.clientId) {
      conditions.push(eq(clientUsagePeriods.clientId, filters.clientId));
    }
    if (filters?.dealId) {
      conditions.push(eq(clientUsagePeriods.dealId, filters.dealId));
    }
    if (filters?.from) {
      conditions.push(gte(clientUsagePeriods.periodStartDate, filters.from));
    }
    if (filters?.to) {
      conditions.push(lte(clientUsagePeriods.periodEndDate, filters.to));
    }
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(clientUsagePeriods.periodStartDate));
    }
    return await query.orderBy(desc(clientUsagePeriods.periodStartDate));
  }

  async getUsagePeriod(id: string): Promise<ClientUsagePeriod | undefined> {
    const result = await db.select().from(clientUsagePeriods).where(eq(clientUsagePeriods.id, id));
    return result[0];
  }

  async updateUsagePeriod(id: string, data: Partial<InsertClientUsagePeriod>): Promise<ClientUsagePeriod | undefined> {
    const result = await db.update(clientUsagePeriods)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clientUsagePeriods.id, id))
      .returning();
    return result[0];
  }

  async verifyUsagePeriod(id: string, verifiedByUserId: string): Promise<ClientUsagePeriod | undefined> {
    const result = await db.update(clientUsagePeriods)
      .set({ 
        status: 'VERIFIED', 
        verifiedByUserId, 
        verifiedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(clientUsagePeriods.id, id))
      .returning();
    return result[0];
  }

  // Supplier Playbooks
  async getSupplierPlaybooks(): Promise<SupplierPlaybook[]> {
    return await db.select().from(supplierPlaybooks)
      .where(eq(supplierPlaybooks.isActive, true))
      .orderBy(desc(supplierPlaybooks.updatedAt));
  }

  async getSupplierPlaybook(supplierId: number): Promise<SupplierPlaybook | undefined> {
    const result = await db.select().from(supplierPlaybooks)
      .where(and(
        eq(supplierPlaybooks.supplierId, supplierId),
        eq(supplierPlaybooks.isActive, true)
      ))
      .orderBy(desc(supplierPlaybooks.version))
      .limit(1);
    return result[0];
  }

  async getSupplierPlaybookVersions(supplierId: number): Promise<SupplierPlaybook[]> {
    return await db.select().from(supplierPlaybooks)
      .where(eq(supplierPlaybooks.supplierId, supplierId))
      .orderBy(desc(supplierPlaybooks.version));
  }

  async createSupplierPlaybook(data: InsertSupplierPlaybook): Promise<SupplierPlaybook> {
    // Deactivate previous versions for this supplier
    await db.update(supplierPlaybooks)
      .set({ isActive: false })
      .where(eq(supplierPlaybooks.supplierId, data.supplierId));
    
    // Get current max version
    const existing = await db.select().from(supplierPlaybooks)
      .where(eq(supplierPlaybooks.supplierId, data.supplierId))
      .orderBy(desc(supplierPlaybooks.version))
      .limit(1);
    
    const newVersion = existing[0] ? (existing[0].version || 0) + 1 : 1;
    
    const result = await db.insert(supplierPlaybooks)
      .values({ ...data, version: newVersion, isActive: true })
      .returning();
    return result[0];
  }

  async updateSupplierPlaybook(id: number, data: Partial<InsertSupplierPlaybook>): Promise<SupplierPlaybook> {
    // Get current playbook
    const current = await db.select().from(supplierPlaybooks).where(eq(supplierPlaybooks.id, id));
    if (!current[0]) throw new Error('Playbook not found');
    
    // Create new version with updated data
    return await this.createSupplierPlaybook({
      supplierId: current[0].supplierId,
      commissionPayerEntity: data.commissionPayerEntity ?? current[0].commissionPayerEntity,
      paymentCadence: data.paymentCadence ?? current[0].paymentCadence,
      reportFormatsSupported: data.reportFormatsSupported ?? (current[0].reportFormatsSupported as any),
      requiredFields: data.requiredFields ?? (current[0].requiredFields as any),
      calcDefaults: data.calcDefaults ?? (current[0].calcDefaults as any),
      submissionRequirements: data.submissionRequirements ?? (current[0].submissionRequirements as any),
      contacts: data.contacts ?? (current[0].contacts as any),
      slaTargets: data.slaTargets ?? (current[0].slaTargets as any),
      rules: data.rules ?? (current[0].rules as any),
      updatedBy: data.updatedBy ?? current[0].updatedBy,
    });
  }

  // Supplier Report Imports
  async createSupplierReportImport(data: InsertSupplierReportImport): Promise<SupplierReportImport> {
    const result = await db.insert(supplierReportImports).values(data).returning();
    return result[0];
  }

  async getSupplierReportImports(supplierId?: number): Promise<SupplierReportImport[]> {
    if (supplierId) {
      return await db.select().from(supplierReportImports)
        .where(eq(supplierReportImports.supplierId, supplierId))
        .orderBy(desc(supplierReportImports.importedAt));
    }
    return await db.select().from(supplierReportImports)
      .orderBy(desc(supplierReportImports.importedAt));
  }

  async getSupplierReportImport(id: number): Promise<SupplierReportImport | undefined> {
    const result = await db.select().from(supplierReportImports).where(eq(supplierReportImports.id, id));
    return result[0];
  }

  async updateSupplierReportImport(id: number, data: Partial<InsertSupplierReportImport>): Promise<SupplierReportImport | undefined> {
    const result = await db.update(supplierReportImports)
      .set(data)
      .where(eq(supplierReportImports.id, id))
      .returning();
    return result[0];
  }

  // Commission Reconciliation Runs
  async createReconciliationRun(data: InsertCommissionReconciliationRun): Promise<CommissionReconciliationRun> {
    const result = await db.insert(commissionReconciliationRuns).values(data).returning();
    return result[0];
  }

  async getReconciliationRuns(): Promise<CommissionReconciliationRun[]> {
    return await db.select().from(commissionReconciliationRuns)
      .orderBy(desc(commissionReconciliationRuns.createdAt));
  }

  async getReconciliationRun(id: number): Promise<CommissionReconciliationRun | undefined> {
    const result = await db.select().from(commissionReconciliationRuns)
      .where(eq(commissionReconciliationRuns.id, id));
    return result[0];
  }

  async updateReconciliationRun(id: number, data: Partial<InsertCommissionReconciliationRun>): Promise<CommissionReconciliationRun | undefined> {
    const result = await db.update(commissionReconciliationRuns)
      .set(data)
      .where(eq(commissionReconciliationRuns.id, id))
      .returning();
    return result[0];
  }

  async finalizeReconciliationRun(id: number, finalizedBy: string): Promise<CommissionReconciliationRun | undefined> {
    const result = await db.update(commissionReconciliationRuns)
      .set({ 
        status: 'FINALIZED', 
        finalizedAt: new Date(), 
        finalizedBy 
      })
      .where(eq(commissionReconciliationRuns.id, id))
      .returning();
    return result[0];
  }

  // Commission Reconciliation Lines
  async createReconciliationLine(data: InsertCommissionReconciliationLine): Promise<CommissionReconciliationLine> {
    const result = await db.insert(commissionReconciliationLines).values(data).returning();
    return result[0];
  }

  async getReconciliationLines(runId: number): Promise<CommissionReconciliationLine[]> {
    return await db.select().from(commissionReconciliationLines)
      .where(eq(commissionReconciliationLines.reconciliationRunId, runId));
  }

  async getReconciliationLine(id: number): Promise<CommissionReconciliationLine | undefined> {
    const result = await db.select().from(commissionReconciliationLines)
      .where(eq(commissionReconciliationLines.id, id));
    return result[0];
  }

  async updateReconciliationLine(id: number, data: Partial<InsertCommissionReconciliationLine>): Promise<CommissionReconciliationLine | undefined> {
    const result = await db.update(commissionReconciliationLines)
      .set(data)
      .where(eq(commissionReconciliationLines.id, id))
      .returning();
    return result[0];
  }

  async reconcileLine(id: number, reconciledBy: string): Promise<CommissionReconciliationLine | undefined> {
    const result = await db.update(commissionReconciliationLines)
      .set({ 
        status: 'RECONCILED', 
        reconciledAt: new Date(), 
        reconciledBy 
      })
      .where(eq(commissionReconciliationLines.id, id))
      .returning();
    return result[0];
  }

  // Deal Cases
  async createDealCase(data: InsertDealCase): Promise<DealCase> {
    const result = await db.insert(dealCases).values(data).returning();
    return result[0];
  }

  async getDealCases(dealId: string): Promise<DealCase[]> {
    return await db.select().from(dealCases)
      .where(eq(dealCases.dealId, dealId))
      .orderBy(desc(dealCases.createdAt));
  }

  async getOpenDealCases(): Promise<DealCase[]> {
    return await db.select().from(dealCases)
      .where(and(
        sql`${dealCases.status} NOT IN ('RESOLVED', 'CONVERTED_TO_LOST')`
      ))
      .orderBy(desc(dealCases.createdAt));
  }

  async getDealCase(id: number): Promise<DealCase | undefined> {
    const result = await db.select().from(dealCases).where(eq(dealCases.id, id));
    return result[0];
  }

  async updateDealCase(id: number, data: Partial<InsertDealCase>): Promise<DealCase | undefined> {
    const result = await db.update(dealCases)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dealCases.id, id))
      .returning();
    return result[0];
  }

  async convertCaseToLost(caseId: number, triggeredBy: string, reason: string): Promise<{ success: boolean; case?: DealCase; deal?: Deal; error?: string }> {
    // Get the case
    const dealCase = await this.getDealCase(caseId);
    if (!dealCase) {
      return { success: false, error: 'Case not found' };
    }

    // Transition the deal to LOST using the state machine
    const transitionResult = await this.transitionDealState(
      dealCase.dealId,
      'LOST',
      triggeredBy,
      'user',
      reason,
      `Converted from case #${caseId}`
    );

    if (!transitionResult.success) {
      return { success: false, error: transitionResult.error };
    }

    // Update the case status
    const updatedCase = await db.update(dealCases)
      .set({ 
        status: 'CONVERTED_TO_LOST', 
        resolutionSummary: reason,
        updatedAt: new Date() 
      })
      .where(eq(dealCases.id, caseId))
      .returning();

    return { 
      success: true, 
      case: updatedCase[0], 
      deal: transitionResult.deal 
    };
  }

  // ============== COMPLIANCE LAYER ==============

  // Compliance Checklist Requirements
  async createComplianceRequirement(data: InsertComplianceChecklistRequirement): Promise<ComplianceChecklistRequirement> {
    const result = await db.insert(complianceChecklistRequirements).values(data).returning();
    return result[0];
  }

  async getComplianceRequirements(fromState: string, toState: string): Promise<ComplianceChecklistRequirement[]> {
    return await db.select().from(complianceChecklistRequirements)
      .where(and(
        eq(complianceChecklistRequirements.transitionFrom, fromState),
        eq(complianceChecklistRequirements.transitionTo, toState),
        eq(complianceChecklistRequirements.isActive, true)
      ))
      .orderBy(complianceChecklistRequirements.sortOrder);
  }

  async getAllComplianceRequirements(): Promise<ComplianceChecklistRequirement[]> {
    return await db.select().from(complianceChecklistRequirements)
      .orderBy(complianceChecklistRequirements.transitionFrom, complianceChecklistRequirements.sortOrder);
  }

  async updateComplianceRequirement(id: number, data: Partial<InsertComplianceChecklistRequirement>): Promise<ComplianceChecklistRequirement | undefined> {
    const result = await db.update(complianceChecklistRequirements)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(complianceChecklistRequirements.id, id))
      .returning();
    return result[0];
  }

  async deleteComplianceRequirement(id: number): Promise<void> {
    await db.delete(complianceChecklistRequirements).where(eq(complianceChecklistRequirements.id, id));
  }

  // Deal Checklist Items
  async createDealChecklistItem(data: InsertDealChecklistItem): Promise<DealChecklistItem> {
    const result = await db.insert(dealChecklistItems).values(data).returning();
    return result[0];
  }

  async getDealChecklistItems(dealId: string): Promise<DealChecklistItem[]> {
    return await db.select().from(dealChecklistItems)
      .where(eq(dealChecklistItems.dealId, dealId))
      .orderBy(desc(dealChecklistItems.completedAt));
  }

  async getDealChecklistItem(id: number): Promise<DealChecklistItem | undefined> {
    const result = await db.select().from(dealChecklistItems).where(eq(dealChecklistItems.id, id));
    return result[0];
  }

  async updateDealChecklistItem(id: number, data: Partial<InsertDealChecklistItem>): Promise<DealChecklistItem | undefined> {
    const result = await db.update(dealChecklistItems)
      .set(data)
      .where(eq(dealChecklistItems.id, id))
      .returning();
    return result[0];
  }

  async deleteDealChecklistItem(id: number): Promise<void> {
    await db.delete(dealChecklistItems).where(eq(dealChecklistItems.id, id));
  }

  // Compliance Validation
  async validateTransitionCompliance(dealId: string, fromState: string, toState: string): Promise<{
    canTransition: boolean;
    missingRequirements: Array<{
      requirementId: number;
      requirementKey: string;
      requirementLabel: string;
      requiredForRoles: string[];
    }>;
    completedRequirements: Array<{
      requirementId: number;
      requirementKey: string;
      completedAt: Date;
      completedBy: string;
    }>;
  }> {
    // Get all required requirements for this transition
    const requirements = await this.getComplianceRequirements(fromState, toState);
    
    // Get completed items for this deal
    const completedItems = await this.getDealChecklistItems(dealId);
    const completedRequirementIds = new Set(completedItems.map(item => item.requirementId));
    
    const missingRequirements: Array<{
      requirementId: number;
      requirementKey: string;
      requirementLabel: string;
      requiredForRoles: string[];
    }> = [];
    
    const completedRequirements: Array<{
      requirementId: number;
      requirementKey: string;
      completedAt: Date;
      completedBy: string;
    }> = [];
    
    for (const req of requirements) {
      if (req.isRequired && !completedRequirementIds.has(req.id)) {
        missingRequirements.push({
          requirementId: req.id,
          requirementKey: req.requirementKey,
          requirementLabel: req.requirementLabel,
          requiredForRoles: (req.requiredForRoles as string[]) || ['all']
        });
      } else if (completedRequirementIds.has(req.id)) {
        const completedItem = completedItems.find(item => item.requirementId === req.id);
        if (completedItem) {
          completedRequirements.push({
            requirementId: req.id,
            requirementKey: req.requirementKey,
            completedAt: completedItem.completedAt,
            completedBy: completedItem.completedBy
          });
        }
      }
    }
    
    return {
      canTransition: missingRequirements.length === 0,
      missingRequirements,
      completedRequirements
    };
  }

  // Communication Log
  async createCommunicationLog(data: InsertCommunicationLog): Promise<CommunicationLog> {
    const result = await db.insert(communicationLog).values(data).returning();
    return result[0];
  }

  async getCommunicationLogs(filters?: { dealId?: string; clientId?: number; leadId?: number }): Promise<CommunicationLog[]> {
    let query = db.select().from(communicationLog);
    
    if (filters?.dealId) {
      query = query.where(eq(communicationLog.dealId, filters.dealId)) as typeof query;
    } else if (filters?.clientId) {
      query = query.where(eq(communicationLog.clientId, filters.clientId)) as typeof query;
    } else if (filters?.leadId) {
      query = query.where(eq(communicationLog.leadId, filters.leadId)) as typeof query;
    }
    
    return await query.orderBy(desc(communicationLog.occurredAt));
  }

  async getCommunicationLog(id: number): Promise<CommunicationLog | undefined> {
    const result = await db.select().from(communicationLog).where(eq(communicationLog.id, id));
    return result[0];
  }

  async updateCommunicationLog(id: number, data: Partial<InsertCommunicationLog>): Promise<CommunicationLog | undefined> {
    const result = await db.update(communicationLog)
      .set(data)
      .where(eq(communicationLog.id, id))
      .returning();
    return result[0];
  }

  async deleteCommunicationLog(id: number): Promise<void> {
    await db.delete(communicationLog).where(eq(communicationLog.id, id));
  }

  // Playbook Deal Snapshots
  async createPlaybookDealSnapshot(data: InsertPlaybookDealSnapshot): Promise<PlaybookDealSnapshot> {
    const result = await db.insert(playbookDealSnapshots).values(data).returning();
    return result[0];
  }

  async getPlaybookDealSnapshot(dealId: string): Promise<PlaybookDealSnapshot | undefined> {
    const result = await db.select().from(playbookDealSnapshots)
      .where(eq(playbookDealSnapshots.dealId, dealId));
    return result[0];
  }

  // Lost Deal Analytics
  async getLostDeals(): Promise<Deal[]> {
    return await db.select().from(deals)
      .where(eq(deals.status, 'LOST'))
      .orderBy(desc(deals.lostAt));
  }

  // Ops Dashboard
  async getOpsDashboardTasks(): Promise<{
    dealsBlockedByCompliance: Array<{ deal: Deal; missingCount: number }>;
    openCasesBreachingSla: DealCase[];
    commissionEventsOverdue: DealCommissionEvent[];
    dealsWaitingOnSupplier: Deal[];
  }> {
    // Get deals that need compliance check (in states that have requirements)
    const activeDeals = await db.select().from(deals)
      .where(sql`${deals.status} NOT IN ('CLOSED', 'LOST', 'CONTRACT_ENDED')`);
    
    const dealsBlockedByCompliance: Array<{ deal: Deal; missingCount: number }> = [];
    
    for (const deal of activeDeals) {
      // Check if there are pending requirements for next possible transitions
      const nextStates = DEAL_STATE_TRANSITIONS[deal.status as DealState] || [];
      for (const nextState of nextStates) {
        const validation = await this.validateTransitionCompliance(deal.id, deal.status, nextState);
        if (validation.missingRequirements.length > 0) {
          dealsBlockedByCompliance.push({
            deal,
            missingCount: validation.missingRequirements.length
          });
          break; // Only count deal once
        }
      }
    }
    
    // Get open cases breaching SLA
    const openCasesBreachingSla = await db.select().from(dealCases)
      .where(and(
        sql`${dealCases.status} NOT IN ('RESOLVED', 'CONVERTED_TO_LOST')`,
        sql`${dealCases.slaDueDate} < NOW()`
      ))
      .orderBy(dealCases.slaDueDate);
    
    // Get overdue commission events (check expectedDate for past due items with PENDING status)
    const commissionEventsOverdue = await db.select().from(dealCommissionEvents)
      .where(and(
        sql`${dealCommissionEvents.status} = 'PENDING'`,
        sql`${dealCommissionEvents.expectedDate} < NOW()`
      ))
      .orderBy(dealCommissionEvents.expectedDate);
    
    // Get deals waiting on supplier (in RFQ_SENT state for more than 7 days)
    const dealsWaitingOnSupplier = await db.select().from(deals)
      .where(and(
        eq(deals.status, 'RFQ_SENT'),
        sql`${deals.updatedAt} < NOW() - INTERVAL '7 days'`
      ))
      .orderBy(deals.updatedAt);
    
    return {
      dealsBlockedByCompliance,
      openCasesBreachingSla,
      commissionEventsOverdue,
      dealsWaitingOnSupplier
    };
  }

  // Notification Queue
  async createNotification(data: InsertNotificationQueue): Promise<NotificationQueue> {
    const result = await db.insert(notificationQueue).values(data).returning();
    return result[0];
  }

  async getPendingNotifications(): Promise<NotificationQueue[]> {
    return await db.select().from(notificationQueue)
      .where(eq(notificationQueue.status, 'PENDING'))
      .orderBy(notificationQueue.createdAt);
  }

  async markNotificationSent(id: number): Promise<void> {
    await db.update(notificationQueue)
      .set({ status: 'SENT', sentAt: new Date() })
      .where(eq(notificationQueue.id, id));
  }

  async markNotificationFailed(id: number, reason: string): Promise<void> {
    await db.update(notificationQueue)
      .set({ status: 'FAILED', failReason: reason })
      .where(eq(notificationQueue.id, id));
  }

  // Partners
  async createPartner(data: InsertPartner): Promise<Partner> {
    // Generate unique referral code
    const referralCode = randomBytes(4).toString('hex').toUpperCase();
    const result = await db.insert(partners).values({
      ...data,
      referralCode,
    }).returning();
    return result[0];
  }

  async getPartners(): Promise<Partner[]> {
    return await db.select().from(partners).orderBy(desc(partners.createdAt));
  }

  async getPartner(id: number): Promise<Partner | undefined> {
    const result = await db.select().from(partners).where(eq(partners.id, id));
    return result[0];
  }

  async getPartnerByEmail(email: string): Promise<Partner | undefined> {
    const result = await db.select().from(partners).where(eq(partners.email, email));
    return result[0];
  }

  async updatePartner(id: number, data: Partial<InsertPartner & { status?: string; approvedAt?: Date; approvedBy?: string; rejectedAt?: Date; rejectedReason?: string; referralCode?: string }>): Promise<Partner | undefined> {
    const result = await db.update(partners).set(data).where(eq(partners.id, id)).returning();
    return result[0];
  }
  
  // Supplier RFQ Adapters
  async createSupplierRfqAdapter(data: InsertSupplierRfqAdapter): Promise<SupplierRfqAdapter> {
    // First, retire any existing ACTIVE adapter for this supplier
    const existing = await db.select().from(supplierRfqAdapters)
      .where(and(
        eq(supplierRfqAdapters.supplierId, data.supplierId),
        eq(supplierRfqAdapters.status, 'ACTIVE')
      ));
    
    if (existing.length > 0) {
      await db.update(supplierRfqAdapters)
        .set({ 
          status: 'RETIRED', 
          retiredAt: new Date(),
          retiredBy: data.createdBy 
        })
        .where(eq(supplierRfqAdapters.id, existing[0].id));
    }
    
    // Get next version for this supplier
    const maxVersion = await db.select({ max: sql<number>`COALESCE(MAX(version), 0)` })
      .from(supplierRfqAdapters)
      .where(eq(supplierRfqAdapters.supplierId, data.supplierId));
    
    const nextVersion = (maxVersion[0]?.max || 0) + 1;
    
    const result = await db.insert(supplierRfqAdapters).values({
      ...data,
      version: nextVersion,
      status: 'ACTIVE',
    }).returning();
    
    return result[0];
  }
  
  async getSupplierRfqAdapters(supplierId: number): Promise<SupplierRfqAdapter[]> {
    return await db.select().from(supplierRfqAdapters)
      .where(eq(supplierRfqAdapters.supplierId, supplierId))
      .orderBy(desc(supplierRfqAdapters.version));
  }
  
  async getActiveSupplierRfqAdapter(supplierId: number): Promise<SupplierRfqAdapter | undefined> {
    const result = await db.select().from(supplierRfqAdapters)
      .where(and(
        eq(supplierRfqAdapters.supplierId, supplierId),
        eq(supplierRfqAdapters.status, 'ACTIVE')
      ));
    return result[0];
  }
  
  async getSupplierRfqAdapter(id: number): Promise<SupplierRfqAdapter | undefined> {
    const result = await db.select().from(supplierRfqAdapters)
      .where(eq(supplierRfqAdapters.id, id));
    return result[0];
  }
  
  async retireSupplierRfqAdapter(id: number, retiredBy: string): Promise<SupplierRfqAdapter | undefined> {
    const result = await db.update(supplierRfqAdapters)
      .set({ 
        status: 'RETIRED', 
        retiredAt: new Date(),
        retiredBy 
      })
      .where(eq(supplierRfqAdapters.id, id))
      .returning();
    return result[0];
  }
  
  // RFQ Packets
  async createRfqPacket(data: InsertRfqPacket): Promise<RfqPacket> {
    const result = await db.insert(rfqPackets).values(data).returning();
    return result[0];
  }
  
  async getRfqPacketsForRfo(rfoRequestId: number): Promise<RfqPacket[]> {
    return await db.select().from(rfqPackets)
      .where(eq(rfqPackets.rfoRequestId, rfoRequestId))
      .orderBy(rfqPackets.supplierId);
  }
  
  async getRfqPacket(id: number): Promise<RfqPacket | undefined> {
    const result = await db.select().from(rfqPackets)
      .where(eq(rfqPackets.id, id));
    return result[0];
  }
  
  async updateRfqPacket(id: number, data: Partial<RfqPacket>): Promise<RfqPacket | undefined> {
    const result = await db.update(rfqPackets)
      .set(data)
      .where(eq(rfqPackets.id, id))
      .returning();
    return result[0];
  }
  
  async markRfqPacketSent(id: number, sentBy: string, sendMethod: string, communicationLogId?: number): Promise<RfqPacket | undefined> {
    const result = await db.update(rfqPackets)
      .set({ 
        packetStatus: 'SENT',
        sentAt: new Date(),
        sentBy,
        sendMethodUsed: sendMethod,
        communicationLogId: communicationLogId || null
      })
      .where(eq(rfqPackets.id, id))
      .returning();
    return result[0];
  }
  
  async recordManualSend(rfoRequestId: number, supplierId: number, userId: string, channel: string, notes: string): Promise<RfqPacket> {
    const result = await db.insert(rfqPackets).values({
      rfoRequestId,
      supplierId,
      adapterId: null,
      adapterVersion: null,
      packetStatus: 'MANUAL_SENT',
      isManualSend: true,
      manualSendNotes: notes,
      manualSendChannel: channel,
      createdBy: userId,
      sentAt: new Date(),
      sentBy: userId,
      sendMethodUsed: 'MANUAL',
      generatedPayload: { manual: true, notes },
      missingRequirements: []
    }).returning();
    return result[0];
  }
  
  // Client Dossiers
  async getClientDossier(clientId: number): Promise<ClientDossier | undefined> {
    const result = await db.select().from(clientDossiers)
      .where(eq(clientDossiers.clientId, clientId));
    return result[0];
  }
  
  async getDossierById(id: number): Promise<ClientDossier | undefined> {
    const result = await db.select().from(clientDossiers)
      .where(eq(clientDossiers.id, id));
    return result[0];
  }
  
  async createClientDossier(data: InsertClientDossier): Promise<ClientDossier> {
    const result = await db.insert(clientDossiers).values(data).returning();
    return result[0];
  }
  
  async updateClientDossier(id: number, data: Partial<InsertClientDossier>, userId: string): Promise<ClientDossier | undefined> {
    const dossier = await this.getDossierById(id);
    if (!dossier || dossier.status === 'LOCKED') {
      return undefined;
    }
    const result = await db.update(clientDossiers)
      .set({ ...data, updatedAt: new Date(), updatedBy: userId })
      .where(eq(clientDossiers.id, id))
      .returning();
    return result[0];
  }
  
  async markDossierReady(id: number, userId: string): Promise<ClientDossier | undefined> {
    const dossier = await this.getDossierById(id);
    if (!dossier || dossier.status === 'LOCKED') {
      return undefined;
    }
    const result = await db.update(clientDossiers)
      .set({ 
        status: 'READY', 
        lastValidatedAt: new Date(), 
        validatedBy: userId,
        updatedAt: new Date(),
        updatedBy: userId
      })
      .where(eq(clientDossiers.id, id))
      .returning();
    return result[0];
  }
  
  async lockDossier(id: number, userId: string): Promise<ClientDossier | undefined> {
    const dossier = await this.getDossierById(id);
    if (!dossier || dossier.status !== 'READY') {
      return undefined;
    }
    const result = await db.update(clientDossiers)
      .set({ 
        status: 'LOCKED', 
        lockedAt: new Date(), 
        lockedBy: userId,
        updatedAt: new Date(),
        updatedBy: userId
      })
      .where(eq(clientDossiers.id, id))
      .returning();
    return result[0];
  }
  
  // Client Dossier Snapshots
  async createDossierSnapshot(data: InsertClientDossierSnapshot): Promise<ClientDossierSnapshot> {
    const result = await db.insert(clientDossierSnapshots).values(data).returning();
    return result[0];
  }
  
  async getDossierSnapshot(id: number): Promise<ClientDossierSnapshot | undefined> {
    const result = await db.select().from(clientDossierSnapshots)
      .where(eq(clientDossierSnapshots.id, id));
    return result[0];
  }
  
  async getDossierSnapshots(dossierId: number): Promise<ClientDossierSnapshot[]> {
    return await db.select().from(clientDossierSnapshots)
      .where(eq(clientDossierSnapshots.clientDossierId, dossierId))
      .orderBy(desc(clientDossierSnapshots.createdAt));
  }
  
  // ============== SUPPLIER RFQ ADAPTER ==============
  
  // Supplier RFQ Playbooks
  async createSupplierRfqPlaybook(data: InsertSupplierRfqPlaybook): Promise<SupplierRfqPlaybook> {
    // Auto-retire previous active version
    const existing = await this.getActivePlaybookForSupplier(data.supplierId);
    if (existing) {
      await this.retirePlaybook(existing.id, data.createdBy || '');
    }
    
    // Get next version number
    const allPlaybooks = await this.getSupplierRfqPlaybooks(data.supplierId);
    const nextVersion = allPlaybooks.length > 0 ? Math.max(...allPlaybooks.map(p => p.version)) + 1 : 1;
    
    const result = await db.insert(supplierRfqPlaybooks).values({
      ...data,
      version: nextVersion,
      status: 'ACTIVE'
    }).returning();
    return result[0];
  }
  
  async getSupplierRfqPlaybook(id: number): Promise<SupplierRfqPlaybook | undefined> {
    const result = await db.select().from(supplierRfqPlaybooks)
      .where(eq(supplierRfqPlaybooks.id, id));
    return result[0];
  }
  
  async getActivePlaybookForSupplier(supplierId: number): Promise<SupplierRfqPlaybook | undefined> {
    const result = await db.select().from(supplierRfqPlaybooks)
      .where(and(
        eq(supplierRfqPlaybooks.supplierId, supplierId),
        eq(supplierRfqPlaybooks.status, 'ACTIVE')
      ));
    return result[0];
  }
  
  async getSupplierRfqPlaybooks(supplierId: number): Promise<SupplierRfqPlaybook[]> {
    return await db.select().from(supplierRfqPlaybooks)
      .where(eq(supplierRfqPlaybooks.supplierId, supplierId))
      .orderBy(desc(supplierRfqPlaybooks.version));
  }
  
  async getAllActivePlaybooks(): Promise<SupplierRfqPlaybook[]> {
    return await db.select().from(supplierRfqPlaybooks)
      .where(eq(supplierRfqPlaybooks.status, 'ACTIVE'));
  }
  
  async retirePlaybook(id: number, userId: string): Promise<SupplierRfqPlaybook | undefined> {
    const result = await db.update(supplierRfqPlaybooks)
      .set({ 
        status: 'RETIRED', 
        retiredAt: new Date(), 
        retiredBy: userId 
      })
      .where(eq(supplierRfqPlaybooks.id, id))
      .returning();
    return result[0];
  }
  
  // RFQ Dispatches
  async createRfqDispatch(data: InsertRfqDispatch): Promise<RfqDispatch> {
    const result = await db.insert(rfqDispatches).values(data).returning();
    return result[0];
  }
  
  async getRfqDispatch(id: number): Promise<RfqDispatch | undefined> {
    const result = await db.select().from(rfqDispatches)
      .where(eq(rfqDispatches.id, id));
    return result[0];
  }
  
  async getRfqDispatchesForDeal(dealId: string): Promise<RfqDispatch[]> {
    return await db.select().from(rfqDispatches)
      .where(eq(rfqDispatches.dealId, dealId))
      .orderBy(desc(rfqDispatches.createdAt));
  }
  
  async getRfqDispatchesForSupplier(supplierId: number): Promise<RfqDispatch[]> {
    return await db.select().from(rfqDispatches)
      .where(eq(rfqDispatches.supplierId, supplierId))
      .orderBy(desc(rfqDispatches.createdAt));
  }
  
  async updateRfqDispatch(id: number, data: Partial<InsertRfqDispatch>): Promise<RfqDispatch | undefined> {
    const result = await db.update(rfqDispatches)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(rfqDispatches.id, id))
      .returning();
    return result[0];
  }
  
  async markRfqDispatchSent(id: number, dueAt: Date): Promise<RfqDispatch | undefined> {
    const result = await db.update(rfqDispatches)
      .set({ 
        status: 'SENT', 
        sentAt: new Date(), 
        dueAt,
        updatedAt: new Date() 
      })
      .where(eq(rfqDispatches.id, id))
      .returning();
    return result[0];
  }
  
  async markRfqDispatchResponded(id: number): Promise<RfqDispatch | undefined> {
    const result = await db.update(rfqDispatches)
      .set({ 
        status: 'RESPONDED', 
        respondedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(rfqDispatches.id, id))
      .returning();
    return result[0];
  }
  
  async getOverdueRfqDispatches(): Promise<RfqDispatch[]> {
    return await db.select().from(rfqDispatches)
      .where(and(
        eq(rfqDispatches.status, 'SENT'),
        lte(rfqDispatches.dueAt, new Date())
      ))
      .orderBy(rfqDispatches.dueAt);
  }
  
  async getAwaitingResponseDispatches(): Promise<RfqDispatch[]> {
    return await db.select().from(rfqDispatches)
      .where(eq(rfqDispatches.status, 'SENT'))
      .orderBy(rfqDispatches.dueAt);
  }
  
  async incrementFollowupCount(id: number): Promise<RfqDispatch | undefined> {
    const dispatch = await this.getRfqDispatch(id);
    if (!dispatch) return undefined;
    
    const result = await db.update(rfqDispatches)
      .set({ 
        followupCount: (dispatch.followupCount || 0) + 1,
        lastFollowupAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(rfqDispatches.id, id))
      .returning();
    return result[0];
  }
  
  // Dossier Edit Logs
  async createDossierEditLog(data: InsertDossierEditLog): Promise<DossierEditLog> {
    const result = await db.insert(dossierEditLogs).values(data).returning();
    return result[0];
  }
  
  async getDossierEditLogs(dossierId: number): Promise<DossierEditLog[]> {
    return await db.select().from(dossierEditLogs)
      .where(eq(dossierEditLogs.dossierId, dossierId))
      .orderBy(desc(dossierEditLogs.editedAt));
  }
  
  // Deal Transition Overrides
  async createDealTransitionOverride(data: InsertDealTransitionOverride): Promise<DealTransitionOverride> {
    const result = await db.insert(dealTransitionOverrides).values(data).returning();
    return result[0];
  }
  
  async getDealTransitionOverrides(dealId: string): Promise<DealTransitionOverride[]> {
    return await db.select().from(dealTransitionOverrides)
      .where(eq(dealTransitionOverrides.dealId, dealId))
      .orderBy(desc(dealTransitionOverrides.overriddenAt));
  }
  
  async getSupplierScorecard(): Promise<Array<{
    supplier: Supplier;
    totalRfqsSent: number;
    rfqsResponded: number;
    responseRate: number;
    avgResponseHours: number;
    totalQuotes: number;
    wonDeals: number;
    winRate: number;
    avgPrice: number;
  }>> {
    const allSuppliers = await this.getSuppliers();
    
    // Get dispatch stats aggregated by SQL
    const dispatchStats = await db
      .select({
        supplierId: rfqDispatches.supplierId,
        totalSent: sql<number>`COUNT(CASE WHEN ${rfqDispatches.status} != 'DRAFT' THEN 1 END)`,
        totalResponded: sql<number>`COUNT(CASE WHEN ${rfqDispatches.status} = 'RESPONDED' THEN 1 END)`,
        avgResponseHours: sql<number>`AVG(EXTRACT(EPOCH FROM (${rfqDispatches.respondedAt} - ${rfqDispatches.sentAt})) / 3600)`
      })
      .from(rfqDispatches)
      .groupBy(rfqDispatches.supplierId);
    
    // Get quote stats aggregated by SQL  
    const quoteStats = await db
      .select({
        supplierId: dealQuotes.supplierId,
        totalQuotes: sql<number>`COUNT(*)`,
        avgPrice: sql<number>`AVG(CAST(${dealQuotes.baseEnergyPriceRmwh} AS DECIMAL))`,
        wonDeals: sql<number>`COUNT(CASE WHEN ${dealQuotes.isSelected} = true THEN 1 END)`,
        uniqueDeals: sql<number>`COUNT(DISTINCT ${dealQuotes.dealId})`
      })
      .from(dealQuotes)
      .groupBy(dealQuotes.supplierId);
    
    // Build lookup maps
    const dispatchMap = new Map(dispatchStats.map(d => [d.supplierId, d]));
    const quoteMap = new Map(quoteStats.map(q => [q.supplierId, q]));
    
    // Combine into scorecards
    const scorecards = allSuppliers.map(supplier => {
      const dispatch = dispatchMap.get(supplier.id) || { totalSent: 0, totalResponded: 0, avgResponseHours: null };
      const quote = quoteMap.get(supplier.id) || { totalQuotes: 0, avgPrice: null, wonDeals: 0, uniqueDeals: 0 };
      
      const totalRfqsSent = Number(dispatch.totalSent) || 0;
      const rfqsResponded = Number(dispatch.totalResponded) || 0;
      const responseRate = totalRfqsSent > 0 ? Math.round((rfqsResponded / totalRfqsSent) * 100) : 0;
      const avgResponseHours = Math.round(Number(dispatch.avgResponseHours) || 0);
      
      const totalQuotes = Number(quote.totalQuotes) || 0;
      const wonDeals = Number(quote.wonDeals) || 0;
      const uniqueDeals = Number(quote.uniqueDeals) || 0;
      const winRate = uniqueDeals > 0 ? Math.round((wonDeals / uniqueDeals) * 100) : 0;
      const avgPrice = Math.round(Number(quote.avgPrice) || 0);
      
      return {
        supplier,
        totalRfqsSent,
        rfqsResponded,
        responseRate,
        avgResponseHours,
        totalQuotes,
        wonDeals,
        winRate,
        avgPrice
      };
    });
    
    // Sort by response rate, then win rate
    scorecards.sort((a, b) => {
      if (b.responseRate !== a.responseRate) return b.responseRate - a.responseRate;
      return b.winRate - a.winRate;
    });
    
    return scorecards;
  }
  
  // ============== OPS GUARDRAILS ==============
  
  // Tooltips
  async getDismissedTooltips(userId: string): Promise<UserTooltipState[]> {
    return await db.select()
      .from(userTooltipState)
      .where(eq(userTooltipState.userId, userId));
  }
  
  async dismissTooltip(userId: string, tooltipKey: string): Promise<UserTooltipState> {
    const result = await db.insert(userTooltipState)
      .values({ userId, tooltipKey })
      .onConflictDoNothing()
      .returning();
    
    if (result.length === 0) {
      const existing = await db.select()
        .from(userTooltipState)
        .where(and(
          eq(userTooltipState.userId, userId),
          eq(userTooltipState.tooltipKey, tooltipKey)
        ));
      return existing[0];
    }
    return result[0];
  }
  
  async resetTooltips(userId: string): Promise<void> {
    await db.delete(userTooltipState)
      .where(eq(userTooltipState.userId, userId));
  }
  
  // Checklists
  async getChecklists(dealStage?: string): Promise<OpsChecklist[]> {
    if (dealStage) {
      return await db.select()
        .from(opsChecklists)
        .where(and(
          eq(opsChecklists.dealStage, dealStage),
          eq(opsChecklists.isActive, true)
        ))
        .orderBy(opsChecklists.sortOrder);
    }
    return await db.select()
      .from(opsChecklists)
      .where(eq(opsChecklists.isActive, true))
      .orderBy(opsChecklists.sortOrder);
  }
  
  async getChecklistItems(checklistId: number): Promise<OpsChecklistItem[]> {
    return await db.select()
      .from(opsChecklistItems)
      .where(and(
        eq(opsChecklistItems.checklistId, checklistId),
        eq(opsChecklistItems.isActive, true)
      ))
      .orderBy(opsChecklistItems.sortOrder);
  }
  
  async getDealChecklistCompletions(dealId: string): Promise<DealChecklistCompletion[]> {
    return await db.select()
      .from(dealChecklistCompletions)
      .where(eq(dealChecklistCompletions.dealId, dealId));
  }
  
  async completeChecklistItem(data: InsertDealChecklistCompletion): Promise<DealChecklistCompletion> {
    const result = await db.insert(dealChecklistCompletions)
      .values(data)
      .onConflictDoUpdate({
        target: [dealChecklistCompletions.dealId, dealChecklistCompletions.checklistItemId],
        set: {
          isCompleted: data.isCompleted,
          completedAt: data.completedAt,
          completedBy: data.completedBy,
          notes: data.notes,
          evidenceUrl: data.evidenceUrl,
          updatedAt: new Date()
        }
      })
      .returning();
    return result[0];
  }
  
  async getBlockingItems(dealId: string, targetStage?: string): Promise<OpsChecklistItem[]> {
    const deal = await this.getDeal(dealId);
    if (!deal) return [];
    
    const stage = targetStage || deal.stage;
    const checklists = await this.getChecklists(stage);
    
    if (checklists.length === 0) return [];
    
    const completions = await this.getDealChecklistCompletions(dealId);
    const completedItemIds = new Set(
      completions.filter(c => c.isCompleted).map(c => c.checklistItemId)
    );
    
    const blockers: OpsChecklistItem[] = [];
    
    for (const checklist of checklists) {
      const items = await this.getChecklistItems(checklist.id);
      for (const item of items) {
        if (item.isBlocking && !completedItemIds.has(item.id)) {
          blockers.push(item);
        }
      }
    }
    
    return blockers;
  }
  
  // Playbooks
  async getPlaybooks(stage?: string, scenarioKey?: string): Promise<OpsPlaybook[]> {
    let query = db.select().from(opsPlaybooks).where(eq(opsPlaybooks.isActive, true));
    
    const results = await query.orderBy(opsPlaybooks.sortOrder);
    
    return results.filter(p => {
      if (scenarioKey && p.scenarioKey !== scenarioKey) return false;
      if (stage && p.applicableStages && !p.applicableStages.includes(stage)) return false;
      return true;
    });
  }
  
  async getPlaybookByKey(scenarioKey: string): Promise<OpsPlaybook | undefined> {
    const result = await db.select()
      .from(opsPlaybooks)
      .where(eq(opsPlaybooks.scenarioKey, scenarioKey));
    return result[0];
  }
  
  async createOpsPlaybook(data: InsertOpsPlaybook): Promise<OpsPlaybook> {
    const result = await db.insert(opsPlaybooks).values(data).returning();
    return result[0];
  }
  
  async createOpsChecklist(data: InsertOpsChecklist): Promise<OpsChecklist> {
    const result = await db.insert(opsChecklists).values(data).returning();
    return result[0];
  }
  
  async createOpsChecklistItem(data: InsertOpsChecklistItem): Promise<OpsChecklistItem> {
    const result = await db.insert(opsChecklistItems).values(data).returning();
    return result[0];
  }
  
  // Error Tracking
  async logOpsError(data: InsertOpsErrorEvent): Promise<OpsErrorEvent> {
    const result = await db.insert(opsErrorEvents).values(data).returning();
    return result[0];
  }
  
  async getOpsErrors(filters: { dealId?: string; userId?: string; errorType?: string; limit?: number }): Promise<OpsErrorEvent[]> {
    const conditions = [];
    
    if (filters.dealId) conditions.push(eq(opsErrorEvents.dealId, filters.dealId));
    if (filters.userId) conditions.push(eq(opsErrorEvents.userId, filters.userId));
    if (filters.errorType) conditions.push(eq(opsErrorEvents.errorType, filters.errorType));
    
    let query = db.select().from(opsErrorEvents);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query
      .orderBy(desc(opsErrorEvents.createdAt))
      .limit(filters.limit || 100);
  }
  
  async getErrorHeatmap(options: { groupBy: string; dateFrom?: Date; dateTo?: Date }): Promise<Array<{ key: string; count: number }>> {
    const conditions = [];
    
    if (options.dateFrom) {
      conditions.push(gte(opsErrorEvents.createdAt, options.dateFrom));
    }
    if (options.dateTo) {
      conditions.push(lte(opsErrorEvents.createdAt, options.dateTo));
    }
    
    let groupByField: any;
    switch (options.groupBy) {
      case 'stage':
        groupByField = opsErrorEvents.dealStage;
        break;
      case 'type':
        groupByField = opsErrorEvents.errorType;
        break;
      case 'category':
        groupByField = opsErrorEvents.errorCategory;
        break;
      case 'user':
        groupByField = opsErrorEvents.userId;
        break;
      default:
        groupByField = opsErrorEvents.dealStage;
    }
    
    let query = db.select({
      key: groupByField,
      count: sql<number>`COUNT(*)`
    }).from(opsErrorEvents);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const results = await query.groupBy(groupByField);
    
    return results.map(r => ({
      key: r.key || 'unknown',
      count: Number(r.count) || 0
    }));
  }
  
  // Performance Snapshots
  async getPerformanceSnapshots(userId: string, periodType?: string): Promise<OpsPerformanceSnapshot[]> {
    const conditions = [eq(opsPerformanceSnapshots.userId, userId)];
    
    if (periodType) {
      conditions.push(eq(opsPerformanceSnapshots.periodType, periodType));
    }
    
    return await db.select()
      .from(opsPerformanceSnapshots)
      .where(and(...conditions))
      .orderBy(desc(opsPerformanceSnapshots.periodStart));
  }
  
  async getAllPerformanceSnapshots(options: { periodType?: string; periodStart?: Date; limit?: number }): Promise<OpsPerformanceSnapshot[]> {
    const conditions = [];
    
    if (options.periodType) {
      conditions.push(eq(opsPerformanceSnapshots.periodType, options.periodType));
    }
    if (options.periodStart) {
      conditions.push(gte(opsPerformanceSnapshots.periodStart, options.periodStart.toISOString().split('T')[0]));
    }
    
    let query = db.select().from(opsPerformanceSnapshots);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query
      .orderBy(desc(opsPerformanceSnapshots.periodStart))
      .limit(options.limit || 50);
  }
  
  // ============== PRC INGESTION & BENCHMARK PUBLISHING ==============
  
  // PRC Documents
  async createPrcDocument(data: InsertPrcDocument): Promise<PrcDocument> {
    const result = await db.insert(prcDocuments).values(data).returning();
    return result[0];
  }
  
  async getPrcDocuments(filters?: { supplierId?: number; referenceMonth?: string; parseStatus?: string; isDemo?: boolean }): Promise<PrcDocument[]> {
    const conditions = [];
    
    if (filters?.supplierId) {
      conditions.push(eq(prcDocuments.supplierId, filters.supplierId));
    }
    if (filters?.referenceMonth) {
      conditions.push(eq(prcDocuments.referenceMonth, filters.referenceMonth));
    }
    if (filters?.parseStatus) {
      conditions.push(eq(prcDocuments.parseStatus, filters.parseStatus));
    }
    if (filters?.isDemo !== undefined) {
      conditions.push(eq(prcDocuments.isDemo, filters.isDemo));
    }
    
    let query = db.select().from(prcDocuments);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(prcDocuments.uploadedAt));
  }
  
  async getPrcDocument(id: number): Promise<PrcDocument | undefined> {
    const result = await db.select().from(prcDocuments).where(eq(prcDocuments.id, id));
    return result[0];
  }
  
  async updatePrcDocument(id: number, data: Partial<InsertPrcDocument>): Promise<PrcDocument | undefined> {
    const result = await db.update(prcDocuments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(prcDocuments.id, id))
      .returning();
    return result[0];
  }
  
  async updatePrcDocumentParseStatus(id: number, status: string, confidence?: number, errors?: any[]): Promise<PrcDocument | undefined> {
    const updateData: any = {
      parseStatus: status,
      updatedAt: new Date()
    };
    
    if (confidence !== undefined) {
      updateData.parseConfidence = confidence;
    }
    if (errors !== undefined) {
      updateData.parseErrors = errors;
    }
    if (status === 'PARSING') {
      updateData.parseStartedAt = new Date();
    }
    if (status === 'PARSED' || status === 'FAILED') {
      updateData.parseCompletedAt = new Date();
    }
    
    const result = await db.update(prcDocuments)
      .set(updateData)
      .where(eq(prcDocuments.id, id))
      .returning();
    return result[0];
  }
  
  async verifyPrcDocument(id: number, verifiedByUserId: string): Promise<PrcDocument | undefined> {
    const result = await db.update(prcDocuments)
      .set({
        parseStatus: 'VERIFIED',
        verifiedByUserId,
        verifiedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(prcDocuments.id, id))
      .returning();
    return result[0];
  }
  
  async deletePrcDocument(id: number): Promise<void> {
    await db.delete(prcRows).where(eq(prcRows.prcDocumentId, id));
    await db.delete(prcDocuments).where(eq(prcDocuments.id, id));
  }
  
  // PRC Rows
  async createPrcRow(data: InsertPrcRow): Promise<PrcRow> {
    const result = await db.insert(prcRows).values(data).returning();
    return result[0];
  }
  
  async createPrcRows(rows: InsertPrcRow[]): Promise<PrcRow[]> {
    if (rows.length === 0) return [];
    const result = await db.insert(prcRows).values(rows).returning();
    return result;
  }
  
  async getPrcRows(documentId: number): Promise<PrcRow[]> {
    return await db.select().from(prcRows).where(eq(prcRows.prcDocumentId, documentId));
  }
  
  async getPrcRowsForMonth(referenceMonth: string, isDemo?: boolean): Promise<PrcRow[]> {
    const conditions = [eq(prcRows.referenceMonth, referenceMonth)];
    
    if (isDemo !== undefined) {
      const docs = await this.getPrcDocuments({ referenceMonth, isDemo });
      const docIds = docs.map(d => d.id);
      if (docIds.length === 0) return [];
      
      return await db.select().from(prcRows)
        .where(and(
          eq(prcRows.referenceMonth, referenceMonth),
          sql`${prcRows.prcDocumentId} = ANY(ARRAY[${sql.raw(docIds.join(','))}]::int[])`
        ));
    }
    
    return await db.select().from(prcRows).where(eq(prcRows.referenceMonth, referenceMonth));
  }
  
  async getPrcRow(id: number): Promise<PrcRow | undefined> {
    const result = await db.select().from(prcRows).where(eq(prcRows.id, id));
    return result[0];
  }
  
  async updatePrcRow(id: number, data: Partial<InsertPrcRow>, editedByUserId?: string): Promise<PrcRow | undefined> {
    const existingRow = await this.getPrcRow(id);
    if (!existingRow) return undefined;
    
    const updateData: any = { ...data };
    
    if (editedByUserId) {
      updateData.wasManuallyEdited = true;
      updateData.editedByUserId = editedByUserId;
      updateData.editedAt = new Date();
      updateData.originalValues = {
        submarket: existingRow.submarket,
        productType: existingRow.productType,
        termMonths: existingRow.termMonths,
        priceRPerMWh: existingRow.priceRPerMWh,
        confidence: existingRow.confidence
      };
    }
    
    const result = await db.update(prcRows)
      .set(updateData)
      .where(eq(prcRows.id, id))
      .returning();
    return result[0];
  }
  
  async deletePrcRow(id: number): Promise<void> {
    await db.delete(prcRows).where(eq(prcRows.id, id));
  }
  
  async deletePrcRowsForDocument(documentId: number): Promise<void> {
    await db.delete(prcRows).where(eq(prcRows.prcDocumentId, documentId));
  }
  
  async getFlaggedPrcRows(referenceMonth?: string): Promise<PrcRow[]> {
    const conditions = [eq(prcRows.isOutlierFlag, true)];
    
    if (referenceMonth) {
      conditions.push(eq(prcRows.referenceMonth, referenceMonth));
    }
    
    return await db.select().from(prcRows).where(and(...conditions));
  }
  
  // PRC Publish Batches
  async createPrcPublishBatch(data: InsertPrcPublishBatch): Promise<PrcPublishBatch> {
    const result = await db.insert(prcPublishBatches).values(data).returning();
    return result[0];
  }
  
  async getPrcPublishBatches(filters?: { referenceMonth?: string; status?: string }): Promise<PrcPublishBatch[]> {
    const conditions = [];
    
    if (filters?.referenceMonth) {
      conditions.push(eq(prcPublishBatches.referenceMonth, filters.referenceMonth));
    }
    if (filters?.status) {
      conditions.push(eq(prcPublishBatches.status, filters.status));
    }
    
    let query = db.select().from(prcPublishBatches);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(prcPublishBatches.createdAt));
  }
  
  async getPrcPublishBatch(id: number): Promise<PrcPublishBatch | undefined> {
    const result = await db.select().from(prcPublishBatches).where(eq(prcPublishBatches.id, id));
    return result[0];
  }
  
  async updatePrcPublishBatch(id: number, data: Partial<InsertPrcPublishBatch>): Promise<PrcPublishBatch | undefined> {
    const result = await db.update(prcPublishBatches)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(prcPublishBatches.id, id))
      .returning();
    return result[0];
  }
  
  async publishPrcBatch(id: number, publishedByUserId: string, benchmarkIds: number[]): Promise<PrcPublishBatch | undefined> {
    const result = await db.update(prcPublishBatches)
      .set({
        status: 'PUBLISHED',
        publishedByUserId,
        publishedAt: new Date(),
        benchmarkIds,
        benchmarksCreated: benchmarkIds.length,
        updatedAt: new Date()
      })
      .where(eq(prcPublishBatches.id, id))
      .returning();
    return result[0];
  }
  
  // PRC Stats
  async getPrcMonthSummary(referenceMonth: string, isDemo?: boolean): Promise<{
    documentCount: number;
    verifiedCount: number;
    totalRows: number;
    flaggedRows: number;
    supplierCoverage: number[];
    submarketCoverage: string[];
    productCoverage: string[];
  }> {
    const docs = await this.getPrcDocuments({ referenceMonth, isDemo });
    const verifiedDocs = docs.filter(d => d.parseStatus === 'VERIFIED' || d.parseStatus === 'PUBLISHED');
    
    const rows = await this.getPrcRowsForMonth(referenceMonth, isDemo);
    const flaggedRows = rows.filter(r => r.isOutlierFlag);
    
    const supplierIds = Array.from(new Set(docs.map(d => d.supplierId)));
    const submarkets = Array.from(new Set(rows.map(r => r.submarket)));
    const products = Array.from(new Set(rows.map(r => r.productType)));
    
    return {
      documentCount: docs.length,
      verifiedCount: verifiedDocs.length,
      totalRows: rows.length,
      flaggedRows: flaggedRows.length,
      supplierCoverage: supplierIds,
      submarketCoverage: submarkets,
      productCoverage: products
    };
  }
  
  // ============== BRAND KIT ==============
  async getBrandKit(): Promise<BrandKit | undefined> {
    const result = await db.select().from(brandKit).limit(1);
    if (result.length > 0) {
      return result[0];
    }
    
    // Create default brand kit if none exists
    const defaultKit = await db.insert(brandKit).values({
      brandName: 'Ótima Energia',
      tagline: 'Sua energia. Sua escolha. Sua economia.',
      primaryColor: '#9e3ffd',
      secondaryColor: '#df0af2',
      darkColor: '#16163f',
      lightBgColor: '#eee7f1',
      textColor: '#736d77',
      fontFamily: 'Inter',
      footerText: 'Ótima Energia • contato@otimaenergia.com.br • Rio de Janeiro - Brasil',
      websiteUrl: 'https://otimaenergia.com'
    }).returning();
    
    return defaultKit[0];
  }
  
  async updateBrandKit(id: number, data: Partial<InsertBrandKit>): Promise<BrandKit | undefined> {
    const result = await db.update(brandKit)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(brandKit.id, id))
      .returning();
    return result[0];
  }
  
  // ============== DEAL PROPOSALS (Proposal OS) ==============
  async createDealProposal(data: InsertDealProposal): Promise<DealProposal> {
    const publicId = randomBytes(8).toString('hex');
    const result = await db.insert(dealProposals).values({
      ...data,
      publicId
    }).returning();
    return result[0];
  }
  
  async getDealProposals(dealId: string): Promise<DealProposal[]> {
    return await db.select().from(dealProposals)
      .where(eq(dealProposals.dealId, dealId))
      .orderBy(desc(dealProposals.createdAt));
  }

  async getAllDealProposals(): Promise<DealProposal[]> {
    return await db.select().from(dealProposals)
      .orderBy(desc(dealProposals.createdAt));
  }
  
  async getDealProposal(id: string): Promise<DealProposal | undefined> {
    const result = await db.select().from(dealProposals).where(eq(dealProposals.id, id));
    return result[0];
  }
  
  async getDealProposalByPublicId(publicId: string): Promise<DealProposal | undefined> {
    const result = await db.select().from(dealProposals)
      .where(eq(dealProposals.publicId, publicId));
    return result[0];
  }
  
  async updateDealProposal(id: string, data: Partial<InsertDealProposal>): Promise<DealProposal | undefined> {
    const result = await db.update(dealProposals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dealProposals.id, id))
      .returning();
    return result[0];
  }
  
  async deleteDealProposal(id: string): Promise<void> {
    await db.delete(dealProposals).where(eq(dealProposals.id, id));
  }
  
  // Proposal Items
  async createDealProposalItem(data: InsertDealProposalItem): Promise<DealProposalItem> {
    const result = await db.insert(dealProposalItems).values(data).returning();
    return result[0];
  }
  
  async getDealProposalItems(proposalId: string): Promise<DealProposalItem[]> {
    return await db.select().from(dealProposalItems)
      .where(eq(dealProposalItems.proposalId, proposalId))
      .orderBy(dealProposalItems.displayOrder);
  }
  
  async updateDealProposalItem(id: number, data: Partial<InsertDealProposalItem>): Promise<DealProposalItem | undefined> {
    const result = await db.update(dealProposalItems)
      .set(data)
      .where(eq(dealProposalItems.id, id))
      .returning();
    return result[0];
  }
  
  async deleteDealProposalItem(id: number): Promise<void> {
    await db.delete(dealProposalItems).where(eq(dealProposalItems.id, id));
  }
  
  // Proposal Snapshots
  async createDealProposalSnapshot(data: InsertDealProposalSnapshot): Promise<DealProposalSnapshot> {
    const result = await db.insert(dealProposalSnapshots).values(data).returning();
    return result[0];
  }
  
  async getDealProposalSnapshot(proposalId: string): Promise<DealProposalSnapshot | undefined> {
    const result = await db.select().from(dealProposalSnapshots)
      .where(eq(dealProposalSnapshots.proposalId, proposalId));
    return result[0];
  }
  
  // Proposal Views
  async recordDealProposalView(data: InsertDealProposalView): Promise<DealProposalView> {
    const result = await db.insert(dealProposalViews).values(data).returning();
    return result[0];
  }
  
  async getDealProposalViews(proposalId: string): Promise<DealProposalView[]> {
    return await db.select().from(dealProposalViews)
      .where(eq(dealProposalViews.proposalId, proposalId))
      .orderBy(desc(dealProposalViews.viewedAt));
  }
  
  async incrementDealProposalViewCount(proposalId: string): Promise<void> {
    await db.update(dealProposals)
      .set({
        viewCount: sql`${dealProposals.viewCount} + 1`,
        lastViewedAt: new Date()
      })
      .where(eq(dealProposals.id, proposalId));
  }
  
  // ============== FINANCE OS (INVOICING) ==============
  
  async createInvoice(data: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values(data).returning();
    return result[0];
  }
  
  async getInvoices(filters?: { status?: string; dealId?: string; supplierId?: number; isDemo?: boolean }): Promise<Invoice[]> {
    let query = db.select().from(invoices);
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(invoices.status, filters.status as any));
    }
    if (filters?.dealId) {
      conditions.push(eq(invoices.dealId, filters.dealId));
    }
    if (filters?.supplierId) {
      conditions.push(eq(invoices.supplierId, filters.supplierId));
    }
    if (filters?.isDemo !== undefined) {
      conditions.push(eq(invoices.isDemo, filters.isDemo));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(invoices).where(and(...conditions)).orderBy(desc(invoices.createdAt));
    }
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }
  
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id));
    return result[0];
  }
  
  async updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const result = await db.update(invoices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return result[0];
  }
  
  async getInvoicesByDeal(dealId: string): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(eq(invoices.dealId, dealId))
      .orderBy(desc(invoices.createdAt));
  }
  
  async getInvoiceSummary(isDemo?: boolean): Promise<{
    totalInvoiced: number;
    totalReceived: number;
    totalPending: number;
    totalOverdue: number;
    countByStatus: Record<string, number>;
  }> {
    const demoCondition = isDemo !== undefined ? eq(invoices.isDemo, isDemo) : undefined;
    
    const allInvoices = demoCondition 
      ? await db.select().from(invoices).where(demoCondition)
      : await db.select().from(invoices);
    
    let totalInvoiced = 0;
    let totalReceived = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    const countByStatus: Record<string, number> = {};
    
    for (const inv of allInvoices) {
      const amount = parseFloat(String(inv.grossAmountBrl)) || 0;
      totalInvoiced += amount;
      
      countByStatus[inv.status] = (countByStatus[inv.status] || 0) + 1;
      
      if (inv.status === 'PAID') {
        totalReceived += amount;
      } else if (inv.status === 'OVERDUE') {
        totalOverdue += amount;
      } else if (inv.status === 'SENT' || inv.status === 'DRAFT') {
        totalPending += amount;
      }
    }
    
    return { totalInvoiced, totalReceived, totalPending, totalOverdue, countByStatus };
  }
  
  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const existingCount = await db.select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(sql`invoice_number LIKE ${`OE-${year}${month}-%`}`);
    
    const seq = (Number(existingCount[0]?.count || 0) + 1).toString().padStart(4, '0');
    return `OE-${year}${month}-${seq}`;
  }
  
  async createInvoiceEvent(data: InsertInvoiceEvent): Promise<InvoiceEvent> {
    const result = await db.insert(invoiceEvents).values(data).returning();
    return result[0];
  }
  
  async getInvoiceEvents(invoiceId: number): Promise<InvoiceEvent[]> {
    return await db.select().from(invoiceEvents)
      .where(eq(invoiceEvents.invoiceId, invoiceId))
      .orderBy(desc(invoiceEvents.createdAt));
  }
  
  async getInvoicePermission(userId: string): Promise<InvoicePermission | undefined> {
    const result = await db.select().from(invoicePermissions)
      .where(eq(invoicePermissions.userId, userId));
    return result[0];
  }
  
  async setInvoicePermission(userId: string, accessLevel: 'VIEW_ONLY' | 'SEND_ONLY' | 'MANAGE'): Promise<InvoicePermission> {
    const existing = await this.getInvoicePermission(userId);
    
    if (existing) {
      const result = await db.update(invoicePermissions)
        .set({ accessLevel, updatedAt: new Date() })
        .where(eq(invoicePermissions.userId, userId))
        .returning();
      return result[0];
    }
    
    const result = await db.insert(invoicePermissions)
      .values({ userId, accessLevel })
      .returning();
    return result[0];
  }
  
  async getAllInvoicePermissions(): Promise<InvoicePermission[]> {
    return await db.select().from(invoicePermissions);
  }
  
  // Overdue Escalation
  async getOverdueInvoices(): Promise<Invoice[]> {
    const now = new Date();
    return await db.select().from(invoices)
      .where(
        and(
          lt(invoices.dueDate, now),
          eq(invoices.status, 'SENT'),
          eq(invoices.isDemo, false)
        )
      )
      .orderBy(invoices.dueDate);
  }
  
  async markReminderSent(invoiceId: number): Promise<Invoice | undefined> {
    const result = await db.update(invoices)
      .set({ 
        lastReminderSentAt: new Date(),
        reminderCount: sql`COALESCE(${invoices.reminderCount}, 0) + 1`,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, invoiceId))
      .returning();
    return result[0];
  }
  
  async markOpsTaskCreated(invoiceId: number): Promise<Invoice | undefined> {
    const result = await db.update(invoices)
      .set({ 
        opsTaskCreated: true,
        escalatedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(invoices.id, invoiceId))
      .returning();
    return result[0];
  }
}

export const storage = new Storage();
