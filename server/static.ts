import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function serveStatic(app: Express) {
  // Handle both ESM and CJS contexts
  let currentDir: string;
  try {
    // For ESM
    currentDir = path.dirname(fileURLToPath(import.meta.url));
  } catch {
    // For CJS or bundled code
    currentDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();
  }
  
  // In production, the bundle is at dist/index.cjs and public is at dist/public
  const distPath = path.resolve(currentDir, "public");
  
  if (!fs.existsSync(distPath)) {
    // Fallback to checking relative to process.cwd()
    const fallbackPath = path.resolve(process.cwd(), "dist", "public");
    if (fs.existsSync(fallbackPath)) {
      app.use(express.static(fallbackPath));
      app.use("*", (_req, res) => {
        res.sendFile(path.resolve(fallbackPath, "index.html"));
      });
      return;
    }
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
