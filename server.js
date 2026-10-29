// Production Entry Point for Hostinger Node.js & Cloud Linux
// Forex AI News V2.2 Enterprise Engine (chartlogic.pro)

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverTs = path.join(__dirname, "server.ts");

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
