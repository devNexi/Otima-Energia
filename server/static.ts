import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function serveStatic(app: Express) {
  let currentDir: string;
  try {
    currentDir = path.dirname(fileURLToPath(import.meta.url));
  } catch {
    currentDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();
  }
  
  const distPath = path.resolve(currentDir, "public");
  
  let servePath = distPath;
  if (!fs.existsSync(distPath)) {
    const fallbackPath = path.resolve(process.cwd(), "dist", "public");
    if (fs.existsSync(fallbackPath)) {
      servePath = fallbackPath;
    } else {
      throw new Error(
        `Could not find the build directory: ${distPath}, make sure to build the client first`,
      );
    }
  }

  const indexPath = path.resolve(servePath, "index.html");
  console.log(`[static] Serving from: ${servePath}, index.html exists: ${fs.existsSync(indexPath)}`);

  app.use(express.static(servePath));

  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }
    const ext = path.extname(req.path);
    if (ext && ext !== ".html") {
      return next();
    }
    res.sendFile(indexPath);
  });
}
