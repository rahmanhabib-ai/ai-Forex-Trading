// Multi-Tenant User Management & Secure Credential Store
// Forex AI News V2.2 — Institutional SaaS Security Engine

import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface UserAiConfig {
  hasApiKey: boolean;
  encryptedApiKey: string; // AES-256-GCM encrypted
  apiKeyIv: string;
  apiKeyTag: string;
  maskedApiKey: string; // e.g. "sk-or-v1-****1234"
  provider:
    | "openrouter"
    | "openai"
    | "gemini"
    | "deepseek"
    | "anthropic"
    | "groq";
  model: string;
  dailyBudgetUsd: number;
  monthlyBudgetUsd: number;
  currentDaySpendUsd: number;
  currentMonthSpendUsd: number;
  lastSpendResetDate: string; // YYYY-MM-DD
}

export interface UserNotificationSubscription {
  isEnabled: boolean;
  autoAiForecast: boolean;
  enableFreeAlgorithmicView?: boolean; // Explicit opt-in for Free Algorithmic View when no BYOK key is configured
  impactFilter: ("High" | "Medium" | "Low")[];
  currencies: string[];
  offsets: number[]; // [15, 8, 5, 2] minutes
  enablePostRelease: boolean;
}

export interface UserUsageRecord {
  id: string;
  timestamp: string;
  forecastId: string;
  eventTitle: string;
  provider: string;
  model: string;
  tokensUsed: number;
  estimatedCostUsd: number;
  status: "SUCCESS" | "BUDGET_EXCEEDED" | "FAILED" | "REUSED_CACHE";
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  passwordHash: string;
  passwordSalt: string;
  whatsappPhone: string;
  isPhoneVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
  aiConfig: UserAiConfig;
  subscriptions: UserNotificationSubscription;
  usageHistory: UserUsageRecord[];
}

export interface AuthSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

const USERS_STORE_PATH = path.join(process.cwd(), "users_store.json");
const SECRETS_DIR = path.join(process.cwd(), ".secrets");
const ADMIN_KEY_PATH = path.join(SECRETS_DIR, "admin.key");

// Master Encryption Key management
function getMasterEncryptionKey(): Buffer {
  try {
    if (!fs.existsSync(SECRETS_DIR)) {
      fs.mkdirSync(SECRETS_DIR, { recursive: true });
    }
    if (fs.existsSync(ADMIN_KEY_PATH)) {
      const raw = fs.readFileSync(ADMIN_KEY_PATH, "utf-8").trim();
      return crypto.createHash("sha256").update(raw).digest();
    }
    const newKey = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(ADMIN_KEY_PATH, newKey, { mode: 0o600 });
    return crypto.createHash("sha256").update(newKey).digest();
  } catch (err) {
    return crypto
      .createHash("sha256")
      .update("forex-ai-fallback-salt-2026")
      .digest();
  }
}

