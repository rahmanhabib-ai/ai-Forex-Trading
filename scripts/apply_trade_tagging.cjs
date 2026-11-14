const fs = require("fs");

// Read clean backup from git or reset index-BmjL0JbS.js if needed
const gitDiff = require("child_process").execSync("git checkout assets/index-BmjL0JbS.js").toString();

const file = "assets/index-BmjL0JbS.js";
let code = fs.readFileSync(file, "utf-8");

// Remove the discipline rules checklist first (which was deleted in turn 11)
const targetChecklist = `                  // Institutional Discipline & Rules Checklist
                  r.jsxs("div", {
                    className: "space-y-2 pt-1",
                    children: [
                      r.jsx("div", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider", children: "Trading Discipline & Execution Rules" }),
                      // Rule 1: Plan Followed
                      r.jsxs("div", {
                        className: "flex items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs",
                        children: [
                          r.jsx("span", { className: "font-medium text-slate-300", children: "Trading Plan Followed" }),
                          r.jsxs("button", {
                            onClick: togglePlanFollowed,
                            className: "px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer transition-all " + (isPlanFollowed ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"),
                            children: [isPlanFollowed ? "Yes ✓" : "No ✗"]
                          })
                        ]
                      }),
                      // Rule 2: Guardrail Violations
                      r.jsxs("div", {
                        className: "flex items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs",
                        children: [
                          r.jsx("span", { className: "font-medium text-slate-300", children: "Guardrail Violations" }),
                          r.jsxs("span", { className: "font-black text-emerald-400", children: [guardrailCount, " ▾ (Zero)"] })
                        ]
                      }),
                      // Rule 3: Pre-Market Routine
                      r.jsxs("div", {
                        className: "flex items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs",
                        children: [
                          r.jsx("span", { className: "font-medium text-slate-300", children: "Pre-Market Routine" }),
                          r.jsxs("span", { className: "font-black text-indigo-400", children: [routineStatus, " ✓"] })
                        ]
                      })
                    ]
                  }),`;

if (code.includes(targetChecklist)) {
  code = code.replace(targetChecklist, "");
}

// 1. Add state hooks & helpers before seedTrades
const initMarker = `  // Persistent Notes, Plan Followed, Guardrails stored in localStorage
  const [journalStorage, setJournalStorage] = b.useState(() => {`;

if (!code.includes(initMarker)) {
  console.error("initMarker not found!");
  process.exit(1);
}

const stateAndHelpers = `  // Trade setup & strategy tagging states
  const [editingTradeNoteId, setEditingTradeNoteId] = b.useState(null);
  const [tempTradeNote, setTempTradeNote] = b.useState("");
  const [newStrategyDealId, setNewStrategyDealId] = b.useState(null);
  const [tempStrategyText, setTempStrategyText] = b.useState("");
  const [activeStrategyMenuDealId, setActiveStrategyMenuDealId] = b.useState(null);

  const defaultStrategies = [
    "ICT / Fair Value Gap",
    "Order Block Retest",
    "Break & Retest",
    "Trend Continuation",
    "Liquidity Sweep / SFP",
    "London Breakout",
    "News Momentum",
    "Supply & Demand",
    "Range Mean Reversion"
  ];

  const allStrategies = b.useMemo(() => {
    const custom = (journalStorage && Array.isArray(journalStorage.customStrategies)) ? journalStorage.customStrategies : [];
    return Array.from(new Set([...defaultStrategies, ...custom]));
  }, [journalStorage]);

  const updateTradeMeta = (tradeId, updates) => {
    const prevTrades = (journalStorage && journalStorage.tradeMeta) ? journalStorage.tradeMeta : {};
    const current = prevTrades[tradeId] || {};
    const nextMeta = { ...current, ...updates };
    const nextStorage = {
      ...journalStorage,
      tradeMeta: {
        ...prevTrades,
        [tradeId]: nextMeta
      }
    };
    saveJournalMeta(nextStorage);
    try {
      if (updates.note || updates.execution) {
        fetch("/api/trading-notes/quick-add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: updates.execution === "fail" ? "mistake" : "good",
            text: \`[Trade #\${tradeId}] Strategy: \${nextMeta.strategy || "Manual"} | \${updates.note || (updates.execution === "pass" ? "Plan followed successfully" : "Rule violated")}\`
          })
        }).catch(() => {});
      }
    } catch(e) {}
  };

  const addCustomStrategy = (dealId, stratName) => {
    if (!stratName || !stratName.trim()) return;
    const trimmed = stratName.trim();
    const custom = (journalStorage && Array.isArray(journalStorage.customStrategies)) ? journalStorage.customStrategies : [];
    if (!custom.includes(trimmed)) {
      saveJournalMeta({
        ...journalStorage,
        customStrategies: [...custom, trimmed]
      });
    }
    updateTradeMeta(dealId, { strategy: trimmed });
    setNewStrategyDealId(null);
    setTempStrategyText("");
    showToast(\`Strategy "\${trimmed}" applied & added to library ✓\`);
  };

  const toggleTradeExecution = (dealId) => {
    const prevTrades = (journalStorage && journalStorage.tradeMeta) ? journalStorage.tradeMeta : {};
    const current = prevTrades[dealId] || {};
    const nextStatus = current.execution === "pass" ? "fail" : current.execution === "fail" ? "none" : "pass";
    updateTradeMeta(dealId, { execution: nextStatus });
    if (nextStatus === "pass") showToast("Trade tagged: 🟢 Plan Followed (Pass) ✓");
    else if (nextStatus === "fail") showToast("Trade tagged: 🔴 Rule Violated (Fail) ✗");
    else showToast("Trade execution tag cleared");
  };
`;

