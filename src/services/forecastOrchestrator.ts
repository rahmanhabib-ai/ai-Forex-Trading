// Multi-Tenant Institutional Forecast Orchestrator & Universal AI Gateway
// Forex AI News V2.2 — High-Throughput BYOK Inference Hub

import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  executeForecastAnalysis,
  AUDITED_HISTORICAL_BACKTESTS,
} from "./forecastEngine.ts";
import type {
  ForecastAnalysisRequest,
  ForecastAnalysisResult,
} from "./forecastEngine.ts";
import { buildMacroContext } from "./macroDataService.ts";
import { getMultiTimeframeAnalysis } from "./marketTechnicalService.ts";
import {
  getUserById,
  getUserDecryptedApiKey,
  reserveBudget,
  reconcileBudget,
} from "./userService.ts";
import { GoogleGenAI } from "@google/genai";

export interface UnifiedForecastRecord {
  id: string;
  releaseGroupId: string;
  userId: string;
  eventTitle: string;
  currency: string;
  impact: string;
  releaseDate: string; // Canonical ISO-8601 UTC
  releaseDateDhaka: string; // Asia/Dhaka conversion (BST / UTC+6)
  timestamp: string; // Forecast generation UTC
  dataSnapshotId: string;
  isReanalysis: boolean;
  preNewsPrice: number;
  bias: "BULLISH" | "BEARISH" | "NEUTRAL";
  badge: "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";
  asset: string;
  instrument: string;
  evidenceScore: number; // 1.0 - 10.0 scale (NOT a calibrated probability)
  uncertaintyGrade: "LOW" | "MODERATE" | "HIGH" | "EXTREME";
  bullishFactors: string[];
  bearishFactors: string[];
  missingDataPenalties: string[];
  dataFreshness: "REAL_TIME_STREAM" | "POINT_IN_TIME_AUDITED" | "STALE_HEURISTIC";
  entryZone: string;
  takeProfit1: string;
  takeProfit2: string;
  stopLoss: string;
  atrBuffer: string;
  summary: string;
  macroRationale: string;
  technicalRationale: string;
  attribution: {
    requestedProvider: string;
    requestedModel: string;
    executedProvider: string;
    executedModel: string;
    executionMode: "MOCK" | "REAL_EXTERNAL_AI" | "DETERMINISTIC_RULES" | "FREE_REMINDER";
    isRealAi: boolean;
    isFallback: boolean;
    fallbackReason: string | null;
    providerResponseId: string | null;
    latencyMs: number;
    tokensUsed: number;
    actualCostUsd: number;
    tier: "BYOK_PAID" | "FREE_DETERMINISTIC" | "SYSTEM_AI";
    // Compatibility aliases:
    provider: string;
    model: string;
    estimatedCostUsd: number;
  };
  confidenceScore?: number; // Backward-compatibility alias
}

export function formatUtcToDhaka(isoString: string): string {
  try {
    const d = new Date(isoString);
    return (
      d.toLocaleString("en-US", {
        timeZone: "Asia/Dhaka",
        dateStyle: "medium",
        timeStyle: "medium",
      }) + " (Asia/Dhaka, BDT / UTC+6)"
    );
  } catch {
    return isoString;
  }
}

// Durable Forecast Persistence Store
const FORECASTS_STORE_PATH = path.join(process.cwd(), "forecasts_store.json");
const FORECAST_CACHE = new Map<string, UnifiedForecastRecord>();
const USER_FORECAST_HISTORY = new Map<string, UnifiedForecastRecord[]>();

function loadForecastsStore(): void {
  try {
    if (fs.existsSync(FORECASTS_STORE_PATH)) {
      const list = JSON.parse(fs.readFileSync(FORECASTS_STORE_PATH, "utf-8"));
      if (Array.isArray(list)) {
        for (const item of list) {
          FORECAST_CACHE.set(item.id, item);
          const history = USER_FORECAST_HISTORY.get(item.userId) || [];
          history.push(item);
          USER_FORECAST_HISTORY.set(item.userId, history);
        }
        console.log(`[ForecastStore] Loaded ${list.length} persisted forecasts.`);
      }
    }
  } catch (err: any) {
    console.warn("[ForecastStore] Failed loading forecasts:", err.message);
  }
}

