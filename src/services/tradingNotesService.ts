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

const STORAGE_FILE = path.resolve("./storage/trading_notes_store.json");

function ensureStorage(): { notes: DailyNoteEntry[]; tattooRules: TattooRule[] } {
  const storageDir = path.resolve("./storage");
  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

  if (!fs.existsSync(STORAGE_FILE)) {
    const seedData = getDefaultSeedData();
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(seedData, null, 2));
    return seedData;
  }

  try {
    const content = fs.readFileSync(STORAGE_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    const fallback = getDefaultSeedData();
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

function persistStorage(data: { notes: DailyNoteEntry[]; tattooRules: TattooRule[] }) {
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
