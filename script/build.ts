import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";
import { spawn } from "child_process";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

// These packages have native bindings or dynamic requires that break bundling
const forceExternal = [
  "@google-cloud/storage",
  "sharp",
  "tesseract.js",
  "pdf-parse",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = [
    ...allDeps.filter((dep) => !allowlist.includes(dep)),
    ...forceExternal,
  ];

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: false,
    external: externals,
    logLevel: "info",
  });
}

async function runPrerender(): Promise<void> {
  console.log("prerendering static pages...");
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["tsx", "script/prerender.ts"], {
      stdio: "inherit",
      shell: true,
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Prerender exited with code ${code}`));
      }
    });
    child.on("error", reject);
  });
}

function shouldSkipPrerender(): boolean {
  if (process.env.SKIP_PRERENDER === "true") {
    console.log("Skipping prerender: SKIP_PRERENDER=true");
    return true;
  }
  
  if (process.env.CI) {
    console.log("Skipping prerender: CI environment detected (deployment build)");
    return true;
  }
  
  if (process.env.REPLIT_DEPLOYMENT === "1") {
    console.log("Skipping prerender: Running in Replit deployment build");
    return true;
  }
  
  return false;
}

async function buildWithPrerender() {
  await buildAll();
  
  if (!shouldSkipPrerender()) {
    try {
      await runPrerender();
    } catch (err) {
      console.warn("Prerender failed (non-fatal):", err);
      console.log("Build will continue without prerendered pages.");
      console.log("Run 'npx tsx script/prerender.ts' locally to generate static HTML for SEO");
    }
  } else {
    console.log("Note: Run 'npx tsx script/prerender.ts' locally to generate static HTML for SEO");
  }
}

buildWithPrerender().catch((err) => {
  console.error(err);
  process.exit(1);
});