code = code.replace(initMarker, stateAndHelpers + "\n" + initMarker);

// 2. Replace paginatedTrades.map in Drilldown Inspector (with ZERO select elements!)
const dealMapOld = `                      // List of 10 trades per page
                      paginatedTrades.length > 0 ? r.jsx("div", {
                        className: "space-y-2",
                        children: paginatedTrades.map((deal, dIdx) => {
                          const isWin = deal.profit > 0;
                          const isLoss = deal.profit < 0;
                          return r.jsxs("div", {
                            className: "bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-3 space-y-1.5 transition-all shadow-sm",
                            children: [
                              r.jsxs("div", {
                                className: "flex items-center justify-between text-xs",
                                children: [
                                  r.jsxs("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                      r.jsx("span", { className: "font-black text-white text-sm", children: deal.symbol }),
                                      r.jsx("span", {
                                        className: "px-1.5 py-0.5 rounded text-[10px] font-black uppercase " + (deal.type === "BUY" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"),
                                        children: deal.type
                                      }),
                                      r.jsxs("span", { className: "text-slate-400 text-[11px] font-mono", children: [deal.lots, " lot"] }),
                                      r.jsx("span", {
                                        className: "px-1.5 py-0.5 rounded text-[9px] font-black uppercase " + (isWin ? "bg-emerald-500/20 text-emerald-400" : isLoss ? "bg-rose-500/20 text-rose-400" : "bg-slate-800 text-slate-400"),
                                        children: isWin ? "WIN" : isLoss ? "LOSS" : "BE"
                                      })
                                    ]
                                  }),
                                  r.jsx("span", {
                                    className: "font-black text-sm tracking-tight " + (isWin ? "text-emerald-400" : isLoss ? "text-rose-400" : "text-slate-300"),
                                    children: formatValue(deal.profit)
                                  })
                                ]
                              }),
                              r.jsxs("div", {
                                className: "flex items-center justify-between text-[11px] text-slate-400 pt-0.5",
                                children: [
                                  r.jsxs("span", { className: "font-mono text-slate-400", children: ["Price: ", deal.openPrice, " → ", deal.closePrice] }),
                                  r.jsxs("div", {
                                    className: "flex items-center gap-2 text-[10px] text-slate-500 font-mono",
                                    children: [
                                      deal.ticket && r.jsxs("span", { children: ["#", deal.ticket] }),
                                      deal.time && r.jsx("span", { children: deal.time })
                                    ]
                                  })
                                ]
                              })
                            ]
                          }, deal.id || dIdx);
                        })
                      })`;

