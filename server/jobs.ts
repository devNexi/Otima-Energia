import { db } from "./db";
import { jobs, dealZohoTaskLinks, uploadSessions, prcDocuments, prcRows, canonicalPricingRows, suppliers, billsExtracted } from "@shared/schema";
import { eq, and, lte, sql, or, isNull, isNotNull } from "drizzle-orm";
import { computeNextCallbackDateTime } from "./scheduler";
import { fetchZohoSnapshot, createZohoCallbackTask, createZohoTask, isZohoEnabled, isZohoCallbackTaskEnabled } from "./zohoClient";
import { dealCrmLinks, dealSalesSnapshots, dealSalesActivityItems, deals, clients } from "@shared/schema";
import { processPrcDocumentWithBuffer } from "./prc-parser";
import { ObjectStorageService } from "./objectStorage";
import { isParserServiceConfigured, callParserService } from "./parser-client";

const POLL_INTERVAL_MS = parseInt(process.env.JOB_POLL_INTERVAL_MS || '30000', 10);
const MAX_CONCURRENT_JOBS = 3;
const STUCK_JOB_TIMEOUT_MS = 10 * 60 * 1000;

let isRunning = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;

export async function enqueueJob(type: string, payload: Record<string, any>, nextRunAt?: Date, maxAttempts?: number): Promise<number> {
  const result = await db.insert(jobs).values({
    type,
    payload,
    status: 'PENDING',
    attempts: 0,
    maxAttempts: maxAttempts || 5,
    nextRunAt: nextRunAt || new Date(),
  }).returning();
  console.log(`[JobRunner] Enqueued job ${result[0].id} type=${type}`);
  return result[0].id;
}

export async function enqueueJobIfNotExists(type: string, idempotencyKey: string, payload: Record<string, any>, nextRunAt?: Date): Promise<number | null> {
  const existing = await db.select().from(jobs)
    .where(and(
      eq(jobs.type, type),
      sql`${jobs.payload}->>'idempotencyKey' = ${idempotencyKey}`
    ))
    .limit(1);

  if (existing.length > 0) {
    console.log(`[JobRunner] Job already exists for key=${idempotencyKey}, skipping`);
    return null;
  }

  return enqueueJob(type, { ...payload, idempotencyKey }, nextRunAt);
}

export async function getLastJobForDeal(dealId: string, type?: string): Promise<typeof jobs.$inferSelect | null> {
  const conditions = [sql`${jobs.payload}->>'dealId' = ${dealId}`];
  if (type) conditions.push(eq(jobs.type, type));

  const result = await db.select().from(jobs)
    .where(and(...conditions))
    .orderBy(sql`${jobs.createdAt} DESC`)
    .limit(1);

  return result[0] || null;
}

