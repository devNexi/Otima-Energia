import { createHash } from "crypto";
import type { InsertAdminAuditLog, AdminAuditLog, AuditActionType } from "@shared/schema";
import { db } from "./db";
import { adminAuditLog } from "@shared/schema";
import { desc, sql } from "drizzle-orm";

// Sensitive patterns to redact from audit log details
const SENSITIVE_PATTERNS = [
  /token[s]?[:=]["']?[A-Za-z0-9._-]+["']?/gi,
  /password[:=]["']?[^"'\s]+["']?/gi,
  /secret[:=]["']?[^"'\s]+["']?/gi,
  /api[_-]?key[:=]["']?[^"'\s]+["']?/gi,
  /bearer\s+[A-Za-z0-9._-]+/gi,
  /authorization[:=]["']?[^"'\s]+["']?/gi,
  /credential[s]?[:=]["']?[^"'\s]+["']?/gi,
  /session[_-]?id[:=]["']?[^"'\s]+["']?/gi,
  /access[_-]?code[:=]["']?[^"'\s]+["']?/gi,
  /portal[_-]?token[:=]["']?[^"'\s]+["']?/gi,
];

/**
 * Redact sensitive data from details object before storing
 */
export function redactSensitiveData(details: Record<string, any> | null | undefined): Record<string, any> | null {
  if (!details) return null;
  
  const redactValue = (value: any): any => {
    if (typeof value === "string") {
      let redacted = value;
      for (const pattern of SENSITIVE_PATTERNS) {
        redacted = redacted.replace(pattern, "[REDACTED]");
      }
      return redacted;
    }
    if (Array.isArray(value)) {
      return value.map(redactValue);
    }
    if (typeof value === "object" && value !== null) {
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        // Redact entire value for sensitive keys
        const lowerKey = k.toLowerCase();
        if (
          lowerKey.includes("token") ||
          lowerKey.includes("password") ||
          lowerKey.includes("secret") ||
          lowerKey.includes("credential") ||
          lowerKey.includes("apikey") ||
          lowerKey.includes("api_key")
        ) {
          result[k] = "[REDACTED]";
        } else {
          result[k] = redactValue(v);
        }
      }
      return result;
    }
    return value;
  };
  
  return redactValue(details);
}

/**
 * Canonicalize JSON for consistent hashing
 */
