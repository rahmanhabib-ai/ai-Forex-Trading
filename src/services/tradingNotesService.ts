// Trader's Diary & Psychology Journal Service
// ChartLogic.pro (Forex AI News V2.2 Enterprise Engine)
// Built specifically on the philosophy: "সোম থেকে শুক্রবার ডায়েরি রাখা, শনি-রবিবার ২ বারের বেশি হওয়া ভুল খুঁজে ট্যাটু রুলস তৈরি করা"

import fs from "fs";
import path from "path";

export interface DailyNoteEntry {
  id: string;
  userId: string;
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  date: string; // YYYY-MM-DD
  weekNumber: number;
  goodThings: string[];
  mistakes: string[];
  tags: string[];
  notes?: string;
  mindsetRating: number; // 1 to 10
  tradesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TattooRule {
  id: string;
  userId: string;
  ruleText: string;
  category: "FOMO" | "Risk Management" | "Patience" | "Execution" | "OverTrading" | "Psychology";
  frequencyCount: number;
  originWeek?: string;
  createdAt: string;
  isActive: boolean;
}

export interface WeeklyAnalysis {
  weekId: string;
  startDate: string;
  endDate: string;
  totalTradingDays: number;
  recurringMistakes: { text: string; count: number; alertLevel: "CRITICAL" | "HIGH" | "WARNING" }[];
  recurringStrengths: { text: string; count: number; praiseLevel: "GOLDEN" | "EXCELLENT" }[];
  totalGoodCount: number;
  totalMistakeCount: number;
  mindsetAverage: number;
}

export interface TradingStrategy {
  id: string;
  userId: string;
  name: string;
  isTemplate?: boolean;
  clonedFrom?: string;
  category: "Smart Money / ICT" | "Price Action" | "Breakout" | "Trend Following" | "Scalping" | "Custom";
  timeframe: string;
  session: "London & NY" | "London Only" | "NY Open Only" | "Asian Session" | "All Sessions";
  minRiskReward: string;
  rulesChecklist: string[];
  riskRule: string;
  description: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_FILE = path.resolve("./storage/trading_notes_store.json");

function ensureStorage(): { notes: DailyNoteEntry[]; tattooRules: TattooRule[]; strategies?: TradingStrategy[] } {
  const storageDir = path.resolve("./storage");
  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

  if (!fs.existsSync(STORAGE_FILE)) {
    const seedData = getDefaultSeedData();
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(seedData, null, 2));
    return seedData;
  }

  try {
    const content = fs.readFileSync(STORAGE_FILE, "utf-8");
    const parsed = JSON.parse(content);
    if (!parsed.strategies) parsed.strategies = [];
    return parsed;
  } catch (err) {
    const fallback = getDefaultSeedData();
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

function persistStorage(data: { notes: DailyNoteEntry[]; tattooRules: TattooRule[]; strategies?: TradingStrategy[] }) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("[TradingNotesService] Failed to persist data:", err);
  }
}

function getDefaultSeedData(): { notes: DailyNoteEntry[]; tattooRules: TattooRule[] } {
  const defaultTattooRules: TattooRule[] = [
    {
      id: "tattoo-1",
      userId: "usr_admin_master",
      ruleText: "হাই-ইমপ্যাক্ট নিউজ (CPI / NFP / FOMC)-এর ১৫ মিনিট আগে কোনো ইমোশনাল বা ফোমো (FOMO) এন্ট্রি নেওয়া সম্পূর্ণ নিষিদ্ধ।",
      category: "FOMO",
      frequencyCount: 3,
      originWeek: "Week 1 Review",
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      isActive: true,
    },
    {
      id: "tattoo-2",
      userId: "usr_admin_master",
      ruleText: "ট্রেডিং সেশনে পরপর ২টি স্টপ-লস হিট করলে সাথে সাথে টার্মিনাল বন্ধ করতে হবে—কোনো রিভেঞ্জ ট্রেড চলবে না।",
      category: "Psychology",
      frequencyCount: 4,
      originWeek: "Week 2 Review",
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      isActive: true,
    },
    {
      id: "tattoo-3",
      userId: "usr_admin_master",
      ruleText: "রিস্ক-টু-রিওয়ার্ড ন্যূনতম ১:২ সেটআপ না পেলে কোনো ট্রেড ট্রিগার করা যাবে না এবং লট সাইজ ক্যাপিটালের ১.৫% এর বেশি হবে না।",
      category: "Risk Management",
      frequencyCount: 3,
      originWeek: "Week 3 Review",
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      isActive: true,
    },
    {
      id: "tattoo-4",
      userId: "usr_admin_master",
      ruleText: "ট্রেড ওপেন করার পর স্টপ লস কখনো পেছনের দিকে সরানো চলবে না—মার্কেটের ডিসিশনকে সম্মান জানাতে হবে।",
      category: "Execution",
      frequencyCount: 2,
      originWeek: "Week 4 Review",
      createdAt: new Date().toISOString(),
      isActive: true,
    },
  ];

  const days: Array<"Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday"> = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ];

