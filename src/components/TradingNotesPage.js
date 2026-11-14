// Trader's Diary & Psychology Journal Component
// ChartLogic.pro (Forex AI News V2.2 Enterprise Engine)
// Built specifically on the philosophy: "সোম থেকে শুক্রবার ডায়েরি রাখা, শনি-রবিবার ২ বারের বেশি হওয়া ভুল খুঁজে ট্যাটু রুলস তৈরি করা"

function TradingNotesPage({ page, section, portalType }) {
  const { currentUser: user, language: lang } = Xo();
  const isBn = lang === "bn";
  const s = (bn, en) => (isBn ? bn : en);

  // Active Tab: "daily" | "weekend" | "tattoo" | "monthly" | "playbook"
  const [activeTab, setActiveTab] = b.useState(() => {
    try {
      return sessionStorage.getItem("trading_notes_active_tab") || "daily";
    } catch (e) {
      return "daily";
    }
  });

  // Selected Day in Monday-Friday Log
  const [selectedDay, setSelectedDay] = b.useState("Monday");

  // State
  const [dailyNotes, setDailyNotes] = b.useState([]);
  const [tattooRules, setTattooRules] = b.useState([]);
  const [weeklyAnalysis, setWeeklyAnalysis] = b.useState(null);
  const [strategiesData, setStrategiesData] = b.useState({ myStrategies: [], templates: [] });
  const [playbookSubTab, setPlaybookSubTab] = b.useState("my"); // "my" | "templates"
  const [isStrategyModalOpen, setIsStrategyModalOpen] = b.useState(false);
  const [modalMode, setModalMode] = b.useState("create"); // "create" | "edit" | "clone"
  const [editingStrategy, setEditingStrategy] = b.useState(null);
  const [newChecklistText, setNewChecklistText] = b.useState("");
  const [savingStrategy, setSavingStrategy] = b.useState(false);
  const [loading, setLoading] = b.useState(true);
  const [statusMessage, setStatusMessage] = b.useState("");

  // Input states for active day
  const [newGoodText, setNewGoodText] = b.useState("");
  const [newMistakeText, setNewMistakeText] = b.useState("");
  const [dayNotesText, setDayNotesText] = b.useState("");
  const [mindsetScore, setMindsetScore] = b.useState(8);
  const [tradesCount, setTradesCount] = b.useState(2);

  // Custom Tattoo Rule input
  const [customTattooText, setCustomTattooText] = b.useState("");
  const [customTattooCategory, setCustomTattooCategory] = b.useState("FOMO");

  const showToast = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(""), 4000);
  };

  // Fetch initial notes, rules, and strategy playbook
  const loadData = b.useCallback(async () => {
    setLoading(true);
    try {
      const [resDaily, resTattoo, resAnalysis, resStrategies] = await Promise.all([
        fetch("/api/trading-notes/daily").then((r) => r.json()).catch(() => ({ notes: [] })),
        fetch("/api/trading-notes/tattoo-rules").then((r) => r.json()).catch(() => ({ rules: [] })),
        fetch("/api/trading-notes/weekly-analysis").then((r) => r.json()).catch(() => ({ analysis: null })),
        fetch("/api/trading-notes/strategies").then((r) => r.json()).catch(() => ({ myStrategies: [], templates: [] })),
      ]);

      if (resDaily?.notes) setDailyNotes(resDaily.notes);
      if (resTattoo?.rules) setTattooRules(resTattoo.rules);
      if (resAnalysis?.analysis) setWeeklyAnalysis(resAnalysis.analysis);
      if (resStrategies?.success) {
        setStrategiesData({
          myStrategies: resStrategies.myStrategies || [],
          templates: resStrategies.templates || [],
        });
      }
    } catch (e) {
      console.warn("Failed to load trading notes & strategies:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  b.useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync current day's fields when selectedDay changes
  const activeDayEntry = b.useMemo(() => {
    return dailyNotes.find((n) => n.dayOfWeek === selectedDay) || {
      dayOfWeek: selectedDay,
      date: new Date().toISOString().split("T")[0],
      goodThings: [],
      mistakes: [],
      tags: [],
      notes: "",
      mindsetRating: 8,
      tradesCount: 1,
    };
  }, [dailyNotes, selectedDay]);

  b.useEffect(() => {
    setDayNotesText(activeDayEntry.notes || "");
    setMindsetScore(activeDayEntry.mindsetRating || 8);
    setTradesCount(activeDayEntry.tradesCount || 1);
  }, [activeDayEntry]);

  // Add good execution to active day
  const handleAddGood = (e) => {
    e && e.preventDefault();
    if (!newGoodText.trim()) return;
    const text = newGoodText.trim();
    setNewGoodText("");

    const updated = {
      ...activeDayEntry,
      goodThings: [...(activeDayEntry.goodThings || []), text],
    };

    saveDayToBackend(updated);
  };

  // Add mistake to active day
  const handleAddMistake = (e) => {
    e && e.preventDefault();
    if (!newMistakeText.trim()) return;
    const text = newMistakeText.trim();
    setNewMistakeText("");

    const updated = {
      ...activeDayEntry,
      mistakes: [...(activeDayEntry.mistakes || []), text],
    };

    saveDayToBackend(updated);
  };

  // Remove good item
  const handleRemoveGood = (idx) => {
    const list = [...(activeDayEntry.goodThings || [])];
    list.splice(idx, 1);
    saveDayToBackend({ ...activeDayEntry, goodThings: list });
  };

  // Remove mistake item
  const handleRemoveMistake = (idx) => {
    const list = [...(activeDayEntry.mistakes || [])];
    list.splice(idx, 1);
    saveDayToBackend({ ...activeDayEntry, mistakes: list });
  };

  // Save current day to backend
  const saveDayToBackend = async (entryOverride) => {
    const target = entryOverride || {
      ...activeDayEntry,
      notes: dayNotesText,
      mindsetRating: mindsetScore,
      tradesCount: tradesCount,
    };

    try {
      const res = await fetch("/api/trading-notes/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(target),
      });
      const data = await res.json();
      if (data.success) {
        setDailyNotes((prev) => {
          const idx = prev.findIndex((n) => n.dayOfWeek === target.dayOfWeek);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = data.entry;
            return next;
          }
          return [...prev, data.entry];
        });
        showToast(s("✅ ডায়েরি সফলভাবে সংরক্ষিত ও সিঙ্ক হয়েছে!", "✅ Day journal entry saved and synchronized!"));
        // Refresh analysis
        fetch("/api/trading-notes/weekly-analysis")
          .then((r) => r.json())
          .then((d) => d.analysis && setWeeklyAnalysis(d.analysis))
          .catch(() => {});
      }
    } catch (err) {
      showToast(s("⚠️ সংরক্ষণ করতে সমস্যা হয়েছে", "⚠️ Failed to save entry"));
    }
  };

  // Add recurring mistake to Tattoo Rules
  const handlePinAsTattooRule = async (mistakeText, count = 2) => {
    try {
      const res = await fetch("/api/trading-notes/tattoo-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleText: mistakeText.startsWith("এই ভুল আর নয়:") ? mistakeText : `এই ভুলটি আর কখনো করা চলবে না: "${mistakeText}"`,
          category: mistakeText.toLowerCase().includes("fomo") ? "FOMO" : "Psychology",
          frequencyCount: count,
          originWeek: s("সাপ্তাহিক ফিল্টার থেকে চিহ্নিত", "Identified from Weekend Audit"),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTattooRules((prev) => [data.rule, ...prev]);
        showToast(s("🔥 সফলভাবে ট্যাটু রুলস তালিকায় যুক্ত হয়েছে!", "🔥 Pinned to Tattoo Rules wall!"));
      }
    } catch (e) {
      showToast("Failed to pin rule");
    }
  };

  // Delete Tattoo Rule
  const handleDeleteTattooRule = async (id) => {
    try {
      await fetch(`/api/trading-notes/tattoo-rules/${id}`, { method: "DELETE" });
      setTattooRules((prev) => prev.filter((r) => r.id !== id));
      showToast(s("রুল ডিলিট করা হয়েছে", "Rule removed"));
    } catch (e) {}
  };

  // Add custom Tattoo rule
  const handleAddCustomTattoo = async (e) => {
    e.preventDefault();
    if (!customTattooText.trim()) return;
    try {
      const res = await fetch("/api/trading-notes/tattoo-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleText: customTattooText.trim(),
          category: customTattooCategory,
          frequencyCount: 1,
          originWeek: s("ম্যানুয়াল ট্যাটু এন্ট্রি", "Manual Tattoo Entry"),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTattooRules((prev) => [data.rule, ...prev]);
        setCustomTattooText("");
        showToast(s("🔥 নতুন ট্যাটু রুল যুক্ত হয়েছে!", "🔥 New Tattoo Rule added!"));
      }
    } catch (e) {}
  };

  // Strategy Playbook Handlers
  const handleOpenCreateStrategy = () => {
    setModalMode("create");
    setEditingStrategy({
      name: "",
      category: "Smart Money / ICT",
      timeframe: "15m / 5m",
      session: "London & New York",
      minRiskReward: "1:2.5",
      riskRule: "Max 1% risk per trade, stop after 2 consecutive losses",
      rulesChecklist: [
        "Higher Timeframe (1H) Key Level & Liquidity Sweep",
        "Market Structure Shift (MSS) on execution timeframe",
        "Fair Value Gap (FVG) or Order Block confirmation entry"
      ],
      description: "My custom rule-based execution system designed to maintain strict edge and eliminate emotional entries.",
      notes: ""
    });
    setNewChecklistText("");
    setIsStrategyModalOpen(true);
  };

  const handleOpenCloneStrategy = (template) => {
    setModalMode("clone");
    setEditingStrategy({
      ...template,
      id: undefined,
      clonedFrom: template.name,
      name: `${template.name} (My Custom Upgrade)`,
      rulesChecklist: [...(template.rulesChecklist || [])],
    });
    setNewChecklistText("");
    setIsStrategyModalOpen(true);
  };

  const handleOpenEditStrategy = (strat) => {
    setModalMode("edit");
    setEditingStrategy({
      ...strat,
      rulesChecklist: [...(strat.rulesChecklist || [])],
    });
    setNewChecklistText("");
    setIsStrategyModalOpen(true);
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim() || !editingStrategy) return;
    const currentList = editingStrategy.rulesChecklist || [];
    setEditingStrategy({
      ...editingStrategy,
      rulesChecklist: [...currentList, newChecklistText.trim()]
    });
    setNewChecklistText("");
  };

  const handleRemoveChecklistItem = (index) => {
    if (!editingStrategy) return;
    const currentList = [...(editingStrategy.rulesChecklist || [])];
    currentList.splice(index, 1);
    setEditingStrategy({
      ...editingStrategy,
      rulesChecklist: currentList
    });
  };

  const handleSaveStrategy = async (e) => {
    e && e.preventDefault();
    if (!editingStrategy || !editingStrategy.name.trim()) {
      showToast(s("দয়া করে স্ট্র্যাটেজির নাম দিন", "Please enter a strategy name"));
      return;
    }
    setSavingStrategy(true);
    try {
      if (modalMode === "clone") {
        const res = await fetch("/api/trading-notes/strategies/clone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: editingStrategy.id || editingStrategy.clonedFrom,
            customUpgrades: {
              name: editingStrategy.name,
              category: editingStrategy.category,
              timeframe: editingStrategy.timeframe,
              session: editingStrategy.session,
              minRiskReward: editingStrategy.minRiskReward,
              riskRule: editingStrategy.riskRule,
              rulesChecklist: editingStrategy.rulesChecklist,
              description: editingStrategy.description,
              notes: editingStrategy.notes
            }
          })
        });
        const data = await res.json();
        if (data.success && data.strategy) {
          setStrategiesData(prev => ({
            ...prev,
            myStrategies: [data.strategy, ...(prev.myStrategies || [])]
          }));
          setIsStrategyModalOpen(false);
          setPlaybookSubTab("my");
          showToast(s("🎉 স্ট্র্যাটেজি সফলভাবে ক্লোন ও কাস্টমাইজ হয়েছে!", "🎉 Strategy cloned and customized successfully!"));
        }
      } else {
        const res = await fetch("/api/trading-notes/strategies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingStrategy)
        });
        const data = await res.json();
        if (data.success && data.strategy) {
          setStrategiesData(prev => {
            const list = [...(prev.myStrategies || [])];
            const idx = list.findIndex(s => s.id === data.strategy.id);
            if (idx !== -1) {
              list[idx] = data.strategy;
            } else {
              list.unshift(data.strategy);
            }
            return { ...prev, myStrategies: list };
          });
          setIsStrategyModalOpen(false);
          setPlaybookSubTab("my");
          showToast(s("✅ স্ট্র্যাটেজি প্লেবুকে সংরক্ষিত হয়েছে!", "✅ Strategy saved to Playbook!"));
        }
      }
    } catch (err) {
      showToast("Error saving strategy");
    } finally {
      setSavingStrategy(false);
    }
  };

  const handleDeleteStrategy = async (id) => {
    try {
      const res = await fetch(`/api/trading-notes/strategies/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setStrategiesData(prev => ({
          ...prev,
          myStrategies: (prev.myStrategies || []).filter(s => s.id !== id)
        }));
        showToast(s("🗑️ স্ট্র্যাটেজি মুছে ফেলা হয়েছে", "🗑️ Strategy deleted"));
      }
    } catch (err) {
      showToast("Failed to delete strategy");
    }
  };

  const daysList = [
    { key: "Monday", bn: "সোমবার", en: "Monday", tag: "Session Open" },
    { key: "Tuesday", bn: "মঙ্গলবার", en: "Tuesday", tag: "Trend Day" },
    { key: "Wednesday", bn: "বুধবার", en: "Wednesday", tag: "CPI / Macro" },
    { key: "Thursday", bn: "বৃহস্পতিবার", en: "Thursday", tag: "Power Overlap" },
    { key: "Friday", bn: "শুক্রবার", en: "Friday", tag: "NFP / Close" },
  ];

  return r.jsxs("div", {
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 text-left space-y-6 text-slate-100",
    children: [
      // Top Notification Toast
      statusMessage &&
        r.jsx("div", {
          className: "fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-bold text-xs shadow-2xl border border-emerald-400/40 animate-bounce flex items-center gap-2",
          children: statusMessage,
        }),

      // Header Banner
      r.jsxs("div", {
        className: "bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md",
        children: [
          r.jsx("div", {
            className: "absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none",
          }),
          r.jsxs("div", {
            className: "flex flex-col lg:flex-row lg:items-center justify-between gap-6",
            children: [
              r.jsxs("div", {
                className: "space-y-2",
                children: [
                  r.jsxs("div", {
                    className: "flex items-center gap-2 flex-wrap",
                    children: [
                      r.jsx("span", {
                        className: "px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5",
                        children: [
                          r.jsx("span", { className: "w-2 h-2 rounded-full bg-amber-400 animate-pulse" }),
                          "INSTITUTIONAL PSYCHOLOGY PROTOCOL",
                        ],
                      }),
                      r.jsx("span", {
                        className: "px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono",
                        children: "21-Day Habit Transformation",
                      }),
                    ],
                  }),
                  r.jsx("h1", {
                    className: "text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3",
                    children: s("ট্রেডার্স ডায়েরি ও সাইকোলজি জার্নাল", "Trader's Journal & Psychology Rules"),
                  }),
                  r.jsx("p", {
                    className: "text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed",
                    children: s(
                      "সোম থেকে শুক্রবার ডায়েরি রাখা, শনি-রবিবার ২ বারের বেশি হওয়া ভুলগুলো খুঁজে বের করা এবং মাথায় ট্যাটুর মতো গেঁথে রাখা—‘এই ভুলগুলো আমার আর করা চলবে না!’",
                      "Log trades Monday to Friday, audit recurring mistakes (>2 times) on weekends, and engrave them as Tattoo Rules: 'I must never repeat these mistakes!'"
                    ),
                  }),
                ],
              }),
              r.jsxs("div", {
                className: "flex items-center gap-3 shrink-0 flex-wrap",
                children: [
                  r.jsxs("div", {
                    className: "px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3 shadow-inner",
                    children: [
                      r.jsx("div", {
                        className: "w-3 h-3 rounded-full bg-rose-500 animate-ping",
                      }),
                      r.jsxs("div", {
                        children: [
                          r.jsx("p", { className: "text-[10px] text-slate-400 uppercase font-mono font-bold", children: s("সক্রিয় ট্যাটু রুলস", "Active Tattoo Rules") }),
                          r.jsxs("p", { className: "text-sm font-black text-rose-400", children: [tattooRules.length, " ", s("টি রুল", "Rules")] }),
                        ],
                      }),
                    ],
                  }),
                  r.jsx("button", {
                    onClick: loadData,
                    disabled: loading,
                    className: "p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer",
                    title: s("রিফ্রেশ করুন", "Refresh Data"),
                    children: r.jsx(iu("RotateCw"), { className: `w-4 h-4 ${loading ? "animate-spin" : ""}` }),
                  }),
                ],
              }),
            ]
          }),
        ],
      }),

      // Grand Quote Tattoo Philosophy Banner
      r.jsxs("div", {
        className: "p-5 rounded-3xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/60 border border-rose-500/30 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4",
        children: [
          r.jsxs("div", {
            className: "flex items-start gap-4",
            children: [
              r.jsx("div", {
                className: "p-3 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 shrink-0",
                children: r.jsx(iu("ShieldAlert"), { className: "w-6 h-6" }),
              }),
              r.jsxs("div", {
                className: "space-y-1",
                children: [
                  r.jsx("h4", {
                    className: "text-sm font-black text-white flex items-center gap-2",
                    children: [
                      "“এই বিষয়গুলো ট্যাটুর মতো মাথায় গেঁথে রাখেন।”",
                      r.jsx("span", { className: "px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono uppercase", children: "Zero Tolerance" }),
                    ],
                  }),
                  r.jsx("p", {
                    className: "text-xs text-slate-300 leading-relaxed",
                    children: s(
                      "“আমি জানি আমি কী কী ভুল করি”—এই আত্মতুষ্টিতে থাকবেন না। আগে খাতায় লিখুন, উইকএন্ডে ২ বারের বেশি হওয়া ভুল ফিল্টার করুন, তারপর ট্যাটু রুল বানিয়ে মনের ভেতর খোদাই করে নিন।",
                      "Do not assume 'I know my flaws.' Write them down, filter recurring mistakes on weekends, and tattoo them into your trading discipline."
                    ),
                  }),
                ],
              }),
            ],
          }),
          r.jsx("button", {
            onClick: () => setActiveTab("tattoo"),
            className: "px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 shrink-0 cursor-pointer transition-all",
            children: [
              r.jsx(iu("Flame"), { className: "w-4 h-4" }),
              s("ট্যাটু রুলস দেখুন", "View Tattoo Rules"),
            ],
          }),
        ],
      }),

      // 5 Main Module Tabs Navigation
      r.jsxs("div", {
        className: "flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto",
        children: [
          {
            key: "daily",
            label: s("১. সোম-শুক্র দৈনিক ডায়েরি", "1. Mon-Fri Daily Log"),
            icon: "Calendar",
            color: "amber",
          },
          {
            key: "weekend",
            label: s("২. শনি-রবি উইকএন্ড রিভিউ (ফিল্টার)", "2. Weekend Mistake Audit"),
            icon: "Scale",
            badge: weeklyAnalysis?.recurringMistakes?.length ? `${weeklyAnalysis.recurringMistakes.length} Alerts` : null,
            color: "rose",
          },
          {
            key: "tattoo",
            label: s("৩. ট্যাটু রুলস (মাথায় গেঁথে রাখুন)", "3. Tattoo Rules Wall"),
            icon: "Flame",
            badge: `${tattooRules.length} Rules`,
            color: "purple",
          },
          {
            key: "monthly",
            label: s("৪. ২১-দিনের মাসিক অডিট", "4. 21-Day Monthly Audit"),
            icon: "TrendingUp",
            color: "emerald",
          },
          {
            key: "playbook",
            label: s("৫. 🎯 স্ট্র্যাটেজি প্লেবুক ও কাস্টমাইজেশন", "5. 🎯 Strategy Playbook"),
            icon: "Crosshair",
            badge: `${strategiesData?.myStrategies?.length || 0} Saved`,
            color: "cyan",
          },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return r.jsxs(
            "button",
            {
              key: tab.key,
              onClick: () => setActiveTab(tab.key),
              className: `px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? "bg-slate-800 text-white shadow-lg border border-slate-700"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`,
              children: [
                r.jsx(iu(tab.icon), { className: `w-4 h-4 ${isActive ? "text-amber-400" : ""}` }),
                r.jsx("span", { children: tab.label }),
                tab.badge &&
                  r.jsx("span", {
                    className: "px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold",
                    children: tab.badge,
                  }),
              ],
            }
          );
        }),
      }),

      // TAB 1: DAILY MONDAY-FRIDAY LOG
      activeTab === "daily" &&
        r.jsxs("div", {
          className: "space-y-6",
          children: [
            // Days Horizontal Selector
            r.jsx("div", {
              className: "grid grid-cols-2 sm:grid-cols-5 gap-3",
              children: daysList.map((day) => {
                const isSelected = selectedDay === day.key;
                const note = dailyNotes.find((n) => n.dayOfWeek === day.key);
                const goodCount = note?.goodThings?.length || 0;
                const mistakeCount = note?.mistakes?.length || 0;

                return r.jsxs(
                  "button",
                  {
                    key: day.key,
                    onClick: () => setSelectedDay(day.key),
                    className: `p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-slate-800/90 border-amber-500/60 shadow-xl shadow-amber-500/10 text-white"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400"
                    }`,
                    children: [
                      r.jsxs("div", {
                        className: "flex items-center justify-between",
                        children: [
                          r.jsx("span", { className: "text-xs font-mono text-slate-400 uppercase", children: day.tag }),
                          isSelected && r.jsx("span", { className: "w-2 h-2 rounded-full bg-amber-400 animate-pulse" }),
                        ],
                      }),
                      r.jsx("h3", {
                        className: `text-base font-black mt-1 ${isSelected ? "text-amber-300" : "text-slate-200"}`,
                        children: s(day.bn, day.en),
                      }),
                      r.jsxs("div", {
                        className: "flex items-center gap-2 mt-3 text-[11px] font-mono",
                        children: [
                          r.jsxs("span", { className: "text-emerald-400 font-bold", children: ["🟢 ", goodCount] }),
                          r.jsxs("span", { className: "text-rose-400 font-bold", children: ["🔴 ", mistakeCount] }),
                        ],
                      }),
                    ],
                  }
                );
              }),
            }),

            // Active Day Input Grid
            r.jsxs("div", {
              className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
              children: [
                // Column 1: কী কী ঠিক করেছি? (Good Execution)
                r.jsxs("div", {
                  className: "bg-slate-900/80 border border-emerald-500/20 rounded-3xl p-6 space-y-4 shadow-xl",
                  children: [
                    r.jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [
                        r.jsxs("div", {
                          className: "flex items-center gap-2.5",
                          children: [
                            r.jsx("div", {
                              className: "p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
                              children: r.jsx(iu("CheckCircle2"), { className: "w-5 h-5" }),
                            }),
                            r.jsxs("div", {
                              children: [
                                r.jsx("h3", { className: "text-sm font-black text-white", children: s("কী কী ঠিক করেছি?", "What Went Right? (Winning Habits)") }),
                                r.jsx("p", { className: "text-[11px] text-slate-400", children: s("নিয়ম মেনে যেসব ভালো সিদ্ধান্ত নিয়েছেন তা লিখুন", "Log strictly followed rules and profitable discipline") }),
                              ],
                            }),
                          ],
                        }),
                        r.jsx("span", {
                          className: "px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold",
                          children: `${activeDayEntry.goodThings?.length || 0} Entries`,
                        }),
                      ],
                    }),

                    // Add Good Item Form
                    r.jsxs("form", {
                      onSubmit: handleAddGood,
                      className: "flex items-center gap-2",
                      children: [
                        r.jsx("input", {
                          type: "text",
                          value: newGoodText,
                          onChange: (e) => setNewGoodText(e.target.value),
                          placeholder: s("যেমন: অর্ডার ব্লকে ১:২ আরআর পর্যন্ত পেশেন্স ধরে রেখেছিলাম...", "e.g., Held patience for 1:2 RR at order block..."),
                          className: "flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50",
                        }),
                        r.jsxs("button", {
                          type: "submit",
                          className: "px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0",
                          children: [r.jsx(iu("Plus"), { className: "w-4 h-4" }), s("যোগ করুন", "Add")],
                        }),
                      ],
                    }),

                    // Good Items List
                    r.jsx("div", {
                      className: "space-y-2 max-h-72 overflow-y-auto pr-1",
                      children:
                        activeDayEntry.goodThings && activeDayEntry.goodThings.length > 0
                          ? activeDayEntry.goodThings.map((item, idx) =>
                              r.jsxs(
                                "div",
                                {
                                  key: idx,
                                  className: "p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start justify-between gap-3 text-xs text-emerald-200",
                                  children: [
                                    r.jsxs("div", {
                                      className: "flex items-start gap-2.5",
                                      children: [
                                        r.jsx("span", { className: "font-mono font-bold text-emerald-400 mt-0.5", children: `${idx + 1}.` }),
                                        r.jsx("span", { className: "leading-relaxed", children: item }),
                                      ],
                                    }),
                                    r.jsx("button", {
                                      onClick: () => handleRemoveGood(idx),
                                      className: "text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors shrink-0",
                                      title: s("মুছে ফেলুন", "Delete"),
                                      children: r.jsx(iu("X"), { className: "w-3.5 h-3.5" }),
                                    }),
                                  ],
                                }
                              )
                            )
                          : r.jsx("p", {
                              className: "text-xs text-slate-500 italic py-6 text-center border border-dashed border-slate-800 rounded-2xl",
                              children: s("আজকের জন্য এখনো কোনো ভালো কাজের এন্ট্রি নেই। ওপরে লিখে যোগ করুন।", "No good execution entries yet for this day."),
                            }),
                    }),
                  ],
                }),

                // Column 2: কী কী ভুল করেছি? (Mistakes / Traps)
                r.jsxs("div", {
                  className: "bg-slate-900/80 border border-rose-500/20 rounded-3xl p-6 space-y-4 shadow-xl",
                  children: [
                    r.jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [
                        r.jsxs("div", {
                          className: "flex items-center gap-2.5",
                          children: [
                            r.jsx("div", {
                              className: "p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30",
                              children: r.jsx(iu("AlertTriangle"), { className: "w-5 h-5" }),
                            }),
                            r.jsxs("div", {
                              children: [
                                r.jsx("h3", { className: "text-sm font-black text-white", children: s("কী কী ভুল করেছি?", "What Went Wrong? (Mistakes & Traps)") }),
                                r.jsx("p", { className: "text-[11px] text-slate-400", children: s("যেসব ভুল বারবার হচ্ছে তা অকপটে লিখুন", "Be brutally honest about FOMO, overtrading, or bad exits") }),
                              ],
                            }),
                          ],
                        }),
                        r.jsx("span", {
                          className: "px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold",
                          children: `${activeDayEntry.mistakes?.length || 0} Mistakes`,
                        }),
                      ],
                    }),

                    // Add Mistake Form
                    r.jsxs("form", {
                      onSubmit: handleAddMistake,
                      className: "flex items-center gap-2",
                      children: [
                        r.jsx("input", {
                          type: "text",
                          value: newMistakeText,
                          onChange: (e) => setNewMistakeText(e.target.value),
                          placeholder: s("যেমন: FOMC নিউজের আগে ইমোশনাল হয়ে বড় লট নিয়েছি...", "e.g., Emotional FOMO entry before FOMC news with big lot..."),
                          className: "flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50",
                        }),
                        r.jsxs("button", {
                          type: "submit",
                          className: "px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0",
                          children: [r.jsx(iu("Plus"), { className: "w-4 h-4" }), s("যোগ করুন", "Add")],
                        }),
                      ],
                    }),

                    // Quick Preset Mistake Badges
                    r.jsxs("div", {
                      className: "flex items-center gap-1.5 flex-wrap",
                      children: [
                        s("কুইক ট্যাগ:", "Quick Presets:"),
                        [
                          "দেরিতে এন্ট্রি (FOMO)",
                          "রিভেঞ্জ ট্রেডিং (Revenge)",
                          "স্টপ-লস পেছানো (Moved SL)",
                          "অতিরিক্ত লট সাইজ (High Lot)",
                          "প্ল্যান ছাড়া স্কাল্পিং",
                        ].map((preset, pIdx) =>
                          r.jsx(
                            "button",
                            {
                              key: pIdx,
                              type: "button",
                              onClick: () => setNewMistakeText(preset),
                              className: "px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/30 text-[10px] text-slate-300 transition-all cursor-pointer",
                              children: preset,
                            }
                          )
                        ),
                      ],
                    }),

                    // Mistake Items List
                    r.jsx("div", {
                      className: "space-y-2 max-h-72 overflow-y-auto pr-1",
                      children:
                        activeDayEntry.mistakes && activeDayEntry.mistakes.length > 0
                          ? activeDayEntry.mistakes.map((item, idx) =>
                              r.jsxs(
                                "div",
                                {
                                  key: idx,
                                  className: "p-3 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-start justify-between gap-3 text-xs text-rose-200",
                                  children: [
                                    r.jsxs("div", {
                                      className: "flex items-start gap-2.5",
                                      children: [
                                        r.jsx("span", { className: "font-mono font-bold text-rose-400 mt-0.5", children: `${idx + 1}.` }),
                                        r.jsx("span", { className: "leading-relaxed", children: item }),
                                      ],
                                    }),
                                    r.jsxs("div", {
                                      className: "flex items-center gap-1 shrink-0",
                                      children: [
                                        r.jsx("button", {
                                          onClick: () => handlePinAsTattooRule(item, 2),
                                          className: "px-2 py-0.5 rounded bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white text-[10px] font-bold border border-rose-500/40 cursor-pointer transition-all",
                                          title: s("ট্যাটু রুল বানিয়ে নিন", "Pin as Tattoo Rule"),
                                          children: "🔥 Tattoo",
                                        }),
                                        r.jsx("button", {
                                          onClick: () => handleRemoveMistake(idx),
                                          className: "text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors",
                                          title: s("মুছে ফেলুন", "Delete"),
                                          children: r.jsx(iu("X"), { className: "w-3.5 h-3.5" }),
                                        }),
                                      ],
                                    }),
                                  ],
                                }
                              )
                            )
                          : r.jsx("p", {
                              className: "text-xs text-slate-500 italic py-6 text-center border border-dashed border-slate-800 rounded-2xl",
                              children: s("আজকের জন্য কোনো ভুলের এন্ট্রি নেই। কোনো বিচ্যুতি হলে অবশ্যই লিখে রাখুন।", "No mistake entries yet for this day."),
                            }),
                    }),
                  ],
                }),
              ],
            }),

            // Additional Session Mindset & Save Bar
            r.jsxs("div", {
              className: "bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6",
              children: [
                r.jsxs("div", {
                  className: "flex items-center gap-6 w-full md:w-auto flex-wrap",
                  children: [
                    r.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        r.jsx("label", { className: "text-xs font-bold text-slate-400 block", children: s("আজকের মাইন্ডসেট রেটিং (১-১০)", "Mindset Rating (1-10)") }),
                        r.jsxs("div", {
                          className: "flex items-center gap-2",
                          children: [
                            r.jsx("input", {
                              type: "range",
                              min: 1,
                              max: 10,
                              value: mindsetScore,
                              onChange: (e) => setMindsetScore(Number(e.target.value)),
                              className: "w-32 accent-amber-500 cursor-pointer",
                            }),
                            r.jsxs("span", { className: "text-sm font-black text-amber-400 font-mono", children: [mindsetScore, "/10"] }),
                          ],
                        }),
                      ],
                    }),
                    r.jsxs("div", {
                      className: "space-y-1",
                      children: [
                        r.jsx("label", { className: "text-xs font-bold text-slate-400 block", children: s("আজকের মোট ট্রেড সংখ্যা", "Total Trades Today") }),
                        r.jsx("input", {
                          type: "number",
                          min: 0,
                          max: 30,
                          value: tradesCount,
                          onChange: (e) => setTradesCount(Number(e.target.value)),
                          className: "w-20 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white text-center",
                        }),
                      ],
                    }),
                  ],
                }),

                r.jsxs("div", {
                  className: "flex items-center gap-3 w-full md:w-auto justify-end",
                  children: [
                    r.jsxs("button", {
                      onClick: () => saveDayToBackend(),
                      className: "px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-amber-600/20 flex items-center gap-2 cursor-pointer transition-all",
                      children: [
                        r.jsx(iu("Save"), { className: "w-4 h-4" }),
                        s(`${selectedDay} এর এন্ট্রি সেভ করুন`, `Save ${selectedDay} Journal Entry`),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

      // TAB 2: WEEKEND MISTAKE AUDIT (শনি ও রবিবার)
      activeTab === "weekend" &&
        r.jsxs("div", {
          className: "space-y-6",
          children: [
            // Weekend Review Explainer
            r.jsxs("div", {
              className: "bg-slate-900/90 border border-rose-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden",
              children: [
                r.jsxs("div", {
                  className: "flex flex-col md:flex-row md:items-center justify-between gap-4",
                  children: [
                    r.jsxs("div", {
                      className: "space-y-1.5",
                      children: [
                        r.jsxs("div", {
                          className: "flex items-center gap-2",
                          children: [
                            r.jsx("span", { className: "px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold uppercase", children: "WEEKEND AUDIT ENGINE" }),
                            r.jsx("span", { className: "text-xs text-slate-400 font-mono", children: "Saturday & Sunday Strategy Ritual" }),
                          ],
                        }),
                        r.jsx("h2", {
                          className: "text-xl font-black text-white",
                          children: s("শনি-রবিবারের সাপ্তাহিক ভুল ও শক্তির অডিট", "Weekend Recurring Mistake & Strength Analysis"),
                        }),
                        r.jsx("p", {
                          className: "text-xs text-slate-300 max-w-2xl leading-relaxed",
                          children: s(
                            "এই পাঁচ-ছয় দিনে আপনার তথ্য জমা হয়েছে। এবার শনি বা রবিবার বসে দেখুন—ভুলের তালিকায় যেই ভুলটা ২ বারের বেশি লিখছেন, সেইটা আলাদা করে মাথায় গেঁথে নেওয়ার পালা।",
                            "Data gathered Mon-Fri. Identify any mistake made 2 or more times and turn it into a permanent Tattoo Rule."
                          ),
                        }),
                      ],
                    }),
                    r.jsxs("div", {
                      className: "p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center shrink-0",
                      children: [
                        r.jsx("p", { className: "text-[10px] text-slate-400 uppercase font-mono font-bold", children: s("গড় মাইন্ডসেট", "Avg Mindset") }),
                        r.jsxs("p", { className: "text-2xl font-black text-amber-400 font-mono", children: [weeklyAnalysis?.mindsetAverage || 8, "/10"] }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            // Recurring Mistakes (>= 2 times) Grid
            r.jsxs("div", {
              className: "space-y-3",
              children: [
                r.jsxs("div", {
                  className: "flex items-center justify-between",
                  children: [
                    r.jsxs("h3", {
                      className: "text-base font-black text-rose-400 flex items-center gap-2",
                      children: [
                        r.jsx(iu("AlertOctagon"), { className: "w-5 h-5 text-rose-500" }),
                        s("⚠️ ২ বারের বেশি হওয়া ভুলগুলো (ট্যাটু রুলসের জন্য প্রস্তুত)", "Recurring Mistakes (Occurred ≥ 2 times)"),
                      ],
                    }),
                    r.jsx("span", {
                      className: "text-xs text-slate-400 font-mono",
                      children: `${weeklyAnalysis?.recurringMistakes?.length || 0} Patterns Found`,
                    }),
                  ],
                }),

                weeklyAnalysis?.recurringMistakes && weeklyAnalysis.recurringMistakes.length > 0
                  ? r.jsx("div", {
                      className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                      children: weeklyAnalysis.recurringMistakes.map((mistake, idx) =>
                        r.jsxs(
                          "div",
                          {
                            key: idx,
                            className: "p-5 rounded-3xl bg-rose-950/20 border border-rose-500/40 shadow-xl space-y-3 relative overflow-hidden",
                            children: [
                              r.jsxs("div", {
                                className: "flex items-start justify-between gap-3",
                                children: [
                                  r.jsxs("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                      r.jsx("span", {
                                        className: `px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase ${
                                          mistake.count >= 3
                                            ? "bg-rose-600 text-white animate-pulse"
                                            : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                        }`,
                                        children: `${mistake.count} বার ঘটেছে (${mistake.count}x)`,
                                      }),
                                      r.jsx("span", { className: "text-xs text-rose-400 font-mono font-bold", children: "CRITICAL REPETITION" }),
                                    ],
                                  }),
                                  r.jsx("button", {
                                    onClick: () => handlePinAsTattooRule(mistake.text, mistake.count),
                                    className: "px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all",
                                    children: [r.jsx(iu("Flame"), { className: "w-3.5 h-3.5" }), s("ট্যাটু রুলস করুন", "Make Tattoo Rule")],
                                  }),
                                ],
                              }),
                              r.jsx("p", {
                                className: "text-sm font-bold text-white leading-relaxed",
                                children: `“${mistake.text}”`,
                              }),
                              r.jsx("p", {
                                className: "text-xs text-rose-200/80 leading-relaxed",
                                children: s(
                                  "আপনার সমস্যার গোড়াটা এইখানে! এই ভুলটাই আপনার একাউন্টের লাভ গিলে নিচ্ছে। এইটাকে এখনই ট্যাটু রুল বানিয়ে মনের ভেতর গেঁথে রাখুন।",
                                  "This is the exact root cause draining your profits. Tattoo this into your mind so it never happens again."
                                ),
                              }),
                            ],
                          }
                        )
                      ),
                    })
                  : r.jsx("div", {
                      className: "p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-2",
                      children: [
                        r.jsx("p", { className: "text-sm font-bold text-emerald-400", children: s("🎉 অভিনন্দন! এই সপ্তাহে কোনো ভুলই ২ বারের বেশি পুনরাবৃত্তি হয়নি!", "🎉 Excellent! No mistake repeated ≥ 2 times this week!") }),
                        r.jsx("p", { className: "text-xs text-slate-400", children: s("আপনার শৃঙ্খলা বজায় রাখুন এবং নতুন ট্রেডিং সেশনের জন্য প্রস্তুত হোন।", "Keep maintaining this high level of execution discipline.") }),
                      ],
                    }),
              ],
            }),

            // Recurring Strengths (>= 2 times) Grid
            r.jsxs("div", {
              className: "space-y-3 pt-4",
              children: [
                r.jsxs("h3", {
                  className: "text-base font-black text-emerald-400 flex items-center gap-2",
                  children: [
                    r.jsx(iu("Award"), { className: "w-5 h-5 text-emerald-500" }),
                    s("🏆 ২ বারের বেশি হওয়া ভালো কাজগুলো (আপনার আসল শক্তি)", "Winning Execution Strengths (Occurred ≥ 2 times)"),
                  ],
                }),
                weeklyAnalysis?.recurringStrengths && weeklyAnalysis.recurringStrengths.length > 0
                  ? r.jsx("div", {
                      className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                      children: weeklyAnalysis.recurringStrengths.map((item, idx) =>
                        r.jsxs(
                          "div",
                          {
                            key: idx,
                            className: "p-5 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 shadow-xl space-y-2",
                            children: [
                              r.jsxs("div", {
                                className: "flex items-center gap-2",
                                children: [
                                  r.jsx("span", {
                                    className: "px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-black",
                                    children: `${item.count} বার সফল (${item.count}x)`,
                                  }),
                                  r.jsx("span", { className: "text-xs text-emerald-400 font-mono font-bold", children: "EDGE PROVEN" }),
                                ],
                              }),
                              r.jsx("p", {
                                className: "text-sm font-bold text-white",
                                children: `“${item.text}”`,
                              }),
                            ],
                          }
                        )
                      ),
                    })
                  : r.jsx("p", {
                      className: "text-xs text-slate-500 italic py-6 text-center border border-dashed border-slate-800 rounded-2xl",
                      children: s("এই সপ্তাহে এখনো কোনো ভালো কাজ ২ বারের বেশি তালিকাভুক্ত হয়নি।", "No strengths logged ≥ 2 times yet."),
                    }),
              ],
            }),
          ],
        }),

      // TAB 3: TATTOO RULES WALL (মাথায় গেঁথে রাখুন)
      activeTab === "tattoo" &&
        r.jsxs("div", {
          className: "space-y-6",
          children: [
            // Tattoo Rules Header Card
            r.jsxs("div", {
              className: "bg-gradient-to-br from-rose-950/80 via-slate-900 to-amber-950/80 border border-rose-500/40 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center space-y-4",
              children: [
                r.jsx("div", {
                  className: "w-16 h-16 mx-auto rounded-3xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-600/20",
                  children: r.jsx(iu("Flame"), { className: "w-8 h-8" }),
                }),
                r.jsxs("div", {
                  className: "space-y-2 max-w-2xl mx-auto",
                  children: [
                    r.jsx("h2", {
                      className: "text-2xl sm:text-3xl font-black text-white tracking-tight",
                      children: s("“এই ভুলগুলো আমার আর করা চলবে না।”", "“I MUST NEVER REPEAT THESE MISTAKES.”"),
                    }),
                    r.jsx("p", {
                      className: "text-xs sm:text-sm text-slate-300 leading-relaxed",
                      children: s(
                        "৪ সপ্তাহের সাপ্তাহিক পর্যালোচনা থেকে যেসব ভুল উঠে এসেছে, সেগুলো এখানে ট্যাটুর মতো খোদাই করা আছে। প্রতিটি সেশনে বসার আগে এই ৪টি রুল নিজের মনকে বারবার মনে করাবেন।",
                        "Permanent rules engraved from your recurring mistakes. Review these before every single trading session to fortify your mindset."
                      ),
                    }),
                  ],
                }),
              ],
            }),

            // Add Custom Tattoo Rule Bar
            r.jsxs("form", {
              onSubmit: handleAddCustomTattoo,
              className: "p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center gap-3 shadow-lg",
              children: [
                r.jsx("input", {
                  type: "text",
                  value: customTattooText,
                  onChange: (e) => setCustomTattooText(e.target.value),
                  placeholder: s("নতুন ট্যাটু রুল লিখুন (যেমন: পর পর ২ দিন লস হলে ৩য় দিন ট্রেড অফ)...", "Write a new Tattoo Rule (e.g. Stop trading after 2 losses in a day)..."),
                  className: "flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 w-full",
                }),
                r.jsxs("select", {
                  value: customTattooCategory,
                  onChange: (e) => setCustomTattooCategory(e.target.value),
                  className: "px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none cursor-pointer w-full sm:w-auto",
                  children: [
                    r.jsx("option", { value: "FOMO", children: "FOMO Rule" }),
                    r.jsx("option", { value: "Psychology", children: "Psychology Rule" }),
                    r.jsx("option", { value: "Risk Management", children: "Risk Management" }),
                    r.jsx("option", { value: "Execution", children: "Execution Rule" }),
                  ],
                }),
                r.jsxs("button", {
                  type: "submit",
                  className: "px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all shrink-0 w-full sm:w-auto justify-center",
                  children: [r.jsx(iu("Plus"), { className: "w-4 h-4" }), s("ট্যাটু রুল যুক্ত করুন", "Add Tattoo Rule")],
                }),
              ],
            }),

            // Tattoo Rules Cards Wall
            r.jsx("div", {
              className: "grid grid-cols-1 md:grid-cols-2 gap-4",
              children: tattooRules.map((rule, idx) =>
                r.jsxs(
                  "div",
                  {
                    key: rule.id || idx,
                    className: "p-6 rounded-3xl bg-slate-900/90 border border-rose-500/30 hover:border-rose-500/60 shadow-xl space-y-4 relative overflow-hidden transition-all group",
                    children: [
                      r.jsx("div", {
                        className: "absolute -right-8 -bottom-8 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/20 transition-all",
                      }),
                      r.jsxs("div", {
                        className: "flex items-start justify-between gap-3",
                        children: [
                          r.jsxs("div", {
                            className: "flex items-center gap-2",
                            children: [
                              r.jsx("span", {
                                className: "w-7 h-7 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400 font-mono font-black text-xs flex items-center justify-center",
                                children: `#${idx + 1}`,
                              }),
                              r.jsx("span", {
                                className: "px-2.5 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-mono font-bold uppercase",
                                children: rule.category,
                              }),
                            ],
                          }),
                          r.jsx("button", {
                            onClick: () => handleDeleteTattooRule(rule.id),
                            className: "text-slate-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer",
                            title: s("মুছে ফেলুন", "Delete"),
                            children: r.jsx(iu("Trash2"), { className: "w-4 h-4" }),
                          }),
                        ],
                      }),
                      r.jsx("p", {
                        className: "text-base font-black text-white leading-relaxed tracking-tight",
                        children: rule.ruleText,
                      }),
                      r.jsxs("div", {
                        className: "flex items-center justify-between pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono",
                        children: [
                          r.jsxs("span", { children: [s("উৎস:", "Origin:"), " ", rule.originWeek || s("সাপ্তাহিক রিভিউ", "Weekly Review")] }),
                          r.jsx("span", { className: "text-rose-400 font-bold", children: "🔒 ZERO TOLERANCE" }),
                        ],
                      }),
                    ],
                  }
                )
              ),
            }),
          ],
        }),

      // TAB 4: 21-DAY MONTHLY AUDIT (মাসিক মাস্টার অডিট)
      activeTab === "monthly" &&
        r.jsxs("div", {
          className: "space-y-6",
          children: [
            r.jsxs("div", {
              className: "bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden",
              children: [
                r.jsxs("div", {
                  className: "space-y-2",
                  children: [
                    r.jsxs("div", {
                      className: "flex items-center gap-2",
                      children: [
                        r.jsx("span", { className: "px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold uppercase", children: "MONTHLY TRANSFORMATION DECK" }),
                        r.jsx("span", { className: "text-xs text-slate-400 font-mono", children: "21 Trading Days Synthesis" }),
                      ],
                    }),
                    r.jsx("h2", {
                      className: "text-xl font-black text-white",
                      children: s("মাসের ২১টি ট্রেডিং দিনের মাস্টার অডিট", "21-Day Trading Month Master Synthesis"),
                    }),
                    r.jsx("p", {
                      className: "text-xs text-slate-300 max-w-3xl leading-relaxed",
                      children: s(
                        "মাসের ২১টি ট্রেডিং দিনের চার সপ্তাহের তথ্য থেকে আপনি নিজের চোখে দেখতে পাচ্ছেন কোন ভুলগুলো আপনার টাকা আটকাচ্ছে আর কোন অভ্যাসগুলো আপনার একাউন্ট গ্রোথ ঘটাচ্ছে।",
                        "Concrete audit of all 4 weeks across the 21 trading days. Moving away from guesswork into documented execution mastery."
                      ),
                    }),
                  ],
                }),
              ],
            }),

            // 4 Weeks Matrix Grid
            r.jsx("div", {
              className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
              children: [
                { week: s("১ম সপ্তাহ", "Week 1"), trades: 10, winRate: "60%", mistakesEliminated: 3, status: "Habit Audit" },
                { week: s("২য় সপ্তাহ", "Week 2"), trades: 8, winRate: "75%", mistakesEliminated: 4, status: "Rules Active" },
                { week: s("৩য় সপ্তাহ", "Week 3"), trades: 7, winRate: "85%", mistakesEliminated: 5, status: "Tattoo Solid" },
                { week: s("৪র্থ সপ্তাহ", "Week 4"), trades: 6, winRate: "83%", mistakesEliminated: 6, status: "Mastery Peak" },
              ].map((w, wIdx) =>
                r.jsxs(
                  "div",
                  {
                    key: wIdx,
                    className: "p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3",
                    children: [
                      r.jsxs("div", {
                        className: "flex items-center justify-between",
                        children: [
                          r.jsx("span", { className: "text-xs font-mono font-bold text-amber-400", children: w.week }),
                          r.jsx("span", { className: "px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono", children: w.status }),
                        ],
                      }),
                      r.jsxs("div", {
                        className: "space-y-1.5 text-xs text-slate-300 font-mono",
                        children: [
                          r.jsxs("div", { className: "flex justify-between", children: [r.jsx("span", { className: "text-slate-400", children: s("ট্রেড সংখ্যা:", "Trades:") }), r.jsx("span", { className: "font-bold text-white", children: w.trades })] }),
                          r.jsxs("div", { className: "flex justify-between", children: [r.jsx("span", { className: "text-slate-400", children: s("উইন রেট:", "Win Rate:") }), r.jsx("span", { className: "font-bold text-emerald-400", children: w.winRate })] }),
                          r.jsxs("div", { className: "flex justify-between", children: [r.jsx("span", { className: "text-slate-400", children: s("ভুল কমানো হয়েছে:", "Mistakes Cut:") }), r.jsx("span", { className: "font-bold text-rose-400", children: `-${w.mistakesEliminated}` })] }),
                        ],
                      }),
                    ],
                  }
                )
              ),
            }),
          ],
        }),

      // TAB 5: STRATEGY PLAYBOOK & PERSONALIZATION SYSTEM (স্ট্র্যাটেজি প্লেবুক ও কাস্টমাইজেশন)
      activeTab === "playbook" &&
        r.jsxs("div", {
          className: "space-y-6",
          children: [
            // Header Hero Banner
            r.jsxs("div", {
              className: "bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6",
              children: [
                r.jsxs("div", {
                  className: "space-y-2",
                  children: [
                    r.jsxs("div", {
                      className: "flex items-center gap-2 flex-wrap",
                      children: [
                        r.jsx("span", {
                          className: "px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5",
                          children: [
                            r.jsx("span", { className: "w-2 h-2 rounded-full bg-cyan-400 animate-pulse" }),
                            "STRATEGY PLAYBOOK & PERSONALIZATION VAULT",
                          ],
                        }),
                        r.jsx("span", {
                          className: "text-xs text-slate-400 font-mono",
                          children: "Rule-Based Execution Protocol",
                        }),
                      ],
                    }),
                    r.jsx("h2", {
                      className: "text-xl sm:text-2xl font-black text-white flex items-center gap-2",
                      children: s("স্ট্র্যাটেজি প্লেবুক ও কাস্টমাইজেশন সিস্টেম", "Strategy Playbook & Rules Personalization"),
                    }),
                    r.jsx("p", {
                      className: "text-xs text-slate-300 max-w-3xl leading-relaxed",
                      children: s(
                        "আপনার নিজের কোনো স্ট্র্যাটেজি থাকলে তা এখানে সাজিয়ে রাখুন, অথবা লাইব্রেরি থেকে মেন্টর বা কমিউনিটির স্ট্র্যাটেজি ‘Clone’ করে নিজের টাইমফ্রেম, সেশন ও এক্সিকিউশন চেকলিস্ট দিয়ে সম্পূর্ণ নিজের মত কাস্টমাইজ করে নিন। আপনার ট্রেডিং জার্নাল ও এন্ট্রি ট্যাগে এগুলো সরাসরি যুক্ত হবে।",
                        "Create your own strategy or clone community/mentor systems. Fully customize the rules, timeframe, session filter, and execution checklist to build your own personal edge. Directly synced to your Trading Journal."
                      ),
                    }),
                  ],
                }),
                r.jsxs("button", {
                  type: "button",
                  onClick: handleOpenCreateStrategy,
                  className: "px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-cyan-600/30 flex items-center gap-2 shrink-0 cursor-pointer transition-all",
                  children: [
                    r.jsx(iu("Plus"), { className: "w-4 h-4" }),
                    s("নতুন স্ট্র্যাটেজি তৈরি করুন", "Create New Strategy"),
                  ],
                }),
              ],
            }),

            // Playbook Sub-tabs Switcher
            r.jsxs("div", {
              className: "flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800",
              children: [
                r.jsxs("button", {
                  type: "button",
                  onClick: () => setPlaybookSubTab("my"),
                  className: `flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    playbookSubTab === "my"
                      ? "bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`,
                  children: [
                    r.jsx(iu("Crosshair"), { className: "w-4 h-4" }),
                    s("আমার সক্রিয় স্ট্র্যাটেজি", "My Active Playbook"),
                    r.jsxs("span", {
                      className: "px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono",
                      children: [strategiesData.myStrategies?.length || 0],
                    }),
                  ],
                }),
                r.jsxs("button", {
                  type: "button",
                  onClick: () => setPlaybookSubTab("templates"),
                  className: `flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    playbookSubTab === "templates"
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`,
                  children: [
                    r.jsx(iu("BookOpen"), { className: "w-4 h-4" }),
                    s("স্ট্র্যাটেজি লাইব্রেরি ও রেডিমেড টেমপ্লেট (ক্লোন করুন)", "Strategy Templates Library (Clone & Upgrade)"),
                    r.jsxs("span", {
                      className: "px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono",
                      children: [strategiesData.templates?.length || 0],
                    }),
                  ],
                }),
              ],
            }),

            // SUB-TAB 1: MY ACTIVE STRATEGIES
            playbookSubTab === "my" &&
              r.jsxs("div", {
                className: "space-y-4",
                children: [
                  (!strategiesData.myStrategies || strategiesData.myStrategies.length === 0) ? (
                    r.jsxs("div", {
                      className: "p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4",
                      children: [
                        r.jsx("div", {
                          className: "w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mx-auto flex items-center justify-center",
                          children: r.jsx(iu("Crosshair"), { className: "w-8 h-8" }),
                        }),
                        r.jsx("h3", {
                          className: "text-lg font-bold text-white",
                          children: s("এখনও কোনো সক্রিয় স্ট্র্যাটেজি যুক্ত করা হয়নি", "No Active Strategies in Your Playbook"),
                        }),
                        r.jsx("p", {
                          className: "text-xs text-slate-400 max-w-md mx-auto leading-relaxed",
                          children: s(
                            "আপনি নিজের কোনো স্ট্র্যাটেজি যোগ করতে পারেন অথবা লাইব্রেরি থেকে রেডিমেড টেমপ্লেট ক্লোন করে নিজের মতো কাস্টমাইজ করতে পারেন।",
                            "Create your own setup from scratch or clone an institutional template from our library to get started."
                          ),
                        }),
                        r.jsxs("div", {
                          className: "flex items-center justify-center gap-3 pt-2",
                          children: [
                            r.jsxs("button", {
                              type: "button",
                              onClick: handleOpenCreateStrategy,
                              className: "px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-1.5",
                              children: [r.jsx(iu("Plus"), { className: "w-4 h-4" }), s("নতুন তৈরি করুন", "Create New")],
                            }),
                            r.jsxs("button", {
                              type: "button",
                              onClick: () => setPlaybookSubTab("templates"),
                              className: "px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1.5",
                              children: [r.jsx(iu("Copy"), { className: "w-4 h-4" }), s("লাইব্রেরি থেকে ক্লোন করুন", "Clone from Library")],
                            }),
                          ],
                        }),
                      ],
                    })
                  ) : (
                    r.jsx("div", {
                      className: "grid grid-cols-1 lg:grid-cols-2 gap-4",
                      children: strategiesData.myStrategies.map((strat) =>
                        r.jsxs(
                          "div",
                          {
                            key: strat.id,
                            className: "p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-4 shadow-xl relative",
                            children: [
                              // Top Bar
                              r.jsxs("div", {
                                className: "flex items-start justify-between gap-3",
                                children: [
                                  r.jsxs("div", {
                                    className: "space-y-1.5",
                                    children: [
                                      r.jsxs("div", {
                                        className: "flex items-center gap-2 flex-wrap",
                                        children: [
                                          r.jsx("span", {
                                            className: "px-2.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase",
                                            children: strat.category || "General",
                                          }),
                                          strat.clonedFrom &&
                                            r.jsxs("span", {
                                              className: "px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono flex items-center gap-1",
                                              children: [
                                                r.jsx(iu("GitFork"), { className: "w-3 h-3" }),
                                                s("ক্লোনকৃত: ", "Cloned from: "),
                                                strat.clonedFrom,
                                              ],
                                            }),
                                        ],
                                      }),
                                      r.jsx("h3", {
                                        className: "text-base font-black text-white leading-tight",
                                        children: strat.name,
                                      }),
                                    ],
                                  }),
                                  r.jsxs("div", {
                                    className: "flex items-center gap-1.5 shrink-0",
                                    children: [
                                      r.jsx("button", {
                                        type: "button",
                                        onClick: () => handleOpenEditStrategy(strat),
                                        className: "p-2 rounded-xl bg-slate-800 hover:bg-cyan-950/60 hover:text-cyan-300 text-slate-300 border border-slate-700 transition-colors cursor-pointer",
                                        title: s("এডিট ও কাস্টমাইজ করুন", "Edit & Customize"),
                                        children: r.jsx(iu("Edit3"), { className: "w-4 h-4" }),
                                      }),
                                      r.jsx("button", {
                                        type: "button",
                                        onClick: () => handleDeleteStrategy(strat.id),
                                        className: "p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 border border-slate-700 transition-colors cursor-pointer",
                                        title: s("মুছে ফেলুন", "Delete"),
                                        children: r.jsx(iu("Trash2"), { className: "w-4 h-4" }),
                                      }),
                                    ],
                                  }),
                                ],
                              }),

                              // Parameters Pills Grid
                              r.jsxs("div", {
                                className: "grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono",
                                children: [
                                  r.jsxs("div", {
                                    className: "p-2 rounded-xl bg-slate-950 border border-slate-800/80 space-y-0.5",
                                    children: [
                                      r.jsx("span", { className: "text-[9px] text-slate-400 uppercase", children: s("টাইমফ্রেম", "Timeframe") }),
                                      r.jsx("p", { className: "font-bold text-amber-300 truncate", children: strat.timeframe || "15m / 5m" }),
                                    ],
                                  }),
                                  r.jsxs("div", {
                                    className: "p-2 rounded-xl bg-slate-950 border border-slate-800/80 space-y-0.5",
                                    children: [
                                      r.jsx("span", { className: "text-[9px] text-slate-400 uppercase", children: s("সেশন", "Session") }),
                                      r.jsx("p", { className: "font-bold text-cyan-300 truncate", children: strat.session || "All Sessions" }),
                                    ],
                                  }),
                                  r.jsxs("div", {
                                    className: "p-2 rounded-xl bg-slate-950 border border-slate-800/80 space-y-0.5",
                                    children: [
                                      r.jsx("span", { className: "text-[9px] text-slate-400 uppercase", children: s("টার্গেট R:R", "Target R:R") }),
                                      r.jsx("p", { className: "font-bold text-emerald-400 truncate", children: strat.minRiskReward || "1:2.5" }),
                                    ],
                                  }),
                                  r.jsxs("div", {
                                    className: "p-2 rounded-xl bg-slate-950 border border-slate-800/80 space-y-0.5",
                                    children: [
                                      r.jsx("span", { className: "text-[9px] text-slate-400 uppercase", children: s("চেকলিস্ট", "Checklist") }),
                                      r.jsxs("p", { className: "font-bold text-indigo-300 truncate", children: [(strat.rulesChecklist || []).length, " ", s("টি রুল", "Rules")] }),
                                    ],
                                  }),
                                ],
                              }),

                              // Execution Checklist
                              strat.rulesChecklist && strat.rulesChecklist.length > 0 &&
                                r.jsxs("div", {
                                  className: "space-y-1.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60",
                                  children: [
                                    r.jsx("h4", {
                                      className: "text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5",
                                      children: [
                                        r.jsx(iu("CheckSquare"), { className: "w-3.5 h-3.5 text-emerald-400" }),
                                        s("ট্রেড নেওয়ার আগে চেকলিস্ট (Execution Rules):", "Execution Checklist:"),
                                      ],
                                    }),
                                    r.jsx("div", {
                                      className: "space-y-1",
                                      children: strat.rulesChecklist.map((rule, rIdx) =>
                                        r.jsxs("div", {
                                          key: rIdx,
                                          className: "flex items-start gap-2 text-xs text-slate-300 leading-snug",
                                          children: [
                                            r.jsx("span", { className: "text-emerald-400 font-bold shrink-0 mt-0.5", children: "✓" }),
                                            r.jsx("span", { children: rule }),
                                          ],
                                        })
                                      ),
                                    }),
                                  ],
                                }),

                              // Risk Management Rule Box
                              strat.riskRule &&
                                r.jsxs("div", {
                                  className: "p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300",
                                  children: [
                                    r.jsx(iu("ShieldAlert"), { className: "w-4 h-4 text-rose-400 shrink-0" }),
                                    r.jsxs("div", {
                                      children: [
                                        r.jsx("span", { className: "font-bold text-rose-200", children: s("রিস্ক রুল: ", "Risk Rule: ") }),
                                        strat.riskRule,
                                      ],
                                    }),
                                  ],
                                }),

                              // Description / Notes
                              strat.description &&
                                r.jsx("p", {
                                  className: "text-xs text-slate-400 italic line-clamp-2",
                                  children: strat.description,
                                }),
                            ],
                          }
                        )
                      ),
                    })
                  ),
                ],
              }),

            // SUB-TAB 2: TEMPLATES & COMMUNITY LIBRARY
            playbookSubTab === "templates" &&
              r.jsxs("div", {
                className: "space-y-4",
                children: [
                  // Clone Banner
                  r.jsxs("div", {
                    className: "p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3 text-xs text-indigo-200",
                    children: [
                      r.jsx(iu("HelpCircle"), { className: "w-5 h-5 text-indigo-400 shrink-0 mt-0.5" }),
                      r.jsxs("div", {
                        className: "space-y-1",
                        children: [
                          r.jsx("h4", {
                            className: "font-black text-indigo-100",
                            children: s(
                              "অন্যদের বা মেন্টরদের স্ট্র্যাটেজি নিজের মতো করে ব্যবহার করার নিয়ম:",
                              "How to clone & personalize other strategies for your own edge:"
                            ),
                          }),
                          r.jsx("p", {
                            className: "text-indigo-300 leading-relaxed",
                            children: s(
                              "নিচের যেকোনো রেডিমেড টেমপ্লেট থেকে ‘Clone to My Playbook’ বাটনে ক্লিক করুন। আপনার ট্রেডিং স্টাইল অনুযায়ী সেশন (লন্ডন/নিউ ইয়র্ক), এন্ট্রি টাইমফ্রেম এবং এক্সিকিউশন চেকলিস্ট এডিট করে সম্পূর্ণ নিজের রুলস বানিয়ে নিন।",
                              "Click 'Clone to My Playbook & Customize' on any template below. Then tweak the timeframe, session timing, and execution rules checklist to match your own personal trading plan."
                            ),
                          }),
                        ],
                      }),
                    ],
                  }),

                  // Templates Grid
                  r.jsx("div", {
                    className: "grid grid-cols-1 lg:grid-cols-2 gap-4",
                    children: (strategiesData.templates || []).map((tpl) =>
                      r.jsxs(
                        "div",
                        {
                          key: tpl.id,
                          className: "p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4 shadow-xl flex flex-col justify-between",
                          children: [
                            r.jsxs("div", {
                              className: "space-y-3",
                              children: [
                                r.jsxs("div", {
                                  className: "flex items-start justify-between gap-3",
                                  children: [
                                    r.jsxs("div", {
                                      className: "space-y-1",
                                      children: [
                                        r.jsx("span", {
                                          className: "px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold uppercase",
                                          children: tpl.category,
                                        }),
                                        r.jsx("h3", {
                                          className: "text-base font-black text-white leading-tight",
                                          children: tpl.name,
                                        }),
                                      ],
                                    }),
                                    r.jsx("span", {
                                      className: "px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400 shrink-0",
                                      children: "Institutional Template",
                                    }),
                                  ],
                                }),

                                r.jsx("p", {
                                  className: "text-xs text-slate-300 leading-relaxed",
                                  children: tpl.description,
                                }),

                                // Details Grid
                                r.jsxs("div", {
                                  className: "grid grid-cols-3 gap-2 text-[11px] font-mono",
                                  children: [
                                    r.jsxs("div", {
                                      className: "p-2 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5",
                                      children: [
                                        r.jsx("span", { className: "text-[9px] text-slate-400 uppercase", children: "TF" }),
                                        r.jsx("p", { className: "font-bold text-amber-300", children: tpl.timeframe }),
                                      ],
                                    }),
                                    r.jsxs("div", {
                                      className: "p-2 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5",
                                      children: [
                                        r.jsx("span", { className: "text-[9px] text-slate-400 uppercase", children: "Session" }),
                                        r.jsx("p", { className: "font-bold text-cyan-300", children: tpl.session }),
                                      ],
                                    }),
                                    r.jsxs("div", {
                                      className: "p-2 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5",
                                      children: [
                                        r.jsx("span", { className: "text-[9px] text-slate-400 uppercase", children: "Target R:R" }),
                                        r.jsx("p", { className: "font-bold text-emerald-400", children: tpl.minRiskReward }),
                                      ],
                                    }),
                                  ],
                                }),

                                // Checklist Preview
                                tpl.rulesChecklist && (
                                  r.jsxs("div", {
                                    className: "p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60 space-y-1",
                                    children: [
                                      r.jsx("span", { className: "text-[10px] font-mono font-bold text-slate-400 uppercase", children: "Default Execution Checklist:" }),
                                      tpl.rulesChecklist.map((rule, idx) =>
                                        r.jsxs("div", {
                                          key: idx,
                                          className: "flex items-start gap-1.5 text-xs text-slate-300",
                                          children: [
                                            r.jsx("span", { className: "text-indigo-400 font-bold", children: "•" }),
                                            r.jsx("span", { children: rule }),
                                          ],
                                        })
                                      ),
                                    ],
                                  })
                                ),
                              ],
                            }),

                            // Prominent Clone Action Button
                            r.jsxs("button", {
                              type: "button",
                              onClick: () => handleOpenCloneStrategy(tpl),
                              className: "w-full py-2.5 px-4 mt-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all",
                              children: [
                                r.jsx(iu("Copy"), { className: "w-4 h-4" }),
                                s("⎘ নিজের প্লেবুকে ক্লোন ও কাস্টমাইজ করুন", "⎘ Clone to My Playbook & Customize"),
                              ],
                            }),
                          ],
                        }
                      )
                    ),
                  }),
                ],
              }),

            // STRATEGY CREATE / EDIT / CLONE MODAL
            isStrategyModalOpen &&
              editingStrategy &&
              r.jsx("div", {
                className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in",
                children: r.jsxs("div", {
                  className: "bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 text-left",
                  children: [
                    // Modal Header
                    r.jsxs("div", {
                      className: "flex items-start justify-between gap-4 border-b border-slate-800 pb-4",
                      children: [
                        r.jsxs("div", {
                          className: "space-y-1",
                          children: [
                            r.jsxs("div", {
                              className: "flex items-center gap-2",
                              children: [
                                r.jsx("span", {
                                  className: "px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold uppercase",
                                  children: modalMode === "clone" ? "Clone & Upgrade" : modalMode === "edit" ? "Edit Strategy" : "New Strategy",
                                }),
                                editingStrategy.clonedFrom &&
                                  r.jsxs("span", {
                                    className: "text-xs text-indigo-300 font-mono",
                                    children: [s("মূল ভিত্তি: ", "Source: "), editingStrategy.clonedFrom],
                                  }),
                              ],
                            }),
                            r.jsx("h3", {
                              className: "text-lg font-black text-white",
                              children:
                                modalMode === "clone"
                                  ? s("স্ট্র্যাটেজি ক্লোন ও নিজের মতো কাস্টমাইজ করুন", "Clone & Customize Strategy for Yourself")
                                  : modalMode === "edit"
                                  ? s("স্ট্র্যাটেজি এডিট ও আপগ্রেড করুন", "Edit & Upgrade Strategy")
                                  : s("নতুন নিজস্ব স্ট্র্যাটেজি তৈরি করুন", "Create New Custom Strategy"),
                            }),
                          ],
                        }),
                        r.jsx("button", {
                          type: "button",
                          onClick: () => setIsStrategyModalOpen(false),
                          className: "p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer",
                          children: r.jsx(iu("X"), { className: "w-5 h-5" }),
                        }),
                      ],
                    }),

                    // Modal Form Fields
                    r.jsxs("form", {
                      onSubmit: handleSaveStrategy,
                      className: "space-y-4",
                      children: [
                        // Name
                        r.jsxs("div", {
                          className: "space-y-1.5",
                          children: [
                            r.jsx("label", {
                              className: "text-xs font-bold text-slate-300 uppercase font-mono",
                              children: s("স্ট্র্যাটেজির নাম *", "Strategy Name *"),
                            }),
                            r.jsx("input", {
                              type: "text",
                              value: editingStrategy.name || "",
                              onChange: (e) => setEditingStrategy({ ...editingStrategy, name: e.target.value }),
                              placeholder: "e.g., ICT London Breaker + SFP Setup (My Version)",
                              className: "w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-sm text-white font-bold outline-none",
                              required: true,
                            }),
                          ],
                        }),

                        // Category & Timeframe & Session Row
                        r.jsxs("div", {
                          className: "grid grid-cols-1 sm:grid-cols-3 gap-3",
                          children: [
                            r.jsxs("div", {
                              className: "space-y-1.5",
                              children: [
                                r.jsx("label", {
                                  className: "text-xs font-bold text-slate-300 uppercase font-mono",
                                  children: s("ক্যাটাগরি", "Category"),
                                }),
                                r.jsx("input", {
                                  type: "text",
                                  value: editingStrategy.category || "",
                                  onChange: (e) => setEditingStrategy({ ...editingStrategy, category: e.target.value }),
                                  placeholder: "Smart Money / ICT, Breakout, etc.",
                                  className: "w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400",
                                }),
                              ],
                            }),
                            r.jsxs("div", {
                              className: "space-y-1.5",
                              children: [
                                r.jsx("label", {
                                  className: "text-xs font-bold text-slate-300 uppercase font-mono",
                                  children: s("টাইমফ্রেম", "Timeframe"),
                                }),
                                r.jsx("input", {
                                  type: "text",
                                  value: editingStrategy.timeframe || "",
                                  onChange: (e) => setEditingStrategy({ ...editingStrategy, timeframe: e.target.value }),
                                  placeholder: "e.g., 15m / 5m, 1H / 15m",
                                  className: "w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400",
                                }),
                              ],
                            }),
                            r.jsxs("div", {
                              className: "space-y-1.5",
                              children: [
                                r.jsx("label", {
                                  className: "text-xs font-bold text-slate-300 uppercase font-mono",
                                  children: s("ট্রেডিং সেশন", "Session"),
                                }),
                                r.jsx("input", {
                                  type: "text",
                                  value: editingStrategy.session || "",
                                  onChange: (e) => setEditingStrategy({ ...editingStrategy, session: e.target.value }),
                                  placeholder: "e.g., London Only, NY Killzone",
                                  className: "w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400",
                                }),
                              ],
                            }),
                          ],
                        }),

                        // Target R:R and Risk Rule
                        r.jsxs("div", {
                          className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
                          children: [
                            r.jsxs("div", {
                              className: "space-y-1.5",
                              children: [
                                r.jsx("label", {
                                  className: "text-xs font-bold text-slate-300 uppercase font-mono",
                                  children: s("টার্গেট Risk:Reward", "Min Target R:R"),
                                }),
                                r.jsx("input", {
                                  type: "text",
                                  value: editingStrategy.minRiskReward || "",
                                  onChange: (e) => setEditingStrategy({ ...editingStrategy, minRiskReward: e.target.value }),
                                  placeholder: "e.g., 1:2.5 or 1:3",
                                  className: "w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400",
                                }),
                              ],
                            }),
                            r.jsxs("div", {
                              className: "space-y-1.5",
                              children: [
                                r.jsx("label", {
                                  className: "text-xs font-bold text-slate-300 uppercase font-mono",
                                  children: s("রিস্ক ম্যানেজমেন্ট রুল", "Risk Management Rule"),
                                }),
                                r.jsx("input", {
                                  type: "text",
                                  value: editingStrategy.riskRule || "",
                                  onChange: (e) => setEditingStrategy({ ...editingStrategy, riskRule: e.target.value }),
                                  placeholder: "e.g., Max 1% risk per trade, stop after 2 losses",
                                  className: "w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400",
                                }),
                              ],
                            }),
                          ],
                        }),

                        // Execution Rules Checklist
                        r.jsxs("div", {
                          className: "space-y-2 p-4 rounded-2xl bg-slate-950/70 border border-slate-800",
                          children: [
                            r.jsxs("div", {
                              className: "flex items-center justify-between",
                              children: [
                                r.jsx("label", {
                                  className: "text-xs font-bold text-emerald-400 uppercase font-mono flex items-center gap-1.5",
                                  children: [
                                    r.jsx(iu("CheckSquare"), { className: "w-3.5 h-3.5" }),
                                    s("এক্সিকিউশন চেকলিস্ট রুলস (Execution Checklist)", "Execution Rules Checklist"),
                                  ],
                                }),
                                r.jsxs("span", {
                                  className: "text-[10px] text-slate-400 font-mono",
                                  children: [(editingStrategy.rulesChecklist || []).length, " ", s("টি রুল", "Items")],
                                }),
                              ],
                            }),
                            // Current Items
                            r.jsx("div", {
                              className: "space-y-1.5 max-h-40 overflow-y-auto",
                              children: (editingStrategy.rulesChecklist || []).map((rule, idx) =>
                                r.jsxs("div", {
                                  key: idx,
                                  className: "flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200",
                                  children: [
                                    r.jsxs("div", {
                                      className: "flex items-center gap-2",
                                      children: [
                                        r.jsx("span", { className: "text-emerald-400 font-bold", children: `${idx + 1}.` }),
                                        r.jsx("span", { children: rule }),
                                      ],
                                    }),
                                    r.jsx("button", {
                                      type: "button",
                                      onClick: () => handleRemoveChecklistItem(idx),
                                      className: "text-slate-400 hover:text-rose-400 p-1 cursor-pointer transition-colors",
                                      children: r.jsx(iu("Trash2"), { className: "w-3.5 h-3.5" }),
                                    }),
                                  ],
                                })
                              ),
                            }),
                            // Add Checklist Item Input
                            r.jsxs("div", {
                              className: "flex items-center gap-2 pt-1",
                              children: [
                                r.jsx("input", {
                                  type: "text",
                                  value: newChecklistText,
                                  onChange: (e) => setNewChecklistText(e.target.value),
                                  onKeyDown: (e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddChecklistItem();
                                    }
                                  },
                                  placeholder: s("নতুন চেকলিস্ট রুল লিখুন (যেমন: 1H Liquidity Sweep)", "Type new rule (e.g., 1H Liquidity Sweep confirmed)..."),
                                  className: "flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400",
                                }),
                                r.jsxs("button", {
                                  type: "button",
                                  onClick: handleAddChecklistItem,
                                  className: "px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer",
                                  children: [r.jsx(iu("Plus"), { className: "w-3.5 h-3.5" }), s("যোগ করুন", "Add")],
                                }),
                              ],
                            }),
                          ],
                        }),

                        // Description / Notes
                        r.jsxs("div", {
                          className: "space-y-1.5",
                          children: [
                            r.jsx("label", {
                              className: "text-xs font-bold text-slate-300 uppercase font-mono",
                              children: s("স্ট্র্যাটেজির বিবরণ ও এন্ট্রি নির্দেশনা", "Strategy Description & Edge Notes"),
                            }),
                            r.jsx("textarea", {
                              rows: 2,
                              value: editingStrategy.description || "",
                              onChange: (e) => setEditingStrategy({ ...editingStrategy, description: e.target.value }),
                              placeholder: "Describe how to confirm entries, how to manage stops, and invalidate setups...",
                              className: "w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400",
                            }),
                          ],
                        }),

                        // Action Buttons
                        r.jsxs("div", {
                          className: "flex items-center justify-end gap-3 pt-3 border-t border-slate-800",
                          children: [
                            r.jsx("button", {
                              type: "button",
                              onClick: () => setIsStrategyModalOpen(false),
                              className: "px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer",
                              children: s("বাতিল", "Cancel"),
                            }),
                            r.jsxs("button", {
                              type: "submit",
                              disabled: savingStrategy,
                              className: "px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-cyan-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50",
                              children: [
                                savingStrategy ? r.jsx(iu("RotateCw"), { className: "w-4 h-4 animate-spin" }) : r.jsx(iu("Save"), { className: "w-4 h-4" }),
                                s("প্লেবুকে সংরক্ষণ করুন", "Save to Playbook"),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              }),
          ],
        }),
    ],
  });
}

// -----------------------------------------------------------------------------
// Universal Floating Quick-Note Widget (Shown Across The Whole Website)
// Strictly visible ONLY when a user is logged in. Completely hidden on logout.
// -----------------------------------------------------------------------------
function TradingNotesQuickWidget() {
  const { currentUser: user, language: lang } = Xo();
  const isBn = lang === "bn";
  const s = (bn, en) => (isBn ? bn : en);

  // STRICT RULE: If no user is logged in, hide completely from DOM!
  if (!user) {
    return null;
  }

  // States
  const [isOpen, setIsOpen] = b.useState(false);
  const [showWelcome, setShowWelcome] = b.useState(() => {
    try {
      return !sessionStorage.getItem("notes_welcome_dismissed");
    } catch (e) {
      return true;
    }
  });

  const [activeTab, setActiveTab] = b.useState("mistake"); // "good" | "mistake" | "mindset" | "tattoo"
  const [noteText, setNoteText] = b.useState("");
  const [status, setStatus] = b.useState("");

  // Auto-dismiss welcome greeting after 5 seconds (as requested: "৫ সেকেন্ড পর")
  b.useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
        try {
          sessionStorage.setItem("notes_welcome_dismissed", "true");
        } catch (e) {}
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  const handleDismissWelcome = () => {
    setShowWelcome(false);
    try {
      sessionStorage.setItem("notes_welcome_dismissed", "true");
    } catch (e) {}
  };

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    const text = noteText.trim();
    setStatus(s("সংরক্ষণ হচ্ছে...", "Saving..."));

    try {
      const res = await fetch("/api/trading-notes/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          text: text,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(s("✅ যোগ হয়েছে!", "✅ Saved!"));
        setNoteText("");
        setTimeout(() => {
          setStatus("");
          setIsOpen(false);
        }, 1000);
      } else {
        setStatus("Error");
      }
    } catch (err) {
      setStatus("Saved");
      setTimeout(() => setIsOpen(false), 1000);
    }
  };

  return r.jsxs("div", {
    id: "trading_notes_universal_widget",
    className: "fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-auto",
    children: [
      // 1. Welcome Greeting Popup Card (Compact & Small)
      showWelcome &&
        !isOpen &&
        r.jsxs("div", {
          className: "p-3 rounded-2xl bg-slate-900/95 border border-amber-500/40 shadow-2xl text-left max-w-[280px] sm:max-w-[310px] text-slate-100 space-y-2 backdrop-blur-xl animate-fade-in relative overflow-hidden",
          children: [
            r.jsx("div", {
              className: "absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/10 rounded-full blur-lg pointer-events-none",
            }),
            r.jsxs("div", {
              className: "flex items-start justify-between gap-1.5",
              children: [
                r.jsxs("div", {
                  className: "flex items-center gap-1.5",
                  children: [
                    r.jsx("span", { className: "w-2 h-2 rounded-full bg-amber-400 animate-pulse" }),
                    r.jsx("span", { className: "text-[10px] font-black text-amber-400 uppercase tracking-wider font-mono", children: s("ট্রেডার্স মাইন্ডসেট চেক", "Mindset Check") }),
                  ],
                }),
                r.jsx("button", {
                  onClick: handleDismissWelcome,
                  className: "text-slate-400 hover:text-white p-0.5 cursor-pointer transition-colors",
                  children: r.jsx(iu("X"), { className: "w-3 h-3" }),
                }),
              ],
            }),
            r.jsx("p", {
              className: "text-[11px] font-bold text-slate-100 leading-snug",
              children: s(
                "স্বাগতম! আজকের ট্রেডিংয়ের মাইন্ডসেট ও রুলস ঠিক আছে তো? কোনো ফোমো এন্ট্রি নেওয়া যাবে না!",
                "Welcome! Mindset & rules ready today? Zero FOMO entries!"
              ),
            }),
            r.jsxs("div", {
              className: "flex items-center gap-1.5 pt-0.5",
              children: [
                r.jsx("button", {
                  onClick: () => {
                    handleDismissWelcome();
                    setIsOpen(true);
                  },
                  className: "px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] shadow-sm cursor-pointer transition-all",
                  children: s("কুইক নোট লিখুন", "Quick Note"),
                }),
                r.jsx("button", {
                  onClick: () => {
                    handleDismissWelcome();
                    window.location.hash = "#trading_notes";
                    const navBtn = document.querySelector('button[data-page-id="trading_notes"]');
                    if (navBtn) navBtn.click();
                  },
                  className: "px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] cursor-pointer transition-all",
                  children: s("ট্যাটু রুলস দেখুন", "Tattoo Rules"),
                }),
              ],
            }),
          ],
        }),

      // 2. Open Modal Dialog / Compact Notepad
      isOpen &&
        r.jsxs("div", {
          className: "w-[290px] sm:w-[320px] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-3.5 space-y-2.5 text-left text-slate-100 backdrop-blur-2xl animate-scale-in relative overflow-hidden",
          children: [
            r.jsxs("div", {
              className: "flex items-center justify-between pb-2 border-b border-slate-800",
              children: [
                r.jsxs("div", {
                  className: "flex items-center gap-1.5",
                  children: [
                    r.jsx("div", {
                      className: "p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30",
                      children: r.jsx(iu("Notebook"), { className: "w-3.5 h-3.5" }),
                    }),
                    r.jsxs("div", {
                      children: [
                        r.jsx("h4", { className: "text-xs font-black text-white leading-tight", children: s("কুইক নোটপ্যাড", "Quick Notepad") }),
                        r.jsx("p", { className: "text-[9px] text-slate-400", children: s("তাৎক্ষণিক ২ লাইনে লিখে রাখুন", "2-line instant trade note") }),
                      ],
                    }),
                  ],
                }),
                r.jsx("button", {
                  onClick: () => setIsOpen(false),
                  className: "p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-all",
                  children: r.jsx(iu("X"), { className: "w-3.5 h-3.5" }),
                }),
              ],
            }),

            // Tab Selector: Good | Mistake | Mindset
            r.jsxs("div", {
              className: "grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[9px] font-bold font-mono",
              children: [
                r.jsx("button", {
                  type: "button",
                  onClick: () => setActiveTab("mistake"),
                  className: `py-1 rounded transition-all cursor-pointer ${
                    activeTab === "mistake" ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`,
                  children: s("🔴 কী ভুল", "🔴 Mistake"),
                }),
                r.jsx("button", {
                  type: "button",
                  onClick: () => setActiveTab("good"),
                  className: `py-1 rounded transition-all cursor-pointer ${
                    activeTab === "good" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`,
                  children: s("🟢 কী ঠিক", "🟢 Good"),
                }),
                r.jsx("button", {
                  type: "button",
                  onClick: () => setActiveTab("mindset"),
                  className: `py-1 rounded transition-all cursor-pointer ${
                    activeTab === "mindset" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`,
                  children: s("🧠 মাইন্ডসেট", "🧠 Mindset"),
                }),
              ],
            }),

            // Textarea & Submit
            r.jsxs("form", {
              onSubmit: handleQuickSubmit,
              className: "space-y-2",
              children: [
                r.jsx("textarea", {
                  rows: 2,
                  value: noteText,
                  onChange: (e) => setNoteText(e.target.value),
                  placeholder:
                    activeTab === "mistake"
                      ? s("যেমন: FOMC নিউজের আগে ফোমো এন্ট্রি নেওয়া যাবে না...", "e.g., No FOMO before high-impact news...")
                      : activeTab === "good"
                      ? s("যেমন: ১:২ আরআর পর্যন্ত পেশেন্স ধরে রেখেছিলাম...", "e.g., Held discipline till 1:2 RR hit...")
                      : s("যেমন: মাথা শান্ত রেখে পরবর্তী সেটআপের অপেক্ষা...", "e.g., Calm execution, waiting for setup..."),
                  className: "w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed",
                }),

                // Compact Quick tags
                r.jsxs("div", {
                  className: "flex items-center gap-1 flex-wrap",
                  children: [
                    ["#FOMO", "#OverTrading", "#Revenge", "#StrictSL"].map((tag, tIdx) =>
                      r.jsx(
                        "button",
                        {
                          key: tIdx,
                          type: "button",
                          onClick: () => setNoteText((prev) => (prev ? `${prev} ${tag}` : tag)),
                          className: "px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-[9px] text-slate-400 cursor-pointer",
                          children: tag,
                        }
                      )
                    ),
                  ],
                }),

                r.jsxs("div", {
                  className: "flex items-center justify-between pt-0.5",
                  children: [
                    status && r.jsx("span", { className: "text-[10px] font-bold text-amber-400", children: status }),
                    r.jsx("div", { className: "flex-1" }),
                    r.jsxs("button", {
                      type: "submit",
                      className: "px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] shadow-sm flex items-center gap-1 cursor-pointer transition-all",
                      children: [r.jsx(iu("Send"), { className: "w-3 h-3" }), s("সেভ", "Save")],
                    }),
                  ],
                }),
              ],
            }),

            // Footer link to main page
            r.jsxs("div", {
              className: "pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]",
              children: [
                r.jsx("span", { className: "text-slate-400", children: s("মেইন ডায়েরিতে সিঙ্ক হবে", "Auto-syncs") }),
                r.jsx("button", {
                  onClick: () => {
                    setIsOpen(false);
                    const navBtn = document.querySelector('button[data-page-id="trading_notes"]');
                    if (navBtn) navBtn.click();
                  },
                  className: "text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 cursor-pointer",
                  children: [s("পূর্ণাঙ্গ ডায়েরি", "Full Journal"), " →"],
                }),
              ],
            }),
          ],
        }),

      // 3. Compact Floating Collapsed Button Badge (Smaller, Sleeker)
      !isOpen &&
        r.jsxs("button", {
          onClick: () => setIsOpen(true),
          className: "group p-2 sm:px-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white shadow-lg shadow-amber-600/25 border border-amber-300/40 cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5",
          title: s("কুইক ট্রেডিং নোটপ্যাড খুলুন", "Quick Trading Note"),
          children: [
            r.jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-amber-200 animate-ping" }),
            r.jsx(iu("Notebook"), { className: "w-3.5 h-3.5 text-white" }),
            r.jsx("span", {
              className: "text-[11px] font-black tracking-tight pr-0.5",
              children: s("নোট", "Note"),
            }),
          ],
        }),
    ],
  });
}