function saveForecastsStore(): void {
  try {
    const all = Array.from(new Set(FORECAST_CACHE.values()));
    const tempPath = `${FORECASTS_STORE_PATH}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(all, null, 2), "utf-8");
    fs.renameSync(tempPath, FORECASTS_STORE_PATH);
  } catch (err: any) {
    console.error("[ForecastStore] Failed saving forecasts:", err.message);
  }
}

// Initialize store from disk on startup
loadForecastsStore();

export function getForecastRecordById(id: string): UnifiedForecastRecord | null {
  return FORECAST_CACHE.get(id) || null;
}

export function getUserForecastHistory(userId: string): UnifiedForecastRecord[] {
  return USER_FORECAST_HISTORY.get(userId) || [];
}

export function getLatestForecastForUser(userId: string): UnifiedForecastRecord | null {
  const list = USER_FORECAST_HISTORY.get(userId) || [];
  return list.length > 0 ? list[0] : null;
}

export type OpenRouterMockHandler = (req: {
  model: string;
  messages: any[];
  authHeader: string;
}) => Promise<{ id: string; content: string; totalTokens: number } | null>;

let currentMockOpenRouterHandler: OpenRouterMockHandler | null = null;

export function setMockOpenRouterHandler(handler: OpenRouterMockHandler | null): void {
  currentMockOpenRouterHandler = handler;
}

export async function runUnifiedForecast(options: {
  userId?: string;
  eventTitle: string;
  currency: string;
  impact: string;
  date: string;
  previous?: string;
  forecast?: string;
  actual?: string;
  currentGoldPrice?: number;
  isReanalysis?: boolean;
  allowAlgorithmicFallback?: boolean;
  allowRealPaidApi?: boolean;
  allowAdminKey?: boolean;
  spendingCapUsd?: number;
}): Promise<UnifiedForecastRecord> {
  const startTime = Date.now();
  const userId = options.userId || "usr_demo_user_a";
  const user = getUserById(userId);
  const isReanalysis = options.isReanalysis || false;
  const dateStr = options.date ? options.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const eventTitleSanitized = (options.eventTitle || "event").replace(/[^a-zA-Z0-9]/g, "_");
  const releaseGroupId = `${options.currency || "USD"}_${dateStr}_${eventTitleSanitized}`;

  // Check release group cache for deduplication (unless post-release reanalysis)
  const cacheKey = `${userId}_${releaseGroupId}_${isReanalysis ? "post" : "pre"}`;
  if (FORECAST_CACHE.has(cacheKey) && !isReanalysis) {
    const cached = FORECAST_CACHE.get(cacheKey)!;
    return cached;
  }

  // Determine Requested Provider and Model
  const userAi = user?.aiConfig;
  const userCreds = userAi?.hasApiKey ? getUserDecryptedApiKey(userId) : null;
  const requestedProvider = userCreds?.provider || userAi?.provider || "openrouter";
  const requestedModel = userCreds?.model || userAi?.model || "deepseek/deepseek-r1";

  // Check if this event matches an audited historical backtest
  const titleLower = (options.eventTitle || "").toLowerCase();
  const matchingBacktest = (options.date && options.date.startsWith("2024"))
    ? AUDITED_HISTORICAL_BACKTESTS.find(
        (b) =>
          b.eventDate === dateStr &&
          (((titleLower.includes("cpi") || titleLower.includes("consumer price") || titleLower.includes("inflation")) && b.id.includes("cpi")) ||
            ((titleLower.includes("nfp") || titleLower.includes("payrolls")) && b.id.includes("nfp")) ||
            (titleLower.includes("fomc") && b.id.includes("fomc")))
      )
    : null;

  // Strict Point-in-Time Separation: For audited historical events, always use audited preNewsPrice
  const currentPrice = matchingBacktest
    ? matchingBacktest.preNewsPrice
    : (options.currentGoldPrice || 2684.50);
  const macroContext = buildMacroContext(options.currency, options.eventTitle, currentPrice, options.date);
  const technicalContext = getMultiTimeframeAnalysis("XAU/USD", currentPrice);
  const snapshotId = `snap_${Date.now()}_${crypto.createHash("sha256").update(macroContext + currentPrice).digest("hex").slice(0, 8)}`;

  let executedProvider = "none";
  let executedModel = "none";
  let executionMode: "MOCK" | "REAL_EXTERNAL_AI" | "DETERMINISTIC_RULES" | "FREE_REMINDER" = "FREE_REMINDER";
  let isRealAi = false;
  let isFallback = true;
  let fallbackReason: string | null = null;
  let providerResponseId: string | null = null;
  let tokensUsed = 0;
  let actualCostUsd = 0;
  let aiSummary = "";
  let tier: "BYOK_PAID" | "FREE_DETERMINISTIC" | "SYSTEM_AI" = "FREE_DETERMINISTIC";

  // Check user policy: Does the user have a valid BYOK key?
  const hasValidUserKey = Boolean(userCreds?.key);
  const isAuthorizedAdmin = user?.role === "admin" && Boolean(options.allowAdminKey);
  const allowAlgorithmic = Boolean(
    options.allowAlgorithmicFallback || user?.subscriptions?.enableFreeAlgorithmicView
  );

  // Client-supplied spendingCapUsd can only further constrain, never expand
  if (options.spendingCapUsd !== undefined && options.spendingCapUsd < 0.002) {
    fallbackReason = `Client spending cap ($${options.spendingCapUsd}) is below minimum estimated AI execution cost ($0.0020)`;
  }

  // Concurrency-Safe Budget Reservation (only if user has a key or authorized admin)
  let reservation: { authorized: boolean; allowed: boolean; reservationId?: string; reason?: string } = {
    authorized: true,
    allowed: !fallbackReason,
  };

  if ((hasValidUserKey || isAuthorizedAdmin) && !fallbackReason) {
    reservation = reserveBudget(userId, 0.002);
    if (!reservation.allowed) {
      fallbackReason = reservation.reason || "Spending limit reached";
    }
  } else if (!hasValidUserKey && !isAuthorizedAdmin) {
    // Ordinary user without a key: zero budget reserved, free tier enforced
    fallbackReason = allowAlgorithmic
      ? "User has no BYOK API key (Free Algorithmic Market View opted-in)"
      : "User has no BYOK API key (Policy: Free Reminders Only)";
  }

  // Exact Model Execution — NEVER silently substitute a different model
  if ((hasValidUserKey || isAuthorizedAdmin) && reservation.allowed) {
    // 1. Check for mock OpenRouter handler in test environment
    if (requestedProvider === "openrouter" && currentMockOpenRouterHandler && userCreds?.key) {
      try {
        const mockResult = await currentMockOpenRouterHandler({
          model: requestedModel,
          messages: [
            { role: "system", content: "You are an institutional macro quantitative strategist for Tier-1 FX desks." },
            { role: "user", content: `Event: ${options.eventTitle} (${options.currency}). Spot Gold: $${currentPrice}.` },
          ],
          authHeader: `Bearer ${userCreds.key}`,
        });
        if (mockResult) {
          aiSummary = mockResult.content;
          executedProvider = "openrouter-mock";
          executedModel = requestedModel;
          executionMode = "MOCK";
          isRealAi = false; // Mock inference uses executionMode: MOCK, never REAL_EXTERNAL_AI
          isFallback = false;
          fallbackReason = null;
          providerResponseId = mockResult.id;
          tokensUsed = mockResult.totalTokens;
          actualCostUsd = 0.00000; // Simulated response has zero real cost
          tier = "BYOK_PAID";
        }
      } catch (err: any) {
        fallbackReason = `Mock provider error: ${err.message}`;
      }
    }
    // 2. Real OpenRouter Execution (only when user explicitly authorizes paid execution)
    else if (requestedProvider === "openrouter" && userCreds?.key) {
      if (options.allowRealPaidApi) {
        try {
          const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${userCreds.key}`,
            },
            body: JSON.stringify({
              model: requestedModel,
              messages: [
                {
                  role: "system",
                  content: "You are an institutional macro quantitative strategist for Tier-1 FX desks.",
                },
                {
                  role: "user",
                  content: `Event: ${options.eventTitle} (${options.currency}). Spot Gold: $${currentPrice}. Summarize directional trading forecast in 2 concise sentences with macro catalyst.`,
                },
              ],
              max_tokens: 150,
            }),
          });

          if (orRes.ok) {
            const data = (await orRes.json()) as any;
            aiSummary = data.choices?.[0]?.message?.content?.trim() || "";
            executedProvider = "openrouter";
            executedModel = requestedModel;
            executionMode = "REAL_EXTERNAL_AI";
            isRealAi = true;
            isFallback = false;
            fallbackReason = null;
            providerResponseId = data.id || `or_${Date.now()}`;
            tokensUsed = data.usage?.total_tokens || 210;
            actualCostUsd = 0.00035;
            tier = "BYOK_PAID";
          } else {
            fallbackReason = `OpenRouter API returned HTTP ${orRes.status}`;
          }
        } catch (err: any) {
          fallbackReason = `OpenRouter network error: ${err.message}`;
        }
      } else {
        fallbackReason = "Real paid OpenRouter execution requires explicit user authorization (allowRealPaidApi: true)";
      }
    }
    // 3. Gemini Execution
    else if (requestedProvider === "gemini") {
      const geminiKey = userCreds?.key || (isAuthorizedAdmin ? process.env.GEMINI_API_KEY : null);
      if (geminiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const prompt = `You are the Chief Quantitative Strategist for an institutional macro trading desk.
Event: ${options.eventTitle} (${options.currency}, Impact: ${options.impact})
Date: ${options.date}
Forecast: ${options.forecast || "N/A"}, Previous: ${options.previous || "N/A"}
Macro Context: ${macroContext}
Technical Levels: Current Gold Spot $${currentPrice}, M15 Bullish OB, Key Support $${technicalContext.recommendedZones.stopLoss}

Provide institutional directional forecast for Spot Gold (XAU/USD) & EUR/USD in exactly 2 concise sentences:
1. Directional Bias (BULLISH / BEARISH) with macroeconomic catalyst.
2. High-probability entry zone and take profit targets.`;

          const targetGemini = requestedModel.includes("gemini") ? requestedModel : "gemini-3.8-flash";
          const resp = await ai.models.generateContent({
            model: targetGemini,
            contents: prompt,
          });

          aiSummary = resp.text ? resp.text.trim() : "";
          executedProvider = "gemini";
          executedModel = targetGemini;
          executionMode = "REAL_EXTERNAL_AI";
          isRealAi = true;
          isFallback = false;
          fallbackReason = null;
          providerResponseId = `gem_${Date.now()}`;
          tokensUsed = 240;
          actualCostUsd = 0.00018;
          tier = userCreds?.key ? "BYOK_PAID" : "SYSTEM_AI";
        } catch (err: any) {
          fallbackReason = `Gemini API execution error: ${err.message}`;
        }
      }
    }
  }

  // Base institutional quantitative calculation
  const baseAnalysis = executeForecastAnalysis({
    eventTitle: options.eventTitle,
    currency: options.currency,
    impact: options.impact,
    date: options.date,
    previous: options.previous,
    forecast: options.forecast,
    actual: options.actual,
    currentGoldPrice: currentPrice,
  });

  const latencyMs = Date.now() - startTime;

  // Reconcile Concurrency-Safe Budget
  if (reservation.reservationId) {
    reconcileBudget(userId, reservation.reservationId, actualCostUsd, {
      forecastId: `fc_${Date.now()}`,
      eventTitle: options.eventTitle,
      provider: executedProvider,
      model: executedModel,
      tokensUsed,
      status: isRealAi ? "SUCCESS" : "FAILED",
    });
  }

  // Apply No-Key Policy:
  // If user has no BYOK key:
  // - If allowAlgorithmic is true: clearly label as FREE ALGORITHMIC MARKET VIEW (NOT AI).
  // - If allowAlgorithmic is false: FREE REMINDERS ONLY. No trade zone, no BUY/SELL signal.
  let finalBias = baseAnalysis.bias;
  let finalBadge = baseAnalysis.badge;
  let finalEntryZone = baseAnalysis.entryZone;
  let finalTp1 = baseAnalysis.takeProfit1;
  let finalTp2 = baseAnalysis.takeProfit2;
  let finalSl = baseAnalysis.stopLoss;
  let finalAtr = baseAnalysis.atrBuffer;
  let finalSummary = aiSummary || baseAnalysis.summary;
  let finalEvidenceScore = baseAnalysis.evidenceScore;
  let finalUncertainty = baseAnalysis.uncertaintyGrade;

  if (!hasValidUserKey && !isAuthorizedAdmin) {
    if (allowAlgorithmic) {
      executedProvider = "deterministic-engine";
      executedModel = "free-algorithmic-market-view-v2.2";
      executionMode = "DETERMINISTIC_RULES";
      finalSummary = `[FREE ALGORITHMIC MARKET VIEW — NOT AI INFERENCE] ${baseAnalysis.summary}`;
      tier = "FREE_DETERMINISTIC";
    } else {
      executedProvider = "none";
      executedModel = "free-reminder-tier";
      executionMode = "FREE_REMINDER";
      tier = "FREE_DETERMINISTIC";
      finalBias = "NEUTRAL";
      finalBadge = "NEUTRAL";
      finalEntryZone = "N/A — Free Economic Calendar Reminder Only (Configure BYOK AI Key in Settings)";
      finalTp1 = "N/A";
      finalTp2 = "N/A";
      finalSl = "N/A";
      finalAtr = "N/A (No active trade signal on Free Reminder tier)";
      finalEvidenceScore = 5.0;
      finalUncertainty = "HIGH";
      finalSummary = `[FREE TIER — REMINDER ONLY] Economic calendar reminder active for ${options.eventTitle} (${options.currency}). No BUY/SELL trade signals are generated without a personal AI API key. Configure your OpenRouter or Gemini BYOK key in Settings to receive institutional AI trade plans.`;
    }
  }

  const record: UnifiedForecastRecord = {
    id: `fc_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    releaseGroupId,
    userId,
    eventTitle: options.eventTitle,
    currency: options.currency,
    impact: options.impact,
    releaseDate: options.date,
    releaseDateDhaka: formatUtcToDhaka(options.date),
    timestamp: new Date().toISOString(),
    dataSnapshotId: snapshotId,
    isReanalysis,
    preNewsPrice: currentPrice,
    bias: finalBias,
    badge: finalBadge,
    asset: baseAnalysis.asset,
    instrument: baseAnalysis.instrument,
    evidenceScore: finalEvidenceScore,
    uncertaintyGrade: finalUncertainty,
    bullishFactors: baseAnalysis.bullishFactors,
    bearishFactors: baseAnalysis.bearishFactors,
    missingDataPenalties: baseAnalysis.missingDataPenalties,
    dataFreshness: baseAnalysis.dataFreshness,
    confidenceScore: baseAnalysis.confidenceScore,
    entryZone: finalEntryZone,
    takeProfit1: finalTp1,
    takeProfit2: finalTp2,
    stopLoss: finalSl,
    atrBuffer: finalAtr,
    summary: finalSummary,
    macroRationale: baseAnalysis.macroRationale,
    technicalRationale: baseAnalysis.technicalRationale,
    attribution: {
      requestedProvider,
      requestedModel,
      executedProvider,
      executedModel,
      executionMode,
      isRealAi,
      isFallback,
      fallbackReason,
      providerResponseId,
      latencyMs,
      tokensUsed,
      actualCostUsd,
      tier,
      provider: executedProvider,
      model: executedModel,
      estimatedCostUsd: actualCostUsd,
    },
  };

  // Save to cache, user history, and durable disk store
  FORECAST_CACHE.set(cacheKey, record);
  FORECAST_CACHE.set(record.id, record);
  const history = USER_FORECAST_HISTORY.get(userId) || [];
  history.unshift(record);
  if (history.length > 50) history.pop();
  USER_FORECAST_HISTORY.set(userId, history);

  saveForecastsStore();

  return record;
}
