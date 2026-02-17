import { db } from "./db";
import { jobs } from "@shared/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { computeNextCallbackDateTime } from "./scheduler";
import { fetchZohoSnapshot, createZohoCallbackTask, isZohoEnabled, isZohoCallbackTaskEnabled } from "./zohoClient";
import { dealCrmLinks, dealSalesSnapshots, deals } from "@shared/schema";

const POLL_INTERVAL_MS = parseInt(process.env.JOB_POLL_INTERVAL_MS || '30000', 10);
const MAX_CONCURRENT_JOBS = 3;

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
        await db.insert(dealSalesSnapshots).values({
          dealId,
          provider: 'ZOHO',
          lastContactAt: snapshot.lastContactAt,
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
            lastContactAt: snapshot.lastContactAt,
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

      const callbackTime = computeNextCallbackDateTime(new Date());

      const result = await createZohoCallbackTask({
        zohoLeadId,
        zohoOwnerId,
        companyName: companyName || `Lead ${zohoLeadId}`,
        portalDealId: dealId,
        portalDealUrl: portalDealUrl || '',
        dueDate: callbackTime,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create Zoho callback task');
      }
      break;
    }

    default:
      console.warn(`[JobRunner] Unknown job type: ${job.type}`);
  }
}

async function pollJobs(): Promise<void> {
  if (!isRunning) return;

  try {
    const pendingJobs = await db.select().from(jobs)
      .where(and(
        eq(jobs.status, 'PENDING'),
        lte(jobs.nextRunAt, new Date())
      ))
      .limit(MAX_CONCURRENT_JOBS);

    for (const job of pendingJobs) {
      try {
        await db.update(jobs).set({
          status: 'RUNNING',
          attempts: (job.attempts || 0) + 1,
          updatedAt: new Date(),
        }).where(eq(jobs.id, job.id));

        await processJob(job);

        await db.update(jobs).set({
          status: 'SUCCESS',
          completedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(jobs.id, job.id));

        console.log(`[JobRunner] Job ${job.id} (${job.type}) completed successfully`);
      } catch (error: any) {
        const attempts = (job.attempts || 0) + 1;
        const maxAttempts = job.maxAttempts || 5;
        const isFinalAttempt = attempts >= maxAttempts;

        const backoffMs = Math.min(Math.pow(2, attempts) * 60000, 3600000);
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
