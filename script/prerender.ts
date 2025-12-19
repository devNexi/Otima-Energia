import puppeteer from "puppeteer";
import express from "express";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist/public");

const PUBLIC_ROUTES = [
  "/",
  "/sobre",
  "/equipe",
  "/parceiros",
  "/solucoes",
  "/faq",
  "/seja-cliente",
  "/privacidade",
  "/termos",
  "/cookies",
  "/portal-cliente",
  "/lei-mercado-livre",
  "/renovacao-contrato",
  "/insights",
  "/rede-de-lucros-otima",
];

async function startServer(port: number): Promise<ReturnType<typeof express>> {
  const app = express();
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Static server running on port ${port}`);
      resolve(server as any);
    });
  });
}

async function prerenderRoute(
  browser: Awaited<ReturnType<typeof puppeteer.launch>>,
  baseUrl: string,
  route: string
): Promise<void> {
  const page = await browser.newPage();
  const url = `${baseUrl}${route}`;
  
  console.log(`Prerendering: ${route}`);
  
  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    
    await page.waitForSelector("body", { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1000));
    
    const html = await page.content();
    
    const routePath = route === "/" ? "" : route;
    const outputDir = path.join(distPath, routePath);
    const outputFile = path.join(outputDir, "index.html");
    
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }
    
    const cleanedHtml = html
      .replace(/<script[^>]*id="__REACT_DEVTOOLS_GLOBAL_HOOK__"[^>]*><\/script>/g, "")
      .replace(/<!--[\s\S]*?-->/g, "");
    
    await writeFile(outputFile, cleanedHtml, "utf-8");
    console.log(`  -> Saved: ${outputFile}`);
  } catch (error) {
    console.error(`  -> Error prerendering ${route}:`, error);
  } finally {
    await page.close();
  }
}

async function main() {
  console.log("\n=== Starting Prerender Process ===\n");
  
  if (!existsSync(distPath)) {
    console.error("Error: dist/public directory not found. Run build first.");
    process.exit(1);
  }
  
  const PORT = 3456;
  const server = await startServer(PORT);
  const baseUrl = `http://localhost:${PORT}`;
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  
  try {
    for (const route of PUBLIC_ROUTES) {
      await prerenderRoute(browser, baseUrl, route);
    }
    
    console.log("\n=== Prerender Complete ===");
    console.log(`Prerendered ${PUBLIC_ROUTES.length} routes`);
  } finally {
    await browser.close();
    (server as any).close();
  }
}

main().catch((err) => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