// AES-256-GCM Encryption / Decryption
export function encryptCredential(plainText: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const key = getMasterEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(plainText, "utf-8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return { encrypted, iv: iv.toString("hex"), tag };
}

export function decryptCredential(
  encryptedHex: string,
  ivHex: string,
  tagHex: string,
): string | null {
  try {
    const key = getMasterEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedHex, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
    return decrypted;
  } catch (err: any) {
    console.error("Credential decryption error:", err.message);
    return null;
  }
}

export function maskApiKey(key: string): string {
  if (!key) return "";
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "****" + trimmed.slice(-2);
  return trimmed.slice(0, 6) + "****" + trimmed.slice(-4);
}

// In-Memory User State & Session Map
let usersCache: Map<string, UserRecord> = new Map();
const activeSessions: Map<string, AuthSession> = new Map();
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function loadUsersStore(): void {
  try {
    if (fs.existsSync(USERS_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(USERS_STORE_PATH, "utf-8"));
      if (Array.isArray(data)) {
        usersCache = new Map(data.map((u) => [u.id, u]));
        console.log(
          `[UserStore] Loaded ${usersCache.size} users from storage.`,
        );
        return;
      }
    }
  } catch (err: any) {
    console.warn("[UserStore] Error loading users store:", err.message);
  }

  // Seed default Admin and standard accounts if empty
  seedDefaultUsers();
}

export function saveUsersStore(): void {
  try {
    const usersArray = Array.from(usersCache.values());
    const tempPath = `${USERS_STORE_PATH}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
    fs.writeFileSync(
      tempPath,
      JSON.stringify(usersArray, null, 2),
      "utf-8",
    );
    fs.renameSync(tempPath, USERS_STORE_PATH);
  } catch (err: any) {
    console.error("[UserStore] Failed to save users store:", err.message);
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

function seedDefaultUsers(): void {
  usersCache.clear();

  // 1. Primary Admin User
  const adminSalt = crypto.randomBytes(16).toString("hex");
  const adminId = "usr_admin_master";
  const adminUser: UserRecord = {
    id: adminId,
    email: "contact@aibangla.com.bd",
    name: "Chief Institutional Administrator",
    role: "admin",
    passwordSalt: adminSalt,
    passwordHash: hashPassword("ForexAdmin2026!", adminSalt),
    whatsappPhone: "8801819123456",
    isPhoneVerified: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    aiConfig: {
      hasApiKey: false,
      encryptedApiKey: "",
      apiKeyIv: "",
      apiKeyTag: "",
      maskedApiKey: "",
      provider: "openrouter",
      model: "deepseek/deepseek-r1",
      dailyBudgetUsd: 25.0,
      monthlyBudgetUsd: 250.0,
      currentDaySpendUsd: 0,
      currentMonthSpendUsd: 0,
      lastSpendResetDate: new Date().toISOString().slice(0, 10),
    },
    subscriptions: {
      isEnabled: true,
      autoAiForecast: true,
      impactFilter: ["High", "Medium"],
      currencies: ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "NZD"],
      offsets: [15, 8, 5, 2],
      enablePostRelease: true,
    },
    usageHistory: [],
  };
  usersCache.set(adminId, adminUser);

  // 2. Demo User A (Standard User with BYOK Key Enabled)
  const userASalt = crypto.randomBytes(16).toString("hex");
  const userAId = "usr_demo_user_a";
  const userA: UserRecord = {
    id: userAId,
    email: "trader.a@amaderforex.com",
    name: "Institutional Trader A (BYOK Enabled)",
    role: "user",
    passwordSalt: userASalt,
    passwordHash: hashPassword("TraderPass2026A!", userASalt),
    whatsappPhone: "8801711223344",
    isPhoneVerified: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    aiConfig: {
      hasApiKey: false,
      encryptedApiKey: "",
      apiKeyIv: "",
      apiKeyTag: "",
      maskedApiKey: "",
      provider: "openrouter",
      model: "deepseek/deepseek-r1",
      dailyBudgetUsd: 5.0,
      monthlyBudgetUsd: 50.0,
      currentDaySpendUsd: 0,
      currentMonthSpendUsd: 0,
      lastSpendResetDate: new Date().toISOString().slice(0, 10),
    },
    subscriptions: {
      isEnabled: true,
      autoAiForecast: true,
      impactFilter: ["High"],
      currencies: ["USD", "EUR", "GBP"],
      offsets: [15, 8, 5, 2],
      enablePostRelease: true,
    },
    usageHistory: [],
  };
  usersCache.set(userAId, userA);

  // 3. Demo User B (Free Tier User - No AI Key)
  const userBSalt = crypto.randomBytes(16).toString("hex");
  const userBId = "usr_demo_user_b";
  const userB: UserRecord = {
    id: userBId,
    email: "trader.b@amaderforex.com",
    name: "Retail Trader B (Free Reminders)",
    role: "user",
    passwordSalt: userBSalt,
    passwordHash: hashPassword("TraderPass2026B!", userBSalt),
    whatsappPhone: "8801911998877",
    isPhoneVerified: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    aiConfig: {
      hasApiKey: false,
      encryptedApiKey: "",
      apiKeyIv: "",
      apiKeyTag: "",
      maskedApiKey: "",
      provider: "openrouter",
      model: "deepseek/deepseek-r1",
      dailyBudgetUsd: 0,
      monthlyBudgetUsd: 0,
      currentDaySpendUsd: 0,
      currentMonthSpendUsd: 0,
      lastSpendResetDate: new Date().toISOString().slice(0, 10),
    },
    subscriptions: {
      isEnabled: true,
      autoAiForecast: false, // Free basic reminders only
      impactFilter: ["High"],
      currencies: ["USD", "EUR"],
      offsets: [15, 2], // Only non-AI reminders
      enablePostRelease: false,
    },
    usageHistory: [],
  };
  usersCache.set(userBId, userB);

  saveUsersStore();
  console.log(
    "[UserStore] Initialized default multi-tenant accounts (Admin, User A, User B).",
  );
}

// User CRUD & Session Management
export function authenticateUser(
  email: string,
  password: string,
): {
  token: string;
  user: Omit<UserRecord, "passwordHash" | "passwordSalt" | "aiConfig"> & {
    aiConfig: Omit<UserAiConfig, "encryptedApiKey" | "apiKeyIv" | "apiKeyTag">;
  };
} | null {
  const user = Array.from(usersCache.values()).find(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim(),
  );
  if (!user) return null;

  const expectedHash = hashPassword(password, user.passwordSalt);
  if (expectedHash !== user.passwordHash) return null;

  user.lastLoginAt = new Date().toISOString();
  saveUsersStore();

  const token = "tok_" + crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  activeSessions.set(token, {
    token,
    userId: user.id,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  });

  return { token, user: sanitizeUserRecord(user) };
}

export function validateSessionToken(token: string): UserRecord | null {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return usersCache.get(session.userId) || null;
}

export function invalidateSession(token: string): void {
  activeSessions.delete(token);
}

export function getUserById(userId: string): UserRecord | null {
  return usersCache.get(userId) || null;
}

export function ensureFirebaseTenant(uid: string, email?: string): UserRecord {
  let user = usersCache.get(uid);
  if (user) {
    if (email && (!user.email || user.email.includes("@firebase.user"))) {
      user.email = email;
      saveUsersStore();
    }
    return user;
  }

  if (email) {
    const existing = Array.from(usersCache.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );
    if (existing) {
      return existing;
    }
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const newUser: UserRecord = {
    id: uid,
    email: email || `${uid}@firebase.user`,
    name: email ? email.split("@")[0] : `Trader_${uid.slice(0, 6)}`,
    role: "user",
    passwordSalt: salt,
    passwordHash: hashPassword(crypto.randomBytes(32).toString("hex"), salt),
    whatsappPhone: "",
    isPhoneVerified: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    aiConfig: {
      hasApiKey: false,
      encryptedApiKey: "",
      apiKeyIv: "",
      apiKeyTag: "",
      maskedApiKey: "",
      provider: "openrouter",
      model: "deepseek/deepseek-r1",
      dailyBudgetUsd: 10.0,
      monthlyBudgetUsd: 100.0,
      currentDaySpendUsd: 0,
      currentMonthSpendUsd: 0,
      lastSpendResetDate: new Date().toISOString().slice(0, 10),
    },
    subscriptions: {
      isEnabled: true,
      autoAiForecast: false,
      impactFilter: ["High", "Medium"],
      currencies: ["USD", "EUR", "GBP", "JPY"],
      offsets: [15, 8, 5, 2],
      enablePostRelease: true,
    },
    usageHistory: [],
  };

  usersCache.set(uid, newUser);
  saveUsersStore();
  return newUser;
}

export function getAllSubscribedUsers(): UserRecord[] {
  return Array.from(usersCache.values()).filter(
    (u) => u.subscriptions && u.subscriptions.isEnabled && u.whatsappPhone,
  );
}

export function sanitizeUserRecord(user: UserRecord): any {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    whatsappPhone: user.whatsappPhone,
    isPhoneVerified: user.isPhoneVerified,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    aiConfig: {
      hasApiKey: user.aiConfig.hasApiKey,
      maskedApiKey: user.aiConfig.maskedApiKey,
      provider: user.aiConfig.provider,
      model: user.aiConfig.model,
      dailyBudgetUsd: user.aiConfig.dailyBudgetUsd,
      monthlyBudgetUsd: user.aiConfig.monthlyBudgetUsd,
      currentDaySpendUsd: +(user.aiConfig?.currentDaySpendUsd || 0).toFixed(4),
      currentMonthSpendUsd: +(user.aiConfig?.currentMonthSpendUsd || 0).toFixed(4),
      lastSpendResetDate: user.aiConfig?.lastSpendResetDate || "",
    },
    subscriptions: user.subscriptions || {},
    usageHistoryCount: Array.isArray(user.usageHistory) ? user.usageHistory.length : 0,
  };
}

// Update User AI Configuration & Key Encryption
export function updateUserAiConfig(
  userId: string,
  params: {
    apiKey?: string;
    provider?: UserAiConfig["provider"];
    model?: string;
    dailyBudgetUsd?: number;
    monthlyBudgetUsd?: number;
  },
): { success: boolean; error?: string; user?: any } {
  const user = usersCache.get(userId);
  if (!user) return { success: false, error: "User not found." };

  if (params.provider) user.aiConfig.provider = params.provider;
  if (params.model) user.aiConfig.model = params.model;
  if (typeof params.dailyBudgetUsd === "number")
    user.aiConfig.dailyBudgetUsd = Math.max(0, params.dailyBudgetUsd);
  if (typeof params.monthlyBudgetUsd === "number")
    user.aiConfig.monthlyBudgetUsd = Math.max(0, params.monthlyBudgetUsd);

  if (params.apiKey !== undefined) {
    const rawKey = params.apiKey.trim();
    if (rawKey === "") {
      user.aiConfig.hasApiKey = false;
      user.aiConfig.encryptedApiKey = "";
      user.aiConfig.apiKeyIv = "";
      user.aiConfig.apiKeyTag = "";
      user.aiConfig.maskedApiKey = "";
    } else if (!rawKey.includes("****")) {
      const { encrypted, iv, tag } = encryptCredential(rawKey);
      user.aiConfig.hasApiKey = true;
      user.aiConfig.encryptedApiKey = encrypted;
      user.aiConfig.apiKeyIv = iv;
      user.aiConfig.apiKeyTag = tag;
      user.aiConfig.maskedApiKey = maskApiKey(rawKey);
    }
  }

  saveUsersStore();
  return { success: true, user: sanitizeUserRecord(user) };
}

// Retrieve Decrypted User AI Key strictly for authorized execution
export function getUserDecryptedApiKey(userId: string): {
  key: string | null;
  provider: string;
  model: string;
} {
  const user = usersCache.get(userId);
  if (!user || !user.aiConfig.hasApiKey || !user.aiConfig.encryptedApiKey) {
    return {
      key: null,
      provider: user?.aiConfig?.provider || "openrouter",
      model: user?.aiConfig?.model || "deepseek/deepseek-r1",
    };
  }

  const plainKey = decryptCredential(
    user.aiConfig.encryptedApiKey,
    user.aiConfig.apiKeyIv,
    user.aiConfig.apiKeyTag,
  );
  return {
    key: plainKey,
    provider: user.aiConfig.provider,
    model: user.aiConfig.model,
  };
}

// Budget Enforcement & Spending Check
export function checkUserSpendingBudget(
  userId: string,
  estimatedCostUsd = 0.005,
): { authorized: boolean; allowed: boolean; reason?: string } {
  const user = usersCache.get(userId);
  if (!user) return { authorized: false, allowed: false, reason: "User not found." };

  const todayStr = new Date().toISOString().slice(0, 10);
  if (user.aiConfig.lastSpendResetDate !== todayStr) {
    user.aiConfig.currentDaySpendUsd = 0;
    user.aiConfig.lastSpendResetDate = todayStr;
    saveUsersStore();
  }

  if (
    user.aiConfig.currentDaySpendUsd + estimatedCostUsd >
    user.aiConfig.dailyBudgetUsd
  ) {
    return {
      authorized: false,
      allowed: false,
      reason: `Daily AI spending limit exceeded ($${user.aiConfig.currentDaySpendUsd.toFixed(3)} / $${user.aiConfig.dailyBudgetUsd.toFixed(2)}).`,
    };
  }

  if (
    user.aiConfig.currentMonthSpendUsd + estimatedCostUsd >
    user.aiConfig.monthlyBudgetUsd
  ) {
    return {
      authorized: false,
      allowed: false,
      reason: `Monthly AI spending limit exceeded ($${user.aiConfig.currentMonthSpendUsd.toFixed(3)} / $${user.aiConfig.monthlyBudgetUsd.toFixed(2)}).`,
    };
  }

  return { authorized: true, allowed: true };
}

// Record User AI Usage & Reconcile Spending
export function recordUserAiUsage(
  userId: string,
  usage: {
    forecastId: string;
    eventTitle: string;
    provider: string;
    model: string;
    tokensUsed: number;
    estimatedCostUsd: number;
    status: UserUsageRecord["status"];
  },
): void {
  const user = usersCache.get(userId);
  if (!user) return;

  const cost = Math.max(0, usage.estimatedCostUsd);
  user.aiConfig.currentDaySpendUsd += cost;
  user.aiConfig.currentMonthSpendUsd += cost;

  user.usageHistory.unshift({
    id: "usg_" + crypto.randomBytes(8).toString("hex"),
    timestamp: new Date().toISOString(),
    ...usage,
  });

  // Limit usage history to last 200 records per user
  if (user.usageHistory.length > 200) {
    user.usageHistory = user.usageHistory.slice(0, 200);
  }

  saveUsersStore();
}

// Concurrency-Safe Budget Reservation & Reconciliation
export interface BudgetReservation {
  id: string;
  userId: string;
  amountUsd: number;
  timestamp: number;
}
const RESERVATIONS_STORE_PATH = path.join(process.cwd(), "budget_reservations_store.json");
const activeReservations = new Map<string, BudgetReservation>();

function loadReservationsStore(): void {
  try {
    if (fs.existsSync(RESERVATIONS_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(RESERVATIONS_STORE_PATH, "utf-8"));
      if (Array.isArray(data)) {
        const now = Date.now();
        for (const res of data) {
          // Only restore reservations that haven't expired (> 60 seconds)
          if (res && res.id && (now - res.timestamp <= 60000)) {
            activeReservations.set(res.id, res);
          }
        }
      }
    }
  } catch (err: any) {
    console.warn("[ReservationsStore] Failed to load reservations:", err.message);
  }
}

function saveReservationsStore(): void {
  try {
    const list = Array.from(activeReservations.values());
    const tempPath = `${RESERVATIONS_STORE_PATH}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(list, null, 2), "utf-8");
    fs.renameSync(tempPath, RESERVATIONS_STORE_PATH);
  } catch (err: any) {
    console.warn("[ReservationsStore] Failed to save reservations:", err.message);
  }
}

