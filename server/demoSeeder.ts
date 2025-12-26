import { db } from "./db";
import {
  clients,
  suppliers,
  deals,
  dealQuotes,
  dealCommissionEvents,
  clientUsagePeriods,
  dealCases,
  clientDossiers,
  rfqDispatches,
  supplierRfqPlaybooks,
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const DEMO_PREFIX = "DEMO_";

function generateDemoId(prefix: string, index: number): string {
  return `${DEMO_PREFIX}${prefix}_${String(index).padStart(3, '0')}`;
}

const brazilianCompanyNames = [
  "Indústria Metalúrgica São Paulo",
  "Têxteis Brasil Ltda",
  "Agroindústria Norte",
  "Plásticos do Sul",
  "Construtora Horizonte",
  "Supermercados União",
  "Química Verde Industrial",
  "Frigorífico Bovinos",
  "Cerâmica Minas",
  "Papel e Celulose Amazônia"
];

const supplierNames = [
  "Eneva Energia",
  "Comerc ESCO",
  "Âmbar Energia",
  "Atlas Energia",
  "Prime Energy",
  "Tradener",
  "Omega Energia",
  "CPFL Soluções"
];

const submarkets = ["SE/CO", "S", "NE", "N"];
const distributors = ["CPFL", "Cemig", "Light", "Energisa", "CELPE", "COPEL", "Eletropaulo", "RGE"];
const tariffClasses = ["A4", "A3", "A2", "AS"];
const eligibilityTypes = ["ACL_DIRECT", "ACL_VAREJISTA", "NOT_ELIGIBLE_YET"];
const channels = ["EMAIL", "WHATSAPP", "PORTAL", "MANUAL"];

export async function seedDemoData(): Promise<{ success: boolean; summary: Record<string, number> }> {
  const summary: Record<string, number> = {};
  
  try {
    const demoClients = [];
    for (let i = 0; i < 10; i++) {
      const client = {
        companyName: brazilianCompanyNames[i],
        cnpj: `${10 + i}.${100 + i * 3}.${200 + i * 5}/0001-${50 + i}`,
        contactPerson: `Contato ${i + 1}`,
        email: `contato${i + 1}@demo-company.com.br`,
        phone: `+55 11 9${String(1000 + i * 111).padStart(4, '0')}-${String(2000 + i * 222).padStart(4, '0')}`,
        status: ["prospect", "awaiting_quote", "negotiating", "active"][i % 4],
        ucCode: `UC${1000 + i}`,
        segment: ["SME", "Industrial"][i % 2],
        region: ["Sudeste", "Sul", "Nordeste", "Norte", "Centro-Oeste"][i % 5],
        avgConsumptionKwh: 80000 + i * 20000,
        isDemo: true,
      };
      demoClients.push(client);
    }
    
    const insertedClients = await db.insert(clients).values(demoClients).returning();
    summary.clients = insertedClients.length;

    const demoSuppliers = [];
    for (let i = 0; i < supplierNames.length; i++) {
      const supplier = {
        name: supplierNames[i],
        shortCode: `DEMO_${supplierNames[i].substring(0, 4).toUpperCase()}${i}`,
        category: ["large", "medium", "renewable"][i % 3],
        contactEmail: `comercial@${supplierNames[i].toLowerCase().replace(/\s+/g, '')}.com.br`,
        contactPhone: `+55 21 9${String(3000 + i * 100).padStart(4, '0')}-${String(4000 + i * 100).padStart(4, '0')}`,
        isActive: true,
        isDemo: true,
      };
      demoSuppliers.push(supplier);
    }
    
    const insertedSuppliers = await db.insert(suppliers).values(demoSuppliers).returning();
    summary.suppliers = insertedSuppliers.length;

    const dealStatuses = [
      { status: "DRAFT", label: "Draft" },
      { status: "PROSPECTING", label: "Early Stage" },
      { status: "QUALIFICATION", label: "Qualifying" },
      { status: "DOC_COLLECTION", label: "Documents" },
      { status: "RFQ_PREP", label: "RFQ Ready" },
      { status: "RFQ_SENT", label: "Quotes Pending" },
      { status: "QUOTE_ANALYSIS", label: "Analyzing" },
      { status: "PROPOSAL", label: "Proposal Sent" },
      { status: "CLOSED_WON", label: "Won Deal" },
      { status: "CLOSED_LOST", label: "Lost Deal" },
    ];

    const demoDeals = [];
    for (let i = 0; i < 10; i++) {
      const clientIndex = i % insertedClients.length;
      const statusInfo = dealStatuses[i];
      const deal = {
        id: generateDemoId("DEAL", i + 1),
        clientId: insertedClients[clientIndex].id,
        status: statusInfo.status,
        volumeMwhYear: 1000 + i * 500,
        volumeMwhMonth: parseFloat(((1000 + i * 500) / 12).toFixed(2)),
        contractTermMonths: [12, 24, 36, 48, 60][i % 5],
        contractStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 * (i + 1)).toISOString().split('T')[0],
        energyType: ["convencional", "incentivada_50", "incentivada_100"][i % 3],
        submarket: submarkets[i % 4],
        internalOwner: "Renan",
        isDemo: true,
      };
      demoDeals.push(deal);
    }
    
    const insertedDeals = await db.insert(deals).values(demoDeals).returning();
    summary.deals = insertedDeals.length;

    const demoDossiers = [];
    for (let i = 0; i < 5; i++) {
      const clientIndex = i % insertedClients.length;
      const client = insertedClients[clientIndex];
      const dossier = {
        clientId: client.id,
        legalName: client.companyName,
        tradeName: client.companyName.split(' ')[0],
        cnpj: client.cnpj!,
        distributor: distributors[i % distributors.length],
        submarket: submarkets[i % submarkets.length],
        connectionType: ["GROUP_A", "GROUP_B"][i % 2],
        eligibilityType: eligibilityTypes[i % eligibilityTypes.length],
        annualConsumptionMWh: 500 + i * 200,
        averageMonthlyMWh: parseFloat(((500 + i * 200) / 12).toFixed(2)),
        peakDemandKW: 100 + i * 50,
        numberOfUCs: 1 + (i % 4),
        tariffClass: tariffClasses[i % tariffClasses.length],
        confidenceScore: ["LOW", "MEDIUM", "HIGH"][i % 3],
        status: ["DRAFT", "READY", "LOCKED"][i % 3],
        isDemo: true,
      };
      demoDossiers.push(dossier);
    }
    
    const insertedDossiers = await db.insert(clientDossiers).values(demoDossiers).onConflictDoNothing().returning();
    summary.dossiers = insertedDossiers.length;

    const demoPlaybooks = [];
    for (let i = 0; i < insertedSuppliers.length; i++) {
      const supplier = insertedSuppliers[i];
      const playbook = {
        supplierId: supplier.id,
        version: 1,
        status: "ACTIVE" as const,
        preferredChannel: channels[i % channels.length],
        requiredFields: ["ucCodes", "demandKw", "monthlyMwh", "contractMonths"],
        emailConfig: {
          toEmails: [supplier.contactEmail],
          subjectTemplate: "RFQ - {{clientName}} - {{volume}}MWh/mês",
          bodyTemplate: "Prezados,\n\nSolicitamos cotação para:\n- Cliente: {{clientName}}\n- Volume: {{volume}} MWh/mês\n- Prazo: {{term}} meses\n\nAtenciosamente,\nÓtima Energia",
        },
        slaConfig: {
          quoteDueHours: 48,
          followupCadenceHours: [24, 48],
        },
        internalNotes: `Demo playbook for ${supplier.name}`,
        isDemo: true,
      };
      demoPlaybooks.push(playbook);
    }
    
    const insertedPlaybooks = await db.insert(supplierRfqPlaybooks).values(demoPlaybooks).returning();
    summary.playbooks = insertedPlaybooks.length;

    const rfqDeals = insertedDeals.filter(d => 
      ["RFQ_SENT", "QUOTE_ANALYSIS", "PROPOSAL", "NEGOTIATION", "CLOSED_WON"].includes(d.status)
    );
    
    const demoDispatches = [];
    for (const deal of rfqDeals) {
      for (let i = 0; i < 3; i++) {
        const supplierIndex = (rfqDeals.indexOf(deal) + i) % insertedSuppliers.length;
        const supplier = insertedSuppliers[supplierIndex];
        const playbook = insertedPlaybooks.find(p => p.supplierId === supplier.id);
        
        const dispatch = {
          dealId: deal.id,
          supplierId: supplier.id,
          supplierRfqPlaybookId: playbook?.id,
          playbookVersion: 1,
          channelUsed: channels[i % channels.length],
          status: ["SENT", "DELIVERED", "RESPONDED", "CLOSED"][i % 4],
          sentAt: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000),
          dueAt: new Date(Date.now() + (3 + i) * 24 * 60 * 60 * 1000),
          respondedAt: i > 0 ? new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000) : null,
          followupCount: i,
          messageSubject: `RFQ - Demo Client - ${100 + rfqDeals.indexOf(deal) * 50}MWh/mês`,
          messageBody: `Cotação demo para teste de workflow`,
          isDemo: true,
        };
        demoDispatches.push(dispatch);
      }
    }
    
    const insertedDispatches = await db.insert(rfqDispatches).values(demoDispatches).returning();
    summary.dispatches = insertedDispatches.length;

    const quotableDeals = insertedDeals.filter(d => 
      ["QUOTE_ANALYSIS", "PROPOSAL", "NEGOTIATION", "CLOSED_WON"].includes(d.status)
    );
    
    const demoQuotes = [];
    for (const deal of quotableDeals) {
      const relatedDispatches = insertedDispatches.filter(d => d.dealId === deal.id);
      
      for (let i = 0; i < Math.min(3, relatedDispatches.length); i++) {
        const dispatch = relatedDispatches[i];
        const pricePerMwh = 180 + Math.random() * 60;
        const quote = {
          dealId: deal.id,
          supplierId: dispatch.supplierId,
          rfqDispatchId: dispatch.id,
          rawQuoteJson: {
            pricePerMwh,
            term: deal.contractTermMonths || 24,
            structure: ["FIXED", "FLEX", "I5"][i % 3],
            receivedAt: new Date().toISOString(),
            source: "demo_seeder",
          },
          baseEnergyPriceRmwh: parseFloat(pricePerMwh.toFixed(2)),
          energyType: ["convencional", "incentivada_50", "incentivada_100"][i % 3],
          priceStructure: ["fixed", "indexed_ipca", "indexed_igpm"][i % 3],
          validUntil: new Date(Date.now() + (7 + i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          quoteNotes: `Demo quote ${i + 1} for testing`,
          isNormalized: true,
          normalizationConfidence: parseFloat((0.85 + Math.random() * 0.15).toFixed(2)),
          isDemo: true,
        };
        demoQuotes.push(quote);
      }
    }
    
    const insertedQuotes = await db.insert(dealQuotes).values(demoQuotes).returning();
    summary.quotes = insertedQuotes.length;

    const wonDeals = insertedDeals.filter(d => d.status === "CLOSED_WON");
    const demoCommissionEvents = [];
    
    for (const deal of wonDeals) {
      const upfrontEvent = {
        dealId: deal.id,
        eventType: "UPFRONT" as const,
        eventIndex: 0,
        calcType: "fixed_amount",
        calcInputs: { base_amount: 5000, volume_mwh: 100 },
        amountBrl: 5000.00,
        isEstimated: false,
        dueCondition: "SUPPLY_LIVE",
        expectedDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "PENDING" as const,
        notes: "Demo upfront commission",
        isDemo: true,
      };
      demoCommissionEvents.push(upfrontEvent);

      for (let month = 1; month <= 3; month++) {
        const monthlyEvent = {
          dealId: deal.id,
          eventType: "MONTHLY" as const,
          eventIndex: month,
          calcType: "per_mwh",
          calcInputs: { volume_mwh: 100, rate_rmwh: 2.5 },
          amountBrl: 250.00,
          isEstimated: true,
          dueCondition: "MONTHLY",
          expectedDate: new Date(Date.now() + (30 * month + 45) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "FUTURE" as const,
          notes: `Demo monthly commission - month ${month}`,
          isDemo: true,
        };
        demoCommissionEvents.push(monthlyEvent);
      }
    }
    
    const insertedCommissionEvents = await db.insert(dealCommissionEvents).values(demoCommissionEvents).returning();
    summary.commissionEvents = insertedCommissionEvents.length;

    const demoCases = [];
    for (let i = 0; i < 5; i++) {
      const dealIndex = i % insertedDeals.length;
      const deal = insertedDeals[dealIndex];
      const caseTypes = ["DOCUMENTATION_MISSING", "CLIENT_UNRESPONSIVE", "PRICING_DISPUTE", "CONTRACT_DELAY", "SUPPLIER_ISSUE"];
      const severities = ["LOW", "MED", "HIGH", "CRITICAL"];
      const statuses = ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED"];
      
      const dealCase = {
        dealId: deal.id,
        caseType: caseTypes[i % caseTypes.length],
        severity: severities[i % severities.length],
        status: statuses[i % statuses.length],
        nextActionDate: new Date(Date.now() + (i + 1) * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        slaDueDate: new Date(Date.now() + (i + 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        rootCause: `Demo case root cause ${i + 1}`,
        isDemo: true,
      };
      demoCases.push(dealCase);
    }
    
    const insertedCases = await db.insert(dealCases).values(demoCases).returning();
    summary.cases = insertedCases.length;

    const activeClients = insertedClients.filter((_, i) => i < 3);
    const demoUsagePeriods = [];
    
    for (const client of activeClients) {
      for (let month = 0; month < 6; month++) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - month - 1);
        startDate.setDate(1);
        
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        
        const usagePeriod = {
          clientId: client.id,
          ucCode: `UC${client.id}001`,
          periodStartDate: startDate.toISOString().split('T')[0],
          periodEndDate: endDate.toISOString().split('T')[0],
          energyKwh: parseFloat((80000 + Math.random() * 40000).toFixed(2)),
          demandKw: parseFloat((150 + Math.random() * 50).toFixed(2)),
          billedAmountBrl: parseFloat((15000 + Math.random() * 10000).toFixed(2)),
          sourceType: "EXTRACTED" as const,
          status: ["DRAFT", "VERIFIED", "CONFIRMED"][month % 3] as "DRAFT" | "VERIFIED" | "CONFIRMED",
          notes: `Demo usage period for testing`,
          isDemo: true,
        };
        demoUsagePeriods.push(usagePeriod);
      }
    }
    
    const insertedUsagePeriods = await db.insert(clientUsagePeriods).values(demoUsagePeriods).returning();
    summary.usagePeriods = insertedUsagePeriods.length;

    return { success: true, summary };
  } catch (error) {
    console.error("Error seeding demo data:", error);
    throw error;
  }
}

export async function nukeDemoData(): Promise<{ success: boolean; deleted: Record<string, number> }> {
  const deleted: Record<string, number> = {};
  
  try {
    const usageResult = await db.delete(clientUsagePeriods).where(eq(clientUsagePeriods.isDemo, true)).returning();
    deleted.usagePeriods = usageResult.length;

    const casesResult = await db.delete(dealCases).where(eq(dealCases.isDemo, true)).returning();
    deleted.cases = casesResult.length;

    const commissionResult = await db.delete(dealCommissionEvents).where(eq(dealCommissionEvents.isDemo, true)).returning();
    deleted.commissionEvents = commissionResult.length;

    const quotesResult = await db.delete(dealQuotes).where(eq(dealQuotes.isDemo, true)).returning();
    deleted.quotes = quotesResult.length;

    const dispatchesResult = await db.delete(rfqDispatches).where(eq(rfqDispatches.isDemo, true)).returning();
    deleted.dispatches = dispatchesResult.length;

    const playbooksResult = await db.delete(supplierRfqPlaybooks).where(eq(supplierRfqPlaybooks.isDemo, true)).returning();
    deleted.playbooks = playbooksResult.length;

    const dossiersResult = await db.delete(clientDossiers).where(eq(clientDossiers.isDemo, true)).returning();
    deleted.dossiers = dossiersResult.length;

    const dealsResult = await db.delete(deals).where(eq(deals.isDemo, true)).returning();
    deleted.deals = dealsResult.length;

    const suppliersResult = await db.delete(suppliers).where(eq(suppliers.isDemo, true)).returning();
    deleted.suppliers = suppliersResult.length;

    const clientsResult = await db.delete(clients).where(eq(clients.isDemo, true)).returning();
    deleted.clients = clientsResult.length;

    return { success: true, deleted };
  } catch (error) {
    console.error("Error nuking demo data:", error);
    throw error;
  }
}

export async function getDemoDataStats(): Promise<Record<string, number>> {
  const stats: Record<string, number> = {};
  
  const clientCount = await db.select({ count: sql<number>`count(*)` }).from(clients).where(eq(clients.isDemo, true));
  stats.clients = Number(clientCount[0]?.count || 0);
  
  const supplierCount = await db.select({ count: sql<number>`count(*)` }).from(suppliers).where(eq(suppliers.isDemo, true));
  stats.suppliers = Number(supplierCount[0]?.count || 0);
  
  const dealCount = await db.select({ count: sql<number>`count(*)` }).from(deals).where(eq(deals.isDemo, true));
  stats.deals = Number(dealCount[0]?.count || 0);
  
  const quoteCount = await db.select({ count: sql<number>`count(*)` }).from(dealQuotes).where(eq(dealQuotes.isDemo, true));
  stats.quotes = Number(quoteCount[0]?.count || 0);
  
  const dispatchCount = await db.select({ count: sql<number>`count(*)` }).from(rfqDispatches).where(eq(rfqDispatches.isDemo, true));
  stats.dispatches = Number(dispatchCount[0]?.count || 0);
  
  const caseCount = await db.select({ count: sql<number>`count(*)` }).from(dealCases).where(eq(dealCases.isDemo, true));
  stats.cases = Number(caseCount[0]?.count || 0);
  
  const commissionCount = await db.select({ count: sql<number>`count(*)` }).from(dealCommissionEvents).where(eq(dealCommissionEvents.isDemo, true));
  stats.commissionEvents = Number(commissionCount[0]?.count || 0);
  
  const usageCount = await db.select({ count: sql<number>`count(*)` }).from(clientUsagePeriods).where(eq(clientUsagePeriods.isDemo, true));
  stats.usagePeriods = Number(usageCount[0]?.count || 0);
  
  return stats;
}