async function recoverStuckJobs(): Promise<void> {
  const stuckCutoff = new Date(Date.now() - STUCK_JOB_TIMEOUT_MS);
  const stuckJobs = await db.update(jobs)
    .set({
      status: 'PENDING',
      lastError: 'Recovered from stuck RUNNING state',
      updatedAt: new Date(),
    })
    .where(and(
      eq(jobs.status, 'RUNNING'),
      lte(jobs.updatedAt, stuckCutoff)
    ))
    .returning();

  if (stuckJobs.length > 0) {
    console.log(`[JobRunner] Recovered ${stuckJobs.length} stuck jobs`);
  }

  const prcStuckCutoff = new Date(Date.now() - 10 * 60 * 1000);
  const stuckPrcs = await db.update(prcDocuments)
    .set({
      parseStatus: 'FAILED',
      parseErrors: ['STALE_JOB_TIMEOUT: stuck in PARSING > 10 minutes, auto-marked FAILED'],
      parseCompletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(
      eq(prcDocuments.parseStatus, 'PARSING'),
      lte(prcDocuments.parseStartedAt, prcStuckCutoff)
    ))
    .returning();

  if (stuckPrcs.length > 0) {
    console.log(`[JobRunner] Recovered ${stuckPrcs.length} stuck PRC documents from PARSING → FAILED`);
  }
}

function jitter(baseMs: number): number {
  const jitterRange = baseMs * 0.2;
  return baseMs + Math.random() * jitterRange - jitterRange / 2;
}

async function processJob(job: typeof jobs.$inferSelect): Promise<void> {
  const payload = job.payload as Record<string, any>;

  switch (job.type) {
    case 'ZOHO_SYNC_SNAPSHOT': {
      if (!isZohoEnabled()) {
        console.log(`[JobRunner] Zoho sync disabled, marking job ${job.id} as success (no-op)`);
        return;
      }
      const zohoLeadId = payload.zohoLeadId as string;
      const dealId = payload.dealId as string;
      if (!zohoLeadId || !dealId) throw new Error('Missing zohoLeadId or dealId in payload');

      const snapshot = await fetchZohoSnapshot(zohoLeadId);
      if (snapshot) {
        const lastContactAt = computeLastContactAcrossTypes(snapshot);

        await db.insert(dealSalesSnapshots).values({
          dealId,
          provider: 'ZOHO',
          lastContactAt,
          nextTaskAt: snapshot.nextTaskAt,
          nextTaskStatus: snapshot.nextTaskAt
            ? (snapshot.nextTaskAt < new Date() ? 'OVERDUE' : 'UPCOMING')
            : 'NONE',
          totalCalls: snapshot.totalCalls,
          totalTasks: snapshot.totalTasks,
          totalNotes: snapshot.totalNotes,
          lastSyncAt: new Date(),
          snapshot: snapshot as any,
        }).onConflictDoUpdate({
          target: dealSalesSnapshots.dealId,
          set: {
            lastContactAt,
            nextTaskAt: snapshot.nextTaskAt,
            nextTaskStatus: snapshot.nextTaskAt
              ? (snapshot.nextTaskAt < new Date() ? 'OVERDUE' : 'UPCOMING')
              : 'NONE',
            totalCalls: snapshot.totalCalls,
            totalTasks: snapshot.totalTasks,
            totalNotes: snapshot.totalNotes,
            lastSyncAt: new Date(),
            snapshot: snapshot as any,
            updatedAt: new Date(),
          },
        });

        await db.update(dealCrmLinks)
          .set({ lastSyncedAt: new Date(), syncStatus: 'SYNCED', updatedAt: new Date() })
          .where(eq(dealCrmLinks.dealId, dealId));
      }
      break;
    }

    case 'ZOHO_CREATE_CALLBACK_TASK': {
      if (!isZohoCallbackTaskEnabled()) {
        console.log(`[JobRunner] Zoho callback task creation disabled, marking job ${job.id} as success (no-op)`);
        return;
      }
      const dealId = payload.dealId as string;
      const zohoLeadId = payload.zohoLeadId as string;
      const companyName = payload.companyName as string;
      const portalDealUrl = payload.portalDealUrl as string;
      const zohoOwnerId = payload.zohoOwnerId as string | undefined;

      if (!dealId || !zohoLeadId) throw new Error('Missing dealId or zohoLeadId in payload');

      const existingLink = await db.select().from(dealZohoTaskLinks)
        .where(and(
          eq(dealZohoTaskLinks.dealId, dealId),
          eq(dealZohoTaskLinks.purpose, 'AUTO_CALLBACK')
        ))
        .limit(1);

      if (existingLink.length > 0) {
        console.log(`[JobRunner] Zoho callback task already exists for deal ${dealId}, skipping`);
        return;
      }

      const callbackTime = computeNextCallbackDateTime(new Date());

      const result = await createZohoCallbackTask({
        zohoLeadId,
        zohoOwnerId,
        companyName: companyName || `Lead ${zohoLeadId}`,
        portalDealId: dealId,
        portalDealUrl: portalDealUrl || '',
        dueDate: callbackTime,
      });

      if (result.success && result.taskId) {
        await db.insert(dealZohoTaskLinks).values({
          dealId,
          zohoTaskId: result.taskId,
          purpose: 'AUTO_CALLBACK',
          status: 'CREATED',
        }).onConflictDoNothing();
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to create Zoho callback task');
      }
      break;
    }

    case 'ZOHO_CREATE_TASK': {
      const dealId = payload.dealId as string;
      const subject = payload.subject as string;
      const dueDate = new Date(payload.dueDate as string);
      const description = payload.description as string | undefined;
      const zohoLeadId = payload.zohoLeadId as string | undefined;

      if (!dealId || !subject) throw new Error('Missing dealId or subject in payload');

      const result = await createZohoTask({
        subject,
        dueDate,
        description,
        zohoLeadId,
      });

      if (result.success && result.taskId) {
        await db.insert(dealZohoTaskLinks).values({
          dealId,
          zohoTaskId: result.taskId,
          purpose: 'MANUAL_TASK',
          status: 'CREATED',
        }).onConflictDoNothing();
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to create Zoho task');
      }
      break;
    }

    case 'INTAKE_COMPLETED_NOTIFICATION': {
      const dealId = payload.dealId as string;
      const trackId = payload.trackId as number;
      const clientName = payload.clientName as string;
      const billsUploaded = payload.billsUploaded as number;
      const lgpdCaptured = payload.lgpdCaptured as boolean;
      const loaCaptured = payload.loaCaptured as boolean;

      try {
        const nodemailer = await import('nodemailer');
        const smtpPass = process.env.SMTP_PASS;
        if (smtpPass) {
          const transporter = nodemailer.createTransport({
            host: "smtp.zoho.com",
            port: 465,
            secure: true,
            auth: { user: "notificacoes@otimaenergia.com", pass: smtpPass },
          });

          const checklist = [
            `Faturas enviadas: ${billsUploaded}`,
            lgpdCaptured ? 'LGPD: Aceito' : 'LGPD: Pendente',
            loaCaptured ? 'LOA: Assinado' : 'LOA: Pendente',
          ].join('\n  ');

          await transporter.sendMail({
            from: '"Ótima Portal" <notificacoes@otimaenergia.com>',
            to: "ops@otimaenergia.com",
            subject: `[Intake Completo] ${clientName || `Deal ${dealId}`} - Track #${trackId}`,
            text: `O cliente ${clientName || dealId} completou o intake no portal.\n\nResumo:\n  ${checklist}\n\nAcesse o portal para revisar os documentos.`,
          });
          console.log(`[JobRunner] Intake completion email sent for deal ${dealId}`);
        }
      } catch (emailErr) {
        console.error(`[JobRunner] Failed to send intake completion email:`, emailErr);
      }
      break;
    }

    case 'PRC_PARSE': {
      const documentId = payload.documentId as number;
      const fileStorageKey = payload.fileStorageKey as string;
      const isImage = payload.isImage as boolean || false;
      const retryCount = (job.attempts || 1) - 1;

      if (!documentId || !fileStorageKey) throw new Error('Missing documentId or fileStorageKey in PRC_PARSE payload');

      console.log(`[JobRunner] PRC_PARSE: downloading file for doc ${documentId} (attempt ${job.attempts}/${job.maxAttempts})`);

      let fileBuffer: Buffer;
      try {
        const objectStorage = new ObjectStorageService();
        fileBuffer = await objectStorage.downloadBuffer(fileStorageKey);
      } catch (downloadErr: any) {
        console.error(`[JobRunner] PRC_PARSE: download failed for doc ${documentId}: ${downloadErr.message}`);
        await db.update(prcDocuments)
          .set({
            parseStatus: 'FAILED',
            parseErrors: [`FILE_DOWNLOAD_ERROR: ${downloadErr.message}`],
            parseCompletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(prcDocuments.id, documentId));
        throw downloadErr;
      }

      console.log(`[JobRunner] PRC_PARSE: file downloaded (${fileBuffer.length} bytes)`);

      if (isParserServiceConfigured()) {
        console.log(`[JobRunner] PRC_PARSE: using VPS parser service`);
        await db.update(prcDocuments)
          .set({ parseStatus: 'PARSING', parseStartedAt: new Date(), updatedAt: new Date() })
          .where(eq(prcDocuments.id, documentId));

        try {
          const doc = await db.select().from(prcDocuments).where(eq(prcDocuments.id, documentId)).limit(1);
          const supplierRow = doc[0]?.supplierId
            ? await db.select().from(suppliers).where(eq(suppliers.id, doc[0].supplierId)).limit(1)
            : [];

          const result = await callParserService(fileBuffer, doc[0]?.originalFilename || 'document.pdf', {
            sourceDocId: String(documentId),
            hintSupplier: supplierRow[0]?.name,
            hintDocType: 'PRC',
          });

          const SUBMARKET_MAP: Record<string, string> = {
            'SE/CO': 'SE_CO', 'SECO': 'SE_CO', 'SE': 'SE_CO', 'CO': 'SE_CO',
            'SUDESTE': 'SE_CO', 'SUDESTE/CENTRO-OESTE': 'SE_CO', 'SE_CO': 'SE_CO',
            'CENTRO-OESTE': 'SE_CO', 'CENTRO OESTE': 'SE_CO',
            'S': 'S', 'SUL': 'S',
            'NE': 'NE', 'NNE': 'NE', 'NORDESTE': 'NE',
            'N': 'N', 'NORTE': 'N',
          };
          const validSubmarkets = ['SE_CO', 'S', 'NE', 'N'];

          function normalizeVpsPrice(raw: any): { price: number | null; rawText: string; rejectReason: string | null } {
            const rawText = String(raw ?? '');
            if (typeof raw === 'number' && !isNaN(raw) && raw > 0) {
              return { price: raw, rawText, rejectReason: null };
            }
            let cleaned = rawText.replace(/\s/g, '').replace(/%/g, '').replace(/R\$/gi, '');
            if (/^\-?\d{1,3}(\.\d{3})+(,\d{1,4})?$/.test(cleaned)) {
              cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            } else if (/^\-?\d+(,\d{1,4})$/.test(cleaned)) {
              cleaned = cleaned.replace(',', '.');
            }
            const val = parseFloat(cleaned);
            if (isNaN(val) || val <= 0) return { price: null, rawText, rejectReason: 'BAD_NUMBER' };
            return { price: val, rawText, rejectReason: null };
          }

          const TERM_MAP: Record<string, number> = {
            'ANUAL': 12, 'ANNUAL': 12, '1 ANO': 12, '12': 12,
            'TRIANUAL': 36, 'TRIENNIAL': 36, '3 ANOS': 36, '36': 36,
            'QUINQUENAL': 60, 'FIVE-YEAR': 60, '5 ANOS': 60, '60': 60,
            'BIANUAL': 24, 'BIENNIAL': 24, '2 ANOS': 24, '24': 24,
          };

          function resolveTermMonths(row: any): number | null {
            if (row.termMonths && typeof row.termMonths === 'number' && row.termMonths > 0) return row.termMonths;
            const rawTerm = String(row.termMonths || row.term || row.period || '').toUpperCase().trim();
            if (TERM_MAP[rawTerm]) return TERM_MAP[rawTerm];
            const yearMatch = rawTerm.match(/(\d{4})\s*[-–]\s*(\d{4})/);
            if (yearMatch) {
              const years = parseInt(yearMatch[2]) - parseInt(yearMatch[1]);
              if (years > 0 && years <= 10) return years * 12;
            }
            const numMatch = rawTerm.match(/^(\d+)$/);
            if (numMatch) {
              const n = parseInt(numMatch[1]);
              if (n >= 1 && n <= 120) return n;
            }
            return null;
          }

          const PRODUCT_MAP: Record<string, string> = {
            'CONVENCIONAL': 'CONVENCIONAL', 'CONV': 'CONVENCIONAL', 'CONVENTIONAL': 'CONVENCIONAL',
            'ENERGIA CONVENCIONAL': 'CONVENCIONAL',
            'INCENTIVADA 50%': 'INC_I50', 'INCENTIVADA 50': 'INC_I50', 'INC_I50': 'INC_I50',
            'INCENTIVADA_50': 'INC_I50', 'INCENTIVADA_50%': 'INC_I50',
            'I50': 'INC_I50', '50%': 'INC_I50', 'INC 50': 'INC_I50',
            'ENERGIA INCENTIVADA 50%': 'INC_I50', 'ENERGIA INCENTIVADA 50': 'INC_I50',
            'INCENTIVADA ESPECIAL': 'INC_I50',
            'INCENTIVADA 100%': 'INC_I100', 'INCENTIVADA 100': 'INC_I100', 'INC_I100': 'INC_I100',
            'INCENTIVADA_100': 'INC_I100', 'INCENTIVADA_100%': 'INC_I100',
            'I100': 'INC_I100', '100%': 'INC_I100', 'INC 100': 'INC_I100',
            'ENERGIA INCENTIVADA 100%': 'INC_I100', 'ENERGIA INCENTIVADA 100': 'INC_I100',
            'INC_I0': 'INC_I100', 'I0': 'INC_I100',
          };
          const validProducts = ['CONVENCIONAL', 'INC_I50', 'INC_I100'];

          const insertedPrcRows = [];
          const rejectReasons: Record<string, number> = {};
          let rowsRejected = 0;

          console.log(`[PRC_PARSE] VPS parser returned ${result.rows.length} rows, first row sample:`, result.rows[0] ? JSON.stringify(result.rows[0]) : 'none');

          for (const row of result.rows) {
            const { price, rawText, rejectReason: priceReject } = normalizeVpsPrice(row.price);
            const rawSm = String(row.submarket || '').toUpperCase().trim();
            const submarket = SUBMARKET_MAP[rawSm] || rawSm;
            const smValid = validSubmarkets.includes(submarket);

            if (priceReject) {
              rejectReasons[priceReject] = (rejectReasons[priceReject] || 0) + 1;
              rowsRejected++;
              console.log(`[PRC_PARSE] Rejected row: rawPrice=${JSON.stringify(row.price)} (type=${typeof row.price}) parsed=${price} reason=${priceReject} submarket=${rawSm}`);
              continue;
            }
            if (!smValid) {
              rejectReasons['MISSING_ZONE'] = (rejectReasons['MISSING_ZONE'] || 0) + 1;
              rowsRejected++;
              console.log(`[PRC_PARSE] Rejected row: submarket=${rawSm} (unmapped)`);
              continue;
            }

            const rawProduct = String(row.product || '').toUpperCase().trim();
            if (rawProduct === 'INCENTIVADA') {
              rejectReasons['AMBIGUOUS_PRODUCT'] = (rejectReasons['AMBIGUOUS_PRODUCT'] || 0) + 1;
              rowsRejected++;
              console.log(`[PRC_PARSE] Rejected row: product=${rawProduct} (bare Incentivada without 50/100)`);
              continue;
            }
            const productType = PRODUCT_MAP[rawProduct] || rawProduct || 'CONVENCIONAL';
            if (!validProducts.includes(productType)) {
              rejectReasons['INVALID_PRODUCT'] = (rejectReasons['INVALID_PRODUCT'] || 0) + 1;
              rowsRejected++;
              console.log(`[PRC_PARSE] Rejected row: product=${rawProduct} → ${productType} (unmapped)`);
              continue;
            }

            const termMonths = resolveTermMonths(row);

            const rawYear = row.year != null ? parseInt(String(row.year)) : null;
            const priceYear = rawYear && rawYear >= 2020 && rawYear <= 2040 ? rawYear : null;

            const inserted = await db.insert(prcRows).values({
              prcDocumentId: documentId,
              supplierId: doc[0].supplierId,
              referenceMonth: result.data?.referenceMonth || doc[0].referenceMonth,
              submarket,
              productType,
              termMonths: termMonths,
              priceYear,
              priceRPerMWh: String(price),
              confidence: Math.round(((row.confidence || result.confidence) > 1 ? (row.confidence || result.confidence) : (row.confidence || result.confidence) * 100)),
              isOutlierFlag: false,
              outlierReason: null,
              rawSnippet: `${rawSm} ${row.product} ${row.termMonths || row.term || row.period || ''}: R$${price}/MWh`,
            }).returning();
            insertedPrcRows.push(inserted[0]);
            console.log(`[PRC_PARSE] Accepted row: ${submarket}/${productType} ${termMonths || '?'}m = R$${price}/MWh`);
          }

          console.log(`[PRC_PARSE] VPS results: ${result.rows.length} raw, ${insertedPrcRows.length} accepted, ${rowsRejected} rejected, reasons=${JSON.stringify(rejectReasons)}`);

          if (doc[0]?.supplierId && result.data?.referenceMonth) {
            for (const prcRow of insertedPrcRows) {
              await db.insert(canonicalPricingRows).values({
                source: 'prc',
                sourceId: prcRow.id,
                supplierId: doc[0].supplierId,
                referenceMonth: result.data.referenceMonth,
                submarket: prcRow.submarket || 'UNKNOWN',
                productType: prcRow.productType || 'CONVENCIONAL',
                termMonths: prcRow.termMonths,
                priceRPerMWh: prcRow.priceRPerMWh,
                currency: 'BRL',
                confidence: prcRow.confidence || 0,
                isOutlierFlag: prcRow.isOutlierFlag || false,
              }).onConflictDoNothing();
            }
          }

          const countsBySubmarket: Record<string, number> = {};
          for (const r of insertedPrcRows) {
            countsBySubmarket[r.submarket] = (countsBySubmarket[r.submarket] || 0) + 1;
          }

          const countsByProduct: Record<string, number> = {};
          for (const r of insertedPrcRows) {
            countsByProduct[r.productType] = (countsByProduct[r.productType] || 0) + 1;
          }

          const parseStats = {
            rawRowsFromParser: result.rows.length,
            rowsAccepted: insertedPrcRows.length,
            rowsRejected,
            rejectReasons,
            countsBySubmarket,
            countsByProduct,
            exampleParsedRows: insertedPrcRows.slice(0, 5).map(r => ({
              submarket: r.submarket, product: r.productType, termMonths: r.termMonths,
              price: r.priceRPerMWh, confidence: r.confidence, outlier: r.isOutlierFlag,
            })),
            ...(result.debug || {}),
          };

          const finalStatus = insertedPrcRows.length > 0
            ? (insertedPrcRows.length >= 12 ? 'PARSED' : 'NEEDS_REVIEW')
            : 'FAILED';

          await db.update(prcDocuments)
            .set({
              parseStatus: finalStatus,
              parseConfidence: Math.round(result.confidence > 1 ? result.confidence : result.confidence * 100),
              parseErrors: rowsRejected > 0 ? [`${rowsRejected} rows rejected: ${JSON.stringify(rejectReasons)}`] : null,
              rawExtractedText: result.debug?.chosenText?.substring(0, 5000) || null,
              parseDebugJson: parseStats as any,
              rowsExtracted: insertedPrcRows.length,
              rowsFlagged: insertedPrcRows.filter(r => r.isOutlierFlag).length,
              parseCompletedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(prcDocuments.id, documentId));

          console.log(`[JobRunner] PRC_PARSE: VPS parser returned ${insertedPrcRows.length} rows, validated=${result.validated}`);
        } catch (parserErr: any) {
          console.error(`[JobRunner] PRC_PARSE: VPS parser failed for doc ${documentId}: ${parserErr.message}`);
          const allowLocalFallback = process.env.ALLOW_LOCAL_PARSER_FALLBACK === 'true';
          if (allowLocalFallback) {
            console.log(`[JobRunner] PRC_PARSE: falling back to local parser (ALLOW_LOCAL_PARSER_FALLBACK=true)`);
            await processPrcDocumentWithBuffer(documentId, fileBuffer, isImage, retryCount);
          } else {
            await db.update(prcDocuments)
              .set({
                parseStatus: 'FAILED',
                parseErrors: [`VPS_PARSER_ERROR: ${parserErr.message}`],
                parseCompletedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(prcDocuments.id, documentId));
            throw parserErr;
          }
        }
      } else {
        console.log(`[JobRunner] PRC_PARSE: using local parser (VPS not configured)`);
        await processPrcDocumentWithBuffer(documentId, fileBuffer, isImage, retryCount);
      }

      console.log(`[JobRunner] PRC_PARSE: doc ${documentId} processing completed`);
      break;
    }

    case 'BILL_PARSE': {
      const billId = payload.billId as number;
      const fileStorageKey = payload.fileStorageKey as string;

      if (!billId || !fileStorageKey) throw new Error('Missing billId or fileStorageKey in BILL_PARSE payload');

      console.log(`[JobRunner] BILL_PARSE: processing bill ${billId}`);

      await db.update(billsExtracted)
        .set({ parseStatus: 'PARSING', updatedAt: new Date() })
        .where(eq(billsExtracted.id, billId));

      if (!isParserServiceConfigured()) {
        await db.update(billsExtracted)
          .set({
            parseStatus: 'FAILED',
            parseErrors: ['PARSER_NOT_CONFIGURED: VPS parser service URL not set'],
            updatedAt: new Date(),
          })
          .where(eq(billsExtracted.id, billId));
        throw new Error('Parser service not configured for bill parsing');
      }

      let fileBuffer: Buffer;
      try {
        const objectStorage = new ObjectStorageService();
        fileBuffer = await objectStorage.downloadBuffer(fileStorageKey);
      } catch (downloadErr: any) {
        await db.update(billsExtracted)
          .set({
            parseStatus: 'FAILED',
            parseErrors: [`FILE_DOWNLOAD_ERROR: ${downloadErr.message}`],
            updatedAt: new Date(),
          })
          .where(eq(billsExtracted.id, billId));
        throw downloadErr;
      }

      try {
        const result = await callParserService(fileBuffer, 'bill.pdf', {
          sourceDocId: String(billId),
          hintDocType: 'BILL',
        });

        const d = result.data || {};
        const tariffGroup = d.tariffGroup || null;
        let grupo: string | null = null;
        let subgrupo: string | null = null;
        if (tariffGroup) {
          const tg = tariffGroup.toUpperCase().trim();
          if (tg.startsWith('A')) { grupo = 'A'; subgrupo = tg; }
          else if (tg.startsWith('B')) { grupo = 'B'; subgrupo = tg; }
        }

        let docKind = d.docKind || null;
        if (!docKind) {
          if (result.docType === 'BILL') {
            const fname = (payload.originalFilename || '').toUpperCase();
            const chosenText = (result.debug?.chosenText || '').toUpperCase();
            if (fname.includes('HISTORICO') || fname.includes('CONSUMO') || chosenText.includes('HISTÓRICO DE CONSUMO') || chosenText.includes('HISTORICO DE CONSUMO')) {
              docKind = 'CONSUMPTION_HISTORY';
            } else if (fname.includes('NF3E') || fname.includes('NOTA FISCAL')) {
              docKind = 'NF3E';
            } else if (fname.includes('DEMONSTRATIVO')) {
              docKind = 'DEMONSTRATIVO';
            } else {
              docKind = 'STANDARD_BILL';
            }
          }
        }
        const ucCode = d.ucCode || d.uc || d.unidadeConsumidora || null;
        const fieldConfidence = d.fieldConfidence || null;
        const fieldReasons = d.fieldReasons || null;

        await db.update(billsExtracted)
          .set({
            parseStatus: result.validated ? 'PARSED' : 'FAILED',
            parseConfidence: Math.round(result.confidence > 1 ? result.confidence : result.confidence * 100),
            distributor: d.distributor || null,
            referenceMonth: d.referenceMonth || null,
            dueDate: d.dueDate || null,
            totalAmount: d.totalAmount ? String(d.totalAmount) : null,
            totalEnergyKwh: d.totalEnergyKwh ? String(d.totalEnergyKwh) : null,
            customerName: d.customerName || null,
            customerId: d.customerId || null,
            tariffGroup,
            invoiceKey: d.invoiceKey || null,
            docKind,
            ucCode,
            endereco: d.endereco || d.address || null,
            grupo,
            subgrupo,
            modalidade: d.modalidade || d.tariffModality || null,
            consumoPontaKwh: d.consumoPonta != null ? String(d.consumoPonta) : (d.consumoPontaKwh != null ? String(d.consumoPontaKwh) : null),
            consumoForaPontaKwh: d.consumoForaPonta != null ? String(d.consumoForaPonta) : (d.consumoForaPontaKwh != null ? String(d.consumoForaPontaKwh) : null),
            demandaContratadaKw: d.demandaContratada != null ? String(d.demandaContratada) : (d.demandaContratadaKw != null ? String(d.demandaContratadaKw) : null),
            demandaMedidaKw: d.demandaMedida != null ? String(d.demandaMedida) : (d.demandaMedidaKw != null ? String(d.demandaMedidaKw) : null),
            fieldConfidence: fieldConfidence as any,
            fieldReasons: fieldReasons as any,
            validated: result.validated,
            parseErrors: result.status === 'failed' ? result.warnings : null,
            parseWarnings: result.warnings?.length > 0 ? result.warnings : null,
            parseDebugJson: result.debug as any,
            rawExtractedText: result.debug?.chosenText?.substring(0, 5000) || null,
            textSource: result.debug?.textSource || null,
            parsedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(billsExtracted.id, billId));

        console.log(`[JobRunner] BILL_PARSE: bill ${billId} parsed, validated=${result.validated}`);
      } catch (parserErr: any) {
        const errorDetail = parserErr.message || 'Unknown error';
        const causeDetail = parserErr.cause ? ` | cause: ${parserErr.cause.code || parserErr.cause.message || JSON.stringify(parserErr.cause)}` : '';
        const fullError = `PARSER_ERROR: ${errorDetail}${causeDetail}`;
        console.error(`[JobRunner] BILL_PARSE: parse failed for bill ${billId}: ${fullError}`);
        await db.update(billsExtracted)
          .set({
            parseStatus: 'FAILED',
            parseErrors: [fullError],
            updatedAt: new Date(),
          })
          .where(eq(billsExtracted.id, billId));
        throw parserErr;
      }
      break;
    }

    case 'INTAKE_REMINDER': {
      const sessionToken = payload.sessionToken as string;
      const clientEmail = payload.clientEmail as string;
      const clientName = payload.clientName as string;
      const portalUrl = payload.portalUrl as string;

      if (!clientEmail) {
        console.log(`[JobRunner] No client email for intake reminder, skipping`);
        return;
      }

      try {
        const nodemailer = await import('nodemailer');
        const smtpPass = process.env.SMTP_PASS;
        if (smtpPass) {
          const transporter = nodemailer.createTransport({
            host: "smtp.zoho.com",
            port: 465,
            secure: true,
            auth: { user: "notificacoes@otimaenergia.com", pass: smtpPass },
          });

          await transporter.sendMail({
            from: '"Ótima Energia" <notificacoes@otimaenergia.com>',
            to: clientEmail,
            subject: `Lembrete: Complete seu cadastro - Ótima Energia`,
            text: `Olá ${clientName || ''},\n\nNotamos que seu cadastro no portal da Ótima Energia ainda não foi finalizado.\n\nPara continuar, acesse: ${portalUrl}\n\nSe precisar de ajuda, entre em contato conosco.\n\nAtenciosamente,\nEquipe Ótima Energia`,
          });
          console.log(`[JobRunner] Intake reminder email sent to ${clientEmail}`);
        }
      } catch (emailErr) {
        console.error(`[JobRunner] Failed to send intake reminder email:`, emailErr);
      }
      break;
    }

    default:
      console.warn(`[JobRunner] Unknown job type: ${job.type}`);
  }
}

function computeLastContactAcrossTypes(snapshot: any): Date | null {
  const dates: Date[] = [];

  if (snapshot.lastContactAt) dates.push(new Date(snapshot.lastContactAt));

  for (const call of snapshot.calls || []) {
    if (call.callStartTime) dates.push(new Date(call.callStartTime));
  }
  for (const note of snapshot.notes || []) {
    if (note.createdTime) dates.push(new Date(note.createdTime));
  }
  for (const task of snapshot.tasks || []) {
    if (task.dueDate) dates.push(new Date(task.dueDate));
  }

  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map(d => d.getTime())));
}

async function pollJobs(): Promise<void> {
  if (!isRunning) return;

  try {
    await recoverStuckJobs();
    await checkIncompleteIntakes();

    const claimedJobs = await db.execute(sql`
      UPDATE jobs
      SET status = 'RUNNING', attempts = COALESCE(attempts, 0) + 1, updated_at = NOW()
      WHERE id IN (
        SELECT id FROM jobs
        WHERE status = 'PENDING' AND next_run_at <= NOW()
        ORDER BY next_run_at ASC
        LIMIT ${MAX_CONCURRENT_JOBS}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `);

    const jobRows = (claimedJobs as any).rows || claimedJobs || [];

    for (const row of jobRows) {
      const job = {
        id: row.id,
        type: row.type,
        payload: row.payload,
        status: row.status,
        attempts: row.attempts,
        maxAttempts: row.max_attempts,
        nextRunAt: row.next_run_at,
        lastError: row.last_error,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      } as typeof jobs.$inferSelect;

      try {
        await processJob(job);

        await db.update(jobs).set({
          status: 'SUCCESS',
          completedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(jobs.id, job.id));

        console.log(`[JobRunner] Job ${job.id} (${job.type}) completed successfully`);
      } catch (error: any) {
        const attempts = job.attempts || 1;
        const maxAttempts = job.maxAttempts || 5;
        const isFinalAttempt = attempts >= maxAttempts;

        const baseBackoffMs = Math.min(Math.pow(2, attempts) * 60000, 3600000);
        const backoffMs = jitter(baseBackoffMs);
        const nextRunAt = new Date(Date.now() + backoffMs);

        await db.update(jobs).set({
          status: isFinalAttempt ? 'FAILED' : 'PENDING',
          lastError: error.message || 'Unknown error',
          nextRunAt: isFinalAttempt ? undefined : nextRunAt,
          updatedAt: new Date(),
        }).where(eq(jobs.id, job.id));

        console.error(`[JobRunner] Job ${job.id} (${job.type}) failed (attempt ${attempts}/${maxAttempts}): ${error.message}`);
      }
    }
  } catch (error: any) {
    console.error('[JobRunner] Poll error:', error.message);
  }
}

let lastChaseCheckAt = 0;
const CHASE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

async function checkIncompleteIntakes(): Promise<void> {
  const now = Date.now();
  if (now - lastChaseCheckAt < CHASE_CHECK_INTERVAL_MS) return;
  lastChaseCheckAt = now;

  try {
    const cutoff = new Date(now - 48 * 60 * 60 * 1000);
    const staleIntakes = await db.select({
      sessionId: uploadSessions.id,
      dealId: uploadSessions.dealId,
      trackId: uploadSessions.trackId,
      clientId: uploadSessions.clientId,
      token: uploadSessions.token,
      createdAt: uploadSessions.createdAt,
    })
      .from(uploadSessions)
      .where(and(
        isNull(uploadSessions.usedAt),
        isNotNull(uploadSessions.dealId),
        isNotNull(uploadSessions.trackId),
        eq(uploadSessions.intakeType, 'full_intake'),
        lte(uploadSessions.createdAt, cutoff),
      ))
      .limit(20);

    for (const intake of staleIntakes) {
      if (!intake.dealId || !intake.trackId) continue;

      const idempotencyKey = `chase_intake_${intake.dealId}_${intake.trackId}`;
      const existing = await db.select().from(jobs)
        .where(and(
          eq(jobs.type, 'ZOHO_CREATE_TASK'),
          sql`${jobs.payload}->>'idempotencyKey' = ${idempotencyKey}`,
        ))
        .limit(1);

      if (existing.length > 0) continue;

      let companyName = '';
      if (intake.clientId) {
        const clientRows = await db.select({ companyName: clients.companyName })
          .from(clients)
          .where(eq(clients.id, intake.clientId))
          .limit(1);
        companyName = clientRows[0]?.companyName || '';
      }

      const dueDate = computeNextCallbackDateTime(new Date());
      await enqueueJob('ZOHO_CREATE_TASK', {
        dealId: intake.dealId,
        subject: `Chase intake documents – ${companyName || `Deal ${intake.dealId}`}`,
        dueDate: dueDate.toISOString(),
        description: `Intake session created ${new Date(intake.createdAt).toLocaleDateString('pt-BR')} is still incomplete after 48+ hours. Track #${intake.trackId}. Follow up with client.`,
        idempotencyKey,
      });

      console.log(`[JobRunner] Enqueued chase task for deal ${intake.dealId} track ${intake.trackId}`);
    }
  } catch (error: any) {
    console.error('[JobRunner] Chase check error:', error.message);
  }
}

export function startJobRunner(): void {
  if (isRunning) {
    console.log('[JobRunner] Already running');
    return;
  }
  isRunning = true;
  console.log(`[JobRunner] Started, polling every ${POLL_INTERVAL_MS}ms`);
  pollTimer = setInterval(pollJobs, POLL_INTERVAL_MS);
  setTimeout(pollJobs, 5000);
}

export function stopJobRunner(): void {
  isRunning = false;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  console.log('[JobRunner] Stopped');
}