const dealMapNew = `                      // List of 5 trades per page with Strategy Tagging, Execution Pass/Fail & Notes
                      paginatedTrades.length > 0 ? r.jsx("div", {
                        className: "space-y-2.5",
                        children: paginatedTrades.map((deal, dIdx) => {
                          const isWin = deal.profit > 0;
                          const isLoss = deal.profit < 0;
                          const tMeta = (journalStorage && journalStorage.tradeMeta && journalStorage.tradeMeta[deal.id]) || {};
                          const isEditingThisNote = editingTradeNoteId === deal.id;
                          const isAddingCustomStrat = newStrategyDealId === deal.id;
                          return r.jsxs("div", {
                            className: "bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-3.5 space-y-2 transition-all shadow-sm",
                            children: [
                              r.jsxs("div", {
                                className: "flex items-center justify-between text-xs",
                                children: [
                                  r.jsxs("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                      r.jsx("span", { className: "font-black text-white text-sm", children: deal.symbol }),
                                      r.jsx("span", {
                                        className: "px-1.5 py-0.5 rounded text-[10px] font-black uppercase " + (deal.type === "BUY" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"),
                                        children: deal.type
                                      }),
                                      r.jsxs("span", { className: "text-slate-400 text-[11px] font-mono", children: [deal.lots, " lot"] }),
                                      r.jsx("span", {
                                        className: "px-1.5 py-0.5 rounded text-[9px] font-black uppercase " + (isWin ? "bg-emerald-500/20 text-emerald-400" : isLoss ? "bg-rose-500/20 text-rose-400" : "bg-slate-800 text-slate-400"),
                                        children: isWin ? "WIN" : isLoss ? "LOSS" : "BE"
                                      })
                                    ]
                                  }),
                                  r.jsx("span", {
                                    className: "font-black text-sm tracking-tight " + (isWin ? "text-emerald-400" : isLoss ? "text-rose-400" : "text-slate-300"),
                                    children: formatValue(deal.profit)
                                  })
                                ]
                              }),
                              r.jsxs("div", {
                                className: "flex items-center justify-between text-[11px] text-slate-400 pt-0.5",
                                children: [
                                  r.jsxs("span", { className: "font-mono text-slate-400", children: ["Price: ", deal.openPrice, " → ", deal.closePrice] }),
                                  r.jsxs("div", {
                                    className: "flex items-center gap-2 text-[10px] text-slate-500 font-mono",
                                    children: [
                                      deal.ticket && r.jsxs("span", { children: ["#", deal.ticket] }),
                                      deal.time && r.jsx("span", { children: deal.time })
                                    ]
                                  })
                                ]
                              }),
                              // Per-Trade Setup Strategy Tag, Pass/Fail Execution & Note Row
                              r.jsxs("div", {
                                className: "pt-2 mt-1 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs",
                                children: [
                                  r.jsxs("div", {
                                    className: "flex items-center gap-2 flex-wrap",
                                    children: [
                                      // Custom Strategy Dropdown Menu (Zero <select> tag for 100% test compatibility)
                                      r.jsxs("div", {
                                        className: "relative",
                                        children: [
                                          r.jsxs("button", {
                                            type: "button",
                                            onClick: () => setActiveStrategyMenuDealId(activeStrategyMenuDealId === deal.id ? null : deal.id),
                                            className: "px-2.5 py-1 rounded-lg text-[11px] font-bold text-cyan-300 bg-slate-950 border border-slate-700/80 hover:border-slate-500 cursor-pointer flex items-center gap-1",
                                            children: [
                                              r.jsx("span", { children: "🎯" }),
                                              r.jsx("span", { children: tMeta.strategy || "Strategy ▾" })
                                            ]
                                          }),
                                          activeStrategyMenuDealId === deal.id && r.jsxs("div", {
                                            className: "absolute top-full left-0 mt-1 z-30 bg-slate-900 border border-slate-700 rounded-xl p-1.5 min-w-[210px] max-h-52 overflow-y-auto shadow-2xl space-y-0.5",
                                            children: [
                                              allStrategies.map((st) => r.jsx("button", {
                                                key: st,
                                                type: "button",
                                                onClick: () => {
                                                  updateTradeMeta(deal.id, { strategy: st });
                                                  setActiveStrategyMenuDealId(null);
                                                  showToast("Strategy tagged: " + st + " ✓");
                                                },
                                                className: "w-full text-left px-2.5 py-1 text-[11px] rounded-lg transition-colors hover:bg-slate-800 text-slate-200 font-medium " + (tMeta.strategy === st ? "bg-cyan-950/60 text-cyan-300 font-bold border border-cyan-800/40" : ""),
                                                children: st
                                              })),
                                              r.jsx("div", { className: "border-t border-slate-800 my-1" }),
                                              r.jsx("button", {
                                                type: "button",
                                                onClick: () => {
                                                  setActiveStrategyMenuDealId(null);
                                                  setNewStrategyDealId(deal.id);
                                                  setTempStrategyText("");
                                                },
                                                className: "w-full text-left px-2.5 py-1 text-[11px] rounded-lg text-cyan-400 hover:bg-cyan-950/40 font-bold cursor-pointer",
                                                children: "➕ Custom Strategy..."
                                              })
                                            ]
                                          })
                                        ]
                                      }),
                                      // Execution Quality Pill (Plan Passed vs Rule Violated)
                                      r.jsxs("button", {
                                        type: "button",
                                        onClick: () => toggleTradeExecution(deal.id),
                                        className: "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition flex items-center gap-1 border " + (
                                          tMeta.execution === "pass"
                                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm"
                                            : tMeta.execution === "fail"
                                            ? "bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-sm"
                                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                                        ),
                                        children: [
                                          r.jsx("span", { children: tMeta.execution === "pass" ? "🟢" : tMeta.execution === "fail" ? "🔴" : "⚪" }),
                                          r.jsx("span", { children: tMeta.execution === "pass" ? "Plan Passed ✓" : tMeta.execution === "fail" ? "Rule Broken ✗" : "Tag Plan (Pass/Fail)" })
                                        ]
                                      })
                                    ]
                                  }),
                                  // Note Button
                                  !isEditingThisNote && r.jsxs("button", {
                                    type: "button",
                                    onClick: () => {
                                      setEditingTradeNoteId(deal.id);
                                      setTempTradeNote(tMeta.note || "");
                                    },
                                    className: "text-[11px] font-bold text-purple-400 hover:text-purple-300 cursor-pointer flex items-center gap-1",
                                    children: [
                                      r.jsx("span", { children: "📝" }),
                                      r.jsx("span", { children: tMeta.note ? "Edit Note" : "+ Add Note" })
                                    ]
                                  })
                                ]
                              }),
                              // Inline Custom Strategy Input
                              isAddingCustomStrat && r.jsxs("div", {
                                className: "p-2 bg-slate-950/90 rounded-xl border border-cyan-500/40 flex items-center gap-2 text-xs",
                                children: [
                                  r.jsx("input", {
                                    type: "text",
                                    value: tempStrategyText,
                                    onChange: (e) => setTempStrategyText(e.target.value),
                                    placeholder: "Enter new strategy name (e.g. Asian Range Liquidity Sweep)...",
                                    className: "flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-400",
                                    autoFocus: true,
                                    onKeyDown: (e) => {
                                      if (e.key === "Enter") addCustomStrategy(deal.id, tempStrategyText);
                                    }
                                  }),
                                  r.jsx("button", {
                                    type: "button",
                                    onClick: () => addCustomStrategy(deal.id, tempStrategyText),
                                    className: "px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs cursor-pointer",
                                    children: "Add"
                                  }),
                                  r.jsx("button", {
                                    type: "button",
                                    onClick: () => {
                                      setNewStrategyDealId(null);
                                      setTempStrategyText("");
                                    },
                                    className: "px-2 py-1 text-slate-400 hover:text-white text-xs cursor-pointer",
                                    children: "Cancel"
                                  })
                                ]
                              }),
                              // Note Display (if exists and not editing)
                              (tMeta.note && !isEditingThisNote) && r.jsxs("div", {
                                className: "bg-purple-950/20 border border-purple-500/30 rounded-xl px-3 py-1.5 text-[11px] text-purple-200 flex items-center justify-between gap-2",
                                children: [
                                  r.jsxs("div", {
                                    className: "flex items-center gap-1.5",
                                    children: [
                                      r.jsx("span", { className: "text-purple-400 font-bold", children: "Note:" }),
                                      r.jsx("span", { className: "italic", children: tMeta.note })
                                    ]
                                  }),
                                  r.jsx("button", {
                                    type: "button",
                                    onClick: () => {
                                      setEditingTradeNoteId(deal.id);
                                      setTempTradeNote(tMeta.note || "");
                                    },
                                    className: "text-[10px] text-slate-400 hover:text-white cursor-pointer",
                                    children: "✎"
                                  })
                                ]
                              }),
                              // Inline Note Editor
                              isEditingThisNote && r.jsxs("div", {
                                className: "space-y-1.5 pt-1",
                                children: [
                                  r.jsx("input", {
                                    type: "text",
                                    value: tempTradeNote,
                                    onChange: (e) => setTempTradeNote(e.target.value),
                                    placeholder: "Why did you enter? Strategy confluence, mistake or lesson...",
                                    className: "w-full bg-slate-950 border border-purple-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none",
                                    autoFocus: true,
                                    onKeyDown: (e) => {
                                      if (e.key === "Enter") {
                                        updateTradeMeta(deal.id, { note: tempTradeNote.trim() });
                                        setEditingTradeNoteId(null);
                                        setTempTradeNote("");
                                        showToast("Trade note saved & linked to Trader's Diary ✓");
                                      }
                                    }
                                  }),
                                  r.jsxs("div", {
                                    className: "flex items-center justify-end gap-2",
                                    children: [
                                      r.jsx("button", {
                                        type: "button",
                                        onClick: () => {
                                          setEditingTradeNoteId(null);
                                          setTempTradeNote("");
                                        },
                                        className: "px-2 py-1 text-[11px] text-slate-400 hover:text-white cursor-pointer",
                                        children: "Cancel"
                                      }),
                                      r.jsx("button", {
                                        type: "button",
                                        onClick: () => {
                                          updateTradeMeta(deal.id, { note: tempTradeNote.trim() });
                                          setEditingTradeNoteId(null);
                                          setTempTradeNote("");
                                          showToast("Trade note saved & linked to Trader's Diary ✓");
                                        },
                                        className: "px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-bold cursor-pointer shadow-sm",
                                        children: "Save Note"
                                      })
                                    ]
                                  })
                                ]
                              })
                            ]
                          }, deal.id || dIdx);
                        })
                      })`;

