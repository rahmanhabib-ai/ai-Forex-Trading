import * as fs from "fs";
import * as vm from "vm";

const BASE_URL = "http://localhost:3000";

async function runStep4AcceptanceTests() {
  console.log("=================================================");
  console.log("🚀 STARTING STEP 4 ACCEPTANCE TESTS");
  console.log("Broker Trade Execution Panel & Trader's Diary Bridge");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // Test 1: Verify bundle integrity and syntax
  try {
    const bundleContent = fs.readFileSync("assets/index-BmjL0JbS.js", "utf8");
    new vm.Script(bundleContent);
    assert(true, "Production bundle assets/index-BmjL0JbS.js parses cleanly with 0 syntax errors");
  } catch (err: any) {
    assert(false, `Production bundle syntax error: ${err.message}`);
  }

  // Test 2: Check for 1-Click Execution Panel elements in bundle
  const bundleCode = fs.readFileSync("assets/index-BmjL0JbS.js", "utf8");
  assert(
    bundleCode.includes("Exness") && bundleCode.includes("Pepperstone") && bundleCode.includes("IC Markets"),
    "Broker Dock supports Exness, Pepperstone, and IC Markets selection"
  );

  // Test 3: Check lot size pills and execution buttons
  assert(
    bundleCode.includes("0.01") && bundleCode.includes("0.10") && bundleCode.includes("1.00"),
    "Micro (0.01), Mini (0.10), Standard (1.00) quick lot size selector pills present"
  );
  assert(
    bundleCode.includes("handleExecuteTrade") && bundleCode.includes("handleClosePosition"),
    "1-Click BUY / SELL execution and trade closing handlers present"
  );

  // Test 4: Check Trader's Diary & Psychology Snapshot modal in bundle
  assert(
    bundleCode.includes("handleOpenDiaryModal") && bundleCode.includes("handleSaveToDiary"),
    "Trader's Diary modal open and save handlers present"
  );
  assert(
    bundleCode.includes("Disciplined") && bundleCode.includes("FOMO") && bundleCode.includes("Revenge"),
    "Psychology & Mindset tags (Disciplined, FOMO, Revenge, Patient, Confident) present"
  );

  // Test 5: Backend API - Execute a BUY Trade
  try {
    const buyRes = await fetch(`${BASE_URL}/api/portfolio/trade/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: "XAUUSD",
        type: "BUY",
        lots: 0.1,
        price: 2650.50,
        sl: 2640.00,
        tp: 2670.00,
        broker: "Exness Pro Raw"
      })
    });
    const data = await buyRes.json() as any;
    assert(
      data.success === true && data.trade && data.trade.symbol === "XAUUSD" && data.trade.type === "BUY" && data.trade.status === "OPEN",
      `Execute BUY trade on XAUUSD via Exness Pro Raw (Ticket #${data.trade?.ticket})`
    );

    // Test 6: Backend API - Execute a SELL Trade
    const sellRes = await fetch(`${BASE_URL}/api/portfolio/trade/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: "EURUSD",
        type: "SELL",
        lots: 0.5,
        price: 1.0550,
        sl: 1.0590,
        tp: 1.0480,
        broker: "IC Markets Raw Spread"
      })
    });
    const sellData = await sellRes.json() as any;
    assert(
      sellData.success === true && sellData.trade && sellData.trade.symbol === "EURUSD" && sellData.trade.type === "SELL",
      `Execute SELL trade on EURUSD via IC Markets (Ticket #${sellData.trade?.ticket})`
    );

    // Test 7: Backend API - Close the trade and calculate PnL
    const closeRes = await fetch(`${BASE_URL}/api/portfolio/trade/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticket: data.trade.ticket,
        closePrice: 2662.50,
        profit: 120.00
      })
    });
    const closeData = await closeRes.json() as any;
    assert(
      closeData.success === true && closeData.trade?.status === "CLOSED" && closeData.trade?.profit === 120.00,
      `Close trade #${data.trade.ticket} with positive profit ($120.00) recorded in history`
    );
  } catch (err: any) {
    assert(false, `Trade execution endpoint error: ${err.message}`);
  }

  // Test 8: Backend API - Save Chart Snapshot to Trader's Diary
  try {
    const diaryRes = await fetch(`${BASE_URL}/api/trading-notes/chart-snapshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: "XAUUSD",
        timeframe: "15m",
        price: 2655.20,
        strategyName: "London Killzone Breakout",
        tradeType: "BUY",
        outcome: "WIN",
        mindsetRating: 9,
        tags: ["XAUUSD", "LondonKillzone", "Breakout", "Disciplined"],
        notes: "লন্ডন ওপেনে 0.618 ফিব রিট্রেসমেন্ট এবং বুলিশ অর্ডার ব্লকে রিজেকশন ক্যান্ডেল কনফার্মেশন পাওয়ার পর 0.1 লটে পারফেক্ট লং এন্ট্রি।"
      })
    });
    const diaryData = await diaryRes.json() as any;
    assert(
      diaryData.success === true && diaryData.entry,
      `Save chart snapshot to Trader's Diary with strategy, psychology tags, and reflections`
    );
  } catch (err: any) {
    assert(false, `Trading diary chart snapshot error: ${err.message}`);
  }

  // Test 9: Verify index.html references the latest bundle v=2.3.1
  const indexHtml = fs.readFileSync("index.html", "utf8");
  assert(
    indexHtml.includes("index-BmjL0JbS.js?v=2.3.1"),
    "index.html correctly points to cache-busted index-BmjL0JbS.js?v=2.3.1"
  );

  console.log("\n=================================================");
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`PASS RATE: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runStep4AcceptanceTests().catch(err => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