loadReservationsStore();

export function getActiveReservations(userId?: string): BudgetReservation[] {
  const now = Date.now();
  const list: BudgetReservation[] = [];
  for (const [id, res] of activeReservations.entries()) {
    if (now - res.timestamp > 60000) {
      activeReservations.delete(id);
    } else if (!userId || res.userId === userId) {
      list.push(res);
    }
  }
  return list;
}

export function clearActiveReservations(userId?: string): void {
  for (const [id, res] of activeReservations.entries()) {
    if (!userId || res.userId === userId) {
      activeReservations.delete(id);
    }
  }
  saveReservationsStore();
}

export function expireStaleReservations(maxAgeMs = 60000): number {
  const now = Date.now();
  let count = 0;
  for (const [id, res] of activeReservations.entries()) {
    if (now - res.timestamp > maxAgeMs) {
      activeReservations.delete(id);
      count++;
    }
  }
  if (count > 0) saveReservationsStore();
  return count;
}

export function reserveBudget(
  userId: string,
  estimatedCostUsd = 0.005,
): { authorized: boolean; allowed: boolean; reservationId?: string; reason?: string } {
  const user = usersCache.get(userId);
  if (!user) return { authorized: false, allowed: false, reason: "User not found." };

  // Calculate pending active uncommitted reservations for this user (prune stale > 60s)
  const now = Date.now();
  let pendingReserved = 0;
  for (const [id, res] of activeReservations.entries()) {
    if (now - res.timestamp > 60000) {
      activeReservations.delete(id); // auto-expire stale reservation
    } else if (res.userId === userId) {
      pendingReserved += res.amountUsd;
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  if (user.aiConfig.lastSpendResetDate !== todayStr) {
    user.aiConfig.currentDaySpendUsd = 0;
    user.aiConfig.lastSpendResetDate = todayStr;
    saveUsersStore();
  }

  const effectiveDailySpend = user.aiConfig.currentDaySpendUsd + pendingReserved + estimatedCostUsd;
  if (effectiveDailySpend > user.aiConfig.dailyBudgetUsd) {
    return {
      authorized: false,
      allowed: false,
      reason: `Daily budget exceeded with reservations ($${effectiveDailySpend.toFixed(4)} / $${user.aiConfig.dailyBudgetUsd.toFixed(2)}).`,
    };
  }

  const effectiveMonthlySpend = user.aiConfig.currentMonthSpendUsd + pendingReserved + estimatedCostUsd;
  if (effectiveMonthlySpend > user.aiConfig.monthlyBudgetUsd) {
    return {
      authorized: false,
      allowed: false,
      reason: `Monthly budget exceeded with reservations ($${effectiveMonthlySpend.toFixed(4)} / $${user.aiConfig.monthlyBudgetUsd.toFixed(2)}).`,
    };
  }

  const reservationId = `res_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  activeReservations.set(reservationId, {
    id: reservationId,
    userId,
    amountUsd: estimatedCostUsd,
    timestamp: now,
  });
  saveReservationsStore();

  return { authorized: true, allowed: true, reservationId };
}

export function reconcileBudget(
  userId: string,
  reservationId: string | undefined,
  actualCostUsd: number,
  usageMeta?: {
    forecastId: string;
    eventTitle: string;
    provider: string;
    model: string;
    tokensUsed: number;
    status: UserUsageRecord["status"];
  },
): void {
  if (reservationId) {
    activeReservations.delete(reservationId);
    saveReservationsStore();
  }
  const user = usersCache.get(userId);
  if (!user) return;

  const cost = Math.max(0, actualCostUsd);
  user.aiConfig.currentDaySpendUsd += cost;
  user.aiConfig.currentMonthSpendUsd += cost;

  if (usageMeta) {
    user.usageHistory.unshift({
      id: "usg_" + crypto.randomBytes(8).toString("hex"),
      timestamp: new Date().toISOString(),
      forecastId: usageMeta.forecastId,
      eventTitle: usageMeta.eventTitle,
      provider: usageMeta.provider,
      model: usageMeta.model,
      tokensUsed: usageMeta.tokensUsed,
      estimatedCostUsd: cost,
      status: usageMeta.status,
    });
    if (user.usageHistory.length > 200) user.usageHistory.pop();
  }

  saveUsersStore();
}

// Tenant-Isolated Portfolio Persistence
const PORTFOLIO_STORE_PATH = path.join(process.cwd(), "user_portfolios_store.json");
const userPortfolios = new Map<string, any>();

function loadPortfoliosStore(): void {
  try {
    if (fs.existsSync(PORTFOLIO_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(PORTFOLIO_STORE_PATH, "utf-8"));
      if (data && typeof data === "object") {
        for (const [k, v] of Object.entries(data)) {
          userPortfolios.set(k, v);
        }
      }
    }
  } catch (err: any) {
    console.warn("[PortfolioStore] Failed to load portfolios:", err.message);
  }
}

function savePortfoliosStore(): void {
  try {
    const obj: Record<string, any> = {};
    for (const [k, v] of userPortfolios.entries()) {
      obj[k] = v;
    }
    const tempPath = `${PORTFOLIO_STORE_PATH}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(obj, null, 2), "utf-8");
    fs.renameSync(tempPath, PORTFOLIO_STORE_PATH);
  } catch (err: any) {
    console.warn("[PortfolioStore] Failed to save portfolios:", err.message);
  }
}