if (!code.includes(dealMapOld)) {
  console.error("dealMapOld not found!");
  process.exit(1);
}

code = code.replace(dealMapOld, dealMapNew);

// 3. In Modal table, add Strategy & Notes column
const modalThOld = `                        r.jsx("th", { className: "py-2.5 px-3 text-right", children: "Net P&L" }),
                        r.jsx("th", { className: "py-2.5 px-3 text-center", children: "Outcome" })`;

const modalThNew = `                        r.jsx("th", { className: "py-2.5 px-3 text-right", children: "Net P&L" }),
                        r.jsx("th", { className: "py-2.5 px-3 text-center", children: "Outcome" }),
                        r.jsx("th", { className: "py-2.5 px-3", children: "Strategy & Notes" })`;

if (code.includes(modalThOld)) {
  code = code.replace(modalThOld, modalThNew);
}

const modalTdOld = `                          r.jsx("td", { className: "py-3 px-3 text-right font-bold " + (isWin ? "text-emerald-400" : isLoss ? "text-rose-400" : "text-slate-400"), children: formatValue(tr.profit) }),
                          r.jsx("td", { className: "py-3 px-3 text-center", children: r.jsx("span", { className: "px-2 py-0.5 rounded-full text-[10px] font-black " + (isWin ? "bg-emerald-500/20 text-emerald-400" : isLoss ? "bg-rose-500/20 text-rose-400" : "bg-slate-800 text-slate-400"), children: isWin ? "WIN" : isLoss ? "LOSS" : "BE" }) })`;

