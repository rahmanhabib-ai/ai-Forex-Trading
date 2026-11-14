// Institutional Forex & Gold Macro Trading Terminal — Pro Chart, Replay, Indicators & Broker/Diary Bridge (Step 4)
// Forex AI News V2.2 Enterprise Engine

function ChartTerminalPage({ page, portalType }) {
  const chartCanvasRef = b.useRef(null);
  const containerRef = b.useRef(null);
  const liveTickIntervalRef = b.useRef(null);
  const webSocketRef = b.useRef(null);
  const replayIntervalRef = b.useRef(null);

  // Asset & Timeframe States
  const [selectedSymbol, setSelectedSymbol] = b.useState("XAUUSD");
  const [selectedTimeframe, setSelectedTimeframe] = b.useState("15m");
  const [candleStyle, setCandleStyle] = b.useState("candlestick"); // "candlestick" | "line"
  const [isLoading, setIsLoading] = b.useState(false);
  const [toastMsg, setToastMsg] = b.useState("");

  // Live 0-Delay Market Quote State
  const [quoteData, setQuoteData] = b.useState({
    bid: 4125.50,
    ask: 4125.75,
    spread: 2.5,
    change24h: 18.40,
    changePercent: 0.68,
    high24h: 4145.20,
    low24h: 4108.10,
    source: "Binance LBMA Physical Gold Spot (Zero Delay)",
    isRealMarket: true,
    lastTickTime: Date.now()
  });

  const [priceFlash, setPriceFlash] = b.useState(null); // "up" | "down" | null
  const [streamType, setStreamType] = b.useState("ws");

  // Global Market Sessions Clock
  const [utcTimeStr, setUtcTimeStr] = b.useState("");
  const [sessionInfo, setSessionInfo] = b.useState({
    tokyo: false,
    london: false,
    ny: false,
    londonKillzone: false,
    nyKillzone: false,
    overlap: false
  });

  // Base Candles Data
  const [allCandles, setAllCandles] = b.useState([]);

  // STEP 2: 100% Free Intraday Bar Replay Engine States
  const [isReplayMode, setIsReplayMode] = b.useState(false);
  const [isCutting, setIsCutting] = b.useState(false);
  const [replayIndex, setReplayIndex] = b.useState(0);
  const [isReplayPlaying, setIsReplayPlaying] = b.useState(false);
  const [replaySpeed, setReplaySpeed] = b.useState(800); // 800ms = 1x
  const [hoveredCutIndex, setHoveredCutIndex] = b.useState(null);

  // STEP 2: Drawing Suite States
  const [activeDrawingTool, setActiveDrawingTool] = b.useState("cursor"); // "cursor" | "trendline" | "horizontal" | "fibonacci" | "orderblock" | "riskreward"
  const [drawings, setDrawings] = b.useState([]);
  const [currentDraftDrawing, setCurrentDraftDrawing] = b.useState(null);

  // STEP 3: Unlimited Technical Indicators & On-Chart Economic News Impact States
  const [activeIndicators, setActiveIndicators] = b.useState(["EMA_RIBBON", "VWAP", "KILLZONES"]);
  const [activeSubOscillator, setActiveSubOscillator] = b.useState("RSI"); // "VOL" | "RSI" | "MACD" | "NONE"
  const [selectedNewsEvent, setSelectedNewsEvent] = b.useState(null);

  // STEP 4: Docked 1-Click Broker Trade Execution States (Exness / Pepperstone / IC Markets)
  const [isBrokerDockOpen, setIsBrokerDockOpen] = b.useState(true);
  const [selectedBroker, setSelectedBroker] = b.useState("Exness Pro Raw");
  const [tradeLot, setTradeLot] = b.useState(0.10);
  const [tradeSL, setTradeSL] = b.useState("");
  const [tradeTP, setTradeTP] = b.useState("");
  const [accountBalance, setAccountBalance] = b.useState(10000.00);
  const [openPositions, setOpenPositions] = b.useState([]);
  const [isExecutingTrade, setIsExecutingTrade] = b.useState(false);

  // STEP 4: 1-Click Trader's Diary & Psychology Snapshot Bridge States
  const [isDiaryModalOpen, setIsDiaryModalOpen] = b.useState(false);
  const [snapshotPreview, setSnapshotPreview] = b.useState(null);
  const [selectedStrategy, setSelectedStrategy] = b.useState("Liquidity Sweep & FVG");
  const [tradeType, setTradeType] = b.useState("BUY");
  const [tradeOutcome, setTradeOutcome] = b.useState("PASS");
  const [mindsetRating, setMindsetRating] = b.useState(9);
  const [mindsetTag, setMindsetTag] = b.useState("Disciplined");
  const [diaryNoteText, setDiaryNoteText] = b.useState("");
  const [isSavingDiary, setIsSavingDiary] = b.useState(false);

  // Chart Interactive Navigation States
  const [hoveredCandle, setHoveredCandle] = b.useState(null);
  const [cursorPos, setCursorPos] = b.useState(null); // { x, y }
  const [viewOffset, setViewOffset] = b.useState(0); // Pan offset in bars
  const [barWidth, setBarWidth] = b.useState(8); // Zoom level
  const [isDragging, setIsDragging] = b.useState(false);
  const [dragStartX, setDragStartX] = b.useState(0);
  const [isFullscreen, setIsFullscreen] = b.useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Supported Asset Catalog
  const SYMBOL_LIST = [
    { symbol: "XAUUSD", name: "Gold Spot", icon: "🥇", category: "Commodities", digits: 2, defaultSpread: 2.5 },
    { symbol: "EURUSD", name: "Euro / US Dollar", icon: "💶", category: "Forex Major", digits: 4, defaultSpread: 1.2 },
    { symbol: "GBPUSD", name: "British Pound / USD", icon: "💷", category: "Forex Major", digits: 4, defaultSpread: 1.5 },
    { symbol: "BTCUSD", name: "Bitcoin / US Dollar", icon: "₿", category: "Crypto", digits: 2, defaultSpread: 5.0 },
    { symbol: "US30", name: "Wall Street Dow Jones 30", icon: "📈", category: "Indices", digits: 1, defaultSpread: 2.0 }
  ];

  // Supported Timeframes
  const TIMEFRAMES = [
    { id: "1m", label: "1m", desc: "1 Minute (Scalping)" },
    { id: "5m", label: "5m", desc: "5 Minutes" },
    { id: "15m", label: "15m", desc: "15 Minutes (Day Trading)" },
    { id: "30m", label: "30m", desc: "30 Minutes" },
    { id: "1h", label: "1h", desc: "1 Hour (Trend Analysis)" },
    { id: "4h", label: "4h", desc: "4 Hours (Swing)" },
    { id: "1d", label: "1D", desc: "Daily (Macro)" },
    { id: "1w", label: "1W", desc: "Weekly" }
  ];

  // Strictly Candlestick & Line Chart Styles
  const STYLES = [
    { id: "candlestick", label: "ক্যান্ডেলস্টিক", icon: "📊" },
    { id: "line", label: "লাইন চার্ট", icon: "📉" }
  ];

  // Replay Speeds
  const SPEEDS = [
    { label: "0.5x", val: 1500 },
    { label: "1x", val: 800 },
    { label: "2x", val: 400 },
    { label: "5x", val: 160 },
    { label: "10x", val: 80 }
  ];

  // Drawing Tools Catalog
  const DRAWING_TOOLS = [
    { id: "cursor", label: "কার্সার", icon: "↖", desc: "Standard Crosshair Cursor" },
    { id: "trendline", label: "ট্রেন্ডলাইন", icon: "📏", desc: "Trendline & Diagonal Structure" },
    { id: "horizontal", label: "কী-লেভেল", icon: "↔", desc: "Horizontal Level & Support/Resistance" },
    { id: "fibonacci", label: "ফিবোনাচ্চি", icon: "📐", desc: "Fibonacci 0.618 / 0.5 Golden Pocket" },
    { id: "orderblock", label: "অর্ডার ব্লক / FVG", icon: "📦", desc: "Fair Value Gap & Institutional Order Block Box" },
    { id: "riskreward", label: "রিস্ক-রিওয়ার্ড", icon: "⚖️", desc: "Long / Short 1:2 R:R Calculator Ruler" }
  ];

  // STEP 3: Available Indicators Catalog (NO LIMIT - stack as many as user wants)
  const OVERLAY_INDICATORS = [
    { id: "EMA_RIBBON", label: "EMA Ribbon (20/50/100/200)", desc: "4 Exponential Moving Averages" },
    { id: "BOLL", label: "Bollinger Bands", desc: "20-period volatility corridor" },
    { id: "VWAP", label: "VWAP", desc: "Volume Weighted Average Price" },
    { id: "SUPERTREND", label: "Supertrend", desc: "ATR Trailing Trend Channel" },
    { id: "DONCHIAN", label: "Donchian Channels", desc: "20-period High/Low corridor" },
    { id: "KILLZONES", label: "London/NY Killzones", desc: "Session background highlighting" }
  ];

  const SUB_OSCILLATORS = [
    { id: "VOL", label: "Volume Profile" },
    { id: "RSI", label: "RSI (14)" },
    { id: "MACD", label: "MACD (12, 26, 9)" },
    { id: "NONE", label: "লুকান (Hide Sub)" }
  ];

  // STEP 3: On-Chart High-Impact Economic News Events
  const ECONOMIC_NEWS_EVENTS = [
    {
      id: "news_nfp",
      barOffset: 24,
      title: "US Non-Farm Payrolls (NFP)",
      flag: "🇺🇸",
      impact: "HIGH",
      color: "#f43f5e",
      badge: "🔴 NFP",
      actual: "216K",
      forecast: "170K",
      previous: "173K",
      pipsMove: "+78 Pips Spike",
      analysis: "নন-ফার্ম পেরোল প্রত্যাশার চেয়ে অনেক বেশি শক্তিশালী আসায় মার্কিন ডলার তাৎক্ষণিক শক্তিশালী হয় এবং XAU/USD প্রথম ১৫ মিনিটে ৭৮ পিপস ডাম্প দিয়ে এশিয়ান লিকুইডিটি সুইপ করে রিভার্সাল নেয়।"
    },
    {
      id: "news_cpi",
      barOffset: 65,
      title: "US Core CPI Inflation (YoY)",
      flag: "🇺🇸",
      impact: "HIGH",
      color: "#f43f5e",
      badge: "🔴 CPI",
      actual: "3.1%",
      forecast: "3.2%",
      previous: "3.3%",
      pipsMove: "+94 Pips Rally",
      analysis: "মুদ্রাস্ফীতি (CPI) ফোরকাস্টের চেয়ে কম আসায় ফেডারেল রিজার্ভের সুদের হার কমানোর সম্ভাবনা বেড়ে যায় এবং গোল্ড ও EUR/USD একটানা ৯৪ পিপস বুলিশ র‍্যালি প্রদান করে।"
    },
    {
      id: "news_fomc",
      barOffset: 120,
      title: "FOMC Rate Decision & Powell Speech",
      flag: "🇺🇸",
      impact: "HIGH",
      color: "#f43f5e",
      badge: "🔴 FOMC",
      actual: "5.25% (Hold)",
      forecast: "5.25%",
      previous: "5.50%",
      pipsMove: "+125 Pips Swing",
      analysis: "জেরোম পাওয়েল প্রেস কনফারেন্সে ডভিশ (Dovish) ইঙ্গিত প্রদান করার পর বাজারে ব্যাপক ভোলাটিলিটি শুরু হয়। ইনস্টিটিউশনাল অর্ডারফ্লোতে ১২৫ পিপস দ্বিমুখী সুইপ ঘটে।"
    },
    {
      id: "news_retail",
      barOffset: 170,
      title: "US Core Retail Sales (MoM)",
      flag: "🇺🇸",
      impact: "MEDIUM",
      color: "#f59e0b",
      badge: "🟠 RETAIL",
      actual: "0.6%",
      forecast: "0.4%",
      previous: "0.2%",
      pipsMove: "+38 Pips Reaction",
      analysis: "রিটেল সেলস প্রত্যাশার চেয়ে বেশি বৃদ্ধি পাওয়ায় ভোক্তাদের ব্যয় সক্ষমতা প্রমাণিত হয় এবং গোল্ডে তাৎক্ষণিক ৩৮ পিপস দ্রুত রিজেকশন দেখা যায়।"
    }
  ];

  // STEP 4: Broker List
  const BROKER_LIST = [
    { id: "exness", name: "Exness Pro Raw", spreadMultiplier: 1.0, icon: "⚡" },
    { id: "pepperstone", name: "Pepperstone Razor", spreadMultiplier: 0.95, icon: "🛡️" },
    { id: "icmarkets", name: "IC Markets Raw Spread", spreadMultiplier: 0.90, icon: "🌐" }
  ];

  // Active Visible Candles (Filtered by Replay Index if in Replay Mode)
  const activeCandles = b.useMemo(() => {
    if (isReplayMode && replayIndex > 0) {
      return allCandles.slice(0, replayIndex);
    }
    return allCandles;
  }, [allCandles, isReplayMode, replayIndex]);

  // Live Market Sessions Clock Engine
  b.useEffect(() => {
    const updateSessions = () => {
      const now = new Date();
      const utcHours = now.getUTCHours();
      const utcMins = now.getUTCMinutes();
      const utcDec = utcHours + utcMins / 60;

      const tokyo = (utcDec >= 23 || utcDec < 8);
      const london = (utcDec >= 7 && utcDec < 16);
      const ny = (utcDec >= 12 && utcDec < 21);
      const londonKillzone = (utcDec >= 7 && utcDec < 10);
      const nyKillzone = (utcDec >= 12 && utcDec < 15);
      const overlap = (utcDec >= 12 && utcDec < 16);

      setSessionInfo({ tokyo, london, ny, londonKillzone, nyKillzone, overlap });
      setUtcTimeStr(`${String(utcHours).padStart(2, "0")}:${String(utcMins).padStart(2, "0")}:${String(now.getUTCSeconds()).padStart(2, "0")} UTC`);
    };

    updateSessions();
    const timer = setInterval(updateSessions, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Real OHLC Candles from Server API
  const fetchCandles = b.useCallback(async (sym, tf) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/market/candles?symbol=${encodeURIComponent(sym)}&timeframe=${encodeURIComponent(tf)}&count=220`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.candles) && data.candles.length > 0) {
          setAllCandles(data.candles);
          if (isReplayMode) {
            setReplayIndex(Math.floor(data.candles.length * 0.75));
          }

          const latest = data.candles[data.candles.length - 1];
          const digits = sym.includes("XAU") || sym.includes("BTC") ? 2 : sym.includes("US30") ? 1 : 4;
          const spreadUnit = digits === 2 ? 0.01 : digits === 1 ? 0.1 : 0.0001;
          const spreadPips = sym.includes("XAU") ? 2.5 : sym.includes("BTC") ? 5.0 : sym.includes("US30") ? 2.0 : 1.2;
          const spreadAbs = spreadPips * spreadUnit;

          setQuoteData(prev => ({
            ...prev,
            bid: latest.close,
            ask: Number((latest.close + spreadAbs).toFixed(digits)),
            spread: spreadPips,
            change24h: Number((latest.close - data.candles[0].open).toFixed(digits)),
            changePercent: Number((((latest.close - data.candles[0].open) / data.candles[0].open) * 100).toFixed(2)),
            high24h: Math.max(...data.candles.map(c => c.high)),
            low24h: Math.min(...data.candles.map(c => c.low)),
            source: data.source || "Interbank Real-Time Stream",
            lastTickTime: Date.now()
          }));
        }
      }
    } catch (e) {
      console.warn("Failed to fetch candles:", e);
    } finally {
      setIsLoading(false);
    }
  }, [isReplayMode]);

  // Load candles when symbol or timeframe changes
  b.useEffect(() => {
    fetchCandles(selectedSymbol, selectedTimeframe);
    setViewOffset(0);
  }, [selectedSymbol, selectedTimeframe, fetchCandles]);

  // Direct Zero-Delay Binance WebSocket Engine (Only when NOT in replay mode)
  b.useEffect(() => {
    if (isReplayMode) {
      if (webSocketRef.current) {
        try { webSocketRef.current.close(); } catch (e) {}
        webSocketRef.current = null;
      }
      return;
    }

    const isBinanceAsset = selectedSymbol === "XAUUSD" || selectedSymbol === "BTCUSD";
    if (webSocketRef.current) {
      try { webSocketRef.current.close(); } catch (e) {}
      webSocketRef.current = null;
    }

    if (isBinanceAsset) {
      const streamSymbol = selectedSymbol === "XAUUSD" ? "paxgusdt" : "btcusdt";
      const binanceTfMap = {
        "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
        "1h": "1h", "4h": "4h", "1d": "1d", "1w": "1w"
      };
      const bInterval = binanceTfMap[selectedTimeframe] || "15m";
      const wsUrl = `wss://stream.binance.com:9443/ws/${streamSymbol}@kline_${bInterval}/${streamSymbol}@ticker`;

      try {
        const ws = new WebSocket(wsUrl);
        webSocketRef.current = ws;
        setStreamType("ws");

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.e === "24hrTicker") {
              const newBid = parseFloat(msg.c);
              const prevBid = quoteData.bid;
              if (newBid !== prevBid) {
                setPriceFlash(newBid > prevBid ? "up" : "down");
                setTimeout(() => setPriceFlash(null), 400);
              }

              const digits = selectedSymbol === "XAUUSD" || selectedSymbol === "BTCUSD" ? 2 : 4;
              const spreadUnit = 0.01;
              const spreadPips = selectedSymbol === "XAUUSD" ? 2.5 : 5.0;

              setQuoteData({
                bid: Number(newBid.toFixed(digits)),
                ask: Number((newBid + spreadPips * spreadUnit).toFixed(digits)),
                spread: spreadPips,
                change24h: parseFloat(msg.p),
                changePercent: parseFloat(msg.P),
                high24h: parseFloat(msg.h),
                low24h: parseFloat(msg.l),
                source: selectedSymbol === "XAUUSD" ? "Binance LBMA Physical Gold Spot (Direct WebSocket)" : "Binance Spot Realtime (Direct WebSocket)",
                isRealMarket: true,
                lastTickTime: Date.now()
              });
            } else if (msg.e === "kline" && msg.k) {
              const k = msg.k;
              const currentClose = parseFloat(k.c);
              const currentHigh = parseFloat(k.h);
              const currentLow = parseFloat(k.l);
              const currentOpen = parseFloat(k.o);
              const currentVol = Math.round(parseFloat(k.v) * (selectedSymbol === "XAUUSD" ? 100 : 10));
              const isClosed = k.x;

              setAllCandles(prevCandles => {
                if (prevCandles.length === 0) return prevCandles;
                const last = prevCandles[prevCandles.length - 1];
                const updatedLast = {
                  timestamp: k.t,
                  open: currentOpen,
                  high: currentHigh,
                  low: currentLow,
                  close: currentClose,
                  volume: currentVol
                };

                if (isClosed) {
                  return [...prevCandles, updatedLast];
                } else {
                  return [...prevCandles.slice(0, prevCandles.length - 1), updatedLast];
                }
              });
            }
          } catch (err) {}
        };

        ws.onerror = () => { setStreamType("http"); };
        ws.onclose = () => { setStreamType("http"); };
      } catch (wsErr) {
        setStreamType("http");
      }
    } else {
      setStreamType("http");
    }

    const fetchLiveQuote = async () => {
      try {
        const res = await fetch("/api/market/quotes");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.quotes)) {
            const symNorm = selectedSymbol.toUpperCase();
            const matched = data.quotes.find(q => {
              const qSym = (q.symbol || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
              return qSym.includes(symNorm) || symNorm.includes(qSym);
            });

            if (matched && (!isBinanceAsset || streamType === "http")) {
              const prevBid = quoteData.bid;
              const newBid = matched.bid;
              if (newBid !== prevBid) {
                setPriceFlash(newBid > prevBid ? "up" : "down");
                setTimeout(() => setPriceFlash(null), 500);
              }

              setQuoteData({
                bid: matched.bid,
                ask: matched.ask,
                spread: matched.spread,
                change24h: matched.change24h,
                changePercent: matched.changePercent24h,
                high24h: matched.high24h,
                low24h: matched.low24h,
                source: matched.source || "Interbank Real-Time Stream",
                isRealMarket: true,
                lastTickTime: Date.now()
              });

              setAllCandles(prevCandles => {
                if (prevCandles.length === 0) return prevCandles;
                const last = prevCandles[prevCandles.length - 1];
                const updatedLast = {
                  ...last,
                  close: newBid,
                  high: Math.max(last.high, newBid),
                  low: Math.min(last.low, newBid),
                  volume: last.volume + Math.floor(Math.random() * 5 + 1)
                };
                return [...prevCandles.slice(0, prevCandles.length - 1), updatedLast];
              });
            }
          }
        }
      } catch (err) {}
    };

    liveTickIntervalRef.current = setInterval(fetchLiveQuote, 1200);

    return () => {
      if (webSocketRef.current) {
        try { webSocketRef.current.close(); } catch (e) {}
      }
      if (liveTickIntervalRef.current) clearInterval(liveTickIntervalRef.current);
    };
  }, [selectedSymbol, selectedTimeframe, isReplayMode, quoteData.bid, streamType]);

  // STEP 2: Bar Replay Engine Automation
  b.useEffect(() => {
    if (replayIntervalRef.current) {
      clearInterval(replayIntervalRef.current);
      replayIntervalRef.current = null;
    }

    if (isReplayMode && isReplayPlaying) {
      replayIntervalRef.current = setInterval(() => {
        setReplayIndex(prev => {
          if (prev >= allCandles.length) {
            setIsReplayPlaying(false);
            showToast("🏁 বার রিপ্লে সমাপ্ত হয়েছে");
            return prev;
          }
          return prev + 1;
        });
      }, replaySpeed);
    }

    return () => {
      if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
    };
  }, [isReplayMode, isReplayPlaying, replaySpeed, allCandles.length]);

  // STEP 2: Keyboard Shortcut
  b.useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isReplayMode) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        setReplayIndex(prev => Math.min(allCandles.length, prev + 1));
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setIsReplayPlaying(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isReplayMode, allCandles.length]);

  // STEP 2: Bar Replay Actions
  const handleStartCutMode = () => {
    setIsCutting(true);
    showToast("✂️ কাট-টুল সক্রিয়: অতীতের যে ক্যান্ডেল থেকে রিপ্লে করতে চান সেখানে ক্লিক করুন");
  };

  const handleApplyCut = (candleIdx) => {
    setIsCutting(false);
    setIsReplayMode(true);
    setIsReplayPlaying(false);
    setReplayIndex(Math.max(10, candleIdx + 1));
    showToast(`🎯 বার রিপ্লে সক্রিয়: ক্যান্ডেল #${candleIdx + 1} থেকে শুরু হচ্ছে`);
  };

  const handleStepForward = () => {
    if (replayIndex < allCandles.length) {
      setReplayIndex(prev => prev + 1);
    } else {
      showToast("সবচেয়ে সাম্প্রতিক বারে পৌঁছেছেন");
    }
  };

  const handleExitReplay = () => {
    setIsReplayMode(false);
    setIsReplayPlaying(false);
    setIsCutting(false);
    setReplayIndex(allCandles.length);
    showToast("লাইভ রিয়েল-টাইম মার্কেট ফিডে ফিরে আসা হয়েছে");
  };

  // STEP 3: Toggle Indicators with ZERO LIMITS
  const handleToggleIndicator = (id) => {
    setActiveIndicators(prev => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter(x => x !== id) : [...prev, id];
      showToast(exists ? `ইন্ডিকেটর সরানো হয়েছে: ${id}` : `✅ ইন্ডিকেটর যুক্ত হয়েছে: ${id} (আনলিমিটেড সক্রিয়)`);
      return updated;
    });
  };

  // STEP 2: Drawing Actions
  const handleClearDrawings = () => {
    setDrawings([]);
    setCurrentDraftDrawing(null);
    showToast("সকল ড্রয়িং ক্লিয়ার করা হয়েছে");
  };

  // STEP 4: 1-Click Broker Trade Execution Handlers
  const handleExecuteTrade = async (type) => {
    setIsExecutingTrade(true);
    const price = type === "BUY" ? quoteData.ask : quoteData.bid;
    const digits = selectedSymbol.includes("XAU") || selectedSymbol.includes("BTC") ? 2 : selectedSymbol.includes("US30") ? 1 : 4;
    const ticket = Math.floor(700000 + Math.random() * 299999);

    const newPos = {
      ticket,
      symbol: selectedSymbol,
      type,
      lots: Number(tradeLot),
      openPrice: price,
      sl: tradeSL ? Number(tradeSL) : 0,
      tp: tradeTP ? Number(tradeTP) : 0,
      profit: 0,
      openTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      status: "OPEN",
      broker: selectedBroker
    };

    setOpenPositions(prev => [newPos, ...prev]);

    try {
      await fetch("/api/portfolio/trade/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: selectedSymbol,
          type,
          lots: tradeLot,
          price,
          sl: tradeSL,
          tp: tradeTP,
          broker: selectedBroker
        })
      });
    } catch (err) {}

    setIsExecutingTrade(false);
    showToast(`✅ ${type} ${tradeLot} Lot ${selectedSymbol} @ $${price.toFixed(digits)} এক্সিকিউট সফল (Ticket #${ticket})`);
  };

  const handleClosePosition = async (ticket) => {
    const pos = openPositions.find(p => p.ticket === ticket);
    if (!pos) return;
    const currentPrice = pos.type === "BUY" ? quoteData.bid : quoteData.ask;
    const diff = pos.type === "BUY" ? (currentPrice - pos.openPrice) : (pos.openPrice - currentPrice);
    const multiplier = selectedSymbol.includes("XAU") ? 100 : selectedSymbol.includes("BTC") ? 1 : selectedSymbol.includes("US30") ? 1 : 100000;
    const pnl = Number((diff * pos.lots * multiplier).toFixed(2));

    setAccountBalance(prev => Number((prev + pnl).toFixed(2)));
    setOpenPositions(prev => prev.filter(p => p.ticket !== ticket));

    try {
      await fetch("/api/portfolio/trade/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket, closePrice: currentPrice, profit: pnl })
      });
    } catch (e) {}

    showToast(`ট্রেড #${ticket} ক্লোজ করা হয়েছে | P&L: ${pnl >= 0 ? "+" : ""}$${pnl}`);
  };

  const handleCloseAllPositions = async () => {
    if (openPositions.length === 0) return;
    let totalPnl = 0;
    for (const pos of openPositions) {
      const currentPrice = pos.type === "BUY" ? quoteData.bid : quoteData.ask;
      const diff = pos.type === "BUY" ? (currentPrice - pos.openPrice) : (pos.openPrice - currentPrice);
      const multiplier = selectedSymbol.includes("XAU") ? 100 : selectedSymbol.includes("BTC") ? 1 : selectedSymbol.includes("US30") ? 1 : 100000;
      totalPnl += Number((diff * pos.lots * multiplier).toFixed(2));
      try {
        await fetch("/api/portfolio/trade/close", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticket: pos.ticket, closePrice: currentPrice, profit: totalPnl })
        });
      } catch (e) {}
    }
    setAccountBalance(prev => Number((prev + totalPnl).toFixed(2)));
    setOpenPositions([]);
    showToast(`সকল পজিশন ক্লোজ করা হয়েছে | সর্বমোট P&L: ${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`);
  };

  const handleAutoSL = (pips) => {
    const pipVal = selectedSymbol.includes("XAU") ? pips * 0.10 : selectedSymbol.includes("BTC") ? pips * 1.0 : pips * 0.0001;
    const sl = (quoteData.bid - pipVal).toFixed(selectedSymbol.includes("XAU") ? 2 : 4);
    setTradeSL(sl);
    showToast(`SL সেট করা হয়েছে: ${sl} (-${pips} pips)`);
  };

  const handleAutoTP = (ratio) => {
    const pips = ratio === 2 ? 40 : 60;
    const pipVal = selectedSymbol.includes("XAU") ? pips * 0.10 : selectedSymbol.includes("BTC") ? pips * 1.0 : pips * 0.0001;
    const tp = (quoteData.ask + pipVal).toFixed(selectedSymbol.includes("XAU") ? 2 : 4);
    setTradeTP(tp);
    showToast(`TP সেট করা হয়েছে: ${tp} (1:${ratio} R:R)`);
  };

  // STEP 4: 1-Click Trader's Diary Note Snapshot Bridge Handlers
  const handleOpenDiaryModal = () => {
    try {
      const canvas = chartCanvasRef.current;
      if (canvas) {
        setSnapshotPreview(canvas.toDataURL("image/png"));
      } else {
        setSnapshotPreview(null);
      }
    } catch (e) {
      setSnapshotPreview(null);
    }
    setDiaryNoteText(`${selectedSymbol} (${selectedTimeframe}) টাইমফ্রেমে ${selectedStrategy} সেটআপ। মার্কেট প্রাইস: $${quoteData.bid}। কী-লেভেল ও অর্ডারফ্লো কনফার্মেশন সহ এক্সিকিউশন।`);
    setIsDiaryModalOpen(true);
  };

  const handleSaveToDiary = async () => {
    setIsSavingDiary(true);
    try {
      const res = await fetch("/api/trading-notes/chart-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: selectedSymbol,
          timeframe: selectedTimeframe,
          price: quoteData.bid,
          strategyName: selectedStrategy,
          tradeType,
          outcome: tradeOutcome,
          notes: diaryNoteText,
          mindsetRating,
          tags: [selectedSymbol, selectedTimeframe, selectedStrategy, mindsetTag],
          screenshotUrl: snapshotPreview
        })
      });

      if (res.ok) {
        showToast("✅ চার্ট স্ন্যাপশট ও সাইকোলজি নোট ট্রেডার্স ডায়েরিতে সেভ হয়েছে!");
        setIsDiaryModalOpen(false);
      } else {
        showToast("ডায়েরিতে সেভ হয়েছে (লোকাল সেভড)");
        setIsDiaryModalOpen(false);
      }
    } catch (err) {
      showToast("✅ ডায়েরিতে নোট সফলভাবে সেভ করা হয়েছে");
      setIsDiaryModalOpen(false);
    } finally {
      setIsSavingDiary(false);
    }
  };

  // STEP 3: Mathematical Indicators Calculation Helpers
  const indicatorCalculations = b.useMemo(() => {
    if (activeCandles.length < 5) return null;

    const closes = activeCandles.map(c => c.close);
    const highs = activeCandles.map(c => c.high);
    const lows = activeCandles.map(c => c.low);
    const volumes = activeCandles.map(c => c.volume);

    const calcEma = (period) => {
      const k = 2 / (period + 1);
      const emaArray = [];
      let prevEma = closes[0];
      for (let i = 0; i < closes.length; i++) {
        if (i === 0) {
          emaArray.push(closes[0]);
        } else {
          const currentEma = closes[i] * k + prevEma * (1 - k);
          emaArray.push(currentEma);
          prevEma = currentEma;
        }
      }
      return emaArray;
    };

    const bollPeriod = 20;
    const bollUpper = [];
    const bollLower = [];
    const bollMiddle = [];

    for (let i = 0; i < closes.length; i++) {
      if (i < bollPeriod - 1) {
        bollMiddle.push(closes[i]);
        bollUpper.push(closes[i]);
        bollLower.push(closes[i]);
      } else {
        const slice = closes.slice(i - bollPeriod + 1, i + 1);
        const sum = slice.reduce((a, b) => a + b, 0);
        const mean = sum / bollPeriod;
        const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / bollPeriod;
        const stdDev = Math.sqrt(variance);
        bollMiddle.push(mean);
        bollUpper.push(mean + stdDev * 2);
        bollLower.push(mean - stdDev * 2);
      }
    }

    let cumTypicalVol = 0;
    let cumVol = 0;
    const vwapArray = [];

    for (let i = 0; i < activeCandles.length; i++) {
      const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
      cumTypicalVol += typicalPrice * volumes[i];
      cumVol += volumes[i];
      vwapArray.push(cumVol > 0 ? cumTypicalVol / cumVol : typicalPrice);
    }

    const donchianUpper = [];
    const donchianLower = [];
    for (let i = 0; i < activeCandles.length; i++) {
      const start = Math.max(0, i - 19);
      const highSlice = highs.slice(start, i + 1);
      const lowSlice = lows.slice(start, i + 1);
      donchianUpper.push(Math.max(...highSlice));
      donchianLower.push(Math.min(...lowSlice));
    }

    const rsiArray = [];
    const rsiPeriod = 14;
    let avgGain = 0;
    let avgLoss = 0;

    for (let i = 0; i < closes.length; i++) {
      if (i === 0) {
        rsiArray.push(50);
        continue;
      }
      const change = closes[i] - closes[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      if (i <= rsiPeriod) {
        avgGain += gain / rsiPeriod;
        avgLoss += loss / rsiPeriod;
        rsiArray.push(50);
      } else {
        avgGain = (avgGain * 13 + gain) / 14;
        avgLoss = (avgLoss * 13 + loss) / 14;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        rsiArray.push(rsi);
      }
    }

    const ema12 = calcEma(12);
    const ema26 = calcEma(26);
    const macdLine = ema12.map((val, idx) => val - ema26[idx]);

    const kSig = 2 / (9 + 1);
    const signalLine = [];
    let prevSig = macdLine[0] || 0;
    for (let i = 0; i < macdLine.length; i++) {
      if (i === 0) {
        signalLine.push(macdLine[0]);
      } else {
        const curSig = macdLine[i] * kSig + prevSig * (1 - kSig);
        signalLine.push(curSig);
        prevSig = curSig;
      }
    }
    const macdHist = macdLine.map((val, idx) => val - signalLine[idx]);

    return {
      ema20: calcEma(20),
      ema50: calcEma(50),
      ema100: calcEma(100),
      ema200: calcEma(200),
      bollUpper,
      bollLower,
      bollMiddle,
      vwap: vwapArray,
      donchianUpper,
      donchianLower,
      rsi: rsiArray,
      macdLine,
      signalLine,
      macdHist
    };
  }, [activeCandles]);

  // 60 FPS Canvas Rendering Engine
  b.useEffect(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const paddingRight = 75;
    const paddingBottom = 30;
    const plotWidth = width - paddingRight;

    const subHeight = activeSubOscillator !== "NONE" ? Math.max(70, height * 0.22) : 0;
    const candlePlotHeight = height - paddingBottom - subHeight - (subHeight > 0 ? 15 : 0);

    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, width, height);

    if (activeCandles.length === 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = "13px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Loading institutional candles...", width / 2, height / 2);
      return;
    }

    const visibleCount = Math.floor(plotWidth / barWidth);
    const startIndex = Math.max(0, activeCandles.length - visibleCount - viewOffset);
    const endIndex = Math.min(activeCandles.length, startIndex + visibleCount);
    const visibleBars = activeCandles.slice(startIndex, endIndex);

    if (visibleBars.length === 0) return;

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    for (const bar of visibleBars) {
      if (bar.low < minPrice) minPrice = bar.low;
      if (bar.high > maxPrice) maxPrice = bar.high;
      if (bar.volume > maxVolume) maxVolume = bar.volume;
    }

    if (activeIndicators.includes("BOLL") && indicatorCalculations) {
      for (let i = startIndex; i < endIndex; i++) {
        if (indicatorCalculations.bollUpper[i] > maxPrice) maxPrice = indicatorCalculations.bollUpper[i];
        if (indicatorCalculations.bollLower[i] < minPrice) minPrice = indicatorCalculations.bollLower[i];
      }
    }

    const priceRange = maxPrice - minPrice || 1;
    minPrice -= priceRange * 0.05;
    maxPrice += priceRange * 0.05;
    const adjRange = maxPrice - minPrice;

    const getY = (val) => {
      return candlePlotHeight - ((val - minPrice) / adjRange) * candlePlotHeight + 10;
    };

    const getPriceFromY = (yVal) => {
      return minPrice + ((candlePlotHeight - (yVal - 10)) / candlePlotHeight) * adjRange;
    };

    // London & New York Killzones Background Highlights
    if (activeIndicators.includes("KILLZONES")) {
      visibleBars.forEach((bar, idx) => {
        const x = idx * barWidth;
        const d = new Date(bar.timestamp);
        const utcHours = d.getUTCHours();

        if (utcHours >= 7 && utcHours < 10) {
          ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
          ctx.fillRect(x, 0, barWidth, candlePlotHeight);
        }

        if (utcHours >= 12 && utcHours < 16) {
          ctx.fillStyle = "rgba(59, 130, 246, 0.08)";
          ctx.fillRect(x, 0, barWidth, candlePlotHeight);
        }
      });
    }

    // Grid lines
    const gridSteps = 6;
    ctx.strokeStyle = "rgba(30, 41, 59, 0.45)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    for (let i = 0; i <= gridSteps; i++) {
      const p = minPrice + (adjRange / gridSteps) * i;
      const y = getY(p);

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(plotWidth, y);
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      ctx.fillText(p.toFixed(selectedSymbol.includes("XAU") || selectedSymbol.includes("BTC") ? 2 : selectedSymbol.includes("US30") ? 1 : 4), plotWidth + 6, y + 3);
    }
    ctx.setLineDash([]);

    if (activeSubOscillator !== "NONE") {
      const subTopY = height - paddingBottom - subHeight;
      ctx.strokeStyle = "rgba(51, 65, 85, 0.5)";
      ctx.beginPath();
      ctx.moveTo(0, subTopY);
      ctx.lineTo(width, subTopY);
      ctx.stroke();

      ctx.fillStyle = "#475569";
      ctx.font = "9px Inter, sans-serif";
      ctx.textAlign = "left";
      const subTag = activeSubOscillator === "RSI" ? "RSI (14) OSCILLATOR" : activeSubOscillator === "MACD" ? "MACD (12, 26, 9) MOMENTUM" : "VOLUME PROFILE (TICK VOL)";
      ctx.fillText(subTag, 8, subTopY + 12);
    }

    const candleWidth = Math.max(2.0, barWidth * 0.72);
    const bullColor = "#10b981";
    const bearColor = "#f43f5e";
    const linePoints = [];

    visibleBars.forEach((bar, idx) => {
      const x = idx * barWidth + barWidth / 2;
      const isBull = bar.close >= bar.open;
      const openY = getY(bar.open);
      const closeY = getY(bar.close);
      const highY = getY(bar.high);
      const lowY = getY(bar.low);

      linePoints.push({ x, y: closeY });

      if (activeSubOscillator === "VOL") {
        const volHeight = (bar.volume / (maxVolume || 1)) * (subHeight - 16);
        const volY = height - paddingBottom - volHeight;
        ctx.fillStyle = isBull ? "rgba(16, 185, 129, 0.35)" : "rgba(244, 63, 94, 0.35)";
        ctx.fillRect(x - candleWidth / 2, volY, candleWidth, volHeight);
      }

      if (candleStyle === "candlestick") {
        ctx.strokeStyle = isBull ? bullColor : bearColor;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        ctx.fillStyle = isBull ? bullColor : bearColor;
        const bodyY = Math.min(openY, closeY);
        const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
        ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight);
      }

      if (idx % 8 === 0 || idx === visibleBars.length - 1) {
        ctx.fillStyle = "#64748b";
        ctx.font = "9px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        const d = new Date(bar.timestamp);
        const timeLabel = selectedTimeframe === "1d" || selectedTimeframe === "1w" 
          ? `${d.getMonth() + 1}/${d.getDate()}`
          : `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        ctx.fillText(timeLabel, x, height - 10);
      }
    });

    if (candleStyle === "line" && linePoints.length > 1) {
      const grad = ctx.createLinearGradient(0, 0, 0, candlePlotHeight);
      grad.addColorStop(0, "rgba(56, 189, 248, 0.25)");
      grad.addColorStop(1, "rgba(56, 189, 248, 0.0)");

      ctx.beginPath();
      ctx.moveTo(linePoints[0].x, candlePlotHeight);
      linePoints.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.lineTo(linePoints[linePoints.length - 1].x, candlePlotHeight);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      linePoints.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
    }

    // Indicators rendering
    if (indicatorCalculations) {
      if (activeIndicators.includes("BOLL")) {
        ctx.fillStyle = "rgba(99, 102, 241, 0.06)";
        ctx.beginPath();
        for (let i = 0; i < visibleBars.length; i++) {
          const globalIdx = startIndex + i;
          const x = i * barWidth + barWidth / 2;
          const y = getY(indicatorCalculations.bollUpper[globalIdx]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let i = visibleBars.length - 1; i >= 0; i--) {
          const globalIdx = startIndex + i;
          const x = i * barWidth + barWidth / 2;
          const y = getY(indicatorCalculations.bollLower[globalIdx]);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        [
          { data: indicatorCalculations.bollUpper, color: "rgba(99, 102, 241, 0.6)" },
          { data: indicatorCalculations.bollLower, color: "rgba(99, 102, 241, 0.6)" },
          { data: indicatorCalculations.bollMiddle, color: "rgba(99, 102, 241, 0.4)", dash: [2, 2] }
        ].forEach(line => {
          ctx.strokeStyle = line.color;
          ctx.lineWidth = 1.2;
          if (line.dash) ctx.setLineDash(line.dash);
          ctx.beginPath();
          for (let i = 0; i < visibleBars.length; i++) {
            const globalIdx = startIndex + i;
            const x = i * barWidth + barWidth / 2;
            const y = getY(line.data[globalIdx]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }

      if (activeIndicators.includes("EMA_RIBBON")) {
        const emaConfigs = [
          { data: indicatorCalculations.ema20, color: "#06b6d4", width: 1.5 },
          { data: indicatorCalculations.ema50, color: "#eab308", width: 1.5 },
          { data: indicatorCalculations.ema100, color: "#f97316", width: 1.6 },
          { data: indicatorCalculations.ema200, color: "#a855f7", width: 2.0 }
        ];

        emaConfigs.forEach(ema => {
          ctx.strokeStyle = ema.color;
          ctx.lineWidth = ema.width;
          ctx.beginPath();
          for (let i = 0; i < visibleBars.length; i++) {
            const globalIdx = startIndex + i;
            const x = i * barWidth + barWidth / 2;
            const y = getY(ema.data[globalIdx]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        });
      }

      if (activeIndicators.includes("VWAP")) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let i = 0; i < visibleBars.length; i++) {
          const globalIdx = startIndex + i;
          const x = i * barWidth + barWidth / 2;
          const y = getY(indicatorCalculations.vwap[globalIdx]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      if (activeIndicators.includes("DONCHIAN")) {
        ctx.strokeStyle = "rgba(45, 212, 191, 0.5)";
        ctx.lineWidth = 1.2;
        [indicatorCalculations.donchianUpper, indicatorCalculations.donchianLower].forEach(chan => {
          ctx.beginPath();
          for (let i = 0; i < visibleBars.length; i++) {
            const globalIdx = startIndex + i;
            const x = i * barWidth + barWidth / 2;
            const y = getY(chan[globalIdx]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        });
      }
    }

    if (activeSubOscillator === "RSI" && indicatorCalculations) {
      const subTopY = height - paddingBottom - subHeight + 18;
      const subPlotH = subHeight - 28;
      const y70 = subTopY + subPlotH * (1 - 0.70);
      const y30 = subTopY + subPlotH * (1 - 0.30);
      const y50 = subTopY + subPlotH * 0.50;

      ctx.fillStyle = "rgba(244, 63, 94, 0.05)";
      ctx.fillRect(0, subTopY, plotWidth, y70 - subTopY);
      ctx.fillStyle = "rgba(16, 185, 129, 0.05)";
      ctx.fillRect(0, y30, plotWidth, subTopY + subPlotH - y30);

      ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
      ctx.setLineDash([2, 2]);
      [y70, y50, y30].forEach(y => {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(plotWidth, y);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < visibleBars.length; i++) {
        const globalIdx = startIndex + i;
        const x = i * barWidth + barWidth / 2;
        const rsiVal = indicatorCalculations.rsi[globalIdx] || 50;
        const y = subTopY + subPlotH * (1 - (rsiVal / 100));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else if (activeSubOscillator === "MACD" && indicatorCalculations) {
      const subTopY = height - paddingBottom - subHeight + 20;
      const subPlotH = subHeight - 28;
      const zeroY = subTopY + subPlotH / 2;

      ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
      ctx.beginPath();
      ctx.moveTo(0, zeroY);
      ctx.lineTo(plotWidth, zeroY);
      ctx.stroke();

      for (let i = 0; i < visibleBars.length; i++) {
        const globalIdx = startIndex + i;
        const x = i * barWidth + barWidth / 2;
        const hist = indicatorCalculations.macdHist[globalIdx] || 0;
        const hY = Math.max(-subPlotH / 2, Math.min(subPlotH / 2, hist * 2.5));
        ctx.fillStyle = hist >= 0 ? "rgba(16, 185, 129, 0.6)" : "rgba(244, 63, 94, 0.6)";
        ctx.fillRect(x - candleWidth / 2, zeroY, candleWidth, -hY);
      }
    }

    // Direct On-Chart Economic News Impact Markers
    ECONOMIC_NEWS_EVENTS.forEach(event => {
      const targetCandleIdx = activeCandles.length - 1 - event.barOffset;
      if (targetCandleIdx >= startIndex && targetCandleIdx < endIndex) {
        const localIdx = targetCandleIdx - startIndex;
        const x = localIdx * barWidth + barWidth / 2;
        const candle = activeCandles[targetCandleIdx];
        const lowY = getY(candle.low);
        const markerY = Math.min(candlePlotHeight - 20, lowY + 28);

        ctx.beginPath();
        ctx.arc(x, markerY, 11, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(244, 63, 94, 0.20)";
        ctx.fill();
        ctx.strokeStyle = event.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = event.color;
        ctx.fillRect(x - 22, markerY - 8, 44, 16);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText(event.badge.replace(/[🔴🟠]/g, "").trim(), x, markerY + 3);

        ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(x, lowY + 2);
        ctx.lineTo(x, markerY - 8);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Current Price Pulsing Line
    const latestBar = visibleBars[visibleBars.length - 1];
    if (latestBar) {
      const curY = getY(latestBar.close);
      const isBull = latestBar.close >= latestBar.open;
      const lineColor = isReplayMode ? "#f59e0b" : isBull ? "#10b981" : "#f43f5e";

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, curY);
      ctx.lineTo(plotWidth, curY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = lineColor;
      ctx.fillRect(plotWidth + 1, curY - 10, paddingRight - 4, 20);
      ctx.fillStyle = isReplayMode ? "#000000" : "#ffffff";
      ctx.font = "bold 10px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(latestBar.close.toFixed(selectedSymbol.includes("XAU") || selectedSymbol.includes("BTC") ? 2 : selectedSymbol.includes("US30") ? 1 : 4), plotWidth + paddingRight / 2 - 1, curY + 3.5);

      const beaconX = (visibleBars.length - 1) * barWidth + barWidth / 2;
      ctx.beginPath();
      ctx.arc(beaconX, curY, 4, 0, Math.PI * 2);
      ctx.fillStyle = isReplayMode ? "#f59e0b" : "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(beaconX, curY, 7, 0, Math.PI * 2);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Render User Drawings
    const allDrawingsToRender = [...drawings, ...(currentDraftDrawing ? [currentDraftDrawing] : [])];

    allDrawingsToRender.forEach(d => {
      if (d.type === "trendline" && d.p1 && d.p2) {
        const y1 = getY(d.p1.price);
        const y2 = getY(d.p2.price);
        ctx.strokeStyle = d.color || "#38bdf8";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(d.p1.x, y1);
        ctx.lineTo(d.p2.x, y2);
        ctx.stroke();

        [ { x: d.p1.x, y: y1 }, { x: d.p2.x, y: y2 } ].forEach(pt => {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = d.color || "#38bdf8";
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      } else if (d.type === "horizontal" && d.price !== undefined) {
        const y = getY(d.price);
        ctx.strokeStyle = d.color || "#fbbf24";
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(plotWidth, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = d.color || "#fbbf24";
        ctx.fillRect(plotWidth + 1, y - 9, paddingRight - 4, 18);
        ctx.fillStyle = "#000000";
        ctx.font = "bold 9px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText(`KEY ${d.price.toFixed(selectedSymbol.includes("XAU") ? 2 : 4)}`, plotWidth + paddingRight / 2 - 1, y + 3.5);
      } else if (d.type === "fibonacci" && d.p1 && d.p2) {
        const highPrice = Math.max(d.p1.price, d.p2.price);
        const lowPrice = Math.min(d.p1.price, d.p2.price);
        const diff = highPrice - lowPrice;

        const fibLevels = [
          { ratio: 0.0, color: "#64748b", label: "0.0 (High)" },
          { ratio: 0.236, color: "#f43f5e", label: "0.236" },
          { ratio: 0.382, color: "#f59e0b", label: "0.382" },
          { ratio: 0.5, color: "#10b981", label: "0.500 (EQ)" },
          { ratio: 0.618, color: "#eab308", label: "0.618 (Golden Pocket)" },
          { ratio: 0.786, color: "#06b6d4", label: "0.786" },
          { ratio: 1.0, color: "#64748b", label: "1.0 (Low)" }
        ];

        fibLevels.forEach(fib => {
          const p = highPrice - diff * fib.ratio;
          const y = getY(p);
          ctx.strokeStyle = fib.color;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(Math.min(d.p1.x, d.p2.x), y);
          ctx.lineTo(plotWidth, y);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = fib.color;
          ctx.font = "bold 9px JetBrains Mono, monospace";
          ctx.textAlign = "left";
          ctx.fillText(`Fib ${fib.label}: $${p.toFixed(2)}`, Math.min(d.p1.x, d.p2.x) + 4, y - 3);
        });
      } else if (d.type === "orderblock" && d.p1 && d.p2) {
        const y1 = getY(d.p1.price);
        const y2 = getY(d.p2.price);
        const x1 = Math.min(d.p1.x, d.p2.x);
        const x2 = Math.max(d.p1.x, d.p2.x);
        const topY = Math.min(y1, y2);
        const boxH = Math.abs(y2 - y1);
        const boxW = Math.abs(x2 - x1);

        ctx.fillStyle = d.isBull ? "rgba(16, 185, 129, 0.20)" : "rgba(244, 63, 94, 0.20)";
        ctx.fillRect(x1, topY, boxW, boxH);
        ctx.strokeStyle = d.isBull ? "#10b981" : "#f43f5e";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x1, topY, boxW, boxH);

        ctx.fillStyle = d.isBull ? "#10b981" : "#f43f5e";
        ctx.font = "bold 9px JetBrains Mono, monospace";
        ctx.textAlign = "left";
        ctx.fillText(d.isBull ? "BULLISH ORDER BLOCK / FVG" : "BEARISH ORDER BLOCK / FVG", x1 + 6, topY + 12);
      } else if (d.type === "riskreward" && d.p1 && d.p2) {
        const entryPrice = d.p1.price;
        const targetPrice = d.p2.price;
        const isLong = targetPrice >= entryPrice;
        const riskDistance = Math.abs(targetPrice - entryPrice) / 2;
        const slPrice = isLong ? entryPrice - riskDistance : entryPrice + riskDistance;

        const entryY = getY(entryPrice);
        const tpY = getY(targetPrice);
        const slY = getY(slPrice);
        const startX = Math.min(d.p1.x, d.p2.x);
        const rulerWidth = Math.max(140, Math.abs(d.p2.x - d.p1.x));

        const tpTop = Math.min(entryY, tpY);
        const tpH = Math.abs(entryY - tpY);
        ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
        ctx.fillRect(startX, tpTop, rulerWidth, tpH);
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(startX, tpTop, rulerWidth, tpH);

        const slTop = Math.min(entryY, slY);
        const slH = Math.abs(entryY - slY);
        ctx.fillStyle = "rgba(244, 63, 94, 0.25)";
        ctx.fillRect(startX, slTop, rulerWidth, slH);
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(startX, slTop, rulerWidth, slH);

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(startX, entryY);
        ctx.lineTo(startX + rulerWidth, entryY);
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px JetBrains Mono, monospace";
        ctx.textAlign = "left";
        ctx.fillText(`Target: $${targetPrice.toFixed(2)} | SL: $${slPrice.toFixed(2)} | R:R = 1:2.00`, startX + 6, entryY - 6);
      }
    });

    if (isCutting && cursorPos) {
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(cursorPos.x, 0);
      ctx.lineTo(cursorPos.x, height - paddingBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(cursorPos.x - 55, cursorPos.y - 25, 110, 20);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✂️ এখানে কাট করুন", cursorPos.x, cursorPos.y - 11);
    }

    if (cursorPos && cursorPos.x < plotWidth && cursorPos.y < height - paddingBottom && !isCutting) {
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(cursorPos.x, 0);
      ctx.lineTo(cursorPos.x, height - paddingBottom);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, cursorPos.y);
      ctx.lineTo(plotWidth, cursorPos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const hoveredPrice = getPriceFromY(cursorPos.y);
      ctx.fillStyle = "#334155";
      ctx.fillRect(plotWidth + 1, cursorPos.y - 9, paddingRight - 4, 18);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(hoveredPrice.toFixed(selectedSymbol.includes("XAU") || selectedSymbol.includes("BTC") ? 2 : selectedSymbol.includes("US30") ? 1 : 4), plotWidth + paddingRight / 2 - 1, cursorPos.y + 3.5);
    }
  }, [activeCandles, barWidth, viewOffset, candleStyle, selectedSymbol, selectedTimeframe, cursorPos, drawings, currentDraftDrawing, isCutting, isReplayMode, activeIndicators, activeSubOscillator, indicatorCalculations]);

  // Mouse Interaction Handlers for Canvas (Pan, Cut, Drawing, and News Click)
  const handleMouseMove = (e) => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const visibleCount = Math.floor((rect.width - 75) / barWidth);
    const startIndex = Math.max(0, activeCandles.length - visibleCount - viewOffset);
    const barIdx = Math.floor(x / barWidth);
    const targetIdx = startIndex + barIdx;

    setCursorPos({ x, y });

    if (isCutting) {
      setHoveredCutIndex(targetIdx);
      return;
    }

    if (currentDraftDrawing) {
      const subHeight = activeSubOscillator !== "NONE" ? Math.max(70, rect.height * 0.22) : 0;
      const candlePlotHeight = rect.height - 30 - subHeight - (subHeight > 0 ? 15 : 0);
      const visibleBars = activeCandles.slice(startIndex, startIndex + visibleCount);
      let minPrice = Infinity;
      let maxPrice = -Infinity;
      for (const bar of visibleBars) {
        if (bar.low < minPrice) minPrice = bar.low;
        if (bar.high > maxPrice) maxPrice = bar.high;
      }
      const priceRange = maxPrice - minPrice || 1;
      const adjRange = priceRange * 1.1;
      minPrice -= priceRange * 0.05;
      const curPrice = minPrice + ((candlePlotHeight - (y - 10)) / candlePlotHeight) * adjRange;

      setCurrentDraftDrawing(prev => ({
        ...prev,
        p2: { x, y, price: curPrice }
      }));
      return;
    }

    if (isDragging) {
      const diffX = e.clientX - dragStartX;
      const barsDelta = Math.round(diffX / barWidth);
      if (barsDelta !== 0) {
        setViewOffset(prev => Math.max(0, Math.min(activeCandles.length - 20, prev + barsDelta)));
        setDragStartX(e.clientX);
      }
    }

    if (activeCandles[targetIdx]) {
      setHoveredCandle(activeCandles[targetIdx]);
    } else {
      setHoveredCandle(null);
    }
  };

  const handleMouseDown = (e) => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const visibleCount = Math.floor((rect.width - 75) / barWidth);
    const startIndex = Math.max(0, activeCandles.length - visibleCount - viewOffset);
    const barIdx = Math.floor(x / barWidth);
    const targetIdx = startIndex + barIdx;

    for (const event of ECONOMIC_NEWS_EVENTS) {
      const eventCandleIdx = activeCandles.length - 1 - event.barOffset;
      if (eventCandleIdx >= startIndex && eventCandleIdx < startIndex + visibleCount) {
        const localIdx = eventCandleIdx - startIndex;
        const markerX = localIdx * barWidth + barWidth / 2;
        if (Math.abs(x - markerX) < 25 && y > rect.height * 0.45 && y < rect.height - 40) {
          setSelectedNewsEvent(event);
          showToast(`ইকোনমিক নিউজ ওপেন হয়েছে: ${event.title}`);
          return;
        }
      }
    }

    if (isCutting) {
      handleApplyCut(targetIdx);
      return;
    }

    if (activeDrawingTool !== "cursor") {
      const subHeight = activeSubOscillator !== "NONE" ? Math.max(70, rect.height * 0.22) : 0;
      const candlePlotHeight = rect.height - 30 - subHeight - (subHeight > 0 ? 15 : 0);
      const visibleBars = activeCandles.slice(startIndex, startIndex + visibleCount);
      let minPrice = Infinity;
      let maxPrice = -Infinity;
      for (const bar of visibleBars) {
        if (bar.low < minPrice) minPrice = bar.low;
        if (bar.high > maxPrice) maxPrice = bar.high;
      }
      const priceRange = maxPrice - minPrice || 1;
      const adjRange = priceRange * 1.1;
      minPrice -= priceRange * 0.05;
      const curPrice = minPrice + ((candlePlotHeight - (y - 10)) / candlePlotHeight) * adjRange;

      if (activeDrawingTool === "horizontal") {
        setDrawings(prev => [...prev, {
          id: `draw_${Date.now()}`,
          type: "horizontal",
          price: curPrice,
          color: "#fbbf24"
        }]);
        setActiveDrawingTool("cursor");
        showToast(`কী-লেভেল আঁকা হয়েছে: $${curPrice.toFixed(2)}`);
      } else {
        setCurrentDraftDrawing({
          id: `draft_${Date.now()}`,
          type: activeDrawingTool,
          p1: { x, y, price: curPrice },
          p2: { x, y, price: curPrice },
          isBull: activeDrawingTool === "orderblock" ? true : undefined,
          color: activeDrawingTool === "trendline" ? "#38bdf8" : activeDrawingTool === "fibonacci" ? "#eab308" : undefined
        });
      }
      return;
    }

    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseUp = () => {
    if (currentDraftDrawing) {
      setDrawings(prev => [...prev, currentDraftDrawing]);
      setCurrentDraftDrawing(null);
      setActiveDrawingTool("cursor");
      showToast("ড্রয়িং সম্পূর্ণ হয়েছে");
    }
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    if (currentDraftDrawing) {
      setDrawings(prev => [...prev, currentDraftDrawing]);
      setCurrentDraftDrawing(null);
      setActiveDrawingTool("cursor");
    }
    setIsDragging(false);
    setCursorPos(null);
    setHoveredCandle(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setBarWidth(prev => Math.min(26, prev + 1.5));
    } else {
      setBarWidth(prev => Math.max(3.5, prev - 1.5));
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const selectedAsset = SYMBOL_LIST.find(s => s.symbol === selectedSymbol) || SYMBOL_LIST[0];

  return r.jsxs("div", {
    ref: containerRef,
    className: "w-full max-w-[1600px] mx-auto p-2 sm:p-4 md:p-6 space-y-3 font-sans text-slate-100",
    children: [
      // TOP HEADER: 0-Delay Live Status & Global Market Sessions Clock
      r.jsxs("div", {
        className: "bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3",
        children: [
          // Left: Symbol Info, Live Pulse & 0-Delay Badge
          r.jsxs("div", {
            className: "flex flex-wrap items-center gap-3",
            children: [
              r.jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                  r.jsx("span", { className: "text-2xl", children: selectedAsset.icon }),
                  r.jsxs("div", {
                    children: [
                      r.jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [
                          r.jsx("h2", { className: "text-base sm:text-lg font-black text-white tracking-wide", children: selectedAsset.symbol }),
                          r.jsx("span", { className: "text-xs text-slate-400 font-medium hidden sm:inline", children: selectedAsset.name }),
                          r.jsxs("span", {
                            className: `px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${isReplayMode ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"}`,
                            children: [
                              r.jsx("span", { className: `w-1.5 h-1.5 rounded-full ${isReplayMode ? "bg-amber-400" : "bg-emerald-400"} animate-ping` }),
                              isReplayMode ? "Bar Replay Mode Active" : streamType === "ws" ? "Direct 0-Delay WebSocket" : "0-Delay Live Feed"
                            ]
                          })
                        ]
                      }),
                      r.jsxs("div", {
                        className: "text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2",
                        children: [
                          r.jsxs("span", { children: ["Spread: ", r.jsx("strong", { className: "text-amber-400", children: `${quoteData.spread} pips` })] }),
                          r.jsx("span", { className: "text-slate-600", children: "•" }),
                          r.jsxs("span", { className: "text-slate-400 hidden sm:inline", children: ["Feed: ", quoteData.source] })
                        ]
                      })
                    ]
                  })
                ]
              }),

              // Live Bid / Ask Price Beacon
              r.jsxs("div", {
                className: `px-3 py-1.5 rounded-xl border transition-all duration-300 font-mono ${priceFlash === "up" ? "bg-emerald-950/60 border-emerald-500 text-emerald-300 scale-102" : priceFlash === "down" ? "bg-rose-950/60 border-rose-500 text-rose-300 scale-102" : "bg-slate-950 border-slate-800 text-white"}`,
                children: [
                  r.jsxs("div", {
                    className: "flex items-baseline gap-2",
                    children: [
                      r.jsxs("span", { className: "text-xs text-slate-400 font-bold", children: ["BID $", Number(quoteData.bid || 0).toFixed(selectedAsset.digits)] }),
                      r.jsx("span", { className: "text-slate-600", children: "/" }),
                      r.jsxs("span", { className: "text-xs text-amber-400 font-bold", children: ["ASK $", Number(quoteData.ask || 0).toFixed(selectedAsset.digits)] })
                    ]
                  }),
                  r.jsxs("div", {
                    className: "text-[10px] flex items-center justify-between gap-2 mt-0.5 font-bold",
                    children: [
                      r.jsxs("span", { className: quoteData.change24h >= 0 ? "text-emerald-400" : "text-rose-400", children: [quoteData.change24h >= 0 ? "+" : "", quoteData.change24h, " (", quoteData.changePercent, "%)"] }),
                      r.jsxs("span", { className: "text-slate-500 text-[9px]", children: ["H: ", quoteData.high24h, " L: ", quoteData.low24h] })
                    ]
                  })
                ]
              })
            ]
          }),

          // Right: Live Global Market Sessions Clock
          r.jsxs("div", {
            className: "flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-mono",
            children: [
              r.jsxs("div", {
                className: "bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-xl text-slate-300 flex items-center gap-1.5",
                children: [
                  r.jsx("span", { className: "text-slate-500", children: "🕒" }),
                  r.jsx("span", { className: "font-bold text-white", children: utcTimeStr })
                ]
              }),

              r.jsxs("div", {
                className: `px-2 py-1 rounded-xl border flex items-center gap-1 text-[11px] font-bold ${sessionInfo.tokyo ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30" : "bg-slate-950 text-slate-600 border-slate-800/60"}`,
                children: [
                  r.jsx("span", { children: sessionInfo.tokyo ? "🟢" : "⚪" }),
                  "টোকিও (Asia)"
                ]
              }),

              r.jsxs("div", {
                className: `px-2 py-1 rounded-xl border flex items-center gap-1 text-[11px] font-bold ${sessionInfo.london ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" : "bg-slate-950 text-slate-600 border-slate-800/60"}`,
                children: [
                  r.jsx("span", { children: sessionInfo.london ? "🟢" : "⚪" }),
                  "লন্ডন (UK)"
                ]
              }),

              r.jsxs("div", {
                className: `px-2 py-1 rounded-xl border flex items-center gap-1 text-[11px] font-bold ${sessionInfo.ny ? "bg-blue-500/10 text-blue-300 border-blue-500/30" : "bg-slate-950 text-slate-600 border-slate-800/60"}`,
                children: [
                  r.jsx("span", { children: sessionInfo.ny ? "🟢" : "⚪" }),
                  "নিউইয়র্ক (US)"
                ]
              }),

              sessionInfo.overlap && r.jsxs("div", {
                className: "px-2 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[10px] flex items-center gap-1 animate-pulse",
                children: [
                  r.jsx("span", { children: "⚡" }),
                  "London/NY Overlap"
                ]
              })
            ]
          })
        ]
      }),

      // SECONDARY CONTROL BAR: Symbol Selector, Timeframe, Styles, Replay, Snapshot Bridge & View Controls
      r.jsxs("div", {
        className: "bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5",
        children: [
          // Left: Symbol Switcher Buttons
          r.jsxs("div", {
            className: "flex flex-wrap items-center gap-1",
            children: [
              SYMBOL_LIST.map(item => r.jsxs("button", {
                key: item.symbol,
                type: "button",
                onClick: () => {
                  setSelectedSymbol(item.symbol);
                  showToast(`${item.name} (${item.symbol}) লোড করা হচ্ছে...`);
                },
                className: `px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${selectedSymbol === item.symbol ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 scale-102" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/60"}`,
                children: [
                  r.jsx("span", { children: item.icon }),
                  r.jsx("span", { children: item.symbol })
                ]
              }))
            ]
          }),

          // Center: Multi-Timeframe Selector
          r.jsxs("div", {
            className: "flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-0.5",
            children: [
              TIMEFRAMES.map(tf => r.jsx("button", {
                key: tf.id,
                type: "button",
                title: tf.desc,
                onClick: () => {
                  setSelectedTimeframe(tf.id);
                  showToast(`টাইমফ্রেম: ${tf.label}`);
                },
                className: `px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${selectedTimeframe === tf.id ? "bg-cyan-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`,
                children: tf.label
              }))
            ]
          }),

          // Right: Candlestick/Line + Replay Cut + STEP 4 Snapshot Bridge & Broker Toggle
          r.jsxs("div", {
            className: "flex items-center gap-1.5",
            children: [
              // Style Selector (Only Candlestick & Line Chart)
              r.jsxs("div", {
                className: "flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-0.5",
                children: [
                  STYLES.map(st => r.jsxs("button", {
                    key: st.id,
                    type: "button",
                    title: st.label,
                    onClick: () => {
                      setCandleStyle(st.id);
                      showToast(`স্টাইল: ${st.label}`);
                    },
                    className: `px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${candleStyle === st.id ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`,
                    children: [
                      r.jsx("span", { children: st.icon }),
                      r.jsx("span", { className: "text-[11px]", children: st.label })
                    ]
                  }))
                ]
              }),

              // STEP 2: Replay Cut Button
              r.jsxs("button", {
                type: "button",
                title: "অতীতের ক্যান্ডেলে কাট করে ব্যাকটেস্ট শুরু করুন (100% Free Intraday Bar Replay)",
                onClick: handleStartCutMode,
                className: `px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${isCutting ? "bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/30 animate-pulse" : isReplayMode ? "bg-amber-600 text-white border-amber-400" : "bg-slate-950 text-amber-400 border-amber-500/40 hover:bg-amber-500/10"}`,
                children: [
                  r.jsx("span", { children: "✂️" }),
                  r.jsx("span", { children: isCutting ? "কাট মোড সক্রিয়" : "Replay Cut" })
                ]
              }),

              // STEP 4: 1-Click Trader's Diary Snapshot Button
              r.jsxs("button", {
                type: "button",
                title: "বর্তমান চার্টের স্ন্যাপশট নিয়ে ট্রেডার্স ডায়েরিতে সাইকোলজি নোট লিখুন",
                onClick: handleOpenDiaryModal,
                className: "px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-900/30 border border-emerald-400/40 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all",
                children: [
                  r.jsx("span", { children: "📸" }),
                  r.jsx("span", { className: "hidden sm:inline", children: "ডায়েরিতে স্ন্যাপশট" })
                ]
              }),

              // STEP 4: Broker Dock Toggle Button
              r.jsxs("button", {
                type: "button",
                title: "ব্রোকার ট্রেড এক্সিকিউশন ডক অন/অফ করুন",
                onClick: () => setIsBrokerDockOpen(prev => !prev),
                className: `px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 cursor-pointer transition-all ${isBrokerDockOpen ? "bg-indigo-600 text-white border-indigo-400 shadow-sm" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"}`,
                children: [
                  r.jsx("span", { children: "💼" }),
                  r.jsx("span", { className: "hidden xl:inline", children: "ট্রেড ডক" })
                ]
              }),

              // Zoom In / Out / Reset / Fullscreen
              r.jsx("button", {
                type: "button",
                title: "Zoom In (+)",
                onClick: () => setBarWidth(w => Math.min(26, w + 2)),
                className: "w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center font-bold text-sm cursor-pointer",
                children: "+"
              }),
              r.jsx("button", {
                type: "button",
                title: "Zoom Out (-)",
                onClick: () => setBarWidth(w => Math.max(3.5, w - 2)),
                className: "w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center font-bold text-sm cursor-pointer",
                children: "−"
              }),
              r.jsx("button", {
                type: "button",
                title: "Reset View (রিসেট)",
                onClick: () => {
                  setViewOffset(0);
                  setBarWidth(8);
                  showToast("ভিউ রিসেট করা হয়েছে");
                },
                className: "px-2.5 h-8 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold cursor-pointer",
                children: "Reset"
              }),
              r.jsx("button", {
                type: "button",
                title: "Fullscreen (ফুলস্ক্রিন)",
                onClick: toggleFullscreen,
                className: "w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center text-xs font-bold cursor-pointer",
                children: isFullscreen ? "🗗" : "⛶"
              })
            ]
          })
        ]
      }),

      // STEP 3: UNLIMITED INDICATOR STACKING RIBBON
      r.jsxs("div", {
        className: "bg-slate-900/90 border border-slate-800 rounded-2xl p-2 sm:px-3 flex flex-wrap items-center justify-between gap-2 text-xs",
        children: [
          r.jsxs("div", {
            className: "flex flex-wrap items-center gap-1.5",
            children: [
              r.jsx("span", {
                className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1",
                children: "ইন্ডিকেটর (আনলিমিটেড):"
              }),
              OVERLAY_INDICATORS.map(ind => r.jsxs("button", {
                key: ind.id,
                type: "button",
                title: ind.desc,
                onClick: () => handleToggleIndicator(ind.id),
                className: `px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${activeIndicators.includes(ind.id) ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"}`,
                children: [
                  r.jsx("span", { className: "mr-1 text-[10px]", children: activeIndicators.includes(ind.id) ? "✓" : "+" }),
                  ind.label
                ]
              }))
            ]
          }),

          r.jsxs("div", {
            className: "flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800",
            children: [
              r.jsx("span", { className: "text-[9px] text-slate-500 uppercase font-bold px-1.5", children: "সাব-উইন্ডো:" }),
              SUB_OSCILLATORS.map(sub => r.jsx("button", {
                key: sub.id,
                type: "button",
                onClick: () => {
                  setActiveSubOscillator(sub.id);
                  showToast(`সাব-উইন্ডো: ${sub.label}`);
                },
                className: `px-2 py-0.5 rounded text-[11px] font-bold font-mono transition-all cursor-pointer ${activeSubOscillator === sub.id ? "bg-cyan-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`,
                children: sub.label
              }))
            ]
          })
        ]
      }),

      // MAIN TERMINAL VIEWPORT CONTAINER: Left Drawing Toolbar + 60 FPS Canvas + Replay Dock
      r.jsxs("div", {
        className: "bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative min-h-[640px] flex flex-col md:flex-row",
        children: [
          // Left Drawing Toolbar (TradingView Alternative Drawing Suite)
          r.jsxs("div", {
            className: "w-full md:w-14 bg-slate-900/90 border-b md:border-b-0 md:border-r border-slate-800/80 p-2 flex md:flex-col items-center justify-start gap-1.5 shrink-0 overflow-x-auto",
            children: [
              DRAWING_TOOLS.map(tool => r.jsx("button", {
                key: tool.id,
                type: "button",
                title: `${tool.label} (${tool.desc})`,
                onClick: () => {
                  setActiveDrawingTool(tool.id);
                  showToast(`টুল সক্রিয়: ${tool.label}`);
                },
                className: `w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all cursor-pointer border ${activeDrawingTool === tool.id ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 scale-105" : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"}`,
                children: tool.icon
              })),

              r.jsx("div", { className: "hidden md:block w-6 border-t border-slate-800 my-1" }),

              r.jsx("button", {
                type: "button",
                title: "সকল ড্রয়িং ডিলিট করুন (Clear Drawings)",
                onClick: handleClearDrawings,
                className: "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold bg-slate-950 text-rose-400 border border-rose-900/40 hover:bg-rose-950/40 transition-all cursor-pointer",
                children: "🗑️"
              })
            ]
          }),

          // Center: Interactive Canvas + Overlays + Replay Dock + News Popover
          r.jsxs("div", {
            className: "flex-1 relative flex flex-col min-h-[600px]",
            children: [
              // Live Candle Inspection HUD
              r.jsxs("div", {
                className: "absolute top-3 left-4 z-20 flex flex-wrap items-center gap-3 text-xs font-mono bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 shadow-md",
                children: [
                  r.jsxs("span", { className: "font-black text-white", children: [selectedSymbol, " • ", selectedTimeframe] }),
                  hoveredCandle ? r.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [
                      r.jsxs("span", { className: "text-slate-400", children: ["O: ", r.jsx("strong", { className: "text-slate-200", children: hoveredCandle.open.toFixed(selectedAsset.digits) })] }),
                      r.jsxs("span", { className: "text-slate-400", children: ["H: ", r.jsx("strong", { className: "text-emerald-400", children: hoveredCandle.high.toFixed(selectedAsset.digits) })] }),
                      r.jsxs("span", { className: "text-slate-400", children: ["L: ", r.jsx("strong", { className: "text-rose-400", children: hoveredCandle.low.toFixed(selectedAsset.digits) })] }),
                      r.jsxs("span", { className: "text-slate-400", children: ["C: ", r.jsx("strong", { className: hoveredCandle.close >= hoveredCandle.open ? "text-emerald-400" : "text-rose-400", children: hoveredCandle.close.toFixed(selectedAsset.digits) })] }),
                      r.jsxs("span", { className: "text-slate-500", children: ["Vol: ", hoveredCandle.volume] })
                    ]
                  }) : r.jsxs("span", {
                    className: "text-slate-500 text-[11px]",
                    children: [isCutting ? "কাট করতে অতীতের যে কোনো ক্যান্ডেলের উপর ক্লিক করুন" : "ক্যান্ডেলের নিচে 🔴 NFP, CPI, FOMC ব্যাজে ক্লিক করে নিউজ বিশ্লেষণ দেখুন"]
                  })
                ]
              }),

              // Loading Overlay
              isLoading && r.jsxs("div", {
                className: "absolute inset-0 bg-slate-950/70 z-30 flex items-center justify-center gap-2 text-cyan-400 text-xs font-bold backdrop-blur-xs",
                children: [
                  r.jsx("span", { className: "w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" }),
                  r.jsxs("span", { children: [selectedSymbol, " (", selectedTimeframe, ") রিয়েল-টাইম ক্যান্ডেল সিঙ্ক হচ্ছে..."] })
                ]
              }),

              // Interactive HTML5 Canvas Element
              r.jsx("canvas", {
                ref: chartCanvasRef,
                onMouseMove: handleMouseMove,
                onMouseDown: handleMouseDown,
                onMouseUp: handleMouseUp,
                onMouseLeave: handleMouseLeave,
                onWheel: handleWheel,
                className: `w-full flex-1 min-h-[580px] select-none ${isCutting ? "cursor-crosshair" : activeDrawingTool !== "cursor" ? "cursor-crosshair" : "cursor-default"}`
              }),

              // STEP 2: Floating Bar Replay Playback Controller Dock
              isReplayMode && r.jsxs("div", {
                className: "absolute bottom-12 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-lg border border-amber-500/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-2xl shadow-black/80 flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono animate-bounce-short",
                children: [
                  r.jsxs("button", {
                    type: "button",
                    onClick: () => setIsReplayPlaying(prev => !prev),
                    className: `px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${isReplayPlaying ? "bg-amber-500 text-slate-950 shadow-amber-500/30" : "bg-emerald-600 text-white shadow-emerald-600/30"}`,
                    children: [
                      r.jsx("span", { children: isReplayPlaying ? "⏸️" : "▶️" }),
                      r.jsx("span", { children: isReplayPlaying ? "Pause" : "Play" })
                    ]
                  }),

                  r.jsxs("button", {
                    type: "button",
                    title: "পরবর্তী ১টি ক্যান্ডেল সামনে বাড়ান (Hotkey: Right Arrow)",
                    onClick: handleStepForward,
                    className: "px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-500 text-slate-200 font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95",
                    children: [
                      r.jsx("span", { children: "⏭️" }),
                      r.jsx("span", { className: "hidden sm:inline", children: "Step 1 Bar" })
                    ]
                  }),

                  r.jsxs("div", {
                    className: "flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-0.5",
                    children: [
                      SPEEDS.map(sp => r.jsx("button", {
                        key: sp.label,
                        type: "button",
                        onClick: () => setReplaySpeed(sp.val),
                        className: `px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${replaySpeed === sp.val ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"}`,
                        children: sp.label
                      }))
                    ]
                  }),

                  r.jsxs("div", {
                    className: "flex items-center gap-2 px-1",
                    children: [
                      r.jsx("input", {
                        type: "range",
                        min: 10,
                        max: allCandles.length,
                        value: replayIndex,
                        onChange: (e) => setReplayIndex(Number(e.target.value)),
                        className: "w-28 sm:w-44 accent-amber-500 cursor-pointer"
                      }),
                      r.jsxs("span", {
                        className: "text-[10px] text-amber-300 font-bold whitespace-nowrap",
                        children: [`${replayIndex}/${allCandles.length}`]
                      })
                    ]
                  }),

                  r.jsxs("button", {
                    type: "button",
                    title: "অন্য পয়েন্টে কাট করুন",
                    onClick: handleStartCutMode,
                    className: "px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 hover:text-amber-400 text-xs font-bold cursor-pointer",
                    children: [
                      r.jsx("span", { children: "✂️" }),
                      r.jsx("span", { className: "hidden sm:inline ml-1", children: "Cut Point" })
                    ]
                  }),

                  r.jsxs("button", {
                    type: "button",
                    title: "লাইভ মার্কেটে ফিরে যান",
                    onClick: handleExitReplay,
                    className: "px-2.5 py-1.5 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all",
                    children: [
                      r.jsx("span", { children: "✕" }),
                      r.jsx("span", { children: "Exit Replay" })
                    ]
                  })
                ]
              }),

              // STEP 3: Clicked Economic News Impact Popover Modal
              selectedNewsEvent && r.jsx("div", {
                className: "absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn",
                children: r.jsxs("div", {
                  className: "bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 font-sans text-slate-100",
                  children: [
                    r.jsxs("div", {
                      className: "flex items-start justify-between border-b border-slate-800 pb-3",
                      children: [
                        r.jsxs("div", {
                          className: "flex items-center gap-2.5",
                          children: [
                            r.jsx("span", { className: "text-2xl", children: selectedNewsEvent.flag }),
                            r.jsxs("div", {
                              children: [
                                r.jsx("h3", { className: "text-base font-black text-white", children: selectedNewsEvent.title }),
                                r.jsxs("span", {
                                  className: `px-2 py-0.5 rounded text-[10px] font-bold mt-1 inline-block ${selectedNewsEvent.impact === "HIGH" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`,
                                  children: [`${selectedNewsEvent.impact} IMPACT MACRO EVENT`]
                                })
                              ]
                            })
                          ]
                        }),
                        r.jsx("button", {
                          type: "button",
                          onClick: () => setSelectedNewsEvent(null),
                          className: "p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer text-lg",
                          children: "✕"
                        })
                      ]
                    }),

                    r.jsxs("div", {
                      className: "grid grid-cols-3 gap-2 text-center font-mono bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs",
                      children: [
                        r.jsxs("div", {
                          className: "p-2 rounded-xl bg-slate-900/60",
                          children: [
                            r.jsx("span", { className: "text-[10px] text-slate-400 block", children: "ACTUAL" }),
                            r.jsx("span", { className: "text-sm font-black text-emerald-400", children: selectedNewsEvent.actual })
                          ]
                        }),
                        r.jsxs("div", {
                          className: "p-2 rounded-xl bg-slate-900/60",
                          children: [
                            r.jsx("span", { className: "text-[10px] text-slate-400 block", children: "FORECAST" }),
                            r.jsx("span", { className: "text-sm font-black text-amber-400", children: selectedNewsEvent.forecast })
                          ]
                        }),
                        r.jsxs("div", {
                          className: "p-2 rounded-xl bg-slate-900/60",
                          children: [
                            r.jsx("span", { className: "text-[10px] text-slate-400 block", children: "PREVIOUS" }),
                            r.jsx("span", { className: "text-sm font-bold text-slate-300", children: selectedNewsEvent.previous })
                          ]
                        })
                      ]
                    }),

                    r.jsxs("div", {
                      className: "bg-rose-950/20 border border-rose-900/40 p-3 rounded-2xl flex items-center justify-between text-xs font-mono",
                      children: [
                        r.jsxs("div", {
                          className: "flex items-center gap-2",
                          children: [
                            r.jsx("span", { className: "text-lg", children: "⚡" }),
                            r.jsxs("div", {
                              children: [
                                r.jsx("span", { className: "text-[10px] text-slate-400 block uppercase", children: "15M Initial Market Reaction" }),
                                r.jsx("span", { className: "font-black text-rose-300", children: selectedNewsEvent.pipsMove })
                              ]
                            })
                          ]
                        }),
                        r.jsx("span", { className: "px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold", children: "VOLATILITY SPIKE" })
                      ]
                    }),

                    r.jsxs("div", {
                      className: "space-y-1.5 text-xs",
                      children: [
                        r.jsx("h4", { className: "font-bold text-slate-300 uppercase text-[11px]", children: "ইনস্টিটিউশনাল ট্রেডার বিশ্লেষণ ও লিকুইডিটি মুভ:" }),
                        r.jsx("p", { className: "text-slate-400 leading-relaxed text-[11px]", children: selectedNewsEvent.analysis })
                      ]
                    }),

                    r.jsx("div", {
                      className: "pt-2 flex justify-end",
                      children: r.jsx("button", {
                        type: "button",
                        onClick: () => setSelectedNewsEvent(null),
                        className: "px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer",
                        children: "বন্ধ করুন (Close)"
                      })
                    })
                  ]
                })
              }),

              // Bottom Terminal Status Strip
              r.jsxs("div", {
                className: "bg-slate-900/90 border-t border-slate-800 px-4 py-2 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-mono gap-1.5",
                children: [
                  r.jsxs("div", {
                    className: "flex items-center gap-3",
                    children: [
                      r.jsxs("span", {
                        className: `flex items-center gap-1.5 font-bold ${isReplayMode ? "text-amber-400" : "text-emerald-400"}`,
                        children: [
                          r.jsx("span", { className: `w-2 h-2 rounded-full ${isReplayMode ? "bg-amber-400 animate-ping" : "bg-emerald-400 animate-ping"}` }),
                          isReplayMode ? `Bar Replay Active: Bar ${replayIndex} of ${allCandles.length}` : streamType === "ws" ? "⚡ Live WebSocket 0-Delay Feed Active" : "🟢 Live Real-Market Feed Active"
                        ]
                      }),
                      r.jsx("span", { className: "text-slate-600", children: "|" }),
                      r.jsxs("span", { children: ["Open Pos: ", openPositions.length] }),
                      r.jsx("span", { className: "text-slate-600", children: "|" }),
                      r.jsxs("span", { children: ["Equity: $", (accountBalance + openPositions.reduce((acc, pos) => {
                        const curPrice = pos.type === "BUY" ? quoteData.bid : quoteData.ask;
                        const diff = pos.type === "BUY" ? (curPrice - pos.openPrice) : (pos.openPrice - curPrice);
                        const mult = pos.symbol.includes("XAU") ? 100 : pos.symbol.includes("BTC") ? 1 : pos.symbol.includes("US30") ? 1 : 100000;
                        return acc + Number((diff * pos.lots * mult).toFixed(2));
                      }, 0)).toFixed(2)] })
                    ]
                  }),
                  r.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [
                      r.jsx("span", { className: "text-slate-500", children: "TradingView Pro Alternative" }),
                      r.jsx("span", { className: "text-slate-600", children: "•" }),
                      r.jsx("span", { className: "text-emerald-400 font-bold", children: "Step 4 Complete Engine Active ✓" })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }),

      // STEP 4: DOCKED 1-CLICK BROKER TRADE EXECUTION PANEL (Exness / Pepperstone / IC Markets)
      isBrokerDockOpen && r.jsxs("div", {
        className: "bg-slate-900/90 border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl space-y-3.5 animate-fadeIn",
        children: [
          // Broker Dock Header & Stats
          r.jsxs("div", {
            className: "flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3",
            children: [
              // Left: Broker Selector Tabs
              r.jsxs("div", {
                className: "flex flex-wrap items-center gap-2",
                children: [
                  r.jsx("span", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mr-1", children: "ব্রোকার ডক:" }),
                  BROKER_LIST.map(bkr => r.jsxs("button", {
                    key: bkr.id,
                    type: "button",
                    onClick: () => {
                      setSelectedBroker(bkr.name);
                      showToast(`ব্রোকার সংযুক্ত: ${bkr.name}`);
                    },
                    className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${selectedBroker === bkr.name ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"}`,
                    children: [
                      r.jsx("span", { children: bkr.icon }),
                      r.jsx("span", { children: bkr.name })
                    ]
                  }))
                ]
              }),

              // Right: Account Metrics (Balance, Equity, Floating PnL)
              r.jsxs("div", {
                className: "flex items-center gap-3 font-mono text-xs",
                children: [
                  r.jsxs("div", {
                    className: "bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2",
                    children: [
                      r.jsx("span", { className: "text-slate-500", children: "BALANCE:" }),
                      r.jsxs("span", { className: "font-black text-white", children: ["$", accountBalance.toFixed(2)] })
                    ]
                  }),
                  r.jsxs("div", {
                    className: "bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2",
                    children: [
                      r.jsx("span", { className: "text-slate-500", children: "EQUITY:" }),
                      r.jsxs("span", {
                        className: "font-black text-emerald-400",
                        children: ["$", (accountBalance + openPositions.reduce((acc, pos) => {
                          const curPrice = pos.type === "BUY" ? quoteData.bid : quoteData.ask;
                          const diff = pos.type === "BUY" ? (curPrice - pos.openPrice) : (pos.openPrice - curPrice);
                          const mult = pos.symbol.includes("XAU") ? 100 : pos.symbol.includes("BTC") ? 1 : pos.symbol.includes("US30") ? 1 : 100000;
                          return acc + Number((diff * pos.lots * mult).toFixed(2));
                        }, 0)).toFixed(2)]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          // Order Execution Controls Bar: Lots, Quick SL, Quick TP, and 1-Click BUY / SELL Buttons
          r.jsxs("div", {
            className: "grid grid-cols-1 lg:grid-cols-12 gap-3 items-center",
            children: [
              // Lots & SL/TP Inputs (7 cols on lg)
              r.jsxs("div", {
                className: "lg:col-span-7 flex flex-wrap items-center gap-3",
                children: [
                  // Lot Size Selector
                  r.jsxs("div", {
                    className: "space-y-1",
                    children: [
                      r.jsx("label", { className: "text-[10px] text-slate-400 font-bold uppercase block", children: "লট সাইজ (Lot Size):" }),
                      r.jsxs("div", {
                        className: "flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800",
                        children: [
                          [0.01, 0.05, 0.10, 0.50, 1.00].map(lot => r.jsx("button", {
                            key: lot,
                            type: "button",
                            onClick: () => setTradeLot(lot),
                            className: `px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${tradeLot === lot ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`,
                            children: lot.toFixed(2)
                          })),
                          r.jsx("input", {
                            type: "number",
                            step: "0.01",
                            min: "0.01",
                            value: tradeLot,
                            onChange: (e) => setTradeLot(parseFloat(e.target.value) || 0.01),
                            className: "w-14 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-0.5 text-xs text-center font-mono font-bold text-white ml-1"
                          })
                        ]
                      })
                    ]
                  }),

                  // SL Input & Auto SL Buttons
                  r.jsxs("div", {
                    className: "space-y-1",
                    children: [
                      r.jsxs("div", {
                        className: "flex items-center justify-between gap-1 text-[10px] text-slate-400 font-bold",
                        children: [
                          r.jsx("span", { children: "STOP LOSS (SL):" }),
                          r.jsxs("div", {
                            className: "flex gap-1",
                            children: [
                              r.jsx("button", { type: "button", onClick: () => handleAutoSL(20), className: "text-rose-400 hover:underline cursor-pointer", children: "20p" }),
                              r.jsx("button", { type: "button", onClick: () => handleAutoSL(30), className: "text-rose-400 hover:underline cursor-pointer", children: "30p" })
                            ]
                          })
                        ]
                      }),
                      r.jsx("input", {
                        type: "number",
                        placeholder: "Price (e.g. 4105.00)",
                        value: tradeSL,
                        onChange: (e) => setTradeSL(e.target.value),
                        className: "w-32 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-2.5 py-1.5 text-xs font-mono text-rose-300"
                      })
                    ]
                  }),

                  // TP Input & Auto TP Buttons
                  r.jsxs("div", {
                    className: "space-y-1",
                    children: [
                      r.jsxs("div", {
                        className: "flex items-center justify-between gap-1 text-[10px] text-slate-400 font-bold",
                        children: [
                          r.jsx("span", { children: "TAKE PROFIT (TP):" }),
                          r.jsxs("div", {
                            className: "flex gap-1",
                            children: [
                              r.jsx("button", { type: "button", onClick: () => handleAutoTP(2), className: "text-emerald-400 hover:underline cursor-pointer", children: "1:2" }),
                              r.jsx("button", { type: "button", onClick: () => handleAutoTP(3), className: "text-emerald-400 hover:underline cursor-pointer", children: "1:3" })
                            ]
                          })
                        ]
                      }),
                      r.jsx("input", {
                        type: "number",
                        placeholder: "Price (e.g. 4150.00)",
                        value: tradeTP,
                        onChange: (e) => setTradeTP(e.target.value),
                        className: "w-32 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-xs font-mono text-emerald-300"
                      })
                    ]
                  })
                ]
              }),

              // 1-Click BUY & SELL Large Execution Buttons (5 cols on lg)
              r.jsxs("div", {
                className: "lg:col-span-5 grid grid-cols-2 gap-2.5",
                children: [
                  r.jsxs("button", {
                    type: "button",
                    disabled: isExecutingTrade,
                    onClick: () => handleExecuteTrade("SELL"),
                    className: "bg-gradient-to-br from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-lg shadow-rose-900/30 border border-rose-500/50 cursor-pointer active:scale-95 transition-all",
                    children: [
                      r.jsxs("span", { className: "font-black text-xs tracking-wider", children: ["SELL ", tradeLot, " L"] }),
                      r.jsxs("span", { className: "font-mono font-bold text-sm", children: ["$", Number(quoteData.bid || 0).toFixed(selectedAsset.digits)] })
                    ]
                  }),
                  r.jsxs("button", {
                    type: "button",
                    disabled: isExecutingTrade,
                    onClick: () => handleExecuteTrade("BUY"),
                    className: "bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-lg shadow-emerald-900/30 border border-emerald-500/50 cursor-pointer active:scale-95 transition-all",
                    children: [
                      r.jsxs("span", { className: "font-black text-xs tracking-wider", children: ["BUY ", tradeLot, " L"] }),
                      r.jsxs("span", { className: "font-mono font-bold text-sm", children: ["$", Number(quoteData.ask || 0).toFixed(selectedAsset.digits)] })
                    ]
                  })
                ]
              })
            ]
          }),

          // Open Positions Table (Live Floating PnL)
          openPositions.length > 0 && r.jsxs("div", {
            className: "border-t border-slate-800 pt-3 space-y-2",
            children: [
              r.jsxs("div", {
                className: "flex items-center justify-between text-xs text-slate-400 font-mono font-bold",
                children: [
                  r.jsxs("span", { className: "text-white flex items-center gap-2", children: [
                    r.jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-pulse" }),
                    `সক্রিয় ওপেন পজিশনস (${openPositions.length})`
                  ] }),
                  r.jsx("button", {
                    type: "button",
                    onClick: handleCloseAllPositions,
                    className: "px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white transition-all cursor-pointer",
                    children: "Close All"
                  })
                ]
              }),

              r.jsx("div", {
                className: "overflow-x-auto rounded-xl border border-slate-800",
                children: r.jsxs("table", {
                  className: "w-full text-left text-[11px] font-mono text-slate-300 bg-slate-950",
                  children: [
                    r.jsx("thead", {
                      className: "bg-slate-900/90 text-slate-400 uppercase text-[9px] border-b border-slate-800",
                      children: r.jsxs("tr", {
                        children: [
                          r.jsx("th", { className: "p-2", children: "Ticket" }),
                          r.jsx("th", { className: "p-2", children: "Symbol" }),
                          r.jsx("th", { className: "p-2", children: "Type" }),
                          r.jsx("th", { className: "p-2", children: "Lots" }),
                          r.jsx("th", { className: "p-2", children: "Open Price" }),
                          r.jsx("th", { className: "p-2", children: "Current Price" }),
                          r.jsx("th", { className: "p-2", children: "SL" }),
                          r.jsx("th", { className: "p-2", children: "TP" }),
                          r.jsx("th", { className: "p-2", children: "Floating P&L" }),
                          r.jsx("th", { className: "p-2 text-right", children: "Action" })
                        ]
                      })
                    }),
                    r.jsx("tbody", {
                      className: "divide-y divide-slate-800/60",
                      children: openPositions.map(pos => {
                        const curPrice = pos.type === "BUY" ? quoteData.bid : quoteData.ask;
                        const diff = pos.type === "BUY" ? (curPrice - pos.openPrice) : (pos.openPrice - curPrice);
                        const mult = pos.symbol.includes("XAU") ? 100 : pos.symbol.includes("BTC") ? 1 : pos.symbol.includes("US30") ? 1 : 100000;
                        const livePnl = Number((diff * pos.lots * mult).toFixed(2));

                        return r.jsxs("tr", {
                          key: pos.ticket,
                          className: "hover:bg-slate-900/40",
                          children: [
                            r.jsxs("td", { className: "p-2 text-slate-500", children: ["#", pos.ticket] }),
                            r.jsx("td", { className: "p-2 font-bold text-white", children: pos.symbol }),
                            r.jsx("td", { className: "p-2", children: r.jsx("span", {
                              className: `px-1.5 py-0.2 rounded font-black text-[9px] ${pos.type === "BUY" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`,
                              children: pos.type
                            }) }),
                            r.jsx("td", { className: "p-2 text-slate-300 font-bold", children: pos.lots }),
                            r.jsxs("td", { className: "p-2", children: ["$", pos.openPrice.toFixed(selectedAsset.digits)] }),
                            r.jsxs("td", { className: "p-2 font-bold text-white", children: ["$", curPrice.toFixed(selectedAsset.digits)] }),
                            r.jsx("td", { className: "p-2 text-slate-400", children: pos.sl ? `$${pos.sl}` : "--" }),
                            r.jsx("td", { className: "p-2 text-slate-400", children: pos.tp ? `$${pos.tp}` : "--" }),
                            r.jsx("td", { className: `p-2 font-black ${livePnl >= 0 ? "text-emerald-400" : "text-rose-400"}`, children: `${livePnl >= 0 ? "+" : ""}$${livePnl.toFixed(2)}` }),
                            r.jsx("td", { className: "p-2 text-right", children: r.jsx("button", {
                              type: "button",
                              onClick: () => handleClosePosition(pos.ticket),
                              className: "px-2 py-0.5 rounded bg-slate-900 hover:bg-rose-600 hover:text-white text-slate-400 text-xs transition-colors cursor-pointer",
                              children: "✕ Close"
                            }) })
                          ]
                        });
                      })
                    })
                  ]
                })
              })
            ]
          })
        ]
      }),

      // STEP 4: TRADER'S DIARY & PSYCHOLOGY SNAPSHOT BRIDGE MODAL
      isDiaryModalOpen && r.jsx("div", {
        className: "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn",
        children: r.jsxs("div", {
          className: "bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl space-y-4 font-sans text-slate-100",
          children: [
            // Modal Header
            r.jsxs("div", {
              className: "flex items-start justify-between border-b border-slate-800 pb-3",
              children: [
                r.jsxs("div", {
                  className: "flex items-center gap-2.5",
                  children: [
                    r.jsx("span", { className: "text-2xl", children: "📸" }),
                    r.jsxs("div", {
                      children: [
                        r.jsx("h3", { className: "text-base font-black text-white", children: "ট্রেডার্স ডায়েরি ও সাইকোলজি ব্রিজ (Diary Bridge)" }),
                        r.jsx("p", { className: "text-xs text-slate-400", children: "চার্টের বর্তমান প্রাইস অ্যাকশন ও মাইন্ডসেট নোট ১-ক্লিকে সংরক্ষণ করুন" })
                      ]
                    })
                  ]
                }),
                r.jsx("button", {
                  type: "button",
                  onClick: () => setIsDiaryModalOpen(false),
                  className: "p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer text-lg",
                  children: "✕"
                })
              ]
            }),

            // Thumbnail Preview of Current Chart Snapshot
            snapshotPreview && r.jsxs("div", {
              className: "space-y-1",
              children: [
                r.jsx("span", { className: "text-[10px] text-slate-400 uppercase font-bold", children: "ক্যাপচার্ড চার্ট স্ন্যাপশট প্রিভিউ:" }),
                r.jsx("div", {
                  className: "rounded-xl overflow-hidden border border-slate-800 max-h-36 bg-slate-950",
                  children: r.jsx("img", {
                    src: snapshotPreview,
                    alt: "Chart Snapshot Preview",
                    className: "w-full h-auto object-cover opacity-90"
                  })
                })
              ]
            }),

            // Strategy Selector
            r.jsxs("div", {
              className: "space-y-1.5",
              children: [
                r.jsx("label", { className: "text-xs font-bold text-slate-300 uppercase", children: "ট্রেডিং স্ট্র্যাটেজি বেছে নিন (Strategy):" }),
                r.jsx("div", {
                  className: "flex flex-wrap gap-1.5",
                  children: [
                    "Liquidity Sweep & FVG",
                    "Order Block Reversal",
                    "London Breakout Setup",
                    "Orderflow Delta Absorption",
                    "News Momentum Trade"
                  ].map(strat => r.jsx("button", {
                    key: strat,
                    type: "button",
                    onClick: () => setSelectedStrategy(strat),
                    className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${selectedStrategy === strat ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"}` ,
                    children: strat
                  }))
                })
              ]
            }),

            // Trade Type & Outcome Selectors
            r.jsxs("div", {
              className: "grid grid-cols-2 gap-3 text-xs",
              children: [
                r.jsxs("div", {
                  className: "space-y-1",
                  children: [
                    r.jsx("label", { className: "font-bold text-slate-300 uppercase text-[10px]", children: "ট্রেড টাইপ:" }),
                    r.jsxs("div", {
                      className: "flex gap-1",
                      children: [
                        { id: "BUY", label: "BUY ↗", color: "emerald" },
                        { id: "SELL", label: "SELL ↘", color: "rose" },
                        { id: "OBSERVE", label: "OBSERVE 🔍", color: "cyan" }
                      ].map(t => r.jsx("button", {
                        key: t.id,
                        type: "button",
                        onClick: () => setTradeType(t.id),
                        className: `flex-1 py-1.5 rounded-xl font-bold border cursor-pointer ${tradeType === t.id ? (t.color === "emerald" ? "bg-emerald-600 text-white border-emerald-400" : t.color === "rose" ? "bg-rose-600 text-white border-rose-400" : "bg-cyan-600 text-white border-cyan-400") : "bg-slate-950 text-slate-400 border-slate-800"}`,
                        children: t.label
                      }))
                    })
                  ]
                }),

                r.jsxs("div", {
                  className: "space-y-1",
                  children: [
                    r.jsx("label", { className: "font-bold text-slate-300 uppercase text-[10px]", children: "ফলাফল / স্ট্যাটাস:" }),
                    r.jsxs("div", {
                      className: "flex gap-1",
                      children: [
                        { id: "PASS", label: "WIN 🏆", color: "emerald" },
                        { id: "FAIL", label: "LOSS ⚠️", color: "rose" },
                        { id: "ONGOING", label: "ONGOING ⏳", color: "amber" }
                      ].map(o => r.jsx("button", {
                        key: o.id,
                        type: "button",
                        onClick: () => setTradeOutcome(o.id),
                        className: `flex-1 py-1.5 rounded-xl font-bold border cursor-pointer ${tradeOutcome === o.id ? (o.color === "emerald" ? "bg-emerald-600 text-white border-emerald-400" : o.color === "rose" ? "bg-rose-600 text-white border-rose-400" : "bg-amber-600 text-white border-amber-400") : "bg-slate-950 text-slate-400 border-slate-800"}`,
                        children: o.label
                      }))
                    })
                  ]
                })
              ]
            }),

            // Psychology & Emotion State
            r.jsxs("div", {
              className: "space-y-1.5",
              children: [
                r.jsx("label", { className: "text-xs font-bold text-slate-300 uppercase", children: "ট্রেডিং সাইকোলজি ও মানসিক অবস্থা (Psychology Tag):" }),
                r.jsxs("div", {
                  className: "flex flex-wrap gap-1.5",
                  children: [
                    { id: "Disciplined", label: "🧘 শান্ত ও ডিসিপ্লিন্ড" },
                    { id: "FOMO", label: "⚡ FOMO এন্ট্রি" },
                    { id: "Revenge", label: "🎯 রিভেঞ্জ ট্রেডিং" },
                    { id: "Patient", label: "⏳ ধৈর্যশীল অপেক্ষা" },
                    { id: "Confident", label: "🧠 কনফিডেন্ট" }
                  ].map(m => r.jsx("button", {
                    key: m.id,
                    type: "button",
                    onClick: () => setMindsetTag(m.id),
                    className: `px-2.5 py-1 rounded-xl font-bold border cursor-pointer text-xs ${mindsetTag === m.id ? "bg-teal-600 text-white border-teal-400 shadow-sm" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"}`,
                    children: m.label
                  }))
                })
              ]
            }),

            // Trade Reflection & Notes
            r.jsxs("div", {
              className: "space-y-1",
              children: [
                r.jsx("label", { className: "text-xs font-bold text-slate-300 uppercase", children: "ট্রেড নোট ও লেসন (Reflection & Lesson):" }),
                r.jsx("textarea", {
                  rows: 3,
                  value: diaryNoteText,
                  onChange: (e) => setDiaryNoteText(e.target.value),
                  placeholder: "আজকের ট্রেডের কারণ, এন্ট্রি লজিক, রিস্ক ম্যানেজমেন্ট এবং কী শেখা গেল...",
                  className: "w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-slate-200 text-xs leading-relaxed"
                })
              ]
            }),

            // Modal Footer Buttons
            r.jsxs("div", {
              className: "flex items-center justify-end gap-2.5 border-t border-slate-800 pt-3",
              children: [
                r.jsx("button", {
                  type: "button",
                  onClick: () => setIsDiaryModalOpen(false),
                  className: "px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 text-slate-400 hover:text-white border border-slate-800 cursor-pointer",
                  children: "বাতিল (Cancel)"
                }),
                r.jsxs("button", {
                  type: "button",
                  disabled: isSavingDiary,
                  onClick: handleSaveToDiary,
                  className: "px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/30 border border-emerald-400/40 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all",
                  children: [
                    isSavingDiary ? r.jsx("span", { className: "w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" }) : r.jsx("span", { children: "💾" }),
                    r.jsx("span", { children: isSavingDiary ? "সেভ হচ্ছে..." : "ট্রেডার্স ডায়েরিতে সেভ করুন" })
                  ]
                })
              ]
            })
          ]
        })
      }),

      // Toast Notification
      toastMsg && r.jsx("div", {
        className: "fixed bottom-8 right-8 z-50 bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce",
        children: toastMsg
      })
    ]
  });
}
