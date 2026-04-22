import { db } from "./db";
import {
  suppliers as suppliersTable,
  supplierGdCoverage,
  supplierRfqPlaybooks,
  supplierContacts,
  deals,
  dealTracks,
  dealQuotes,
  clients as clientsTable,
} from "@shared/schema";
import { eq, like, isNotNull } from "drizzle-orm";

const SUPPLIERS = [
  { name: "Prime Energy", shortCode: "PRIME", category: "large", contactEmail: "contasapagar@primeenergy.com.br", website: "https://www.primeenergy.com.br", status: "active", isActive: true },
  { name: "ATMO Energia", shortCode: "ATMO", category: "medium", contactEmail: null, website: null, status: "active", isActive: true },
  { name: "CEMIG", shortCode: "CEMIG", category: "large", contactEmail: null, website: null, status: "active", isActive: true },
  { name: "Delantis Energias Renováveis", shortCode: "DELANTIS", category: "medium", contactEmail: null, website: null, status: "active", isActive: true },
  { name: "Genial Energia", shortCode: "GENIAL", category: "medium", contactEmail: null, website: null, status: "active", isActive: true },
];

const GD_COVERAGE = [
  { shortCode: "PRIME", coveredStates: ["SP","MG","MT","MS","GO","BA","PI","PR"], coveredDistributors: ["CPFL Paulista","CEMIG","CPFL Santa Cruz","Energisa MT","Energisa MS","Equatorial GO","COELBA","Equatorial PI","Elektro (Neoenergia)","COPEL"], notes: "GD Assinatura BT. Partner code: 241254." },
  { shortCode: "ATMO", coveredStates: ["MG","PR"], coveredDistributors: ["CEMIG","COPEL"], notes: "GD Assinatura BT. CEMIG (MG) + COPEL (PR)." },
  { shortCode: "DELANTIS", coveredStates: ["ALL"], coveredDistributors: ["Nacional - Compensação"], notes: "GD Compensação Nacional." },
  { shortCode: "GENIAL", coveredStates: ["RJ"], coveredDistributors: ["Light","Enel RJ"], notes: "GD BT. Light + Enel RJ (Rio de Janeiro)." },
];

const PLAYBOOKS = [
  { shortCode: "PRIME", preferredChannel: "EMAIL", productLines: ["ACL"], productsSupported: ["CONVENCIONAL","INCENTIVADA_50","INCENTIVADA_100"], submarketsCovered: ["SE_CO","S","NE","N"], internalNotes: "ACL Atacado — Demanda >= 500 kW. R$2/MWh commission." },
  { shortCode: "PRIME", preferredChannel: "EMAIL", productLines: ["ACL"], productsSupported: ["CONVENCIONAL","INCENTIVADA_50"], submarketsCovered: ["SE_CO","S","NE","N"], internalNotes: "ACL Varejo — Demanda < 500 kW. R$5/MWh commission." },
  { shortCode: "PRIME", preferredChannel: "PORTAL", productLines: ["GD"], productsSupported: ["GD_ASSINATURA_BT"], submarketsCovered: ["SE_CO","S","NE"], internalNotes: "GD BT — >= 500 kWh/mês. Portal: primeenergy.com.br/parceiros. Code: 241254." },
  { shortCode: "PRIME", preferredChannel: "PORTAL", productLines: ["GD"], productsSupported: ["GD_ASSINATURA_MT"], submarketsCovered: ["SE_CO","S","NE"], internalNotes: "GD MT — Subgrupo A4. Portal: primeenergy.com.br/parceiros. Code: 241254." },
  { shortCode: "ATMO", preferredChannel: "EMAIL", productLines: ["GD"], productsSupported: ["GD_ASSINATURA_BT"], submarketsCovered: ["SE_CO","S"], internalNotes: "GD BT — CEMIG (MG) + COPEL (PR)." },
  { shortCode: "CEMIG", preferredChannel: "EMAIL", productLines: ["ACL"], productsSupported: ["CONVENCIONAL"], submarketsCovered: ["SE_CO"], internalNotes: "CEMIG ACL — major distributor, Minas Gerais." },
  { shortCode: "DELANTIS", preferredChannel: "EMAIL", productLines: ["GD"], productsSupported: ["GD_COMPENSACAO"], submarketsCovered: ["SE_CO","S","NE","N"], internalNotes: "GD Compensação Nacional." },
  { shortCode: "GENIAL", preferredChannel: "EMAIL", productLines: ["GD"], productsSupported: ["GD_ASSINATURA_BT"], submarketsCovered: ["SE_CO"], internalNotes: "GD BT — Light + Enel RJ (Rio de Janeiro)." },
];

