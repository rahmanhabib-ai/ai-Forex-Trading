// Production Entry Point for Hostinger Node.js & Cloud Linux
// Forex AI News V2.2 Enterprise Engine (chartlogic.pro)

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverTs = path.join(__dirname, "server.ts");

// Auto-load .env file if present on Hostinger filesystem (Node 22 native support)
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath) && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(envPath);
    console.log("[ChartLogic.pro] Loaded environment variables from .env file.");
  } catch (e) {
    // ignore parsing errors
  }
}

const targetPort = process.env.PORT || "3000";
console.log(`[ChartLogic.pro] Starting Enterprise Terminal Engine on Hostinger (PORT: ${targetPort})...`);

const child = spawn("npx", ["tsx", serverTs], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: targetPort,
    NODE_ENV: process.env.NODE_ENV || "production",
  },
});

child.on("exit", (code, signal) => {
  if (code !== null) process.exit(code);
  if (signal) process.kill(process.pid, signal);
});

process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
