import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertLeadSchema, 
  insertClientSchema, 
  insertConsumptionProfileSchema,
  insertQuoteRequestSchema,
  insertSupplierQuoteSchema
} from "@shared/schema";
import { fromError } from "zod-validation-error";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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

  // ============== PORTAL ENDPOINTS ==============

  // Validate portal token (for lead-based portal access)
  app.get("/api/portal/validate/:token", async (req, res) => {
    try {
      const lead = await storage.getLeadByPortalToken(req.params.token);
      if (!lead) {
        return res.status(404).json({ success: false, error: "Invalid or expired portal link" });
      }
      res.json({ success: true, lead: { id: lead.id, name: lead.name, email: lead.email, companyName: lead.companyName } });
    } catch (error: any) {
      console.error("Error validating portal token:", error);
      res.status(500).json({ success: false, error: "Failed to validate portal token" });
    }
  });

  // Validate upload session token
  app.get("/api/portal/upload/validate/:token", async (req, res) => {
    try {
      const session = await storage.getUploadSessionByToken(req.params.token);
      if (!session) {
        return res.status(404).json({ success: false, error: "Invalid upload link" });
      }
      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        return res.status(410).json({ success: false, error: "Upload link has expired" });
      }
      const client = session.clientId ? await storage.getClient(session.clientId) : null;
      res.json({ 
        success: true, 
        session: { id: session.id, requiresCode: !!session.accessCode },
        client: client ? { id: client.id, companyName: client.companyName } : null
      });
    } catch (error: any) {
      console.error("Error validating upload session:", error);
      res.status(500).json({ success: false, error: "Failed to validate upload session" });
    }
  });

  // Verify access code
  app.post("/api/portal/upload/verify/:token", async (req, res) => {
    try {
      const session = await storage.getUploadSessionByToken(req.params.token);
      if (!session) {
        return res.status(404).json({ success: false, error: "Invalid upload link" });
      }
      if (session.accessCode && session.accessCode !== req.body.accessCode) {
        return res.status(401).json({ success: false, error: "Invalid access code" });
      }
      res.json({ success: true });
    } catch (error: any) {
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

  // ============== SUPPLIER QUOTE ENDPOINTS ==============

  // Add supplier quote
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

  // Select supplier quote
  app.post("/api/supplier-quotes/:id/select", async (req, res) => {
    try {
      await storage.selectSupplierQuote(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error selecting supplier quote:", error);
      res.status(500).json({ success: false, error: "Failed to select supplier quote" });
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

  return httpServer;
}