loadPortfoliosStore();

export function getUserPortfolio(userId: string): any {
  if (!userPortfolios.has(userId)) {
    userPortfolios.set(userId, {
      userId,
      accounts: [
        { id: `acc_${userId}_1`, name: "IC Markets Raw ECN", balance: 50000, equity: 51840, currency: "USD", leverage: 100 },
      ],
      activeAccountId: `acc_${userId}_1`,
      allTrades: [],
    });
  }
  return userPortfolios.get(userId);
}

export function saveUserPortfolio(userId: string, data: any): void {
  userPortfolios.set(userId, { ...data, userId });
  savePortfoliosStore();
}

// Update Subscriptions & WhatsApp Recipient
export function updateUserSubscriptions(
  userId: string,
  sub: Partial<UserNotificationSubscription>,
  whatsappPhone?: string,
): { success: boolean; user?: any; error?: string } {
  const user = usersCache.get(userId);
  if (!user) return { success: false, error: "User not found." };

  if (whatsappPhone !== undefined) {
    user.whatsappPhone = whatsappPhone.replace(/[^0-9]/g, "");
    user.isPhoneVerified = Boolean(user.whatsappPhone.length >= 10);
  }

  user.subscriptions = { ...user.subscriptions, ...sub };
  saveUsersStore();
  return { success: true, user: sanitizeUserRecord(user) };
}

// Self-initialization
loadUsersStore();
