import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
  insertLeadEcosSnapshotSchema
} from "@shared/schema";
import { fromError } from "zod-validation-error";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import multer from "multer";
import { processBillFile } from "./ocrService";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { evaluateClient, evaluateAllClients, getClientEcosStatus } from "./ecos-engine";

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
      const user = await storage.createUser({ username, password: hashedPassword });
      
      await storage.logAdminAction({
        actor: username,
        actorIp: req.ip || null,
        action: "register",
        entityType: "user",
        entityId: null,
        detailsJson: { username }
      });
      
      res.json({ success: true, user: { id: user.id, username: user.username } });
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
        user: { id: user.id, username: user.username }
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
        user: { id: user.id, username: user.username },
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

  // Get audit logs
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

  return httpServer;
}
