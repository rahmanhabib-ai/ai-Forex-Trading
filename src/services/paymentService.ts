// Forex AI News V2.2 — Institutional Crypto Payment & Subscription Gateway
import fs from "fs";
import path from "path";

export interface PaymentSubmission {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  packageId: string;
  packageName: string;
  amountUsd: number;
  method: "binance" | "bybit";
  senderAccount: string;
  transactionId: string;
  notes?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  verifiedAt?: string;
}

const PAYMENTS_FILE = path.resolve("./storage/payments.json");

function ensureStorage(): void {
  const dir = path.dirname(PAYMENTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(PAYMENTS_FILE)) {
    const seed: PaymentSubmission[] = [
      {
        id: "pay_sample_01",
        userId: "usr_trader_01",
        userName: "Standard Trader VIP",
        userPhone: "+8801712000000",
        packageId: "standard",
        packageName: "স্ট্যান্ডার্ড ট্রেডার ($29/মাস)",
        amountUsd: 29,
        method: "binance",
        senderAccount: "Binance Pay ID: 94810239",
        transactionId: "TXB89102934812",
        notes: "USDT TRC20 Payment via Binance Pay",
        status: "APPROVED",
        createdAt: "2026-10-23T12:30:00.000Z",
        verifiedAt: "2026-10-23T12:45:00.000Z"
      },
      {
        id: "pay_sample_02",
        userId: "usr_trader_02",
        userName: "Institutional Pro User",
        userPhone: "+8801812000000",
        packageId: "vip_pro",
        packageName: "ভিআইপি প্রো ($79/৩ মাস)",
        amountUsd: 79,
        method: "bybit",
        senderAccount: "Bybit UID: 184920381",
        transactionId: "BYB9384810293",
        notes: "USDT Transfer via Bybit UID",
        status: "PENDING",
        createdAt: "2026-10-24T08:15:00.000Z"
      }
    ];
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(seed, null, 2), "utf8");
  }
}

export function getAllPayments(): PaymentSubmission[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(PAYMENTS_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getPaymentsByUserId(userId: string): PaymentSubmission[] {
  const all = getAllPayments();
  return all.filter((p) => p.userId === userId);
}

export function submitPayment(
  data: Omit<PaymentSubmission, "id" | "status" | "createdAt">
): PaymentSubmission {
  ensureStorage();
  const all = getAllPayments();
  const newRecord: PaymentSubmission = {
    ...data,
    id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };
  all.unshift(newRecord);
  fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(all, null, 2), "utf8");
  return newRecord;
}

export function updatePaymentStatus(
  id: string,
  status: "APPROVED" | "REJECTED"
): PaymentSubmission | null {
  ensureStorage();
  const all = getAllPayments();
  const item = all.find((p) => p.id === id);
  if (!item) return null;
  item.status = status;
  item.verifiedAt = new Date().toISOString();
  fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(all, null, 2), "utf8");
  return item;
}
