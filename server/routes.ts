import type { Express } from "express";
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
  insertSupplierContactSchema
} from "@shared/schema";
import { fromError } from "zod-validation-error";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import multer from "multer";
import { processBillFile } from "./ocrService";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

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

      await storage.markRfoSupplierResponded(trackingId, {
        responseStatus: status || "responded",
        responseQuoteId: quoteId || null
      });

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

  return httpServer;
}