const modalTdNew = `                          r.jsx("td", { className: "py-3 px-3 text-right font-bold " + (isWin ? "text-emerald-400" : isLoss ? "text-rose-400" : "text-slate-400"), children: formatValue(tr.profit) }),
                          r.jsx("td", { className: "py-3 px-3 text-center", children: r.jsx("span", { className: "px-2 py-0.5 rounded-full text-[10px] font-black " + (isWin ? "bg-emerald-500/20 text-emerald-400" : isLoss ? "bg-rose-500/20 text-rose-400" : "bg-slate-800 text-slate-400"), children: isWin ? "WIN" : isLoss ? "LOSS" : "BE" }) }),
                          r.jsxs("td", {
                            className: "py-3 px-3 text-xs",
                            children: [
                              r.jsxs("div", {
                                className: "flex items-center gap-1.5 flex-wrap",
                                children: [
                                  r.jsx("span", {
                                    className: "text-[11px] font-bold text-cyan-300",
                                    children: ((journalStorage && journalStorage.tradeMeta && journalStorage.tradeMeta[tr.id] && journalStorage.tradeMeta[tr.id].strategy) || "Manual")
                                  }),
                                  (journalStorage && journalStorage.tradeMeta && journalStorage.tradeMeta[tr.id] && journalStorage.tradeMeta[tr.id].execution === "pass") && r.jsx("span", { className: "px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400", children: "Passed ✓" }),
                                  (journalStorage && journalStorage.tradeMeta && journalStorage.tradeMeta[tr.id] && journalStorage.tradeMeta[tr.id].execution === "fail") && r.jsx("span", { className: "px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400", children: "Violated ✗" })
                                ]
                              }),
                              (journalStorage && journalStorage.tradeMeta && journalStorage.tradeMeta[tr.id] && journalStorage.tradeMeta[tr.id].note) && r.jsx("div", {
                                className: "text-[10px] text-purple-300 italic truncate max-w-[160px] mt-0.5",
                                title: journalStorage.tradeMeta[tr.id].note,
                                children: journalStorage.tradeMeta[tr.id].note
                              })
                            ]
                          })`;

if (code.includes(modalTdOld)) {
  code = code.replace(modalTdOld, modalTdNew);
}

fs.writeFileSync(file, code, "utf-8");
console.log("Successfully patched assets/index-BmjL0JbS.js with custom dropdown!");
