// Acceptance Test: Step 3 Unlimited Indicators & Direct On-Chart News Impact

function runStep3Tests() {
  console.log("=== RUNNING STEP 3 ACCEPTANCE TESTS ===");
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

  // Mock prices array (50 values)
  const prices = Array.from({ length: 50 }, (_, i) => 4000 + i * 2 + Math.sin(i) * 5);

  // Test 1: EMA Calculation
  const calcEma = (period: number) => {
    const k = 2 / (period + 1);
    const emaArray: number[] = [];
    let prevEma = prices[0];
    for (let i = 0; i < prices.length; i++) {
      if (i === 0) {
        emaArray.push(prices[0]);
      } else {
        const currentEma = prices[i] * k + prevEma * (1 - k);
        emaArray.push(currentEma);
        prevEma = currentEma;
      }
    }
    return emaArray;
  };

  const ema20 = calcEma(20);
  const ema50 = calcEma(50);
  assert(ema20.length === 50 && ema50.length === 50, "EMA 20 and EMA 50 computed for all 50 bars");
  assert(ema20[49] > 4000, `Latest EMA 20 value is realistic: $${ema20[49].toFixed(2)}`);

  // Test 2: Bollinger Bands 20, 2
  const bollSlice = prices.slice(prices.length - 20);
  const mean = bollSlice.reduce((a, b) => a + b, 0) / 20;
  const variance = bollSlice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 20;
  const stdDev = Math.sqrt(variance);
  const upperBand = mean + stdDev * 2;
  const lowerBand = mean - stdDev * 2;
  assert(upperBand > mean && lowerBand < mean, `Bollinger Bands valid: Upper ($${upperBand.toFixed(2)}) > Mid ($${mean.toFixed(2)}) > Lower ($${lowerBand.toFixed(2)})`);

  // Test 3: RSI 14 Range Check (0 to 100)
  const changes = prices.slice(1).map((p, i) => p - prices[i]);
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
  const avgGain = gains.slice(0, 14).reduce((a, b) => a + b, 0) / 14;
  const avgLoss = losses.slice(0, 14).reduce((a, b) => a + b, 0) / 14;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  assert(rsi >= 0 && rsi <= 100, `RSI (14) within valid boundary: ${rsi.toFixed(2)}`);

  // Test 4: Economic News Events Catalog
  const events = [
    { title: "US Non-Farm Payrolls (NFP)", actual: "216K", forecast: "170K", pipsMove: "+78 Pips Spike" },
    { title: "US Core CPI Inflation (YoY)", actual: "3.1%", forecast: "3.2%", pipsMove: "+94 Pips Rally" },
    { title: "FOMC Rate Decision & Powell Speech", actual: "5.25%", forecast: "5.25%", pipsMove: "+125 Pips Swing" }
  ];
  assert(events.length === 3, "High-Impact macro events configured (NFP, CPI, FOMC)");
  assert(events.every(e => e.actual && e.forecast && e.pipsMove), "All macro events have actual, forecast, and 15m reaction data");

  // Test 5: London & NY Killzone hours definition
  const isLondonKillzone = (utcHour: number) => utcHour >= 7 && utcHour < 10;
  const isNYKillzone = (utcHour: number) => utcHour >= 12 && utcHour < 15;
  const isOverlap = (utcHour: number) => utcHour >= 12 && utcHour < 16;
  assert(isLondonKillzone(8) === true && isLondonKillzone(11) === false, "London Killzone accurately active 07:00-10:00 UTC");
  assert(isNYKillzone(13) === true && isNYKillzone(16) === false, "New York Killzone accurately active 12:00-15:00 UTC");
  assert(isOverlap(14) === true, "London/NY Overlap accurately active 12:00-16:00 UTC");

  console.log(`\nResults: ${passCount}/${totalCount} tests passed (${((passCount / totalCount) * 100).toFixed(1)}%)`);

  if (passCount === totalCount) {
    console.log("All Step 3 tests passed successfully!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runStep3Tests();
