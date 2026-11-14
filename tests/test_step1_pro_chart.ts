// Acceptance Test: Step 1 Pro Chart Engine & 0-Delay Live Data Hub

import { updateRealMarketQuotes, getCachedRealQuotes } from "../src/services/realMarketFeedService.ts";

async function runStep1Tests() {
  console.log("=== RUNNING STEP 1 ACCEPTANCE TESTS ===");
  let passCount = 0;
  let totalCount = 0;

  const assert = (condition: boolean, msg: string) => {
    totalCount++;
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${msg}`);
    }
  };

  // Test 1: Real Market Quotes contains supported assets
  const quotes = await updateRealMarketQuotes();
  assert(Array.isArray(quotes) && quotes.length >= 5, "Live quotes list contains at least 5 instruments");

  const symbols = quotes.map(q => q.symbol);
  assert(symbols.some(s => s.includes("XAU")), "Gold Spot (XAU/USD) is present in live feed");
  assert(symbols.some(s => s.includes("EUR")), "EUR/USD is present in live feed");
  assert(symbols.some(s => s.includes("GBP")), "GBP/USD is present in live feed");
  assert(symbols.some(s => s.includes("BTC")), "BTC/USD is present in live feed");
  assert(symbols.some(s => s.includes("US30")), "US30 (Dow Jones 30) is present in live feed");

  // Test 2: Spot Gold price is realistic (> $2000)
  const gold = quotes.find(q => q.symbol.includes("XAU"));
  assert(!!gold && gold.bid > 2000, `Gold spot price is valid and realistic: $${gold?.bid}`);

  // Test 3: BTC price is realistic (> $50000)
  const btc = quotes.find(q => q.symbol.includes("BTC"));
  assert(!!btc && btc.bid > 50000, `BTC/USD spot price is valid: $${btc?.bid}`);

  // Test 4: US30 price is realistic (> $30000)
  const us30 = quotes.find(q => q.symbol.includes("US30"));
  assert(!!us30 && us30.bid > 30000, `US30 index price is valid: ${us30?.bid}`);

  // Test 5: Spreads and 0-delay flags
  assert(gold !== undefined && gold.spread > 0 && gold.isRealMarket === true, "Gold has positive spread and real market flag");
  assert(btc !== undefined && btc.spread > 0, "BTC has active spread");

  console.log(`\nResults: ${passCount}/${totalCount} tests passed (${((passCount / totalCount) * 100).toFixed(1)}%)`);

  if (passCount === totalCount) {
    console.log("All Step 1 tests passed successfully!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runStep1Tests();
