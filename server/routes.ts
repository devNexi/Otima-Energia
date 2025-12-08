import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Lead submission endpoint
  app.post("/api/leads", async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      res.json({ success: true, lead });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        res.status(400).json({ 
          success: false, 
          error: validationError.toString() 
        });
      } else {
        console.error("Error creating lead:", error);
        res.status(500).json({ 
          success: false, 
          error: "Failed to submit lead" 
        });
      }
    }
  });

  // Get all leads (for internal use/admin)
  app.get("/api/leads", async (req, res) => {
    try {
      const allLeads = await storage.getLeads();
      res.json({ success: true, leads: allLeads });
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to fetch leads" 
      });
    }
  });

  return httpServer;
}