const CONTACTS = [
  { shortCode: "PRIME", name: "A preencher", role: "Comercial", department: "COMERCIAL", email: null, isPrimary: true },
  { shortCode: "PRIME", name: "A preencher", role: "Financeiro", department: "FINANCEIRO", email: "contasapagar@primeenergy.com.br", isPrimary: false },
  { shortCode: "ATMO", name: "A preencher", role: "Comercial", department: "COMERCIAL", email: null, isPrimary: true },
  { shortCode: "CEMIG", name: "A preencher", role: "Comercial", department: "COMERCIAL", email: null, isPrimary: true },
  { shortCode: "DELANTIS", name: "A preencher", role: "Comercial", department: "COMERCIAL", email: null, isPrimary: true },
  { shortCode: "GENIAL", name: "A preencher", role: "Comercial", department: "COMERCIAL", email: null, isPrimary: true },
];

export async function runAutoSeed() {
  try {
    const supplierIds: Record<string, number> = {};

    for (const s of SUPPLIERS) {
      let found = await db.select().from(suppliersTable).where(eq(suppliersTable.shortCode, s.shortCode)).limit(1);
      if (found.length === 0) {
        found = await db.select().from(suppliersTable).where(eq(suppliersTable.name, s.name)).limit(1);
      }
      if (found.length > 0) {
        await db.update(suppliersTable)
          .set({ shortCode: s.shortCode, status: s.status, isActive: s.isActive, contactEmail: s.contactEmail, website: s.website })
          .where(eq(suppliersTable.id, found[0].id));
        supplierIds[s.shortCode] = found[0].id;
      } else {
        const [inserted] = await db.insert(suppliersTable).values(s).returning();
        supplierIds[s.shortCode] = inserted.id;
      }
    }

    for (const gc of GD_COVERAGE) {
      const supplierId = supplierIds[gc.shortCode];
      if (!supplierId) continue;
      await db.delete(supplierGdCoverage).where(eq(supplierGdCoverage.supplierId, supplierId));
      await db.insert(supplierGdCoverage).values({ supplierId, coveredStates: gc.coveredStates, coveredDistributors: gc.coveredDistributors, isActive: true, notes: gc.notes });
    }

    for (const pb of PLAYBOOKS) {
      const supplierId = supplierIds[pb.shortCode];
      if (!supplierId) continue;
      const existingPbs = await db.select().from(supplierRfqPlaybooks).where(eq(supplierRfqPlaybooks.supplierId, supplierId));
      const alreadyHasMatchingPb = existingPbs.some(
        (e: any) =>
          e.preferredChannel === pb.preferredChannel &&
          JSON.stringify(e.productLines) === JSON.stringify(pb.productLines) &&
          JSON.stringify(e.productsSupported) === JSON.stringify(pb.productsSupported)
      );
      if (!alreadyHasMatchingPb) {
        await db.insert(supplierRfqPlaybooks).values({
          supplierId,
          version: 1,
          status: "ACTIVE",
          preferredChannel: pb.preferredChannel,
          productLines: pb.productLines,
          productsSupported: pb.productsSupported,
          submarketsCovered: pb.submarketsCovered,
          internalNotes: pb.internalNotes,
        });
      }
    }

    for (const c of CONTACTS) {
      const supplierId = supplierIds[c.shortCode];
      if (!supplierId) continue;
      const existing = await db.select().from(supplierContacts).where(eq(supplierContacts.supplierId, supplierId)).limit(1);
      if (existing.length === 0) {
        await db.insert(supplierContacts).values({
          supplierId,
          name: c.name,
          role: c.role,
          department: c.department as any,
          email: c.email,
          isPrimary: c.isPrimary,
          isActive: true,
          preferredFormat: "email",
          responsivenessScore: 3,
        });
      }
    }

    console.log("[AutoSeed] Core suppliers seeded successfully.");
    await runAutoSeedDeals(supplierIds);
  } catch (err: any) {
    console.error("[AutoSeed] Supplier seed failed (non-fatal):", err.message);
  }
}

