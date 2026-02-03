import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { sql, eq, and, or, ilike } from "drizzle-orm";
import { 
  insertLeadSchema, 
  insertClientSchema, 
  insertConsumptionProfileSchema,
  insertQuoteRequestSchema,
  insertSupplierQuoteSchema,
  insertRfoRequestSchema,
  insertRfoSupplierTrackingSchema,
  insertSupplierContactSchema,
  insertProposalSchema,
  insertClientContractSchema,
  insertMarketPriceBenchmarkSchema,
  insertEcosSettingsSchema,
  insertEcosDecisionLogSchema,
  insertQuarterlyReportSchema,
  insertLeadEcosSnapshotSchema,
  insertDealSchema,
  insertDealQuoteSchema,
  insertDealCommissionEventSchema,
  insertDealDocumentSchema,
  insertDealCommissionTermsSnapshotSchema,
  insertDealDisputeSchema,
  insertDealChecklistRequirementSchema,
  insertSupplierSlaTrackingSchema,
  insertClientUsagePeriodSchema,
  insertSupplierPlaybookSchema,
  insertSupplierReportImportSchema,
  insertCommissionReconciliationRunSchema,
  insertCommissionReconciliationLineSchema,
  insertDealCaseSchema,
  insertDealProposalSchema,
  insertDealProposalItemSchema,
  insertDealProposalSnapshotSchema,
  insertDealProposalViewSchema,
  insertBrandKitSchema,
  zohoIntakeEvents,
  zohoIntakeErrors,
  clients,
  deals,
  dealCommissionEvents,
  invoices,
  DEAL_STATES,
  DEAL_STATE_TRANSITIONS,
  type DealState
} from "@shared/schema";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import multer from "multer";
import { processBillFile } from "./ocrService";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { evaluateClient, evaluateAllClients, getClientEcosStatus } from "./ecos-engine";
import { logAuditEvent } from "./audit";
import { seedDemoData, nukeDemoData, getDemoDataStats, getDemoDeals, getDemoProposals, getDemoEcosSnapshots, SCENARIO_PACK_LABELS, type ScenarioPack } from "./demoSeeder";
import { seedOpsPlaybooks } from "./opsPlaybooksSeeder";
import { seedDictionaryTerms } from "./dictionarySeeder";
import { processPrcDocumentWithBuffer } from "./prc-parser";

