import { db } from "./db";
import {
  suppliers as suppliersTable,
  supplierGdCoverage,
  supplierRfqPlaybooks,
  supplierContacts,
} from "@shared/schema";
import { eq } from "drizzle-orm";

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
      const existing = await db.select().from(suppliersTable).where(eq(suppliersTable.shortCode, s.shortCode)).limit(1);
      if (existing.length > 0) {
        await db.update(suppliersTable)
          .set({ name: s.name, status: s.status, isActive: s.isActive, contactEmail: s.contactEmail, website: s.website })
          .where(eq(suppliersTable.id, existing[0].id));
        supplierIds[s.shortCode] = existing[0].id;
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
  } catch (err: any) {
    console.error("[AutoSeed] Supplier seed failed (non-fatal):", err.message);
  }
}