  const sampleNotes: DailyNoteEntry[] = days.map((day, idx) => {
    const d = new Date(Date.now() - (4 - idx) * 86400000);
    return {
      id: `note-${day.toLowerCase()}-${d.toISOString().split("T")[0]}`,
      userId: "usr_admin_master",
      dayOfWeek: day,
      date: d.toISOString().split("T")[0],
      weekNumber: 1,
      goodThings:
        idx === 0
          ? ["লন্ডন সেশনে XAUUSD এর M15 অর্ডার ব্লকে পারফেক্ট ১:২ প্রফিট বুক করেছি", "ট্রেড নেওয়ার আগে চেক-লিস্ট ১০০% পূরণ করেছি"]
          : idx === 1
          ? ["ঝুঁকি ঠিক রেখে ১.৫% এর বেশি রিস্ক নেইনি", "স্টপ লস হিট করার পর মাথা ঠান্ডা রেখেছি"]
          : idx === 2
          ? ["EURUSD ব্রেকআউট রিটেস্টে ধৈর্য ধরে অপেক্ষা করেছি", "আজকে কোনো অপ্রয়োজনীয় ওভারট্রেডিং করিনি"]
          : idx === 3
          ? ["ইউএস সেশনে গোল্ডের প্রফিট টার্গেট পর্যন্ত অপেক্ষা করেছি"]
          : ["শুক্রবার মার্কেট ক্লোজিংয়ের আগে সব ওপেন পজিশন নিরাপদ করেছি"],
      mistakes:
        idx === 0
          ? ["দেরিতে চার্টে এসে কিছুটা ফোমো (FOMO) অনুভব হয়েছিল"]
          : idx === 1
          ? ["প্রথম লসের পর সামান্য রিভেঞ্জ ট্রেড নেওয়ার প্রবণতা জেগেছিল"]
          : idx === 2
          ? ["দেরিতে এন্ট্রি (FOMO) - ক্যান্ডেল ক্লোজিংয়ের আগেই অর্ডার প্লেস করেছিলাম"]
          : idx === 3
          ? ["দেরিতে এন্ট্রি (FOMO) - নিউজের পর স্পাইক দেখে লাফ দিয়ে ঢুকতে গিয়েছিলাম"]
          : ["দেরিতে এন্ট্রি (FOMO) - শুক্রবার সন্ধ্যায় অপ্রয়োজনীয় স্কাল্পিং"],
      tags: ["#FOMO", "#OrderBlock", "#StopLoss", "#Patience"],
      notes: "আজকের ট্রেডিং সেশনে শৃঙ্খলা ছিল ভালো। কিন্তু ফোমো এন্ট্রি থেকে সম্পূর্ণ মুক্ত হতে হবে।",
      mindsetRating: 8 - (idx % 2),
      tradesCount: 2,
      createdAt: d.toISOString(),
      updatedAt: d.toISOString(),
    };
  });

  return { notes: sampleNotes, tattooRules: defaultTattooRules };
}

