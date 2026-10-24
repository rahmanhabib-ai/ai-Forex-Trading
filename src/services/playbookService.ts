// Trading Strategy Playbook & Community Backtest Journal Service
// High-Conviction Institutional Setup Catalog & Discussion Engine

import fs from "fs";
import path from "path";

export interface PlaybookEntry {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  session: "New York" | "London" | "Asian" | "London/NY Overlap" | "Any Session";
  technicalLevel: "Support" | "Resistance" | "Order Block" | "Liquidity Sweep" | "Breakout" | "Range";
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "Daily";
  tradingTime?: string;
  candlestickPattern: string;
  chartImageUrl?: string;
  youtubeVideoUrl?: string;
  pineScript?: string;
  journalNotes?: string;
  riskPercent?: number;
  rewardPercent?: number;
  pair?: string;
  ratings?: { userId: string; stars: number }[];
  averageRating?: number;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRatePercent: number;
  riskRewardRatio: string;
  passReasons: string[];
  failReasons: string[];
  visibility: "public" | "private";
  upvotes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlaybookComment {
  id: string;
  playbookId: string;
  authorId: string;
  authorName: string;
  commentText: string;
  createdAt: string;
}

const PLAYBOOK_FILE = path.resolve("./storage/playbook_entries.json");
const COMMENTS_FILE = path.resolve("./storage/playbook_comments.json");
const UPLOAD_DIR = path.resolve("./public/uploads/playbook");

function ensureStorage() {
  const storageDir = path.resolve("./storage");
  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  if (!fs.existsSync(PLAYBOOK_FILE)) {
    fs.writeFileSync(PLAYBOOK_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(COMMENTS_FILE)) {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify([], null, 2));
  }
}

export function getPlaybooks(filters?: {
  session?: string;
  level?: string;
  visibility?: string;
  authorId?: string;
  search?: string;
}): PlaybookEntry[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(PLAYBOOK_FILE, "utf-8");
    let list: PlaybookEntry[] = JSON.parse(raw);

    if (filters?.session && filters.session !== "All") {
      list = list.filter((p) => p.session === filters.session);
    }
    if (filters?.level && filters.level !== "All") {
      list = list.filter((p) => p.technicalLevel === filters.level);
    }
    if (filters?.visibility && filters.visibility !== "All") {
      list = list.filter((p) => p.visibility === filters.visibility);
    }
    if (filters?.authorId) {
      list = list.filter((p) => p.authorId === filters.authorId || p.visibility === "public");
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.candlestickPattern.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error("Failed to read playbook entries:", err);
    return [];
  }
}

export function getPlaybookById(id: string): PlaybookEntry | null {
  ensureStorage();
  try {
    const list = getPlaybooks();
    return list.find((p) => p.id === id) || null;
  } catch {
    return null;
  }
}

export function createPlaybook(
  data: Partial<PlaybookEntry>,
  author: { id: string; name: string }
): PlaybookEntry {
  ensureStorage();
  const list = getPlaybooks();

  const total = Number(data.totalTrades) || 0;
  const wins = Number(data.winCount) || 0;
  const losses = Number(data.lossCount) || 0;
  const winRate = total > 0 ? Number(((wins / total) * 100).toFixed(1)) : 0;

  const newEntry: PlaybookEntry = {
    id: `pb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    authorId: author.id,
    authorName: author.name || "Institutional Trader",
    title: (data.title || "Untitled Strategy").trim(),
    description: (data.description || "").trim(),
    session: data.session || "New York",
    technicalLevel: data.technicalLevel || "Support",
    timeframe: data.timeframe || "5m",
    tradingTime: data.tradingTime || "সন্ধ্যা ০৬:৩০ - ০৯:৩০ PM (NY Open)",
    candlestickPattern: (data.candlestickPattern || "Price Action Confirmation").trim(),
    chartImageUrl: data.chartImageUrl || "",
    youtubeVideoUrl: data.youtubeVideoUrl || "",
    pineScript: data.pineScript || "",
    journalNotes: data.journalNotes || "",
    riskPercent: data.riskPercent !== undefined ? Number(data.riskPercent) : 1,
    rewardPercent: data.rewardPercent !== undefined ? Number(data.rewardPercent) : 3,
    pair: data.pair || "XAU/USD (Gold)",
    ratings: Array.isArray(data.ratings) ? data.ratings : [{ userId: author.id, stars: 5 }],
    averageRating: data.averageRating !== undefined ? Number(data.averageRating) : 5.0,
    totalTrades: total,
    winCount: wins,
    lossCount: losses,
    winRatePercent: winRate,
    riskRewardRatio: data.riskRewardRatio || "1:2.0",
    passReasons: Array.isArray(data.passReasons) ? data.passReasons.filter(Boolean) : [],
    failReasons: Array.isArray(data.failReasons) ? data.failReasons.filter(Boolean) : [],
    visibility: data.visibility === "private" ? "private" : "public",
    upvotes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  list.unshift(newEntry);
  fs.writeFileSync(PLAYBOOK_FILE, JSON.stringify(list, null, 2));
  return newEntry;
}

export function updatePlaybook(
  id: string,
  data: Partial<PlaybookEntry>,
  user: { id: string; role?: string }
): { success: boolean; entry?: PlaybookEntry; error?: string } {
  ensureStorage();
  const list = getPlaybooks();
  const index = list.findIndex((p) => p.id === id);

  if (index === -1) {
    return { success: false, error: "Playbook setup not found" };
  }

  const existing = list[index];
  // Strict ownership check: only author or admin can update
  if (existing.authorId !== user.id && user.role !== "admin") {
    return { success: false, error: "Permission denied: Only the setup author can edit this playbook." };
  }

  const total = data.totalTrades !== undefined ? Number(data.totalTrades) : existing.totalTrades;
  const wins = data.winCount !== undefined ? Number(data.winCount) : existing.winCount;
  const losses = data.lossCount !== undefined ? Number(data.lossCount) : existing.lossCount;
  const winRate = total > 0 ? Number(((wins / total) * 100).toFixed(1)) : 0;

  const updated: PlaybookEntry = {
    ...existing,
    title: data.title !== undefined ? data.title.trim() : existing.title,
    description: data.description !== undefined ? data.description.trim() : existing.description,
    session: data.session || existing.session,
    technicalLevel: data.technicalLevel || existing.technicalLevel,
    timeframe: data.timeframe || existing.timeframe,
    tradingTime: data.tradingTime !== undefined ? data.tradingTime : existing.tradingTime,
    candlestickPattern: data.candlestickPattern !== undefined ? data.candlestickPattern.trim() : existing.candlestickPattern,
    chartImageUrl: data.chartImageUrl !== undefined ? data.chartImageUrl : existing.chartImageUrl,
    youtubeVideoUrl: data.youtubeVideoUrl !== undefined ? data.youtubeVideoUrl : existing.youtubeVideoUrl,
    pineScript: data.pineScript !== undefined ? data.pineScript : existing.pineScript,
    journalNotes: data.journalNotes !== undefined ? data.journalNotes : existing.journalNotes,
    riskPercent: data.riskPercent !== undefined ? Number(data.riskPercent) : existing.riskPercent,
    rewardPercent: data.rewardPercent !== undefined ? Number(data.rewardPercent) : existing.rewardPercent,
    pair: data.pair !== undefined ? data.pair : (existing.pair || "XAU/USD (Gold)"),
    totalTrades: total,
    winCount: wins,
    lossCount: losses,
    winRatePercent: winRate,
    riskRewardRatio: data.riskRewardRatio || existing.riskRewardRatio,
    passReasons: Array.isArray(data.passReasons) ? data.passReasons : existing.passReasons,
    failReasons: Array.isArray(data.failReasons) ? data.failReasons : existing.failReasons,
    visibility: data.visibility || existing.visibility,
    updatedAt: new Date().toISOString(),
  };

  list[index] = updated;
  fs.writeFileSync(PLAYBOOK_FILE, JSON.stringify(list, null, 2));
  return { success: true, entry: updated };
}

export function ratePlaybook(
  id: string,
  userId: string,
  stars: number
): { success: boolean; entry?: PlaybookEntry; averageRating?: number; error?: string } {
  ensureStorage();
  const list = getPlaybooks();
  const index = list.findIndex((p) => p.id === id);
  if (index === -1) return { success: false, error: "Playbook not found" };

  const entry = list[index];
  if (!Array.isArray(entry.ratings)) entry.ratings = [];

  const cleanStars = Math.max(1, Math.min(5, Math.round(stars)));
  const existingRatingIdx = entry.ratings.findIndex((r) => r.userId === userId);

  if (existingRatingIdx !== -1) {
    entry.ratings[existingRatingIdx].stars = cleanStars;
  } else {
    entry.ratings.push({ userId, stars: cleanStars });
  }

  const sum = entry.ratings.reduce((acc, r) => acc + r.stars, 0);
  entry.averageRating = Number((sum / entry.ratings.length).toFixed(1));
  entry.updatedAt = new Date().toISOString();

  list[index] = entry;
  fs.writeFileSync(PLAYBOOK_FILE, JSON.stringify(list, null, 2));
  return { success: true, entry, averageRating: entry.averageRating };
}

export function deletePlaybook(
  id: string,
  user: { id: string; role?: string }
): { success: boolean; error?: string } {
  ensureStorage();
  const list = getPlaybooks();
  const existing = list.find((p) => p.id === id);

  if (!existing) {
    return { success: false, error: "Playbook setup not found" };
  }

  // Strict ownership check
  if (existing.authorId !== user.id && user.role !== "admin") {
    return { success: false, error: "Permission denied: You cannot delete another trader's setup." };
  }

  const filtered = list.filter((p) => p.id !== id);
  fs.writeFileSync(PLAYBOOK_FILE, JSON.stringify(filtered, null, 2));

  // Also remove associated comments
  try {
    const rawComments = fs.readFileSync(COMMENTS_FILE, "utf-8");
    const comments: PlaybookComment[] = JSON.parse(rawComments);
    const updatedComments = comments.filter((c) => c.playbookId !== id);
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(updatedComments, null, 2));
  } catch {}

  return { success: true };
}

export function togglePlaybookUpvote(id: string, userId: string): { success: boolean; upvotes: string[]; isUpvoted: boolean } {
  ensureStorage();
  const list = getPlaybooks();
  const entry = list.find((p) => p.id === id);

  if (!entry) return { success: false, upvotes: [], isUpvoted: false };

  const hasUpvoted = entry.upvotes.includes(userId);
  if (hasUpvoted) {
    entry.upvotes = entry.upvotes.filter((u) => u !== userId);
  } else {
    entry.upvotes.push(userId);
  }

  fs.writeFileSync(PLAYBOOK_FILE, JSON.stringify(list, null, 2));
  return { success: true, upvotes: entry.upvotes, isUpvoted: !hasUpvoted };
}

export function getCommentsByPlaybookId(playbookId: string): PlaybookComment[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(COMMENTS_FILE, "utf-8");
    const comments: PlaybookComment[] = JSON.parse(raw);
    return comments
      .filter((c) => c.playbookId === playbookId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch {
    return [];
  }
}

export function addComment(
  playbookId: string,
  commentText: string,
  author: { id: string; name: string }
): PlaybookComment {
  ensureStorage();
  const raw = fs.readFileSync(COMMENTS_FILE, "utf-8");
  const comments: PlaybookComment[] = JSON.parse(raw);

  const newComment: PlaybookComment = {
    id: `cm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    playbookId,
    authorId: author.id,
    authorName: author.name || "Community Trader",
    commentText: commentText.trim(),
    createdAt: new Date().toISOString(),
  };

  comments.push(newComment);
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
  return newComment;
}

export function saveChartSnapshot(base64Payload: string): string {
  ensureStorage();
  try {
    const matches = base64Payload.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 payload");
    }

    const ext = matches[1].includes("png") ? "png" : matches[1].includes("webp") ? "webp" : "jpg";
    const filename = `tv_snapshot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    const buffer = Buffer.from(matches[2], "base64");
    fs.writeFileSync(filePath, buffer);

    return `/uploads/playbook/${filename}`;
  } catch (err: any) {
    console.error("Failed to save chart snapshot:", err);
    throw err;
  }
}
