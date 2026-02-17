import { db } from "./db";
import { jobs, dealZohoTaskLinks } from "@shared/schema";
import { eq, and, lte, sql, or } from "drizzle-orm";
import { computeNextCallbackDateTime } from "./scheduler";
import { fetchZohoSnapshot, createZohoCallbackTask, createZohoTask, isZohoEnabled, isZohoCallbackTaskEnabled } from "./zohoClient";
import { dealCrmLinks, dealSalesSnapshots, dealSalesActivityItems, deals } from "@shared/schema";

const POLL_INTERVAL_MS = parseInt(process.env.JOB_POLL_INTERVAL_MS || '30000', 10);
const MAX_CONCURRENT_JOBS = 3;
const STUCK_JOB_TIMEOUT_MS = 10 * 60 * 1000;

let isRunning = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;

export async function enqueueJob(type: string, payload: Record<string, any>, nextRunAt?: Date): Promise<number> {
  const result = await db.insert(jobs).values({
    type,
    payload,
    status: 'PENDING',
    attempts: 0,
    maxAttempts: 5,
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