export function getUserDailyNotes(userId: string): DailyNoteEntry[] {
  const store = ensureStorage();
  return store.notes.filter((n) => n.userId === userId || n.userId === "usr_admin_master");
}

export function saveDailyNote(
  userId: string,
  entry: Partial<DailyNoteEntry> & { dayOfWeek: DailyNoteEntry["dayOfWeek"]; date: string }
): DailyNoteEntry {
  const store = ensureStorage();
  const existingIdx = store.notes.findIndex(
    (n) => (n.userId === userId || n.userId === "usr_admin_master") && n.date === entry.date
  );

  const now = new Date().toISOString();
  if (existingIdx !== -1) {
    const updated: DailyNoteEntry = {
      ...store.notes[existingIdx],
      ...entry,
      updatedAt: now,
    };
    store.notes[existingIdx] = updated;
    persistStorage(store);
    return updated;
  }

  const created: DailyNoteEntry = {
    id: `note_${entry.dayOfWeek.toLowerCase()}_${Date.now()}`,
    userId,
    dayOfWeek: entry.dayOfWeek,
    date: entry.date,
    weekNumber: entry.weekNumber || 1,
    goodThings: entry.goodThings || [],
    mistakes: entry.mistakes || [],
    tags: entry.tags || [],
    notes: entry.notes || "",
    mindsetRating: entry.mindsetRating || 7,
    tradesCount: entry.tradesCount || 1,
    createdAt: now,
    updatedAt: now,
  };

  store.notes.push(created);
  persistStorage(store);
  return created;
}