async function runAutoSeedDeals(supplierIds: Record<string, number>) {
  try {
    const existingConf = await db.select({ id: deals.id }).from(deals).where(like(deals.internalOwner, "conference_seed%")).limit(1);
    if (existingConf.length > 0) {
      console.log("[AutoSeed] Demo deals already exist, skipping.");
      return;
    }

    const existingClients = await db.select().from(clientsTable).where(isNotNull(clientsTable.cnpj)).limit(4);
    if (existingClients.length < 2) {
      console.log("[AutoSeed] Not enough clients with CNPJ for demo deals, skipping.");
      return;
    }

    const { PRIME: primeId, ATMO: atmoId, CEMIG: cemigId, DELANTIS: delantisId, GENIAL: genialId } = supplierIds;
    if (!primeId || !atmoId || !cemigId || !delantisId || !genialId) {
      console.log("[AutoSeed] Missing supplier IDs for demo deals, skipping.");
      return;
    }

    const conferenceDeals = [
      {
        clientId: existingClients[0].id,
        trackType: "GDL",
        energyType: "gd_assinatura",
        submarket: "SE_CO",
        quotes: [
          { supplierId: primeId, price: 285.50, term: 24, structure: "GD Assinatura BT" },
          { supplierId: genialId, price: 278.00, term: 24, structure: "GD Assinatura BT" },
          { supplierId: atmoId, price: 292.00, term: 12, structure: "GD Assinatura BT" },
          { supplierId: delantisId, price: 305.00, term: 24, structure: "GD Compensação Nacional" },
          { supplierId: primeId, price: 272.00, term: 36, structure: "GD Assinatura BT" },
        ],
      },
      {
        clientId: existingClients[1].id,
        trackType: "GDL",
        energyType: "gd_assinatura",
        submarket: "SE_CO",
        quotes: [
          { supplierId: primeId, price: 268.00, term: 24, structure: "GD Assinatura BT" },
          { supplierId: atmoId, price: 275.50, term: 24, structure: "GD Assinatura BT" },
          { supplierId: delantisId, price: 298.00, term: 24, structure: "GD Compensação Nacional" },
          { supplierId: primeId, price: 260.00, term: 36, structure: "GD Assinatura BT" },
        ],
      },
      {
        clientId: existingClients[2 % existingClients.length].id,
        trackType: "ACL",
        energyType: "Convencional",
        submarket: "SE_CO",
        quotes: [
          { supplierId: primeId, price: 242.00, term: 24, structure: "Convencional" },
          { supplierId: cemigId, price: 248.50, term: 24, structure: "Convencional" },
          { supplierId: primeId, price: 235.00, term: 36, structure: "Convencional" },
          { supplierId: cemigId, price: 258.00, term: 12, structure: "Convencional" },
          { supplierId: genialId, price: 252.00, term: 24, structure: "Convencional" },
        ],
      },
      {
        clientId: existingClients[3 % existingClients.length].id,
        trackType: "ACL",
        energyType: "Incentivada 50%",
        submarket: "S",
        quotes: [
          { supplierId: primeId, price: 218.00, term: 24, structure: "Incentivada 50%" },
          { supplierId: cemigId, price: 225.00, term: 24, structure: "Incentivada 50%" },
          { supplierId: primeId, price: 212.00, term: 36, structure: "Incentivada 50%" },
          { supplierId: atmoId, price: 230.00, term: 12, structure: "Incentivada 50%" },
        ],
      },
    ];

    let dealsCreated = 0;
    let quotesCreated = 0;

    for (const dd of conferenceDeals) {
      const [deal] = await db.insert(deals).values({
        clientId: dd.clientId,
        energyType: dd.energyType,
        submarket: dd.submarket,
        status: "QUOTES_RECEIVED",
        internalOwner: "conference_seed",
        isDemo: true,
      }).returning();

      await db.insert(dealTracks).values({
        dealId: deal.id,
        type: dd.trackType,
        status: dd.trackType === "GDL" ? "GDL_NEW" : "ACL_NEW",
        createdByUserId: null,
      });

      for (const q of dd.quotes) {
        await db.insert(dealQuotes).values({
          dealId: deal.id,
          supplierId: q.supplierId,
          baseEnergyPriceRmwh: String(q.price),
          termMonths: q.term,
          energyType: q.structure,
          priceStructure: q.structure,
          rawQuoteJson: { price: q.price, term: q.term, structure: q.structure, source: "conference_seed" },
          isDemo: true,
          isComplete: true,
          isProposalEligible: true,
        });
        quotesCreated++;
      }
      dealsCreated++;
    }

    console.log(`[AutoSeed] Demo deals seeded: ${dealsCreated} deals, ${quotesCreated} quotes.`);
  } catch (err: any) {
    console.error("[AutoSeed] Demo deals seed failed (non-fatal):", err.message);
  }
}