function canonicalJson(obj: any): string {
  if (obj === null || obj === undefined) return "null";
  if (typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalJson).join(",") + "]";
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(k => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`);
  return "{" + pairs.join(",") + "}";
}

/**
 * Generate SHA-256 hash for an audit event
 */
export function generateEventHash(
  timestamp: Date,
  actor: string,
  action: string,
  entityType: string | null,
  entityId: number | null,
  details: Record<string, any> | null,
  prevEventHash: string | null
): string {
  const hashInput = [
    timestamp.toISOString(),
    actor,
    action,
    entityType || "",
    entityId?.toString() || "",
    canonicalJson(details),
    prevEventHash || ""
  ].join("|");
  
  return createHash("sha256").update(hashInput).digest("hex");
}

/**
 * Get the previous event hash for chain continuity with row lock
 */
async function getPreviousEventHashWithLock(tx: typeof db): Promise<string | null> {
  const [lastEvent] = await tx
    .select({ eventHash: adminAuditLog.eventHash })
    .from(adminAuditLog)
    .orderBy(desc(adminAuditLog.id))
    .limit(1);
  
  return lastEvent?.eventHash || null;
}

/**
 * Log an audit event with hash chain
 * Uses transaction with advisory lock to prevent concurrent writes from breaking the chain
 */
export async function logAuditEvent(
  log: InsertAdminAuditLog & { 
    clientId?: number | null;
    dealId?: string | null;
    actorRole?: string | null;
    userAgent?: string | null;
  }
): Promise<AdminAuditLog> {
  const timestamp = new Date();
  
  // Redact sensitive data before entering transaction
  const redactedDetails = redactSensitiveData(log.detailsJson as Record<string, any>);
  
  // Use transaction to ensure atomicity of prev hash read + insert
  return await db.transaction(async (tx) => {
    // Acquire advisory lock for audit log writes (key: 1 for audit log)
    await tx.execute(sql`SELECT pg_advisory_xact_lock(1)`);
    
    // Get previous hash within the transaction (after lock acquired)
    const prevEventHash = await getPreviousEventHashWithLock(tx);
    
    // Generate event hash
    const eventHash = generateEventHash(
      timestamp,
      log.actor,
      log.action,
      log.entityType || null,
      log.entityId || null,
      redactedDetails,
      prevEventHash
    );
    
    const result = await tx.insert(adminAuditLog).values({
      actor: log.actor,
      actorRole: log.actorRole || null,
      actorIp: log.actorIp || null,
      userAgent: log.userAgent || null,
      action: log.action,
      entityType: log.entityType || null,
      entityId: log.entityId || null,
      clientId: log.clientId || null,
      dealId: log.dealId || null,
      detailsJson: redactedDetails,
      eventHash,
      prevEventHash,
      timestamp,
    }).returning();
    
    return result[0];
  });
}

/**
 * Verify hash chain integrity for a date range
 */
export async function verifyHashChain(
  dateFrom?: Date,
  dateTo?: Date
): Promise<{
  verified: boolean;
  totalEvents: number;
  checkedEvents: number;
  brokenAt?: { id: number; timestamp: Date; expectedHash: string; actualHash: string };
  message: string;
}> {
  // Get all events in the range, ordered by ID
  let events: AdminAuditLog[];
  
  // Fetch all events and filter in memory for simplicity
  const allEvents = await db.select().from(adminAuditLog).orderBy(adminAuditLog.id);
  
  if (dateFrom || dateTo) {
    events = allEvents.filter(e => {
      if (dateFrom && new Date(e.timestamp) < dateFrom) return false;
      if (dateTo && new Date(e.timestamp) > dateTo) return false;
      return true;
    });
  } else {
    events = allEvents;
  }
  
  if (events.length === 0) {
    return {
      verified: true,
      totalEvents: 0,
      checkedEvents: 0,
      message: "No events to verify in the specified range"
    };
  }
  
  // Track the previous hash as we verify
  let prevHash: string | null = null;
  let checkedCount = 0;
  
  // For the first event in our range, get its prevEventHash from DB
  if (events.length > 0 && events[0].prevEventHash) {
    prevHash = events[0].prevEventHash;
  }
  
  for (const event of events) {
    // Skip events that don't have hashes (legacy data)
    if (!event.eventHash) {
      prevHash = null;
      continue;
    }
    
    // Verify the previous hash matches
    if (event.prevEventHash !== prevHash) {
      return {
        verified: false,
        totalEvents: events.length,
        checkedEvents: checkedCount,
        brokenAt: {
          id: event.id,
          timestamp: event.timestamp,
          expectedHash: prevHash || "(null)",
          actualHash: event.prevEventHash || "(null)"
        },
        message: `Hash chain broken at event ID ${event.id}: prevEventHash mismatch`
      };
    }
    
    // Recalculate and verify the event hash
    const expectedHash = generateEventHash(
      event.timestamp,
      event.actor,
      event.action,
      event.entityType,
      event.entityId,
      event.detailsJson as Record<string, any>,
      event.prevEventHash
    );
    
    if (event.eventHash !== expectedHash) {
      return {
        verified: false,
        totalEvents: events.length,
        checkedEvents: checkedCount,
        brokenAt: {
          id: event.id,
          timestamp: event.timestamp,
          expectedHash,
          actualHash: event.eventHash
        },
        message: `Hash chain broken at event ID ${event.id}: eventHash mismatch (possible tampering)`
      };
    }
    
    prevHash = event.eventHash;
    checkedCount++;
  }
  
  return {
    verified: true,
    totalEvents: events.length,
    checkedEvents: checkedCount,
    message: `All ${checkedCount} events verified successfully`
  };
}