export function quickAddNote(
  userId: string,
  type: "good" | "mistake" | "mindset",
  text: string,
  dayOfWeek?: DailyNoteEntry["dayOfWeek"]
): { success: boolean; entry: DailyNoteEntry } {
  const store = ensureStorage();
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  const currentDayNames: Array<DailyNoteEntry["dayOfWeek"]> = [
    "Monday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Friday",
  ];
  const detectedDay = dayOfWeek || currentDayNames[now.getDay()] || "Monday";

  let note = store.notes.find(
    (n) => (n.userId === userId || n.userId === "usr_admin_master") && n.date === dateStr
  );

  if (!note) {
    note = {
      id: `note_${detectedDay.toLowerCase()}_${Date.now()}`,
      userId,
      dayOfWeek: detectedDay,
      date: dateStr,
      weekNumber: 1,
      goodThings: [],
      mistakes: [],
      tags: [],
      notes: "",
      mindsetRating: 8,
      tradesCount: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    store.notes.push(note);
  }

  if (type === "good") {
    note.goodThings.push(text);
  } else if (type === "mistake") {
    note.mistakes.push(text);
  } else if (type === "mindset") {
    note.notes = note.notes ? `${note.notes}\n[Mindset]: ${text}` : `[Mindset]: ${text}`;
  }

  note.updatedAt = now.toISOString();
  persistStorage(store);
  return { success: true, entry: note };
}

export function getTattooRules(userId: string): TattooRule[] {
  const store = ensureStorage();
  return store.tattooRules.filter((r) => r.userId === userId || r.userId === "usr_admin_master");
}

export function addTattooRule(userId: string, rule: Omit<TattooRule, "id" | "userId" | "createdAt">): TattooRule {
  const store = ensureStorage();
  const created: TattooRule = {
    ...rule,
    id: `tattoo_${Date.now()}`,
    userId,
    createdAt: new Date().toISOString(),
    isActive: true,
  };
  store.tattooRules.unshift(created);
  persistStorage(store);
  return created;
}

export function deleteTattooRule(userId: string, ruleId: string): boolean {
  const store = ensureStorage();
  const initialLength = store.tattooRules.length;
  store.tattooRules = store.tattooRules.filter((r) => r.id !== ruleId);
  if (store.tattooRules.length !== initialLength) {
    persistStorage(store);
    return true;
  }
  return false;
}

function normalizeTheme(text: string): string {
  const clean = text.trim();
  if (clean.includes("FOMO") || clean.includes("ফোমো") || clean.includes("দেরিতে")) {
    return "দেরিতে ফোমো এন্ট্রি নেওয়া (FOMO Entry without Candle Confirmation)";
  }
  if (clean.includes("রিভেঞ্জ") || clean.includes("Revenge")) {
    return "লসের পর মাথা গরম করে রিভেঞ্জ ট্রেডিং (Revenge Trading after SL)";
  }
  if (clean.includes("লট সাইজ") || clean.includes("High Lot") || clean.includes("বড় লট")) {
    return "ক্যাপিটালের তুলনায় অতিরিক্ত লট সাইজ নেওয়া (Over-Leverage & Big Lots)";
  }
  if (clean.includes("স্টপ-লস") || clean.includes("স্টপ লস") || clean.includes("Stop Loss") || clean.includes("SL")) {
    return "ট্রেড ওপেন করে স্টপ-লস পেছানো (Moving Stop Loss against Rules)";
  }
  if (clean.includes("স্কাল্পিং") || clean.includes("ওভারট্রেডিং") || clean.includes("OverTrading")) {
    return "প্ল্যান ছাড়া হুজুগে স্কাল্পিং ও ওভারট্রেডিং (Impulsive OverTrading)";
  }
  if (clean.includes("-")) return clean.split("-")[0].trim();
  return clean;
}

function normalizeStrength(text: string): string {
  const clean = text.trim();
  if (clean.includes("১:২") || clean.includes("প্রফিট টার্গেট")) {
    return "১:২ রিস্ক-টু-রিওয়ার্ড অনুপাত বজায় রাখা (Strict 1:2 RR Target)";
  }
  if (clean.includes("রিস্ক") || clean.includes("১.৫%")) {
    return "ক্যাপিটালের ১.৫% এর মধ্যে রিস্ক সীমাবদ্ধ রাখা (Risk Management Discipline)";
  }
  if (clean.includes("চেক-লিস্ট") || clean.includes("অর্ডার ব্লক")) {
    return "হাই-কনভিকশন অর্ডার ব্লক চেক-লিস্ট অনুসরণ (Execution Checklist Followed)";
  }
  if (clean.includes("ধৈর্য") || clean.includes("অপেক্ষা")) {
    return "সেটআপ কনফার্মেশন পর্যন্ত ধৈর্যশীল অপেক্ষা (High Patience & Discipline)";
  }
  return clean;
}

export function analyzeWeeklyReview(userId: string): WeeklyAnalysis {
  const notes = getUserDailyNotes(userId);

  const mistakeCounts: Record<string, number> = {};
  const goodCounts: Record<string, number> = {};
  let totalRating = 0;

  notes.forEach((n) => {
    totalRating += n.mindsetRating || 7;
    n.mistakes.forEach((m) => {
      const theme = normalizeTheme(m);
      if (!theme) return;
      mistakeCounts[theme] = (mistakeCounts[theme] || 0) + 1;
    });
    n.goodThings.forEach((g) => {
      const theme = normalizeStrength(g);
      if (!theme) return;
      goodCounts[theme] = (goodCounts[theme] || 0) + 1;
    });
  });

  const recurringMistakes = Object.entries(mistakeCounts)
    .filter(([_, count]) => count >= 2)
    .map(([text, count]) => ({
      text,
      count,
      alertLevel: (count >= 3 ? "CRITICAL" : "HIGH") as "CRITICAL" | "HIGH" | "WARNING",
    }))
    .sort((a, b) => b.count - a.count);

  const recurringStrengths = Object.entries(goodCounts)
    .filter(([_, count]) => count >= 2)
    .map(([text, count]) => ({
      text,
      count,
      praiseLevel: (count >= 3 ? "GOLDEN" : "EXCELLENT") as "GOLDEN" | "EXCELLENT",
    }))
    .sort((a, b) => b.count - a.count);

  const totalGood = Object.values(goodCounts).reduce((acc, c) => acc + c, 0);
  const totalMistakes = Object.values(mistakeCounts).reduce((acc, c) => acc + c, 0);

  return {
    weekId: "Current Active Week",
    startDate: notes[0]?.date || new Date().toISOString().split("T")[0],
    endDate: notes[notes.length - 1]?.date || new Date().toISOString().split("T")[0],
    totalTradingDays: notes.length,
    recurringMistakes,
    recurringStrengths,
    totalGoodCount: totalGood,
    totalMistakeCount: totalMistakes,
    mindsetAverage: notes.length > 0 ? Number((totalRating / notes.length).toFixed(1)) : 8,
  };
}

export function getDefaultStrategyTemplates(): TradingStrategy[] {
  return [
    {
      id: "template-ict-2022",
      userId: "system",
      name: "ICT 2022 Mentorship Model",
      isTemplate: true,
      category: "Smart Money / ICT",
      timeframe: "15m / 5m",
      session: "London & NY",
      minRiskReward: "1:2.5",
      rulesChecklist: [
        "Higher Timeframe (1H/15m) Key Liquidity Sweep",
        "Market Structure Shift (MSS) with impulsive displacement",
        "Fair Value Gap (FVG) retracement limit / market entry"
      ],
      riskRule: "Max 1.0% risk per trade. Move to Break-Even at 1:1 R.",
      description: "Algorithmic displacement, imbalance filling, and institutional delivery model.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "template-london-breakout",
      userId: "system",
      name: "London Session Range Breakout",
      isTemplate: true,
      category: "Breakout",
      timeframe: "15m / 5m",
      session: "London Only",
      minRiskReward: "1:2.0",
      rulesChecklist: [
        "Mark Asian Session High & Low range (00:00 - 06:00 UTC)",
        "Wait for clean liquidity sweep or aggressive breakout candle",
        "Enter on 5m retest with stop beyond impulse candle"
      ],
      riskRule: "Max 1.5% capital risk. Strict session cutoff by 12:00 UTC.",
      description: "Exploiting high-velocity institutional capital injection at Frankfurt & London open.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "template-liquidity-sweep",
      userId: "system",
      name: "Daily Liquidity Sweep & SFP",
      isTemplate: true,
      category: "Price Action",
      timeframe: "1H / 15m",
      session: "All Sessions",
      minRiskReward: "1:3.0",
      rulesChecklist: [
        "Previous Day High (PDH) or Low (PDL) sweep confirmed",
        "Swing Failure Pattern (SFP) long wick candle rejection",
        "Momentum / volume divergence confirmation on LTF"
      ],
      riskRule: "Stop loss placed strictly beyond the sweep wick peak.",
      description: "Capturing retail stop-loss runs and smart-money trap reversals.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "template-supply-demand-flip",
      userId: "system",
      name: "Supply & Demand Zone Flip",
      isTemplate: true,
      category: "Price Action",
      timeframe: "4H / 1H / 15m",
      session: "London & NY",
      minRiskReward: "1:2.5",
      rulesChecklist: [
        "Identify fresh unmitigated Drop-Base-Rally or Rally-Base-Drop",
        "Strong imbalance candle departure leaving clean imbalance",
        "Enter on first touch limit order with protective SL beyond base"
      ],
      riskRule: "1% risk per setup. Target opposing HTF liquidity pool.",
      description: "Trading with large institutional footprint orders at supply/demand inflection levels.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "template-trend-50ema",
      userId: "system",
      name: "Trend Continuation & 50 EMA Retest",
      isTemplate: true,
      category: "Trend Following",
      timeframe: "1H / 15m",
      session: "All Sessions",
      minRiskReward: "1:2.0",
      rulesChecklist: [
        "Higher Highs & Higher Lows market structure confirmed on 1H",
        "Price retraces cleanly into 50 EMA dynamic support zone",
        "Reversal candlestick (pinbar or engulfing) confirmation"
      ],
      riskRule: "Stop placed below most recent swing low.",
      description: "High-probability pullback continuation in established forex & gold trends.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

export function getUserStrategies(userId: string): { myStrategies: TradingStrategy[]; templates: TradingStrategy[] } {
  const store = ensureStorage();
  const templates = getDefaultStrategyTemplates();
  const myStrategies = (store.strategies || []).filter(s => s.userId === userId && !s.isTemplate);
  if (myStrategies.length === 0) {
    const starterStrategy: TradingStrategy = {
      id: `strat-${Date.now()}`,
      userId,
      name: "ICT Order Block + London Retest (My Version)",
      clonedFrom: "ICT 2022 Mentorship Model",
      category: "Smart Money / ICT",
      timeframe: "15m / 5m",
      session: "London Only",
      minRiskReward: "1:2.5",
      rulesChecklist: [
        "Higher Timeframe (1H) Liquidity Sweep confirmed",
        "Market Structure Shift (MSS) on 5m timeframe",
        "Order Block & FVG overlap entry",
        "London Session Killzone timing (07:00 - 10:00 UTC)"
      ],
      riskRule: "Max 1.0% capital risk. Strict break-even at 1:1 R.",
      description: "My personal customized version of the ICT model adapted specifically for London session Gold (XAUUSD) & EURUSD.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.strategies = [starterStrategy];
    persistStorage(store);
    return { myStrategies: [starterStrategy], templates };
  }
  return { myStrategies, templates };
}

export function saveUserStrategy(userId: string, strategy: Partial<TradingStrategy>): TradingStrategy {
  const store = ensureStorage();
  if (!store.strategies) store.strategies = [];

  if (strategy.id) {
    const idx = store.strategies.findIndex(s => s.id === strategy.id && s.userId === userId);
    if (idx !== -1) {
      store.strategies[idx] = {
        ...store.strategies[idx],
        ...strategy,
        updatedAt: new Date().toISOString()
      };
      persistStorage(store);
      return store.strategies[idx];
    }
  }

  const created: TradingStrategy = {
    id: strategy.id || `strat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    name: strategy.name || "Custom Strategy",
    isTemplate: false,
    clonedFrom: strategy.clonedFrom,
    category: strategy.category || "Custom",
    timeframe: strategy.timeframe || "15m / 5m",
    session: strategy.session || "All Sessions",
    minRiskReward: strategy.minRiskReward || "1:2.0",
    rulesChecklist: Array.isArray(strategy.rulesChecklist) ? strategy.rulesChecklist : ["Plan followed strictly"],
    riskRule: strategy.riskRule || "Max 1.0% risk per trade",
    description: strategy.description || "",
    notes: strategy.notes || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.strategies.push(created);
  persistStorage(store);
  return created;
}

export function cloneStrategyTemplate(userId: string, templateId: string, customUpgrades?: Partial<TradingStrategy>): TradingStrategy {
  const templates = getDefaultStrategyTemplates();
  const tpl = templates.find(t => t.id === templateId) || templates[0];

  return saveUserStrategy(userId, {
    name: customUpgrades?.name || `${tpl.name} (My Version)`,
    clonedFrom: tpl.name,
    category: customUpgrades?.category || tpl.category,
    timeframe: customUpgrades?.timeframe || tpl.timeframe,
    session: customUpgrades?.session || tpl.session,
    minRiskReward: customUpgrades?.minRiskReward || tpl.minRiskReward,
    rulesChecklist: customUpgrades?.rulesChecklist || [...tpl.rulesChecklist],
    riskRule: customUpgrades?.riskRule || tpl.riskRule,
    description: customUpgrades?.description || `Customized upgrade based on ${tpl.name}. Fine-tuned for personal execution rules.`
  });
}

export function deleteUserStrategy(userId: string, strategyId: string, isAdmin?: boolean): boolean {
  const store = ensureStorage();
  let changed = false;
  if (store.strategies && store.strategies.length > 0) {
    const initialLen = store.strategies.length;
    store.strategies = store.strategies.filter(s => {
      if (s.id === strategyId || (isAdmin && s.name.toLowerCase() === strategyId.toLowerCase())) {
        if (isAdmin || s.userId === userId) {
          changed = true;
          return false;
        }
      }
      return true;
    });
  }
  if (changed) {
    persistStorage(store);
    return true;
  }
  return false;
}

