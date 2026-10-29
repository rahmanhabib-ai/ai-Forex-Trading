// Capital Growth & Compound Portfolio Architecture Component
// Built for Forex AI News V2.2 Enterprise Engine

function CapitalGrowthPage({ page, section, portalType, onOpenCodeStudio }) {
  const { currentUser: user, language: lang } = Xo();
  const s = (bn, en) => (lang === "bn" ? bn : en);

  // Active sub-tab
  const [activeTab, setActiveTab] = b.useState("calculator"); // "roadmap" | "calculator" | "psychology" | "checklist" | "milestones"

  // Calculator Parameters
  const [startingCapital, setStartingCapital] = b.useState(100);
  const [targetGoal, setTargetGoal] = b.useState(10000);
  const [instrument, setInstrument] = b.useState("XAUUSD"); // XAUUSD, EURUSD, GBPUSD, USDJPY, BTCUSD
  const [riskPercent, setRiskPercent] = b.useState(1.5);
  const [stopLossPips, setStopLossPips] = b.useState(30);
  const [rewardRatio, setRewardRatio] = b.useState(2.0); // 1:2
  const [winRate, setWinRate] = b.useState(60); // 60%
  const [tradesPerDay, setTradesPerDay] = b.useState(2);
  const [durationMonths, setDurationMonths] = b.useState(6);

  // Real Account Tracker
  const [currentActualBalance, setCurrentActualBalance] = b.useState(() => {
    try {
      const saved = localStorage.getItem("capital_growth_actual_balance");
      return saved ? parseFloat(saved) : 100;
    } catch (e) {
      return 100;
    }
  });

  const saveActualBalance = (val) => {
    setCurrentActualBalance(val);
    try {
      localStorage.setItem("capital_growth_actual_balance", String(val));
    } catch (e) {}
  };

  // Psychology Emotion State
  const [emotionState, setEmotionState] = b.useState("calm"); // "calm" | "greedy" | "revenge"
  const [cooldownRemaining, setCooldownRemaining] = b.useState(0);

  // Checklist State
  const [checklist, setChecklist] = b.useState({
    trend: false,
    news: false,
    slTp: false,
    lotSize: false,
    rules: false,
  });

  const toggleChecklist = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checklist).every(Boolean);

  // Cooldown timer interval
  b.useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const startCooldown = (minutes) => {
    setCooldownRemaining(minutes * 60);
  };

  // Mathematical Calculations
  // Pip value per 1.0 standard lot:
  // EURUSD/GBPUSD = $10 per pip
  // USDJPY = approx $6.7 per pip ($1000/150)
  // XAUUSD (Gold): 1 pip (0.10) = $1 per 0.1 lot, so 1 std lot (100oz) = $10 per 0.10 price move ($10/pip)
  // BTCUSD: $1 per 1 pt per 1 contract
  const pipValuePerStdLot = b.useMemo(() => {
    switch (instrument) {
      case "EURUSD":
      case "GBPUSD":
        return 10;
      case "USDJPY":
        return 6.8;
      case "XAUUSD":
        return 10;
      case "BTCUSD":
        return 1;
      default:
        return 10;
    }
  }, [instrument]);

  // Exact calculations for single trade
  const math = b.useMemo(() => {
    const riskAmount = (startingCapital * (riskPercent / 100));
    const slPips = Math.max(stopLossPips, 5);
    // Lot Size = Risk Amount / (SL Pips * Pip Value per Standard Lot)
    let rawLot = riskAmount / (slPips * pipValuePerStdLot);
    // Minimum micro lot is 0.01
    let recommendedLot = Math.max(0.01, Math.round(rawLot * 100) / 100);
    // If capital is tiny ($50 or below) and lot is 0.01, exact risk might exceed slightly
    const actualRiskWithLot = Math.round(recommendedLot * slPips * pipValuePerStdLot * 100) / 100;
    const tpPips = Math.round(slPips * rewardRatio);
    const profitPerWin = Math.round(recommendedLot * tpPips * pipValuePerStdLot * 100) / 100;
    const maxDailyLoss = Math.round(riskAmount * 2 * 100) / 100; // 2 losses = circuit breaker

    // Projection calculation: Month by month compounding
    // 20 trading days per month
    const tradingDaysPerMonth = 20;
    const totalTradesPerMonth = tradingDaysPerMonth * tradesPerDay;
    const winCount = Math.round(totalTradesPerMonth * (winRate / 100));
    const lossCount = totalTradesPerMonth - winCount;

    // Monthly compounding simulation
    let balance = startingCapital;
    const monthProjections = [];

    for (let m = 1; m <= Math.min(durationMonths, 12); m++) {
      const monthStart = balance;
      let monthProfit = 0;
      let curMonthLot = 0.01;

      for (let t = 0; t < totalTradesPerMonth; t++) {
        const curRisk = balance * (riskPercent / 100);
        curMonthLot = Math.max(0.01, Math.round((curRisk / (slPips * pipValuePerStdLot)) * 100) / 100);
        const win = Math.random() < (winRate / 100); // Or deterministic ratio:
        // For deterministic monthly curve:
        const isWin = t < winCount;
        if (isWin) {
          balance += curMonthLot * tpPips * pipValuePerStdLot;
        } else {
          balance = Math.max(10, balance - curMonthLot * slPips * pipValuePerStdLot);
        }
      }

      monthProfit = Math.round((balance - monthStart) * 100) / 100;
      const growthRate = monthStart > 0 ? Math.round(((balance - monthStart) / monthStart) * 100) : 0;

      // Phase identification
      let phaseName = s("সারভাইভাল ফেজ", "Survival Phase");
      let phaseColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      if (balance >= 10000) {
        phaseName = s("ইনস্টিটিউশনাল এক্সপোজার", "Institutional");
        phaseColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";
      } else if (balance >= 1000) {
        phaseName = s("অ্যাক্সিলারেশন ফেজ", "Acceleration");
        phaseColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
      }

      monthProjections.push({
        month: m,
        startBalance: Math.round(monthStart),
        endBalance: Math.round(balance),
        netProfit: monthProfit,
        growthRate,
        lotSize: curMonthLot,
        phaseName,
        phaseColor,
      });
    }

    return {
      riskAmount: Math.round(riskAmount * 100) / 100,
      recommendedLot,
      actualRiskWithLot,
      tpPips,
      profitPerWin,
      maxDailyLoss,
      finalProjectedBalance: Math.round(balance),
      monthProjections,
    };
  }, [startingCapital, riskPercent, stopLossPips, pipValuePerStdLot, rewardRatio, winRate, tradesPerDay, durationMonths, s]);

  // Current Phase based on Actual Balance
  const currentPhase = b.useMemo(() => {
    if (currentActualBalance >= 10000) {
      return {
        id: "institutional",
        name: s("ইনস্টিটিউশনাল এক্সপোজার ফেজ (Institutional Phase)", "Institutional Exposure Phase"),
        tag: s("লেভেল ৩: প্রাতিষ্ঠানিক ফান্ড ও প্রপ ফার্ম ডিরেক্টরি", "Level 3: Prop Firm & Institutional"),
        color: "purple",
        badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        progress: 100,
        nextTarget: 100000,
        desc: s(
          "আপনি এখন বৃহৎ মূলধন ব্যবস্থাপনার ধাপে আছেন। এখানে সর্বোচ্চ ঝুঁকি ১% বা ০.৫%, কনজারভেটিভ ট্রেডিং ও পেআউট প্রাধান্য পায়।",
          "You are now at institutional scale. Focus on strict 0.5-1% risk, funded prop compliance, and consistent bi-weekly payouts."
        ),
      };
    } else if (currentActualBalance >= 1000) {
      return {
        id: "acceleration",
        name: s("অ্যাক্সিলারেশন ফেজ (Acceleration Phase)", "Acceleration Compounding Phase"),
        tag: s("লেভেল ২: অ্যাকাউন্ট স্কেলিং ও কম্পাউন্ডিং মোড", "Level 2: Compounding & Account Scaling"),
        color: "blue",
        badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        progress: Math.min(100, Math.round(((currentActualBalance - 1000) / 9000) * 100)),
        nextTarget: 10000,
        desc: s(
          "আপনার ব্যালেন্স এখন সারভাইভাল জোন পার করেছে। লাভকৃত প্রফিট থেকে নিয়ন্ত্রিতভাবে লট সাইজ বাড়িয়ে দ্রুত মূলধন বাড়ানোর সময়।",
          "Your account has cleared survival zone. Systematically increase lots using accumulated profits while locking 50% gains in reserve."
        ),
      };
    } else {
      return {
        id: "survival",
        name: s("সারভাইভাল ফেজ (Survival Phase)", "Survival & Capital Preservation Phase"),
        tag: s("লেভেল ১: ক্যাপিটাল সুরক্ষা ও ডিসিপ্লিন", "Level 1: Capital Preservation & Discipline"),
        color: "emerald",
        badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        progress: Math.min(100, Math.round((currentActualBalance / 1000) * 100)),
        nextTarget: 1000,
        desc: s(
          "ছোট মূলধন রক্ষার সবচেয়ে সংবেদনশীল পর্যায়। কোনো প্রকার ওভারট্রেডিং বা অতিরিক্ত লট ব্যবহার সম্পূর্ণ নিষিদ্ধ। মূলধন টিকিয়ে রাখাই প্রধান জয়।",
          "The most critical survival zone. Strictly preserve capital with 0.01 lots, never overtrade, and survive the first 90 days."
        ),
      };
    }
  }, [currentActualBalance, s]);

  // Quick Preset Presets
  const applyPreset = (presetType) => {
    switch (presetType) {
      case "micro_10":
        setStartingCapital(10);
        setRiskPercent(2.0);
        setStopLossPips(20);
        setRewardRatio(2.0);
        setInstrument("EURUSD");
        break;
      case "challenge_100":
        setStartingCapital(100);
        setRiskPercent(1.5);
        setStopLossPips(25);
        setRewardRatio(2.5);
        setInstrument("XAUUSD");
        break;
      case "scale_500":
        setStartingCapital(500);
        setRiskPercent(1.0);
        setStopLossPips(30);
        setRewardRatio(2.0);
        setInstrument("XAUUSD");
        break;
      case "prop_5000":
        setStartingCapital(5000);
        setRiskPercent(0.75);
        setStopLossPips(30);
        setRewardRatio(2.0);
        setInstrument("GBPUSD");
        break;
      default:
        break;
    }
  };

  return r.jsxs("div", {
    className: "max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 text-slate-100 font-sans",
    children: [
      // 1. Header Banner
      r.jsxs("div", {
        className: "relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-indigo-950/30",
        children: [
          // Background Glow
          r.jsx("div", { className: "absolute -right-10 -top-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" }),
          r.jsx("div", { className: "absolute right-1/3 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" }),

          r.jsxs("div", {
            className: "relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6",
            children: [
              r.jsxs("div", {
                className: "space-y-2 max-w-2xl",
                children: [
                  r.jsxs("div", {
                    className: "flex flex-wrap items-center gap-2",
                    children: [
                      r.jsxs("span", {
                        className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
                        children: [
                          r.jsx(iu("TrendingUp"), { className: "w-3.5 h-3.5 text-indigo-400" }),
                          s("ক্যাপিটাল গ্রোথ আর্কিটেকচার", "Capital Growth Architecture"),
                        ],
                      }),
                      r.jsxs("span", {
                        className: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${currentPhase.badgeBg}`,
                        children: [
                          r.jsx(iu("Shield"), { className: "w-3.5 h-3.5" }),
                          currentPhase.tag,
                        ],
                      }),
                    ],
                  }),
                  r.jsx("h1", {
                    className: "text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight",
                    children: s(
                      "ক্যাপিটাল গ্রোথ ও কম্পাউন্ডিং রোডম্যাপ",
                      "Capital Growth & Compounding Engine"
                    ),
                  }),
                  r.jsx("p", {
                    className: "text-xs sm:text-sm text-slate-300 leading-relaxed",
                    children: s(
                      "ছোট মূলধন ($১০ - $১০০) থেকে প্রাতিষ্ঠানিক ফান্ডে রূপান্তরের ৩-ফেজ গাণিতিক মডেল, লট সাইজ রুলস ও সাইকোলজিক্যাল সার্কিট ব্রেকার।",
                      "Institutional 3-phase mathematical scaling roadmap, precise lot size calculations, and psychological circuit breakers from micro deposits to prop-firm scale."
                    ),
                  }),
                ],
              }),

              // Quick Account Health & Actual Balance Widget
              r.jsxs("div", {
                className: "bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3 min-w-[280px] shadow-inner",
                children: [
                  r.jsxs("div", {
                    className: "flex items-center justify-between text-xs",
                    children: [
                      r.jsx("span", { className: "text-slate-400 font-medium", children: s("আপনার বর্তমান রিয়েল ইকুইটি:", "Your Current Actual Equity:") }),
                      r.jsxs("span", { className: "font-mono font-bold text-emerald-400", children: ["$", currentActualBalance.toFixed(2)] }),
                    ],
                  }),
                  r.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [
                      r.jsx("span", { className: "text-xs text-slate-500 font-mono", children: "$" }),
                      r.jsx("input", {
                        type: "number",
                        min: "1",
                        step: "10",
                        value: currentActualBalance,
                        onChange: (e) => saveActualBalance(parseFloat(e.target.value) || 0),
                        className: "flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-indigo-500",
                        placeholder: "100.00",
                      }),
                    ],
                  }),
                  // Progress to Next Level
                  r.jsxs("div", {
                    className: "space-y-1",
                    children: [
                      r.jsxs("div", {
                        className: "flex justify-between text-[11px] text-slate-400",
                        children: [
                          r.jsx("span", { children: s("পরবর্তী ফেজ টার্গেট:", "Next Milestone Target:") }),
                          r.jsxs("span", { className: "font-bold text-indigo-300", children: ["$", currentPhase.nextTarget.toLocaleString()] }),
                        ],
                      }),
                      r.jsx("div", {
                        className: "w-full h-2 bg-slate-800 rounded-full overflow-hidden",
                        children: r.jsx("div", {
                          className: "h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500",
                          style: { width: `${currentPhase.progress}%` },
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Navigation Tabs
          r.jsxs("div", {
            className: "mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2 sm:gap-3",
            children: [
              [
                { id: "calculator", labelBn: "🧮 গ্রোথ ক্যালকুলেটর ও লট সাইজ", labelEn: "🧮 Growth & Lot Calculator" },
                { id: "roadmap", labelBn: "🗺️ ৩-ফেজ ট্রেডিং রোডম্যাপ", labelEn: "🗺️ 3-Phase Roadmap" },
                { id: "psychology", labelBn: "🧠 সাইকোলজি ও সার্কিট ব্রেকার", labelEn: "🧠 Psychology & Circuit Breaker" },
                { id: "checklist", labelBn: "✅ এক্সিকিউশন চেকলিস্ট", labelEn: "✅ Pre-Trade Checklist" },
                { id: "milestones", labelBn: "🏆 মাইলস্টোন ও সার্টিফিকেট", labelEn: "🏆 Milestones & Rules" },
              ].map((tab) =>
                r.jsx(
                  "button",
                  {
                    key: tab.id,
                    onClick: () => setActiveTab(tab.id),
                    className: `px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]"
                        : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`,
                    children: s(tab.labelBn, tab.labelEn),
                  }
                )
              ),
            ],
          }),
        ],
      }),

      // TAB 1: CALCULATOR & LOT ENGINE
      activeTab === "calculator" &&
        r.jsxs("div", {
          className: "grid grid-cols-1 lg:grid-cols-12 gap-6",
          children: [
            // Left Column: Parameters Form
            r.jsxs("div", {
              className: "lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl",
              children: [
                r.jsxs("div", {
                  className: "flex items-center justify-between pb-3 border-b border-slate-800",
                  children: [
                    r.jsxs("div", {
                      className: "flex items-center gap-2",
                      children: [
                        r.jsx(iu("Sliders"), { className: "w-5 h-5 text-indigo-400" }),
                        r.jsx("h3", { className: "text-base font-bold text-white", children: s("ইনপুট ও প্যারামিটার", "Trading Parameters") }),
                      ],
                    }),
                    r.jsx("span", { className: "text-xs text-indigo-400 font-mono", children: "Auto-Calculated" }),
                  ],
                }),

                // Quick Presets Buttons
                r.jsxs("div", {
                  className: "space-y-1.5",
                  children: [
                    r.jsx("label", { className: "text-xs font-semibold text-slate-400", children: s("কুইক প্ল্যান প্রি-সেট:", "Quick Blueprint Presets:") }),
                    r.jsxs("div", {
                      className: "grid grid-cols-2 gap-2 text-xs",
                      children: [
                        r.jsx("button", {
                          onClick: () => applyPreset("micro_10"),
                          className: "p-2 rounded-xl bg-slate-800 hover:bg-indigo-950/50 border border-slate-700 text-left text-slate-200 transition cursor-pointer",
                          children: s("$১০ মাইক্রো স্টার্ট", "$10 Micro Seed"),
                        }),
                        r.jsx("button", {
                          onClick: () => applyPreset("challenge_100"),
                          className: "p-2 rounded-xl bg-slate-800 hover:bg-indigo-950/50 border border-slate-700 text-left text-indigo-300 font-bold transition cursor-pointer",
                          children: s("$১০০ -> $১০,০০০ রোডম্যাপ", "$100 -> $10k Blueprint"),
                        }),
                        r.jsx("button", {
                          onClick: () => applyPreset("scale_500"),
                          className: "p-2 rounded-xl bg-slate-800 hover:bg-indigo-950/50 border border-slate-700 text-left text-slate-200 transition cursor-pointer",
                          children: s("$৫০০ গ্রোথ মডেল", "$500 Standard Scaling"),
                        }),
                        r.jsx("button", {
                          onClick: () => applyPreset("prop_5000"),
                          className: "p-2 rounded-xl bg-slate-800 hover:bg-indigo-950/50 border border-slate-700 text-left text-purple-300 font-bold transition cursor-pointer",
                          children: s("$৫,০০০ প্রপ ফার্ম চ্যালেঞ্জ", "$5,000 Prop Challenge"),
                        }),
                      ],
                    }),
                  ],
                }),

                // Starting Capital Input
                r.jsxs("div", {
                  className: "space-y-1.5",
                  children: [
                    r.jsxs("div", {
                      className: "flex justify-between text-xs",
                      children: [
                        r.jsx("span", { className: "font-semibold text-slate-300", children: s("শুরু করার মূলধন (Starting Capital)", "Starting Capital ($ USD):") }),
                        r.jsxs("span", { className: "font-mono font-bold text-emerald-400", children: ["$", startingCapital.toLocaleString()] }),
                      ],
                    }),
                    r.jsx("input", {
                      type: "range",
                      min: "10",
                      max: "20000",
                      step: "10",
                      value: startingCapital,
                      onChange: (e) => setStartingCapital(Number(e.target.value)),
                      className: "w-full accent-indigo-500 cursor-pointer",
                    }),
                    r.jsxs("div", {
                      className: "flex items-center gap-2",
                      children: [
                        r.jsx("span", { className: "text-xs text-slate-500 font-mono", children: "$" }),
                        r.jsx("input", {
                          type: "number",
                          min: "5",
                          value: startingCapital,
                          onChange: (e) => setStartingCapital(Math.max(5, Number(e.target.value))),
                          className: "w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500",
                        }),
                      ],
                    }),
                  ],
                }),

                // Instrument Choice
                r.jsxs("div", {
                  className: "space-y-1.5",
                  children: [
                    r.jsx("label", { className: "text-xs font-semibold text-slate-300", children: s("ট্রেডিং ইন্সট্রুমেন্ট / অ্যাসেট", "Trading Instrument / Asset:") }),
                    r.jsx("select", {
                      value: instrument,
                      onChange: (e) => setInstrument(e.target.value),
                      className: "w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 cursor-pointer",
                      children: [
                        r.jsx("option", { value: "XAUUSD", children: "XAU/USD (Spot Gold) — $10/pip standard lot" }),
                        r.jsx("option", { value: "EURUSD", children: "EUR/USD (Major FX) — $10/pip standard lot" }),
                        r.jsx("option", { value: "GBPUSD", children: "GBP/USD (Pound/Dollar) — $10/pip standard lot" }),
                        r.jsx("option", { value: "USDJPY", children: "USD/JPY — ~$6.8/pip standard lot" }),
                        r.jsx("option", { value: "BTCUSD", children: "BTC/USD (Crypto) — $1/pt contract" }),
                      ],
                    }),
                  ],
                }),

                // Risk Percent & Stop Loss
                r.jsxs("div", {
                  className: "grid grid-cols-2 gap-3",
                  children: [
                    r.jsxs("div", {
                      className: "space-y-1.5",
                      children: [
                        r.jsxs("div", {
                          className: "flex justify-between text-xs",
                          children: [
                            r.jsx("span", { className: "font-semibold text-slate-300", children: s("রিস্ক পার ট্রেড", "Risk % / Trade") }),
                            r.jsxs("span", { className: "font-mono font-bold text-amber-400", children: [riskPercent, "%"] }),
                          ],
                        }),
                        r.jsx("select", {
                          value: riskPercent,
                          onChange: (e) => setRiskPercent(Number(e.target.value)),
                          className: "w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white cursor-pointer",
                          children: [
                            r.jsx("option", { value: 0.5, children: "0.5% (Very Safe / Prop)" }),
                            r.jsx("option", { value: 1.0, children: "1.0% (Standard Survival)" }),
                            r.jsx("option", { value: 1.5, children: "1.5% (Recommended Scaling)" }),
                            r.jsx("option", { value: 2.0, children: "2.0% (Aggressive Cap)" }),
                            r.jsx("option", { value: 3.0, children: "3.0% (High Risk Alert)" }),
                          ],
                        }),
                      ],
                    }),

                    r.jsxs("div", {
                      className: "space-y-1.5",
                      children: [
                        r.jsxs("div", {
                          className: "flex justify-between text-xs",
                          children: [
                            r.jsx("span", { className: "font-semibold text-slate-300", children: s("স্টপ লস (Pips)", "Stop Loss (Pips)") }),
                            r.jsxs("span", { className: "font-mono font-bold text-rose-400", children: [stopLossPips, "p"] }),
                          ],
                        }),
                        r.jsx("input", {
                          type: "number",
                          min: "5",
                          max: "200",
                          value: stopLossPips,
                          onChange: (e) => setStopLossPips(Math.max(5, Number(e.target.value))),
                          className: "w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500",
                        }),
                      ],
                    }),
                  ],
                }),

                // Risk to Reward & Win Rate
                r.jsxs("div", {
                  className: "grid grid-cols-2 gap-3",
                  children: [
                    r.jsxs("div", {
                      className: "space-y-1.5",
                      children: [
                        r.jsxs("div", {
                          className: "flex justify-between text-xs",
                          children: [
                            r.jsx("span", { className: "font-semibold text-slate-300", children: s("রিস্ক-টু-রিওয়ার্ড (R:R)", "Risk:Reward (R:R)") }),
                            r.jsxs("span", { className: "font-mono font-bold text-emerald-400", children: ["1:", rewardRatio] }),
                          ],
                        }),
                        r.jsx("select", {
                          value: rewardRatio,
                          onChange: (e) => setRewardRatio(Number(e.target.value)),
                          className: "w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white cursor-pointer",
                          children: [
                            r.jsx("option", { value: 1.5, children: "1 : 1.5 (Scalp Target)" }),
                            r.jsx("option", { value: 2.0, children: "1 : 2.0 (Golden Standard)" }),
                            r.jsx("option", { value: 2.5, children: "1 : 2.5 (High Yield)" }),
                            r.jsx("option", { value: 3.0, children: "1 : 3.0 (Swing Runner)" }),
                          ],
                        }),
                      ],
                    }),

                    r.jsxs("div", {
                      className: "space-y-1.5",
                      children: [
                        r.jsxs("div", {
                          className: "flex justify-between text-xs",
                          children: [
                            r.jsx("span", { className: "font-semibold text-slate-300", children: s("উইন রেট (Win Rate %)", "Expected Win %") }),
                            r.jsxs("span", { className: "font-mono font-bold text-blue-400", children: [winRate, "%"] }),
                          ],
                        }),
                        r.jsx("input", {
                          type: "range",
                          min: "40",
                          max: "80",
                          step: "5",
                          value: winRate,
                          onChange: (e) => setWinRate(Number(e.target.value)),
                          className: "w-full accent-blue-500 cursor-pointer",
                        }),
                      ],
                    }),
                  ],
                }),

                // Daily Trade Frequency & Months
                r.jsxs("div", {
                  className: "grid grid-cols-2 gap-3",
                  children: [
                    r.jsxs("div", {
                      className: "space-y-1.5",
                      children: [
                        r.jsx("label", { className: "text-xs font-semibold text-slate-300", children: s("দৈনিক ট্রেড সংখ্যা", "Trades per Day") }),
                        r.jsx("select", {
                          value: tradesPerDay,
                          onChange: (e) => setTradesPerDay(Number(e.target.value)),
                          className: "w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white cursor-pointer",
                          children: [
                            r.jsx("option", { value: 1, children: s("১ টি A+ ট্রেড/দিন", "1 A+ Trade / Day") }),
                            r.jsx("option", { value: 2, children: s("২ টি ট্রেড/দিন (স্ট্যান্ডার্ড)", "2 Trades / Day") }),
                            r.jsx("option", { value: 3, children: s("৩ টি ট্রেড/দিন (সর্বোচ্চ)", "3 Trades / Day (Max)") }),
                          ],
                        }),
                      ],
                    }),

                    r.jsxs("div", {
                      className: "space-y-1.5",
                      children: [
                        r.jsx("label", { className: "text-xs font-semibold text-slate-300", children: s("পরিকল্পনার সময়সীমা", "Projection Period") }),
                        r.jsx("select", {
                          value: durationMonths,
                          onChange: (e) => setDurationMonths(Number(e.target.value)),
                          className: "w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white cursor-pointer",
                          children: [
                            r.jsx("option", { value: 3, children: s("৩ মাস (৯০ দিন)", "3 Months (90 Days)") }),
                            r.jsx("option", { value: 6, children: s("৬ মাস (১৮০ দিন)", "6 Months") }),
                            r.jsx("option", { value: 12, children: s("১২ মাস (১ বছর)", "12 Months (1 Year)") }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            // Right Column: Output Summary & Lot Matrix
            r.jsxs("div", {
              className: "lg:col-span-7 space-y-5",
              children: [
                // Highlight Result Cards
                r.jsxs("div", {
                  className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
                  children: [
                    r.jsxs("div", {
                      className: "bg-slate-900 border border-indigo-500/30 p-3.5 rounded-2xl flex flex-col justify-between shadow-lg",
                      children: [
                        r.jsx("span", { className: "text-[11px] font-medium text-slate-400", children: s("নির্দিষ্ট লট সাইজ", "Exact Lot Size") }),
                        r.jsxs("div", { className: "text-xl sm:text-2xl font-black font-mono text-indigo-400 mt-1", children: [math.recommendedLot, " ", r.jsx("span", { className: "text-xs font-sans text-slate-400", children: "Lot" })] }),
                        r.jsx("span", { className: "text-[10px] text-indigo-300/80 mt-1", children: s("স্টপ লস ফর্মুলা ভিত্তিক", "SL Math Protected") }),
                      ],
                    }),

                    r.jsxs("div", {
                      className: "bg-slate-900 border border-rose-500/30 p-3.5 rounded-2xl flex flex-col justify-between shadow-lg",
                      children: [
                        r.jsx("span", { className: "text-[11px] font-medium text-slate-400", children: s("ট্রেড প্রতি সর্বোচ্চ ঝুঁকি", "Risk per Trade") }),
                        r.jsxs("div", { className: "text-xl sm:text-2xl font-black font-mono text-rose-400 mt-1", children: ["$", math.actualRiskWithLot] }),
                        r.jsxs("span", { className: "text-[10px] text-rose-300/80 mt-1", children: ["-", stopLossPips, " pips SL"] }),
                      ],
                    }),

                    r.jsxs("div", {
                      className: "bg-slate-900 border border-emerald-500/30 p-3.5 rounded-2xl flex flex-col justify-between shadow-lg",
                      children: [
                        r.jsx("span", { className: "text-[11px] font-medium text-slate-400", children: s("উইন প্রতি টার্গেট লাভ", "Profit per Win") }),
                        r.jsxs("div", { className: "text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1", children: ["$", math.profitPerWin] }),
                        r.jsxs("span", { className: "text-[10px] text-emerald-300/80 mt-1", children: ["+", math.tpPips, " pips TP"] }),
                      ],
                    }),

                    r.jsxs("div", {
                      className: "bg-slate-900 border border-amber-500/30 p-3.5 rounded-2xl flex flex-col justify-between shadow-lg",
                      children: [
                        r.jsx("span", { className: "text-[11px] font-medium text-slate-400", children: s("দৈনিক লস সার্কিট ব্রেকার", "Daily Loss Breaker") }),
                        r.jsxs("div", { className: "text-xl sm:text-2xl font-black font-mono text-amber-400 mt-1", children: ["$", math.maxDailyLoss] }),
                        r.jsx("span", { className: "text-[10px] text-amber-300/80 mt-1", children: s("২ লসের পর ট্রেডিং বন্ধ!", "Stop after 2 losses") }),
                      ],
                    }),
                  ],
                }),

                // Compound Projection Table
                r.jsxs("div", {
                  className: "bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4",
                  children: [
                    r.jsxs("div", {
                      className: "flex items-center justify-between pb-3 border-b border-slate-800",
                      children: [
                        r.jsxs("div", {
                          className: "flex items-center gap-2",
                          children: [
                            r.jsx(iu("TrendingUp"), { className: "w-5 h-5 text-emerald-400" }),
                            r.jsx("h3", {
                              className: "text-base font-bold text-white",
                              children: s("মাসিক কম্পাউন্ডিং গ্রোথ ট্রাজেক্টোরি", "Monthly Compounding Trajectory"),
                            }),
                          ],
                        }),
                        r.jsxs("div", {
                          className: "text-right",
                          children: [
                            r.jsx("span", { className: "text-[10px] text-slate-400 block", children: s("প্রত্যাশিত ব্যালেন্স:", "Projected Final Balance:") }),
                            r.jsxs("span", { className: "text-sm sm:text-base font-mono font-black text-emerald-400", children: ["$", math.finalProjectedBalance.toLocaleString()] }),
                          ],
                        }),
                      ],
                    }),

                    // Scrollable Table
                    r.jsx("div", {
                      className: "overflow-x-auto",
                      children: r.jsxs("table", {
                        className: "w-full text-left text-xs border-collapse min-w-[500px]",
                        children: [
                          r.jsx("thead", {
                            className: "bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]",
                            children: r.jsxs("tr", {
                              children: [
                                r.jsx("th", { className: "py-2.5 px-3", children: s("মাস", "Month") }),
                                r.jsx("th", { className: "py-2.5 px-3", children: s("শুরুর ব্যালেন্স", "Start Equity") }),
                                r.jsx("th", { className: "py-2.5 px-3", children: s("লট সাইজ", "Lot Size") }),
                                r.jsx("th", { className: "py-2.5 px-3", children: s("টার্গেট লাভ ($)", "Net Profit") }),
                                r.jsx("th", { className: "py-2.5 px-3", children: s("শেষের ব্যালেন্স", "End Equity") }),
                                r.jsx("th", { className: "py-2.5 px-3", children: s("ফেজ স্ট্যাটাস", "Phase") }),
                              ],
                            }),
                          }),
                          r.jsx("tbody", {
                            className: "divide-y divide-slate-800/60 font-mono text-slate-200",
                            children: math.monthProjections.map((p) =>
                              r.jsxs(
                                "tr",
                                {
                                  key: p.month,
                                  className: "hover:bg-slate-800/40 transition-colors",
                                  children: [
                                    r.jsxs("td", { className: "py-2.5 px-3 font-sans font-bold text-white", children: [s("মাস ", "M"), p.month] }),
                                    r.jsxs("td", { className: "py-2.5 px-3 text-slate-400", children: ["$", p.startBalance.toLocaleString()] }),
                                    r.jsxs("td", { className: "py-2.5 px-3 font-bold text-indigo-400", children: [p.lotSize, " Lot"] }),
                                    r.jsxs("td", { className: "py-2.5 px-3 text-emerald-400 font-bold", children: ["+$", p.netProfit.toLocaleString(), " (", p.growthRate, "%)"] }),
                                    r.jsxs("td", { className: "py-2.5 px-3 text-white font-black", children: ["$", p.endBalance.toLocaleString()] }),
                                    r.jsx("td", {
                                      className: "py-2.5 px-3 font-sans",
                                      children: r.jsx("span", {
                                        className: `px-2 py-0.5 rounded-full text-[10px] font-bold border ${p.phaseColor}`,
                                        children: p.phaseName,
                                      }),
                                    }),
                                  ],
                                }
                              )
                            ),
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

      // TAB 2: THREE-PHASE DETAILED ROADMAP
      activeTab === "roadmap" &&
        r.jsxs("div", {
          className: "space-y-6",
          children: [
            // Phase 1 Card: Survival Phase
            r.jsxs("div", {
              className: "bg-slate-900 border border-emerald-500/30 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4 relative overflow-hidden",
              children: [
                r.jsx("div", { className: "absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase px-4 py-1 rounded-bl-xl tracking-wider", children: s("লেভেল ১ — আবশ্যক প্রথম ৯০ দিন", "Level 1 — Essential First 90 Days") }),
                r.jsxs("div", {
                  className: "flex items-start gap-4",
                  children: [
                    r.jsx("div", { className: "w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0", children: r.jsx(iu("Shield"), { className: "w-6 h-6" }) }),
                    r.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        r.jsx("h2", { className: "text-lg sm:text-xl font-black text-white", children: s("সারভাইভাল ফেজ (Survival Phase — $১০ থেকে $১,০০০)", "Survival Phase ($10 to $1,000)") }),
                        r.jsx("p", {
                          className: "text-xs sm:text-sm text-slate-300 leading-relaxed",
                          children: s(
                            "এই ফেজের একমাত্র উদ্দেশ্য: ব্যালেন্স জিরো হওয়া থেকে নিজেকে রক্ষা করা। ৯০% ট্রেডার এখানে অতিরিক্ত লট ও লোভের কারণে ঝরে পড়ে। টিকে থাকাটাই আপনার প্রথম বিজয়।",
                            "The sole purpose of this phase is capital defense. 90% of beginners blow up here due to greed and oversized lots. Survival is your first victory."
                          ),
                        }),
                      ],
                    }),
                  ],
                }),

                r.jsxs("div", {
                  className: "grid grid-cols-1 md:grid-cols-3 gap-3 pt-2",
                  children: [
                    r.jsxs("div", {
                      className: "bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1",
                      children: [
                        r.jsx("span", { className: "text-xs font-bold text-emerald-400 block", children: s("১. কঠোর ১% রিস্ক রুল", "1. Strict 1% Risk Rule") }),
                        r.jsx("p", { className: "text-xs text-slate-300", children: s("যেকোনো একটি ট্রেডে একাউন্টের ১% এর বেশি কখনোই হারানো যাবে না। $১০০ একাউন্টে সর্বোচ্চ $১ রিস্ক।", "Never risk more than 1% of account equity per trade. On $100, max loss is $1.") }),
                      ],
                    }),
                    r.jsxs("div", {
                      className: "bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1",
                      children: [
                        r.jsx("span", { className: "text-xs font-bold text-emerald-400 block", children: s("২. মাইক্রো লট সাইজ (0.01 Lot)", "2. Micro Lots Only (0.01)") }),
                        r.jsx("p", { className: "text-xs text-slate-300", children: s("শুধুমাত্র 0.01 লটে ট্রেড করুন। যতক্ষণ না ব্যালেন্স $১,০০০ ছোঁয়, ততক্ষণ বড় লট ওপেন করা নিষিদ্ধ।", "Trade exclusively with 0.01 lots until your equity surpasses $1,000.") }),
                      ],
                    }),
                    r.jsxs("div", {
                      className: "bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1",
                      children: [
                        r.jsx("span", { className: "text-xs font-bold text-emerald-400 block", children: s("৩. দৈনিক ২ লস সার্কিট ব্রেকার", "3. Daily 2-Loss Breaker") }),
                        r.jsx("p", { className: "text-xs text-slate-300", children: s("যদি দিনে পরপর ২টি ট্রেডে স্টপ লস হিট করে, ওই দিন চার্ট বন্ধ! কোনো রিভেঞ্জ ট্রেড নয়।", "If 2 consecutive trades hit stop loss in a day, immediately shut down the charts.") }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            // Phase 2 Card: Acceleration Phase
            r.jsxs("div", {
              className: "bg-slate-900 border border-blue-500/30 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4 relative overflow-hidden",
              children: [
                r.jsx("div", { className: "absolute top-0 right-0 bg-blue-500 text-slate-950 font-black text-[10px] uppercase px-4 py-1 rounded-bl-xl tracking-wider", children: s("লেভেল ২ — অ্যাকাউন্ট স্কেলিং", "Level 2 — Compounding Mode") }),
                r.jsxs("div", {
                  className: "flex items-start gap-4",
                  children: [
                    r.jsx("div", { className: "w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0", children: r.jsx(iu("Zap"), { className: "w-6 h-6" }) }),
                    r.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        r.jsx("h2", { className: "text-lg sm:text-xl font-black text-white", children: s("অ্যাক্সিলারেশন ফেজ (Acceleration Phase — $১,০০০ থেকে $১০,০০০)", "Acceleration Phase ($1,000 to $10,000)") }),
                        r.jsx("p", {
                          className: "text-xs sm:text-sm text-slate-300 leading-relaxed",
                          children: s(
                            "এই ফেজে ট্রেডার তার লাভকৃত প্রফিট থেকে নিয়ন্ত্রিতভাবে পজিশন সাইজ বাড়ায় এবং অ্যাকাউন্ট কম্পাউন্ড করে। মূলধনের ৫০% প্রফিট আলাদা রিজার্ভে লক রাখা হয়।",
                            "Here the trader systematically steps up lot sizes using accumulated profit buffer. 50% of gains are locked in reserve while 50% compounds."
                          ),
                        }),
                      ],
                    }),
                  ],
                }),

                r.jsxs("div", {
                  className: "grid grid-cols-1 md:grid-cols-3 gap-3 pt-2",
                  children: [
                    r.jsxs("div", {
                      className: "bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1",
                      children: [
                        r.jsx("span", { className: "text-xs font-bold text-blue-400 block", children: s("১. নিয়ন্ত্রিত প্রফিট কম্পাউন্ডিং", "1. Controlled Profit Compounding") }),
                        r.jsx("p", { className: "text-xs text-slate-300", children: s("প্রতি $৫০০ নেট বৃদ্ধিতে লট সাইজ ০.০১ করে বাড়ান। যেমন $১,৫০০ ইকুইটিতে ০.০৩ লট।", "Increase lot size by 0.01 per $500 gained. E.g., at $1,500 use 0.03 lots.") }),
                      ],
                    }),
                    r.jsxs("div", {
                      className: "bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1",
                      children: [
                        r.jsx("span", { className: "text-xs font-bold text-blue-400 block", children: s("২. স্প্লিট টেক-প্রফিট (TP1 & TP2)", "2. Split TP Strategy") }),
                        r.jsx("p", { className: "text-xs text-slate-300", children: s("1:1.5 পৌঁছালে ৫০% প্রফিট ক্লোজ করুন এবং স্টপ লস ব্রেক-ইভেনে নিয়ে আসুন। বাকি ৫০% 1:3 রানার।", "Close 50% position at 1:1.5 and move SL to entry break-even. Let 50% run to 1:3.") }),
                      ],
                    }),
                    r.jsxs("div", {
                      className: "bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1",
                      children: [
                        r.jsx("span", { className: "text-xs font-bold text-blue-400 block", children: s("৩. লন্ডন ও এনওয়াই সেশন ফোকাস", "3. London & NY Session Focus") }),
                        r.jsx("p", { className: "text-xs text-slate-300", children: s("শুধুমাত্র লন্ডন ওপেন (দুপুর ১:০০ - বিকেল ৪:০০) ও নিউ ইয়র্ক সেশনের হাই ভলিউম আওয়ারে ট্রেড।", "Trade exclusively during peak liquidity: London open & NY morning overlap.") }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            // Phase 3 Card: Institutional Exposure
            r.jsxs("div", {
              className: "bg-slate-900 border border-purple-500/30 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4 relative overflow-hidden",
              children: [
                r.jsx("div", { className: "absolute top-0 right-0 bg-purple-500 text-slate-950 font-black text-[10px] uppercase px-4 py-1 rounded-bl-xl tracking-wider", children: s("লেভেল ৩ — ইনস্টিটিউশনাল এক্সিলেন্স", "Level 3 — Institutional Prop Scale") }),
                r.jsxs("div", {
                  className: "flex items-start gap-4",
                  children: [
                    r.jsx("div", { className: "w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0", children: r.jsx(iu("Award"), { className: "w-6 h-6" }) }),
                    r.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        r.jsx("h2", { className: "text-lg sm:text-xl font-black text-white", children: s("ইনস্টিটিউশনাল এক্সপোজার ফেজ (Institutional Phase — $১০,০০০ থেকে $১০০,০০০+)", "Institutional Exposure Phase ($10k to $100k+)") }),
                        r.jsx("p", {
                          className: "text-xs sm:text-sm text-slate-300 leading-relaxed",
                          children: s(
                            "এই ফেজে ট্রেডার ব্যক্তিগত বা প্রপ ফার্মের (FundedNext/FTMO) বৃহৎ ফান্ড পরিচালনা করেন। এখানে ঝুঁকি ০.৫% বা ১.০% এ নামিয়ে নিয়মিত পেআউট তোলা হয়।",
                            "Managing large institutional capital or prop accounts. Strictly conservative 0.5% risk per setup, ensuring zero breach of maximum trailing drawdown."
                          ),
                        }),
                      ],
                    }),
                  ],
                }),

                r.jsxs("div", {
                  className: "grid grid-cols-1 md:grid-cols-3 gap-3 pt-2",
                  children: [
                    r.jsxs("div", {
                      className: "bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1",
                      children: [
                        r.jsx("span", { className: "text-xs font-bold text-purple-400 block", children: s("১. কনজারভেটিভ ০.৫% রিস্ক", "1. Conservative 0.5% Risk") }),
                        r.jsx("p", { className: "text-xs text-slate-300", children: s("$১০০,০০০ একাউন্টে প্রতি ট্রেডে সর্বোচ্চ $৫০০ রিস্ক, যা ১০ বার ভুল হলেও মূলধনে কোনো আঘাত করে না।", "On a $100k account, max risk is $500. Even 10 consecutive losses leave capital healthy.") }),
                      ],
                    }),
                    r.jsxs("div", {
                      className: "bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1",
                      children: [
                        r.jsx("span", { className: "text-xs font-bold text-purple-400 block", children: s("২. প্রপ ফার্ম ড্রডাউন কমপ্লায়েন্স", "2. Max Drawdown Shield") }),
                        r.jsx("p", { className: "text-xs text-slate-300", children: s("দৈনিক ৫% এবং সামগ্রিক ১০% ড্রডাউন গার্ড। কখনো একসাথে একাধিক কোরিলেটেড পেয়ারে এক্সপোজার নয়।", "Daily 5% and overall 10% hard stop guards. Avoid correlated exposure across currency pairs.") }),
                      ],
                    }),
                    r.jsxs("div", {
                      className: "bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1",
                      children: [
                        r.jsx("span", { className: "text-xs font-bold text-purple-400 block", children: s("৩. পিরিয়ডিক পেআউট উইথড্রয়াল", "3. Systematic Profit Payouts") }),
                        r.jsx("p", { className: "text-xs text-slate-300", children: s("প্রতি ১৪ বা ৩০ দিনে ৮০% - ৯০% প্রফিট সরাসরি ব্যাংক বা ক্রিপ্টোতে উইথড্র করে নিরাপদ রাখা।", "Withdraw 80-90% of gains bi-weekly directly to bank/crypto to secure wealth.") }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

      // TAB 3: TRADING PSYCHOLOGY & DISCIPLINE CIRCUIT BREAKER
      activeTab === "psychology" &&
        r.jsxs("div", {
          className: "space-y-6",
          children: [
            // Daily Psychology Check-in
            r.jsxs("div", {
              className: "bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5",
              children: [
                r.jsxs("div", {
                  className: "flex items-center gap-3",
                  children: [
                    r.jsx("div", { className: "p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20", children: r.jsx(iu("Brain"), { className: "w-6 h-6" }) }),
                    r.jsxs("div", {
                      children: [
                        r.jsx("h2", { className: "text-lg sm:text-xl font-black text-white", children: s("ডেইলি সাইকোলজি ও মানসিক চেক-ইন", "Daily Psychological Check-in") }),
                        r.jsx("p", { className: "text-xs text-slate-400", children: s("ট্রেডিংয়ে ৮০% লস হয় মানসিক ভুলের জন্য। ট্রেড করার আগে নিজের অবস্থা নির্ধারণ করুন:", "80% of blown accounts stem from emotions. Diagnose your mental state before entering:") }),
                      ],
                    }),
                  ],
                }),

                r.jsxs("div", {
                  className: "grid grid-cols-1 md:grid-cols-3 gap-4",
                  children: [
                    r.jsxs("button", {
                      onClick: () => setEmotionState("calm"),
                      className: `p-5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        emotionState === "calm"
                          ? "bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-950"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`,
                      children: [
                        r.jsxs("div", {
                          className: "flex items-center justify-between",
                          children: [
                            r.jsx("span", { className: "text-2xl", children: "🟢" }),
                            r.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded", children: s("অনুমোদিত", "APPROVED") }),
                          ],
                        }),
                        r.jsxs("div", {
                          children: [
                            r.jsx("h3", { className: "text-sm font-bold text-white", children: s("শান্ত, ধৈর্যশীল ও অবজেক্টিভ", "Calm & Objective") }),
                            r.jsx("p", { className: "text-xs text-slate-400 mt-1", children: s("মন ফোকাসড। কোনো তাড়াহুড়ো নেই। প্ল্যান অনুযায়ী নির্দিষ্ট লট সাইজে ট্রেড করা যাবে।", "Clear mind, zero hurry. Full green light to execute according to plan.") }),
                          ],
                        }),
                      ],
                    }),

                    r.jsxs("button", {
                      onClick: () => setEmotionState("greedy"),
                      className: `p-5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        emotionState === "greedy"
                          ? "bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-950"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`,
                      children: [
                        r.jsxs("div", {
                          className: "flex items-center justify-between",
                          children: [
                            r.jsx("span", { className: "text-2xl", children: "🟡" }),
                            r.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded", children: s("সতর্কতা", "CAUTION") }),
                          ],
                        }),
                        r.jsxs("div", {
                          children: [
                            r.jsx("h3", { className: "text-sm font-bold text-white", children: s("উত্তেজিত বা অতিরিক্ত লোভ (FOMO)", "Excited / FOMO / Greedy") }),
                            r.jsx("p", { className: "text-xs text-slate-400 mt-1", children: s("দ্রুত বেশি লাভ করার লোভ কাজ করছে। সতর্কতা! লট সাইজ ৫০% কমিয়ে দিন।", "Greed or fear of missing out detected. Reduce lot size by 50% immediately.") }),
                          ],
                        }),
                      ],
                    }),

                    r.jsxs("button", {
                      onClick: () => {
                        setEmotionState("revenge");
                        startCooldown(60);
                      },
                      className: `p-5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        emotionState === "revenge"
                          ? "bg-rose-950/40 border-rose-500 text-white shadow-lg shadow-rose-950"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`,
                      children: [
                        r.jsxs("div", {
                          className: "flex items-center justify-between",
                          children: [
                            r.jsx("span", { className: "text-2xl", children: "🔴" }),
                            r.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded", children: s("লকড / নিষিদ্ধ", "BLOCKED") }),
                          ],
                        }),
                        r.jsxs("div", {
                          children: [
                            r.jsx("h3", { className: "text-sm font-bold text-white", children: s("রিভেঞ্জ মোড / লসে ক্ষুব্ধ", "Revenge / Frustrated") }),
                            r.jsx("p", { className: "text-xs text-slate-400 mt-1", children: s("পূর্বের লস রিকভার করার তীব্র অনুভূতি। এই অবস্থায় ট্রেড করলে অ্যাকাউন্ট ৯৯% জিরো হবে।", "Urge to recover losses immediately. Highly dangerous. Terminate trading for today.") }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),

                // Emergency Cooldown Section
                emotionState === "revenge" &&
                  r.jsxs("div", {
                    className: "bg-rose-950/60 border border-rose-700/60 p-5 rounded-2xl space-y-3",
                    children: [
                      r.jsxs("div", {
                        className: "flex items-center gap-3",
                        children: [
                          r.jsx(iu("AlertTriangle"), { className: "w-6 h-6 text-rose-400 shrink-0" }),
                          r.jsxs("div", {
                            children: [
                              r.jsx("h4", { className: "text-sm font-bold text-rose-200", children: s("জরুরি সার্কিট ব্রেকার সক্রিয় (Emergency Circuit Breaker Triggered)", "Emergency Circuit Breaker Triggered") }),
                              r.jsx("p", { className: "text-xs text-rose-300/90", children: s("অনুগ্রহ করে চার্ট বন্ধ করুন। ঠান্ডা পানি পান করুন এবং কমপক্ষে ১ ঘণ্টা কোনো মার্কেট দেখবেন না।", "Please step away from the terminal. Take a walk, breathe, and avoid looking at charts.") }),
                            ],
                          }),
                        ],
                      }),
                      r.jsxs("div", {
                        className: "flex items-center gap-4 pt-2",
                        children: [
                          r.jsxs("div", {
                            className: "px-4 py-2 bg-slate-950 rounded-xl font-mono text-lg font-black text-rose-400 border border-rose-800",
                            children: [
                              Math.floor(cooldownRemaining / 60),
                              ":",
                              (cooldownRemaining % 60).toString().padStart(2, "0"),
                            ],
                          }),
                          r.jsx("button", {
                            onClick: () => startCooldown(60),
                            className: "px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition cursor-pointer",
                            children: s("১ ঘণ্টা কুলডাউন রিস্টার্ট", "Restart 60m Cooldown"),
                          }),
                          r.jsx("button", {
                            onClick: () => {
                              setCooldownRemaining(0);
                              setEmotionState("calm");
                            },
                            className: "px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer",
                            children: s("রিসেট", "Reset"),
                          }),
                        ],
                      }),
                    ],
                  }),
              ],
            }),

            // The 5 Non-Negotiable Golden Rules
            r.jsxs("div", {
              className: "bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4",
              children: [
                r.jsxs("div", {
                  className: "flex items-center gap-3 pb-3 border-b border-slate-800",
                  children: [
                    r.jsx(iu("Compass"), { className: "w-5 h-5 text-indigo-400" }),
                    r.jsx("h3", { className: "text-base font-bold text-white", children: s("৫টি অলঙ্ঘনীয় ট্রেডিং নীতি (The 5 Non-Negotiable Rules)", "The 5 Non-Negotiable Rules") }),
                  ],
                }),

                r.jsxs("div", {
                  className: "space-y-3 text-xs sm:text-sm text-slate-300",
                  children: [
                    r.jsxs("div", {
                      className: "flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800",
                      children: [
                        r.jsx("span", { className: "font-mono font-bold text-indigo-400 shrink-0", children: "০১." }),
                        r.jsxs("div", {
                          children: [
                            r.jsx("span", { className: "font-bold text-white", children: s("নো স্টপ-লস = নো ট্রেড:", "No Stop-Loss = No Trade:") }),
                            r.jsx("span", { className: "text-slate-400 ml-1.5", children: s("স্টপ লস ছাড়া কোনো পজিশন ওপেন করা মানে জুয়া খেলা। এন্ট্রি নেওয়ার আগেই স্টপ লস ও টার্গেট নির্ধারণ বাধ্যতামূলক।", "Never enter a position without a hard stop loss set in your broker terminal.") }),
                          ],
                        }),
                      ],
                    }),

                    r.jsxs("div", {
                      className: "flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800",
                      children: [
                        r.jsx("span", { className: "font-mono font-bold text-indigo-400 shrink-0", children: "০২." }),
                        r.jsxs("div", {
                          children: [
                            r.jsx("span", { className: "font-bold text-white", children: s("স্টপ লস পেছনে সরানো কঠোরভাবে নিষিদ্ধ:", "Never Widen or Move Stop Loss Backward:") }),
                            r.jsx("span", { className: "text-slate-400 ml-1.5", children: s("ট্রেড বিপরীতে গেলে আশা করে স্টপ লস বাড়িয়ে সরানো একাউন্ট খালি করার ১ নম্বর কারণ। ভুল মানুন, ক্ষতি মেনে নিন।", "Accept being wrong. Widening your stop loss during an active drawdown is suicide.") }),
                          ],
                        }),
                      ],
                    }),

                    r.jsxs("div", {
                      className: "flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800",
                      children: [
                        r.jsx("span", { className: "font-mono font-bold text-indigo-400 shrink-0", children: "০৩." }),
                        r.jsxs("div", {
                          children: [
                            r.jsx("span", { className: "font-bold text-white", children: s("অ্যান্টি-মার্টিঙ্গেল প্রোটোকল:", "Anti-Martingale Protocol:") }),
                            r.jsx("span", { className: "text-slate-400 ml-1.5", children: s("একটি ট্রেডে লস হলে পরের ট্রেডে লট সাইজ বাড়ানো সম্পূর্ণ নিষিদ্ধ। লট সাইজ বাড়বে শুধুমাত্র মূলধন বাড়লে।", "Never double your lot size to chase a loss. Lot size only expands when equity expands.") }),
                          ],
                        }),
                      ],
                    }),

                    r.jsxs("div", {
                      className: "flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800",
                      children: [
                        r.jsx("span", { className: "font-mono font-bold text-indigo-400 shrink-0", children: "০৪." }),
                        r.jsxs("div", {
                          children: [
                            r.jsx("span", { className: "font-bold text-white", children: s("লাল ফোল্ডার হাই-ইমপ্যাক্ট নিউজ ফিল্টার:", "High-Impact Red Folder News Filter:") }),
                            r.jsx("span", { className: "text-slate-400 ml-1.5", children: s("US CPI, Nonfarm Payrolls (NFP), FOMC রেট সিদ্ধান্তের ১৫ মিনিট আগে ও পরে নতুন ট্রেড নিষিদ্ধ।", "Do not open new scalps within 15 minutes before and after Tier-1 economic releases.") }),
                          ],
                        }),
                      ],
                    }),

                    r.jsxs("div", {
                      className: "flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800",
                      children: [
                        r.jsx("span", { className: "font-mono font-bold text-indigo-400 shrink-0", children: "০৫." }),
                        r.jsxs("div", {
                          children: [
                            r.jsx("span", { className: "font-bold text-white", children: s("ট্রেড উইনিং জার্নালিং:", "Mandatory Trade Journaling:") }),
                            r.jsx("span", { className: "text-slate-400 ml-1.5", children: s("প্রতিটি ট্রেডের এন্ট্রি ও এক্সিট কারণ অ্যাপের 'Journal' পেজে স্ক্রিনশট সহ লিপিবদ্ধ করুন।", "Log every entry and exit rationale in the Trading Journal tab to refine your edge.") }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

      // TAB 4: PRE-TRADE CHECKLIST
      activeTab === "checklist" &&
        r.jsxs("div", {
          className: "bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 max-w-3xl mx-auto",
          children: [
            r.jsxs("div", {
              className: "flex items-center justify-between pb-4 border-b border-slate-800",
              children: [
                r.jsxs("div", {
                  className: "flex items-center gap-3",
                  children: [
                    r.jsx("div", { className: "p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", children: r.jsx(iu("CheckCircle"), { className: "w-6 h-6" }) }),
                    r.jsxs("div", {
                      children: [
                        r.jsx("h2", { className: "text-lg sm:text-xl font-black text-white", children: s("প্রি-ট্রেড এক্সিকিউশন চেকলিস্ট", "Pre-Trade Execution Checklist") }),
                        r.jsx("p", { className: "text-xs text-slate-400", children: s("বাই বা সেল বাটনে ক্লিক করার আগে ৫টি বক্স চেক করুন:", "Verify these 5 conditions before pressing Buy or Sell:") }),
                      ],
                    }),
                  ],
                }),
                r.jsx("button", {
                  onClick: () => setChecklist({ trend: false, news: false, slTp: false, lotSize: false, rules: false }),
                  className: "text-xs text-slate-400 hover:text-white transition cursor-pointer underline",
                  children: s("চেকলিস্ট রিসেট", "Reset"),
                }),
              ],
            }),

            r.jsxs("div", {
              className: "space-y-3",
              children: [
                [
                  { key: "trend", labelBn: "১. হায়ার টাইমফ্রেম (Daily/4H) ট্রেন্ড ও বায়াস যাচাই করেছি", labelEn: "1. Verified Higher Timeframe (Daily & 4H) Market Structure & Trend Bias" },
                  { key: "news", labelBn: "২. আগামী ৩০ মিনিটের মধ্যে কোনো হাই-ইমপ্যাক্ট নিউজ (CPI/NFP/FOMC) নেই", labelEn: "2. No High-Impact Red-Folder News Releases (CPI, NFP, Fed) within 30 minutes" },
                  { key: "slTp", labelBn: "৩. স্টপ লস ও টেক প্রফিট লেভেল চার্টে স্পষ্টভাবে চিহ্নিত এবং সেট করা আছে", labelEn: "3. Stop Loss and Take Profit levels calculated and placed in order ticket" },
                  { key: "lotSize", labelBn: "৪. লট সাইজ ক্যাপিটাল গ্রোথ ক্যালকুলেটরের রুলস অনুযায়ী সঠিক (কোনো ওভারসাইজ নয়)", labelEn: "4. Lot size strictly adheres to Capital Growth calculator (No oversized gambling)" },
                  { key: "rules", labelBn: "৫. আজকে আমার কোনো পূর্ববর্তী ২ লস হয়নি এবং মানসিক অবস্থা শান্ত ও নিয়ন্ত্রিত", labelEn: "5. No previous 2-loss breach today, and mental state is completely calm and disciplined" },
                ].map((item) =>
                  r.jsxs(
                    "div",
                    {
                      key: item.key,
                      onClick: () => toggleChecklist(item.key),
                      className: `p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                        checklist[item.key]
                          ? "bg-emerald-950/40 border-emerald-500/60 text-white"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`,
                      children: [
                        r.jsx("div", {
                          className: `w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                            checklist[item.key]
                              ? "bg-emerald-500 border-emerald-400 text-slate-950"
                              : "border-slate-600 bg-slate-900"
                          }`,
                          children: checklist[item.key] && r.jsx(iu("Check"), { className: "w-3.5 h-3.5 stroke-[3]" }),
                        }),
                        r.jsx("span", {
                          className: `text-xs sm:text-sm font-medium ${
                            checklist[item.key] ? "text-emerald-100 font-bold" : "text-slate-300"
                          }`,
                          children: s(item.labelBn, item.labelEn),
                        }),
                      ],
                    }
                  )
                ),
              ],
            }),

            // Status Banner
            r.jsx("div", {
              className: `p-4 rounded-2xl border text-center transition-all ${
                allChecked
                  ? "bg-gradient-to-r from-emerald-950 to-indigo-950 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-950/40"
                  : "bg-slate-950 border-slate-800 text-slate-400"
              }`,
              children: allChecked
                ? r.jsxs("div", {
                    className: "flex items-center justify-center gap-2",
                    children: [
                      r.jsx(iu("CheckCircle"), { className: "w-5 h-5 text-emerald-400" }),
                      r.jsx("span", {
                        className: "text-sm font-bold text-white",
                        children: s(
                          "গ্রিন সিগন্যাল! আপনার ট্রেডটি সমস্ত গাণিতিক ও ডিসিপ্লিন ফিল্টার পাস করেছে।",
                          "GREEN SIGNAL! All discipline and risk filters verified. Execute with confidence."
                        ),
                      }),
                    ],
                  })
                : r.jsx("span", {
                    className: "text-xs",
                    children: s(
                      "ট্রেড এক্সিকিউট করার আগে উপরের ৫টি শর্ত অবশ্যই পূরণ করুন।",
                      "Check all 5 requirements above before initiating any new market position."
                    ),
                  }),
            }),
          ],
        }),

      // TAB 5: MILESTONES & EXPORTABLE PLAN
      activeTab === "milestones" &&
        r.jsxs("div", {
          className: "space-y-6 max-w-4xl mx-auto",
          children: [
            // Milestones Grid
            r.jsxs("div", {
              className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
              children: [
                r.jsxs("div", {
                  className: "bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3",
                  children: [
                    r.jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [
                        r.jsx("div", { className: "w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400", children: r.jsx(iu("Shield"), { className: "w-5 h-5" }) }),
                        r.jsx("span", { className: "text-xs font-mono font-bold text-emerald-400", children: currentActualBalance >= 100 ? "UNLOCKED" : "LOCKED" }),
                      ],
                    }),
                    r.jsx("h4", { className: "text-base font-bold text-white", children: s("সারভাইভাল গার্ডিয়ান ব্যাজ (Survival Guardian)", "Survival Guardian Badge") }),
                    r.jsx("p", { className: "text-xs text-slate-400 leading-relaxed", children: s("প্রথম ৩০ দিন কোনো ড্রডাউন ব্রেক না করে একাউন্ট টিকিয়ে রাখার প্রাতিষ্ঠানিক স্বীকৃতি।", "Recognizing flawless preservation of initial deposit over the critical first 30 days.") }),
                  ],
                }),

                r.jsxs("div", {
                  className: "bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3",
                  children: [
                    r.jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [
                        r.jsx("div", { className: "w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400", children: r.jsx(iu("Zap"), { className: "w-5 h-5" }) }),
                        r.jsx("span", { className: "text-xs font-mono font-bold text-blue-400", children: currentActualBalance >= 1000 ? "UNLOCKED" : "LOCKED" }),
                      ],
                    }),
                    r.jsx("h4", { className: "text-base font-bold text-white", children: s("কম্পাউন্ডিং এক্সিলারেটর (Compounding Master)", "Compounding Master Badge") }),
                    r.jsx("p", { className: "text-xs text-slate-400 leading-relaxed", children: s("ব্যালেন্স $১,০০০ পার করে সফলভাবে ফেজ ২ এ পদার্পণ ও নিয়ন্ত্রিত স্কেলিং।", "Surpassing $1,000 equity and entering Phase 2 Account Scaling.") }),
                  ],
                }),

                r.jsxs("div", {
                  className: "bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3",
                  children: [
                    r.jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [
                        r.jsx("div", { className: "w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400", children: r.jsx(iu("Award"), { className: "w-5 h-5" }) }),
                        r.jsx("span", { className: "text-xs font-mono font-bold text-purple-400", children: currentActualBalance >= 10000 ? "UNLOCKED" : "LOCKED" }),
                      ],
                    }),
                    r.jsx("h4", { className: "text-base font-bold text-white", children: s("ইনস্টিটিউশনাল ফান্ড ম্যানেজার (Funded Desk)", "Institutional Funded Desk") }),
                    r.jsx("p", { className: "text-xs text-slate-400 leading-relaxed", children: s("$১০,০০০+ পোর্টফোলিও বা ফান্ডেড প্রপ একাউন্ট পরিচালনা ও নিয়মিত পেআউট অর্জন।", "Managing $10,000+ proprietary capital with systematic bi-weekly profit splits.") }),
                  ],
                }),

                r.jsxs("div", {
                  className: "bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3",
                  children: [
                    r.jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [
                        r.jsx("div", { className: "w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400", children: r.jsx(iu("Target"), { className: "w-5 h-5" }) }),
                        r.jsx("span", { className: "text-xs font-mono font-bold text-amber-400", children: "ACTIVE" }),
                      ],
                    }),
                    r.jsx("h4", { className: "text-base font-bold text-white", children: s("জিরো রিভেঞ্জ ট্রেড ডিসিপ্লিন (Zero Breach)", "Zero Breach Discipline") }),
                    r.jsx("p", { className: "text-xs text-slate-400 leading-relaxed", children: s("মার্টিঙ্গেল বা কোনো স্টপ-লস ছাড়া ট্রেড না করে ১০০% শৃঙ্খলা বজায় রাখা।", "Complete psychological mastery: zero revenge trades and 100% stop-loss compliance.") }),
                  ],
                }),
              ],
            }),

            // Printable Desk Cheat Sheet
            r.jsxs("div", {
              className: "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl text-slate-200",
              children: [
                r.jsxs("div", {
                  className: "flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3",
                  children: [
                    r.jsxs("div", {
                      children: [
                        r.jsx("span", { className: "text-xs uppercase tracking-widest text-indigo-400 font-bold font-mono", children: "FOREX AI NEWS V2.2 — DESK CHEAT SHEET" }),
                        r.jsx("h3", { className: "text-xl font-black text-white", children: s("আপনার ট্রেডিং ডেস্ক এক্সিকিউশন প্ল্যান", "Your Desk Execution Cheat Sheet") }),
                      ],
                    }),
                    r.jsxs("button", {
                      onClick: () => window.print(),
                      className: "px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer self-start sm:self-auto",
                      children: [
                        r.jsx(iu("Printer"), { className: "w-4 h-4" }),
                        s("প্রিন্ট / সেভ করুন", "Print / Save PDF"),
                      ],
                    }),
                  ],
                }),

                r.jsxs("div", {
                  className: "grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono",
                  children: [
                    r.jsxs("div", {
                      className: "bg-slate-950/80 p-3.5 rounded-xl border border-slate-800",
                      children: [
                        r.jsx("span", { className: "text-[10px] text-slate-400 font-sans block", children: s("বর্তমান ক্যাপিটাল", "Starting Capital") }),
                        r.jsxs("span", { className: "text-lg font-bold text-white", children: ["$", startingCapital] }),
                      ],
                    }),
                    r.jsxs("div", {
                      className: "bg-slate-950/80 p-3.5 rounded-xl border border-slate-800",
                      children: [
                        r.jsx("span", { className: "text-[10px] text-slate-400 font-sans block", children: s("নির্দিষ্ট লট সাইজ", "Exact Lot Size") }),
                        r.jsxs("span", { className: "text-lg font-bold text-indigo-400", children: [math.recommendedLot, " Lot"] }),
                      ],
                    }),
                    r.jsxs("div", {
                      className: "bg-slate-950/80 p-3.5 rounded-xl border border-slate-800",
                      children: [
                        r.jsx("span", { className: "text-[10px] text-slate-400 font-sans block", children: s("স্টপ লস ও টার্গেট", "SL & TP Pips") }),
                        r.jsxs("span", { className: "text-sm font-bold text-emerald-400", children: [stopLossPips, "p SL / ", math.tpPips, "p TP"] }),
                      ],
                    }),
                    r.jsxs("div", {
                      className: "bg-slate-950/80 p-3.5 rounded-xl border border-slate-800",
                      children: [
                        r.jsx("span", { className: "text-[10px] text-slate-400 font-sans block", children: s("ডেইলি ম্যাক্স লস", "Daily Max Loss Limit") }),
                        r.jsxs("span", { className: "text-lg font-bold text-rose-400", children: ["$", math.maxDailyLoss] }),
                      ],
                    }),
                  ],
                }),

                r.jsxs("div", {
                  className: "p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1.5",
                  children: [
                    r.jsx("span", { className: "font-bold text-white block", children: s("আজকের প্রতিশ্রুতি (Trader's Oath):", "Trader's Oath:") }),
                    r.jsx("p", {
                      children: s(
                        "১. আমি কখনো স্টপ লস ছাড়া ট্রেড নেব না। ২. দিনে পরপর ২টি লস হলে আমি ওই দিনের মতো মার্কেট ত্যাগ করব। ৩. আমি কখনোই লস রিকভার করার জন্য লট সাইজ বাড়াব না।",
                        "1. I will never enter without a stop loss. 2. If I suffer 2 consecutive losses today, I will step away. 3. I will never increase lots to recover a loss."
                      ),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
    ],
  });
}