// Helper to extract supplier name from PRC filename
function extractSupplierNameFromFilename(filename: string): string | null {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.(pdf|png|jpg|jpeg)$/i, '');
  
  // Common PRC filename patterns:
  // "PRC_SupplierName_2025-01.pdf"
  // "SupplierName - PRC Jan 2025.pdf"
  // "Circular_SupplierName_Janeiro_2025.pdf"
  
  // Try to extract from common patterns
  const patterns = [
    /^PRC[_\s-]+([^_\-0-9]+)/i,           // PRC_SupplierName_...
    /^([^_\-0-9]+)[_\s-]+PRC/i,           // SupplierName_PRC_...
    /^Circular[_\s-]+([^_\-0-9]+)/i,      // Circular_SupplierName_...
    /^([A-Za-z\s]+)(?:[_\s-]+\d{4})/,     // SupplierName_2025...
  ];
  
  for (const pattern of patterns) {
    const match = nameWithoutExt.match(pattern);
    if (match && match[1]) {
      // Clean up: replace underscores with spaces, title case
      const cleaned = match[1]
        .replace(/[_-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      if (cleaned.length >= 3) {
        return cleaned;
      }
    }
  }
  
  // Fallback: if filename has meaningful text, use first part
  const words = nameWithoutExt.replace(/[_-]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !/^\d+$/.test(w));
  if (words.length > 0 && words[0].length >= 3) {
    return words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
  }
  
  return null;
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Simple in-memory rate limiter for portal endpoints
const portalRateLimits = new Map<string, { count: number; resetAt: number }>();
const PORTAL_RATE_LIMIT = 30; // max requests per window
const PORTAL_RATE_WINDOW_MS = 60 * 1000; // 1 minute

function getPortalRateLimitKey(req: Request): string {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  return `portal:${ip}`;
}

async function checkPortalRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = getPortalRateLimitKey(req);
  const now = Date.now();
  
  let entry = portalRateLimits.get(key);
  
  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + PORTAL_RATE_WINDOW_MS };
    portalRateLimits.set(key, entry);
    return next();
  }
  
  if (entry.count >= PORTAL_RATE_LIMIT) {
    // Log rate limit rejection (fire-and-forget)
    storage.logPortalAccess({
      clientId: null,
      sessionToken: req.params.token || null,
      action: "rate_limited",
      ipAddress: req.ip || null,
      userAgent: req.get("User-Agent") || null
    }).catch(err => console.error("Error logging rate limit:", err));
    
    return res.status(429).json({ 
      success: false, 
      error: "Muitas requisições. Por favor, aguarde e tente novamente." 
    });
  }
  
  entry.count++;
  return next();
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  Array.from(portalRateLimits.entries()).forEach(([key, entry]) => {
    if (entry.resetAt < now) {
      portalRateLimits.delete(key);
    }
  });
}, 60000);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============== AUTHENTICATION ENDPOINTS ==============
  
  const SALT_ROUNDS = 12;
  const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

  // TEMPORARY: Emergency password reset - will be removed after use
  app.post("/api/auth/emergency-reset-xk9m2", async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash("admin123", SALT_ROUNDS);
      const existing = await storage.getUserByUsername("admin");
      if (existing) {
        await storage.updateUserPassword(existing.id, hashedPassword);
        res.json({ success: true, message: "Password reset to admin123" });
      } else {
        const user = await storage.createUser({ username: "admin", password: hashedPassword, role: 'admin' });
        res.json({ success: true, message: "Admin user created with password admin123" });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Bootstrap endpoint for initial production setup (use ADMIN_BOOTSTRAP_TOKEN env var)
  app.post("/api/auth/bootstrap", async (req, res) => {
    try {
      const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
      const providedToken = req.headers["x-bootstrap-token"] as string;
      
      if (!bootstrapToken) {
        return res.status(404).json({ success: false, error: "Bootstrap not available" });
      }
      
      if (!providedToken || providedToken !== bootstrapToken) {
        return res.status(403).json({ success: false, error: "Invalid bootstrap token" });
      }
      
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ success: false, error: "Username and password required" });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ success: false, error: "Password must be at least 8 characters" });
      }
      
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        await storage.updateUserPassword(existing.id, hashedPassword);
        res.json({ success: true, message: "Admin password updated", user: { id: existing.id, username: existing.username } });
      } else {
        const user = await storage.createUser({ username, password: hashedPassword, role: 'admin' });
        res.json({ success: true, message: "Admin user created", user: { id: user.id, username: user.username } });
      }
      
      await storage.logAdminAction({
        actor: "bootstrap",
        actorIp: req.ip || null,
        action: "bootstrap_admin",
        entityType: "user",
        entityId: null,
        detailsJson: { username }
      });
    } catch (error: any) {
      console.error("Error in bootstrap:", error);
      res.status(500).json({ success: false, error: "Bootstrap failed" });
    }
  });

  // Register new admin user (first user setup only - protected after)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ success: false, error: "Username and password required" });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ success: false, error: "Password must be at least 8 characters" });
      }
      
      const existingUsers = await storage.hasAnyUsers();
      if (existingUsers) {
        const sessionId = req.headers["x-session-id"] as string;
        if (!sessionId) {
          return res.status(403).json({ success: false, error: "Registration is disabled. Contact an admin." });
        }
        const session = await storage.getAdminSession(sessionId);
        if (!session || new Date(session.expiresAt) < new Date()) {
          return res.status(403).json({ success: false, error: "Registration is disabled. Contact an admin." });
        }
      }
      
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ success: false, error: "Username already exists" });
      }
      
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const role = req.body.role || 'admin';
      const user = await storage.createUser({ username, password: hashedPassword, role });
      
      await storage.logAdminAction({
        actor: username,
        actorIp: req.ip || null,
        action: "register",
        entityType: "user",
        entityId: null,
        detailsJson: { username }
      });
      
      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role || 'admin' } });
    } catch (error: any) {
      console.error("Error registering user:", error);
      res.status(500).json({ success: false, error: "Failed to register user" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ success: false, error: "Username and password required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }
      
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }
      
      await storage.deleteExpiredSessions();
      
      const sessionId = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
      
      await storage.createAdminSession({
        id: sessionId,
        userId: user.id,
        expiresAt,
        ipAddress: req.ip || null,
        userAgent: req.get("User-Agent") || null
      });
      
      await storage.logAdminAction({
        actor: user.username,
        actorIp: req.ip || null,
        action: "login",
        entityType: "session",
        entityId: null,
        detailsJson: { sessionId }
      });
      
      res.json({ 
        success: true, 
        sessionId,
        expiresAt: expiresAt.toISOString(),
        user: { id: user.id, username: user.username, role: user.role || 'admin' }
      });
    } catch (error: any) {
      console.error("Error logging in:", error);
      res.status(500).json({ success: false, error: "Failed to login" });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    try {
      const sessionId = req.headers["x-session-id"] as string;
      
      if (sessionId) {
        const session = await storage.getAdminSession(sessionId);
        if (session) {
          const user = await storage.getUser(session.userId);
          await storage.logAdminAction({
            actor: user?.username || "unknown",
            actorIp: req.ip || null,
            action: "logout",
            entityType: "session",
            entityId: null,
            detailsJson: { sessionId }
          });
          await storage.deleteAdminSession(sessionId);
        }
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error logging out:", error);
      res.status(500).json({ success: false, error: "Failed to logout" });
    }
  });

  // Get current session/user
  app.get("/api/auth/me", async (req, res) => {
    try {
      const sessionId = req.headers["x-session-id"] as string;
      
      if (!sessionId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      
      const session = await storage.getAdminSession(sessionId);
      if (!session) {
        return res.status(401).json({ success: false, error: "Session not found" });
      }
      
      if (new Date(session.expiresAt) < new Date()) {
        await storage.deleteAdminSession(sessionId);
        return res.status(401).json({ success: false, error: "Session expired" });
      }
      
      const user = await storage.getUser(session.userId);
      if (!user) {
        return res.status(401).json({ success: false, error: "User not found" });
      }
      
      res.json({
        success: true,
        user: { id: user.id, username: user.username, role: user.role || 'admin' },
        session: { id: session.id, expiresAt: session.expiresAt }
      });
    } catch (error: any) {
      console.error("Error getting session:", error);
      res.status(500).json({ success: false, error: "Failed to get session" });
    }
  });

  // Check if any admin users exist (for first-time setup)
  app.get("/api/auth/setup-required", async (req, res) => {
    try {
      const hasUsers = await storage.hasAnyUsers();
      res.json({ success: true, setupRequired: !hasUsers });
    } catch (error: any) {
      console.error("Error checking setup:", error);
      res.status(500).json({ success: false, error: "Failed to check setup status" });
    }
  });

  // ============== USER MANAGEMENT ENDPOINTS (Admin only) ==============
  
  // Helper to verify admin session
  const requireAdminSession = async (req: Request, res: Response): Promise<{ userId: string; username: string } | null> => {
    const sessionId = req.headers["x-session-id"] as string;
    if (!sessionId) {
      res.status(401).json({ success: false, error: "Not authenticated" });
      return null;
    }
    const session = await storage.getAdminSession(sessionId);
    if (!session || new Date(session.expiresAt) < new Date()) {
      res.status(401).json({ success: false, error: "Session expired" });
      return null;
    }
    const user = await storage.getUser(session.userId);
    if (!user) {
      res.status(403).json({ success: false, error: "User not found" });
      return null;
    }
    const userRole = user.role || 'admin';
    if (userRole !== 'admin') {
      res.status(403).json({ success: false, error: "Admin access required" });
      return null;
    }
    return { userId: user.id, username: user.username };
  };

  // Get all users
  app.get("/api/users", async (req, res) => {
    try {
      const admin = await requireAdminSession(req, res);
      if (!admin) return;
      
      const allUsers = await storage.getAllUsers();
      res.json({ 
        success: true, 
        users: allUsers.map(u => ({ id: u.id, username: u.username, role: u.role }))
      });
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ success: false, error: "Failed to fetch users" });
    }
  });

  // Create new user
  app.post("/api/users", async (req, res) => {
    try {
      const admin = await requireAdminSession(req, res);
      if (!admin) return;
      
      const { username, password, role } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ success: false, error: "Username and password required" });
      }
      
      if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ success: false, error: "Password must be at least 8 characters" });
      }
      
      const validRoles = ['admin', 'ops', 'sales'];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({ success: false, error: "Invalid role. Must be admin, ops, or sales" });
      }
      
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ success: false, error: "Username already exists" });
      }
      
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await storage.createUser({ username, password: hashedPassword, role: role || 'admin' });
      
      await storage.logAdminAction({
        actor: admin.username,
        actorIp: req.ip || null,
        action: "create_user",
        entityType: "user",
        entityId: user.id,
        detailsJson: { username, role: role || 'admin' }
      });
      
      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ success: false, error: "Failed to create user" });
    }
  });

  // Update user
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const admin = await requireAdminSession(req, res);
      if (!admin) return;
      
      const { id } = req.params;
      const { username, role, password } = req.body;
      
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      
      const validRoles = ['admin', 'ops', 'sales'];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({ success: false, error: "Invalid role. Must be admin, ops, or sales" });
      }
      
      if (username && username !== existingUser.username) {
        const duplicate = await storage.getUserByUsername(username);
        if (duplicate) {
          return res.status(409).json({ success: false, error: "Username already exists" });
        }
      }
      
      const updateData: { username?: string; role?: string } = {};
      if (username) updateData.username = username;
      if (role) updateData.role = role;
      
      if (Object.keys(updateData).length > 0) {
        await storage.updateUser(id, updateData);
      }
      
      if (password) {
        if (typeof password !== 'string' || password.length < 8) {
          return res.status(400).json({ success: false, error: "Password must be at least 8 characters" });
        }
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        await storage.updateUserPassword(id, hashedPassword);
      }
      
      const updatedUser = await storage.getUser(id);
      
      await storage.logAdminAction({
        actor: admin.username,
        actorIp: req.ip || null,
        action: "update_user",
        entityType: "user",
        entityId: id,
        detailsJson: { username, role, passwordChanged: !!password }
      });
      
      res.json({ success: true, user: { id: updatedUser?.id, username: updatedUser?.username, role: updatedUser?.role } });
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(500).json({ success: false, error: "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const admin = await requireAdminSession(req, res);
      if (!admin) return;
      
      const { id } = req.params;
      
      if (id === admin.userId) {
        return res.status(400).json({ success: false, error: "Cannot delete your own account" });
      }
      
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      
      await storage.deleteUser(id);
      
      await storage.logAdminAction({
        actor: admin.username,
        actorIp: req.ip || null,
        action: "delete_user",
        entityType: "user",
        entityId: id,
        detailsJson: { deletedUsername: existingUser.username }
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ success: false, error: "Failed to delete user" });
    }
  });

  // ============== LEAD ENDPOINTS ==============
  
  // Submit lead from website contact form
  app.post("/api/leads", async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      res.json({ success: true, lead });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating lead:", error);
        res.status(500).json({ success: false, error: "Failed to submit lead" });
      }
    }
  });

  // Get all leads (admin)
  app.get("/api/leads", async (req, res) => {
    try {
      const allLeads = await storage.getLeads();
      res.json({ success: true, leads: allLeads });
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ success: false, error: "Failed to fetch leads" });
    }
  });

  // Get single lead
  app.get("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.getLead(parseInt(req.params.id));
      if (!lead) {
        return res.status(404).json({ success: false, error: "Lead not found" });
      }
      res.json({ success: true, lead });
    } catch (error: any) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ success: false, error: "Failed to fetch lead" });
    }
  });

  // Convert lead to client
  app.post("/api/leads/:id/convert", async (req, res) => {
    try {
      const client = await storage.createClientFromLead(parseInt(req.params.id));
      res.json({ success: true, client });
    } catch (error: any) {
      console.error("Error converting lead:", error);
      res.status(500).json({ success: false, error: "Failed to convert lead to client" });
    }
  });

  // Generate portal link for lead - creates an upload session for the lead
  app.post("/api/leads/:id/portal-link", async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ success: false, error: "Lead not found" });
      }
      
      // First convert lead to client if not already
      let client = await storage.getClientByLeadId(leadId);
      if (!client) {
        client = await storage.createClientFromLead(leadId);
      }
      
      // Generate upload session for the client
      const { token, accessCode } = await storage.generateClientUploadLink(client.id);
      const portalUrl = `/portal/upload/${token}`;
      res.json({ success: true, portalUrl, token, accessCode });
    } catch (error: any) {
      console.error("Error generating portal link:", error);
      res.status(500).json({ success: false, error: "Failed to generate portal link" });
    }
  });

  // ============== LEAD ECOS SNAPSHOTS ==============

  // Generate ECOS snapshot for a lead
  app.post("/api/leads/:id/snapshot", async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ success: false, error: "Lead not found" });
      }

      const validatedData = insertLeadEcosSnapshotSchema.parse({
        ...req.body,
        leadId,
        generatedAt: new Date()
      });

      const snapshot = await storage.createLeadEcosSnapshot(validatedData);
      res.json({ success: true, snapshot });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating lead snapshot:", error);
        res.status(500).json({ success: false, error: "Failed to create snapshot" });
      }
    }
  });

  // Get snapshots for a lead
  app.get("/api/leads/:id/snapshots", async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const snapshots = await storage.getLeadEcosSnapshots(leadId);
      res.json({ success: true, snapshots });
    } catch (error: any) {
      console.error("Error fetching lead snapshots:", error);
      res.status(500).json({ success: false, error: "Failed to fetch snapshots" });
    }
  });

  // Get a single snapshot
  app.get("/api/snapshots/:id", async (req, res) => {
    try {
      const snapshot = await storage.getLeadEcosSnapshot(parseInt(req.params.id));
      if (!snapshot) {
        return res.status(404).json({ success: false, error: "Snapshot not found" });
      }
      res.json({ success: true, snapshot });
    } catch (error: any) {
      console.error("Error fetching snapshot:", error);
      res.status(500).json({ success: false, error: "Failed to fetch snapshot" });
    }
  });

  // Lock a snapshot
  app.post("/api/snapshots/:id/lock", async (req, res) => {
    try {
      const { lockedBy } = req.body;
      if (!lockedBy) {
        return res.status(400).json({ success: false, error: "lockedBy is required" });
      }
      const snapshot = await storage.lockLeadEcosSnapshot(parseInt(req.params.id), lockedBy);
      if (!snapshot) {
        return res.status(404).json({ success: false, error: "Snapshot not found" });
      }
      res.json({ success: true, snapshot });
    } catch (error: any) {
      console.error("Error locking snapshot:", error);
      res.status(500).json({ success: false, error: "Failed to lock snapshot" });
    }
  });

  // Get active benchmarks for snapshot generation
  app.get("/api/benchmarks/active", async (req, res) => {
    try {
      const benchmarks = await storage.getActiveBenchmarks();
      res.json({ success: true, benchmarks });
    } catch (error: any) {
      console.error("Error fetching active benchmarks:", error);
      res.status(500).json({ success: false, error: "Failed to fetch benchmarks" });
    }
  });

  // ============== CLIENT ENDPOINTS ==============

  // Create client manually
  app.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.json({ success: true, client });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating client:", error);
        res.status(500).json({ success: false, error: "Failed to create client" });
      }
    }
  });

  // Get all clients
  app.get("/api/clients", async (req, res) => {
    try {
      const allClients = await storage.getClients();
      res.json({ success: true, clients: allClients });
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ success: false, error: "Failed to fetch clients" });
    }
  });

  // Get single client
  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(parseInt(req.params.id));
      if (!client) {
        return res.status(404).json({ success: false, error: "Client not found" });
      }
      res.json({ success: true, client });
    } catch (error: any) {
      console.error("Error fetching client:", error);
      res.status(500).json({ success: false, error: "Failed to fetch client" });
    }
  });

  // Update client
  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.updateClient(parseInt(req.params.id), req.body);
      if (!client) {
        return res.status(404).json({ success: false, error: "Client not found" });
      }
      res.json({ success: true, client });
    } catch (error: any) {
      console.error("Error updating client:", error);
      res.status(500).json({ success: false, error: "Failed to update client" });
    }
  });

  // Generate upload link for client
  app.post("/api/clients/:id/upload-link", async (req, res) => {
    try {
      const { token, accessCode } = await storage.generateClientUploadLink(parseInt(req.params.id));
      const uploadUrl = `/portal/upload/${token}`;
      res.json({ success: true, uploadUrl, token, accessCode });
    } catch (error: any) {
      console.error("Error generating upload link:", error);
      res.status(500).json({ success: false, error: "Failed to generate upload link" });
    }
  });

  // Get client consumption profiles
  app.get("/api/clients/:id/consumption", async (req, res) => {
    try {
      const profiles = await storage.getConsumptionProfiles(parseInt(req.params.id));
      res.json({ success: true, profiles });
    } catch (error: any) {
      console.error("Error fetching consumption profiles:", error);
      res.status(500).json({ success: false, error: "Failed to fetch consumption profiles" });
    }
  });

  // Get client bill uploads
  app.get("/api/clients/:id/bills", async (req, res) => {
    try {
      const bills = await storage.getBillUploads(parseInt(req.params.id));
      res.json({ success: true, bills });
    } catch (error: any) {
      console.error("Error fetching client bills:", error);
      res.status(500).json({ success: false, error: "Failed to fetch bills" });
    }
  });

  // ============== PORTAL ENDPOINTS ==============
  // All portal endpoints include rate limiting and access logging

  // Validate portal token (for lead-based portal access)
  app.get("/api/portal/validate/:token", checkPortalRateLimit, async (req, res) => {
    try {
      const lead = await storage.getLeadByPortalToken(req.params.token);
      if (!lead) {
        // Log invalid lead token attempt (fire-and-forget)
        storage.logPortalAccess({
          clientId: null,
          sessionToken: req.params.token,
          action: "validate_lead_invalid",
          ipAddress: req.ip || null,
          userAgent: req.get("User-Agent") || null
        }).catch(err => console.error("Error logging portal access:", err));
        return res.status(404).json({ success: false, error: "Invalid or expired portal link" });
      }
      
      // Log successful lead portal access (fire-and-forget)
      storage.logPortalAccess({
        clientId: null,
        sessionToken: req.params.token,
        action: "validate_lead_success",
        ipAddress: req.ip || null,
        userAgent: req.get("User-Agent") || null
      }).catch(err => console.error("Error logging portal access:", err));
      
      res.json({ success: true, lead: { id: lead.id, name: lead.name, email: lead.email, companyName: lead.companyName } });
    } catch (error: any) {
      // Log server error (fire-and-forget)
      storage.logPortalAccess({
        clientId: null,
        sessionToken: req.params.token,
        action: "validate_lead_error",
        ipAddress: req.ip || null,
        userAgent: req.get("User-Agent") || null
      }).catch(() => {});
      console.error("Error validating portal token:", error);
      res.status(500).json({ success: false, error: "Failed to validate portal token" });
    }
  });

  // Validate upload session token
  app.get("/api/portal/upload/validate/:token", checkPortalRateLimit, async (req, res) => {
    try {
      const session = await storage.getUploadSessionByToken(req.params.token);
      if (!session) {
        // Log invalid token attempt (fire-and-forget)
        storage.logPortalAccess({
          clientId: null,
          sessionToken: req.params.token,
          action: "validate_session_invalid",
          ipAddress: req.ip || null,
          userAgent: req.get("User-Agent") || null
        }).catch(err => console.error("Error logging portal access:", err));
        return res.status(404).json({ success: false, error: "Invalid upload link" });
      }
      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        // Log expired token attempt (fire-and-forget)
        storage.logPortalAccess({
          clientId: session.clientId || null,
          sessionToken: req.params.token,
          action: "validate_session_expired",
          ipAddress: req.ip || null,
          userAgent: req.get("User-Agent") || null
        }).catch(err => console.error("Error logging portal access:", err));
        return res.status(410).json({ success: false, error: "Upload link has expired" });
      }
      const client = session.clientId ? await storage.getClient(session.clientId) : null;
      
      // Log successful portal access (fire-and-forget)
      storage.logPortalAccess({
        clientId: session.clientId || null,
        sessionToken: req.params.token,
        action: "validate_session_success",
        ipAddress: req.ip || null,
        userAgent: req.get("User-Agent") || null
      }).catch(err => console.error("Error logging portal access:", err));
      
      res.json({ 
        success: true, 
        session: { id: session.id, requiresCode: !!session.accessCode },
        client: client ? { id: client.id, companyName: client.companyName } : null
      });
    } catch (error: any) {
      // Log server error (fire-and-forget)
      storage.logPortalAccess({
        clientId: null,
        sessionToken: req.params.token,
        action: "validate_session_error",
        ipAddress: req.ip || null,
        userAgent: req.get("User-Agent") || null
      }).catch(() => {});
      console.error("Error validating upload session:", error);
      res.status(500).json({ success: false, error: "Failed to validate upload session" });
    }
  });

  // Verify access code
  app.post("/api/portal/upload/verify/:token", checkPortalRateLimit, async (req, res) => {
    try {
      const session = await storage.getUploadSessionByToken(req.params.token);
      if (!session) {
        return res.status(404).json({ success: false, error: "Invalid upload link" });
      }
      if (session.accessCode && session.accessCode !== req.body.accessCode) {
        // Log failed verification attempt (fire-and-forget)
        if (session.clientId) {
          storage.logPortalAccess({
            clientId: session.clientId,
            sessionToken: req.params.token,
            action: "verify_code_failed",
            ipAddress: req.ip || null,
            userAgent: req.get("User-Agent") || null
          }).catch(err => console.error("Error logging portal access:", err));
        }
        return res.status(401).json({ success: false, error: "Invalid access code" });
      }
      
      // Log successful verification (fire-and-forget, before response)
      if (session.clientId) {
        storage.logPortalAccess({
          clientId: session.clientId,
          sessionToken: req.params.token,
          action: "verify_code_success",
          ipAddress: req.ip || null,
          userAgent: req.get("User-Agent") || null
        }).catch(err => console.error("Error logging portal access:", err));
      }
      
      res.json({ success: true });
    } catch (error: any) {
      // Log server error (fire-and-forget)
      storage.logPortalAccess({
        clientId: null,
        sessionToken: req.params.token,
        action: "verify_code_error",
        ipAddress: req.ip || null,
        userAgent: req.get("User-Agent") || null
      }).catch(() => {});
      console.error("Error verifying access code:", error);
      res.status(500).json({ success: false, error: "Failed to verify access code" });
    }
  });

  // ============== FILE UPLOAD ENDPOINTS ==============

  // Get presigned upload URL
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Register uploaded file as consumption profile
  app.post("/api/consumption-profiles", async (req, res) => {
    try {
      const validatedData = insertConsumptionProfileSchema.parse(req.body);
      const profile = await storage.createConsumptionProfile(validatedData);
      res.json({ success: true, profile });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating consumption profile:", error);
        res.status(500).json({ success: false, error: "Failed to create consumption profile" });
      }
    }
  });

  // Serve uploaded objects
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      console.error("Error serving object:", error);
      res.status(500).json({ error: "Failed to serve file" });
    }
  });

  // ============== QUOTE REQUEST ENDPOINTS ==============

  // Create quote request
  app.post("/api/quote-requests", async (req, res) => {
    try {
      const validatedData = insertQuoteRequestSchema.parse(req.body);
      const request = await storage.createQuoteRequest(validatedData);
      res.json({ success: true, request });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating quote request:", error);
        res.status(500).json({ success: false, error: "Failed to create quote request" });
      }
    }
  });

  // Get all quote requests
  app.get("/api/quote-requests", async (req, res) => {
    try {
      const requests = await storage.getQuoteRequests();
      res.json({ success: true, requests });
    } catch (error: any) {
      console.error("Error fetching quote requests:", error);
      res.status(500).json({ success: false, error: "Failed to fetch quote requests" });
    }
  });

  // Get single quote request with supplier quotes
  app.get("/api/quote-requests/:id", async (req, res) => {
    try {
      const request = await storage.getQuoteRequest(parseInt(req.params.id));
      if (!request) {
        return res.status(404).json({ success: false, error: "Quote request not found" });
      }
      const quotes = await storage.getSupplierQuotes(request.id);
      res.json({ success: true, request, quotes });
    } catch (error: any) {
      console.error("Error fetching quote request:", error);
      res.status(500).json({ success: false, error: "Failed to fetch quote request" });
    }
  });

  // Update quote request status
  app.patch("/api/quote-requests/:id", async (req, res) => {
    try {
      const request = await storage.updateQuoteRequest(parseInt(req.params.id), req.body);
      if (!request) {
        return res.status(404).json({ success: false, error: "Quote request not found" });
      }
      res.json({ success: true, request });
    } catch (error: any) {
      console.error("Error updating quote request:", error);
      res.status(500).json({ success: false, error: "Failed to update quote request" });
    }
  });

  // ============== SUPPLIER MASTER LIST ==============

  // Get all suppliers (master list)
  app.get("/api/suppliers", async (req, res) => {
    try {
      const allSuppliers = await storage.getActiveSuppliers();
      res.json({ success: true, suppliers: allSuppliers });
    } catch (error: any) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ success: false, error: "Failed to fetch suppliers" });
    }
  });

  // ============== SUPPLIER QUOTE ENDPOINTS ==============

  // Get quotes for a client
  app.get("/api/clients/:id/quotes", async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const quotes = await storage.getSupplierQuotesForClient(clientId);
      res.json({ success: true, quotes });
    } catch (error: any) {
      console.error("Error fetching client quotes:", error);
      res.status(500).json({ success: false, error: "Failed to fetch quotes" });
    }
  });

  // Create quote for a client
  app.post("/api/clients/:id/quotes", async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const quoteData = { ...req.body, clientId };
      const validatedData = insertSupplierQuoteSchema.parse(quoteData);
      const quote = await storage.createSupplierQuote(validatedData);
      res.json({ success: true, quote });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating client quote:", error);
        res.status(500).json({ success: false, error: "Failed to create quote" });
      }
    }
  });

  // Calculate quote economics
  app.post("/api/quotes/calculate", async (req, res) => {
    try {
      const { client_data, quote_data } = req.body;
      
      // Get average monthly consumption in MWh
      const avgConsumptionKwh = parseFloat(client_data.avg_consumption_kwh || client_data.avgConsumptionKwh || 0);
      const avgConsumptionMwh = avgConsumptionKwh / 1000;
      const annualConsumptionMwh = avgConsumptionMwh * 12;
      
      // Get demand in kW
      const demandKw = parseFloat(client_data.demand_kw || client_data.demandaKw || 0);
      
      // Calculate effective price per MWh
      let effectivePriceRmwh = 0;
      if (quote_data.price_type === "fixed" || quote_data.priceRmwh) {
        effectivePriceRmwh = parseFloat(quote_data.price_rmwh || quote_data.priceRmwh || 0);
      } else {
        // PLD spread - assume average PLD of R$150/MWh for calculation
        const avgPld = 150;
        const spread = parseFloat(quote_data.pld_spread_rmwh || quote_data.pldSpreadRmwh || 0);
        effectivePriceRmwh = avgPld + spread;
      }
      
      // Calculate energy cost
      const energyCostAnnual = annualConsumptionMwh * effectivePriceRmwh;
      
      // Calculate demand cost
      const demandPriceRkwMes = parseFloat(quote_data.demanda_price_rkw_mes || quote_data.demandaPriceRkwMes || 0);
      const demandCostAnnual = demandKw * demandPriceRkwMes * 12;
      
      // Total client cost
      const totalClientCostAnnual = energyCostAnnual + demandCostAnnual;
      
      // Calculate our commission
      const ourCommissionRmwh = parseFloat(quote_data.our_commission_rmwh || quote_data.ourCommissionRmwh || 5);
      const ourCommissionAnnual = annualConsumptionMwh * ourCommissionRmwh;
      
      // Calculate client savings
      const currentPriceRmwh = parseFloat(client_data.current_price_rmwh || client_data.currentPriceRmwh || 0);
      const currentCostAnnual = annualConsumptionMwh * currentPriceRmwh + demandCostAnnual;
      const clientSavingsAnnual = currentPriceRmwh > 0 ? currentCostAnnual - totalClientCostAnnual : 0;
      
      res.json({
        success: true,
        total_client_cost_annual: Math.round(totalClientCostAnnual * 100) / 100,
        our_commission_annual: Math.round(ourCommissionAnnual * 100) / 100,
        client_savings_annual: Math.round(clientSavingsAnnual * 100) / 100,
        effective_price_rmwh: Math.round(effectivePriceRmwh * 100) / 100,
        annual_consumption_mwh: Math.round(annualConsumptionMwh * 100) / 100,
        energy_cost_annual: Math.round(energyCostAnnual * 100) / 100,
        demand_cost_annual: Math.round(demandCostAnnual * 100) / 100
      });
    } catch (error: any) {
      console.error("Error calculating quote:", error);
      res.status(500).json({ success: false, error: "Failed to calculate quote" });
    }
  });

  // Add supplier quote (standalone)
  app.post("/api/supplier-quotes", async (req, res) => {
    try {
      const validatedData = insertSupplierQuoteSchema.parse(req.body);
      const quote = await storage.createSupplierQuote(validatedData);
      res.json({ success: true, quote });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating supplier quote:", error);
        res.status(500).json({ success: false, error: "Failed to create supplier quote" });
      }
    }
  });

  // Update supplier quote
  app.patch("/api/supplier-quotes/:id", async (req, res) => {
    try {
      const quote = await storage.updateSupplierQuote(parseInt(req.params.id), req.body);
      if (!quote) {
        return res.status(404).json({ success: false, error: "Quote not found" });
      }
      res.json({ success: true, quote });
    } catch (error: any) {
      console.error("Error updating supplier quote:", error);
      res.status(500).json({ success: false, error: "Failed to update quote" });
    }
  });

  // Mark quote as won
  app.post("/api/supplier-quotes/:id/won", async (req, res) => {
    try {
      const quoteId = parseInt(req.params.id);
      const quote = await storage.getSupplierQuote(quoteId);
      if (!quote) {
        return res.status(404).json({ success: false, error: "Quote not found" });
      }
      await storage.markQuoteAsWon(quoteId, quote.clientId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error marking quote as won:", error);
      res.status(500).json({ success: false, error: "Failed to mark quote as won" });
    }
  });

  // Select supplier quote (legacy - keeps backward compatibility)
  app.post("/api/supplier-quotes/:id/select", async (req, res) => {
    try {
      await storage.selectSupplierQuote(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error selecting supplier quote:", error);
      res.status(500).json({ success: false, error: "Failed to select supplier quote" });
    }
  });

  // ============== BILL UPLOAD WITH OCR ==============

  // Upload bill and process with OCR
  app.post("/api/clients/:id/upload-bill", upload.single("bill"), async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ 
          success: false, 
          error: "Nenhum arquivo enviado." 
        });
      }
      
      const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (!validTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: "Tipo de arquivo inválido. Use PDF, JPG ou PNG."
        });
      }
      
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ success: false, error: "Client not found" });
      }
      
      console.log(`Processing bill upload for client ${clientId}: ${file.originalname}`);
      
      const ocrResult = await processBillFile(file.buffer, file.mimetype);
      
      const billUpload = await storage.createBillUpload({
        clientId,
        fileName: file.originalname,
        fileType: file.mimetype.split("/")[1],
        fileSize: file.size,
        ocrRawText: ocrResult.rawText,
        ocrConfidence: ocrResult.confidence.toFixed(2),
        ocrStatus: ocrResult.confidence >= 0.7 ? "success" : "failed",
        ucCode: ocrResult.data.uc || null,
        consumoKwh: ocrResult.data.consumo ? ocrResult.data.consumo.replace(/\./g, "").replace(",", ".") : null,
        demandaKw: ocrResult.data.demanda ? ocrResult.data.demanda.replace(/\./g, "").replace(",", ".") : null,
        valorTotal: ocrResult.data.valor ? ocrResult.data.valor.replace(/\./g, "").replace(",", ".") : null,
        distribuidora: ocrResult.data.distribuidora || null,
        mesReferencia: ocrResult.data.mes || null,
        extractionMethod: "tesseract",
        reviewedBy: "system"
      });
      
      res.json({
        success: true,
        upload_id: billUpload.id,
        data: ocrResult.data,
        confidence: ocrResult.confidence,
        needs_manual: ocrResult.needsManual,
        message: ocrResult.confidence >= 0.7 
          ? "Dados extraídos com sucesso! Verifique abaixo." 
          : "OCR de baixa confiança. Por favor, verifique os dados.",
        raw_text_preview: ocrResult.rawText.substring(0, 200) + "..."
      });
      
    } catch (error: any) {
      console.error("Error processing bill upload:", error);
      res.status(500).json({ success: false, error: "Erro ao processar arquivo." });
    }
  });

  // Save manually corrected bill data
  app.post("/api/bill-uploads/:id/save-manual", async (req, res) => {
    try {
      const billId = parseInt(req.params.id);
      const { uc, consumo, demanda, valor, distribuidora, mes } = req.body;
      
      const billUpload = await storage.updateBillUpload(billId, {
        ucCode: uc,
        consumoKwh: consumo ? consumo.replace(/\./g, "").replace(",", ".") : null,
        demandaKw: demanda ? demanda.replace(/\./g, "").replace(",", ".") : null,
        valorTotal: valor ? valor.replace(/\./g, "").replace(",", ".") : null,
        distribuidora: distribuidora,
        mesReferencia: mes,
        ocrStatus: "manual",
        extractionMethod: "manual",
        reviewedBy: "admin"
      });
      
      if (!billUpload) {
        return res.status(404).json({ success: false, error: "Bill upload not found" });
      }
      
      res.json({ success: true, billUpload });
    } catch (error: any) {
      console.error("Error saving manual bill data:", error);
      res.status(500).json({ success: false, error: "Erro ao salvar dados." });
    }
  });

  // Get bill uploads for client
  app.get("/api/clients/:id/bill-uploads", async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const bills = await storage.getBillUploads(clientId);
      res.json({ success: true, bills });
    } catch (error: any) {
      console.error("Error fetching bill uploads:", error);
      res.status(500).json({ success: false, error: "Failed to fetch bill uploads" });
    }
  });

  // ============== ADDITIONAL API ENDPOINTS FOR EMAIL INTEGRATION ==============

  // Alias for generate-portal (delegates to upload-link logic)
  app.post("/api/clients/:id/generate-portal", async (req, res) => {
    // Reuse the same handler as upload-link
    try {
      const { token, accessCode } = await storage.generateClientUploadLink(parseInt(req.params.id));
      const uploadUrl = `/portal/upload/${token}`;
      res.json({ success: true, uploadUrl, token, accessCode });
    } catch (error: any) {
      console.error("Error generating portal link:", error);
      res.status(500).json({ success: false, error: "Failed to generate portal link" });
    }
  });

  // Webhook for when bills are uploaded (for future email notifications)
  app.post("/api/webhooks/bill-uploaded", async (req, res) => {
    // Validate payload
    const { clientId, sessionId, fileName, fileUrl, uploadedAt } = req.body;
    
    if (!clientId || !fileName) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields: clientId and fileName are required" 
      });
    }
    
    console.log("Bill uploaded webhook received:", {
      clientId,
      sessionId,
      fileName,
      fileUrl,
      uploadedAt: uploadedAt || new Date().toISOString()
    });
    
    // TODO: Integrate with email service (SendGrid) to notify sales team
    // TODO: Update client status if needed
    
    res.json({ 
      success: true, 
      message: "Webhook received",
      timestamp: new Date().toISOString()
    });
  });

  // ============== ZOHO WEBHOOK ENDPOINT (PLACEHOLDER) ==============

  // Zoho CRM sync webhook - placeholder for future integration
  app.post("/api/webhooks/zoho-sync", async (req, res) => {
    // TODO: Implement Zoho CRM integration
    // This endpoint will receive webhooks from Zoho CRM for bidirectional sync
    // Expected payload structure:
    // {
    //   action: 'create' | 'update' | 'delete',
    //   module: 'Leads' | 'Contacts' | 'Deals',
    //   record_id: string,
    //   data: { ... Zoho record fields ... }
    // }
    console.log("Zoho webhook received:", req.body);
    res.json({ 
      success: true, 
      message: "Webhook received (integration pending)",
      timestamp: new Date().toISOString()
    });
  });

  // Manual sync trigger - placeholder for future integration
  app.post("/api/admin/sync-to-zoho", async (req, res) => {
    // TODO: Implement manual sync to Zoho CRM
    // This will push local records to Zoho and update zoho_id fields
    console.log("Manual Zoho sync triggered");
    res.json({ 
      success: true, 
      message: "Sync initiated (integration pending)",
      timestamp: new Date().toISOString()
    });
  });

  // ============== RFO (REQUEST FOR OFFER) ENDPOINTS ==============

  // Create RFO for a client
  app.post("/api/clients/:id/rfo", async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ success: false, error: "Client not found" });
      }

      // Generate RFO number
      const rfoNumber = await storage.generateRfoNumber();
      
      // Calculate deadline based on days
      const deadlineDays = req.body.deadlineDays || 3;
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + deadlineDays);

      const replyEmail = req.body.replyEmail || 'contato@otimaenergia.com.br';
      
      const rfoData = {
        clientId,
        rfoNumber,
        responseDeadline: deadline.toISOString().split('T')[0],
        priority: req.body.priority || 'normal',
        billUploadId: req.body.billUploadId || null,
        snapshotConsumptionKwh: client.avgConsumptionKwh || null,
        snapshotDemandaKw: req.body.demandaKw || null,
        snapshotUc: client.ucCode || null,
        snapshotDistribuidora: client.currentSupplier || null,
        snapshotContractEnd: req.body.contractEnd || null,
        emailSubject: req.body.emailSubject || null,
        emailBody: req.body.emailBody ? `${req.body.emailBody}\n\nResponder para: ${replyEmail}` : null,
        attachments: req.body.attachments || null
      };

      const validatedData = insertRfoRequestSchema.parse(rfoData);
      const rfo = await storage.createRfoRequest(validatedData);
      
      res.json({ success: true, rfo });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating RFO:", error);
        res.status(500).json({ success: false, error: "Failed to create RFO" });
      }
    }
  });

  // Get all RFOs
  app.get("/api/rfo", async (req, res) => {
    try {
      const rfos = await storage.getRfoRequests();
      res.json({ success: true, rfos });
    } catch (error: any) {
      console.error("Error fetching RFOs:", error);
      res.status(500).json({ success: false, error: "Failed to fetch RFOs" });
    }
  });

  // Get single RFO with tracking details
  app.get("/api/rfo/:id", async (req, res) => {
    try {
      const rfoId = parseInt(req.params.id);
      const rfo = await storage.getRfoRequest(rfoId);
      if (!rfo) {
        return res.status(404).json({ success: false, error: "RFO not found" });
      }
      
      const tracking = await storage.getRfoSupplierTracking(rfoId);
      const client = await storage.getClient(rfo.clientId);
      
      res.json({ success: true, rfo, tracking, client });
    } catch (error: any) {
      console.error("Error fetching RFO:", error);
      res.status(500).json({ success: false, error: "Failed to fetch RFO" });
    }
  });

  // Get RFOs for a specific client
  app.get("/api/clients/:id/rfo", async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const rfos = await storage.getRfoRequestsForClient(clientId);
      res.json({ success: true, rfos });
    } catch (error: any) {
      console.error("Error fetching client RFOs:", error);
      res.status(500).json({ success: false, error: "Failed to fetch RFOs" });
    }
  });

  // Send RFO to selected suppliers
  app.post("/api/rfo/:id/send", async (req, res) => {
    try {
      const rfoId = parseInt(req.params.id);
      const { supplierIds } = req.body;
      
      if (!supplierIds || !Array.isArray(supplierIds) || supplierIds.length === 0) {
        return res.status(400).json({ success: false, error: "No suppliers selected" });
      }

      const rfo = await storage.getRfoRequest(rfoId);
      if (!rfo) {
        return res.status(404).json({ success: false, error: "RFO not found" });
      }

      const trackingRecords = [];
      const errors = [];

      for (const supplierId of supplierIds) {
        try {
          // Get primary contact for supplier
          const contact = await storage.getPrimarySupplierContact(supplierId);
          if (!contact) {
            errors.push({ supplierId, error: "No primary contact found" });
            continue;
          }

          // Create tracking record
          const trackingData = {
            rfoId,
            supplierId,
            contactName: contact.name,
            contactEmail: contact.email,
            contactPhone: contact.phone || null,
            sentStatus: "sent" as const,
            sentDate: new Date(),
            sentMethod: "email" as const,
            responseStatus: "waiting" as const,
            reminderSent: false
          };

          const validatedTracking = insertRfoSupplierTrackingSchema.parse(trackingData);
          const tracking = await storage.createRfoSupplierTracking(validatedTracking);
          trackingRecords.push(tracking);

          // TODO: Actually send email via SendGrid/Nodemailer
          console.log(`[RFO ${rfo.rfoNumber}] Would send email to ${contact.email}`);
        } catch (err: any) {
          errors.push({ supplierId, error: err.message });
        }
      }

      // Update RFO status and counts
      await storage.updateRfoRequest(rfoId, {
        status: "sent",
        sentCount: trackingRecords.length,
        lastSentDate: new Date()
      });

      res.json({ 
        success: true, 
        sent: trackingRecords.length,
        failed: errors.length,
        trackingRecords,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      console.error("Error sending RFO:", error);
      res.status(500).json({ success: false, error: "Failed to send RFO" });
    }
  });

  // Send reminders for non-responsive suppliers
  app.post("/api/rfo/:id/remind", async (req, res) => {
    try {
      const rfoId = parseInt(req.params.id);
      const rfo = await storage.getRfoRequest(rfoId);
      if (!rfo) {
        return res.status(404).json({ success: false, error: "RFO not found" });
      }

      const tracking = await storage.getRfoSupplierTracking(rfoId);
      const waitingSuppliers = tracking.filter(t => 
        t.responseStatus === "waiting" && !t.reminderSent
      );

      let remindersSent = 0;
      for (const supplier of waitingSuppliers) {
        await storage.updateRfoSupplierTracking(supplier.id, {
          reminderSent: true,
          reminderDate: new Date()
        });
        // TODO: Actually send reminder email
        console.log(`[RFO ${rfo.rfoNumber}] Would send reminder to ${supplier.contactEmail}`);
        remindersSent++;
      }

      res.json({ 
        success: true, 
        remindersSent,
        totalWaiting: waitingSuppliers.length
      });
    } catch (error: any) {
      console.error("Error sending reminders:", error);
      res.status(500).json({ success: false, error: "Failed to send reminders" });
    }
  });

  // Record supplier response to RFO
  app.post("/api/rfo/:id/respond/:trackingId", async (req, res) => {
    try {
      const rfoId = parseInt(req.params.id);
      const trackingId = parseInt(req.params.trackingId);
      const { quoteId, status } = req.body;

      const tracking = await storage.getRfoSupplierTrackingById(trackingId);
      if (!tracking || tracking.rfoId !== rfoId) {
        return res.status(404).json({ success: false, error: "Tracking record not found" });
      }

      await storage.markRfoSupplierResponded(trackingId, quoteId || null);

      // Update RFO response count
      const rfo = await storage.getRfoRequest(rfoId);
      if (rfo) {
        const allTracking = await storage.getRfoSupplierTracking(rfoId);
        const respondedCount = allTracking.filter(t => 
          t.responseStatus === "responded" || t.responseStatus === "no_quote"
        ).length;
        
        const newStatus = respondedCount >= allTracking.length ? "complete" : "partial_response";
        await storage.updateRfoRequest(rfoId, {
          responseCount: respondedCount,
          status: newStatus
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error recording response:", error);
      res.status(500).json({ success: false, error: "Failed to record response" });
    }
  });

  // ============== SUPPLIER CONTACTS ENDPOINTS ==============

  // Get contacts for a supplier
  app.get("/api/suppliers/:id/contacts", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const contacts = await storage.getSupplierContacts(supplierId);
      res.json({ success: true, contacts });
    } catch (error: any) {
      console.error("Error fetching supplier contacts:", error);
      res.status(500).json({ success: false, error: "Failed to fetch contacts" });
    }
  });

  // Add contact to supplier
  app.post("/api/suppliers/:id/contacts", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const supplier = await storage.getSupplier(supplierId);
      if (!supplier) {
        return res.status(404).json({ success: false, error: "Supplier not found" });
      }

      const contactData = { ...req.body, supplierId };
      const validatedData = insertSupplierContactSchema.parse(contactData);
      const contact = await storage.createSupplierContact(validatedData);
      
      res.json({ success: true, contact });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating supplier contact:", error);
        res.status(500).json({ success: false, error: "Failed to create contact" });
      }
    }
  });

  // Update supplier contact
  app.patch("/api/suppliers/:id/contacts/:contactId", async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      const contact = await storage.updateSupplierContact(contactId, req.body);
      if (!contact) {
        return res.status(404).json({ success: false, error: "Contact not found" });
      }
      res.json({ success: true, contact });
    } catch (error: any) {
      console.error("Error updating supplier contact:", error);
      res.status(500).json({ success: false, error: "Failed to update contact" });
    }
  });

  // Get all active supplier contacts (for RFO recipient selection)
  app.get("/api/supplier-contacts/active", async (req, res) => {
    try {
      const contacts = await storage.getAllActiveSupplierContacts();
      res.json({ success: true, contacts });
    } catch (error: any) {
      console.error("Error fetching active contacts:", error);
      res.status(500).json({ success: false, error: "Failed to fetch contacts" });
    }
  });

  // Delete supplier contact
  app.delete("/api/suppliers/:id/contacts/:contactId", async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      await storage.deleteSupplierContact(contactId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting supplier contact:", error);
      res.status(500).json({ success: false, error: "Failed to delete contact" });
    }
  });

  // Get all suppliers with their contacts
  app.get("/api/suppliers-with-contacts", async (req, res) => {
    try {
      const suppliersWithContacts = await storage.getSuppliersWithContacts();
      res.json({ success: true, suppliers: suppliersWithContacts });
    } catch (error: any) {
      console.error("Error fetching suppliers with contacts:", error);
      res.status(500).json({ success: false, error: "Failed to fetch suppliers" });
    }
  });

  // ============== SUPPLIER PORTALS ENDPOINTS ==============

  // Get portals for a supplier
  app.get("/api/suppliers/:id/portals", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const portals = await storage.getSupplierPortals(supplierId);
      res.json({ success: true, portals });
    } catch (error: any) {
      console.error("Error fetching supplier portals:", error);
      res.status(500).json({ success: false, error: "Failed to fetch portals" });
    }
  });

  // Create supplier portal
  app.post("/api/suppliers/:id/portals", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const portalData = { ...req.body, supplierId };
      const portal = await storage.createSupplierPortal(portalData);
      res.json({ success: true, portal });
    } catch (error: any) {
      console.error("Error creating supplier portal:", error);
      res.status(500).json({ success: false, error: "Failed to create portal" });
    }
  });

  // Update supplier portal
  app.patch("/api/suppliers/:id/portals/:portalId", async (req, res) => {
    try {
      const portalId = parseInt(req.params.portalId);
      const portal = await storage.updateSupplierPortal(portalId, req.body);
      if (!portal) {
        return res.status(404).json({ success: false, error: "Portal not found" });
      }
      res.json({ success: true, portal });
    } catch (error: any) {
      console.error("Error updating supplier portal:", error);
      res.status(500).json({ success: false, error: "Failed to update portal" });
    }
  });

  // Delete supplier portal
  app.delete("/api/suppliers/:id/portals/:portalId", async (req, res) => {
    try {
      const portalId = parseInt(req.params.portalId);
      await storage.deleteSupplierPortal(portalId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting supplier portal:", error);
      res.status(500).json({ success: false, error: "Failed to delete portal" });
    }
  });

  // ============== RFO TEMPLATES ENDPOINTS ==============

  // Get all RFO templates
  app.get("/api/rfo-templates", async (req, res) => {
    try {
      const templates = await storage.getRfoTemplates();
      res.json({ success: true, templates });
    } catch (error: any) {
      console.error("Error fetching RFO templates:", error);
      res.status(500).json({ success: false, error: "Failed to fetch templates" });
    }
  });

  // Get active RFO templates
  app.get("/api/rfo-templates/active", async (req, res) => {
    try {
      const templates = await storage.getActiveRfoTemplates();
      res.json({ success: true, templates });
    } catch (error: any) {
      console.error("Error fetching active RFO templates:", error);
      res.status(500).json({ success: false, error: "Failed to fetch templates" });
    }
  });

  // Get RFO template by format type
  app.get("/api/rfo-templates/format/:formatType", async (req, res) => {
    try {
      const template = await storage.getRfoTemplateByFormat(req.params.formatType);
      if (!template) {
        return res.status(404).json({ success: false, error: "Template not found" });
      }
      res.json({ success: true, template });
    } catch (error: any) {
      console.error("Error fetching RFO template:", error);
      res.status(500).json({ success: false, error: "Failed to fetch template" });
    }
  });

  // Create RFO template
  app.post("/api/rfo-templates", async (req, res) => {
    try {
      const template = await storage.createRfoTemplate(req.body);
      res.json({ success: true, template });
    } catch (error: any) {
      console.error("Error creating RFO template:", error);
      res.status(500).json({ success: false, error: "Failed to create template" });
    }
  });

  // Update RFO template
  app.patch("/api/rfo-templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const template = await storage.updateRfoTemplate(templateId, req.body);
      if (!template) {
        return res.status(404).json({ success: false, error: "Template not found" });
      }
      res.json({ success: true, template });
    } catch (error: any) {
      console.error("Error updating RFO template:", error);
      res.status(500).json({ success: false, error: "Failed to update template" });
    }
  });

  // ============== PROPOSAL ENDPOINTS ==============

  // Create proposal from client + quote data
  app.post("/api/proposals", async (req, res) => {
    try {
      const proposalNumber = await storage.generateProposalNumber();
      const trackingToken = require("crypto").randomBytes(32).toString("hex");
      
      const proposalData = {
        ...req.body,
        proposalNumber,
        trackingToken,
      };
      
      const validatedData = insertProposalSchema.parse(proposalData);
      const proposal = await storage.createProposal(validatedData);
      res.json({ success: true, proposal });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating proposal:", error);
        res.status(500).json({ success: false, error: "Failed to create proposal" });
      }
    }
  });

  // Get all proposals
  app.get("/api/proposals", async (req, res) => {
    try {
      const proposals = await storage.getProposals();
      res.json({ success: true, proposals });
    } catch (error: any) {
      console.error("Error fetching proposals:", error);
      res.status(500).json({ success: false, error: "Failed to fetch proposals" });
    }
  });

  // Get single proposal
  app.get("/api/proposals/:id", async (req, res) => {
    try {
      const proposal = await storage.getProposal(parseInt(req.params.id));
      if (!proposal) {
        return res.status(404).json({ success: false, error: "Proposal not found" });
      }
      res.json({ success: true, proposal });
    } catch (error: any) {
      console.error("Error fetching proposal:", error);
      res.status(500).json({ success: false, error: "Failed to fetch proposal" });
    }
  });

  // Update proposal status
  app.patch("/api/proposals/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const proposal = await storage.updateProposalStatus(parseInt(req.params.id), status);
      if (!proposal) {
        return res.status(404).json({ success: false, error: "Proposal not found" });
      }
      res.json({ success: true, proposal });
    } catch (error: any) {
      console.error("Error updating proposal status:", error);
      res.status(500).json({ success: false, error: "Failed to update proposal status" });
    }
  });

  // Update proposal (general)
  app.patch("/api/proposals/:id", async (req, res) => {
    try {
      const proposal = await storage.updateProposal(parseInt(req.params.id), req.body);
      if (!proposal) {
        return res.status(404).json({ success: false, error: "Proposal not found" });
      }
      res.json({ success: true, proposal });
    } catch (error: any) {
      console.error("Error updating proposal:", error);
      res.status(500).json({ success: false, error: "Failed to update proposal" });
    }
  });

  // Get proposals for specific client
  app.get("/api/clients/:id/proposals", async (req, res) => {
    try {
      const proposals = await storage.getProposalsForClient(parseInt(req.params.id));
      res.json({ success: true, proposals });
    } catch (error: any) {
      console.error("Error fetching client proposals:", error);
      res.status(500).json({ success: false, error: "Failed to fetch proposals" });
    }
  });

  // Client view proposal (tracks views, returns proposal data)
  app.get("/api/proposal/view/:token", async (req, res) => {
    try {
      const proposal = await storage.getProposalByToken(req.params.token);
      if (!proposal) {
        return res.status(404).json({ success: false, error: "Proposal not found" });
      }
      
      // Track view
      await storage.incrementProposalViews(proposal.id);
      await storage.recordProposalView({
        proposalId: proposal.id,
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
      });
      
      res.json({ success: true, proposal });
    } catch (error: any) {
      console.error("Error viewing proposal:", error);
      res.status(500).json({ success: false, error: "Failed to load proposal" });
    }
  });

  // Get proposal templates
  app.get("/api/proposal-templates", async (req, res) => {
    try {
      const templates = await storage.getProposalTemplates();
      res.json({ success: true, templates });
    } catch (error: any) {
      console.error("Error fetching proposal templates:", error);
      res.status(500).json({ success: false, error: "Failed to fetch templates" });
    }
  });

  // Get default proposal template
  app.get("/api/proposal-templates/default", async (req, res) => {
    try {
      const templateType = (req.query.type as string) || "proposal";
      const template = await storage.getDefaultProposalTemplate(templateType);
      if (!template) {
        return res.status(404).json({ success: false, error: "No default template found" });
      }
      res.json({ success: true, template });
    } catch (error: any) {
      console.error("Error fetching default template:", error);
      res.status(500).json({ success: false, error: "Failed to fetch template" });
    }
  });

  // Get proposal views
  app.get("/api/proposals/:id/views", async (req, res) => {
    try {
      const views = await storage.getProposalViews(parseInt(req.params.id));
      res.json({ success: true, views });
    } catch (error: any) {
      console.error("Error fetching proposal views:", error);
      res.status(500).json({ success: false, error: "Failed to fetch views" });
    }
  });

  // ============== ECOS ENDPOINTS ==============

  // --- Client Contracts ---
  
  // Create client contract
  app.post("/api/ecos/contracts", async (req, res) => {
    try {
      const validatedData = insertClientContractSchema.parse(req.body);
      const contract = await storage.createClientContract(validatedData);
      res.json({ success: true, contract });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating contract:", error);
        res.status(500).json({ success: false, error: "Failed to create contract" });
      }
    }
  });

  // Get contracts for client
  app.get("/api/ecos/contracts/:clientId", async (req, res) => {
    try {
      const contracts = await storage.getClientContracts(parseInt(req.params.clientId));
      res.json({ success: true, contracts });
    } catch (error: any) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ success: false, error: "Failed to fetch contracts" });
    }
  });

  // Get active contract for client
  app.get("/api/ecos/contracts/:clientId/active", async (req, res) => {
    try {
      const contract = await storage.getActiveClientContract(parseInt(req.params.clientId));
      res.json({ success: true, contract });
    } catch (error: any) {
      console.error("Error fetching active contract:", error);
      res.status(500).json({ success: false, error: "Failed to fetch active contract" });
    }
  });

  // Update contract
  app.patch("/api/ecos/contracts/:id", async (req, res) => {
    try {
      const contract = await storage.updateClientContract(parseInt(req.params.id), req.body);
      if (!contract) {
        return res.status(404).json({ success: false, error: "Contract not found" });
      }
      res.json({ success: true, contract });
    } catch (error: any) {
      console.error("Error updating contract:", error);
      res.status(500).json({ success: false, error: "Failed to update contract" });
    }
  });

  // Get expiring contracts
  app.get("/api/ecos/contracts-expiring", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 90;
      const contracts = await storage.getExpiringContracts(days);
      res.json({ success: true, contracts });
    } catch (error: any) {
      console.error("Error fetching expiring contracts:", error);
      res.status(500).json({ success: false, error: "Failed to fetch expiring contracts" });
    }
  });

  // --- Market Price Benchmarks ---

  // Create benchmark
  app.post("/api/ecos/benchmarks", async (req, res) => {
    try {
      const validatedData = insertMarketPriceBenchmarkSchema.parse(req.body);
      const benchmark = await storage.createBenchmark(validatedData);
      res.json({ success: true, benchmark });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating benchmark:", error);
        res.status(500).json({ success: false, error: "Failed to create benchmark" });
      }
    }
  });

  // Get all benchmarks
  app.get("/api/ecos/benchmarks", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const benchmarks = activeOnly 
        ? await storage.getActiveBenchmarks()
        : await storage.getBenchmarks();
      res.json({ success: true, benchmarks });
    } catch (error: any) {
      console.error("Error fetching benchmarks:", error);
      res.status(500).json({ success: false, error: "Failed to fetch benchmarks" });
    }
  });

  // Get benchmark for specific client profile
  app.get("/api/ecos/benchmarks/match", async (req, res) => {
    try {
      const { segment, region, contractMonths } = req.query;
      if (!segment || !region || !contractMonths) {
        return res.status(400).json({ success: false, error: "Missing required parameters: segment, region, contractMonths" });
      }
      const benchmark = await storage.getBenchmarkForClient(
        segment as string,
        region as string,
        parseInt(contractMonths as string)
      );
      res.json({ success: true, benchmark });
    } catch (error: any) {
      console.error("Error matching benchmark:", error);
      res.status(500).json({ success: false, error: "Failed to match benchmark" });
    }
  });

  // Update benchmark
  app.patch("/api/ecos/benchmarks/:id", async (req, res) => {
    try {
      const benchmark = await storage.updateBenchmark(parseInt(req.params.id), req.body);
      if (!benchmark) {
        return res.status(404).json({ success: false, error: "Benchmark not found" });
      }
      res.json({ success: true, benchmark });
    } catch (error: any) {
      console.error("Error updating benchmark:", error);
      res.status(500).json({ success: false, error: "Failed to update benchmark" });
    }
  });

  // Delete benchmark
  app.delete("/api/ecos/benchmarks/:id", async (req, res) => {
    try {
      const result = await storage.deleteBenchmark(parseInt(req.params.id));
      if (!result) {
        return res.status(404).json({ success: false, error: "Benchmark not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting benchmark:", error);
      res.status(500).json({ success: false, error: "Failed to delete benchmark" });
    }
  });

  // Get overdue benchmarks (for review reminders)
  app.get("/api/ecos/benchmarks/overdue", async (req, res) => {
    try {
      const benchmarks = await storage.getOverdueBenchmarks();
      res.json({ success: true, benchmarks });
    } catch (error: any) {
      console.error("Error fetching overdue benchmarks:", error);
      res.status(500).json({ success: false, error: "Failed to fetch overdue benchmarks" });
    }
  });

  // Get snapshots that used a specific benchmark
  app.get("/api/ecos/benchmarks/:id/usages", async (req, res) => {
    try {
      const benchmarkId = parseInt(req.params.id);
      if (isNaN(benchmarkId)) {
        return res.status(400).json({ success: false, error: "Invalid benchmark ID" });
      }
      const snapshots = await storage.getSnapshotsByBenchmark(benchmarkId);
      res.json({ success: true, snapshots });
    } catch (error: any) {
      console.error("Error fetching benchmark usages:", error);
      res.status(500).json({ success: false, error: "Failed to fetch benchmark usages" });
    }
  });

  // Mark benchmark as reviewed
  app.post("/api/ecos/benchmarks/:id/mark-reviewed", async (req, res) => {
    try {
      const { reviewedBy } = req.body;
      if (!reviewedBy) {
        return res.status(400).json({ success: false, error: "reviewedBy is required" });
      }
      const benchmark = await storage.markBenchmarkReviewed(parseInt(req.params.id), reviewedBy);
      if (!benchmark) {
        return res.status(404).json({ success: false, error: "Benchmark not found" });
      }
      res.json({ success: true, benchmark });
    } catch (error: any) {
      console.error("Error marking benchmark as reviewed:", error);
      res.status(500).json({ success: false, error: "Failed to mark benchmark as reviewed" });
    }
  });

  // --- ECOS Settings ---

  // Get all ECOS settings
  app.get("/api/ecos/settings", async (req, res) => {
    try {
      const settings = await storage.getAllEcosSettings();
      res.json({ success: true, settings });
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ success: false, error: "Failed to fetch settings" });
    }
  });

  // Get settings for segment
  app.get("/api/ecos/settings/:segment", async (req, res) => {
    try {
      const settings = await storage.getEcosSettings(req.params.segment);
      res.json({ success: true, settings });
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ success: false, error: "Failed to fetch settings" });
    }
  });

  // Upsert settings
  app.post("/api/ecos/settings", async (req, res) => {
    try {
      const validatedData = insertEcosSettingsSchema.parse(req.body);
      const settings = await storage.upsertEcosSettings(validatedData);
      res.json({ success: true, settings });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error upserting settings:", error);
        res.status(500).json({ success: false, error: "Failed to save settings" });
      }
    }
  });

  // --- ECOS Decision Logs ---

  // Create decision log
  app.post("/api/ecos/decisions", async (req, res) => {
    try {
      const validatedData = insertEcosDecisionLogSchema.parse(req.body);
      const log = await storage.createDecisionLog(validatedData);
      res.json({ success: true, log });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating decision log:", error);
        res.status(500).json({ success: false, error: "Failed to create decision log" });
      }
    }
  });

  // Get decision logs for client
  app.get("/api/ecos/decisions/client/:clientId", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ success: false, error: "Invalid client ID" });
      }
      const logs = await storage.getDecisionLogs(clientId);
      res.json({ success: true, logs });
    } catch (error: any) {
      console.error("Error fetching decision logs:", error);
      res.status(500).json({ success: false, error: "Failed to fetch decision logs" });
    }
  });

  // Get latest decision for client
  app.get("/api/ecos/decisions/client/:clientId/latest", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ success: false, error: "Invalid client ID" });
      }
      const log = await storage.getLatestDecisionLog(clientId);
      res.json({ success: true, log });
    } catch (error: any) {
      console.error("Error fetching latest decision:", error);
      res.status(500).json({ success: false, error: "Failed to fetch latest decision" });
    }
  });

  // Get decisions by status
  app.get("/api/ecos/decisions-by-status/:status", async (req, res) => {
    try {
      const logs = await storage.getDecisionLogsByStatus(req.params.status);
      res.json({ success: true, logs });
    } catch (error: any) {
      console.error("Error fetching decisions by status:", error);
      res.status(500).json({ success: false, error: "Failed to fetch decisions" });
    }
  });

  // Update decision log
  app.patch("/api/ecos/decisions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: "Invalid decision ID" });
      }
      const log = await storage.updateDecisionLog(id, req.body);
      if (!log) {
        return res.status(404).json({ success: false, error: "Decision log not found" });
      }
      res.json({ success: true, log });
    } catch (error: any) {
      console.error("Error updating decision log:", error);
      res.status(500).json({ success: false, error: "Failed to update decision log" });
    }
  });

  // --- ECOS Evaluation Engine ---

  // Evaluate a single client
  app.post("/api/ecos/evaluate/:clientId", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ success: false, error: "Invalid client ID" });
      }
      const triggerType = req.body.triggerType || "manual";
      const result = await evaluateClient(clientId, triggerType);
      res.json({ success: true, result });
    } catch (error: any) {
      console.error("Error evaluating client:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to evaluate client" });
    }
  });

  // Evaluate all active clients
  app.post("/api/ecos/evaluate-all", async (req, res) => {
    try {
      const triggerType = req.body.triggerType || "quarterly_check";
      const results = await evaluateAllClients(triggerType);
      res.json({ 
        success: true, 
        evaluated: results.length,
        results 
      });
    } catch (error: any) {
      console.error("Error evaluating all clients:", error);
      res.status(500).json({ success: false, error: "Failed to evaluate clients" });
    }
  });

  // Get client's current ECOS status (latest decision log)
  app.get("/api/ecos/status/:clientId", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ success: false, error: "Invalid client ID" });
      }
      const status = await getClientEcosStatus(clientId);
      res.json({ success: true, status });
    } catch (error: any) {
      console.error("Error getting client status:", error);
      res.status(500).json({ success: false, error: "Failed to get client status" });
    }
  });

  // --- Quarterly Reports ---

  // Create quarterly report
  app.post("/api/ecos/reports", async (req, res) => {
    try {
      const validatedData = insertQuarterlyReportSchema.parse(req.body);
      const report = await storage.createQuarterlyReport(validatedData);
      res.json({ success: true, report });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating report:", error);
        res.status(500).json({ success: false, error: "Failed to create report" });
      }
    }
  });

  // Get reports for client
  app.get("/api/ecos/reports/client/:clientId", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ success: false, error: "Invalid client ID" });
      }
      const reports = await storage.getQuarterlyReports(clientId);
      res.json({ success: true, reports });
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ success: false, error: "Failed to fetch reports" });
    }
  });

  // Get reports pending approval
  app.get("/api/ecos/reports-pending", async (req, res) => {
    try {
      const reports = await storage.getPendingApprovalReports();
      res.json({ success: true, reports });
    } catch (error: any) {
      console.error("Error fetching pending reports:", error);
      res.status(500).json({ success: false, error: "Failed to fetch pending reports" });
    }
  });

  // Approve report
  app.post("/api/ecos/reports/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: "Invalid report ID" });
      }
      const { approvedBy } = req.body;
      if (!approvedBy || typeof approvedBy !== "string") {
        return res.status(400).json({ success: false, error: "approvedBy is required and must be a string" });
      }
      const report = await storage.approveReport(id, approvedBy);
      if (!report) {
        return res.status(404).json({ success: false, error: "Report not found" });
      }
      res.json({ success: true, report });
    } catch (error: any) {
      console.error("Error approving report:", error);
      res.status(500).json({ success: false, error: "Failed to approve report" });
    }
  });

  // Update report
  app.patch("/api/ecos/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: "Invalid report ID" });
      }
      const report = await storage.updateQuarterlyReport(id, req.body);
      if (!report) {
        return res.status(404).json({ success: false, error: "Report not found" });
      }
      res.json({ success: true, report });
    } catch (error: any) {
      console.error("Error updating report:", error);
      res.status(500).json({ success: false, error: "Failed to update report" });
    }
  });

  // Generate quarterly report for client
  app.post("/api/ecos/reports/generate/:clientId", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ success: false, error: "Invalid client ID" });
      }

      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ success: false, error: "Client not found" });
      }

      // Get latest ECOS evaluation
      const latestDecision = await storage.getLatestDecisionLog(clientId);
      if (!latestDecision) {
        return res.status(400).json({ success: false, error: "No ECOS evaluation found. Run evaluation first." });
      }

      // Get active contract
      const contract = await storage.getActiveClientContract(clientId);

      // Calculate quarter period
      const now = new Date();
      const quarter = Math.ceil((now.getMonth() + 1) / 3);
      const year = now.getFullYear();
      const periodLabel = `Q${quarter} ${year}`;
      
      const quarterStartMonth = (quarter - 1) * 3;
      const periodStart = new Date(year, quarterStartMonth, 1).toISOString().split('T')[0];
      const periodEnd = new Date(year, quarterStartMonth + 3, 0).toISOString().split('T')[0];

      // Calculate health score (0-100)
      let healthScore = 100;
      if (latestDecision.statusResult === "above_band") {
        healthScore = 30;
      } else if (latestDecision.statusResult === "at_risk") {
        healthScore = 60;
      } else if (latestDecision.statusResult === "within_band") {
        healthScore = 90;
      }

      // Adjust for contract expiration
      if (latestDecision.contractRemainingMonths !== null) {
        if (latestDecision.contractRemainingMonths <= 3) {
          healthScore = Math.max(20, healthScore - 30);
        } else if (latestDecision.contractRemainingMonths <= 6) {
          healthScore = Math.max(40, healthScore - 15);
        }
      }

      // Generate market summary based on segment
      const segment = client.segment || "SME";
      const region = client.region || "Sudeste";
      const marketSummaryPt = `O mercado livre de energia na região ${region} manteve-se estável neste trimestre. ` +
        `Para o segmento ${segment}, os preços médios oscilaram entre R$${latestDecision.benchmarkLowerRmwh || "180"} ` +
        `e R$${latestDecision.benchmarkUpperRmwh || "250"}/MWh. ` +
        `A tendência de curto prazo indica manutenção dos níveis atuais.`;

      // Generate client position analysis
      const clientPriceR = latestDecision.clientPriceRmwh ? parseFloat(latestDecision.clientPriceRmwh) : null;
      let clientPositionPt = "";
      
      if (latestDecision.statusResult === "within_band") {
        clientPositionPt = `A ${client.companyName} encontra-se em posição favorável no mercado. ` +
          `O contrato atual com preço de R$${clientPriceR?.toFixed(2) || "-"}/MWh está dentro da faixa ótima de mercado. ` +
          `Recomendamos manter o contrato atual e monitorar oportunidades de renovação antecipada.`;
      } else if (latestDecision.statusResult === "at_risk") {
        clientPositionPt = `A ${client.companyName} encontra-se em posição de atenção no mercado. ` +
          `O contrato atual com preço de R$${clientPriceR?.toFixed(2) || "-"}/MWh está na parte superior da faixa de mercado. ` +
          `Recomendamos iniciar discussões sobre renovação para garantir melhores condições.`;
      } else if (latestDecision.statusResult === "above_band") {
        clientPositionPt = `A ${client.companyName} encontra-se pagando acima do mercado. ` +
          `O contrato atual com preço de R$${clientPriceR?.toFixed(2) || "-"}/MWh está ${latestDecision.potentialSavingsR ? 
            `R$${parseFloat(latestDecision.potentialSavingsR).toLocaleString('pt-BR')}/ano acima do ótimo` : 
            "significativamente acima da faixa de mercado"}. ` +
          `Recomendamos ação imediata de renegociação.`;
      } else {
        clientPositionPt = `Aguardando dados para análise completa da posição de ${client.companyName} no mercado.`;
      }

      // Calculate next review date (3 months from now)
      const nextReview = new Date(now);
      nextReview.setMonth(nextReview.getMonth() + 3);
      const nextReviewDate = nextReview.toISOString().split('T')[0];

      // Get benchmark median
      const benchmarkLower = latestDecision.benchmarkLowerRmwh ? parseFloat(latestDecision.benchmarkLowerRmwh) : null;
      const benchmarkUpper = latestDecision.benchmarkUpperRmwh ? parseFloat(latestDecision.benchmarkUpperRmwh) : null;
      const benchmarkMedian = benchmarkLower && benchmarkUpper ? ((benchmarkLower + benchmarkUpper) / 2).toString() : null;

      const reportData = {
        clientId,
        contractId: contract?.id || null,
        decisionLogId: latestDecision.id,
        periodLabel,
        periodStart,
        periodEnd,
        marketSummaryPt,
        clientPositionPt,
        healthScore,
        statusClassification: latestDecision.statusResult,
        recommendation: latestDecision.recommendation,
        explanationPt: latestDecision.explanationPt,
        currentPriceRmwh: latestDecision.clientPriceRmwh,
        benchmarkMedianRmwh: benchmarkMedian,
        optimisedReferencePriceRmwh: latestDecision.benchmarkLowerRmwh,
        estimatedAnnualSavingsR: latestDecision.potentialSavingsR,
        nextReviewDate,
        approved: false
      };

      const report = await storage.createQuarterlyReport(reportData);
      res.json({ success: true, report });
    } catch (error: any) {
      console.error("Error generating quarterly report:", error);
      res.status(500).json({ success: false, error: "Failed to generate quarterly report" });
    }
  });

  // --- ECOS Dashboard ---

  // Get ECOS dashboard stats
  app.get("/api/ecos/dashboard", async (req, res) => {
    try {
      const [
        clients,
        expiringContracts,
        aboveBandDecisions,
        atRiskDecisions,
        pendingReports
      ] = await Promise.all([
        storage.getClients(),
        storage.getExpiringContracts(90),
        storage.getDecisionLogsByStatus("above_band"),
        storage.getDecisionLogsByStatus("at_risk"),
        storage.getPendingApprovalReports()
      ]);

      res.json({
        success: true,
        dashboard: {
          totalClients: clients.length,
          expiringContractsCount: expiringContracts.length,
          aboveBandCount: aboveBandDecisions.length,
          atRiskCount: atRiskDecisions.length,
          pendingReportsCount: pendingReports.length,
          expiringContracts,
          aboveBandDecisions,
          atRiskDecisions,
          pendingReports
        }
      });
    } catch (error: any) {
      console.error("Error fetching dashboard:", error);
      res.status(500).json({ success: false, error: "Failed to fetch dashboard" });
    }
  });

  // --- Admin Audit Log ---

  // Get audit logs (legacy endpoint)
  app.get("/api/ecos/audit-log", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAdminAuditLogs(limit);
      res.json({ success: true, logs });
    } catch (error: any) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ success: false, error: "Failed to fetch audit logs" });
    }
  });

  // Get audit trail with filtering and pagination
  app.get("/api/audit-trail", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const filters = {
        actor: req.query.actor as string | undefined,
        action: req.query.action as string | undefined,
        entityType: req.query.entityType as string | undefined,
        entityId: req.query.entityId ? parseInt(req.query.entityId as string) : undefined,
        clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
        dealId: req.query.dealId as string | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 50,
      };
      const result = await storage.getAuditTrail(filters);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error fetching audit trail:", error);
      res.status(500).json({ success: false, error: "Failed to fetch audit trail" });
    }
  });
  
  // Verify audit trail hash chain integrity
  app.get("/api/audit-trail/verify", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const { verifyHashChain } = await import("./audit");
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
      const result = await verifyHashChain(dateFrom, dateTo);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error verifying audit trail:", error);
      res.status(500).json({ success: false, error: "Failed to verify audit trail" });
    }
  });
  
  // Export audit trail as CSV
  app.get("/api/audit-trail/export", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const filters = {
        actor: req.query.actor as string | undefined,
        action: req.query.action as string | undefined,
        entityType: req.query.entityType as string | undefined,
        entityId: req.query.entityId ? parseInt(req.query.entityId as string) : undefined,
        clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
        dealId: req.query.dealId as string | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        page: 1,
        pageSize: 10000, // Export up to 10k records
      };
      const { logs } = await storage.getAuditTrail(filters);
      
      // Build CSV
      const headers = [
        "timestamp", "actor", "actorRole", "action", "entityType", "entityId",
        "clientId", "dealId", "actorIp", "userAgent", "eventHash", "details"
      ];
      const rows = logs.map(log => [
        log.timestamp.toISOString(),
        log.actor,
        log.actorRole || "",
        log.action,
        log.entityType || "",
        log.entityId?.toString() || "",
        log.clientId?.toString() || "",
        log.dealId || "",
        log.actorIp || "",
        log.userAgent || "",
        log.eventHash || "",
        JSON.stringify(log.detailsJson || {})
      ]);
      
      const csvContent = [headers.join(","), ...rows.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )].join("\n");
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="audit-trail-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error: any) {
      console.error("Error exporting audit trail:", error);
      res.status(500).json({ success: false, error: "Failed to export audit trail" });
    }
  });
  
  // Saved audit filter presets
  app.get("/api/audit-filters", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const session = await storage.getAdminSession(sessionId);
      if (!session) return res.status(401).json({ success: false, error: "Session not found" });
      const filters = await storage.getSavedAuditFilters(session.userId);
      res.json({ success: true, filters });
    } catch (error: any) {
      console.error("Error fetching saved filters:", error);
      res.status(500).json({ success: false, error: "Failed to fetch saved filters" });
    }
  });
  
  app.post("/api/audit-filters", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const session = await storage.getAdminSession(sessionId);
      if (!session) return res.status(401).json({ success: false, error: "Session not found" });
      const { name, description, filtersJson } = req.body;
      if (!name || !filtersJson) {
        return res.status(400).json({ success: false, error: "Name and filters are required" });
      }
      const filter = await storage.createSavedAuditFilter({
        userId: session.userId,
        name,
        description,
        filtersJson,
      });
      res.json({ success: true, filter });
    } catch (error: any) {
      console.error("Error creating saved filter:", error);
      res.status(500).json({ success: false, error: "Failed to create saved filter" });
    }
  });
  
  app.delete("/api/audit-filters/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const session = await storage.getAdminSession(sessionId);
      if (!session) return res.status(401).json({ success: false, error: "Session not found" });
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSavedAuditFilter(id, session.userId);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Filter not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting saved filter:", error);
      res.status(500).json({ success: false, error: "Failed to delete saved filter" });
    }
  });

  // --- ECOS Contract Renewal Alerts ---

  // Get contracts requiring action (with computed alert levels)
  app.get("/api/ecos/contracts-requiring-action", async (req, res) => {
    try {
      const contracts = await storage.getContractsRequiringAction();
      const clients = await storage.getClients();
      const clientsMap = new Map(clients.map(c => [c.id, c]));
      
      const enrichedContracts = contracts.map(contract => ({
        ...contract,
        clientName: clientsMap.get(contract.clientId)?.companyName || `Client #${contract.clientId}`
      }));
      
      res.json({ success: true, contracts: enrichedContracts });
    } catch (error: any) {
      console.error("Error fetching contracts requiring action:", error);
      res.status(500).json({ success: false, error: "Failed to fetch contracts" });
    }
  });

  // Update contract renewal status
  app.patch("/api/ecos/contracts/:id/renewal-status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { renewalStatus, notes, reviewedBy } = req.body;
      
      if (!renewalStatus || !['hold', 'review', 'renegotiate'].includes(renewalStatus)) {
        return res.status(400).json({ success: false, error: "Invalid renewal status" });
      }
      
      const contract = await storage.updateContractRenewalStatus(id, renewalStatus, notes, reviewedBy);
      if (!contract) {
        return res.status(404).json({ success: false, error: "Contract not found" });
      }
      
      await storage.logAdminAction({
        actor: reviewedBy || 'admin',
        action: 'update_renewal_status',
        entityType: 'contract',
        entityId: id,
        detailsJson: { renewalStatus, notes }
      });
      
      res.json({ success: true, contract });
    } catch (error: any) {
      console.error("Error updating contract renewal status:", error);
      res.status(500).json({ success: false, error: "Failed to update contract" });
    }
  });

  // --- ECOS Benchmark Review Reminders ---

  // Get benchmarks requiring review
  app.get("/api/ecos/benchmarks-requiring-review", async (req, res) => {
    try {
      const benchmarks = await storage.getBenchmarksRequiringReview();
      res.json({ success: true, benchmarks });
    } catch (error: any) {
      console.error("Error fetching benchmarks requiring review:", error);
      res.status(500).json({ success: false, error: "Failed to fetch benchmarks" });
    }
  });

  // --- ECOS Audit Trail ---

  // Get audit trail for a client
  app.get("/api/ecos/audit-trail/:clientId", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const trail = await storage.getAuditTrailForClient(clientId);
      res.json({ success: true, trail });
    } catch (error: any) {
      console.error("Error fetching audit trail:", error);
      res.status(500).json({ success: false, error: "Failed to fetch audit trail" });
    }
  });

  // --- ECOS Enhanced Dashboard ---

  // Get full ECOS dashboard with alerts
  app.get("/api/ecos/dashboard-enhanced", async (req, res) => {
    try {
      const [
        clients,
        contractsRequiringAction,
        benchmarksRequiringReview,
        aboveBandDecisions,
        atRiskDecisions,
        pendingReports
      ] = await Promise.all([
        storage.getClients(),
        storage.getContractsRequiringAction(),
        storage.getBenchmarksRequiringReview(),
        storage.getDecisionLogsByStatus("above_band"),
        storage.getDecisionLogsByStatus("at_risk"),
        storage.getPendingApprovalReports()
      ]);

      const clientsMap = new Map(clients.map(c => [c.id, c]));
      
      const enrichedContracts = contractsRequiringAction.map(contract => ({
        ...contract,
        clientName: clientsMap.get(contract.clientId)?.companyName || `Client #${contract.clientId}`
      }));

      res.json({
        success: true,
        dashboard: {
          totalClients: clients.length,
          contractsRequiringAction: enrichedContracts,
          contractsRequiringActionCount: enrichedContracts.length,
          benchmarksRequiringReview,
          benchmarksRequiringReviewCount: benchmarksRequiringReview.length,
          aboveBandCount: aboveBandDecisions.length,
          atRiskCount: atRiskDecisions.length,
          pendingReportsCount: pendingReports.length,
          aboveBandDecisions,
          atRiskDecisions,
          pendingReports
        }
      });
    } catch (error: any) {
      console.error("Error fetching enhanced dashboard:", error);
      res.status(500).json({ success: false, error: "Failed to fetch dashboard" });
    }
  });

  // ============== DEAL OS ENDPOINTS ==============

  // Helper function to validate admin session for Deal OS
  const validateDealOsSession = async (req: Request, res: Response): Promise<boolean> => {
    const sessionId = req.headers["x-session-id"] as string;
    if (!sessionId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return false;
    }
    const session = await storage.getAdminSession(sessionId);
    if (!session || new Date(session.expiresAt) < new Date()) {
      res.status(401).json({ success: false, error: "Session expired or invalid" });
      return false;
    }
    return true;
  };
  
  // Helper to get session user ID
  const getSessionUserId = async (req: Request): Promise<string | undefined> => {
    const sessionId = req.headers["x-session-id"] as string;
    if (!sessionId) return undefined;
    const session = await storage.getAdminSession(sessionId);
    return session?.userId || undefined;
  };

  // ============== SUPPLIER RFQ ADAPTER ENDPOINTS ==============
  
  // Get all RFQ adapters for a supplier (includes version history)
  app.get("/api/suppliers/:id/rfq-adapters", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const supplierId = parseInt(req.params.id);
      const adapters = await storage.getSupplierRfqAdapters(supplierId);
      res.json({ success: true, adapters });
    } catch (error: any) {
      console.error("Error fetching RFQ adapters:", error);
      res.status(500).json({ success: false, error: "Failed to fetch adapters" });
    }
  });
  
  // Create new RFQ adapter version for a supplier (auto-retires previous ACTIVE)
  app.post("/api/suppliers/:id/rfq-adapters", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const supplierId = parseInt(req.params.id);
      const userId = await getSessionUserId(req);
      
      const adapterData = {
        ...req.body,
        supplierId,
        createdBy: userId,
      };
      
      const adapter = await storage.createSupplierRfqAdapter(adapterData);
      
      // Audit log
      await storage.logAdminAction({
        action: 'RFQ_ADAPTER_CREATED',
        entityType: 'supplier_rfq_adapter',
        entityId: adapter.id,
        actor: userId || 'system',
        detailsJson: { supplierId, version: adapter.version, name: adapter.name },
      });
      
      res.json({ success: true, adapter });
    } catch (error: any) {
      console.error("Error creating RFQ adapter:", error);
      res.status(500).json({ success: false, error: "Failed to create adapter" });
    }
  });
  
  // Get single RFQ adapter
  app.get("/api/rfq-adapters/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const adapter = await storage.getSupplierRfqAdapter(parseInt(req.params.id));
      if (!adapter) {
        return res.status(404).json({ success: false, error: "Adapter not found" });
      }
      res.json({ success: true, adapter });
    } catch (error: any) {
      console.error("Error fetching RFQ adapter:", error);
      res.status(500).json({ success: false, error: "Failed to fetch adapter" });
    }
  });
  
  // Retire RFQ adapter
  app.post("/api/rfq-adapters/:id/retire", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const adapterId = parseInt(req.params.id);
      const userId = await getSessionUserId(req) || 'system';
      
      const adapter = await storage.retireSupplierRfqAdapter(adapterId, userId);
      if (!adapter) {
        return res.status(404).json({ success: false, error: "Adapter not found" });
      }
      
      // Audit log
      await storage.logAdminAction({
        action: 'RFQ_ADAPTER_RETIRED',
        entityType: 'supplier_rfq_adapter',
        entityId: adapterId,
        actor: userId,
        detailsJson: { supplierId: adapter.supplierId, version: adapter.version },
      });
      
      res.json({ success: true, adapter });
    } catch (error: any) {
      console.error("Error retiring RFQ adapter:", error);
      res.status(500).json({ success: false, error: "Failed to retire adapter" });
    }
  });

  // ============== RFQ PACKET ENDPOINTS ==============
  
  // Generate RFQ packets for all suppliers on an RFO
  app.post("/api/rfo/:rfoId/generate-packets", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const rfoId = parseInt(req.params.rfoId);
      const userId = await getSessionUserId(req);
      
      // Get RFO details
      const rfo = await storage.getRfoRequest(rfoId);
      if (!rfo) {
        return res.status(404).json({ success: false, error: "RFO not found" });
      }
      
      // Get client details
      const client = await storage.getClient(rfo.clientId);
      if (!client) {
        return res.status(404).json({ success: false, error: "Client not found" });
      }
      
      // DOSSIER GATE: Check if client has a READY or LOCKED dossier
      const dossier = await storage.getClientDossier(rfo.clientId);
      if (!dossier) {
        return res.status(400).json({ 
          success: false, 
          error: "Client dossier is required before generating RFQ packets. Please create and complete the client dossier first.",
          errorCode: "DOSSIER_REQUIRED"
        });
      }
      if (dossier.status === 'DRAFT') {
        return res.status(400).json({ 
          success: false, 
          error: "Client dossier must be marked as READY before generating RFQ packets. Please review and mark the dossier as ready.",
          errorCode: "DOSSIER_NOT_READY"
        });
      }
      
      // Get suppliers on this RFO
      const supplierTracking = await storage.getRfoSupplierTracking(rfoId);
      
      // Import token utilities
      const { replaceTokens, buildTokenContext, validateRequiredFields, validateRequiredAttachments } = await import('./rfqTokens');
      
      const packets: any[] = [];
      const errors: any[] = [];
      
      for (const tracking of supplierTracking) {
        try {
          // Get active adapter for this supplier
          const adapter = await storage.getActiveSupplierRfqAdapter(tracking.supplierId);
          
          if (!adapter) {
            errors.push({ 
              supplierId: tracking.supplierId, 
              error: 'No active RFQ adapter configured for this supplier' 
            });
            continue;
          }
          
          // Get supplier contact
          const supplierContact = await storage.getPrimarySupplierContact(tracking.supplierId);
          
          // Build token context
          const tokenContext = buildTokenContext({
            client: {
              companyName: client.companyName || undefined,
              cnpj: client.cnpj || undefined,
            },
            rfo: {
              rfoNumber: rfo.rfoNumber,
              snapshotConsumptionKwh: rfo.snapshotConsumptionKwh || undefined,
              snapshotDemandaKw: rfo.snapshotDemandaKw || undefined,
              snapshotUc: rfo.snapshotUc || undefined,
              snapshotDistribuidora: rfo.snapshotDistribuidora || undefined,
              snapshotContractEnd: rfo.snapshotContractEnd || undefined,
              responseDeadline: rfo.responseDeadline,
            },
            supplierContact: {
              name: supplierContact?.name,
            },
          });
          
          // Get adapter configs
          const emailConfig = adapter.emailConfig as any || {};
          const whatsappConfig = adapter.whatsappConfig as any || {};
          const portalConfig = adapter.portalConfig as any || {};
          const requiredFieldsSchema = adapter.requiredFieldsSchema as any[] || [];
          const requiredAttachmentsSchema = adapter.requiredAttachmentsSchema as any[] || [];
          
          // Build resolved payload
          const generatedPayload = {
            email: {
              to: emailConfig.to || (supplierContact?.email ? [supplierContact.email] : []),
              cc: emailConfig.cc || [],
              subject: replaceTokens(emailConfig.subjectTemplate || '', tokenContext),
              body: replaceTokens(emailConfig.bodyTemplate || '', tokenContext),
            },
            whatsapp: {
              message: replaceTokens(whatsappConfig.messageTemplate || '', tokenContext),
            },
            portal: {
              url: portalConfig.url || '',
              instructions: replaceTokens(portalConfig.instructions || '', tokenContext),
            },
            requiredFields: {
              client_company_name: client.companyName,
              cnpj: client.cnpj,
              ucs: rfo.snapshotUc ? [rfo.snapshotUc] : [],
              annual_mwh: rfo.snapshotConsumptionKwh ? parseFloat(String(rfo.snapshotConsumptionKwh)) * 12 / 1000 : null,
              start_date: rfo.snapshotContractEnd,
            },
            attachments: [], // TODO: integrate with deal_documents / billUploads
          };
          
          // Validate required fields
          const fieldValidation = validateRequiredFields(requiredFieldsSchema, generatedPayload.requiredFields);
          const attachmentValidation = validateRequiredAttachments(requiredAttachmentsSchema, generatedPayload.attachments);
          
          const missingRequirements = [
            ...fieldValidation.missing.map(key => ({ type: 'field', key })),
            ...attachmentValidation.missing.map(key => ({ type: 'attachment', key })),
          ];
          
          const packetStatus = missingRequirements.length === 0 ? 'READY' : 'DRAFT';
          
          // Check if packet already exists for this RFO + supplier
          const existingPackets = await storage.getRfqPacketsForRfo(rfoId);
          const existingPacket = existingPackets.find(p => p.supplierId === tracking.supplierId);
          
          let packet;
          if (existingPacket) {
            // Update existing packet
            packet = await storage.updateRfqPacket(existingPacket.id, {
              adapterId: adapter.id,
              adapterVersion: adapter.version,
              packetStatus,
              generatedPayload,
              missingRequirements,
            });
          } else {
            // Create new packet
            packet = await storage.createRfqPacket({
              rfoRequestId: rfoId,
              supplierId: tracking.supplierId,
              adapterId: adapter.id,
              adapterVersion: adapter.version,
              generatedPayload,
              missingRequirements,
              createdBy: userId,
            });
            
            // Update status based on validation
            if (packetStatus !== 'DRAFT') {
              packet = await storage.updateRfqPacket(packet.id, { packetStatus });
            }
          }
          
          packets.push(packet);
        } catch (err: any) {
          errors.push({ 
            supplierId: tracking.supplierId, 
            error: err.message 
          });
        }
      }
      
      // Audit log
      await storage.logAdminAction({
        action: 'RFQ_PACKETS_GENERATED',
        entityType: 'rfo_request',
        entityId: rfoId,
        actor: userId || 'system',
        detailsJson: { 
          packetsCreated: packets.length, 
          errors: errors.length,
          supplierIds: packets.map(p => p?.supplierId) 
        },
      });
      
      res.json({ success: true, packets, errors });
    } catch (error: any) {
      console.error("Error generating RFQ packets:", error);
      res.status(500).json({ success: false, error: "Failed to generate packets" });
    }
  });
  
  // Get RFQ packets for an RFO
  app.get("/api/rfo/:rfoId/packets", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const rfoId = parseInt(req.params.rfoId);
      const packets = await storage.getRfqPacketsForRfo(rfoId);
      
      // Enrich with supplier names
      const enrichedPackets = await Promise.all(packets.map(async (packet) => {
        const supplier = await storage.getSupplier(packet.supplierId);
        return {
          ...packet,
          supplierName: supplier?.name || 'Unknown',
        };
      }));
      
      res.json({ success: true, packets: enrichedPackets });
    } catch (error: any) {
      console.error("Error fetching RFQ packets:", error);
      res.status(500).json({ success: false, error: "Failed to fetch packets" });
    }
  });
  
  // Get single RFQ packet
  app.get("/api/rfq-packets/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const packet = await storage.getRfqPacket(parseInt(req.params.id));
      if (!packet) {
        return res.status(404).json({ success: false, error: "Packet not found" });
      }
      
      // Enrich with supplier name
      const supplier = await storage.getSupplier(packet.supplierId);
      
      res.json({ 
        success: true, 
        packet: {
          ...packet,
          supplierName: supplier?.name || 'Unknown',
        }
      });
    } catch (error: any) {
      console.error("Error fetching RFQ packet:", error);
      res.status(500).json({ success: false, error: "Failed to fetch packet" });
    }
  });
  
  // Mark RFQ packet as sent
  app.post("/api/rfq-packets/:packetId/mark-sent", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const packetId = parseInt(req.params.packetId);
      const userId = await getSessionUserId(req) || 'system';
      const { sendMethodUsed, notes, communicationLogId } = req.body;
      
      if (!sendMethodUsed || !['EMAIL', 'WHATSAPP', 'PORTAL', 'MANUAL'].includes(sendMethodUsed)) {
        return res.status(400).json({ success: false, error: "Invalid sendMethodUsed" });
      }
      
      const packet = await storage.getRfqPacket(packetId);
      if (!packet) {
        return res.status(404).json({ success: false, error: "Packet not found" });
      }
      
      // Mark packet as sent
      const updatedPacket = await storage.markRfqPacketSent(packetId, userId, sendMethodUsed, communicationLogId);
      
      // DOSSIER LOCK & SNAPSHOT: Lock dossier on first send, create snapshot for every RFQ send
      const rfo = await storage.getRfoRequest(packet.rfoRequestId);
      if (rfo) {
        const dossier = await storage.getClientDossier(rfo.clientId);
        if (dossier) {
          // Lock the dossier if not already locked
          if (dossier.status !== 'LOCKED') {
            await storage.lockClientDossier(dossier.id, userId);
            
            // Audit log for first lock
            await storage.logAdminAction({
              action: 'DOSSIER_LOCKED_FOR_RFQ',
              entityType: 'client_dossier',
              entityId: dossier.id,
              actor: userId,
              detailsJson: { 
                clientId: rfo.clientId,
                rfoRequestId: packet.rfoRequestId,
                packetId 
              },
            });
          }
          
          // Always create immutable snapshot for every RFQ send (audit trail)
          await storage.createDossierSnapshot(dossier.id, 'RFQ', packet.rfoRequestId, userId);
        }
      }
      
      // Update RFO supplier tracking status
      const rfoTracking = await storage.getRfoSupplierTracking(packet.rfoRequestId);
      const tracking = rfoTracking.find(t => t.supplierId === packet.supplierId);
      if (tracking) {
        await storage.updateRfoSupplierTracking(tracking.id, {
          sentStatus: 'sent',
          sentDate: new Date(),
          sentMethod: sendMethodUsed.toLowerCase(),
        });
      }
      
      // Audit log
      await storage.logAdminAction({
        action: 'RFQ_PACKET_SENT',
        entityType: 'rfq_packet',
        entityId: packetId,
        actor: userId,
        detailsJson: { 
          sendMethodUsed, 
          rfoRequestId: packet.rfoRequestId,
          supplierId: packet.supplierId 
        },
      });
      
      res.json({ success: true, packet: updatedPacket });
    } catch (error: any) {
      console.error("Error marking packet as sent:", error);
      res.status(500).json({ success: false, error: "Failed to mark packet as sent" });
    }
  });
  
  // Record manual send for RFQ (sent outside system)
  app.post("/api/rfo/:rfoId/record-manual-send", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const rfoId = parseInt(req.params.rfoId);
      const userId = await getSessionUserId(req) || 'system';
      const { supplierId, channel, notes } = req.body;
      
      if (!supplierId) {
        return res.status(400).json({ success: false, error: "supplierId is required" });
      }
      if (!channel || !['EMAIL', 'WHATSAPP', 'PHONE', 'PORTAL', 'OTHER'].includes(channel)) {
        return res.status(400).json({ success: false, error: "channel must be EMAIL, WHATSAPP, PHONE, PORTAL, or OTHER" });
      }
      if (!notes || notes.trim().length === 0) {
        return res.status(400).json({ success: false, error: "notes are required for manual sends" });
      }
      
      const rfo = await storage.getRfoRequest(rfoId);
      if (!rfo) {
        return res.status(404).json({ success: false, error: "RFO not found" });
      }
      
      const supplier = await storage.getSupplier(supplierId);
      if (!supplier) {
        return res.status(404).json({ success: false, error: "Supplier not found" });
      }
      
      // DOSSIER GATE: Check if client has a READY or LOCKED dossier
      const dossier = await storage.getClientDossier(rfo.clientId);
      if (!dossier) {
        return res.status(400).json({ 
          success: false, 
          error: "Client dossier is required before sending RFQ. Please create and complete the client dossier first.",
          errorCode: "DOSSIER_REQUIRED"
        });
      }
      if (dossier.status === 'DRAFT') {
        return res.status(400).json({ 
          success: false, 
          error: "Client dossier must be marked as READY before sending RFQ. Please review and mark the dossier as ready.",
          errorCode: "DOSSIER_NOT_READY"
        });
      }
      
      // Create manual send packet
      const packet = await storage.recordManualSend(rfoId, supplierId, userId, channel, notes);
      
      // DOSSIER LOCK & SNAPSHOT: Lock dossier on first send, create snapshot for every RFQ send
      if (dossier.status !== 'LOCKED') {
        // Lock the dossier
        await storage.lockClientDossier(dossier.id, userId);
        
        // Audit log for first lock
        await storage.logAdminAction({
          action: 'DOSSIER_LOCKED_FOR_RFQ',
          entityType: 'client_dossier',
          entityId: dossier.id,
          actor: userId,
          detailsJson: { 
            clientId: rfo.clientId,
            rfoRequestId: rfoId,
            packetId: packet.id 
          },
        });
      }
      
      // Always create immutable snapshot for every RFQ send (audit trail)
      await storage.createDossierSnapshot(dossier.id, 'RFQ', rfoId, userId);
      
      // Update RFO supplier tracking status
      const rfoTracking = await storage.getRfoSupplierTracking(rfoId);
      const tracking = rfoTracking.find(t => t.supplierId === supplierId);
      if (tracking) {
        await storage.updateRfoSupplierTracking(tracking.id, {
          sentStatus: 'sent',
          sentDate: new Date(),
          sentMethod: 'manual',
        });
      }
      
      // Audit log
      await storage.logAdminAction({
        action: 'RFQ_MANUAL_SEND',
        entityType: 'rfq_packet',
        entityId: packet.id,
        actor: userId,
        detailsJson: { 
          rfoRequestId: rfoId,
          supplierId,
          channel,
          notes 
        },
      });
      
      res.json({ success: true, packet });
    } catch (error: any) {
      console.error("Error recording manual send:", error);
      res.status(500).json({ success: false, error: "Failed to record manual send" });
    }
  });

  // --- Client Dossiers ---

  // Get client dossier
  app.get("/api/clients/:id/dossier", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const clientId = parseInt(req.params.id);
      const dossier = await storage.getClientDossier(clientId);
      
      if (!dossier) {
        return res.json({ success: true, dossier: null });
      }
      
      // Get snapshots if any
      const snapshots = await storage.getDossierSnapshots(dossier.id);
      
      res.json({ success: true, dossier, snapshots });
    } catch (error: any) {
      console.error("Error fetching dossier:", error);
      res.status(500).json({ success: false, error: "Failed to fetch dossier" });
    }
  });

  // Create client dossier
  app.post("/api/clients/:id/dossier", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const clientId = parseInt(req.params.id);
      const userId = await getSessionUserId(req) || 'system';
      
      // Check if dossier already exists
      const existing = await storage.getClientDossier(clientId);
      if (existing) {
        return res.status(400).json({ success: false, error: "Dossier already exists for this client" });
      }
      
      // Get client info
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ success: false, error: "Client not found" });
      }
      
      const dossierData = {
        clientId,
        legalName: req.body.legalName || client.companyName,
        tradeName: req.body.tradeName || null,
        cnpj: req.body.cnpj || client.cnpj || '',
        distributor: req.body.distributor || null,
        submarket: req.body.submarket || null,
        connectionType: req.body.connectionType || null,
        eligibilityType: req.body.eligibilityType || 'NOT_ELIGIBLE_YET',
        annualConsumptionMWh: req.body.annualConsumptionMWh || null,
        averageMonthlyMWh: req.body.averageMonthlyMWh || null,
        peakDemandKW: req.body.peakDemandKW || null,
        numberOfUCs: req.body.numberOfUCs || 1,
        tariffClass: req.body.tariffClass || null,
        dataSources: req.body.dataSources || ['MANUAL'],
        confidenceScore: req.body.confidenceScore || 'LOW',
        opsNotes: req.body.opsNotes || null,
        createdBy: userId,
        updatedBy: userId,
      };
      
      const dossier = await storage.createClientDossier(dossierData);
      
      // Audit log
      await storage.logAdminAction({
        action: 'DOSSIER_CREATED',
        entityType: 'client_dossier',
        entityId: dossier.id,
        actor: userId,
        detailsJson: { clientId },
      });
      
      res.json({ success: true, dossier });
    } catch (error: any) {
      console.error("Error creating dossier:", error);
      res.status(500).json({ success: false, error: "Failed to create dossier" });
    }
  });

  // Auto-generate dossier from OCR/consumption data
  app.post("/api/clients/:id/dossier/generate", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const clientId = parseInt(req.params.id);
      const userId = await getSessionUserId(req) || 'system';
      
      // Check if dossier already exists
      const existing = await storage.getClientDossier(clientId);
      if (existing) {
        return res.status(400).json({ success: false, error: "Dossier already exists for this client. Use PATCH to update." });
      }
      
      // Get client info
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ success: false, error: "Client not found" });
      }
      
      // Get bill uploads (OCR data)
      const bills = await storage.getBillUploads(clientId);
      const verifiedBills = bills.filter(b => b.ocrStatus === 'success' || b.ocrStatus === 'manual');
      
      // Get consumption profiles
      const profiles = await storage.getConsumptionProfiles(clientId);
      
      // Calculate consumption metrics from bills
      let totalConsumptionKwh = 0;
      let totalDemandKw = 0;
      let billCount = 0;
      let ucCodes = new Set<string>();
      let distributor: string | null = null;
      
      for (const bill of verifiedBills) {
        if (bill.consumoKwh) {
          totalConsumptionKwh += parseFloat(bill.consumoKwh.toString());
          billCount++;
        }
        if (bill.demandaKw) {
          totalDemandKw = Math.max(totalDemandKw, parseFloat(bill.demandaKw.toString()));
        }
        if (bill.ucCode) {
          ucCodes.add(bill.ucCode);
        }
        if (bill.distribuidora && !distributor) {
          distributor = bill.distribuidora;
        }
      }
      
      // Calculate from profiles if available
      for (const profile of profiles) {
        if (profile.distributor && !distributor) {
          distributor = profile.distributor;
        }
        if (profile.demandKw) {
          totalDemandKw = Math.max(totalDemandKw, parseFloat(profile.demandKw.toString()));
        }
        if (profile.monthlyConsumptionKwh && typeof profile.monthlyConsumptionKwh === 'object') {
          const monthly = profile.monthlyConsumptionKwh as Record<string, number>;
          for (const val of Object.values(monthly)) {
            if (typeof val === 'number') {
              totalConsumptionKwh += val;
              billCount++;
            }
          }
        }
      }
      
      // Calculate annual and monthly averages
      const averageMonthlyKwh = billCount > 0 ? totalConsumptionKwh / billCount : 0;
      const annualKwh = billCount >= 12 ? totalConsumptionKwh : averageMonthlyKwh * 12;
      const annualMWh = annualKwh / 1000;
      const averageMonthlyMWh = averageMonthlyKwh / 1000;
      
      // Determine eligibility based on consumption
      let eligibilityType = 'NOT_ELIGIBLE_YET';
      if (annualMWh >= 500) {
        eligibilityType = 'ACL_DIRECT'; // >= 500 MWh/year = direct ACL eligible
      } else if (annualMWh >= 50) {
        eligibilityType = 'ACL_VAREJISTA'; // >= 50 MWh/year = can join via varejista
      }
      
      // Determine connection type based on demand
      const connectionType = totalDemandKw > 0 ? 'GROUP_A' : null;
      
      // Determine data sources
      const dataSources: string[] = [];
      if (verifiedBills.length > 0) dataSources.push('OCR');
      if (profiles.length > 0) dataSources.push('CLIENT_CONFIRMATION');
      if (dataSources.length === 0) dataSources.push('MANUAL');
      
      // Determine confidence score
      let confidenceScore = 'LOW';
      if (verifiedBills.length >= 6 || (profiles.length > 0 && verifiedBills.length >= 3)) {
        confidenceScore = 'HIGH';
      } else if (verifiedBills.length >= 3 || profiles.length > 0) {
        confidenceScore = 'MEDIUM';
      }
      
      // Determine submarket from distributor (basic mapping)
      let submarket: string | null = null;
      if (distributor) {
        const distLower = distributor.toLowerCase();
        if (distLower.includes('cemig') || distLower.includes('light') || distLower.includes('enel') || distLower.includes('cpfl')) {
          submarket = 'SE/CO';
        } else if (distLower.includes('copel') || distLower.includes('celesc') || distLower.includes('rge')) {
          submarket = 'S';
        } else if (distLower.includes('coelba') || distLower.includes('celpe') || distLower.includes('cosern')) {
          submarket = 'NE';
        } else if (distLower.includes('celpa') || distLower.includes('eletrobras')) {
          submarket = 'N';
        }
      }
      
      const dossierData = {
        clientId,
        legalName: client.companyName,
        tradeName: null,
        cnpj: client.cnpj || '',
        distributor,
        submarket,
        connectionType,
        eligibilityType,
        annualConsumptionMWh: annualMWh > 0 ? annualMWh.toFixed(2) : null,
        averageMonthlyMWh: averageMonthlyMWh > 0 ? averageMonthlyMWh.toFixed(2) : null,
        peakDemandKW: totalDemandKw > 0 ? totalDemandKw.toFixed(2) : null,
        numberOfUCs: ucCodes.size || 1,
        tariffClass: null,
        dataSources,
        confidenceScore,
        opsNotes: `Auto-generated from ${verifiedBills.length} bills and ${profiles.length} consumption profiles.`,
        createdBy: userId,
        updatedBy: userId,
      };
      
      const dossier = await storage.createClientDossier(dossierData);
      
      // Audit log
      await storage.logAdminAction({
        action: 'DOSSIER_AUTO_GENERATED',
        entityType: 'client_dossier',
        entityId: dossier.id,
        actor: userId,
        detailsJson: { 
          clientId, 
          billsUsed: verifiedBills.length, 
          profilesUsed: profiles.length,
          confidenceScore 
        },
      });
      
      res.json({ 
        success: true, 
        dossier,
        generationStats: {
          billsAnalyzed: verifiedBills.length,
          profilesAnalyzed: profiles.length,
          ucsDetected: ucCodes.size,
          confidenceScore
        }
      });
    } catch (error: any) {
      console.error("Error generating dossier:", error);
      res.status(500).json({ success: false, error: "Failed to generate dossier" });
    }
  });

  // Update client dossier
  app.patch("/api/dossiers/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const dossierId = parseInt(req.params.id);
      const userId = await getSessionUserId(req) || 'system';
      
      const dossier = await storage.getDossierById(dossierId);
      if (!dossier) {
        return res.status(404).json({ success: false, error: "Dossier not found" });
      }
      
      if (dossier.status === 'LOCKED') {
        return res.status(400).json({ success: false, error: "Cannot edit a locked dossier" });
      }
      
      // Extract allowed fields
      const allowedFields = [
        'legalName', 'tradeName', 'cnpj', 'distributor', 'submarket', 
        'connectionType', 'eligibilityType', 'annualConsumptionMWh',
        'averageMonthlyMWh', 'peakDemandKW', 'numberOfUCs', 'tariffClass',
        'dataSources', 'confidenceScore', 'opsNotes'
      ];
      
      const updateData: any = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      
      const updated = await storage.updateClientDossier(dossierId, updateData, userId);
      
      if (!updated) {
        return res.status(400).json({ success: false, error: "Failed to update dossier" });
      }
      
      // Audit log
      await storage.logAdminAction({
        action: 'DOSSIER_UPDATED',
        entityType: 'client_dossier',
        entityId: dossierId,
        actor: userId,
        detailsJson: { changes: updateData },
      });
      
      res.json({ success: true, dossier: updated });
    } catch (error: any) {
      console.error("Error updating dossier:", error);
      res.status(500).json({ success: false, error: "Failed to update dossier" });
    }
  });

  // Mark dossier as ready
  app.post("/api/dossiers/:id/mark-ready", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const dossierId = parseInt(req.params.id);
      const userId = await getSessionUserId(req) || 'system';
      
      const dossier = await storage.getDossierById(dossierId);
      if (!dossier) {
        return res.status(404).json({ success: false, error: "Dossier not found" });
      }
      
      if (dossier.status === 'LOCKED') {
        return res.status(400).json({ success: false, error: "Dossier is already locked" });
      }
      
      // Validate required fields for READY status
      const requiredFields = ['legalName', 'cnpj', 'distributor', 'eligibilityType', 'annualConsumptionMWh'];
      const missing = requiredFields.filter(field => !dossier[field as keyof typeof dossier]);
      
      if (missing.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: `Missing required fields: ${missing.join(', ')}`,
          missing 
        });
      }
      
      const updated = await storage.markDossierReady(dossierId, userId);
      
      if (!updated) {
        return res.status(400).json({ success: false, error: "Failed to mark dossier as ready" });
      }
      
      // Audit log
      await storage.logAdminAction({
        action: 'DOSSIER_MARKED_READY',
        entityType: 'client_dossier',
        entityId: dossierId,
        actor: userId,
        detailsJson: {},
      });
      
      res.json({ success: true, dossier: updated });
    } catch (error: any) {
      console.error("Error marking dossier ready:", error);
      res.status(500).json({ success: false, error: "Failed to mark dossier as ready" });
    }
  });

  // Get dossier snapshot
  app.get("/api/dossier-snapshots/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const snapshotId = parseInt(req.params.id);
      const snapshot = await storage.getDossierSnapshot(snapshotId);
      
      if (!snapshot) {
        return res.status(404).json({ success: false, error: "Snapshot not found" });
      }
      
      res.json({ success: true, snapshot });
    } catch (error: any) {
      console.error("Error fetching dossier snapshot:", error);
      res.status(500).json({ success: false, error: "Failed to fetch snapshot" });
    }
  });

  // Export dossier as PDF (supplier-facing)
  app.get("/api/dossiers/:id/pdf", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const dossierId = parseInt(req.params.id);
      const dossier = await storage.getDossierById(dossierId);
      
      if (!dossier) {
        return res.status(404).json({ success: false, error: "Dossier not found" });
      }
      
      // Map eligibility types to Portuguese labels
      const eligibilityLabels: Record<string, string> = {
        'ACL_DIRECT': 'Elegível para ACL (Consumidor Livre)',
        'ACL_VAREJISTA': 'Elegível para ACL via Varejista',
        'NOT_ELIGIBLE_YET': 'Não elegível / Em análise'
      };
      
      const submarketLabels: Record<string, string> = {
        'SE/CO': 'Sudeste/Centro-Oeste',
        'S': 'Sul',
        'NE': 'Nordeste',
        'N': 'Norte'
      };
      
      const connectionLabels: Record<string, string> = {
        'GROUP_A': 'Grupo A (Alta/Média Tensão)',
        'GROUP_B': 'Grupo B (Baixa Tensão)'
      };
      
      // Generate HTML for PDF
      const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Perfil de Consumo — Cliente Ótima Energia</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0066cc; padding-bottom: 20px; }
    .header h1 { color: #0066cc; font-size: 24px; margin-bottom: 5px; }
    .header p { color: #666; font-size: 12px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 14px; font-weight: bold; color: #0066cc; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    .row { display: flex; margin-bottom: 8px; }
    .label { width: 200px; color: #666; font-size: 12px; }
    .value { flex: 1; font-size: 12px; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
    th { background: #f5f5f5; color: #333; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .badge-eligible { background: #e6f7e6; color: #2e7d32; }
    .badge-varejista { background: #fff3e0; color: #ef6c00; }
    .badge-pending { background: #fce4ec; color: #c62828; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 10px; border-top: 1px solid #ddd; padding-top: 20px; }
    .logo-placeholder { font-size: 20px; font-weight: bold; color: #0066cc; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-placeholder">ÓTIMA ENERGIA</div>
    <h1>Perfil de Consumo</h1>
    <p>Documento gerado para fins de cotação no Mercado Livre de Energia</p>
  </div>
  
  <div class="section">
    <div class="section-title">Identificação do Cliente</div>
    <div class="row"><span class="label">Razão Social:</span><span class="value">${dossier.legalName}</span></div>
    ${dossier.tradeName ? `<div class="row"><span class="label">Nome Fantasia:</span><span class="value">${dossier.tradeName}</span></div>` : ''}
    <div class="row"><span class="label">CNPJ:</span><span class="value">${dossier.cnpj || 'Não informado'}</span></div>
  </div>
  
  <div class="section">
    <div class="section-title">Estrutura Energética</div>
    <div class="row"><span class="label">Distribuidora:</span><span class="value">${dossier.distributor || 'Não informado'}</span></div>
    <div class="row"><span class="label">Submercado:</span><span class="value">${dossier.submarket ? submarketLabels[dossier.submarket] || dossier.submarket : 'Não informado'}</span></div>
    <div class="row"><span class="label">Tipo de Conexão:</span><span class="value">${dossier.connectionType ? connectionLabels[dossier.connectionType] || dossier.connectionType : 'Não informado'}</span></div>
    <div class="row"><span class="label">Classe Tarifária:</span><span class="value">${dossier.tariffClass || 'Não informado'}</span></div>
    <div class="row"><span class="label">Número de UCs:</span><span class="value">${dossier.numberOfUCs || 1}</span></div>
  </div>
  
  <div class="section">
    <div class="section-title">Perfil de Consumo</div>
    <table>
      <thead>
        <tr>
          <th>Métrica</th>
          <th>Valor</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Consumo Anual</td>
          <td><strong>${dossier.annualConsumptionMWh ? parseFloat(dossier.annualConsumptionMWh.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' MWh' : 'Não calculado'}</strong></td>
        </tr>
        <tr>
          <td>Consumo Médio Mensal</td>
          <td>${dossier.averageMonthlyMWh ? parseFloat(dossier.averageMonthlyMWh.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' MWh' : 'Não calculado'}</td>
        </tr>
        <tr>
          <td>Demanda de Pico</td>
          <td>${dossier.peakDemandKW ? parseFloat(dossier.peakDemandKW.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' kW' : 'Não informado'}</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Classificação de Elegibilidade</div>
    <div class="row">
      <span class="label">Status:</span>
      <span class="value">
        <span class="badge ${dossier.eligibilityType === 'ACL_DIRECT' ? 'badge-eligible' : dossier.eligibilityType === 'ACL_VAREJISTA' ? 'badge-varejista' : 'badge-pending'}">
          ${eligibilityLabels[dossier.eligibilityType || 'NOT_ELIGIBLE_YET']}
        </span>
      </span>
    </div>
  </div>
  
  <div class="footer">
    <p>Documento gerado automaticamente pela plataforma Ótima Energia</p>
    <p>Data de geração: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
    <p>Este documento é válido apenas para fins de cotação e não constitui proposta comercial.</p>
  </div>
</body>
</html>
      `;
      
      // Use puppeteer to generate PDF
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
      });
      
      await browser.close();
      
      // Set headers for PDF download
      const filename = `dossie_${dossier.legalName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
      
    } catch (error: any) {
      console.error("Error generating dossier PDF:", error);
      res.status(500).json({ success: false, error: "Failed to generate PDF" });
    }
  });

  // --- Deal Registry ---

  // Get all deals
  app.get("/api/deals", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const { status, owner, clientId } = req.query;
      
      let deals;
      if (clientId) {
        deals = await storage.getDealsForClient(parseInt(clientId as string));
      } else if (status && DEAL_STATES.includes(status as DealState)) {
        deals = await storage.getDealsByStatus(status as DealState);
      } else if (owner) {
        deals = await storage.getDealsByOwner(owner as string);
      } else {
        deals = await storage.getDeals();
      }
      
      // Enrich with client and supplier info
      const clients = await storage.getClients();
      const suppliers = await storage.getSuppliers();
      const clientsMap = new Map(clients.map(c => [c.id, c]));
      const suppliersMap = new Map(suppliers.map(s => [s.id, s]));
      
      const enrichedDeals = deals.map(deal => ({
        ...deal,
        client: clientsMap.get(deal.clientId),
        supplier: deal.supplierId ? suppliersMap.get(deal.supplierId) : null
      }));
      
      res.json({ success: true, deals: enrichedDeals });
    } catch (error: any) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ success: false, error: "Failed to fetch deals" });
    }
  });

  // Get Deal OS dashboard
  app.get("/api/deals/dashboard", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const dashboard = await storage.getDealOsDashboard();
      res.json({ success: true, dashboard });
    } catch (error: any) {
      console.error("Error fetching Deal OS dashboard:", error);
      res.status(500).json({ success: false, error: "Failed to fetch dashboard" });
    }
  });

  // Get single deal with full details
  app.get("/api/deals/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const deal = await storage.getDeal(req.params.id);
      if (!deal) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }
      
      // Get related data
      const [client, supplier, quotes, transitions, commissionEvents, documents] = await Promise.all([
        storage.getClient(deal.clientId),
        deal.supplierId ? storage.getSupplier(deal.supplierId) : null,
        storage.getDealQuotes(deal.id),
        storage.getDealStateTransitions(deal.id),
        storage.getDealCommissionEvents(deal.id),
        storage.getDealDocuments(deal.id)
      ]);
      
      res.json({ 
        success: true, 
        deal: {
          ...deal,
          client,
          supplier,
          quotes,
          transitions,
          commissionEvents,
          documents
        }
      });
    } catch (error: any) {
      console.error("Error fetching deal:", error);
      res.status(500).json({ success: false, error: "Failed to fetch deal" });
    }
  });

  // Create new deal
  app.post("/api/deals", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const session = await storage.getAdminSession(sessionId);
      const user = session ? await storage.getUser(session.userId) : null;
      
      const validatedData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(validatedData);
      
      await logAuditEvent({
        actor: user?.username || "system",
        actorRole: user?.role || null,
        actorIp: req.ip || null,
        userAgent: req.get("User-Agent") || null,
        action: "DEAL_CREATED",
        entityType: "deal",
        entityId: null,
        dealId: deal.id,
        clientId: deal.clientId || null,
        detailsJson: { clientId: deal.clientId, owner: deal.owner, status: deal.status }
      });
      
      res.json({ success: true, deal });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating deal:", error);
        res.status(500).json({ success: false, error: "Failed to create deal" });
      }
    }
  });

  // Update deal
  app.patch("/api/deals/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const session = await storage.getAdminSession(sessionId);
      const user = session ? await storage.getUser(session.userId) : null;
      
      const deal = await storage.updateDeal(req.params.id, req.body);
      if (!deal) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }
      
      await logAuditEvent({
        actor: user?.username || "system",
        actorRole: user?.role || null,
        actorIp: req.ip || null,
        userAgent: req.get("User-Agent") || null,
        action: "DEAL_UPDATED",
        entityType: "deal",
        entityId: null,
        dealId: deal.id,
        clientId: deal.clientId || null,
        detailsJson: { updates: Object.keys(req.body) }
      });
      
      res.json({ success: true, deal });
    } catch (error: any) {
      console.error("Error updating deal:", error);
      res.status(500).json({ success: false, error: "Failed to update deal" });
    }
  });

  // --- Deal State Machine ---

  // Get valid transitions for a deal
  app.get("/api/deals/:id/transitions", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const deal = await storage.getDeal(req.params.id);
      if (!deal) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }
      
      const currentState = deal.status as DealState;
      const validTransitions = DEAL_STATE_TRANSITIONS[currentState] || [];
      
      res.json({ 
        success: true, 
        currentState,
        validTransitions,
        allStates: DEAL_STATES
      });
    } catch (error: any) {
      console.error("Error fetching transitions:", error);
      res.status(500).json({ success: false, error: "Failed to fetch transitions" });
    }
  });

  // Transition deal state (with HARD compliance enforcement)
  app.post("/api/deals/:id/transition", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const { 
        toState, triggeredBy, triggeredByType, reason, notes, requiresApproval,
        // LOST transition fields (required when transitioning to LOST)
        lostReasonCategory, lostSupplierId, lostNotes,
        // Admin override fields (only admins can use)
        adminOverride, overrideConfirmation, overrideReason
      } = req.body;
      
      if (!toState || !triggeredBy || !triggeredByType) {
        return res.status(400).json({ 
          success: false, 
          error: "toState, triggeredBy, and triggeredByType are required" 
        });
      }
      
      if (!DEAL_STATES.includes(toState)) {
        return res.status(400).json({ success: false, error: `Invalid state: ${toState}` });
      }
      
      if (!['user', 'system', 'ai'].includes(triggeredByType)) {
        return res.status(400).json({ success: false, error: "triggeredByType must be 'user', 'system', or 'ai'" });
      }
      
      // Get current deal to know fromState
      const deal = await storage.getDeal(req.params.id);
      if (!deal) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }
      
      // Get session for role check
      const sessionId = req.headers["x-session-id"] as string;
      const session = await storage.getAdminSession(sessionId);
      const user = session ? await storage.getUser(session.userId) : null;
      
      // LOST TRANSITION: Require structured reason taxonomy
      if (toState === 'LOST') {
        if (!lostReasonCategory) {
          return res.status(400).json({
            success: false,
            error: "lostReasonCategory is required when marking a deal as LOST",
            requiredFields: ['lostReasonCategory'],
            validReasons: [
              'CLIENT_WITHDREW', 'CLIENT_BUDGET_ISSUE', 'CLIENT_INTERNAL_DECISION', 
              'CLIENT_CREDIT_REJECTED', 'CLIENT_DOCS_NOT_PROVIDED',
              'SUPPLIER_NO_QUOTE', 'SUPPLIER_PRICE_UNCOMPETITIVE', 'SUPPLIER_TERMS_REJECTED', 'SUPPLIER_CREDIT_DENIED',
              'LOST_TO_COMPETITOR', 'LOST_TO_DIRECT_SUPPLIER', 'LOST_TO_INCUMBENT',
              'DEAL_STALLED_TOO_LONG', 'COMPLIANCE_FAILURE', 'METERING_ISSUE', 'CONTRACT_NEGOTIATION_FAILED',
              'DUPLICATE_DEAL', 'TEST_DEAL', 'OTHER'
            ]
          });
        }
        
        // If reason is OTHER, notes are required
        if (lostReasonCategory === 'OTHER' && !lostNotes) {
          return res.status(400).json({
            success: false,
            error: "lostNotes is required when lostReasonCategory is 'OTHER'"
          });
        }
      }
      
      // HARD COMPLIANCE CHECK: No bypass allowed except for system transitions
      // Admin can override with typed confirmation + justification
      if (triggeredByType !== 'system') {
        const compliance = await storage.validateTransitionCompliance(
          req.params.id,
          deal.status,
          toState
        );
        
        if (!compliance.canTransition) {
          // Check for admin override
          if (adminOverride) {
            // Validate admin role
            if (!user || user.role !== 'admin') {
              return res.status(403).json({ 
                success: false, 
                error: "Only admins can override compliance checks" 
              });
            }
            
            // Require typed confirmation "OVERRIDE"
            if (overrideConfirmation !== 'OVERRIDE') {
              return res.status(400).json({ 
                success: false, 
                error: "Must type 'OVERRIDE' to confirm bypass of compliance checks" 
              });
            }
            
            // Require justification reason
            if (!overrideReason || overrideReason.length < 10) {
              return res.status(400).json({ 
                success: false, 
                error: "Override reason must be at least 10 characters" 
              });
            }
            
            // Log the override to audit table
            await storage.createDealTransitionOverride({
              dealId: req.params.id,
              fromState: deal.status,
              toState,
              blockersOverridden: compliance.missingRequirements,
              overrideReason,
              typedConfirmation: overrideConfirmation,
              overriddenBy: user.id
            });
            
            // Log audit event for override
            await logAuditEvent({
              actor: user.username,
              actorRole: user.role,
              actorIp: req.ip || null,
              userAgent: req.get("User-Agent") || null,
              action: "DEAL_TRANSITION_OVERRIDE",
              entityType: "deal",
              entityId: null,
              dealId: req.params.id,
              details: { 
                fromState: deal.status, 
                toState, 
                overrideReason,
                blockersOverridden: compliance.missingRequirements 
              }
            });
            
            // Proceed with transition despite blockers
          } else {
            // No override - return the blocking errors
            return res.status(400).json({ 
              success: false, 
              error: "Cannot proceed. The following compliance items are missing.",
              complianceBlocked: true,
              missingRequirements: compliance.missingRequirements,
              canOverride: user?.role === 'admin'
            });
          }
        }
      }
      
      const fromState = deal.status;
      const result = await storage.transitionDealState(
        req.params.id,
        toState as DealState,
        triggeredBy,
        triggeredByType,
        reason,
        notes,
        requiresApproval
      );
      
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }
      
      // If transitioning to LOST, update the deal with structured lost information
      if (toState === 'LOST') {
        await storage.updateDeal(req.params.id, {
          lostAt: new Date(),
          lostReasonCategory: lostReasonCategory,
          lostSupplierId: lostSupplierId ? parseInt(lostSupplierId) : null,
          lostStage: fromState,
          lostByUserId: user?.id || null,
          lostNotes: lostNotes || null,
        });
      }
      
      // MILESTONE COMMISSION EVENTS
      // On CONTRACT_SIGNED: Create Milestone 1 (50%) commission event
      if (toState === 'CONTRACT_SIGNED' && result.deal) {
        const selectedQuote = await storage.getDealQuotes(req.params.id)
          .then(quotes => quotes.find(q => q.status === 'ACCEPTED'));
        
        if (selectedQuote && selectedQuote.supplierId) {
          // Get supplier playbook for milestone config
          const playbook = await storage.getSupplierPlaybook(selectedQuote.supplierId);
          const m1Percent = playbook?.milestone1Percent || 50;
          const totalCommission = selectedQuote.brokerCommissionRmwh || 0;
          const m1Amount = Number((totalCommission * m1Percent / 100).toFixed(4));
          
          await storage.createDealCommissionEvent({
            dealId: req.params.id,
            eventType: 'MILESTONE_1',
            status: 'PENDING',
            amountBrl: null,
            amountRmwh: m1Amount,
            expectedDate: new Date().toISOString().split('T')[0],
            paymentTrigger: playbook?.milestone1Name || 'Contract Signed',
            notes: `Milestone 1 (${m1Percent}%): ${playbook?.milestone1Name || 'Contract Signed'}`,
          });
          
          await logAuditEvent({
            actor: user?.username || triggeredBy,
            actorRole: user?.role || null,
            actorIp: req.ip || null,
            userAgent: req.get("User-Agent") || null,
            action: "COMMISSION_MILESTONE_CREATED",
            entityType: "commission_event",
            entityId: null,
            dealId: req.params.id,
            details: { milestone: 1, percent: m1Percent, amountRmwh: m1Amount }
          });
        }
      }
      
      // On SUPPLY_LIVE: Mark Milestone 1 as CONFIRMED, create Milestone 2 (50%)
      if (toState === 'SUPPLY_LIVE' && result.deal) {
        // Get existing commission events for this deal
        const existingEvents = await storage.getDealCommissionEvents(req.params.id);
        const m1Event = existingEvents.find(e => e.eventType === 'MILESTONE_1' && e.status === 'PENDING');
        
        // Confirm Milestone 1
        if (m1Event) {
          await storage.updateDealCommissionEvent(m1Event.id, {
            status: 'CONFIRMED',
            confirmedAt: new Date(),
          });
        }
        
        const selectedQuote = await storage.getDealQuotes(req.params.id)
          .then(quotes => quotes.find(q => q.status === 'ACCEPTED'));
        
        if (selectedQuote && selectedQuote.supplierId) {
          const playbook = await storage.getSupplierPlaybook(selectedQuote.supplierId);
          const m2Percent = playbook?.milestone2Percent || 50;
          const totalCommission = selectedQuote.brokerCommissionRmwh || 0;
          const m2Amount = Number((totalCommission * m2Percent / 100).toFixed(4));
          
          await storage.createDealCommissionEvent({
            dealId: req.params.id,
            eventType: 'MILESTONE_2',
            status: 'PENDING',
            amountBrl: null,
            amountRmwh: m2Amount,
            expectedDate: new Date().toISOString().split('T')[0],
            paymentTrigger: playbook?.milestone2Name || 'CCEE Activation / Supply Live',
            notes: `Milestone 2 (${m2Percent}%): ${playbook?.milestone2Name || 'CCEE Activation / Supply Live'}`,
          });
          
          await logAuditEvent({
            actor: user?.username || triggeredBy,
            actorRole: user?.role || null,
            actorIp: req.ip || null,
            userAgent: req.get("User-Agent") || null,
            action: "COMMISSION_MILESTONE_CREATED",
            entityType: "commission_event",
            entityId: null,
            dealId: req.params.id,
            details: { milestone: 2, percent: m2Percent, amountRmwh: m2Amount }
          });
        }
      }
      
      await logAuditEvent({
        actor: user?.username || triggeredBy,
        actorRole: user?.role || null,
        actorIp: req.ip || null,
        userAgent: req.get("User-Agent") || null,
        action: "DEAL_STATE_TRANSITIONED",
        entityType: "deal",
        entityId: null,
        dealId: req.params.id,
        clientId: deal.clientId || null,
        detailsJson: { 
          fromState, 
          toState, 
          triggeredBy, 
          triggeredByType, 
          reason,
          ...(toState === 'LOST' ? { lostReasonCategory, lostSupplierId, lostNotes } : {})
        }
      });
      
      res.json({ success: true, deal: result.deal });
    } catch (error: any) {
      console.error("Error transitioning deal state:", error);
      res.status(500).json({ success: false, error: "Failed to transition deal state" });
    }
  });
  
  // Check compliance status for a transition (without actually transitioning)
  app.get("/api/deals/:id/compliance/:toState", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const deal = await storage.getDeal(req.params.id);
      if (!deal) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }
      
      const compliance = await storage.validateTransitionCompliance(
        req.params.id,
        deal.status,
        req.params.toState
      );
      
      res.json({ success: true, ...compliance });
    } catch (error: any) {
      console.error("Error checking compliance:", error);
      res.status(500).json({ success: false, error: "Failed to check compliance" });
    }
  });

  // Get deal state history
  app.get("/api/deals/:id/history", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const transitions = await storage.getDealStateTransitions(req.params.id);
      res.json({ success: true, transitions });
    } catch (error: any) {
      console.error("Error fetching deal history:", error);
      res.status(500).json({ success: false, error: "Failed to fetch deal history" });
    }
  });

  // --- Deal Quotes ---

  // Get quotes for a deal
  app.get("/api/deals/:id/quotes", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const quotes = await storage.getDealQuotes(req.params.id);
      
      // Enrich with supplier info
      const suppliers = await storage.getSuppliers();
      const suppliersMap = new Map(suppliers.map(s => [s.id, s]));
      
      const enrichedQuotes = quotes.map(quote => ({
        ...quote,
        supplier: suppliersMap.get(quote.supplierId)
      }));
      
      res.json({ success: true, quotes: enrichedQuotes });
    } catch (error: any) {
      console.error("Error fetching deal quotes:", error);
      res.status(500).json({ success: false, error: "Failed to fetch quotes" });
    }
  });

  // Add quote to deal
  app.post("/api/deals/:id/quotes", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const session = await storage.getAdminSession(sessionId);
      const user = session ? await storage.getUser(session.userId) : null;
      
      const dealId = req.params.id;
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }
      
      const validatedData = insertDealQuoteSchema.parse({
        ...req.body,
        dealId
      });
      
      const quote = await storage.createDealQuote(validatedData);
      
      await logAuditEvent({
        actor: user?.username || "system",
        actorRole: user?.role || null,
        actorIp: req.ip || null,
        userAgent: req.get("User-Agent") || null,
        action: "QUOTE_CREATED",
        entityType: "quote",
        entityId: quote.id,
        dealId: dealId,
        clientId: deal.clientId || null,
        detailsJson: { supplierId: quote.supplierId, pricePerMwh: quote.pricePerMwh, termMonths: quote.termMonths }
      });
      
      res.json({ success: true, quote });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error adding deal quote:", error);
        res.status(500).json({ success: false, error: "Failed to add quote" });
      }
    }
  });

  // Select a quote (locks the deal to this quote)
  app.post("/api/deals/:dealId/quotes/:quoteId/select", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const session = await storage.getAdminSession(sessionId);
      const user = session ? await storage.getUser(session.userId) : null;
      
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ success: false, error: "Selection reason is required" });
      }
      
      const quote = await storage.selectDealQuote(req.params.quoteId, reason);
      if (!quote) {
        return res.status(404).json({ success: false, error: "Quote not found" });
      }
      
      const deal = await storage.getDeal(req.params.dealId);
      
      await logAuditEvent({
        actor: user?.username || "system",
        actorRole: user?.role || null,
        actorIp: req.ip || null,
        userAgent: req.get("User-Agent") || null,
        action: "QUOTE_SELECTED",
        entityType: "quote",
        entityId: quote.id,
        dealId: req.params.dealId,
        clientId: deal?.clientId || null,
        detailsJson: { reason, supplierId: quote.supplierId }
      });
      
      res.json({ success: true, quote });
    } catch (error: any) {
      console.error("Error selecting quote:", error);
      res.status(500).json({ success: false, error: "Failed to select quote" });
    }
  });

  // Reject a quote
  app.post("/api/deals/:dealId/quotes/:quoteId/reject", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const session = await storage.getAdminSession(sessionId);
      const user = session ? await storage.getUser(session.userId) : null;
      
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ success: false, error: "Rejection reason is required" });
      }
      
      const quote = await storage.rejectDealQuote(req.params.quoteId, reason);
      if (!quote) {
        return res.status(404).json({ success: false, error: "Quote not found" });
      }
      
      const deal = await storage.getDeal(req.params.dealId);
      
      await logAuditEvent({
        actor: user?.username || "system",
        actorRole: user?.role || null,
        actorIp: req.ip || null,
        userAgent: req.get("User-Agent") || null,
        action: "QUOTE_REJECTED",
        entityType: "quote",
        entityId: quote.id,
        dealId: req.params.dealId,
        clientId: deal?.clientId || null,
        detailsJson: { reason, supplierId: quote.supplierId }
      });
      
      res.json({ success: true, quote });
    } catch (error: any) {
      console.error("Error rejecting quote:", error);
      res.status(500).json({ success: false, error: "Failed to reject quote" });
    }
  });

  // --- Deal Commission Events ---

  // Get commission events for a deal
  app.get("/api/deals/:id/commission-events", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const events = await storage.getDealCommissionEvents(req.params.id);
      res.json({ success: true, events });
    } catch (error: any) {
      console.error("Error fetching commission events:", error);
      res.status(500).json({ success: false, error: "Failed to fetch commission events" });
    }
  });

  // Add commission event to deal
  app.post("/api/deals/:id/commission-events", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const session = await storage.getAdminSession(sessionId);
      const user = session ? await storage.getUser(session.userId) : null;
      
      const dealId = req.params.id;
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }
      
      const validatedData = insertDealCommissionEventSchema.parse({
        ...req.body,
        dealId
      });
      
      const event = await storage.createDealCommissionEvent(validatedData);
      
      await logAuditEvent({
        actor: user?.username || "system",
        actorRole: user?.role || null,
        actorIp: req.ip || null,
        userAgent: req.get("User-Agent") || null,
        action: "COMMISSION_EVENT_CREATED",
        entityType: "commission",
        entityId: event.id,
        dealId: dealId,
        clientId: deal.clientId || null,
        detailsJson: { eventType: event.eventType, status: event.status, amountBrl: event.amountBrl }
      });
      
      res.json({ success: true, event });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error adding commission event:", error);
        res.status(500).json({ success: false, error: "Failed to add commission event" });
      }
    }
  });

  // Update commission event
  app.patch("/api/deals/:dealId/commission-events/:eventId", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const session = await storage.getAdminSession(sessionId);
      const user = session ? await storage.getUser(session.userId) : null;
      
      const eventId = parseInt(req.params.eventId);
      const event = await storage.updateDealCommissionEvent(eventId, req.body);
      if (!event) {
        return res.status(404).json({ success: false, error: "Commission event not found" });
      }
      
      const deal = await storage.getDeal(req.params.dealId);
      
      await logAuditEvent({
        actor: user?.username || "system",
        actorRole: user?.role || null,
        actorIp: req.ip || null,
        userAgent: req.get("User-Agent") || null,
        action: "COMMISSION_EVENT_UPDATED",
        entityType: "commission",
        entityId: eventId,
        dealId: req.params.dealId,
        clientId: deal?.clientId || null,
        detailsJson: { updates: Object.keys(req.body), newStatus: event.status }
      });
      
      res.json({ success: true, event });
    } catch (error: any) {
      console.error("Error updating commission event:", error);
      res.status(500).json({ success: false, error: "Failed to update commission event" });
    }
  });

  // Get upcoming commission payments
  app.get("/api/commission-events/upcoming", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const days = parseInt(req.query.days as string) || 30;
      const events = await storage.getUpcomingCommissionEvents(days);
      res.json({ success: true, events });
    } catch (error: any) {
      console.error("Error fetching upcoming commission events:", error);
      res.status(500).json({ success: false, error: "Failed to fetch upcoming events" });
    }
  });

  // Get overdue commission payments
  app.get("/api/commission-events/overdue", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const events = await storage.getOverdueCommissionEvents();
      res.json({ success: true, events });
    } catch (error: any) {
      console.error("Error fetching overdue commission events:", error);
      res.status(500).json({ success: false, error: "Failed to fetch overdue events" });
    }
  });

  // --- Deal ECOS Snapshots (Pre-Sales Insight Tool) ---
  
  // Get all ECOS snapshots for a deal
  app.get("/api/deals/:id/ecos-snapshots", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const snapshots = await storage.getDealEcosSnapshots(req.params.id);
      res.json({ success: true, snapshots });
    } catch (error: any) {
      console.error("Error fetching deal ECOS snapshots:", error);
      res.status(500).json({ success: false, error: "Failed to fetch ECOS snapshots" });
    }
  });

  // Get the latest ECOS snapshot for a deal
  app.get("/api/deals/:id/ecos-snapshots/latest", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const snapshot = await storage.getLatestDealEcosSnapshot(req.params.id);
      if (!snapshot) {
        return res.json({ success: true, snapshot: null });
      }
      res.json({ success: true, snapshot });
    } catch (error: any) {
      console.error("Error fetching latest ECOS snapshot:", error);
      res.status(500).json({ success: false, error: "Failed to fetch latest ECOS snapshot" });
    }
  });

  // Get a specific ECOS snapshot by ID
  app.get("/api/deals/:dealId/ecos-snapshots/:snapshotId", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const snapshotId = parseInt(req.params.snapshotId);
      if (isNaN(snapshotId)) {
        return res.status(400).json({ success: false, error: "Invalid snapshot ID" });
      }
      
      const snapshot = await storage.getDealEcosSnapshot(snapshotId);
      if (!snapshot) {
        return res.status(404).json({ success: false, error: "ECOS snapshot not found" });
      }
      
      // Verify the snapshot belongs to this deal
      if (snapshot.dealId !== req.params.dealId) {
        return res.status(404).json({ success: false, error: "ECOS snapshot not found for this deal" });
      }
      
      res.json({ success: true, snapshot });
    } catch (error: any) {
      console.error("Error fetching ECOS snapshot:", error);
      res.status(500).json({ success: false, error: "Failed to fetch ECOS snapshot" });
    }
  });

  // Create a new ECOS snapshot (evaluate and capture)
  app.post("/api/deals/:id/ecos-snapshots", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const dealId = req.params.id;
      const { triggerType, notes } = req.body;
      
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }
      
      const sessionId = req.headers["x-session-id"] as string;
      const session = await storage.getAdminSession(sessionId);
      const user = session ? await storage.getUser(session.userId) : null;
      const triggeredBy = user?.id || 'unknown';
      
      const { evaluateDealEcos, createDealEcosSnapshot } = await import("./deal-ecos-engine");
      const result = await createDealEcosSnapshot(dealId, triggeredBy, triggerType || 'MANUAL', notes);
      
      res.json({ 
        success: true, 
        snapshotId: result.snapshotId,
        evaluation: result.evaluation 
      });
    } catch (error: any) {
      console.error("Error creating ECOS snapshot:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to create ECOS snapshot" });
    }
  });

  // Preview ECOS evaluation without saving (dry run)
  app.get("/api/deals/:id/ecos-evaluation", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const dealId = req.params.id;
      
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }
      
      const { evaluateDealEcos } = await import("./deal-ecos-engine");
      const evaluation = await evaluateDealEcos(dealId, 'preview');
      
      res.json({ success: true, evaluation });
    } catch (error: any) {
      console.error("Error evaluating deal ECOS:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to evaluate deal" });
    }
  });

  // --- ECOS Insight Pack PDF Generation ---
  
  app.post("/api/deals/:dealId/ecos-snapshots/:snapshotId/pdf", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const { dealId, snapshotId } = req.params;
      
      // Get the deal and snapshot
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }
      
      const snapshot = await storage.getDealEcosSnapshot(parseInt(snapshotId));
      if (!snapshot || snapshot.dealId !== dealId) {
        return res.status(404).json({ success: false, error: "Snapshot not found" });
      }
      
      // Get related data
      const client = deal.clientId ? await storage.getClient(deal.clientId) : null;
      const dossier = client ? await storage.getClientDossierByClientId(client.id) : null;
      
      // Status labels in PT-BR
      const statusLabels: Record<string, { label: string; color: string; bgColor: string }> = {
        'ABOVE_BAND': { label: 'ACIMA DA FAIXA', color: '#c53030', bgColor: '#fed7d7' },
        'WITHIN_BAND': { label: 'DENTRO DA FAIXA', color: '#2f855a', bgColor: '#c6f6d5' },
        'BELOW_BAND': { label: 'ABAIXO DA FAIXA', color: '#2b6cb0', bgColor: '#bee3f8' },
        'NO_DATA': { label: 'DADOS INSUFICIENTES', color: '#718096', bgColor: '#e2e8f0' }
      };
      
      const confidenceLabels: Record<string, string> = {
        'HIGH': 'ALTA',
        'MEDIUM': 'MÉDIA',
        'LOW': 'BAIXA'
      };
      
      const nextStepLabels: Record<string, string> = {
        'REQUEST_RFQ': 'Solicitar Cotação (RFQ)',
        'WAIT': 'Aguardar / Monitorar',
        'NEED_MORE_DATA': 'Coletar Mais Dados'
      };
      
      const statusInfo = statusLabels[snapshot.status] || statusLabels['NO_DATA'];
      const frozenInputs = snapshot.frozenInputs as any || {};
      const benchmarkMatch = snapshot.benchmarkMatch as any || {};
      const results = snapshot.results as any || {};
      const confidenceReasons = (snapshot.confidenceReasons as any[]) || [];
      
      // Get brand kit for styling
      const brandKit = await storage.getBrandKit();
      const primaryColor = brandKit?.primaryColor || '#9e3ffd';
      const secondaryColor = brandKit?.secondaryColor || '#df0af2';
      const darkColor = brandKit?.darkColor || '#16163f';
      const textColor = brandKit?.textColor || '#736d77';
      const lightBgColor = brandKit?.lightBgColor || '#eee7f1';
      const fontFamily = brandKit?.fontFamily || 'Inter';
      const brandName = brandKit?.brandName || 'Ótima Energia';
      const footerText = brandKit?.footerText || 'Ótima Energia • contato@otimaenergia.com.br';
      
      // Generate HTML for PDF
      const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>ECOS Insight Pack — ${client?.companyName || 'Cliente'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=${fontFamily}:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: '${fontFamily}', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: ${textColor}; padding: 40px; line-height: 1.5; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid ${primaryColor}; padding-bottom: 20px; }
    .header h1 { color: ${primaryColor}; font-size: 22px; margin-bottom: 5px; }
    .header .subtitle { color: ${textColor}; font-size: 11px; margin-top: 5px; }
    .logo { font-size: 20px; font-weight: bold; color: ${darkColor}; margin-bottom: 10px; }
    .section { margin-bottom: 20px; page-break-inside: avoid; }
    .section-title { font-size: 13px; font-weight: bold; color: ${primaryColor}; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 5px; text-transform: uppercase; }
    .row { display: flex; margin-bottom: 6px; }
    .label { width: 180px; color: #666; font-size: 11px; }
    .value { flex: 1; font-size: 11px; font-weight: 500; }
    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: bold; text-align: center; }
    .status-container { text-align: center; margin: 20px 0; }
    .confidence-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 500; background: #f0f0f0; margin-left: 10px; }
    .highlight-box { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 15px 0; }
    .savings-value { font-size: 20px; font-weight: bold; color: #2f855a; }
    .price-comparison { display: flex; justify-content: space-between; margin: 15px 0; }
    .price-item { flex: 1; text-align: center; padding: 10px; }
    .price-item .value { font-size: 16px; font-weight: bold; display: block; }
    .price-item .label { font-size: 10px; color: #666; display: block; }
    .reason-list { font-size: 10px; color: #666; margin-top: 5px; }
    .reason-item { margin: 3px 0; padding-left: 10px; }
    .reason-positive { color: #2f855a; }
    .reason-negative { color: #c53030; }
    .assumptions { background: #fffaf0; border: 1px solid #fbd38d; border-radius: 6px; padding: 12px; margin: 15px 0; font-size: 10px; }
    .assumptions-title { font-weight: bold; color: #c05621; margin-bottom: 5px; }
    .disclaimer { background: #fff5f5; border: 1px solid #feb2b2; border-radius: 6px; padding: 12px; margin: 15px 0; font-size: 9px; color: #742a2a; }
    .disclaimer-title { font-weight: bold; margin-bottom: 3px; }
    .footer { margin-top: 30px; text-align: center; color: #999; font-size: 9px; border-top: 1px solid #ddd; padding-top: 15px; }
    .next-step { background: ${lightBgColor}; border: 1px solid ${primaryColor}40; border-radius: 6px; padding: 12px; margin: 15px 0; text-align: center; }
    .next-step-label { font-size: 10px; color: ${primaryColor}; margin-bottom: 5px; }
    .next-step-value { font-size: 14px; font-weight: bold; color: ${darkColor}; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">${brandName.toUpperCase()}</div>
    <h1>ECOS™ Insight Pack</h1>
    <p class="subtitle">Análise de Mercado para Negociação de Energia</p>
  </div>
  
  <div class="section">
    <div class="section-title">Identificação</div>
    <div class="row"><span class="label">Empresa:</span><span class="value">${client?.companyName || 'Não informado'}</span></div>
    ${client?.cnpj ? `<div class="row"><span class="label">CNPJ:</span><span class="value">${client.cnpj}</span></div>` : ''}
    ${dossier?.ucCodes?.[0] ? `<div class="row"><span class="label">UC:</span><span class="value">${dossier.ucCodes[0]}</span></div>` : ''}
    <div class="row"><span class="label">Deal ID:</span><span class="value">${dealId}</span></div>
    <div class="row"><span class="label">Snapshot:</span><span class="value">v${snapshot.version} — ID #${snapshot.id}</span></div>
  </div>
  
  <div class="status-container">
    <span class="status-badge" style="background: ${statusInfo.bgColor}; color: ${statusInfo.color};">
      ${statusInfo.label}
    </span>
    <span class="confidence-badge">Confiança: ${confidenceLabels[snapshot.confidenceLevel] || snapshot.confidenceLevel}</span>
  </div>
  
  ${snapshot.status !== 'NO_DATA' ? `
  <div class="section">
    <div class="section-title">Comparativo de Preços</div>
    <div class="price-comparison">
      <div class="price-item">
        <span class="label">Preço Estimado Atual</span>
        <span class="value" style="color: ${snapshot.status === 'ABOVE_BAND' ? '#c53030' : '#333'};">
          R$ ${frozenInputs.clientCurrentPriceRmwh ? parseFloat(frozenInputs.clientCurrentPriceRmwh).toFixed(2) : results.clientEstimatedPriceRmwh?.toFixed(2) || '—'}/MWh
        </span>
      </div>
      <div class="price-item">
        <span class="label">Faixa de Mercado</span>
        <span class="value">
          R$ ${benchmarkMatch.lowerBoundRmwh?.toFixed(2) || '—'} — R$ ${benchmarkMatch.upperBoundRmwh?.toFixed(2) || '—'}/MWh
        </span>
      </div>
    </div>
    ${results.gapPercent ? `
    <div class="highlight-box">
      <div class="row"><span class="label">Diferença:</span><span class="value" style="color: ${results.gapPercent > 0 ? '#c53030' : '#2f855a'};">${results.gapPercent > 0 ? '+' : ''}${results.gapPercent.toFixed(1)}% em relação à faixa</span></div>
      ${results.potentialSavingsMax ? `
      <div class="row"><span class="label">Economia Potencial (estimativa):</span><span class="savings-value">Até R$ ${results.potentialSavingsMax.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/ano</span></div>
      ` : ''}
    </div>
    ` : ''}
  </div>
  ` : ''}
  
  <div class="next-step">
    <div class="next-step-label">PRÓXIMO PASSO RECOMENDADO</div>
    <div class="next-step-value">${nextStepLabels[snapshot.recommendedNextStep || ''] || snapshot.recommendedNextStep || 'Coletar Mais Dados'}</div>
  </div>
  
  <div class="section">
    <div class="section-title">Fatores de Confiança</div>
    <div class="reason-list">
      ${confidenceReasons.map((r: any) => `
        <div class="reason-item ${r.impact === 'positive' ? 'reason-positive' : 'reason-negative'}">
          ${r.impact === 'positive' ? '✓' : '✗'} ${r.descriptionPt || r.descriptionEn || r.factor}
        </div>
      `).join('')}
    </div>
  </div>
  
  <div class="assumptions">
    <div class="assumptions-title">Premissas da Análise</div>
    <ul style="padding-left: 15px; margin-top: 5px;">
      <li>Submercado: ${frozenInputs.submarket || dossier?.submarket || 'Não especificado'}</li>
      <li>Distribuidora: ${frozenInputs.distributor || dossier?.distributor || 'Não especificada'}</li>
      <li>Grupo de Conexão: ${frozenInputs.connectionGroup || dossier?.connectionGroup || 'Não especificado'}</li>
      <li>Consumo estimado: ${frozenInputs.avgConsumptionMwhMonth ? `${parseFloat(frozenInputs.avgConsumptionMwhMonth).toFixed(1)} MWh/mês` : 'Não informado'}</li>
      <li>Benchmark utilizado: ${benchmarkMatch.sourceLabel || 'Referência de mercado padrão'}</li>
    </ul>
  </div>
  
  <div class="disclaimer">
    <div class="disclaimer-title">Aviso Legal</div>
    Os valores apresentados neste relatório são <strong>estimativas</strong> baseadas em dados fornecidos e condições de mercado no momento da análise. 
    Não constituem garantia de economia ou proposta comercial. Os valores finais dependem de negociação específica com fornecedores.
    Consulte a equipe Ótima Energia para uma proposta personalizada.
  </div>
  
  <div class="footer">
    <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
    <p>${brandName} © ${new Date().getFullYear()} — Todos os direitos reservados</p>
    <p>${footerText}</p>
    <p>Este documento é confidencial e destinado exclusivamente ao cliente identificado.</p>
  </div>
</body>
</html>
      `;
      
      // Generate PDF using Puppeteer
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
      });
      
      await browser.close();
      
      // Create deal document record
      const fileName = `ecos_insight_pack_${dealId}_v${snapshot.version}_${new Date().toISOString().split('T')[0]}.pdf`;
      const document = await storage.createDealDocument({
        dealId,
        documentType: 'ecos_insight_report',
        fileName,
        uploadedBy: 'system',
        isVerified: true,
        verifiedBy: 'system'
      });
      
      // Link the PDF to the snapshot
      await storage.updateDealEcosSnapshot(snapshot.id, { pdfDocumentId: document.id });
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(pdfBuffer);
      
    } catch (error: any) {
      console.error("Error generating ECOS Insight Pack PDF:", error);
      res.status(500).json({ success: false, error: "Failed to generate PDF" });
    }
  });

  // --- Deal Documents ---

  // Get documents for a deal
  app.get("/api/deals/:id/documents", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const documents = await storage.getDealDocuments(req.params.id);
      res.json({ success: true, documents });
    } catch (error: any) {
      console.error("Error fetching deal documents:", error);
      res.status(500).json({ success: false, error: "Failed to fetch documents" });
    }
  });

  // Add document to deal
  app.post("/api/deals/:id/documents", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const dealId = req.params.id;
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }
      
      const validatedData = insertDealDocumentSchema.parse({
        ...req.body,
        dealId
      });
      
      const document = await storage.createDealDocument(validatedData);
      res.json({ success: true, document });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error adding deal document:", error);
        res.status(500).json({ success: false, error: "Failed to add document" });
      }
    }
  });

  // Verify document
  app.post("/api/deals/:dealId/documents/:docId/verify", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const { verifiedBy } = req.body;
      if (!verifiedBy) {
        return res.status(400).json({ success: false, error: "verifiedBy is required" });
      }
      
      const docId = parseInt(req.params.docId);
      const document = await storage.verifyDealDocument(docId, verifiedBy);
      if (!document) {
        return res.status(404).json({ success: false, error: "Document not found" });
      }
      
      res.json({ success: true, document });
    } catch (error: any) {
      console.error("Error verifying document:", error);
      res.status(500).json({ success: false, error: "Failed to verify document" });
    }
  });

  // --- Deal Creation from Client ---

  // Create deal for existing client
  app.post("/api/clients/:clientId/deals", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const clientId = parseInt(req.params.clientId);
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ success: false, error: "Client not found" });
      }
      
      const dealData = {
        clientId,
        internalOwner: req.body.internalOwner || "Renan",
        opsOwner: req.body.opsOwner,
        energyType: req.body.energyType,
        submarket: req.body.submarket,
        volumeType: req.body.volumeType,
        volumeMwhYear: req.body.volumeMwhYear,
        volumeMwhMonth: req.body.volumeMwhMonth,
        contractStartDate: req.body.contractStartDate,
        contractEndDate: req.body.contractEndDate,
        contractTermMonths: req.body.contractTermMonths,
        zohoOpportunityId: req.body.zohoOpportunityId
      };
      
      const deal = await storage.createDeal(dealData);
      res.json({ success: true, deal });
    } catch (error: any) {
      console.error("Error creating deal for client:", error);
      res.status(500).json({ success: false, error: "Failed to create deal" });
    }
  });

  // Get deals for a client
  app.get("/api/clients/:clientId/deals", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const clientId = parseInt(req.params.clientId);
      const deals = await storage.getDealsForClient(clientId);
      res.json({ success: true, deals });
    } catch (error: any) {
      console.error("Error fetching client deals:", error);
      res.status(500).json({ success: false, error: "Failed to fetch deals" });
    }
  });

  // ============== DEAL OS - NEW TABLES ==============

  // --- Commission Terms Snapshots ---

  // Get all commission terms snapshots for a deal
  app.get("/api/deals/:id/commission-snapshots", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const snapshots = await storage.getCommissionTermsSnapshots(req.params.id);
      res.json({ success: true, snapshots });
    } catch (error: any) {
      console.error("Error fetching commission snapshots:", error);
      res.status(500).json({ success: false, error: "Failed to fetch commission snapshots" });
    }
  });

  // Get active commission terms snapshot for a deal
  app.get("/api/deals/:id/commission-snapshots/active", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const snapshot = await storage.getActiveCommissionTermsSnapshot(req.params.id);
      res.json({ success: true, snapshot: snapshot || null });
    } catch (error: any) {
      console.error("Error fetching active commission snapshot:", error);
      res.status(500).json({ success: false, error: "Failed to fetch active snapshot" });
    }
  });

  // Create commission terms snapshot
  app.post("/api/deals/:id/commission-snapshots", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const dealId = req.params.id;
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }

      const validatedData = insertDealCommissionTermsSnapshotSchema.parse({
        ...req.body,
        dealId
      });

      const snapshot = await storage.createCommissionTermsSnapshot(validatedData);
      res.json({ success: true, snapshot });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating commission snapshot:", error);
        res.status(500).json({ success: false, error: "Failed to create commission snapshot" });
      }
    }
  });

  // Supersede commission terms snapshot (for amendments)
  app.post("/api/deals/:dealId/commission-snapshots/:snapshotId/supersede", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const snapshotId = parseInt(req.params.snapshotId);
      const dealId = req.params.dealId;

      const validatedData = insertDealCommissionTermsSnapshotSchema.parse({
        ...req.body,
        dealId
      });

      const newSnapshot = await storage.supersedeCommissionTermsSnapshot(snapshotId, validatedData);
      res.json({ success: true, snapshot: newSnapshot });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error superseding commission snapshot:", error);
        res.status(500).json({ success: false, error: "Failed to supersede commission snapshot" });
      }
    }
  });

  // --- Deal Disputes ---

  // Get all open disputes
  app.get("/api/disputes", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const status = req.query.status as string | undefined;
      let disputes;
      if (status) {
        disputes = await storage.getDisputesByStatus(status);
      } else {
        disputes = await storage.getOpenDisputes();
      }
      res.json({ success: true, disputes });
    } catch (error: any) {
      console.error("Error fetching disputes:", error);
      res.status(500).json({ success: false, error: "Failed to fetch disputes" });
    }
  });

  // Get disputes for a deal
  app.get("/api/deals/:id/disputes", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const disputes = await storage.getDealDisputes(req.params.id);
      res.json({ success: true, disputes });
    } catch (error: any) {
      console.error("Error fetching deal disputes:", error);
      res.status(500).json({ success: false, error: "Failed to fetch disputes" });
    }
  });

  // Get single dispute
  app.get("/api/disputes/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const dispute = await storage.getDealDispute(parseInt(req.params.id));
      if (!dispute) {
        return res.status(404).json({ success: false, error: "Dispute not found" });
      }
      res.json({ success: true, dispute });
    } catch (error: any) {
      console.error("Error fetching dispute:", error);
      res.status(500).json({ success: false, error: "Failed to fetch dispute" });
    }
  });

  // Create dispute for a deal
  app.post("/api/deals/:id/disputes", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const dealId = req.params.id;
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }

      const validatedData = insertDealDisputeSchema.parse({
        ...req.body,
        dealId
      });

      const dispute = await storage.createDealDispute(validatedData);
      res.json({ success: true, dispute });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating dispute:", error);
        res.status(500).json({ success: false, error: "Failed to create dispute" });
      }
    }
  });

  // Update dispute
  app.patch("/api/disputes/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const dispute = await storage.updateDealDispute(parseInt(req.params.id), req.body);
      if (!dispute) {
        return res.status(404).json({ success: false, error: "Dispute not found" });
      }
      res.json({ success: true, dispute });
    } catch (error: any) {
      console.error("Error updating dispute:", error);
      res.status(500).json({ success: false, error: "Failed to update dispute" });
    }
  });

  // Resolve dispute
  app.post("/api/disputes/:id/resolve", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const { resolution, resolvedBy, resolvedAmount, notes } = req.body;
      if (!resolution || !resolvedBy) {
        return res.status(400).json({ success: false, error: "resolution and resolvedBy are required" });
      }

      const dispute = await storage.resolveDealDispute(
        parseInt(req.params.id),
        resolution,
        resolvedBy,
        resolvedAmount,
        notes
      );

      if (!dispute) {
        return res.status(404).json({ success: false, error: "Dispute not found" });
      }
      res.json({ success: true, dispute });
    } catch (error: any) {
      console.error("Error resolving dispute:", error);
      res.status(500).json({ success: false, error: "Failed to resolve dispute" });
    }
  });

  // --- Deal Checklist Requirements ---

  // Get all checklist requirements
  app.get("/api/deal-checklist-requirements", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const targetState = req.query.targetState as string | undefined;
      let requirements;
      if (targetState) {
        requirements = await storage.getChecklistRequirements(targetState);
      } else {
        requirements = await storage.getAllChecklistRequirements();
      }
      res.json({ success: true, requirements });
    } catch (error: any) {
      console.error("Error fetching checklist requirements:", error);
      res.status(500).json({ success: false, error: "Failed to fetch requirements" });
    }
  });

  // Create checklist requirement
  app.post("/api/deal-checklist-requirements", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const validatedData = insertDealChecklistRequirementSchema.parse(req.body);
      const requirement = await storage.createChecklistRequirement(validatedData);
      res.json({ success: true, requirement });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating checklist requirement:", error);
        res.status(500).json({ success: false, error: "Failed to create requirement" });
      }
    }
  });

  // Update checklist requirement
  app.patch("/api/deal-checklist-requirements/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const requirement = await storage.updateChecklistRequirement(parseInt(req.params.id), req.body);
      if (!requirement) {
        return res.status(404).json({ success: false, error: "Requirement not found" });
      }
      res.json({ success: true, requirement });
    } catch (error: any) {
      console.error("Error updating checklist requirement:", error);
      res.status(500).json({ success: false, error: "Failed to update requirement" });
    }
  });

  // Delete checklist requirement
  app.delete("/api/deal-checklist-requirements/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      await storage.deleteChecklistRequirement(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting checklist requirement:", error);
      res.status(500).json({ success: false, error: "Failed to delete requirement" });
    }
  });

  // --- Supplier SLA Tracking ---

  // Get SLA breaches
  app.get("/api/supplier-sla/breaches", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const breaches = await storage.getSlaBreach();
      res.json({ success: true, breaches });
    } catch (error: any) {
      console.error("Error fetching SLA breaches:", error);
      res.status(500).json({ success: false, error: "Failed to fetch SLA breaches" });
    }
  });

  // Get SLA tracking for a deal
  app.get("/api/deals/:id/sla-tracking", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const tracking = await storage.getSupplierSlaTrackingForDeal(req.params.id);
      res.json({ success: true, tracking });
    } catch (error: any) {
      console.error("Error fetching deal SLA tracking:", error);
      res.status(500).json({ success: false, error: "Failed to fetch SLA tracking" });
    }
  });

  // Get SLA tracking for a supplier
  app.get("/api/suppliers/:id/sla-tracking", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const tracking = await storage.getSupplierSlaTrackingForSupplier(parseInt(req.params.id));
      res.json({ success: true, tracking });
    } catch (error: any) {
      console.error("Error fetching supplier SLA tracking:", error);
      res.status(500).json({ success: false, error: "Failed to fetch SLA tracking" });
    }
  });

  // Create SLA tracking record
  app.post("/api/supplier-sla", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const validatedData = insertSupplierSlaTrackingSchema.parse(req.body);
      const tracking = await storage.createSupplierSlaTracking(validatedData);
      res.json({ success: true, tracking });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating SLA tracking:", error);
        res.status(500).json({ success: false, error: "Failed to create SLA tracking" });
      }
    }
  });

  // Update SLA tracking
  app.patch("/api/supplier-sla/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const tracking = await storage.updateSupplierSlaTracking(parseInt(req.params.id), req.body);
      if (!tracking) {
        return res.status(404).json({ success: false, error: "SLA tracking not found" });
      }
      res.json({ success: true, tracking });
    } catch (error: any) {
      console.error("Error updating SLA tracking:", error);
      res.status(500).json({ success: false, error: "Failed to update SLA tracking" });
    }
  });

  // Record supplier response (auto-calculates SLA)
  app.post("/api/supplier-sla/:id/response", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const responseAt = req.body.responseAt ? new Date(req.body.responseAt) : new Date();
      const tracking = await storage.recordSupplierResponse(parseInt(req.params.id), responseAt);
      if (!tracking) {
        return res.status(404).json({ success: false, error: "SLA tracking not found" });
      }
      res.json({ success: true, tracking });
    } catch (error: any) {
      console.error("Error recording supplier response:", error);
      res.status(500).json({ success: false, error: "Failed to record response" });
    }
  });

  // ============== COMMISSION OS: USAGE, RECONCILIATION, CASES ==============

  // --- Client Usage Periods ---

  // Get usage periods with filters
  app.get("/api/usage", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const filters = {
        clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
        dealId: req.query.dealId as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
      };
      const periods = await storage.getUsagePeriods(filters);
      res.json({ success: true, periods });
    } catch (error: any) {
      console.error("Error fetching usage periods:", error);
      res.status(500).json({ success: false, error: "Failed to fetch usage periods" });
    }
  });

  // Create usage period
  app.post("/api/usage", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const validatedData = insertClientUsagePeriodSchema.parse(req.body);
      const period = await storage.createUsagePeriod(validatedData);
      res.json({ success: true, period });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating usage period:", error);
        res.status(500).json({ success: false, error: "Failed to create usage period" });
      }
    }
  });

  // Update usage period
  app.patch("/api/usage/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const period = await storage.updateUsagePeriod(req.params.id, req.body);
      if (!period) {
        return res.status(404).json({ success: false, error: "Usage period not found" });
      }
      res.json({ success: true, period });
    } catch (error: any) {
      console.error("Error updating usage period:", error);
      res.status(500).json({ success: false, error: "Failed to update usage period" });
    }
  });

  // Verify usage period
  app.post("/api/usage/:id/verify", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const { verifiedByUserId } = req.body;
      if (!verifiedByUserId) {
        return res.status(400).json({ success: false, error: "verifiedByUserId is required" });
      }
      const period = await storage.verifyUsagePeriod(req.params.id, verifiedByUserId);
      if (!period) {
        return res.status(404).json({ success: false, error: "Usage period not found" });
      }
      res.json({ success: true, period });
    } catch (error: any) {
      console.error("Error verifying usage period:", error);
      res.status(500).json({ success: false, error: "Failed to verify usage period" });
    }
  });

  // --- Supplier Playbooks ---

  // Get all active playbooks
  app.get("/api/supplier-playbooks", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const playbooks = await storage.getSupplierPlaybooks();
      res.json({ success: true, playbooks });
    } catch (error: any) {
      console.error("Error fetching playbooks:", error);
      res.status(500).json({ success: false, error: "Failed to fetch playbooks" });
    }
  });

  // Get active playbook for a supplier
  app.get("/api/suppliers/:id/playbook", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const playbook = await storage.getSupplierPlaybook(parseInt(req.params.id));
      res.json({ success: true, playbook: playbook || null });
    } catch (error: any) {
      console.error("Error fetching supplier playbook:", error);
      res.status(500).json({ success: false, error: "Failed to fetch playbook" });
    }
  });

  // Get playbook version history for a supplier
  app.get("/api/suppliers/:id/playbook/versions", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const versions = await storage.getSupplierPlaybookVersions(parseInt(req.params.id));
      res.json({ success: true, versions });
    } catch (error: any) {
      console.error("Error fetching playbook versions:", error);
      res.status(500).json({ success: false, error: "Failed to fetch versions" });
    }
  });

  // Create new playbook version for a supplier
  app.post("/api/suppliers/:id/playbook", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const supplierId = parseInt(req.params.id);
      const validatedData = insertSupplierPlaybookSchema.parse({
        ...req.body,
        supplierId
      });
      const playbook = await storage.createSupplierPlaybook(validatedData);
      res.json({ success: true, playbook });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating playbook:", error);
        res.status(500).json({ success: false, error: "Failed to create playbook" });
      }
    }
  });

  // Update playbook (creates new version)
  app.patch("/api/supplier-playbooks/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const playbook = await storage.updateSupplierPlaybook(parseInt(req.params.id), req.body);
      res.json({ success: true, playbook });
    } catch (error: any) {
      console.error("Error updating playbook:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to update playbook" });
    }
  });

  // --- Supplier Report Imports ---

  // Import supplier report
  app.post("/api/supplier-reports/import", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const validatedData = insertSupplierReportImportSchema.parse(req.body);
      const importRecord = await storage.createSupplierReportImport(validatedData);
      res.json({ success: true, import: importRecord });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error importing report:", error);
        res.status(500).json({ success: false, error: "Failed to import report" });
      }
    }
  });

  // Get supplier report imports
  app.get("/api/supplier-reports/imports", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const supplierId = req.query.supplierId ? parseInt(req.query.supplierId as string) : undefined;
      const imports = await storage.getSupplierReportImports(supplierId);
      res.json({ success: true, imports });
    } catch (error: any) {
      console.error("Error fetching imports:", error);
      res.status(500).json({ success: false, error: "Failed to fetch imports" });
    }
  });

  // Update import mapping config
  app.post("/api/supplier-reports/:importId/map", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const importRecord = await storage.updateSupplierReportImport(
        parseInt(req.params.importId),
        { mappingConfig: req.body.mappingConfig }
      );
      if (!importRecord) {
        return res.status(404).json({ success: false, error: "Import not found" });
      }
      res.json({ success: true, import: importRecord });
    } catch (error: any) {
      console.error("Error updating mapping:", error);
      res.status(500).json({ success: false, error: "Failed to update mapping" });
    }
  });

  // Parse imported report (update status and parsed data)
  app.post("/api/supplier-reports/:importId/parse", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const { parsedData, detectedColumns, rowCount, parsingStatus, errorLog } = req.body;
      const importRecord = await storage.updateSupplierReportImport(
        parseInt(req.params.importId),
        { parsedData, detectedColumns, rowCount, parsingStatus, errorLog }
      );
      if (!importRecord) {
        return res.status(404).json({ success: false, error: "Import not found" });
      }
      res.json({ success: true, import: importRecord });
    } catch (error: any) {
      console.error("Error parsing report:", error);
      res.status(500).json({ success: false, error: "Failed to parse report" });
    }
  });

  // --- Commission Reconciliation Runs ---

  // Create reconciliation run
  app.post("/api/reconciliation-runs", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const validatedData = insertCommissionReconciliationRunSchema.parse(req.body);
      const run = await storage.createReconciliationRun(validatedData);
      res.json({ success: true, run });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating reconciliation run:", error);
        res.status(500).json({ success: false, error: "Failed to create run" });
      }
    }
  });

  // Get all reconciliation runs
  app.get("/api/reconciliation-runs", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const runs = await storage.getReconciliationRuns();
      res.json({ success: true, runs });
    } catch (error: any) {
      console.error("Error fetching runs:", error);
      res.status(500).json({ success: false, error: "Failed to fetch runs" });
    }
  });

  // Get single reconciliation run with lines
  app.get("/api/reconciliation-runs/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const run = await storage.getReconciliationRun(parseInt(req.params.id));
      if (!run) {
        return res.status(404).json({ success: false, error: "Run not found" });
      }
      const lines = await storage.getReconciliationLines(run.id);
      res.json({ success: true, run, lines });
    } catch (error: any) {
      console.error("Error fetching run:", error);
      res.status(500).json({ success: false, error: "Failed to fetch run" });
    }
  });

  // Generate reconciliation lines for a run
  app.post("/api/reconciliation-runs/:id/generate-lines", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const runId = parseInt(req.params.id);
      const run = await storage.getReconciliationRun(runId);
      if (!run) {
        return res.status(404).json({ success: false, error: "Run not found" });
      }

      // Get lines from request body (front-end computes expected commission)
      const { lines } = req.body;
      if (!lines || !Array.isArray(lines)) {
        return res.status(400).json({ success: false, error: "lines array is required" });
      }

      const createdLines = [];
      for (const line of lines) {
        const validatedLine = insertCommissionReconciliationLineSchema.parse({
          ...line,
          reconciliationRunId: runId
        });
        const created = await storage.createReconciliationLine(validatedLine);
        createdLines.push(created);
      }

      // Update run line count
      await storage.updateReconciliationRun(runId, { lineCount: createdLines.length });

      res.json({ success: true, lines: createdLines });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error generating lines:", error);
        res.status(500).json({ success: false, error: "Failed to generate lines" });
      }
    }
  });

  // Finalize reconciliation run
  app.post("/api/reconciliation-runs/:id/finalize", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const { finalizedBy } = req.body;
      if (!finalizedBy) {
        return res.status(400).json({ success: false, error: "finalizedBy is required" });
      }
      const run = await storage.finalizeReconciliationRun(parseInt(req.params.id), finalizedBy);
      if (!run) {
        return res.status(404).json({ success: false, error: "Run not found" });
      }
      res.json({ success: true, run });
    } catch (error: any) {
      console.error("Error finalizing run:", error);
      res.status(500).json({ success: false, error: "Failed to finalize run" });
    }
  });

  // Update reconciliation line
  app.patch("/api/reconciliation-lines/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const line = await storage.updateReconciliationLine(parseInt(req.params.id), req.body);
      if (!line) {
        return res.status(404).json({ success: false, error: "Line not found" });
      }
      res.json({ success: true, line });
    } catch (error: any) {
      console.error("Error updating line:", error);
      res.status(500).json({ success: false, error: "Failed to update line" });
    }
  });

  // Raise dispute from reconciliation line
  app.post("/api/reconciliation-lines/:id/raise-dispute", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const lineId = parseInt(req.params.id);
      const line = await storage.getReconciliationLine(lineId);
      if (!line) {
        return res.status(404).json({ success: false, error: "Line not found" });
      }

      // Create dispute using existing dispute system
      const disputeData = {
        dealId: line.dealId,
        disputeReason: req.body.description || `Reconciliation variance of ${line.varianceAmountBrl} BRL`,
        disputeOwner: req.body.raisedBy,
        disputedAmount: line.varianceAmountBrl,
        status: 'OPEN',
      };

      const dispute = await storage.createDealDispute(disputeData);

      // Update line status to DISPUTED
      await storage.updateReconciliationLine(lineId, { status: 'DISPUTED' });

      res.json({ success: true, dispute });
    } catch (error: any) {
      console.error("Error raising dispute:", error);
      res.status(500).json({ success: false, error: "Failed to raise dispute" });
    }
  });

  // --- Deal Cases ---

  // Create case for a deal
  app.post("/api/deals/:id/cases", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const session = await storage.getAdminSession(sessionId);
      const user = session ? await storage.getUser(session.userId) : null;
      
      const dealId = req.params.id;
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }

      const validatedData = insertDealCaseSchema.parse({
        ...req.body,
        dealId
      });

      const dealCase = await storage.createDealCase(validatedData);
      
      await logAuditEvent({
        actor: user?.username || "system",
        actorRole: user?.role || null,
        actorIp: req.ip || null,
        userAgent: req.get("User-Agent") || null,
        action: "CASE_CREATED",
        entityType: "case",
        entityId: dealCase.id,
        dealId: dealId,
        clientId: deal.clientId || null,
        detailsJson: { caseType: dealCase.caseType, severity: dealCase.severity, title: dealCase.title }
      });
      
      res.json({ success: true, case: dealCase });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error creating case:", error);
        res.status(500).json({ success: false, error: "Failed to create case" });
      }
    }
  });

  // Get cases for a deal
  app.get("/api/deals/:id/cases", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const cases = await storage.getDealCases(req.params.id);
      res.json({ success: true, cases });
    } catch (error: any) {
      console.error("Error fetching cases:", error);
      res.status(500).json({ success: false, error: "Failed to fetch cases" });
    }
  });

  // Get all open cases
  app.get("/api/cases/open", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const cases = await storage.getOpenDealCases();
      res.json({ success: true, cases });
    } catch (error: any) {
      console.error("Error fetching open cases:", error);
      res.status(500).json({ success: false, error: "Failed to fetch cases" });
    }
  });

  // Update case
  app.patch("/api/cases/:caseId", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const dealCase = await storage.updateDealCase(parseInt(req.params.caseId), req.body);
      if (!dealCase) {
        return res.status(404).json({ success: false, error: "Case not found" });
      }
      res.json({ success: true, case: dealCase });
    } catch (error: any) {
      console.error("Error updating case:", error);
      res.status(500).json({ success: false, error: "Failed to update case" });
    }
  });

  // Convert case to LOST (transitions deal state)
  app.post("/api/cases/:caseId/convert-to-lost", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const session = await storage.getAdminSession(sessionId);
      const user = session ? await storage.getUser(session.userId) : null;
      
      const { triggeredBy, reason } = req.body;
      if (!triggeredBy || !reason) {
        return res.status(400).json({ success: false, error: "triggeredBy and reason are required" });
      }

      const result = await storage.convertCaseToLost(
        parseInt(req.params.caseId),
        triggeredBy,
        reason
      );

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }
      
      await logAuditEvent({
        actor: user?.username || triggeredBy,
        actorRole: user?.role || null,
        actorIp: req.ip || null,
        userAgent: req.get("User-Agent") || null,
        action: "CASE_CONVERTED_TO_LOST",
        entityType: "case",
        entityId: parseInt(req.params.caseId),
        dealId: result.deal?.id || null,
        clientId: result.deal?.clientId || null,
        detailsJson: { reason, triggeredBy, previousDealStatus: result.deal?.status }
      });

      res.json({ success: true, case: result.case, deal: result.deal });
    } catch (error: any) {
      console.error("Error converting case to lost:", error);
      res.status(500).json({ success: false, error: "Failed to convert case" });
    }
  });

  // ============== COMPLIANCE LAYER ROUTES ==============

  // Compliance Requirements CRUD
  app.get("/api/compliance-requirements", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const requirements = await storage.getAllComplianceRequirements();
      res.json({ success: true, requirements });
    } catch (error: any) {
      console.error("Error fetching compliance requirements:", error);
      res.status(500).json({ success: false, error: "Failed to fetch requirements" });
    }
  });

  app.get("/api/compliance-requirements/:fromState/:toState", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const requirements = await storage.getComplianceRequirements(req.params.fromState, req.params.toState);
      res.json({ success: true, requirements });
    } catch (error: any) {
      console.error("Error fetching compliance requirements:", error);
      res.status(500).json({ success: false, error: "Failed to fetch requirements" });
    }
  });

  app.post("/api/compliance-requirements", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const requirement = await storage.createComplianceRequirement(req.body);
      res.json({ success: true, requirement });
    } catch (error: any) {
      console.error("Error creating compliance requirement:", error);
      res.status(500).json({ success: false, error: "Failed to create requirement" });
    }
  });

  app.patch("/api/compliance-requirements/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const requirement = await storage.updateComplianceRequirement(parseInt(req.params.id), req.body);
      if (!requirement) {
        return res.status(404).json({ success: false, error: "Requirement not found" });
      }
      res.json({ success: true, requirement });
    } catch (error: any) {
      console.error("Error updating compliance requirement:", error);
      res.status(500).json({ success: false, error: "Failed to update requirement" });
    }
  });

  app.delete("/api/compliance-requirements/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      await storage.deleteComplianceRequirement(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting compliance requirement:", error);
      res.status(500).json({ success: false, error: "Failed to delete requirement" });
    }
  });

  // Deal Checklist Items CRUD
  app.get("/api/deals/:id/checklist", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const items = await storage.getDealChecklistItems(req.params.id);
      res.json({ success: true, items });
    } catch (error: any) {
      console.error("Error fetching checklist items:", error);
      res.status(500).json({ success: false, error: "Failed to fetch checklist items" });
    }
  });

  app.post("/api/deals/:id/checklist", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const item = await storage.createDealChecklistItem({
        ...req.body,
        dealId: req.params.id
      });
      res.json({ success: true, item });
    } catch (error: any) {
      console.error("Error creating checklist item:", error);
      res.status(500).json({ success: false, error: "Failed to create checklist item" });
    }
  });

  app.patch("/api/checklist-items/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const item = await storage.updateDealChecklistItem(parseInt(req.params.id), req.body);
      if (!item) {
        return res.status(404).json({ success: false, error: "Checklist item not found" });
      }
      res.json({ success: true, item });
    } catch (error: any) {
      console.error("Error updating checklist item:", error);
      res.status(500).json({ success: false, error: "Failed to update checklist item" });
    }
  });

  app.delete("/api/checklist-items/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      await storage.deleteDealChecklistItem(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting checklist item:", error);
      res.status(500).json({ success: false, error: "Failed to delete checklist item" });
    }
  });

  // Communication Log CRUD
  app.get("/api/communication-logs", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const { dealId, clientId, leadId } = req.query;
      const filters: { dealId?: string; clientId?: number; leadId?: number } = {};
      if (dealId) filters.dealId = dealId as string;
      if (clientId) filters.clientId = parseInt(clientId as string);
      if (leadId) filters.leadId = parseInt(leadId as string);
      
      const logs = await storage.getCommunicationLogs(Object.keys(filters).length > 0 ? filters : undefined);
      res.json({ success: true, logs });
    } catch (error: any) {
      console.error("Error fetching communication logs:", error);
      res.status(500).json({ success: false, error: "Failed to fetch logs" });
    }
  });

  app.post("/api/communication-logs", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const log = await storage.createCommunicationLog(req.body);
      res.json({ success: true, log });
    } catch (error: any) {
      console.error("Error creating communication log:", error);
      res.status(500).json({ success: false, error: "Failed to create log" });
    }
  });

  app.patch("/api/communication-logs/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const log = await storage.updateCommunicationLog(parseInt(req.params.id), req.body);
      if (!log) {
        return res.status(404).json({ success: false, error: "Log not found" });
      }
      res.json({ success: true, log });
    } catch (error: any) {
      console.error("Error updating communication log:", error);
      res.status(500).json({ success: false, error: "Failed to update log" });
    }
  });

  app.delete("/api/communication-logs/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      await storage.deleteCommunicationLog(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting communication log:", error);
      res.status(500).json({ success: false, error: "Failed to delete log" });
    }
  });

  // Ops Dashboard - Today's Work Engine (TASK 5)
  app.get("/api/ops/tasks/today", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const tasks = await storage.getOpsDashboardTasks();
      res.json({ success: true, ...tasks });
    } catch (error: any) {
      console.error("Error fetching ops tasks:", error);
      res.status(500).json({ success: false, error: "Failed to fetch tasks" });
    }
  });

  // Lost Deal Analytics - Aggregate views for insights
  app.get("/api/analytics/lost-deals", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const lostDeals = await storage.getLostDeals();
      
      // Aggregate by reason category
      const byReason: Record<string, number> = {};
      const bySupplier: Record<string, { id: number; name: string; count: number }> = {};
      const byStage: Record<string, number> = {};
      const byUser: Record<string, { id: string; username: string; count: number }> = {};
      
      for (const deal of lostDeals) {
        // By reason
        const reason = deal.lostReasonCategory || 'UNKNOWN';
        byReason[reason] = (byReason[reason] || 0) + 1;
        
        // By stage
        const stage = deal.lostStage || 'UNKNOWN';
        byStage[stage] = (byStage[stage] || 0) + 1;
        
        // By supplier
        if (deal.lostSupplierId) {
          const supplier = await storage.getSupplier(deal.lostSupplierId);
          const supplierKey = deal.lostSupplierId.toString();
          if (!bySupplier[supplierKey]) {
            bySupplier[supplierKey] = { id: deal.lostSupplierId, name: supplier?.name || 'Unknown', count: 0 };
          }
          bySupplier[supplierKey].count++;
        }
        
        // By user
        if (deal.lostByUserId) {
          const user = await storage.getUser(deal.lostByUserId);
          if (!byUser[deal.lostByUserId]) {
            byUser[deal.lostByUserId] = { id: deal.lostByUserId, username: user?.username || 'Unknown', count: 0 };
          }
          byUser[deal.lostByUserId].count++;
        }
      }
      
      res.json({
        success: true,
        totalLost: lostDeals.length,
        byReason: Object.entries(byReason).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
        bySupplier: Object.values(bySupplier).sort((a, b) => b.count - a.count),
        byStage: Object.entries(byStage).map(([stage, count]) => ({ stage, count })).sort((a, b) => b.count - a.count),
        byUser: Object.values(byUser).sort((a, b) => b.count - a.count),
        deals: lostDeals
      });
    } catch (error: any) {
      console.error("Error fetching lost deal analytics:", error);
      res.status(500).json({ success: false, error: "Failed to fetch analytics" });
    }
  });

  // Notification Queue - Admin only
  app.post("/api/notifications/check", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    const session = await storage.getSession(req.headers["x-session-id"] as string);
    const user = session?.userId ? await storage.getUser(session.userId) : null;
    if (user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: "Admin access required" });
    }
    
    try {
      const { runNotificationCheck } = await import("./notifications");
      const result = await runNotificationCheck();
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error running notification check:", error);
      res.status(500).json({ success: false, error: "Failed to run notification check" });
    }
  });

  app.get("/api/notifications/pending", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    const session = await storage.getSession(req.headers["x-session-id"] as string);
    const user = session?.userId ? await storage.getUser(session.userId) : null;
    if (user?.role !== 'admin' && user?.role !== 'ops') {
      return res.status(403).json({ success: false, error: "Admin or Ops access required" });
    }
    
    try {
      const pending = await storage.getPendingNotifications();
      res.json({ success: true, notifications: pending });
    } catch (error: any) {
      console.error("Error fetching pending notifications:", error);
      res.status(500).json({ success: false, error: "Failed to fetch notifications" });
    }
  });

  // ============== PARTNER REFERRAL PROGRAM ==============

  // Public: Register as a partner
  app.post("/api/partners/register", async (req, res) => {
    try {
      const { insertPartnerSchema } = await import("@shared/schema");
      
      // Convert ISO string to Date if needed
      const bodyWithDate = {
        ...req.body,
        termsAcceptedAt: req.body.termsAcceptedAt ? new Date(req.body.termsAcceptedAt) : new Date(),
      };
      
      const validatedData = insertPartnerSchema.parse(bodyWithDate);
      
      // Check if email already registered
      const existingPartner = await storage.getPartnerByEmail(validatedData.email);
      if (existingPartner) {
        return res.status(400).json({ 
          success: false, 
          error: "Este email já está cadastrado no programa." 
        });
      }
      
      const partner = await storage.createPartner(validatedData);
      res.json({ 
        success: true, 
        partner: { id: partner.id, email: partner.email, status: partner.status } 
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ success: false, error: validationError.toString() });
      } else {
        console.error("Error registering partner:", error);
        res.status(500).json({ success: false, error: "Falha ao processar o cadastro. Tente novamente." });
      }
    }
  });

  // Admin: Get all partners
  app.get("/api/partners", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const allPartners = await storage.getPartners();
      res.json({ success: true, partners: allPartners });
    } catch (error: any) {
      console.error("Error fetching partners:", error);
      res.status(500).json({ success: false, error: "Failed to fetch partners" });
    }
  });

  // Admin: Update partner status (approve/reject)
  app.patch("/api/partners/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const partnerId = parseInt(req.params.id);
      const { status, rejectedReason } = req.body;
      
      const session = await storage.getAdminSession(req.headers["x-session-id"] as string);
      
      const updateData: any = { status };
      if (status === 'APPROVED') {
        updateData.approvedAt = new Date();
        updateData.approvedBy = session?.userId;
      } else if (status === 'REJECTED') {
        updateData.rejectedAt = new Date();
        updateData.rejectedReason = rejectedReason;
      }
      
      const partner = await storage.updatePartner(partnerId, updateData);
      if (!partner) {
        return res.status(404).json({ success: false, error: "Partner not found" });
      }
      
      res.json({ success: true, partner });
    } catch (error: any) {
      console.error("Error updating partner:", error);
      res.status(500).json({ success: false, error: "Failed to update partner" });
    }
  });

  // ============== DASHBOARD & WORKFLOW ENDPOINTS ==============
  
  // Sales Dashboard KPIs
  app.get("/api/sales/kpis", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Get leads from last 7 days
      const allLeads = await storage.getLeads();
      const newLeads = allLeads.filter((l: any) => 
        l.createdAt && new Date(l.createdAt) >= sevenDaysAgo
      ).length;
      
      // Leads without portal sent (no response yet)
      const leadsAwaitingResponse = allLeads.filter((l: any) => 
        !l.portalSentAt
      ).length;
      
      // Clients without ready dossier
      const allClients = await storage.getClients();
      let clientsAwaitingDossier = 0;
      for (const client of allClients) {
        const dossier = await storage.getClientDossier(client.id);
        if (!dossier || dossier.status === 'DRAFT') {
          clientsAwaitingDossier++;
        }
      }
      
      // Proposals sent waiting for decision
      const proposals = await storage.getProposals();
      const proposalsSent = proposals.filter((p: any) => 
        p.status === 'sent' || p.status === 'pending_response'
      ).length;
      
      res.json({
        success: true,
        newLeads,
        leadsAwaitingResponse,
        clientsAwaitingDossier,
        proposalsSent
      });
    } catch (error: any) {
      console.error("Error fetching sales KPIs:", error);
      res.status(500).json({ success: false, error: "Failed to fetch KPIs" });
    }
  });
  
  // Sales Worklist (next best actions)
  app.get("/api/sales/worklist", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { BlockerEngine } = await import("./blockerEngine");
      const blockerEngine = new BlockerEngine(storage);
      
      const items: any[] = [];
      
      // Get leads needing action
      const leads = await storage.getLeads();
      for (const lead of leads.slice(0, 10)) {
        if (!lead.portalSentAt) {
          items.push({
            id: lead.id,
            entityType: 'lead',
            name: lead.companyName || lead.name || `Lead #${lead.id}`,
            status: 'new',
            nextAction: 'Novo lead - fazer primeiro contato',
            actionLabel: 'Ligar / WhatsApp',
            priority: 'high',
            deepLink: `/admin/sales/leads?leadId=${lead.id}`
          });
        }
      }
      
      // Get clients needing dossier
      const clients = await storage.getClients();
      for (const client of clients.slice(0, 10)) {
        const nextAction = await blockerEngine.getClientNextAction(client.id);
        if (nextAction.action === 'create_dossier' || nextAction.action === 'complete_dossier') {
          items.push({
            id: client.id,
            entityType: 'client',
            name: client.companyName,
            status: nextAction.action,
            nextAction: nextAction.blockers[0]?.description || 'Completar dossiê',
            actionLabel: nextAction.actionLabel,
            blocker: nextAction.blockers[0]?.title,
            priority: 'high',
            deepLink: nextAction.deepLink
          });
        }
      }
      
      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      items.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);
      
      res.json({ success: true, items: items.slice(0, 20) });
    } catch (error: any) {
      console.error("Error fetching sales worklist:", error);
      res.status(500).json({ success: false, error: "Failed to fetch worklist" });
    }
  });
  
  // Ops Dashboard Queues
  app.get("/api/ops/queues", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      // Blocked deals (by compliance gates)
      const allDeals = await storage.getDeals();
      const blockedDeals: any[] = [];
      
      for (const deal of allDeals) {
        if (deal.status === 'ONBOARDING_PENDING') {
          const checklist = await storage.getDealChecklistItems(deal.id);
          const incompleteCount = checklist.filter((item: any) => !item.completed).length;
          if (incompleteCount > 0) {
            const client = await storage.getClient(deal.clientId);
            blockedDeals.push({
              id: deal.id,
              dealNumber: `DEAL-${deal.id}`,
              clientName: client?.companyName || `Cliente #${deal.clientId}`,
              status: deal.status,
              blockerReason: `${incompleteCount} item(s) do checklist pendente(s)`,
              deepLink: `/admin/ops/deals?dealId=${deal.id}&tab=compliance`
            });
          }
        }
      }
      
      // Supplier SLA breaches - check pending SLA items
      const breachItems: any[] = [];
      // Note: SLA tracking is handled per-deal, so we skip this for now
      
      // Revenue overdue - check deals with pending commission
      const overdueRevenue: any[] = [];
      for (const deal of allDeals.slice(0, 50)) {
        const events = await storage.getDealCommissionEvents(deal.id);
        for (const e of events) {
          if (e.status === 'PENDING' && e.dueDate && new Date(e.dueDate) < new Date()) {
            overdueRevenue.push({
              id: e.id,
              dealId: deal.id,
              amountR: e.amountR,
              dueDate: e.dueDate,
              deepLink: `/admin/ops/revenue?eventId=${e.id}`
            });
          }
        }
      }
      
      // Awaiting quotes (RFQs sent > 48h without response)
      const rfoRequests = await storage.getRfoRequests();
      const awaitingQuotes = rfoRequests
        .filter((r: any) => r.status === 'sent' && r.responseCount === 0)
        .map((r: any) => {
          const sentAt = r.createdAt;
          const ageHours = sentAt ? Math.floor((Date.now() - new Date(sentAt).getTime()) / (1000 * 60 * 60)) : 0;
          return {
            id: r.id,
            rfoNumber: r.rfoNumber,
            clientId: r.clientId,
            ageHours,
            deepLink: `/admin/ops/rfqs?rfoId=${r.id}`
          };
        })
        .filter((r: any) => r.ageHours > 48);
      
      res.json({
        success: true,
        blockedDeals,
        slaBreaches: breachItems,
        overdueRevenue,
        awaitingQuotes
      });
    } catch (error: any) {
      console.error("Error fetching ops queues:", error);
      res.status(500).json({ success: false, error: "Failed to fetch queues" });
    }
  });
  
  // Blocker Engine API
  app.get("/api/blockers/create-deal/:clientId", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const clientId = parseInt(req.params.clientId);
      const { BlockerEngine } = await import("./blockerEngine");
      const blockerEngine = new BlockerEngine(storage);
      const result = await blockerEngine.checkCreateDeal(clientId);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error checking blockers:", error);
      res.status(500).json({ success: false, error: "Failed to check blockers" });
    }
  });
  
  app.get("/api/blockers/send-rfq/:dealId", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const dealId = parseInt(req.params.dealId);
      const { BlockerEngine } = await import("./blockerEngine");
      const blockerEngine = new BlockerEngine(storage);
      const result = await blockerEngine.checkSendRfq(dealId);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error checking blockers:", error);
      res.status(500).json({ success: false, error: "Failed to check blockers" });
    }
  });
  
  app.get("/api/blockers/advance-deal/:dealId/:targetState", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const dealId = parseInt(req.params.dealId);
      const targetState = req.params.targetState;
      const { BlockerEngine } = await import("./blockerEngine");
      const blockerEngine = new BlockerEngine(storage);
      
      let result;
      switch (targetState) {
        case 'QUOTES_RECEIVED':
          result = await blockerEngine.checkRecordQuotes(dealId);
          break;
        case 'OFFER_SELECTED':
          result = await blockerEngine.checkAdvanceToOfferSelected(dealId);
          break;
        case 'ONBOARDING_PENDING':
          result = await blockerEngine.checkAdvanceToOnboarding(dealId);
          break;
        case 'CONTRACT_SIGNED':
          result = await blockerEngine.checkAdvanceToContractSigned(dealId);
          break;
        case 'SUPPLY_LIVE':
          result = await blockerEngine.checkAdvanceToSupplyLive(dealId);
          break;
        default:
          result = { isBlocked: false, blockers: [] };
      }
      
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error checking blockers:", error);
      res.status(500).json({ success: false, error: "Failed to check blockers" });
    }
  });
  
  // Next action for entity
  app.get("/api/next-action/client/:clientId", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const clientId = parseInt(req.params.clientId);
      const { BlockerEngine } = await import("./blockerEngine");
      const blockerEngine = new BlockerEngine(storage);
      const result = await blockerEngine.getClientNextAction(clientId);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error getting next action:", error);
      res.status(500).json({ success: false, error: "Failed to get next action" });
    }
  });
  
  app.get("/api/next-action/deal/:dealId", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const dealId = req.params.dealId;
      const { BlockerEngine } = await import("./blockerEngine");
      const blockerEngine = new BlockerEngine(storage);
      const result = await blockerEngine.getDealNextAction(dealId);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error getting next action:", error);
      res.status(500).json({ success: false, error: "Failed to get next action" });
    }
  });
  
  // ============== SUPPLIER RFQ ADAPTER ==============
  
  // --- Supplier RFQ Playbooks ---
  app.get("/api/supplier-rfq-playbooks", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const playbooks = await storage.getAllActivePlaybooks();
      res.json({ success: true, playbooks });
    } catch (error: any) {
      console.error("Error fetching playbooks:", error);
      res.status(500).json({ success: false, error: "Failed to fetch playbooks" });
    }
  });
  
  app.get("/api/suppliers/:supplierId/rfq-playbook", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const supplierId = parseInt(req.params.supplierId);
      const playbook = await storage.getActivePlaybookForSupplier(supplierId);
      res.json({ success: true, playbook: playbook || null });
    } catch (error: any) {
      console.error("Error fetching playbook:", error);
      res.status(500).json({ success: false, error: "Failed to fetch playbook" });
    }
  });
  
  app.get("/api/suppliers/:supplierId/rfq-playbooks/history", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const supplierId = parseInt(req.params.supplierId);
      const playbooks = await storage.getSupplierRfqPlaybooks(supplierId);
      res.json({ success: true, playbooks });
    } catch (error: any) {
      console.error("Error fetching playbook history:", error);
      res.status(500).json({ success: false, error: "Failed to fetch playbook history" });
    }
  });
  
  app.post("/api/suppliers/:supplierId/rfq-playbook", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const session = await storage.getAdminSession(sessionId);
      const user = session ? await storage.getUser(session.userId) : null;
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, error: "Only admins can create playbooks" });
      }
      
      const supplierId = parseInt(req.params.supplierId);
      const { preferredChannel, requiredFields, emailConfig, whatsappConfig, portalConfig, slaConfig, internalNotes } = req.body;
      
      if (!preferredChannel || !['EMAIL', 'WHATSAPP', 'PORTAL', 'PHONE'].includes(preferredChannel)) {
        return res.status(400).json({ success: false, error: "preferredChannel must be EMAIL, WHATSAPP, PORTAL, or PHONE" });
      }
      
      const playbook = await storage.createSupplierRfqPlaybook({
        supplierId,
        preferredChannel,
        requiredFields: requiredFields || [],
        emailConfig: emailConfig || null,
        whatsappConfig: whatsappConfig || null,
        portalConfig: portalConfig || null,
        slaConfig: slaConfig || { responseDaysDefault: 3, responseMaxDays: 5, followupIntervalHours: 24 },
        internalNotes: internalNotes || null,
        createdBy: user.id
      });
      
      res.json({ success: true, playbook });
    } catch (error: any) {
      console.error("Error creating playbook:", error);
      res.status(500).json({ success: false, error: "Failed to create playbook" });
    }
  });
  
  // --- RFQ Dispatches ---
  app.get("/api/deals/:dealId/rfq-dispatches", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const dispatches = await storage.getRfqDispatchesForDeal(req.params.dealId);
      
      // Enrich with supplier info
      const enriched = await Promise.all(dispatches.map(async (d) => {
        const supplier = await storage.getSupplier(d.supplierId);
        const playbook = d.supplierRfqPlaybookId ? await storage.getSupplierRfqPlaybook(d.supplierRfqPlaybookId) : null;
        return { ...d, supplier, playbook };
      }));
      
      res.json({ success: true, dispatches: enriched });
    } catch (error: any) {
      console.error("Error fetching dispatches:", error);
      res.status(500).json({ success: false, error: "Failed to fetch dispatches" });
    }
  });
  
  app.post("/api/deals/:dealId/rfq-dispatches", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const sessionId = req.headers["x-session-id"] as string;
      const session = await storage.getAdminSession(sessionId);
      const user = session ? await storage.getUser(session.userId) : null;
      
      const { supplierId, channelUsed, messageSubject, messageBody, attachments, localOverrides, overrideReason } = req.body;
      
      if (!supplierId || !channelUsed) {
        return res.status(400).json({ success: false, error: "supplierId and channelUsed are required" });
      }
      
      // Get playbook if exists
      const playbook = await storage.getActivePlaybookForSupplier(supplierId);
      
      // Get deal's dossier snapshot if locked
      const deal = await storage.getDeal(req.params.dealId);
      if (!deal) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }
      
      const dossier = await storage.getClientDossier(deal.clientId);
      let snapshotId = null;
      
      // HARD GATE: Dossier must exist and be at least READY (not DRAFT)
      if (!dossier || dossier.status === 'DRAFT') {
        return res.status(400).json({ 
          success: false, 
          error: "O dossiê deve estar completo (READY ou LOCKED) antes de enviar RFQ",
          code: "DOSSIER_NOT_READY"
        });
      }
      
      // If dossier is READY, auto-lock it and create snapshot before sending RFQ
      if (dossier && dossier.status === 'READY') {
        await storage.lockDossier(dossier.id, user?.id || 'system');
        const snapshot = await storage.createDossierSnapshot({
          clientDossierId: dossier.id,
          snapshotVersion: 1,
          snapshotData: {
            dossier,
            snapshotReason: 'RFQ_SENT',
            dealId: req.params.dealId
          },
          createdBy: user?.id || null,
          snapshotReason: 'RFQ_SENT'
        });
        snapshotId = snapshot.id;
      } else if (dossier && dossier.status === 'LOCKED') {
        // Get latest snapshot
        const snapshots = await storage.getDossierSnapshots(dossier.id);
        if (snapshots.length > 0) {
          snapshotId = snapshots[0].id;
        }
      }
      
      const dispatch = await storage.createRfqDispatch({
        dealId: req.params.dealId,
        supplierId,
        supplierRfqPlaybookId: playbook?.id || null,
        playbookVersion: playbook?.version || null,
        dossierSnapshotId: snapshotId,
        channelUsed,
        status: 'DRAFT',
        messageSubject: messageSubject || null,
        messageBody: messageBody || null,
        attachments: attachments || [],
        localOverrides: localOverrides || null,
        overrideReason: overrideReason || null,
        createdBy: user?.id || null,
        assignedToUserId: user?.id || null
      });
      
      res.json({ success: true, dispatch });
    } catch (error: any) {
      console.error("Error creating dispatch:", error);
      res.status(500).json({ success: false, error: "Failed to create dispatch" });
    }
  });
  
  // Mark dispatch as sent (starts SLA timer)
  app.post("/api/rfq-dispatches/:id/mark-sent", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const id = parseInt(req.params.id);
      const { responseDueDays } = req.body;
      
      const dispatch = await storage.getRfqDispatch(id);
      if (!dispatch) {
        return res.status(404).json({ success: false, error: "Dispatch not found" });
      }
      
      // Calculate due date based on playbook SLA or provided value
      const playbook = dispatch.supplierRfqPlaybookId 
        ? await storage.getSupplierRfqPlaybook(dispatch.supplierRfqPlaybookId) 
        : null;
      
      const slaConfig = playbook?.slaConfig as { responseDaysDefault?: number } | null;
      const daysUntilDue = responseDueDays || slaConfig?.responseDaysDefault || 3;
      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + daysUntilDue);
      
      const updated = await storage.markRfqDispatchSent(id, dueAt);
      
      res.json({ success: true, dispatch: updated });
    } catch (error: any) {
      console.error("Error marking dispatch sent:", error);
      res.status(500).json({ success: false, error: "Failed to mark dispatch sent" });
    }
  });
  
  // Mark dispatch as responded
  app.post("/api/rfq-dispatches/:id/mark-responded", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.markRfqDispatchResponded(id);
      
      if (!updated) {
        return res.status(404).json({ success: false, error: "Dispatch not found" });
      }
      
      res.json({ success: true, dispatch: updated });
    } catch (error: any) {
      console.error("Error marking dispatch responded:", error);
      res.status(500).json({ success: false, error: "Failed to mark dispatch responded" });
    }
  });
  
  // Log follow-up sent
  app.post("/api/rfq-dispatches/:id/followup", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.incrementFollowupCount(id);
      
      if (!updated) {
        return res.status(404).json({ success: false, error: "Dispatch not found" });
      }
      
      res.json({ success: true, dispatch: updated });
    } catch (error: any) {
      console.error("Error logging followup:", error);
      res.status(500).json({ success: false, error: "Failed to log followup" });
    }
  });
  
  // Get overdue dispatches (for Ops dashboard)
  app.get("/api/rfq-dispatches/overdue", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const dispatches = await storage.getOverdueRfqDispatches();
      
      // Enrich with supplier and deal info
      const enriched = await Promise.all(dispatches.map(async (d) => {
        const supplier = await storage.getSupplier(d.supplierId);
        const deal = await storage.getDeal(d.dealId);
        const client = deal ? await storage.getClient(deal.clientId) : null;
        return { ...d, supplier, deal, client };
      }));
      
      res.json({ success: true, dispatches: enriched });
    } catch (error: any) {
      console.error("Error fetching overdue dispatches:", error);
      res.status(500).json({ success: false, error: "Failed to fetch overdue dispatches" });
    }
  });
  
  // Get awaiting response dispatches
  app.get("/api/rfq-dispatches/awaiting", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const dispatches = await storage.getAwaitingResponseDispatches();
      
      // Enrich with supplier and deal info
      const enriched = await Promise.all(dispatches.map(async (d) => {
        const supplier = await storage.getSupplier(d.supplierId);
        const deal = await storage.getDeal(d.dealId);
        const client = deal ? await storage.getClient(deal.clientId) : null;
        const hoursRemaining = d.dueAt ? Math.round((new Date(d.dueAt).getTime() - Date.now()) / (1000 * 60 * 60)) : null;
        return { ...d, supplier, deal, client, hoursRemaining, isOverdue: hoursRemaining !== null && hoursRemaining < 0 };
      }));
      
      res.json({ success: true, dispatches: enriched });
    } catch (error: any) {
      console.error("Error fetching awaiting dispatches:", error);
      res.status(500).json({ success: false, error: "Failed to fetch awaiting dispatches" });
    }
  });
  
  // --- Supplier Scorecard ---
  app.get("/api/suppliers/scorecard", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const scorecards = await storage.getSupplierScorecard();
      res.json({ success: true, scorecards });
    } catch (error: any) {
      console.error("Error generating supplier scorecard:", error);
      res.status(500).json({ success: false, error: "Failed to generate scorecard" });
    }
  });
  
  // --- Dossier Edit Logs ---
  app.get("/api/dossiers/:dossierId/edit-logs", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const dossierId = parseInt(req.params.dossierId);
      const logs = await storage.getDossierEditLogs(dossierId);
      res.json({ success: true, logs });
    } catch (error: any) {
      console.error("Error fetching edit logs:", error);
      res.status(500).json({ success: false, error: "Failed to fetch edit logs" });
    }
  });
  
  // --- Deal Transition Overrides ---
  app.get("/api/deals/:dealId/transition-overrides", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const overrides = await storage.getDealTransitionOverrides(req.params.dealId);
      res.json({ success: true, overrides });
    } catch (error: any) {
      console.error("Error fetching overrides:", error);
      res.status(500).json({ success: false, error: "Failed to fetch overrides" });
    }
  });
  
  // --- Blind Auction Summary for Deal ---
  app.get("/api/deals/:dealId/blind-auction", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const deal = await storage.getDeal(req.params.dealId);
      if (!deal) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }
      
      const dispatches = await storage.getRfqDispatchesForDeal(req.params.dealId);
      const client = await storage.getClient(deal.clientId);
      const dossier = client ? await storage.getClientDossier(client.id) : null;
      
      // Get all suppliers with active playbooks
      const allPlaybooks = await storage.getAllActivePlaybooks();
      const supplierIds = allPlaybooks.map(p => p.supplierId);
      const suppliers = await Promise.all(supplierIds.map(id => storage.getSupplier(id)));
      
      // Check dossier readiness
      const dossierReady = dossier?.status === 'READY' || dossier?.status === 'LOCKED';
      
      // Stats
      const sent = dispatches.filter(d => d.status === 'SENT' || d.status === 'RESPONDED').length;
      const responded = dispatches.filter(d => d.status === 'RESPONDED').length;
      const overdue = dispatches.filter(d => d.status === 'SENT' && d.dueAt && new Date(d.dueAt) < new Date()).length;
      const awaitingResponse = dispatches.filter(d => d.status === 'SENT').length;
      
      res.json({
        success: true,
        deal,
        client,
        dossier: dossier ? { id: dossier.id, status: dossier.status } : null,
        dossierReady,
        dispatches,
        availableSuppliers: suppliers.filter(Boolean),
        stats: {
          totalSuppliers: suppliers.length,
          sent,
          responded,
          overdue,
          awaitingResponse
        }
      });
    } catch (error: any) {
      console.error("Error fetching blind auction data:", error);
      res.status(500).json({ success: false, error: "Failed to fetch blind auction data" });
    }
  });

  // --- Demo Data Seeder (Admin Only) ---
  // Check if demo mode is enabled via environment variable
  const isDemoModeEnabled = () => process.env.ENABLE_DEMO_MODE === 'true';
  
  app.get("/api/admin/demo/enabled", async (req, res) => {
    res.json({ success: true, enabled: isDemoModeEnabled() });
  });
  
  app.get("/api/admin/demo/stats", async (req, res) => {
    if (!isDemoModeEnabled()) {
      return res.status(403).json({ success: false, error: "Demo mode is disabled. Set ENABLE_DEMO_MODE=true to enable." });
    }
    if (!await validateDealOsSession(req, res)) return;
    
    const sessionId = req.headers["x-session-id"] as string;
    const session = await storage.getAdminSession(sessionId);
    const user = session ? await storage.getUser(session.userId) : null;
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: "Admin access required" });
    }
    
    try {
      const stats = await getDemoDataStats();
      res.json({ success: true, stats });
    } catch (error: any) {
      console.error("Error fetching demo stats:", error);
      res.status(500).json({ success: false, error: "Failed to fetch demo stats" });
    }
  });
  
  app.post("/api/admin/demo/seed", async (req, res) => {
    if (!isDemoModeEnabled()) {
      return res.status(403).json({ success: false, error: "Demo mode is disabled. Set ENABLE_DEMO_MODE=true to enable." });
    }
    if (!await validateDealOsSession(req, res)) return;
    
    const sessionId = req.headers["x-session-id"] as string;
    const session = await storage.getAdminSession(sessionId);
    const user = session ? await storage.getUser(session.userId) : null;
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: "Admin access required" });
    }
    
    try {
      const { scenarioPacks } = req.body as { scenarioPacks?: ScenarioPack[] };
      const result = await seedDemoData(scenarioPacks);
      await logAuditEvent({
        actor: user?.username || "system",
        actorRole: user?.role || null,
        actorIp: req.ip || null,
        userAgent: req.get("User-Agent") || null,
        action: "DEMO_DATA_SEEDED",
        entityType: "demo",
        entityId: null,
        detailsJson: result.summary
      });
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error seeding demo data:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to seed demo data" });
    }
  });
  
  app.post("/api/admin/demo/nuke", async (req, res) => {
    if (!isDemoModeEnabled()) {
      return res.status(403).json({ success: false, error: "Demo mode is disabled. Set ENABLE_DEMO_MODE=true to enable." });
    }
    if (!await validateDealOsSession(req, res)) return;
    
    const sessionId = req.headers["x-session-id"] as string;
    const session = await storage.getAdminSession(sessionId);
    const user = session ? await storage.getUser(session.userId) : null;
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: "Admin access required" });
    }
    
    try {
      const result = await nukeDemoData();
      await logAuditEvent({
        actor: user?.username || "system",
        actorRole: user?.role || null,
        actorIp: req.ip || null,
        userAgent: req.get("User-Agent") || null,
        action: "DEMO_DATA_NUKED",
        entityType: "demo",
        entityId: null,
        detailsJson: result.deleted
      });
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error nuking demo data:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to nuke demo data" });
    }
  });
  
  // Get available scenario packs
  app.get("/api/admin/demo/scenario-packs", async (req, res) => {
    if (!isDemoModeEnabled()) {
      return res.status(403).json({ success: false, error: "Demo mode is disabled." });
    }
    res.json({ success: true, packs: SCENARIO_PACK_LABELS });
  });
  
  // Get demo deals for tours
  app.get("/api/admin/demo/deals", async (req, res) => {
    if (!isDemoModeEnabled()) {
      return res.status(403).json({ success: false, error: "Demo mode is disabled." });
    }
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const deals = await getDemoDeals();
      res.json({ success: true, deals });
    } catch (error: any) {
      console.error("Error fetching demo deals:", error);
      res.status(500).json({ success: false, error: "Failed to fetch demo deals" });
    }
  });

  // Get demo proposals for guided flow
  app.get("/api/admin/demo/proposals", async (req, res) => {
    if (!isDemoModeEnabled()) {
      return res.status(403).json({ success: false, error: "Demo mode is disabled." });
    }
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const proposals = await getDemoProposals();
      res.json({ success: true, proposals });
    } catch (error: any) {
      console.error("Error fetching demo proposals:", error);
      res.status(500).json({ success: false, error: "Failed to fetch demo proposals" });
    }
  });

  // Get demo ECOS snapshots for guided flow
  app.get("/api/admin/demo/ecos-snapshots", async (req, res) => {
    if (!isDemoModeEnabled()) {
      return res.status(403).json({ success: false, error: "Demo mode is disabled." });
    }
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const snapshots = await getDemoEcosSnapshots();
      res.json({ success: true, snapshots });
    } catch (error: any) {
      console.error("Error fetching demo ECOS snapshots:", error);
      res.status(500).json({ success: false, error: "Failed to fetch demo ECOS snapshots" });
    }
  });

  // ============== ZOHO INTAKE ==============

  const zohoIntakeSchema = z.object({
    zohoLeadId: z.string().min(1, "zohoLeadId is required"),
    companyName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    cnpj: z.string().optional(),
    brMarket: z.enum(["ACL", "ACR", "Unknown"]).default("Unknown"),
    brGroup: z.enum(["A", "B", "Unknown"]).default("Unknown"),
    dmName: z.string().optional(),
    dmRole: z.enum(["Owner", "Finance", "Admin", "Operations", "Procurement", "Other", "Unknown"]).default("Unknown"),
    dmDirectPhone: z.string().optional(),
    dmAvailability: z.string().optional(),
    sourceAgent: z.enum(["Clara", "Sophia", "Unknown"]).default("Unknown"),
    outcome: z.enum(["Hotkey", "Warm", "Tepid"]),
    quickNote: z.string().optional(),
    callbackDateTime: z.string().optional()
  });

  async function logZohoIntakeEvent(
    zohoLeadId: string,
    payload: any,
    resultStatus: "CREATED" | "EXISTING" | "REJECTED" | "ERROR",
    portalDealId: string | null,
    portalClientId: number | null,
    errorMessage: string | null,
    ipAddress: string | null,
    userAgent: string | null
  ) {
    try {
      await db.insert(zohoIntakeEvents).values({
        zohoLeadId,
        payloadJson: payload,
        resultStatus,
        portalDealId,
        portalClientId,
        errorMessage,
        ipAddress,
        userAgent
      });
    } catch (dbError: any) {
      console.error("Failed to log Zoho intake event:", dbError);
    }
  }

  app.post("/api/intake/zoho/deal", async (req, res) => {
    const ipAddress = req.ip || req.headers["x-forwarded-for"]?.toString() || null;
    const userAgent = req.get("User-Agent") || null;
    
    const intakeKey = req.headers["x-zoho-intake-key"];
    const expectedKey = process.env.ZOHO_INTAKE_KEY;
    
    if (!expectedKey || intakeKey !== expectedKey) {
      await logZohoIntakeEvent(
        req.body?.zohoLeadId || "unknown",
        req.body,
        "REJECTED",
        null,
        null,
        "Invalid or missing x-zoho-intake-key header",
        ipAddress,
        userAgent
      );
      try {
        await db.insert(zohoIntakeErrors).values({
          zohoLeadId: req.body?.zohoLeadId || null,
          payloadJson: req.body || {},
          errorType: "AUTH_FAILED",
          errorMessage: "Invalid or missing x-zoho-intake-key header",
          ipAddress,
          userAgent
        });
      } catch (e) { console.error("Failed to log dead-letter:", e); }
      await logAuditEvent({
        actor: "zoho_intake",
        actorRole: "system",
        actorIp: ipAddress,
        userAgent,
        action: "ZOHO_INTAKE_REJECTED",
        entityType: "intake",
        entityId: null,
        detailsJson: { reason: "Invalid or missing intake key" }
      });
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized: Invalid or missing x-zoho-intake-key",
        portalDealId: null,
        portalDealUrl: null,
        created: false,
        ownerAssigned: null,
        stageAssigned: null
      });
    }
    
    const parseResult = zohoIntakeSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = fromError(parseResult.error).toString();
      await logZohoIntakeEvent(
        req.body?.zohoLeadId || "unknown",
        req.body,
        "REJECTED",
        null,
        null,
        errorMsg,
        ipAddress,
        userAgent
      );
      try {
        await db.insert(zohoIntakeErrors).values({
          zohoLeadId: req.body?.zohoLeadId || null,
          payloadJson: req.body || {},
          errorType: "VALIDATION_ERROR",
          errorMessage: errorMsg,
          errorDetails: parseResult.error.errors,
          ipAddress,
          userAgent
        });
      } catch (e) { console.error("Failed to log dead-letter:", e); }
      await logAuditEvent({
        actor: "zoho_intake",
        actorRole: "system",
        actorIp: ipAddress,
        userAgent,
        action: "ZOHO_INTAKE_REJECTED",
        entityType: "intake",
        entityId: null,
        detailsJson: { reason: "Validation failed", error: errorMsg }
      });
      return res.status(400).json({ 
        success: false, 
        error: errorMsg,
        portalDealId: null,
        portalDealUrl: null,
        created: false,
        ownerAssigned: null,
        stageAssigned: null
      });
    }
    
    const payload = parseResult.data;
    
    try {
      const existingDeal = await db.select().from(deals).where(eq(deals.zohoLeadId, payload.zohoLeadId)).limit(1);
      
      if (existingDeal.length > 0) {
        const deal = existingDeal[0];
        await logZohoIntakeEvent(
          payload.zohoLeadId,
          payload,
          "EXISTING",
          deal.id,
          deal.clientId,
          null,
          ipAddress,
          userAgent
        );
        await logAuditEvent({
          actor: "zoho_intake",
          actorRole: "system",
          actorIp: ipAddress,
          userAgent,
          action: "ZOHO_INTAKE_IDEMPOTENT",
          entityType: "deal",
          entityId: deal.id,
          detailsJson: { zohoLeadId: payload.zohoLeadId, message: "Deal already exists" }
        });
        
        const baseUrl = process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : process.env.REPLIT_DOMAINS?.split(",")[0] 
            ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
            : "https://otimaenergia.replit.app";
        
        return res.json({
          success: true,
          portalDealId: deal.id,
          portalDealUrl: `${baseUrl}/admin?tab=deals&deal=${deal.id}`,
          created: false,
          ownerAssigned: deal.internalOwner || null,
          stageAssigned: deal.status
        });
      }
      
      let client = null;
      
      if (payload.cnpj) {
        const cnpjNormalized = payload.cnpj.replace(/\D/g, "");
        const existingByCnpj = await db.select().from(clients)
          .where(sql`REGEXP_REPLACE(${clients.cnpj}, '[^0-9]', '', 'g') = ${cnpjNormalized}`)
          .limit(1);
        if (existingByCnpj.length > 0) {
          client = existingByCnpj[0];
        }
      }
      
      if (!client && payload.companyName && payload.email) {
        const existingByNameEmail = await db.select().from(clients)
          .where(and(
            ilike(clients.companyName, payload.companyName),
            ilike(clients.email, payload.email)
          ))
          .limit(1);
        if (existingByNameEmail.length > 0) {
          client = existingByNameEmail[0];
        }
      }
      
      let clientCreated = false;
      if (!client) {
        const newClient = await storage.createClient({
          companyName: payload.companyName || `Lead ${payload.zohoLeadId}`,
          email: payload.email || null,
          phone: payload.phone || null,
          cnpj: payload.cnpj || null,
          status: "prospect",
          contactPerson: payload.dmName || null
        });
        client = newClient;
        clientCreated = true;
        
        await logAuditEvent({
          actor: "zoho_intake",
          actorRole: "system",
          actorIp: ipAddress,
          userAgent,
          action: "ZOHO_INTAKE_CLIENT_CREATED",
          entityType: "client",
          entityId: client.id,
          detailsJson: { zohoLeadId: payload.zohoLeadId, companyName: client.companyName }
        });
      }
      
      let dealOwner = "Callum";
      if (payload.brGroup === "B") {
        dealOwner = "Callum";
      } else if (payload.outcome === "Hotkey") {
        dealOwner = "Renan";
      }
      
      const demoMode = process.env.ENABLE_DEMO_MODE === "true";
      
      const newDeal = await storage.createDeal({
        clientId: client.id,
        internalOwner: dealOwner,
        status: "DRAFT",
        zohoLeadId: payload.zohoLeadId,
        zohoLeadSourceAgent: payload.sourceAgent,
        zohoLeadOutcome: payload.outcome,
        zohoCallbackAt: payload.callbackDateTime ? new Date(payload.callbackDateTime) : null,
        zohoQuickNote: payload.quickNote || null,
        brMarket: payload.brMarket,
        brGroup: payload.brGroup,
        dmName: payload.dmName || null,
        dmRole: payload.dmRole,
        dmDirectPhone: payload.dmDirectPhone || null,
        dmAvailability: payload.dmAvailability || null
      });
      
      if (demoMode) {
        await db.update(deals).set({ isDemo: true }).where(eq(deals.id, newDeal.id));
      }
      
      await logZohoIntakeEvent(
        payload.zohoLeadId,
        payload,
        "CREATED",
        newDeal.id,
        client.id,
        null,
        ipAddress,
        userAgent
      );
      
      await logAuditEvent({
        actor: "zoho_intake",
        actorRole: "system",
        actorIp: ipAddress,
        userAgent,
        action: "ZOHO_INTAKE_DEAL_CREATED",
        entityType: "deal",
        dealId: newDeal.id,
        detailsJson: {
          zohoLeadId: payload.zohoLeadId,
          clientId: client.id,
          clientCreated,
          owner: dealOwner,
          outcome: payload.outcome,
          sourceAgent: payload.sourceAgent
        }
      });
      
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.REPLIT_DOMAINS?.split(",")[0] 
          ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
          : "https://otimaenergia.replit.app";
      
      return res.json({
        success: true,
        portalDealId: newDeal.id,
        portalDealUrl: `${baseUrl}/admin?tab=deals&deal=${newDeal.id}`,
        created: true,
        ownerAssigned: dealOwner,
        stageAssigned: "DRAFT"
      });
      
    } catch (error: any) {
      console.error("Zoho intake error:", error);
      await logZohoIntakeEvent(
        payload.zohoLeadId,
        payload,
        "ERROR",
        null,
        null,
        error.message || "Internal error",
        ipAddress,
        userAgent
      );
      try {
        await db.insert(zohoIntakeErrors).values({
          zohoLeadId: payload.zohoLeadId,
          payloadJson: payload,
          errorType: "INTERNAL_ERROR",
          errorMessage: error.message || "Internal server error",
          errorDetails: { stack: error.stack },
          ipAddress,
          userAgent
        });
      } catch (e) { console.error("Failed to log dead-letter:", e); }
      await logAuditEvent({
        actor: "zoho_intake",
        actorRole: "system",
        actorIp: ipAddress,
        userAgent,
        action: "ZOHO_INTAKE_ERROR",
        entityType: "intake",
        entityId: null,
        detailsJson: { zohoLeadId: payload.zohoLeadId, error: error.message }
      });
      return res.status(500).json({ 
        success: false, 
        error: "Internal server error",
        portalDealId: null,
        portalDealUrl: null,
        created: false,
        ownerAssigned: null,
        stageAssigned: null
      });
    }
  });

  // ============== ZOHO INTAKE ERRORS (DEAD-LETTER) ==============

  app.get("/api/admin/zoho-intake-errors", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const showResolved = req.query.showResolved === "true";
      const errors = await db.select().from(zohoIntakeErrors)
        .where(showResolved ? undefined : eq(zohoIntakeErrors.resolved, false))
        .orderBy(desc(zohoIntakeErrors.receivedAt))
        .limit(100);
      
      res.json({ success: true, errors });
    } catch (error: any) {
      console.error("Error fetching Zoho intake errors:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/admin/zoho-intake-errors/:id/resolve", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    const sessionId = req.headers["x-session-id"] as string;
    const session = await storage.getAdminSession(sessionId);
    const user = session ? await storage.getUser(session.userId) : null;
    
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    
    const { id } = req.params;
    const { notes } = req.body;
    
    try {
      await db.update(zohoIntakeErrors)
        .set({
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: user.username,
          resolvedNotes: notes || null
        })
        .where(eq(zohoIntakeErrors.id, parseInt(id)));
      
      await logAuditEvent({
        actor: user.username || "unknown",
        actorRole: user.role || null,
        actorIp: req.ip || null,
        userAgent: req.get("User-Agent") || null,
        action: "ZOHO_INTAKE_ERROR_RESOLVED",
        entityType: "zoho_intake_error",
        entityId: id,
        detailsJson: { notes }
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error resolving Zoho intake error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============== OPS GUARDRAILS: SEED PLAYBOOKS ==============

  app.post("/api/admin/ops/seed-playbooks", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    const sessionId = req.headers["x-session-id"] as string;
    const session = await storage.getAdminSession(sessionId);
    const user = session ? await storage.getUser(session.userId) : null;
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: "Admin access required" });
    }
    
    try {
      const result = await seedOpsPlaybooks();
      await logAuditEvent({
        actor: user.username || "system",
        actorRole: user.role || null,
        actorIp: req.ip || null,
        userAgent: req.get("User-Agent") || null,
        action: "OPS_PLAYBOOKS_SEEDED",
        entityType: "ops_playbooks",
        entityId: null,
        detailsJson: result
      });
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error seeding ops playbooks:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to seed playbooks" });
    }
  });

  // ============== PORTAL DICTIONARY: SEED ==============

  app.post("/api/admin/dictionary/seed", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    const sessionId = req.headers["x-session-id"] as string;
    const session = await storage.getAdminSession(sessionId);
    const user = session ? await storage.getUser(session.userId) : null;
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: "Admin access required" });
    }
    
    try {
      await seedDictionaryTerms();
      await logAuditEvent({
        actor: user.username || "system",
        actorRole: user.role || null,
        actorIp: req.ip || null,
        userAgent: req.get("User-Agent") || null,
        action: "DICTIONARY_SEEDED",
        entityType: "portal_dictionary",
        entityId: null,
        detailsJson: { message: "Dictionary terms seeded successfully" }
      });
      res.json({ success: true, message: "Dictionary terms seeded successfully" });
    } catch (error: any) {
      console.error("Error seeding dictionary:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to seed dictionary" });
    }
  });

  // ============== OPS GUARDRAILS: TOOLTIPS ==============

  app.get("/api/tooltips/dismissed", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    const sessionId = req.headers["x-session-id"] as string;
    const session = await storage.getAdminSession(sessionId);
    if (!session) return res.status(401).json({ success: false, error: "Unauthorized" });
    
    try {
      const dismissed = await storage.getDismissedTooltips(session.userId);
      res.json(dismissed.map(t => t.tooltipKey));
    } catch (error: any) {
      console.error("Error fetching dismissed tooltips:", error);
      res.status(500).json({ success: false, error: "Failed to fetch tooltips" });
    }
  });

  app.post("/api/tooltips/dismiss", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    const sessionId = req.headers["x-session-id"] as string;
    const session = await storage.getAdminSession(sessionId);
    if (!session) return res.status(401).json({ success: false, error: "Unauthorized" });
    
    const { tooltipKey } = req.body;
    if (!tooltipKey) {
      return res.status(400).json({ success: false, error: "tooltipKey required" });
    }
    
    try {
      await storage.dismissTooltip(session.userId, tooltipKey);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error dismissing tooltip:", error);
      res.status(500).json({ success: false, error: "Failed to dismiss tooltip" });
    }
  });

  app.post("/api/tooltips/reset", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    const sessionId = req.headers["x-session-id"] as string;
    const session = await storage.getAdminSession(sessionId);
    if (!session) return res.status(401).json({ success: false, error: "Unauthorized" });
    
    try {
      await storage.resetTooltips(session.userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error resetting tooltips:", error);
      res.status(500).json({ success: false, error: "Failed to reset tooltips" });
    }
  });

  // ============== OPS GUARDRAILS: CHECKLISTS ==============

  app.get("/api/checklists", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { dealStage } = req.query;
      const checklists = await storage.getChecklists(dealStage as string | undefined);
      res.json({ success: true, checklists });
    } catch (error: any) {
      console.error("Error fetching checklists:", error);
      res.status(500).json({ success: false, error: "Failed to fetch checklists" });
    }
  });

  app.get("/api/checklists/:checklistId/items", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const items = await storage.getChecklistItems(parseInt(req.params.checklistId));
      res.json({ success: true, items });
    } catch (error: any) {
      console.error("Error fetching checklist items:", error);
      res.status(500).json({ success: false, error: "Failed to fetch items" });
    }
  });

  app.get("/api/deals/:dealId/checklist", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { dealId } = req.params;
      const deal = await storage.getDealById(dealId);
      if (!deal) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }
      
      const checklists = await storage.getChecklists(deal.stage);
      const completions = await storage.getDealChecklistCompletions(dealId);
      
      const items: Record<number, any[]> = {};
      for (const checklist of checklists) {
        items[checklist.id] = await storage.getChecklistItems(checklist.id);
      }
      
      res.json({ success: true, checklists, completions, items });
    } catch (error: any) {
      console.error("Error fetching deal checklist:", error);
      res.status(500).json({ success: false, error: "Failed to fetch checklist" });
    }
  });

  app.post("/api/deals/:dealId/checklist/:itemId/complete", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    const sessionId = req.headers["x-session-id"] as string;
    const session = await storage.getAdminSession(sessionId);
    if (!session) return res.status(401).json({ success: false, error: "Unauthorized" });
    
    try {
      const { dealId, itemId } = req.params;
      const { notes, evidenceUrl } = req.body;
      
      const completion = await storage.completeChecklistItem({
        dealId,
        checklistItemId: parseInt(itemId),
        isCompleted: true,
        completedAt: new Date(),
        completedBy: session.userId,
        notes,
        evidenceUrl
      });
      
      await logAuditEvent({
        actor: session.userId,
        actorRole: null,
        actorIp: req.ip || null,
        userAgent: req.get("User-Agent") || null,
        action: "CHECKLIST_ITEM_COMPLETED",
        entityType: "checklist_completion",
        entityId: completion.id.toString(),
        detailsJson: { dealId, itemId, notes }
      });
      
      res.json({ success: true, completion });
    } catch (error: any) {
      console.error("Error completing checklist item:", error);
      res.status(500).json({ success: false, error: "Failed to complete item" });
    }
  });

  app.get("/api/deals/:dealId/blocker-check", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { dealId } = req.params;
      const { targetStage } = req.query;
      
      const blockers = await storage.getBlockingItems(dealId, targetStage as string);
      const canTransition = blockers.length === 0;
      
      res.json({ 
        success: true, 
        canTransition, 
        blockers: blockers.map(b => ({
          itemKey: b.itemKey,
          label: b.label,
          description: b.description,
          helpText: b.helpText
        }))
      });
    } catch (error: any) {
      console.error("Error checking blockers:", error);
      res.status(500).json({ success: false, error: "Failed to check blockers" });
    }
  });

  // ============== OPS GUARDRAILS: PLAYBOOKS ==============

  app.get("/api/playbooks", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { stage, scenarioKey } = req.query;
      const playbooks = await storage.getPlaybooks(stage as string | undefined, scenarioKey as string | undefined);
      res.json({ success: true, playbooks });
    } catch (error: any) {
      console.error("Error fetching playbooks:", error);
      res.status(500).json({ success: false, error: "Failed to fetch playbooks" });
    }
  });

  app.get("/api/playbooks/:scenarioKey", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const playbook = await storage.getPlaybookByKey(req.params.scenarioKey);
      if (!playbook) {
        return res.status(404).json({ success: false, error: "Playbook not found" });
      }
      res.json({ success: true, playbook });
    } catch (error: any) {
      console.error("Error fetching playbook:", error);
      res.status(500).json({ success: false, error: "Failed to fetch playbook" });
    }
  });

  // ============== OPS GUARDRAILS: ERROR TRACKING ==============

  app.post("/api/ops/errors", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    const sessionId = req.headers["x-session-id"] as string;
    const session = await storage.getAdminSession(sessionId);
    if (!session) return res.status(401).json({ success: false, error: "Unauthorized" });
    
    try {
      const event = await storage.logOpsError({
        ...req.body,
        userId: session.userId
      });
      res.json({ success: true, event });
    } catch (error: any) {
      console.error("Error logging ops error:", error);
      res.status(500).json({ success: false, error: "Failed to log error" });
    }
  });

  app.get("/api/ops/errors", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { dealId, userId, errorType, limit } = req.query;
      const errors = await storage.getOpsErrors({
        dealId: dealId as string | undefined,
        userId: userId as string | undefined,
        errorType: errorType as string | undefined,
        limit: limit ? parseInt(limit as string) : 100
      });
      res.json({ success: true, errors });
    } catch (error: any) {
      console.error("Error fetching ops errors:", error);
      res.status(500).json({ success: false, error: "Failed to fetch errors" });
    }
  });

  app.get("/api/ops/errors/heatmap", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { groupBy, dateFrom, dateTo } = req.query;
      const heatmap = await storage.getErrorHeatmap({
        groupBy: (groupBy as string) || 'stage',
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined
      });
      res.json({ success: true, heatmap });
    } catch (error: any) {
      console.error("Error fetching error heatmap:", error);
      res.status(500).json({ success: false, error: "Failed to fetch heatmap" });
    }
  });

  app.get("/api/ops/error-stats", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { range } = req.query;
      const now = new Date();
      let dateFrom: Date;
      
      switch (range) {
        case "24h": dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
        case "7d": dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case "30d": dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
        case "90d": dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
        default: dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const errors = await storage.getOpsErrors({ limit: 500 });
      const filteredErrors = errors.filter((e: any) => new Date(e.createdAt) >= dateFrom);
      
      const byStage: Record<string, number> = {};
      const byErrorCode: Record<string, number> = {};
      const byUser: Record<string, number> = {};
      const bySupplier: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};

      filteredErrors.forEach((e: any) => {
        byStage[e.stageAt] = (byStage[e.stageAt] || 0) + 1;
        byErrorCode[e.errorCode] = (byErrorCode[e.errorCode] || 0) + 1;
        if (e.userId) byUser[e.userId] = (byUser[e.userId] || 0) + 1;
        if (e.supplierId) bySupplier[e.supplierId] = (bySupplier[e.supplierId] || 0) + 1;
        bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
      });

      res.json({
        success: true,
        byStage,
        byErrorCode,
        byUser,
        bySupplier,
        bySeverity,
        recentErrors: filteredErrors.slice(0, 20)
      });
    } catch (error: any) {
      console.error("Error fetching error stats:", error);
      res.status(500).json({ success: false, error: "Failed to fetch error stats" });
    }
  });

  // ============== PORTAL DICTIONARY ==============

  app.get("/api/dictionary", async (req, res) => {
    try {
      const { category, search } = req.query;
      
      let result;
      if (search) {
        const searchTerm = `%${(search as string).toLowerCase()}%`;
        if (category && category !== "all") {
          result = await db.execute(sql`
            SELECT * FROM portal_dictionary_terms 
            WHERE category = ${category}::dictionary_category
            AND (
              LOWER(term_pt) LIKE ${searchTerm} 
              OR LOWER(term_en) LIKE ${searchTerm} 
              OR LOWER(key) LIKE ${searchTerm}
              OR LOWER(short_def_pt) LIKE ${searchTerm}
              OR LOWER(short_def_en) LIKE ${searchTerm}
              OR EXISTS (SELECT 1 FROM unnest(synonyms) AS syn WHERE LOWER(syn) LIKE ${searchTerm})
            )
            ORDER BY 
              CASE WHEN LOWER(term_pt) LIKE ${searchTerm} OR LOWER(term_en) LIKE ${searchTerm} THEN 0 ELSE 1 END,
              category, term_pt
          `);
        } else {
          result = await db.execute(sql`
            SELECT * FROM portal_dictionary_terms 
            WHERE LOWER(term_pt) LIKE ${searchTerm} 
              OR LOWER(term_en) LIKE ${searchTerm} 
              OR LOWER(key) LIKE ${searchTerm}
              OR LOWER(short_def_pt) LIKE ${searchTerm}
              OR LOWER(short_def_en) LIKE ${searchTerm}
              OR EXISTS (SELECT 1 FROM unnest(synonyms) AS syn WHERE LOWER(syn) LIKE ${searchTerm})
            ORDER BY 
              CASE WHEN LOWER(term_pt) LIKE ${searchTerm} OR LOWER(term_en) LIKE ${searchTerm} THEN 0 ELSE 1 END,
              category, term_pt
          `);
        }
      } else if (category && category !== "all") {
        result = await db.execute(sql`
          SELECT * FROM portal_dictionary_terms 
          WHERE category = ${category}::dictionary_category
          ORDER BY category, term_pt
        `);
      } else {
        result = await db.execute(sql`
          SELECT * FROM portal_dictionary_terms 
          ORDER BY category, term_pt
        `);
      }
      
      res.json({ success: true, terms: result.rows || [] });
    } catch (error: any) {
      console.error("Error fetching dictionary:", error);
      res.status(500).json({ success: false, error: "Failed to fetch dictionary" });
    }
  });

  app.get("/api/dictionary/:key", async (req, res) => {
    try {
      const result = await db.execute(
        sql`SELECT * FROM portal_dictionary_terms WHERE key = ${req.params.key}`
      );
      const term = (result.rows || [])[0];
      if (!term) {
        return res.status(404).json({ success: false, error: "Term not found" });
      }
      res.json({ success: true, term });
    } catch (error: any) {
      console.error("Error fetching dictionary term:", error);
      res.status(500).json({ success: false, error: "Failed to fetch term" });
    }
  });

  app.post("/api/dictionary", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { key, category, term_pt, term_en, short_def_pt, short_def_en, 
              why_matters_pt, why_matters_en, example_pt, example_en, 
              synonyms, related_keys } = req.body;
      
      await db.execute(sql`
        INSERT INTO portal_dictionary_terms (
          key, category, term_pt, term_en, short_def_pt, short_def_en,
          why_matters_pt, why_matters_en, example_pt, example_en,
          synonyms, related_keys
        ) VALUES (
          ${key}, ${category}::dictionary_category, ${term_pt}, ${term_en},
          ${short_def_pt}, ${short_def_en}, ${why_matters_pt}, ${why_matters_en},
          ${example_pt || null}, ${example_en || null},
          ${synonyms || []}, ${related_keys || []}
        )
        ON CONFLICT (key) DO UPDATE SET
          category = EXCLUDED.category,
          term_pt = EXCLUDED.term_pt,
          term_en = EXCLUDED.term_en,
          short_def_pt = EXCLUDED.short_def_pt,
          short_def_en = EXCLUDED.short_def_en,
          why_matters_pt = EXCLUDED.why_matters_pt,
          why_matters_en = EXCLUDED.why_matters_en,
          example_pt = EXCLUDED.example_pt,
          example_en = EXCLUDED.example_en,
          synonyms = EXCLUDED.synonyms,
          related_keys = EXCLUDED.related_keys,
          updated_at = NOW()
      `);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving dictionary term:", error);
      res.status(500).json({ success: false, error: "Failed to save term" });
    }
  });

  app.delete("/api/dictionary/:key", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      await db.execute(
        sql`DELETE FROM portal_dictionary_terms WHERE key = ${req.params.key}`
      );
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting dictionary term:", error);
      res.status(500).json({ success: false, error: "Failed to delete term" });
    }
  });

  // ============== OPS GUARDRAILS: PERFORMANCE METRICS ==============

  app.get("/api/ops/performance/:userId", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { periodType } = req.query;
      const snapshots = await storage.getPerformanceSnapshots(
        req.params.userId,
        periodType as string | undefined
      );
      res.json({ success: true, snapshots });
    } catch (error: any) {
      console.error("Error fetching performance:", error);
      res.status(500).json({ success: false, error: "Failed to fetch performance" });
    }
  });

  app.get("/api/ops/performance", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { periodType, periodStart, limit } = req.query;
      const snapshots = await storage.getAllPerformanceSnapshots({
        periodType: periodType as string | undefined,
        periodStart: periodStart ? new Date(periodStart as string) : undefined,
        limit: limit ? parseInt(limit as string) : 50
      });
      res.json({ success: true, snapshots });
    } catch (error: any) {
      console.error("Error fetching performance:", error);
      res.status(500).json({ success: false, error: "Failed to fetch performance" });
    }
  });

  // ============== PRC INGESTION & BENCHMARK PUBLISHING ==============
  
  // --- PRC Documents ---
  
  // List PRC documents with filters
  app.get("/api/prc/documents", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { supplierId, referenceMonth, parseStatus, isDemo } = req.query;
      const documents = await storage.getPrcDocuments({
        supplierId: supplierId ? parseInt(supplierId as string) : undefined,
        referenceMonth: referenceMonth as string | undefined,
        parseStatus: parseStatus as string | undefined,
        isDemo: isDemo === 'true' ? true : isDemo === 'false' ? false : undefined
      });
      
      // Enrich with supplier names and status
      const suppliers = await storage.getSuppliers();
      const enriched = documents.map(doc => {
        const supplier = suppliers.find(s => s.id === doc.supplierId);
        return {
          ...doc,
          supplierName: supplier?.name || 'Unknown',
          supplierStatus: supplier?.status || 'active'
        };
      });
      
      res.json({ success: true, documents: enriched });
    } catch (error: any) {
      console.error("Error fetching PRC documents:", error);
      res.status(500).json({ success: false, error: "Failed to fetch PRC documents" });
    }
  });
  
  // Get single PRC document with rows
  app.get("/api/prc/documents/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const document = await storage.getPrcDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ success: false, error: "PRC document not found" });
      }
      
      const rows = await storage.getPrcRows(document.id);
      const supplier = await storage.getSupplier(document.supplierId);
      
      res.json({ 
        success: true, 
        document: {
          ...document,
          supplierName: supplier?.name || 'Unknown',
          supplierStatus: supplier?.status || 'active'
        },
        rows 
      });
    } catch (error: any) {
      console.error("Error fetching PRC document:", error);
      res.status(500).json({ success: false, error: "Failed to fetch PRC document" });
    }
  });
  
  // Upload PRC document
  app.post("/api/prc/documents", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { supplierId, referenceMonth, fileStorageKey, fileUrl, originalFilename, fileSizeBytes, isDemo } = req.body;
      
      if (!supplierId || !referenceMonth || !fileStorageKey || !originalFilename) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }
      
      const supplier = await storage.getSupplier(parseInt(supplierId));
      if (!supplier) {
        return res.status(400).json({ success: false, error: "Supplier not found" });
      }
      
      const sourceName = `PRC ${supplier.name} ${referenceMonth}`;
      
      const userId = await getSessionUserId(req);
      
      const document = await storage.createPrcDocument({
        supplierId: parseInt(supplierId),
        referenceMonth,
        sourceName,
        fileStorageKey,
        fileUrl,
        originalFilename,
        fileSizeBytes: fileSizeBytes ? parseInt(fileSizeBytes) : undefined,
        uploadedByUserId: userId || null,
        isDemo: isDemo || false
      });
      
      // Log audit
      await storage.logAdminAction({
        action: 'PRC_DOCUMENT_UPLOADED',
        entityType: 'prc_documents',
        entityId: document.id,
        actor: userId || 'system',
        detailsJson: { supplierId, referenceMonth, originalFilename, sourceName }
      });
      
      res.json({ success: true, document });
    } catch (error: any) {
      console.error("Error creating PRC document:", error);
      res.status(500).json({ success: false, error: "Failed to create PRC document" });
    }
  });
  
  // Upload PRC PDF with auto-parse pipeline
  app.post("/api/prc/documents/upload", upload.single("file"), async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, error: "No file uploaded" });
      }
      
      const { supplierId, supplierName, referenceMonth, isDemo, submarketHint, source, notes, autoParse } = req.body;
      
      // Validate required fields - only referenceMonth is required now
      if (!referenceMonth) {
        return res.status(400).json({ success: false, error: "Missing referenceMonth" });
      }
      
      // Validate referenceMonth format (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(referenceMonth)) {
        return res.status(400).json({ success: false, error: "Invalid referenceMonth format. Use YYYY-MM" });
      }
      
      // Validate file type - only allow PDF for now (images route to OCR-only)
      const isPdf = file.mimetype === 'application/pdf';
      const isImage = ['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype);
      
      if (!isPdf && !isImage) {
        return res.status(400).json({ success: false, error: "Only PDF and image files are allowed" });
      }
      
      // Handle supplier: can be supplierId, supplierName, or auto-detect from filename
      let supplier;
      let parsedSupplierId: number;
      
      if (supplierId) {
        parsedSupplierId = parseInt(supplierId, 10);
        if (isNaN(parsedSupplierId) || parsedSupplierId <= 0) {
          return res.status(400).json({ success: false, error: "Invalid supplierId" });
        }
        supplier = await storage.getSupplier(parsedSupplierId);
        if (!supplier) {
          return res.status(400).json({ success: false, error: "Supplier not found" });
        }
      } else {
        // Use supplierName if provided, otherwise extract from filename
        const filename = file.originalname;
        const extractedName = extractSupplierNameFromFilename(filename);
        const stubName = supplierName || extractedName || `Unknown PRC ${Date.now()}`;
        const stubShortCode = `PRC_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        
        // Create prc_only supplier stub
        supplier = await storage.createSupplier({
          name: stubName,
          shortCode: stubShortCode,
          isActive: false,
          status: 'prc_only',
          source: 'prc_import'
        });
        parsedSupplierId = supplier.id;
        
        console.log(`Created prc_only supplier stub: ${stubName} (ID: ${supplier.id})`);
      }
      
      // Upload to object storage
      const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
      if (!bucketId) {
        return res.status(500).json({ success: false, error: "Object storage not configured" });
      }
      
      const timestamp = Date.now();
      const safeFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storageKey = `prc/${referenceMonth}/${parsedSupplierId}_${timestamp}_${safeFilename}`;
      
      const objectStorage = new ObjectStorageService();
      await objectStorage.upload(storageKey, file.buffer, file.mimetype);
      
      // Store relative key only - use signed URLs for access on-demand
      const sourceName = source || `PRC ${supplier.name} ${referenceMonth}`;
      const userId = await getSessionUserId(req);
      
      // Create PRC document record
      const document = await storage.createPrcDocument({
        supplierId: parsedSupplierId,
        referenceMonth,
        sourceName,
        fileStorageKey: storageKey,
        fileUrl: null, // Use signed URLs on-demand via fileStorageKey
        originalFilename: file.originalname,
        fileSizeBytes: file.size,
        uploadedByUserId: userId || null,
        isDemo: isDemo === 'true' || isDemo === true,
        notes: notes || null,
        submarketHint: submarketHint || null
      });
      
      // Log audit
      await storage.logAdminAction({
        action: 'PRC_DOCUMENT_UPLOADED',
        entityType: 'prc_documents',
        entityId: document.id,
        actor: userId || 'system',
        detailsJson: { supplierId: parsedSupplierId, referenceMonth, originalFilename: file.originalname, sourceName, fileType: isPdf ? 'pdf' : 'image' }
      });
      
      // Trigger auto-parse pipeline (async - don't await to respond quickly)
      // Pass isImage flag to parser to use OCR directly for images
      processPrcDocumentWithBuffer(document.id, file.buffer, isImage)
        .then(() => console.log(`PRC document ${document.id} parsing completed`))
        .catch((err) => console.error(`PRC document ${document.id} parsing failed:`, err));
      
      res.json({ 
        success: true, 
        document: {
          ...document,
          supplierName: supplier.name
        },
        message: "File uploaded, parsing started"
      });
    } catch (error: any) {
      console.error("Error uploading PRC document:", error);
      res.status(500).json({ success: false, error: "Failed to upload PRC document" });
    }
  });
  
  // Update PRC document parse status
  app.patch("/api/prc/documents/:id/status", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { status, confidence, errors } = req.body;
      
      if (!status) {
        return res.status(400).json({ success: false, error: "Status is required" });
      }
      
      const document = await storage.updatePrcDocumentParseStatus(
        parseInt(req.params.id),
        status,
        confidence,
        errors
      );
      
      if (!document) {
        return res.status(404).json({ success: false, error: "PRC document not found" });
      }
      
      res.json({ success: true, document });
    } catch (error: any) {
      console.error("Error updating PRC document status:", error);
      res.status(500).json({ success: false, error: "Failed to update status" });
    }
  });
  
  // Verify PRC document
  app.post("/api/prc/documents/:id/verify", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const userId = await getSessionUserId(req) || 'system';
      
      const document = await storage.verifyPrcDocument(parseInt(req.params.id), userId);
      
      if (!document) {
        return res.status(404).json({ success: false, error: "PRC document not found" });
      }
      
      // Log audit
      await storage.logAdminAction({
        action: 'PRC_DOCUMENT_VERIFIED',
        entityType: 'prc_documents',
        entityId: document.id,
        actor: userId,
        detailsJson: { supplierId: document.supplierId, referenceMonth: document.referenceMonth }
      });
      
      res.json({ success: true, document });
    } catch (error: any) {
      console.error("Error verifying PRC document:", error);
      res.status(500).json({ success: false, error: "Failed to verify document" });
    }
  });
  
  // Get signed URL for PRC document file access
  app.get("/api/prc/documents/:id/signed-url", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const document = await storage.getPrcDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ success: false, error: "PRC document not found" });
      }
      
      if (!document.fileStorageKey) {
        return res.status(404).json({ success: false, error: "Document has no associated file" });
      }
      
      const objectStorage = new ObjectStorageService();
      const signedUrl = await objectStorage.getSignedReadUrl(document.fileStorageKey, 3600); // 1 hour expiry
      
      res.json({ success: true, signedUrl, expiresIn: 3600 });
    } catch (error: any) {
      console.error("Error getting signed URL:", error);
      res.status(500).json({ success: false, error: "Failed to get signed URL" });
    }
  });
  
  // Delete PRC document
  app.delete("/api/prc/documents/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const userId = await getSessionUserId(req) || 'system';
      const document = await storage.getPrcDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ success: false, error: "PRC document not found" });
      }
      
      await storage.deletePrcDocument(parseInt(req.params.id));
      
      // Log audit
      await storage.logAdminAction({
        action: 'PRC_DOCUMENT_DELETED',
        entityType: 'prc_documents',
        entityId: document.id,
        actor: userId,
        detailsJson: { supplierId: document.supplierId, referenceMonth: document.referenceMonth }
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting PRC document:", error);
      res.status(500).json({ success: false, error: "Failed to delete document" });
    }
  });
  
  // --- PRC Rows ---
  
  // Create a new PRC row (manual entry)
  app.post("/api/prc/rows", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { prcDocumentId, supplierId, referenceMonth, submarket, productType, termMonths, priceRPerMWh, confidence } = req.body;
      
      if (!prcDocumentId || !supplierId || !referenceMonth || !submarket || !productType || priceRPerMWh === undefined) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }
      
      // Verify document exists
      const document = await storage.getPrcDocument(prcDocumentId);
      if (!document) {
        return res.status(404).json({ success: false, error: "PRC document not found" });
      }
      
      // Validate and coerce numeric fields
      const parsedPrice = typeof priceRPerMWh === 'string' ? parseFloat(priceRPerMWh) : priceRPerMWh;
      const parsedTerm = termMonths ? (typeof termMonths === 'string' ? parseInt(termMonths, 10) : termMonths) : null;
      const parsedConfidence = confidence !== undefined ? (typeof confidence === 'string' ? parseInt(confidence, 10) : confidence) : 100;
      
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ success: false, error: "Invalid price value" });
      }
      
      // Validate submarket and productType against allowed values
      const validSubmarkets = ['SECO', 'SUL', 'NNE', 'NORTE', 'NE'];
      const validProducts = ['CONVENCIONAL', 'INCENTIVADA', 'INC_I0', 'INC_I50', 'INC_I100'];
      
      if (!validSubmarkets.includes(submarket)) {
        return res.status(400).json({ success: false, error: "Invalid submarket" });
      }
      if (!validProducts.includes(productType)) {
        return res.status(400).json({ success: false, error: "Invalid product type" });
      }
      
      const row = await storage.createPrcRow({
        prcDocumentId,
        supplierId,
        referenceMonth,
        submarket,
        productType,
        termMonths: parsedTerm,
        priceRPerMWh: String(parsedPrice),
        confidence: parsedConfidence,
        isOutlierFlag: false
      });
      
      // Log audit
      const userId = await getSessionUserId(req) || 'system';
      await storage.logAdminAction({
        action: 'PRC_ROW_CREATED',
        entityType: 'prc_rows',
        entityId: row.id,
        actor: userId,
        detailsJson: { prcDocumentId, submarket, productType, priceRPerMWh }
      });
      
      res.json({ success: true, row });
    } catch (error: any) {
      console.error("Error creating PRC row:", error);
      res.status(500).json({ success: false, error: "Failed to create row" });
    }
  });
  
  // Get rows for a document
  app.get("/api/prc/documents/:id/rows", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const rows = await storage.getPrcRows(parseInt(req.params.id));
      res.json({ success: true, rows });
    } catch (error: any) {
      console.error("Error fetching PRC rows:", error);
      res.status(500).json({ success: false, error: "Failed to fetch rows" });
    }
  });
  
  // Update a single PRC row
  app.patch("/api/prc/rows/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const userId = await getSessionUserId(req) || 'system';
      const row = await storage.updatePrcRow(parseInt(req.params.id), req.body, userId);
      
      if (!row) {
        return res.status(404).json({ success: false, error: "PRC row not found" });
      }
      
      res.json({ success: true, row });
    } catch (error: any) {
      console.error("Error updating PRC row:", error);
      res.status(500).json({ success: false, error: "Failed to update row" });
    }
  });
  
  // Delete a single PRC row
  app.delete("/api/prc/rows/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      await storage.deletePrcRow(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting PRC row:", error);
      res.status(500).json({ success: false, error: "Failed to delete row" });
    }
  });
  
  // Get flagged rows needing review
  app.get("/api/prc/rows/flagged", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { referenceMonth } = req.query;
      const rows = await storage.getFlaggedPrcRows(referenceMonth as string | undefined);
      res.json({ success: true, rows });
    } catch (error: any) {
      console.error("Error fetching flagged rows:", error);
      res.status(500).json({ success: false, error: "Failed to fetch flagged rows" });
    }
  });
  
  // --- PRC Month Summary & Publishing ---
  
  // Get month summary (for publish preview)
  app.get("/api/prc/months/:month/summary", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { isDemo } = req.query;
      const summary = await storage.getPrcMonthSummary(
        req.params.month,
        isDemo === 'true' ? true : isDemo === 'false' ? false : undefined
      );
      
      // Enrich supplier coverage with names
      const suppliers = await storage.getSuppliers();
      const supplierNames = summary.supplierCoverage.map(id => 
        suppliers.find(s => s.id === id)?.name || 'Unknown'
      );
      
      res.json({ 
        success: true, 
        summary: {
          ...summary,
          supplierNames
        }
      });
    } catch (error: any) {
      console.error("Error fetching month summary:", error);
      res.status(500).json({ success: false, error: "Failed to fetch month summary" });
    }
  });
  
  // Get all rows for a month (for benchmark calculation)
  app.get("/api/prc/months/:month/rows", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { isDemo } = req.query;
      const rows = await storage.getPrcRowsForMonth(
        req.params.month,
        isDemo === 'true' ? true : isDemo === 'false' ? false : undefined
      );
      res.json({ success: true, rows });
    } catch (error: any) {
      console.error("Error fetching month rows:", error);
      res.status(500).json({ success: false, error: "Failed to fetch month rows" });
    }
  });
  
  // Get publish batches
  app.get("/api/prc/publish-batches", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { referenceMonth, status } = req.query;
      const batches = await storage.getPrcPublishBatches({
        referenceMonth: referenceMonth as string | undefined,
        status: status as string | undefined
      });
      res.json({ success: true, batches });
    } catch (error: any) {
      console.error("Error fetching publish batches:", error);
      res.status(500).json({ success: false, error: "Failed to fetch publish batches" });
    }
  });
  
  // Create publish batch (generate benchmarks)
  app.post("/api/prc/publish-batches", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { referenceMonth, isDemo } = req.body;
      
      if (!referenceMonth) {
        return res.status(400).json({ success: false, error: "Reference month is required" });
      }
      
      // Get verified documents for the month
      const allDocs = await storage.getPrcDocuments({ referenceMonth, isDemo });
      const verifiedDocs = allDocs.filter(d => 
        d.parseStatus === 'VERIFIED' || d.parseStatus === 'PUBLISHED'
      );
      
      if (verifiedDocs.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: "At least one verified PRC document is required to publish" 
        });
      }
      
      // Get all rows for benchmark calculation
      const rows = await storage.getPrcRowsForMonth(referenceMonth, isDemo);
      const validRows = rows.filter(r => !r.isOutlierFlag);
      
      // Get supplier names for batch name
      const suppliers = await storage.getSuppliers();
      const supplierCount = new Set(verifiedDocs.map(d => d.supplierId)).size;
      const batchName = `PRCs ${referenceMonth} (${supplierCount} suppliers)`;
      
      // Create the batch
      const batch = await storage.createPrcPublishBatch({
        referenceMonth,
        batchName,
        documentIds: verifiedDocs.map(d => d.id),
        documentCount: verifiedDocs.length,
        totalRowsUsed: validRows.length,
        coverageStats: {
          submarkets: Array.from(new Set(validRows.map(r => r.submarket))),
          products: Array.from(new Set(validRows.map(r => r.productType))),
          terms: Array.from(new Set(validRows.map(r => r.termMonths).filter(Boolean)))
        },
        isDemo: isDemo || false
      });
      
      res.json({ success: true, batch });
    } catch (error: any) {
      console.error("Error creating publish batch:", error);
      res.status(500).json({ success: false, error: "Failed to create publish batch" });
    }
  });
  
  // Publish batch (create benchmarks)
  app.post("/api/prc/publish-batches/:id/publish", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const batch = await storage.getPrcPublishBatch(parseInt(req.params.id));
      if (!batch) {
        return res.status(404).json({ success: false, error: "Publish batch not found" });
      }
      
      if (batch.status === 'PUBLISHED') {
        return res.status(400).json({ success: false, error: "Batch already published" });
      }
      
      const userId = await getSessionUserId(req) || 'system';
      
      // IMPORTANT: Only use rows from the batch's verified documents, not all rows from the month
      const batchDocumentIds = batch.documentIds as number[];
      
      // Get rows ONLY from the documents in this batch
      const allBatchRows: Awaited<ReturnType<typeof storage.getPrcRows>>[] = [];
      for (const docId of batchDocumentIds) {
        const docRows = await storage.getPrcRows(docId);
        allBatchRows.push(...docRows);
      }
      
      // Filter out outliers - only use verified, non-outlier rows
      const validRows = allBatchRows.filter(r => !r.isOutlierFlag);
      
      if (validRows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: "No valid rows found in batch documents" 
        });
      }
      
      // Track exactly which rows were used for audit trail
      const usedRowIds = validRows.map(r => r.id);
      
      // Group rows by submarket + productType + termMonths
      const grouped: Record<string, typeof validRows> = {};
      for (const row of validRows) {
        const key = `${row.submarket}|${row.productType}|${row.termMonths || 'unknown'}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
      }
      
      // Create benchmarks for each group
      const benchmarkIds: number[] = [];
      const today = new Date().toISOString().split('T')[0];
      
      for (const [key, groupRows] of Object.entries(grouped)) {
        const [submarket, productType, termStr] = key.split('|');
        const termMonths = termStr === 'unknown' ? null : parseInt(termStr);
        
        const prices = groupRows.map(r => parseFloat(r.priceRPerMWh)).sort((a, b) => a - b);
        const lowPrice = prices[Math.floor(prices.length * 0.25)] || prices[0];
        const midPrice = prices[Math.floor(prices.length * 0.5)] || prices[0];
        const highPrice = prices[Math.floor(prices.length * 0.75)] || prices[prices.length - 1];
        
        // Create the benchmark
        const benchmark = await storage.createBenchmark({
          segment: 'UNKNOWN',
          region: submarket,
          contractLengthMonths: termMonths || 24,
          lowerBoundRmwh: lowPrice.toFixed(2),
          upperBoundRmwh: highPrice.toFixed(2),
          midPriceRmwh: midPrice.toFixed(2),
          effectiveDate: today,
          referenceMonth: batch.referenceMonth,
          submarket,
          productType,
          termMonths,
          numSources: groupRows.length,
          sourceType: 'PRC',
          sourceName: batch.batchName,
          sourcePrcBatchId: batch.id,
          confidence: 'High',
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedByUserId: userId
        });
        
        benchmarkIds.push(benchmark.id);
      }
      
      // Update batch with published benchmarks
      const updatedBatch = await storage.publishPrcBatch(batch.id, userId, benchmarkIds);
      
      // Update all source documents to PUBLISHED status
      for (const docId of (batch.documentIds as number[])) {
        await storage.updatePrcDocumentParseStatus(docId, 'PUBLISHED');
      }
      
      // Log audit with full provenance
      await storage.logAdminAction({
        action: 'PRC_BATCH_PUBLISHED',
        entityType: 'prc_publish_batches',
        entityId: batch.id,
        actor: userId,
        detailsJson: { 
          referenceMonth: batch.referenceMonth, 
          benchmarksCreated: benchmarkIds.length,
          documentCount: batch.documentCount,
          documentIds: batchDocumentIds,
          rowsUsed: usedRowIds.length,
          rowIds: usedRowIds.slice(0, 100) // First 100 for audit, full list may be too large
        }
      });
      
      res.json({ 
        success: true, 
        batch: updatedBatch,
        benchmarksCreated: benchmarkIds.length
      });
    } catch (error: any) {
      console.error("Error publishing batch:", error);
      res.status(500).json({ success: false, error: "Failed to publish batch" });
    }
  });
  
  // Preview benchmarks for a month (without publishing)
  app.get("/api/prc/months/:month/benchmark-preview", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const { isDemo } = req.query;
      
      // Get rows for this month
      const rows = await storage.getPrcRowsForMonth(
        req.params.month,
        isDemo === 'true' ? true : isDemo === 'false' ? false : undefined
      );
      const validRows = rows.filter(r => !r.isOutlierFlag);
      
      // Group and calculate preview
      const grouped: Record<string, typeof validRows> = {};
      for (const row of validRows) {
        const key = `${row.submarket}|${row.productType}|${row.termMonths || 'unknown'}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
      }
      
      const preview = Object.entries(grouped).map(([key, groupRows]) => {
        const [submarket, productType, termStr] = key.split('|');
        const termMonths = termStr === 'unknown' ? null : parseInt(termStr);
        
        const prices = groupRows.map(r => parseFloat(r.priceRPerMWh)).sort((a, b) => a - b);
        
        return {
          submarket,
          productType,
          termMonths,
          lowPrice: prices[Math.floor(prices.length * 0.25)] || prices[0],
          midPrice: prices[Math.floor(prices.length * 0.5)] || prices[0],
          highPrice: prices[Math.floor(prices.length * 0.75)] || prices[prices.length - 1],
          numSources: groupRows.length,
          supplierIds: Array.from(new Set(groupRows.map(r => r.supplierId)))
        };
      });
      
      res.json({ success: true, preview });
    } catch (error: any) {
      console.error("Error generating benchmark preview:", error);
      res.status(500).json({ success: false, error: "Failed to generate preview" });
    }
  });

  // ============== BRAND KIT ==============
  
  // Get brand kit
  app.get("/api/brand-kit", async (req, res) => {
    try {
      const kit = await storage.getBrandKit();
      res.json({ success: true, brandKit: kit });
    } catch (error: any) {
      console.error("Error getting brand kit:", error);
      res.status(500).json({ success: false, error: "Failed to get brand kit" });
    }
  });
  
  // Update brand kit (admin only)
  app.patch("/api/brand-kit/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res, ['admin'])) return;
    
    try {
      const id = parseInt(req.params.id);
      const userId = req.session?.userId;
      
      const kit = await storage.updateBrandKit(id, {
        ...req.body,
        updatedByUserId: userId
      });
      
      if (!kit) {
        return res.status(404).json({ success: false, error: "Brand kit not found" });
      }
      
      await logAuditEvent({
        action: 'update',
        entityType: 'brand_kit',
        entityId: id.toString(),
        userId,
        changes: req.body,
        source: 'admin'
      });
      
      res.json({ success: true, brandKit: kit });
    } catch (error: any) {
      console.error("Error updating brand kit:", error);
      res.status(500).json({ success: false, error: "Failed to update brand kit" });
    }
  });

  // ============== DEAL ASSEMBLY (Montagem do Negócio) ==============
  
  const { DealAssemblyEngine } = await import('./deal-assembly-engine');
  const assemblyEngine = new DealAssemblyEngine(storage);
  
  // Get assembly status for a single deal
  app.get("/api/deals/:dealId/assembly-status", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const status = await assemblyEngine.getAssemblyStatus(req.params.dealId);
      if (!status) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }
      res.json({ success: true, ...status });
    } catch (error: any) {
      console.error("Error getting assembly status:", error);
      res.status(500).json({ success: false, error: "Failed to get assembly status" });
    }
  });
  
  // Get assembly queue (bulk)
  app.get("/api/deals/assembly-queue", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const userId = req.session?.userId;
      const userRole = req.session?.role;
      
      const filters: any = {};
      if (req.query.stage) filters.stage = req.query.stage as string;
      if (req.query.blockedOnly === 'true') filters.blockedOnly = true;
      if (req.query.needsActionToday === 'true') filters.needsActionToday = true;
      if (req.query.myDeals === 'true' && userRole !== 'admin') {
        filters.userId = userId;
      }
      
      const queue = await assemblyEngine.getAssemblyQueue(filters);
      res.json({ success: true, queue, total: queue.length });
    } catch (error: any) {
      console.error("Error getting assembly queue:", error);
      res.status(500).json({ success: false, error: "Failed to get assembly queue" });
    }
  });

  // ============== DEAL PROPOSALS (Proposal OS) ==============
  
  // Get proposals for a deal
  app.get("/api/deals/:dealId/proposals", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const proposals = await storage.getDealProposals(req.params.dealId);
      res.json({ success: true, proposals });
    } catch (error: any) {
      console.error("Error getting proposals:", error);
      res.status(500).json({ success: false, error: "Failed to get proposals" });
    }
  });
  
  // Get single proposal
  app.get("/api/proposals/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const proposal = await storage.getDealProposal(req.params.id);
      if (!proposal) {
        return res.status(404).json({ success: false, error: "Proposal not found" });
      }
      
      const items = await storage.getDealProposalItems(proposal.id);
      const snapshot = await storage.getDealProposalSnapshot(proposal.id);
      
      res.json({ success: true, proposal, items, snapshot });
    } catch (error: any) {
      console.error("Error getting proposal:", error);
      res.status(500).json({ success: false, error: "Failed to get proposal" });
    }
  });
  
  // Get eligible quotes for proposal (excludes expired/incomplete/risk-flagged)
  app.get("/api/deals/:dealId/eligible-quotes", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const quotes = await storage.getDealQuotes(req.params.dealId);
      const today = new Date().toISOString().split('T')[0];
      
      // Filter eligible quotes
      const eligibleQuotes = quotes.filter(q => {
        // Exclude expired
        if (q.validUntil && q.validUntil < today) return false;
        if (q.isExpired) return false;
        
        // Exclude incomplete (must have clientEnergyPriceRmwh or baseEnergyPriceRmwh and termMonths)
        if (!q.clientEnergyPriceRmwh && !q.baseEnergyPriceRmwh) return false;
        if (!q.termMonths) return false;
        
        // Exclude risk-flagged
        if (q.isRiskFlagged) return false;
        
        return true;
      });
      
      // Enrich with supplier names
      const suppliers = await storage.getSuppliers();
      const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));
      
      // Only return quotes with client pricing set (never expose base price)
      const quotesWithClientPrice = eligibleQuotes.filter(q => q.clientEnergyPriceRmwh);
      
      const enrichedQuotes = quotesWithClientPrice.map(q => ({
        id: q.id,
        supplierId: q.supplierId,
        supplierName: supplierMap.get(q.supplierId) || 'Unknown Supplier',
        energyType: q.energyType,
        clientEnergyPriceRmwh: q.clientEnergyPriceRmwh,
        validUntil: q.validUntil,
        termMonths: q.termMonths,
        priceStructure: q.priceStructure
      }));
      
      res.json({ success: true, quotes: enrichedQuotes });
    } catch (error: any) {
      console.error("Error getting eligible quotes:", error);
      res.status(500).json({ success: false, error: "Failed to get eligible quotes" });
    }
  });
  
  // Create proposal draft with baseline data
  app.post("/api/deals/:dealId/proposals", async (req, res) => {
    if (!await validateDealOsSession(req, res, ['admin', 'sales'])) return;
    
    try {
      const userId = req.session?.userId;
      const deal = await storage.getDeal(req.params.dealId);
      
      if (!deal) {
        return res.status(404).json({ success: false, error: "Deal not found" });
      }
      
      // Extract baseline data from request (bill-derived or manual)
      const {
        baselineConsumptionMwh12m,
        baselineEnergySupplyCost12m,
        baselineEnergySupplyCostManual,
        baselineCostIsProxy,
        baselineProxyLabel,
        baselineIsAnnualized,
        baselineSourceNote,
        validUntil,
        preparedByName,
        customNotes,
        proposalTitle
      } = req.body;
      
      // Determine effective baseline cost (extracted > manual > proxy)
      const effectiveBaselineCost = baselineEnergySupplyCost12m || baselineEnergySupplyCostManual;
      
      const proposal = await storage.createDealProposal({
        dealId: deal.id,
        clientId: deal.clientId!,
        status: 'DRAFT',
        createdByUserId: userId!,
        isDemo: deal.isDemo,
        baselineConsumptionMwh12m: baselineConsumptionMwh12m?.toString() || null,
        baselineEnergySupplyCost12m: effectiveBaselineCost?.toString() || null,
        baselineEnergySupplyCostManual: baselineEnergySupplyCostManual?.toString() || null,
        baselineCostIsProxy: baselineCostIsProxy || false,
        baselineProxyLabel: baselineCostIsProxy ? (baselineProxyLabel || 'Estimativa conservadora') : null,
        baselineIsAnnualized: baselineIsAnnualized || false,
        baselineSourceNote: baselineSourceNote || null,
        validUntil: validUntil || null,
        preparedByName: preparedByName || null,
        customNotes: customNotes || null,
        proposalTitle: proposalTitle || null
      });
      
      await logAuditEvent({
        action: 'create',
        entityType: 'deal_proposal',
        entityId: proposal.id,
        userId,
        changes: { dealId: deal.id, status: 'DRAFT', hasBaseline: !!baselineConsumptionMwh12m, isProxy: baselineCostIsProxy },
        source: 'portal'
      });
      
      res.json({ success: true, proposal });
    } catch (error: any) {
      console.error("Error creating proposal:", error);
      res.status(500).json({ success: false, error: "Failed to create proposal" });
    }
  });
  
  // Update proposal (baseline, metadata, recommended option)
  app.patch("/api/proposals/:proposalId", async (req, res) => {
    if (!await validateDealOsSession(req, res, ['admin', 'sales'])) return;
    
    try {
      const proposal = await storage.getDealProposal(req.params.proposalId);
      if (!proposal) {
        return res.status(404).json({ success: false, error: "Proposal not found" });
      }
      
      if (proposal.status !== 'DRAFT') {
        return res.status(400).json({ success: false, error: "Cannot modify generated proposal" });
      }
      
      // Block modifications if immutable snapshot exists
      if (proposal.proposalSnapshotJson) {
        return res.status(400).json({ success: false, error: "Proposal snapshot is immutable - cannot modify" });
      }
      
      const allowedFields = [
        'baselineConsumptionMwh12m', 'baselineEnergySupplyCost12m', 
        'baselineEnergySupplyCostManual', 'baselineCostIsProxy', 'baselineProxyLabel',
        'baselineIsAnnualized', 'baselineSourceNote',
        'recommendedItemId', 'recommendedReason',
        'validUntil', 'preparedByName', 'customNotes', 'proposalTitle'
      ];
      
      const updates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      
      const updated = await storage.updateDealProposal(proposal.id, updates);
      res.json({ success: true, proposal: updated });
    } catch (error: any) {
      console.error("Error updating proposal:", error);
      res.status(500).json({ success: false, error: "Failed to update proposal" });
    }
  });
  
  // Add item to proposal with savings calculation
  app.post("/api/proposals/:proposalId/items", async (req, res) => {
    if (!await validateDealOsSession(req, res, ['admin', 'sales'])) return;
    
    try {
      const proposal = await storage.getDealProposal(req.params.proposalId);
      if (!proposal) {
        return res.status(404).json({ success: false, error: "Proposal not found" });
      }
      
      if (proposal.status !== 'DRAFT') {
        return res.status(400).json({ success: false, error: "Cannot modify generated proposal" });
      }
      
      // Get deal quote
      const dealQuote = await storage.getDealQuote(req.body.dealQuoteId);
      if (!dealQuote) {
        return res.status(404).json({ success: false, error: "Deal quote not found" });
      }
      
      // Get supplier name
      const supplier = await storage.getSupplier(dealQuote.supplierId);
      const supplierName = supplier?.name || 'Unknown Supplier';
      
      // Calculate final price based on margin
      const basePrice = parseFloat(dealQuote.baseEnergyPriceRmwh || '0');
      const marginType = req.body.marginType || 'ADD_R_PER_MWH';
      const marginValue = parseFloat(req.body.marginValue || '0');
      
      let finalPrice: number;
      if (marginType === 'ADD_R_PER_MWH') {
        finalPrice = basePrice + marginValue;
      } else {
        finalPrice = basePrice * (1 + marginValue / 100);
      }
      
      // Term is required - use from request or quote
      const termMonths = req.body.termMonths || dealQuote.termMonths || 12;
      
      // Calculate savings if baseline exists
      let proposedCost12m: string | null = null;
      let savings12m: string | null = null;
      let savingsTotal: string | null = null;
      let savingsMonthlyAvg: string | null = null;
      let isNegativeSavings = false;
      
      const baselineConsumption = parseFloat(proposal.baselineConsumptionMwh12m || '0');
      const baselineCost = parseFloat(proposal.baselineEnergySupplyCost12m || '0');
      
      if (baselineConsumption > 0 && baselineCost > 0) {
        // proposed_cost_12m = MWh_annual × client_price
        const proposedCost12mNum = baselineConsumption * finalPrice;
        proposedCost12m = proposedCost12mNum.toFixed(2);
        
        // savings_12m = baseline_cost_12m - proposed_cost_12m
        const savings12mNum = baselineCost - proposedCost12mNum;
        savings12m = savings12mNum.toFixed(2);
        
        // savings_total = savings_12m × (term_months / 12)
        const savingsTotalNum = savings12mNum * (termMonths / 12);
        savingsTotal = savingsTotalNum.toFixed(2);
        
        // savings_monthly_avg = savings_total / term_months
        const savingsMonthlyNum = savingsTotalNum / termMonths;
        savingsMonthlyAvg = savingsMonthlyNum.toFixed(2);
        
        // Guardrail: mark negative savings
        isNegativeSavings = savingsTotalNum < 0;
      }
      
      const item = await storage.createDealProposalItem({
        proposalId: proposal.id,
        dealQuoteId: dealQuote.id,
        supplierId: dealQuote.supplierId,
        supplierName,
        productType: dealQuote.energyType,
        energyType: req.body.energyType || dealQuote.energyType || 'convencional',
        submarket: req.body.submarket || null,
        termMonths,
        validUntil: dealQuote.validUntil,
        indexationType: req.body.indexationType || null,
        supplierBaseEnergyPriceRmwh: dealQuote.baseEnergyPriceRmwh,
        marginType,
        marginValue: marginValue.toString(),
        clientEnergyPriceRmwh: finalPrice.toFixed(4),
        finalEnergyPriceRmwh: finalPrice.toFixed(4),
        proposedCost12m,
        savings12m,
        savingsTotal,
        savingsMonthlyAvg,
        isNegativeSavings,
        isRecommended: req.body.isRecommended || false,
        publicNotes: req.body.publicNotes
      });
      
      res.json({ success: true, item });
    } catch (error: any) {
      console.error("Error adding proposal item:", error);
      res.status(500).json({ success: false, error: "Failed to add proposal item" });
    }
  });
  
  // Update proposal item
  app.patch("/api/proposals/:proposalId/items/:itemId", async (req, res) => {
    if (!await validateDealOsSession(req, res, ['admin', 'sales'])) return;
    
    try {
      const proposal = await storage.getDealProposal(req.params.proposalId);
      if (!proposal || proposal.status !== 'DRAFT') {
        return res.status(400).json({ success: false, error: "Cannot modify generated proposal" });
      }
      
      const item = await storage.updateDealProposalItem(parseInt(req.params.itemId), req.body);
      res.json({ success: true, item });
    } catch (error: any) {
      console.error("Error updating proposal item:", error);
      res.status(500).json({ success: false, error: "Failed to update proposal item" });
    }
  });
  
  // Delete proposal item
  app.delete("/api/proposals/:proposalId/items/:itemId", async (req, res) => {
    if (!await validateDealOsSession(req, res, ['admin', 'sales'])) return;
    
    try {
      const proposal = await storage.getDealProposal(req.params.proposalId);
      if (!proposal || proposal.status !== 'DRAFT') {
        return res.status(400).json({ success: false, error: "Cannot modify generated proposal" });
      }
      
      await storage.deleteDealProposalItem(parseInt(req.params.itemId));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting proposal item:", error);
      res.status(500).json({ success: false, error: "Failed to delete proposal item" });
    }
  });
  
  // Generate proposal (mark as GENERATED, create snapshot)
  app.post("/api/proposals/:proposalId/generate", async (req, res) => {
    if (!await validateDealOsSession(req, res, ['admin', 'sales'])) return;
    
    try {
      const userId = req.session?.userId;
      const proposal = await storage.getDealProposal(req.params.proposalId);
      
      if (!proposal) {
        return res.status(404).json({ success: false, error: "Proposal not found" });
      }
      
      if (proposal.status !== 'DRAFT') {
        return res.status(400).json({ success: false, error: "Proposal already generated" });
      }
      
      // Check items exist
      const items = await storage.getDealProposalItems(proposal.id);
      if (items.length === 0) {
        return res.status(400).json({ success: false, error: "Proposal has no items" });
      }
      
      // HARD GATE: Must have at least 2 eligible quotes/items in proposal
      if (items.length < 2) {
        return res.status(400).json({ 
          success: false, 
          error: "A proposta requer no mínimo 2 cotações elegíveis",
          code: "INSUFFICIENT_QUOTES"
        });
      }
      
      // Check at least one recommended
      const hasRecommended = items.some(i => i.isRecommended);
      if (!hasRecommended) {
        return res.status(400).json({ success: false, error: "At least one item must be marked as recommended" });
      }
      
      // Get deal and client for snapshot
      const deal = await storage.getDeal(proposal.dealId);
      const client = await storage.getClient(proposal.clientId);
      const brandKit = await storage.getBrandKit();
      
      // Create snapshot data
      const snapshotData = {
        proposal,
        items: items.map(i => ({
          ...i,
          supplierBaseEnergyPriceRmwh: undefined // Never include base price in snapshot
        })),
        deal: {
          id: deal?.id,
          stage: deal?.stage,
          title: deal?.title
        },
        client: {
          id: client?.id,
          name: client?.contactName,
          company: client?.companyName
        },
        brandKit,
        generatedAt: new Date().toISOString(),
        generatedBy: userId
      };
      
      // Create SHA-256 hash
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256')
        .update(JSON.stringify(snapshotData))
        .digest('hex');
      
      // Create snapshot in separate table (for querying)
      await storage.createDealProposalSnapshot({
        proposalId: proposal.id,
        snapshotJson: snapshotData,
        sha256Hash: hash,
        createdByUserId: userId!,
        isDemo: proposal.isDemo
      });
      
      // Also store immutable snapshot on proposal itself
      const updatedProposal = await storage.updateDealProposal(proposal.id, {
        status: 'GENERATED',
        proposalSnapshotJson: snapshotData
      });
      
      await logAuditEvent({
        action: 'generate',
        entityType: 'deal_proposal',
        entityId: proposal.id,
        userId,
        changes: { status: 'GENERATED', sha256Hash: hash },
        source: 'portal'
      });
      
      res.json({ success: true, proposal: updatedProposal });
    } catch (error: any) {
      console.error("Error generating proposal:", error);
      res.status(500).json({ success: false, error: "Failed to generate proposal" });
    }
  });
  
  // Mark proposal as sent
  app.post("/api/proposals/:proposalId/send", async (req, res) => {
    if (!await validateDealOsSession(req, res, ['admin', 'sales'])) return;
    
    try {
      const userId = req.session?.userId;
      const proposal = await storage.getDealProposal(req.params.proposalId);
      
      if (!proposal) {
        return res.status(404).json({ success: false, error: "Proposal not found" });
      }
      
      if (proposal.status === 'DRAFT') {
        return res.status(400).json({ success: false, error: "Proposal must be generated first" });
      }
      
      const updated = await storage.updateDealProposal(proposal.id, {
        status: 'SENT',
        sentAt: new Date()
      });
      
      await logAuditEvent({
        action: 'send',
        entityType: 'deal_proposal',
        entityId: proposal.id,
        userId,
        changes: { status: 'SENT' },
        source: 'portal'
      });
      
      res.json({ success: true, proposal: updated });
    } catch (error: any) {
      console.error("Error marking proposal sent:", error);
      res.status(500).json({ success: false, error: "Failed to mark proposal sent" });
    }
  });
  
  // Update proposal status (accept/reject)
  app.post("/api/proposals/:proposalId/status", async (req, res) => {
    if (!await validateDealOsSession(req, res, ['admin', 'sales'])) return;
    
    try {
      const userId = req.session?.userId;
      const { status } = req.body;
      
      if (!['ACCEPTED', 'REJECTED', 'EXPIRED'].includes(status)) {
        return res.status(400).json({ success: false, error: "Invalid status" });
      }
      
      const updated = await storage.updateDealProposal(req.params.proposalId, { status });
      
      await logAuditEvent({
        action: 'update_status',
        entityType: 'deal_proposal',
        entityId: req.params.proposalId,
        userId,
        changes: { status },
        source: 'portal'
      });
      
      res.json({ success: true, proposal: updated });
    } catch (error: any) {
      console.error("Error updating proposal status:", error);
      res.status(500).json({ success: false, error: "Failed to update status" });
    }
  });
  
  // Public proposal view (no auth required)
  app.get("/api/public/proposals/:publicId", async (req, res) => {
    try {
      const proposal = await storage.getDealProposalByPublicId(req.params.publicId);
      
      if (!proposal || !proposal.publicEnabled) {
        return res.status(404).json({ success: false, error: "Proposal not found" });
      }
      
      // Record view
      const crypto = await import('crypto');
      const ipHash = crypto.createHash('sha256')
        .update(req.ip || 'unknown')
        .digest('hex')
        .substring(0, 16);
      
      await storage.recordDealProposalView({
        proposalId: proposal.id,
        ipHash,
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referrer'),
        isDemo: proposal.isDemo
      });
      
      // Increment view count
      await storage.incrementDealProposalViewCount(proposal.id);
      
      // Update status to VIEWED if sent
      if (proposal.status === 'SENT') {
        await storage.updateDealProposal(proposal.id, { status: 'VIEWED' });
      }
      
      // Get snapshot (customer-safe data)
      const snapshot = await storage.getDealProposalSnapshot(proposal.id);
      const brandKit = await storage.getBrandKit();
      
      // SECURITY: Sanitize snapshot to ensure no supplier base prices leak
      let sanitizedSnapshot = snapshot?.snapshotJson;
      if (sanitizedSnapshot && sanitizedSnapshot.items) {
        sanitizedSnapshot = {
          ...sanitizedSnapshot,
          items: sanitizedSnapshot.items.map((item: any) => ({
            id: item.id,
            supplierName: item.supplierName,
            productType: item.productType,
            finalEnergyPriceRmwh: item.finalEnergyPriceRmwh,
            isRecommended: item.isRecommended,
            publicNotes: item.publicNotes
            // Explicitly omit: supplierBaseEnergyPriceRmwh, marginType, marginValue, supplierId, dealQuoteId
          }))
        };
      }
      
      res.json({ 
        success: true, 
        proposal: {
          id: proposal.id,
          publicId: proposal.publicId,
          status: proposal.status,
          createdAt: proposal.createdAt
        },
        snapshot: sanitizedSnapshot,
        brandKit
      });
    } catch (error: any) {
      console.error("Error getting public proposal:", error);
      res.status(500).json({ success: false, error: "Failed to get proposal" });
    }
  });
  
  // Get proposal views
  app.get("/api/proposals/:proposalId/views", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    
    try {
      const views = await storage.getDealProposalViews(req.params.proposalId);
      res.json({ success: true, views });
    } catch (error: any) {
      console.error("Error getting proposal views:", error);
      res.status(500).json({ success: false, error: "Failed to get views" });
    }
  });

  // Generate proposal PDF with brand kit styling
  app.get("/api/proposals/:proposalId/pdf", async (req, res) => {
    if (!await validateDealOsSession(req, res, ['admin', 'sales'])) return;
    
    try {
      const proposal = await storage.getDealProposal(req.params.proposalId);
      if (!proposal) {
        return res.status(404).json({ success: false, error: "Proposal not found" });
      }
      
      if (proposal.status === 'DRAFT') {
        return res.status(400).json({ success: false, error: "Proposal must be generated first" });
      }
      
      const snapshot = await storage.getDealProposalSnapshot(proposal.id);
      if (!snapshot) {
        return res.status(404).json({ success: false, error: "Snapshot not found" });
      }
      
      const brandKit = await storage.getBrandKit();
      const client = await storage.getClient(proposal.clientId);
      
      // Build branded HTML for PDF
      const snapshotData = snapshot.snapshotJson as any;
      const items = snapshotData.items || [];
      const recommendedItem = items.find((i: any) => i.isRecommended);
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=${brandKit?.fontFamily || 'Inter'}:wght@400;500;600;700&display=swap');
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: '${brandKit?.fontFamily || 'Inter'}', sans-serif;
              color: ${brandKit?.textColor || '#736d77'};
              background: white;
              padding: 40px;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 3px solid ${brandKit?.primaryColor || '#9e3ffd'};
            }
            
            .brand-name {
              font-size: 28px;
              font-weight: 700;
              color: ${brandKit?.darkColor || '#16163f'};
            }
            
            .tagline {
              font-size: 14px;
              color: ${brandKit?.textColor || '#736d77'};
              margin-top: 4px;
            }
            
            .proposal-date {
              text-align: right;
              font-size: 12px;
              color: ${brandKit?.textColor || '#736d77'};
            }
            
            .client-section {
              background: ${brandKit?.lightBgColor || '#eee7f1'};
              padding: 24px;
              border-radius: 12px;
              margin-bottom: 30px;
            }
            
            .client-section h2 {
              color: ${brandKit?.darkColor || '#16163f'};
              font-size: 18px;
              margin-bottom: 8px;
            }
            
            .client-name {
              font-size: 24px;
              font-weight: 600;
              color: ${brandKit?.primaryColor || '#9e3ffd'};
            }
            
            .section-title {
              font-size: 20px;
              font-weight: 600;
              color: ${brandKit?.darkColor || '#16163f'};
              margin-bottom: 16px;
              padding-bottom: 8px;
              border-bottom: 2px solid ${brandKit?.primaryColor || '#9e3ffd'};
            }
            
            .quote-card {
              border: 1px solid #e5e5e5;
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 16px;
              background: white;
            }
            
            .quote-card.recommended {
              border: 2px solid ${brandKit?.primaryColor || '#9e3ffd'};
              background: linear-gradient(135deg, ${brandKit?.lightBgColor || '#eee7f1'}20, white);
            }
            
            .quote-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
            }
            
            .supplier-name {
              font-size: 18px;
              font-weight: 600;
              color: ${brandKit?.darkColor || '#16163f'};
            }
            
            .recommended-badge {
              background: linear-gradient(135deg, ${brandKit?.primaryColor || '#9e3ffd'}, ${brandKit?.secondaryColor || '#df0af2'});
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 500;
            }
            
            .quote-details {
              display: flex;
              gap: 40px;
            }
            
            .quote-detail {
              flex: 1;
            }
            
            .quote-label {
              font-size: 12px;
              color: ${brandKit?.textColor || '#736d77'};
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            
            .quote-value {
              font-size: 24px;
              font-weight: 700;
              color: ${brandKit?.primaryColor || '#9e3ffd'};
            }
            
            .quote-notes {
              margin-top: 12px;
              padding-top: 12px;
              border-top: 1px solid #e5e5e5;
              font-size: 14px;
              color: ${brandKit?.textColor || '#736d77'};
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e5e5;
              text-align: center;
              font-size: 12px;
              color: ${brandKit?.textColor || '#736d77'};
            }
            
            .cta-section {
              background: linear-gradient(135deg, ${brandKit?.primaryColor || '#9e3ffd'}, ${brandKit?.secondaryColor || '#df0af2'});
              color: white;
              padding: 24px;
              border-radius: 12px;
              text-align: center;
              margin-top: 30px;
            }
            
            .cta-title {
              font-size: 20px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            
            .cta-text {
              font-size: 14px;
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand-name">${brandKit?.brandName || 'Ótima Energia'}</div>
              <div class="tagline">${brandKit?.tagline || 'Sua energia. Sua escolha. Sua economia.'}</div>
            </div>
            <div class="proposal-date">
              <div>Proposta #${proposal.publicId?.substring(0, 8).toUpperCase()}</div>
              <div>${new Date(proposal.createdAt).toLocaleDateString('pt-BR')}</div>
            </div>
          </div>
          
          <div class="client-section">
            <h2>Proposta para</h2>
            <div class="client-name">${client?.companyName || snapshotData.client?.company || 'Cliente'}</div>
          </div>
          
          <div class="section-title">Opções de Fornecimento</div>
          
          ${items.map((item: any) => `
            <div class="quote-card ${item.isRecommended ? 'recommended' : ''}">
              <div class="quote-header">
                <div class="supplier-name">${item.supplierName}</div>
                ${item.isRecommended ? '<div class="recommended-badge">Recomendado</div>' : ''}
              </div>
              <div class="quote-details">
                <div class="quote-detail">
                  <div class="quote-label">Produto</div>
                  <div class="quote-value" style="font-size: 16px; color: ${brandKit?.darkColor || '#16163f'};">${item.productType === 'INCENTIVIZED_50' ? 'I-50%' : item.productType === 'INCENTIVIZED_100' ? 'I-100%' : 'Convencional'}</div>
                </div>
                <div class="quote-detail">
                  <div class="quote-label">Preço Final</div>
                  <div class="quote-value">R$ ${parseFloat(item.finalEnergyPriceRmwh).toFixed(2)}/MWh</div>
                </div>
              </div>
              ${item.publicNotes ? `<div class="quote-notes">${item.publicNotes}</div>` : ''}
            </div>
          `).join('')}
          
          <div class="cta-section">
            <div class="cta-title">Pronto para economizar?</div>
            <div class="cta-text">Entre em contato para finalizar sua proposta e começar a economizar na sua conta de energia.</div>
          </div>
          
          <div class="footer">
            ${brandKit?.footerText || 'Ótima Energia • contato@otimaenergia.com.br • Rio de Janeiro - Brasil'}
          </div>
        </body>
        </html>
      `;
      
      // Generate PDF using Puppeteer
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
      });
      
      await browser.close();
      
      // Set headers for PDF download
      const filename = `proposta-${proposal.publicId?.substring(0, 8) || proposal.id}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
      
    } catch (error: any) {
      console.error("Error generating proposal PDF:", error);
      res.status(500).json({ success: false, error: "Failed to generate PDF" });
    }
  });

  // ============== FINANCE OS (INVOICING) ==============
  
  // Helper: Check invoice permission level
  const checkInvoicePermission = async (userId: string, requiredLevel: 'VIEW_ONLY' | 'SEND_ONLY' | 'MANAGE'): Promise<boolean> => {
    const user = await storage.getUser(userId);
    // Admin role always has MANAGE access
    if (user?.role === 'admin') return true;
    
    const permission = await storage.getInvoicePermission(userId);
    if (!permission) return false;
    
    const levels = { 'VIEW_ONLY': 1, 'SEND_ONLY': 2, 'MANAGE': 3 };
    return levels[permission.accessLevel] >= levels[requiredLevel];
  };
  
  // GET /api/invoices - List all invoices with optional filters
  app.get("/api/invoices", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const userId = await getSessionUserId(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      
      const hasAccess = await checkInvoicePermission(userId, 'VIEW_ONLY');
      if (!hasAccess) {
        return res.status(403).json({ error: "No access to invoices" });
      }
      
      const { status, dealId, supplierId, isDemo } = req.query;
      const filters: any = {};
      if (status) filters.status = status as string;
      if (dealId) filters.dealId = dealId as string;
      if (supplierId) filters.supplierId = parseInt(supplierId as string);
      if (isDemo !== undefined) filters.isDemo = isDemo === 'true';
      
      const invoiceList = await storage.getInvoices(Object.keys(filters).length > 0 ? filters : undefined);
      res.json(invoiceList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // GET /api/invoices/summary - Get invoice summary stats
  app.get("/api/invoices/summary", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const userId = await getSessionUserId(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      
      const hasAccess = await checkInvoicePermission(userId, 'VIEW_ONLY');
      if (!hasAccess) {
        return res.status(403).json({ error: "No access to invoices" });
      }
      
      const isDemo = req.query.isDemo === 'true' ? true : req.query.isDemo === 'false' ? false : undefined;
      const summary = await storage.getInvoiceSummary(isDemo);
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // GET /api/invoices/:id - Get single invoice with events
  app.get("/api/invoices/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const userId = await getSessionUserId(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      
      const hasAccess = await checkInvoicePermission(userId, 'VIEW_ONLY');
      if (!hasAccess) {
        return res.status(403).json({ error: "No access to invoices" });
      }
      
      const invoice = await storage.getInvoice(parseInt(req.params.id));
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      const events = await storage.getInvoiceEvents(invoice.id);
      res.json({ ...invoice, events });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // POST /api/invoices - Create new invoice
  app.post("/api/invoices", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const userId = await getSessionUserId(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      
      const hasAccess = await checkInvoicePermission(userId, 'MANAGE');
      if (!hasAccess) {
        return res.status(403).json({ error: "No permission to create invoices" });
      }
      
      const invoiceNumber = await storage.generateInvoiceNumber();
      const invoice = await storage.createInvoice({
        ...req.body,
        invoiceNumber,
        status: 'DRAFT'
      });
      
      // Log creation event
      await storage.createInvoiceEvent({
        invoiceId: invoice.id,
        eventType: 'CREATED',
        actorId: userId,
        metadata: { invoiceNumber }
      });
      
      res.status(201).json(invoice);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // POST /api/commission-events/:id/generate-invoice - One-click invoice from commission event
  app.post("/api/commission-events/:id/generate-invoice", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const userId = await getSessionUserId(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      
      const hasAccess = await checkInvoicePermission(userId, 'MANAGE');
      if (!hasAccess) {
        return res.status(403).json({ error: "No permission to create invoices" });
      }
      
      const eventId = parseInt(req.params.id);
      
      // Get the commission event
      const events = await db.select().from(dealCommissionEvents).where(eq(dealCommissionEvents.id, eventId));
      const commissionEvent = events[0];
      
      if (!commissionEvent) {
        return res.status(404).json({ error: "Commission event not found" });
      }
      
      // Check if invoice already exists for this event
      const existingInvoices = await db.select().from(invoices).where(eq(invoices.commissionEventId, eventId));
      if (existingInvoices.length > 0) {
        return res.status(400).json({ error: "Invoice already exists for this commission event", invoiceId: existingInvoices[0].id });
      }
      
      // Get deal details
      const deal = await storage.getDeal(commissionEvent.dealId);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      
      // Get accepted quote for supplier info
      const quotes = await storage.getDealQuotes(commissionEvent.dealId);
      const acceptedQuote = quotes.find(q => q.status === 'ACCEPTED');
      
      // Determine invoice type from event type
      let invoiceType: 'MILESTONE_1' | 'MILESTONE_2' | 'ADJUSTMENT' = 'MILESTONE_1';
      if (commissionEvent.eventType === 'MILESTONE_2') invoiceType = 'MILESTONE_2';
      else if (commissionEvent.eventType === 'ADJUSTMENT') invoiceType = 'ADJUSTMENT';
      
      // Get supplier playbook for payment terms
      const playbook = acceptedQuote?.supplierId ? await storage.getSupplierPlaybook(acceptedQuote.supplierId) : null;
      const paymentDueDays = playbook?.defaultPaymentDueDays || 7;
      
      // Calculate due date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + paymentDueDays);
      
      // Generate invoice number
      const invoiceNumber = await storage.generateInvoiceNumber();
      
      // Create the invoice
      const invoice = await storage.createInvoice({
        dealId: commissionEvent.dealId,
        supplierId: acceptedQuote?.supplierId || null,
        clientId: deal.clientId || null,
        commissionEventId: eventId,
        invoiceNumber,
        invoiceType,
        status: 'DRAFT',
        dueDate,
        amountBrl: commissionEvent.amountBrl || null,
        // Calculate MWh amount from R$/MWh and deal volume
        description: `${commissionEvent.paymentTrigger || invoiceType} - ${deal.id}`,
        notes: commissionEvent.notes || null,
        createdBy: userId,
      });
      
      // Update commission event with invoice reference
      await storage.updateDealCommissionEvent(eventId, {
        status: 'INVOICED',
        invoicedAt: new Date(),
      });
      
      // Log creation event
      await storage.createInvoiceEvent({
        invoiceId: invoice.id,
        eventType: 'CREATED',
        actorId: userId,
        metadata: { 
          invoiceNumber, 
          fromCommissionEvent: eventId,
          paymentTrigger: commissionEvent.paymentTrigger
        }
      });
      
      res.status(201).json({ success: true, invoice });
    } catch (error: any) {
      console.error("Error generating invoice from commission event:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // PATCH /api/invoices/:id - Update invoice (MANAGE only, DRAFT only)
  app.patch("/api/invoices/:id", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const userId = await getSessionUserId(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      
      const hasAccess = await checkInvoicePermission(userId, 'MANAGE');
      if (!hasAccess) {
        return res.status(403).json({ error: "No permission to edit invoices" });
      }
      
      const invoice = await storage.getInvoice(parseInt(req.params.id));
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      if (invoice.status !== 'DRAFT') {
        return res.status(400).json({ error: "Can only edit DRAFT invoices" });
      }
      
      const updated = await storage.updateInvoice(invoice.id, req.body);
      
      await storage.createInvoiceEvent({
        invoiceId: invoice.id,
        eventType: 'EDITED',
        actorId: userId,
        metadata: { changes: Object.keys(req.body) }
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // POST /api/invoices/:id/send - Send invoice (SEND_ONLY or MANAGE)
  app.post("/api/invoices/:id/send", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const userId = await getSessionUserId(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      
      const hasAccess = await checkInvoicePermission(userId, 'SEND_ONLY');
      if (!hasAccess) {
        return res.status(403).json({ error: "No permission to send invoices" });
      }
      
      const invoice = await storage.getInvoice(parseInt(req.params.id));
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      if (invoice.status !== 'DRAFT') {
        return res.status(400).json({ error: "Can only send DRAFT invoices" });
      }
      
      const updated = await storage.updateInvoice(invoice.id, { 
        status: 'SENT',
        sentAt: new Date()
      });
      
      await storage.createInvoiceEvent({
        invoiceId: invoice.id,
        eventType: 'SENT',
        actorId: userId,
        metadata: { sentAt: new Date().toISOString() }
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // POST /api/invoices/:id/settle - Mark invoice as PAID (MANAGE only)
  app.post("/api/invoices/:id/settle", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const userId = await getSessionUserId(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      
      const hasAccess = await checkInvoicePermission(userId, 'MANAGE');
      if (!hasAccess) {
        return res.status(403).json({ error: "No permission to settle invoices" });
      }
      
      const invoice = await storage.getInvoice(parseInt(req.params.id));
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      if (invoice.status !== 'SENT' && invoice.status !== 'OVERDUE') {
        return res.status(400).json({ error: "Can only settle SENT or OVERDUE invoices" });
      }
      
      const { paidAt, paymentReference } = req.body;
      const updated = await storage.updateInvoice(invoice.id, { 
        status: 'PAID',
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        paymentReference
      });
      
      await storage.createInvoiceEvent({
        invoiceId: invoice.id,
        eventType: 'PAYMENT_LOGGED',
        actorId: userId,
        metadata: { paidAt: paidAt || new Date().toISOString(), paymentReference }
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // POST /api/invoices/:id/cancel - Cancel invoice (MANAGE only)
  app.post("/api/invoices/:id/cancel", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const userId = await getSessionUserId(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      
      const hasAccess = await checkInvoicePermission(userId, 'MANAGE');
      if (!hasAccess) {
        return res.status(403).json({ error: "No permission to cancel invoices" });
      }
      
      const invoice = await storage.getInvoice(parseInt(req.params.id));
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      if (invoice.status === 'PAID') {
        return res.status(400).json({ error: "Cannot cancel PAID invoices" });
      }
      
      const { reason } = req.body;
      const updated = await storage.updateInvoice(invoice.id, { 
        status: 'CANCELLED',
        notes: invoice.notes ? `${invoice.notes}\n\nCancelled: ${reason || 'No reason provided'}` : `Cancelled: ${reason || 'No reason provided'}`
      });
      
      await storage.createInvoiceEvent({
        invoiceId: invoice.id,
        eventType: 'CANCELLED',
        actorId: userId,
        metadata: { reason }
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // GET /api/invoices/export/csv - Export invoices as CSV for Conta Azul
  app.get("/api/invoices/export/csv", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const userId = await getSessionUserId(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      
      const hasAccess = await checkInvoicePermission(userId, 'VIEW_ONLY');
      if (!hasAccess) {
        return res.status(403).json({ error: "No access to invoices" });
      }
      
      const { status, isDemo } = req.query;
      const filters: any = {};
      if (status) filters.status = status as string;
      if (isDemo !== undefined) filters.isDemo = isDemo === 'true';
      
      const invoiceList = await storage.getInvoices(Object.keys(filters).length > 0 ? filters : undefined);
      
      // CSV header for Conta Azul compatibility
      const headers = [
        'Numero_Fatura',
        'Data_Emissao',
        'Data_Vencimento',
        'Cliente_ID',
        'Fornecedor_ID',
        'Tipo',
        'Valor_Bruto_BRL',
        'Status',
        'Data_Pagamento',
        'Referencia_Pagamento',
        'Descricao_Servico',
        'Referencia_Contrato',
        'Notas'
      ].join(';');
      
      const rows = invoiceList.map(inv => [
        inv.invoiceNumber,
        inv.issueDate ? new Date(inv.issueDate).toISOString().split('T')[0] : '',
        inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
        inv.clientId || '',
        inv.supplierId || '',
        inv.invoiceType,
        inv.grossAmountBrl || '',
        inv.status,
        inv.paidAt ? new Date(inv.paidAt).toISOString().split('T')[0] : '',
        inv.paymentReference || '',
        (inv.serviceDescription || '').replace(/[\r\n;]/g, ' '),
        inv.contractReference || '',
        (inv.notes || '').replace(/[\r\n;]/g, ' ')
      ].join(';'));
      
      const csv = [headers, ...rows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // GET /api/invoices/overdue - Get overdue invoices for escalation
  app.get("/api/invoices/overdue", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const userId = await getSessionUserId(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      
      const hasAccess = await checkInvoicePermission(userId, 'VIEW_ONLY');
      if (!hasAccess) {
        return res.status(403).json({ error: "No access to invoices" });
      }
      
      const overdueInvoices = await storage.getOverdueInvoices();
      
      // Calculate days overdue and eligibility for reminder
      const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
      const enrichedInvoices = overdueInvoices.map(inv => {
        const daysOverdue = Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / (24 * 60 * 60 * 1000));
        const lastReminder = inv.lastReminderSentAt ? new Date(inv.lastReminderSentAt).getTime() : 0;
        const canSendReminder = !lastReminder || (Date.now() - lastReminder) > ONE_WEEK_MS;
        
        return {
          ...inv,
          daysOverdue,
          canSendReminder,
          reminderCount: inv.reminderCount || 0,
          opsTaskCreated: inv.opsTaskCreated || false
        };
      });
      
      res.json(enrichedInvoices);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // POST /api/invoices/:id/send-reminder - Send overdue reminder (max 1/week)
  app.post("/api/invoices/:id/send-reminder", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const userId = await getSessionUserId(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      
      const hasAccess = await checkInvoicePermission(userId, 'SEND_ONLY');
      if (!hasAccess) {
        return res.status(403).json({ error: "No permission to send reminders" });
      }
      
      const invoice = await storage.getInvoice(parseInt(req.params.id));
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      // Check if reminder was sent within the last week
      const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
      if (invoice.lastReminderSentAt) {
        const lastReminderTime = new Date(invoice.lastReminderSentAt).getTime();
        if (Date.now() - lastReminderTime < ONE_WEEK_MS) {
          const nextAllowed = new Date(lastReminderTime + ONE_WEEK_MS);
          return res.status(400).json({ 
            error: "Reminder already sent this week",
            nextAllowedDate: nextAllowed.toISOString()
          });
        }
      }
      
      // Mark reminder as sent
      const updated = await storage.markReminderSent(invoice.id);
      
      // Log the event
      await storage.createInvoiceEvent({
        invoiceId: invoice.id,
        eventType: 'REMINDER_SENT',
        actorId: userId,
        metadata: { 
          reminderNumber: (invoice.reminderCount || 0) + 1,
          method: 'manual'
        }
      });
      
      res.json({ 
        success: true, 
        message: "Reminder sent",
        invoice: updated,
        reminderCount: (invoice.reminderCount || 0) + 1
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // POST /api/invoices/:id/escalate - Create ops task for overdue invoice (MANAGE only)
  app.post("/api/invoices/:id/escalate", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const userId = await getSessionUserId(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      
      const hasAccess = await checkInvoicePermission(userId, 'MANAGE');
      if (!hasAccess) {
        return res.status(403).json({ error: "No permission to escalate" });
      }
      
      const invoice = await storage.getInvoice(parseInt(req.params.id));
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      if (invoice.opsTaskCreated) {
        return res.status(400).json({ error: "Ops task already created for this invoice" });
      }
      
      // Mark as escalated
      const updated = await storage.markOpsTaskCreated(invoice.id);
      
      // Log the event
      await storage.createInvoiceEvent({
        invoiceId: invoice.id,
        eventType: 'STATUS_CHANGE',
        actorId: userId,
        metadata: { 
          action: 'escalated',
          reason: req.body.reason || 'Overdue escalation'
        }
      });
      
      res.json({ 
        success: true, 
        message: "Invoice escalated - ops task created",
        invoice: updated
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // GET /api/invoice-permissions - List all permissions (MANAGE only)
  app.get("/api/invoice-permissions", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const userId = await getSessionUserId(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      
      const hasAccess = await checkInvoicePermission(userId, 'MANAGE');
      if (!hasAccess) {
        return res.status(403).json({ error: "No permission to view permissions" });
      }
      
      const permissions = await storage.getAllInvoicePermissions();
      res.json(permissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // POST /api/invoice-permissions - Set user permission (MANAGE only)
  app.post("/api/invoice-permissions", async (req, res) => {
    if (!await validateDealOsSession(req, res)) return;
    try {
      const userId = await getSessionUserId(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      
      const hasAccess = await checkInvoicePermission(userId, 'MANAGE');
      if (!hasAccess) {
        return res.status(403).json({ error: "No permission to set permissions" });
      }
      
      const { userId: targetUserId, accessLevel } = req.body;
      if (!targetUserId || !['VIEW_ONLY', 'SEND_ONLY', 'MANAGE'].includes(accessLevel)) {
        return res.status(400).json({ error: "Invalid userId or accessLevel" });
      }
      
      const permission = await storage.setInvoicePermission(targetUserId, accessLevel);
      res.json(permission);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
