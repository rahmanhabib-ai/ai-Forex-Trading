// Forex AI News V2.2 — Institutional Crypto Payment Gateway & Automated Gmail Verification Desk
// Compatible with bundle runtime: Xo(), b (React), r (jsx runtime), iu (lucide loader)

function PaymentGatewayPage({ page: t, section: e, portalType: n, preselectedPackageId: initPkg, onBackToPackages: onBack }) {
  const { currentUser: user, language: lang } = Xo();
  const isAdmin = user && (user.role === "admin" || user.id === "usr_admin_master");
  const s = (bn, en) => (lang === "bn" ? bn : en);

  // Active top-level tab for Admin: "checkout" | "settings" | "email_logs"
  const [adminTab, setAdminTab] = b.useState("checkout");

  // Client Checkout States
  const [activeMethod, setActiveMethod] = b.useState("binance");
  const [packageId, setPackageId] = b.useState(initPkg || "standard");
  const [senderAccount, setSenderAccount] = b.useState("");
  const [transactionId, setTransactionId] = b.useState("");
  const [notes, setNotes] = b.useState("");
  const [copiedKey, setCopiedKey] = b.useState(null);
  const [isSubmitting, setIsSubmitting] = b.useState(false);
  const [submitResult, setSubmitResult] = b.useState(null);
  const [paymentsList, setPaymentsList] = b.useState([]);
  const [loadingHistory, setLoadingHistory] = b.useState(true);

  // Gateway Settings State (Dynamic from /api/payments/settings)
  const [gatewaySettings, setGatewaySettings] = b.useState({
    binancePayId: "336527372",
    binanceEmail: "m.rahmanhabib.my@gmail.com",
    binanceTrc20: "TJD9MM68dkpFN8pxkfKsKTqyECuF9cCPZm",
    binanceBep20: "",
    binanceQrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=binance://pay?payId=336527372",
    bybitUid: "412658047",
    bybitEmail: "m.rahmanhabib.my@gmail.com",
    bybitTrc20: "TBaKmVu6kGeB1ew9hDgMbUvqrDWeur8DSf",
    bybitQrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=bybit://transfer?uid=412658047",
    gmailAccount: "m.rahmanhabib.my@gmail.com",
    webhookSecret: "forex_ai_crypto_verify_secret_2026",
    autoVerificationEnabled: true,
    syncIntervalSeconds: 60,
    totalAutoApprovedCount: 1,
    lastSyncAt: new Date().toISOString(),
  });
  const [isSavingSettings, setIsSavingSettings] = b.useState(false);
  const [settingsSaveMsg, setSettingsSaveMsg] = b.useState("");

  // Email Logs State
  const [emailLogs, setEmailLogs] = b.useState([]);
  // Gmail Verification Engine Mode: "method2" (Pub/Sub 1-Second Push) | "method1" (Apps Script 60s Polling)
  const [verificationMethod, setVerificationMethod] = b.useState("method2");
  const [isPubSubTesting, setIsPubSubTesting] = b.useState(false);
  const [pubSubLatency, setPubSubLatency] = b.useState(null);
  const [pubSubTestResult, setPubSubTestResult] = b.useState(null);
  const [isSimulating, setIsSimulating] = b.useState(false);
  const [simulationResult, setSimulationResult] = b.useState("");

  const packagesMap = {
    free_starter: { id: "free_starter", name: s("৭ দিন ফ্রি ট্রায়াল (Free Starter)", "7-Day Free Trial"), usd: 0 },
    standard: { id: "standard", name: s("স্ট্যান্ডার্ড ট্রেডার (29 USDT / $29)", "Standard Trader (29 USDT / $29)"), usd: 29 },
    vip_pro: { id: "vip_pro", name: s("ভিআইপি প্রো (79 USDT / $79)", "VIP Institutional Pro (79 USDT / $79)"), usd: 79 },
    lifetime_alpha: { id: "lifetime_alpha", name: s("লাইফটাইম আলফা (199 USDT / $199)", "Lifetime Alpha (199 USDT / $199)"), usd: 199 },
  };
  const selectedPkg = packagesMap[packageId] || packagesMap.standard;

  // Load live payments & gateway settings
  const refreshData = () => {
    fetch("/api/payments")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.payments) setPaymentsList(d.payments);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));

    fetch("/api/payments/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.settings) setGatewaySettings(d.settings);
      })
      .catch(() => {});

    if (isAdmin) {
      fetch("/api/payments/email-logs")
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.logs) setEmailLogs(d.logs);
        })
        .catch(() => {});
    }
  };

  b.useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text, key) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch (e) {}
  };

  const handleSubmitProof = async (ev) => {
    if (ev) ev.preventDefault();
    if (!transactionId.trim()) {
      alert(s("অনুগ্রহ করে ট্রানজেকশন আইডি / হ্যাশ (TxID) লিখুন।", "Please enter your Transaction ID (TxID)."));
      return;
    }
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await fetch("/api/payments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPkg.id,
          packageName: selectedPkg.name,
          amountUsd: selectedPkg.usd,
          method: activeMethod,
          senderAccount: senderAccount.trim(),
          transactionId: transactionId.trim(),
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        const isAutoApproved = data.payment && data.payment.status === "APPROVED";
        setSubmitResult({
          success: true,
          message: isAutoApproved
            ? s("⚡ অভিনন্দন! জিমেইল ভেরিফিকেশনের মাধ্যমে আপনার পেমেন্ট তাৎক্ষণিক অনুমোদিত (Approved) হয়েছে!", "⚡ Congratulations! Instant auto-approval verified via Gmail!")
            : s("ক্রিপ্টো পেমেন্ট প্রমাণ জমা হয়েছে! সিস্টেম স্বয়ংক্রিয়ভাবে জিমেইল নোটিফিকেশনের সাথে মিলিয়ে অনুমোদন করে দেবে।", "Proof submitted! System will auto-verify against Gmail notifications shortly."),
        });
        setTransactionId("");
        setSenderAccount("");
        setNotes("");
        refreshData();
      } else {
        setSubmitResult({ success: false, message: data.error || s("সাবমিশনে সমস্যা হয়েছে।", "Submission error.") });
      }
    } catch (e) {
      setSubmitResult({ success: false, message: s("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি।", "Network error.") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSettings = async (ev) => {
    if (ev) ev.preventDefault();
    setIsSavingSettings(true);
    setSettingsSaveMsg("");

    try {
      const res = await fetch("/api/payments/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gatewaySettings),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSaveMsg(s("✅ ক্রিপ্টো গেটওয়ে ও জিমেইল সেটিংস সফলভাবে সংরক্ষিত হয়েছে!", "✅ Settings saved successfully!"));
        setGatewaySettings(data.settings);
        setTimeout(() => setSettingsSaveMsg(""), 3500);
      } else {
        setSettingsSaveMsg("Error saving settings");
      }
    } catch (err) {
      setSettingsSaveMsg("Network error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleTestPubSubPush = async (platform = "binance") => {
    setIsPubSubTesting(true);
    setPubSubTestResult(null);
    setPubSubLatency(null);
    const startTime = performance.now();
    try {
      const token = localStorage.getItem("auth_token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/payments/simulate-pubsub", {
        method: "POST",
        headers,
        body: JSON.stringify({
          platform: platform,
          amount: selectedPkg.usd || 29,
          senderName: platform === "bybit" ? "Bybit UID 412658047" : "Binance User 336527372",
        }),
      });
      const data = await res.json();
      const elapsed = Math.round(performance.now() - startTime);
      setPubSubLatency(elapsed);
      setPubSubTestResult(data);
      refreshData();
      if (data.success && data.message) {
        setSimulationResult(data.message);
      }
    } catch (e) {
      setPubSubTestResult({ error: "Network error during Pub/Sub push" });
    } finally {
      setIsPubSubTesting(false);
    }
  };

  const handleSimulateDeposit = async (platform) => {
    setIsSimulating(true);
    setSimulationResult("");
    try {
      const res = await fetch("/api/payments/simulate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: platform,
          amount: selectedPkg.usd || 29,
          senderName: platform === "binance" ? "Binance User (Pay ID: 94810239)" : "Bybit UID 184920381",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSimulationResult(data.message);
        refreshData();
      } else {
        setSimulationResult(data.error || "Simulation error");
      }
    } catch (e) {
      setSimulationResult("Simulation network error");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleUpdateStatus = async (paymentId, newStatus) => {
    try {
      const res = await fetch("/api/payments/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: paymentId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        refreshData();
      }
    } catch (e) {}
  };

  return r.jsxs("div", {
    className: "max-w-6xl mx-auto space-y-7 pb-20 animate-fade-in px-2 sm:px-4 text-left text-slate-100",
    children: [
      // Top Header
      r.jsxs("div", {
        className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800",
        children: [
          r.jsxs("div", {
            className: "flex items-center gap-3.5",
            children: [
              r.jsx("div", {
                className: "w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold shadow-md",
                children: r.jsx(iu("Wallet"), { className: "w-6 h-6" }),
              }),
              r.jsxs("div", {
                children: [
                  r.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [
                      r.jsx("h1", {
                        className: "text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight",
                        children: s("ক্রিপ্টো পেমেন্ট গেটওয়ে ও অটো-ভেরিফিকেশন ডেস্ক", "Crypto Payment Gateway & Auto-Verification"),
                      }),
                      r.jsx("span", {
                        className: "px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase",
                        children: "⚡ Gmail Auto-Sync",
                      }),
                    ],
                  }),
                  r.jsx("p", {
                    className: "text-xs text-slate-500 dark:text-slate-400 mt-0.5",
                    children: s(
                      "বাইনান্স পে (Binance Pay) ও বাইবিট (Bybit) এর মাধ্যমে সরাসরি USDT ট্রান্সফার ও রিয়েল-টাইম জিমেইল কনফার্মেশন",
                      "Direct USDT Transfer via Binance Pay & Bybit with automated Gmail transaction verification"
                    ),
                  }),
                ],
              }),
            ],
          }),
          onBack &&
            r.jsxs("button", {
              onClick: onBack,
              className: "px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer",
              children: [s("← প্যাকেজ তালিকায় ফিরে যান", "← Back to Packages")],
            }),
        ],
      }),

      // Admin Management Tabs (If admin)
      isAdmin &&
        r.jsxs("div", {
          className: "flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800",
          children: [
            r.jsxs("button", {
              onClick: () => setAdminTab("checkout"),
              className: `px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                adminTab === "checkout" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
              }`,
              children: [r.jsx(iu("Coins"), { className: "w-4 h-4" }), s("ইউজার চেকআউট ডেস্ক", "User Checkout View")],
            }),
            r.jsxs("button", {
              onClick: () => setAdminTab("settings"),
              className: `px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                adminTab === "settings" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
              }`,
              children: [r.jsx(iu("Shield"), { className: "w-4 h-4" }), s("⚙️ অ্যাডমিন ক্রিপ্টো কনফিগ ও জিমেইল সেটিংস", "⚙️ Gateway & Gmail Settings")],
            }),
            r.jsxs("button", {
              onClick: () => setAdminTab("email_logs"),
              className: `px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                adminTab === "email_logs" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
              }`,
              children: [
                r.jsx(iu("Mail"), { className: "w-4 h-4" }),
                s("ইনবক্স ডিপোজিট লগস", "Gmail Deposit Logs"),
                r.jsx("span", {
                  className: "px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-400 text-[10px] font-mono",
                  children: emailLogs.length,
                }),
              ],
            }),
          ],
        }),

      // =========================================================================
      // TAB 1: Client Checkout Desk
      // =========================================================================
      adminTab === "checkout" &&
        r.jsxs("div", {
          className: "space-y-6 animate-fade-in",
          children: [
            // Selected Plan Indicator
            r.jsxs("div", {
              className: "p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm",
              children: [
                r.jsxs("div", {
                  className: "flex items-center gap-3.5",
                  children: [
                    r.jsx("div", {
                      className: "w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold",
                      children: r.jsx(iu("Coins"), { className: "w-6 h-6" }),
                    }),
                    r.jsxs("div", {
                      children: [
                        r.jsx("span", {
                          className: "text-[10px] font-black uppercase tracking-wider text-amber-500 block",
                          children: s("নির্বাচিত প্যাকেজ ও প্রদেয় ফি (USDT)", "Selected Package & Amount"),
                        }),
                        r.jsx("h3", { className: "text-base sm:text-lg font-black text-slate-900 dark:text-white", children: selectedPkg.name }),
                        r.jsxs("p", {
                          className: "text-xs text-slate-500",
                          children: [
                            s("মোট প্রদেয়: ", "Total: "),
                            r.jsx("strong", { className: "text-amber-500 font-bold", children: `${selectedPkg.usd} USDT` }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                r.jsxs("div", {
                  className: "flex items-center gap-2 w-full sm:w-auto",
                  children: [
                    r.jsx("label", {
                      className: "text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0",
                      children: s("প্যাকেজ পরিবর্তন:", "Change Plan:"),
                    }),
                    r.jsx("select", {
                      value: packageId,
                      onChange: (ev) => setPackageId(ev.target.value),
                      className: "flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none",
                      children: Object.values(packagesMap).map((p) => r.jsx("option", { value: p.id, children: p.name }, p.id)),
                    }),
                  ],
                }),
              ],
            }),

            // Dynamic Automated Gmail Banner (Method Specific)
            r.jsxs("div", {
              className: `p-4 rounded-2xl border flex items-center justify-between gap-4 shadow-sm transition-all ${
                activeMethod === "binance"
                  ? "bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border-amber-500/40"
                  : "bg-gradient-to-r from-orange-950/40 via-slate-900 to-orange-950/20 border-orange-500/40"
              }`,
              children: [
                r.jsxs("div", {
                  className: "flex items-center gap-3",
                  children: [
                    r.jsx("div", {
                      className: `w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        activeMethod === "binance" ? "bg-amber-500/20 text-amber-400" : "bg-orange-500/20 text-orange-400"
                      }`,
                      children: r.jsx(iu("Zap"), { className: "w-5 h-5" }),
                    }),
                    r.jsxs("div", {
                      children: [
                        r.jsx("h4", {
                          className: `text-xs font-black flex items-center gap-1.5 ${
                            activeMethod === "binance" ? "text-amber-400" : "text-orange-400"
                          }`,
                          children:
                            activeMethod === "binance"
                              ? s("⚡ বাইনান্স পে (Binance Pay) জিমেইল অটো-ভেরিফিকেশন সক্রিয়", "⚡ Binance Pay Instant Auto-Verification Active")
                              : s("⚡ বাইবিট পে (Bybit Transfer) জিমেইল অটো-ভেরিফিকেশন সক্রিয়", "⚡ Bybit Pay Instant Auto-Verification Active"),
                        }),
                        r.jsx("p", {
                          className: "text-[11px] text-slate-400 leading-snug mt-0.5",
                          children:
                            activeMethod === "binance"
                              ? s(
                                  "বাইনান্স পে (Pay ID: 336527372) বা USDT TRC-20 তে ডলার পাঠিয়ে নিচের বক্সে আপনার Order ID বা TxID দিন। বাইনান্স থেকে কনফার্মেশন মেইল আসামাত্রই স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট আনলক হয়ে যাবে।",
                                  "Send via Binance Pay ID (336527372) or USDT TRC-20, then submit your Order ID / TxID. Subscription activates automatically when Binance confirms."
                                )
                              : s(
                                  "বাইবিট (Bybit UID: 412658047) ০% ফি ইন্টারনাল ট্রান্সফারে ডলার পাঠিয়ে নিচের বক্সে আপনার Transfer ID বা TxID দিন। বাইবিট থেকে কনফার্মেশন মেইল আসামাত্রই স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট আনলক হয়ে যাবে।",
                                  "Send via Bybit Internal Transfer (UID: 412658047) with 0% fee, then submit your Transfer ID / TxID. Subscription activates automatically when Bybit confirms."
                                ),
                        }),
                      ],
                    }),
                  ],
                }),
                r.jsx("span", {
                  className: `hidden sm:inline px-3 py-1 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                    activeMethod === "binance"
                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                      : "bg-orange-500/10 border border-orange-500/30 text-orange-300"
                  }`,
                  children: activeMethod === "binance" ? "Binance Instant" : "Bybit Instant",
                }),
              ],
            }),

            // 2 Payment Methods Selector
            r.jsxs("div", {
              className: "space-y-3",
              children: [
                r.jsx("label", {
                  className: "block text-xs font-black uppercase tracking-wider text-slate-400",
                  children: s("ক্রিপ্টো পেমেন্ট মাধ্যম বেছে নিন (Select Crypto Method):", "Select Crypto Method:"),
                }),
                r.jsxs("div", {
                  className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
                  children: [
                    // Binance Card
                    r.jsxs("button", {
                      type: "button",
                      onClick: () => {
                        setActiveMethod("binance");
                        setTransactionId("");
                        setSenderAccount("");
                      },
                      className: `p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center justify-between text-left cursor-pointer ${
                        activeMethod === "binance"
                          ? "border-amber-500 bg-amber-500/10 shadow-md ring-2 ring-amber-500/20"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300"
                      }`,
                      children: [
                        r.jsxs("div", {
                          className: "flex items-center gap-3.5",
                          children: [
                            r.jsx("div", {
                              className: "w-11 h-11 rounded-xl bg-[#F3BA2F]/20 flex items-center justify-center font-black text-[#F3BA2F] text-base shrink-0",
                              children: "BN",
                            }),
                            r.jsxs("div", {
                              children: [
                                r.jsx("h4", { className: "font-black text-sm text-slate-900 dark:text-white", children: s("১. বাইনান্স পে (Binance Pay)", "1. Binance Pay") }),
                                r.jsx("p", { className: "text-[11px] text-amber-400 font-medium", children: "Pay ID: 336527372 / USDT TRC-20" }),
                              ],
                            }),
                          ],
                        }),
                        activeMethod === "binance" && r.jsx(iu("CheckCircle"), { className: "w-5 h-5 text-amber-500 shrink-0" }),
                      ],
                    }),

                    // Bybit Card
                    r.jsxs("button", {
                      type: "button",
                      onClick: () => {
                        setActiveMethod("bybit");
                        setTransactionId("");
                        setSenderAccount("");
                      },
                      className: `p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center justify-between text-left cursor-pointer ${
                        activeMethod === "bybit"
                          ? "border-orange-500 bg-orange-500/10 shadow-md ring-2 ring-orange-500/20"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-300"
                      }`,
                      children: [
                        r.jsxs("div", {
                          className: "flex items-center gap-3.5",
                          children: [
                            r.jsx("div", {
                              className: "w-11 h-11 rounded-xl bg-orange-500/20 flex items-center justify-center font-black text-orange-500 text-base shrink-0",
                              children: "BY",
                            }),
                            r.jsxs("div", {
                              children: [
                                r.jsx("h4", { className: "font-black text-sm text-slate-900 dark:text-white", children: s("২. বাইবিট পে (Bybit Pay)", "2. Bybit Pay") }),
                                r.jsx("p", { className: "text-[11px] text-orange-400 font-medium", children: "Bybit UID: 412658047 (০% ফি ট্রান্সফার)" }),
                              ],
                            }),
                          ],
                        }),
                        activeMethod === "bybit" && r.jsx(iu("CheckCircle"), { className: "w-5 h-5 text-orange-500 shrink-0" }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            // Payment Instructions Card
            r.jsxs("div", {
              className: "bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6",
              children: [
                activeMethod === "binance" &&
                  r.jsxs("div", {
                    className: "space-y-5 animate-fade-in",
                    children: [
                      r.jsxs("div", {
                        className: "flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800",
                        children: [
                          r.jsxs("div", {
                            className: "flex items-center gap-2.5",
                            children: [
                              r.jsx("span", {
                                className: "px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-black text-xs",
                                children: s("বাইনান্স পে (Binance Pay)", "Binance Pay"),
                              }),
                              r.jsx("span", { className: "text-xs text-slate-400", children: s("ইনস্ট্যান্ট ও নিরাপদ ক্রিপ্টো পেমেন্ট", "Instant & Secure Crypto Transfer") }),
                            ],
                          }),
                          r.jsx("span", {
                            className: "text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-800",
                            children: "0% Transfer Fee",
                          }),
                        ],
                      }),

                      r.jsxs("div", {
                        className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                        children: [
                          // 1. Binance Pay ID
                          r.jsxs("div", {
                            className: "p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2",
                            children: [
                              r.jsx("span", {
                                className: "text-[10px] font-black uppercase tracking-wider text-amber-300",
                                children: s("১. অফিসিয়াল Binance Pay ID (সরাসরি পে আইডি):", "1. Official Binance Pay ID:"),
                              }),
                              r.jsxs("div", {
                                className: "flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-amber-500/40 font-mono text-sm font-black text-amber-400",
                                children: [
                                  r.jsx("span", { children: gatewaySettings.binancePayId }),
                                  r.jsxs("button", {
                                    type: "button",
                                    onClick: () => handleCopy(gatewaySettings.binancePayId, "binance_pay_id"),
                                    className: "px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black transition-colors flex items-center gap-1 cursor-pointer",
                                    children: [
                                      r.jsx(iu(copiedKey === "binance_pay_id" ? "Check" : "Copy"), { className: "w-3 h-3" }),
                                      copiedKey === "binance_pay_id" ? s("কপি হয়েছে!", "Copied!") : s("কপি", "Copy"),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),

                          // 2. Binance TRC20 Address
                          r.jsxs("div", {
                            className: "p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2",
                            children: [
                              r.jsx("span", {
                                className: "text-[10px] font-black uppercase tracking-wider text-slate-300",
                                children: "২. USDT Deposit Address (Network: TRC-20 Only):",
                              }),
                              r.jsxs("div", {
                                className: "flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-[11px] font-bold text-slate-200 truncate",
                                children: [
                                  r.jsx("span", { className: "truncate", children: gatewaySettings.binanceTrc20 }),
                                  r.jsxs("button", {
                                    type: "button",
                                    onClick: () => handleCopy(gatewaySettings.binanceTrc20, "binance_trc20"),
                                    className: "px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer",
                                    children: [
                                      r.jsx(iu(copiedKey === "binance_trc20" ? "Check" : "Copy"), { className: "w-3 h-3" }),
                                      copiedKey === "binance_trc20" ? s("কপি হয়েছে!", "Copied!") : s("কপি", "Copy"),
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

                activeMethod === "bybit" &&
                  r.jsxs("div", {
                    className: "space-y-5 animate-fade-in",
                    children: [
                      r.jsxs("div", {
                        className: "flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800",
                        children: [
                          r.jsxs("div", {
                            className: "flex items-center gap-2.5",
                            children: [
                              r.jsx("span", {
                                className: "px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 font-black text-xs",
                                children: s("বাইবিট পে (Bybit Internal Transfer)", "Bybit Pay"),
                              }),
                              r.jsx("span", { className: "text-xs text-slate-400", children: s("জিরো ফি ইন্টারনাল ট্রান্সফার", "Zero Fee Internal Transfer") }),
                            ],
                          }),
                          r.jsx("span", {
                            className: "text-[11px] font-bold text-orange-400 bg-orange-950/40 px-2.5 py-0.5 rounded-full border border-orange-800",
                            children: "Instant Bybit Transfer",
                          }),
                        ],
                      }),

                      r.jsxs("div", {
                        className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                        children: [
                          // 1. Bybit UID
                          r.jsxs("div", {
                            className: "p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 space-y-2",
                            children: [
                              r.jsx("span", {
                                className: "text-[10px] font-black uppercase tracking-wider text-orange-300",
                                children: s("১. অফিসিয়াল Bybit UID (ইন্টারনাল ০% ফি ট্রান্সফার):", "1. Official Bybit UID:"),
                              }),
                              r.jsxs("div", {
                                className: "flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-orange-500/40 font-mono text-sm font-black text-orange-400",
                                children: [
                                  r.jsx("span", { children: gatewaySettings.bybitUid }),
                                  r.jsxs("button", {
                                    type: "button",
                                    onClick: () => handleCopy(gatewaySettings.bybitUid, "bybit_uid"),
                                    className: "px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 text-[10px] font-black transition-colors flex items-center gap-1 cursor-pointer",
                                    children: [
                                      r.jsx(iu(copiedKey === "bybit_uid" ? "Check" : "Copy"), { className: "w-3 h-3" }),
                                      copiedKey === "bybit_uid" ? s("কপি হয়েছে!", "Copied!") : s("কপি", "Copy"),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),

                          // 2. Bybit TRC20 Address
                          r.jsxs("div", {
                            className: "p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2",
                            children: [
                              r.jsx("span", {
                                className: "text-[10px] font-black uppercase tracking-wider text-slate-300",
                                children: "২. Bybit USDT Deposit Address (Network: TRC-20):",
                              }),
                              r.jsxs("div", {
                                className: "flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-[11px] font-bold text-slate-200 truncate",
                                children: [
                                  r.jsx("span", { className: "truncate", children: gatewaySettings.bybitTrc20 }),
                                  r.jsxs("button", {
                                    type: "button",
                                    onClick: () => handleCopy(gatewaySettings.bybitTrc20, "bybit_trc20"),
                                    className: "px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer",
                                    children: [
                                      r.jsx(iu(copiedKey === "bybit_trc20" ? "Check" : "Copy"), { className: "w-3 h-3" }),
                                      copiedKey === "bybit_trc20" ? s("কপি হয়েছে!", "Copied!") : s("কপি", "Copy"),
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

                // Dynamic Payment Submission Form (Strictly separated for Binance vs Bybit)
                r.jsxs("form", {
                  onSubmit: handleSubmitProof,
                  className: "pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4",
                  children: [
                    r.jsxs("div", {
                      className: "flex items-center justify-between pb-1",
                      children: [
                        r.jsxs("div", {
                          className: "flex items-center gap-2",
                          children: [
                            r.jsx("span", {
                              className: `w-2.5 h-2.5 rounded-full ${activeMethod === "binance" ? "bg-amber-400" : "bg-orange-400"}`,
                            }),
                            r.jsx("h4", {
                              className: "text-sm font-black text-slate-900 dark:text-white",
                              children:
                                activeMethod === "binance"
                                  ? s("বাইনান্স পে প্রমাণ সাবমিট করুন (Submit Binance Pay Proof)", "Submit Binance Pay Proof")
                                  : s("বাইবিট পে প্রমাণ সাবমিট করুন (Submit Bybit Pay Proof)", "Submit Bybit Pay Proof"),
                            }),
                          ],
                        }),
                        r.jsx("span", {
                          className: `text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            activeMethod === "binance"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                          }`,
                          children: activeMethod === "binance" ? "Binance Auto-Match" : "Bybit Auto-Match",
                        }),
                      ],
                    }),

                    r.jsxs("div", {
                      className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
                      children: [
                        // Method-specific Sender input
                        r.jsxs("div", {
                          className: "space-y-1.5",
                          children: [
                            r.jsx("label", {
                              className: "block text-xs font-bold text-slate-600 dark:text-slate-300",
                              children:
                                activeMethod === "binance"
                                  ? s("আপনার প্রেরক বাইনান্স পে আইডি / ইউআইডি (ঐচ্ছিক):", "Your Sender Binance Pay ID / UID (Optional):")
                                  : s("আপনার প্রেরক বাইবিট ইউআইডি (ঐচ্ছিক):", "Your Sender Bybit UID (Optional):"),
                            }),
                            r.jsx("input", {
                              type: "text",
                              value: senderAccount,
                              onChange: (e) => setSenderAccount(e.target.value),
                              placeholder:
                                activeMethod === "binance"
                                  ? "যেমন: Pay ID 94810239 বা আপনার বাইনান্স আইডি"
                                  : "যেমন: আপনার Bybit UID 184920381",
                              className: "w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500",
                            }),
                          ],
                        }),

                        // Method-specific TxID input
                        r.jsxs("div", {
                          className: "space-y-1.5",
                          children: [
                            r.jsxs("label", {
                              className: "block text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between",
                              children: [
                                r.jsx("span", {
                                  children:
                                    activeMethod === "binance"
                                      ? s("বাইনান্স পে অর্ডার আইডি বা TxID: *", "Binance Pay Order ID / TxID: *")
                                      : s("বাইবিট ট্রান্সফার আইডি বা TxID: *", "Bybit Transfer ID / TxID: *"),
                                }),
                                r.jsx("span", {
                                  className: `text-[10px] font-mono ${activeMethod === "binance" ? "text-amber-400" : "text-orange-400"}`,
                                  children: "Gmail Auto-Match Key",
                                }),
                              ],
                            }),
                            r.jsx("input", {
                              type: "text",
                              required: true,
                              value: transactionId,
                              onChange: (e) => setTransactionId(e.target.value),
                              placeholder:
                                activeMethod === "binance"
                                  ? "যেমন: 29841029384 অথবা TXB89102934812"
                                  : "যেমন: BYB9384810293 অথবা ট্রানজেকশন হ্যাশ",
                              className: `w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none ${
                                activeMethod === "binance" ? "focus:border-amber-500" : "focus:border-orange-500"
                              }`,
                            }),
                          ],
                        }),
                      ],
                    }),

                    // Method-specific Guidance Tip
                    r.jsxs("div", {
                      className: `p-3 rounded-xl border text-[11px] flex items-center gap-2 ${
                        activeMethod === "binance"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-200"
                          : "bg-orange-500/10 border-orange-500/20 text-orange-200"
                      }`,
                      children: [
                        r.jsx(iu("AlertCircle"), { className: "w-4 h-4 shrink-0" }),
                        r.jsx("span", {
                          children:
                            activeMethod === "binance"
                              ? s(
                                  "💡 Binance অ্যাপের Pay হিস্ট্রি থেকে আপনার প্রাপ্ত Order ID বা TxID দিন। এটি স্বয়ংক্রিয়ভাবে আমাদের জিমেইলের সাথে ম্যাচ হয়ে যাবে।",
                                  "💡 Copy your Order ID or TxID from Binance Pay history. It matches instantly with our Gmail notification."
                                )
                              : s(
                                  "💡 Bybit অ্যাপের Transfer / Withdrawal রেকর্ড থেকে ট্রান্সফার আইডি দিন। এটি স্বয়ংক্রিয়ভাবে আমাদের জিমেইলের সাথে ম্যাচ হয়ে যাবে।",
                                  "💡 Copy your Transfer ID or TxID from Bybit transfer history. It matches instantly with our Gmail notification."
                                ),
                        }),
                      ],
                    }),

                    r.jsxs("button", {
                      type: "submit",
                      disabled: isSubmitting,
                      className: `w-full py-3.5 rounded-2xl text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2 ${
                        activeMethod === "binance"
                          ? "bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-amber-500/25"
                          : "bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/25"
                      }`,
                      children: [
                        r.jsx(iu("Zap"), { className: `w-4 h-4 ${isSubmitting ? "animate-pulse" : ""}` }),
                        isSubmitting
                          ? s("যাচাইকরণ প্রক্রিয়াধীন...", "Verifying via Gmail...")
                          : activeMethod === "binance"
                          ? s("⚡ বাইনান্স পেমেন্ট প্রমাণ নিশ্চিত করুন (Verify Binance Payment)", "⚡ Verify Binance Payment via Gmail")
                          : s("⚡ বাইবিট পেমেন্ট প্রমাণ নিশ্চিত করুন (Verify Bybit Payment)", "⚡ Verify Bybit Payment via Gmail"),
                      ],
                    }),

                    submitResult &&
                      r.jsxs("div", {
                        className: `p-4 rounded-2xl border text-xs font-medium animate-fade-in ${
                          submitResult.success
                            ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                            : "bg-rose-950/60 border-rose-500/40 text-rose-200"
                        }`,
                        children: [
                          r.jsxs("div", {
                            className: "flex items-center gap-2 font-bold mb-1",
                            children: [
                              r.jsx(iu(submitResult.success ? "CheckCircle" : "AlertCircle"), {
                                className: `w-4 h-4 ${submitResult.success ? "text-emerald-400" : "text-rose-400"}`,
                              }),
                              submitResult.success ? s("সাবমিশন সফল হয়েছে!", "Submission Successful!") : s("ত্রুটি", "Error"),
                            ],
                          }),
                          r.jsx("p", { children: submitResult.message }),
                        ],
                      }),
                  ],
                }),
              ],
            }),

            // Recent Payments Table
            r.jsxs("div", {
              className: "bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5",
              children: [
                r.jsxs("div", {
                  className: "flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800",
                  children: [
                    r.jsxs("div", {
                      className: "flex items-center gap-3",
                      children: [
                        r.jsx("div", {
                          className: "w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold",
                          children: r.jsx(iu("Clock"), { className: "w-5 h-5" }),
                        }),
                        r.jsxs("div", {
                          children: [
                            r.jsx("h2", {
                              className: "font-black text-base sm:text-lg text-slate-900 dark:text-white",
                              children: s("সাম্প্রতিক ক্রিপ্টো ট্রানজেকশন হিস্ট্রি", "Recent Crypto Transactions"),
                            }),
                            r.jsx("p", {
                              className: "text-xs text-slate-400",
                              children: s("জমা দেওয়া ক্রিপ্টো পেমেন্ট প্রমাণের স্ট্যাটাস ও ইতিহাস", "Status and audit trail of your submitted USDT payments"),
                            }),
                          ],
                        }),
                      ],
                    }),
                    r.jsxs("span", { className: "text-xs font-bold text-slate-400", children: [s("মোট: ", "Total: "), paymentsList.length] }),
                  ],
                }),

                paymentsList.length === 0
                  ? r.jsxs("div", {
                      className: "text-center py-8 text-slate-400 space-y-2",
                      children: [
                        r.jsx(iu("Inbox"), { className: "w-8 h-8 mx-auto opacity-30" }),
                        r.jsx("p", { className: "text-xs font-bold", children: s("এখনও কোনো পেমেন্ট রেকর্ড নেই।", "No payment submissions recorded yet.") }),
                      ],
                    })
                  : r.jsx("div", {
                      className: "overflow-x-auto",
                      children: r.jsxs("table", {
                        className: "w-full text-left text-xs",
                        children: [
                          r.jsx("thead", {
                            className: "bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px]",
                            children: r.jsxs("tr", {
                              children: [
                                r.jsx("th", { className: "p-3 sm:p-4 rounded-l-xl", children: s("প্যাকেজ", "Package") }),
                                r.jsx("th", { className: "p-3 sm:p-4", children: s("মাধ্যম", "Method") }),
                                r.jsx("th", { className: "p-3 sm:p-4", children: s("ট্রানজেকশন আইডি (TxID)", "TxID") }),
                                r.jsx("th", { className: "p-3 sm:p-4", children: s("অ্যামাউন্ট", "Amount") }),
                                r.jsx("th", { className: "p-3 sm:p-4", children: s("ভেরিফিকেশন মোড", "Mode") }),
                                r.jsx("th", { className: "p-3 sm:p-4", children: s("তারিখ", "Date") }),
                                r.jsx("th", { className: "p-3 sm:p-4 rounded-r-xl text-right", children: s("স্ট্যাটাস", "Status") }),
                              ],
                            }),
                          }),
                          r.jsx("tbody", {
                            className: "divide-y divide-slate-800 font-medium",
                            children: paymentsList.map((item) =>
                              r.jsxs(
                                "tr",
                                {
                                  key: item.id,
                                  className: "hover:bg-slate-800/40 transition-colors",
                                  children: [
                                    r.jsxs("td", {
                                      className: "p-3 sm:p-4",
                                      children: [
                                        r.jsx("div", { className: "font-bold text-slate-100", children: item.packageName }),
                                        item.notes && r.jsx("div", { className: "text-[10px] text-slate-400 mt-0.5", children: item.notes }),
                                      ],
                                    }),
                                    r.jsx("td", {
                                      className: "p-3 sm:p-4",
                                      children: r.jsx("span", {
                                        className: `inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                          item.method === "binance"
                                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                            : "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                                        }`,
                                        children: item.method === "binance" ? "Binance Pay" : "Bybit Pay",
                                      }),
                                    }),
                                    r.jsx("td", { className: "p-3 sm:p-4 font-mono text-[11px] text-slate-300 font-bold", children: item.transactionId }),
                                    r.jsxs("td", { className: "p-3 sm:p-4 font-bold text-amber-400", children: [`${item.amountUsd} USDT`] }),
                                    r.jsx("td", {
                                      className: "p-3 sm:p-4",
                                      children: r.jsx("span", {
                                        className: `px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                          item.verifiedMethod === "AUTOMATED_GMAIL"
                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                            : "bg-slate-800 text-slate-300"
                                        }`,
                                        children: item.verifiedMethod === "AUTOMATED_GMAIL" ? "⚡ GMAIL_AUTO" : "MANUAL",
                                      }),
                                    }),
                                    r.jsx("td", { className: "p-3 sm:p-4 text-slate-400 text-[11px]", children: new Date(item.createdAt).toLocaleDateString() }),
                                    r.jsxs("td", {
                                      className: "p-3 sm:p-4 text-right",
                                      children: [
                                        r.jsxs("span", {
                                          className: `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                                            item.status === "APPROVED"
                                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                          }`,
                                          children: [
                                            r.jsx("span", {
                                              className: `w-1.5 h-1.5 rounded-full ${item.status === "APPROVED" ? "bg-emerald-400" : "bg-amber-400 animate-ping"}`,
                                            }),
                                            item.status,
                                          ],
                                        }),
                                        isAdmin &&
                                          item.status === "PENDING" &&
                                          r.jsxs("div", {
                                            className: "flex items-center justify-end gap-1 mt-1",
                                            children: [
                                              r.jsx("button", {
                                                onClick: () => handleUpdateStatus(item.id, "APPROVED"),
                                                className: "px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer",
                                                children: "Approve",
                                              }),
                                              r.jsx("button", {
                                                onClick: () => handleUpdateStatus(item.id, "REJECTED"),
                                                className: "px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer",
                                                children: "Reject",
                                              }),
                                            ],
                                          }),
                                      ],
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

      // =========================================================================
      // TAB 2: Admin Gateway & Automated Gmail Configuration
      // =========================================================================
      isAdmin &&
        adminTab === "settings" &&
        r.jsxs("div", {
          className: "space-y-6 animate-fade-in",
          children: [
            r.jsxs("form", {
              onSubmit: handleSaveSettings,
              className: "bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl",
              children: [
                r.jsxs("div", {
                  className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800",
                  children: [
                    r.jsxs("div", {
                      children: [
                        r.jsx("h2", {
                          className: "text-lg font-black text-white flex items-center gap-2",
                          children: s("অ্যাডমিন ক্রিপ্টো কনফিগারেশন ও অটো-জিমেইল সেটিংস", "Admin Crypto Gateway & Gmail Setup"),
                        }),
                        r.jsx("p", {
                          className: "text-xs text-slate-400 mt-0.5",
                          children: s(
                            "আপনার আসল Binance Pay ID, Bybit UID এবং مشترক জিমেইল অ্যাকাউন্ট এখানে সেট করুন। এটি অবিলম্বে সমস্ত ইউজারের চেকআউট পেজে লাইভ হয়ে যাবে।",
                            "Configure your real Binance Pay ID, Bybit UID, TRC20 addresses, and shared Gmail reader."
                          ),
                        }),
                      ],
                    }),
                    r.jsxs("button", {
                      type: "submit",
                      disabled: isSavingSettings,
                      className: "px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50",
                      children: [
                        r.jsx(iu("Save"), { className: "w-4 h-4" }),
                        isSavingSettings ? s("সংরক্ষণ হচ্ছে...", "Saving...") : s("সেটিংস সেভ করুন", "Save Settings"),
                      ],
                    }),
                  ],
                }),

                settingsSaveMsg &&
                  r.jsx("div", {
                    className: "p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center",
                    children: settingsSaveMsg,
                  }),

                // Binance Section
                r.jsxs("div", {
                  className: "p-5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-4",
                  children: [
                    r.jsxs("div", {
                      className: "flex items-center gap-2 text-amber-400 font-black text-sm",
                      children: [r.jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-amber-400" }), "১. বাইনান্স পে রিসিভার তথ্য (Binance Receiver Settings)"],
                    }),
                    r.jsxs("div", {
                      className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
                      children: [
                        r.jsxs("div", {
                          className: "space-y-1",
                          children: [
                            r.jsx("label", { className: "text-xs font-bold text-slate-300", children: "Binance Pay ID (আপনার আসল পে আইডি):" }),
                            r.jsx("input", {
                              type: "text",
                              value: gatewaySettings.binancePayId,
                              onChange: (e) => setGatewaySettings({ ...gatewaySettings, binancePayId: e.target.value }),
                              className: "w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white outline-none focus:border-amber-400",
                            }),
                          ],
                        }),
                        r.jsxs("div", {
                          className: "space-y-1",
                          children: [
                            r.jsx("label", { className: "text-xs font-bold text-slate-300", children: "Binance USDT TRC-20 Wallet Address:" }),
                            r.jsx("input", {
                              type: "text",
                              value: gatewaySettings.binanceTrc20,
                              onChange: (e) => setGatewaySettings({ ...gatewaySettings, binanceTrc20: e.target.value }),
                              className: "w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-amber-400",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),

                // Bybit Section
                r.jsxs("div", {
                  className: "p-5 rounded-2xl bg-slate-950 border border-orange-500/30 space-y-4",
                  children: [
                    r.jsxs("div", {
                      className: "flex items-center gap-2 text-orange-400 font-black text-sm",
                      children: [r.jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-orange-400" }), "২. বাইবিট রিসিভার তথ্য (Bybit Receiver Settings)"],
                    }),
                    r.jsxs("div", {
                      className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
                      children: [
                        r.jsxs("div", {
                          className: "space-y-1",
                          children: [
                            r.jsx("label", { className: "text-xs font-bold text-slate-300", children: "Bybit UID (আপনার আসল বাইবিট ইউআইডি):" }),
                            r.jsx("input", {
                              type: "text",
                              value: gatewaySettings.bybitUid,
                              onChange: (e) => setGatewaySettings({ ...gatewaySettings, bybitUid: e.target.value }),
                              className: "w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white outline-none focus:border-orange-400",
                            }),
                          ],
                        }),
                        r.jsxs("div", {
                          className: "space-y-1",
                          children: [
                            r.jsx("label", { className: "text-xs font-bold text-slate-300", children: "Bybit USDT TRC-20 Wallet Address:" }),
                            r.jsx("input", {
                              type: "text",
                              value: gatewaySettings.bybitTrc20,
                              onChange: (e) => setGatewaySettings({ ...gatewaySettings, bybitTrc20: e.target.value }),
                              className: "w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-orange-400",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),

                // Gmail Automation Section
                r.jsxs("div", {
                  className: "p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-950 to-indigo-950/40 border border-emerald-500/40 space-y-4",
                  children: [
                    r.jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [
                        r.jsxs("div", {
                          className: "flex items-center gap-2 text-emerald-400 font-black text-sm",
                          children: [r.jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" }), "৩. مشترক জিমেইল অটো-ভেরিফিকেশন ইঞ্জিন (Shared Gmail Auto-Verifier)"],
                        }),
                        r.jsx("span", {
                          className: "px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono",
                          children: `Total Auto-Approved: ${gatewaySettings.totalAutoApprovedCount || 0}`,
                        }),
                      ],
                    }),
                    r.jsxs("div", {
                      className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
                      children: [
                        r.jsxs("div", {
                          className: "space-y-1",
                          children: [
                            r.jsx("label", { className: "text-xs font-bold text-slate-300", children: "যেই জিমেইলে বাইনান্স ও বাইবিট খোলা (Shared Gmail):" }),
                            r.jsx("input", {
                              type: "email",
                              value: gatewaySettings.gmailAccount,
                              onChange: (e) => setGatewaySettings({ ...gatewaySettings, gmailAccount: e.target.value }),
                              className: "w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-emerald-400",
                            }),
                          ],
                        }),
                        r.jsxs("div", {
                          className: "space-y-1",
                          children: [
                            r.jsx("label", { className: "text-xs font-bold text-slate-300", children: "স্বয়ংক্রিয় ভেরিফিকেশন সুইচ (Auto-Approval):" }),
                            r.jsxs("select", {
                              value: gatewaySettings.autoVerificationEnabled ? "true" : "false",
                              onChange: (e) => setGatewaySettings({ ...gatewaySettings, autoVerificationEnabled: e.target.value === "true" }),
                              className: "w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white outline-none",
                              children: [
                                r.jsx("option", { value: "true", children: "✅ সক্রিয় (Auto-Approve Enabled)" }),
                                r.jsx("option", { value: "false", children: "❌ নিষ্ক্রিয় (Manual Admin Only)" }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    r.jsxs("div", {
                      className: "p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-3 text-slate-300",
                      children: [
                        r.jsxs("div", {
                          className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800",
                          children: [
                            r.jsxs("div", {
                              children: [
                                r.jsx("strong", { className: "text-emerald-400 font-bold block", children: "পদ্ধতি ১: রেডিমেড Google Apps Script (৫ মিনিটের সেটআপ)" }),
                                r.jsx("p", { className: "text-[11px] text-slate-400", children: "নিচের কোডটি কপি করে script.google.com-এ পেস্ট করে ১ মিনিটের ট্রিগার দিন।" }),
                              ],
                            }),
                            r.jsxs("button", {
                              type: "button",
                              onClick: () => {
                                const scriptCode = `// ============================================================================
// Forex AI News (ChartLogic.Pro) — Binance & Bybit Gmail Auto-Verification
// Anti-Spoofing & Official Domain Whitelist Protection (V2.2)
// ============================================================================
const WEBHOOK_ENDPOINTS = [
  "https://chartlogic.pro/api/payments/webhook/gmail",
  "https://ais-dev-qez5igmrpo2rjx6txlvah3-349417814196.asia-east1.run.app/api/payments/webhook/gmail"
];

const WEBHOOK_SECRET = "${gatewaySettings.webhookSecret || "forex_ai_crypto_verify_secret_2026"}";

// ১. শুধুমাত্র অফিশিয়াল সেন্ডার ডোমেইন ফিল্টার (Anti-Spoofing Whitelist)
const OFFICIAL_SENDER_QUERY = [
  "from:do-not-reply@post.binance.com",
  "from:do-not-reply@ses.binance.com",
  "from:system@notice.binance.com",
  "from:ib-service@bybit.com",
  "from:support@bybit.com",
  "from:notification@em.bybit.com",
  "from:no-reply@bybit.com"
].join(" OR ");

// ২. শুধুমাত্র ডিপোজিট ও ট্রান্সফার কনফার্মেশন বিষয়বস্তু (Eliminates trade/collateral noise)
const OFFICIAL_SUBJECT_QUERY = [
  'subject:"Deposit Confirmed"',
  'subject:"Deposit Successful"',
  'subject:"You have received"',
  'subject:"Binance Pay"',
  'subject:"Internal Transfer"',
  'subject:"Transfer Successful"'
].join(" OR ");

function syncCryptoDepositEmails() {
  // কঠোর নিরাপত্তা ফিল্টার: ফেক মেইল বা জেনারেল ট্রেডিং অ্যালার্ট ফিল্টারে আসবেই না
  const query = 'is:unread (' + OFFICIAL_SENDER_QUERY + ') (' + OFFICIAL_SUBJECT_QUERY + ')';
  const threads = GmailApp.search(query, 0, 10);
  
  if (threads.length === 0) {
    Logger.log("No new unread crypto deposit emails. Sending heartbeat ping...");
    const pingPayload = JSON.stringify({
      type: "heartbeat",
      secret: WEBHOOK_SECRET,
      email: "m.rahmanhabib.my@gmail.com",
      timestamp: new Date().toISOString()
    });
    
    WEBHOOK_ENDPOINTS.forEach(function(url) {
      try {
        UrlFetchApp.fetch(url, {
          method: "post",
          contentType: "application/json",
          headers: { "x-webhook-secret": WEBHOOK_SECRET },
          payload: pingPayload,
          muteHttpExceptions: true
        });
      } catch (err) {
        Logger.log("Heartbeat ping failed for: " + url + " | " + err.toString());
      }
    });
    return;
  }
  
  for (let i = 0; i < threads.length; i++) {
    const messages = threads[i].getMessages();
    for (let j = 0; j < messages.length; j++) {
      const msg = messages[j];
      if (msg.isUnread()) {
        const fromAddress = msg.getFrom().toLowerCase();
        
        // ২য় স্তরের কঠোর নিরাপত্তা যাচাই (Double Verification)
        const isLegitSender = fromAddress.indexOf("post.binance.com") !== -1 ||
                              fromAddress.indexOf("ses.binance.com") !== -1 ||
                              fromAddress.indexOf("notice.binance.com") !== -1 ||
                              fromAddress.indexOf("bybit.com") !== -1;
                              
        if (!isLegitSender) {
          Logger.log("Security Shield: Ignored non-whitelisted sender: " + fromAddress);
          continue;
        }

        const payload = JSON.stringify({
          from: msg.getFrom(),
          subject: msg.getSubject(),
          body: msg.getPlainBody(),
          date: msg.getDate().toISOString(),
          secret: WEBHOOK_SECRET
        });
        
        let sendSuccess = false;
        
        WEBHOOK_ENDPOINTS.forEach(function(url) {
          try {
            const response = UrlFetchApp.fetch(url, {
              method: "post",
              contentType: "application/json",
              headers: { "x-webhook-secret": WEBHOOK_SECRET },
              payload: payload,
              muteHttpExceptions: true
            });
            const status = response.getResponseCode();
            Logger.log("Forwarded to " + url + " | Status: " + status);
            if (status >= 200 && status < 300) {
              sendSuccess = true;
            }
          } catch (err) {
            Logger.log("Failed sending to " + url + " | " + err.toString());
          }
        });
        
        if (sendSuccess) {
          msg.markRead();
          Logger.log("Email marked as read: " + msg.getSubject());
        }
      }
    }
  }
}`;
                                handleCopy(scriptCode, "google_apps_script_code");
                              },
                              className: "px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow",
                              children: [
                                r.jsx(iu(copiedKey === "google_apps_script_code" ? "Check" : "Copy"), { className: "w-3.5 h-3.5" }),
                                copiedKey === "google_apps_script_code" ? s("কোড কপি হয়েছে!", "Copied!") : s("📋 সম্পূর্ণ স্ক্রিপ্ট কোড কপি করুন", "Copy Google Script"),
                              ],
                            }),
                          ],
                        }),

                        r.jsxs("div", {
                          className: "space-y-1.5 text-[11px] text-slate-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800",
                          children: [
                            r.jsx("div", { className: "text-amber-400 font-sans font-bold text-xs mb-1", children: "সেটআপ করার মাত্র ৩টি সহজ ধাপ:" }),
                            r.jsx("p", { children: "১. ব্রাউজারে script.google.com ওপেন করে '+ New project' চাপুন।" }),
                            r.jsx("p", { children: "২. ওপরের কপি করা কোডটি পেস্ট করে Save (💾) আইকন চাপুন।" }),
                            r.jsx("p", { children: "৩. বাম পাশের ঘড়ির মতো আইকন 'Triggers' (⏰)-এ গিয়ে 'Add Trigger' চাপুন ➔ ফাংশন 'syncCryptoDepositEmails' ➔ Time-driven ➔ Minutes timer ➔ 'Every 1 minute' সিলেক্ট করে Save দিন।" }),
                          ],
                        }),

                        r.jsxs("div", {
                          className: "grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1",
                          children: [
                            r.jsxs("div", {
                              className: "space-y-1",
                              children: [
                                r.jsx("label", { className: "text-[11px] font-bold text-slate-400", children: "Webhook Endpoint URL:" }),
                                r.jsx("code", { className: "block p-2 rounded bg-slate-950 border border-slate-800 text-emerald-400 text-[10px] truncate select-all", children: `${window.location.origin}/api/payments/webhook/gmail` }),
                              ],
                            }),
                            r.jsxs("div", {
                              className: "space-y-1",
                              children: [
                                r.jsx("label", { className: "text-[11px] font-bold text-slate-400", children: "Webhook Security Secret:" }),
                                r.jsx("input", {
                                  type: "text",
                                  value: gatewaySettings.webhookSecret || "forex_ai_crypto_verify_secret_2026",
                                  onChange: (e) => setGatewaySettings({ ...gatewaySettings, webhookSecret: e.target.value }),
                                  className: "w-full p-1.5 rounded bg-slate-950 border border-slate-800 text-amber-300 text-xs font-mono outline-none focus:border-amber-400",
                                }),
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

            // Interactive Simulator Desk
            r.jsxs("div", {
              className: "bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl",
              children: [
                r.jsxs("div", {
                  className: "flex items-center justify-between",
                  children: [
                    r.jsxs("div", {
                      children: [
                        r.jsx("h3", {
                          className: "text-base font-black text-white flex items-center gap-2",
                          children: s("⚡ জিমেইল অটো-ভেরিফিকেশন টেস্ট সিমুলেটর (Live Verification Simulator)", "Live Email Auto-Verification Simulator"),
                        }),
                        r.jsx("p", {
                          className: "text-xs text-slate-400 mt-0.5",
                          children: s(
                            "এখানে বাটন চেপে আপনি টেস্ট করতে পারেন যে জিমেইলে কনফার্মেশন মেইল আসলে কীভাবে সাথে সাথে পেন্ডিং পেমেন্ট অটো-অ্যাপ্রুভ হয়ে যায়।",
                            "Simulate receiving official Binance Pay or Bybit deposit emails to test instant matching & activation."
                          ),
                        }),
                      ],
                    }),
                  ],
                }),

                r.jsxs("div", {
                  className: "flex items-center gap-3 pt-2",
                  children: [
                    r.jsxs("button", {
                      type: "button",
                      disabled: isSimulating,
                      onClick: () => handleSimulateDeposit("binance"),
                      className: "px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50",
                      children: [
                        r.jsx(iu("Zap"), { className: "w-4 h-4" }),
                        s("সিমুলেট: বাইনান্স ডিপোজিট মেইল ($29 USDT)", "Simulate: Binance Pay Deposit ($29 USDT)"),
                      ],
                    }),
                    r.jsxs("button", {
                      type: "button",
                      disabled: isSimulating,
                      onClick: () => handleSimulateDeposit("bybit"),
                      className: "px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50",
                      children: [
                        r.jsx(iu("Zap"), { className: "w-4 h-4" }),
                        s("সিমুলেট: বাইবিট ডিপোজিট মেইল ($29 USDT)", "Simulate: Bybit Deposit ($29 USDT)"),
                      ],
                    }),
                  ],
                }),

                simulationResult &&
                  r.jsx("div", {
                    className: "p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-bold animate-fade-in",
                    children: simulationResult,
                  }),
              ],
            }),
          ],
        }),

      // =========================================================================
      // TAB 3: Gmail Deposit Logs
      // =========================================================================
      isAdmin &&
        adminTab === "email_logs" &&
        r.jsxs("div", {
          className: "bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-5 animate-fade-in shadow-xl",
          children: [
            r.jsxs("div", {
              className: "flex items-center justify-between pb-4 border-b border-slate-800",
              children: [
                r.jsxs("div", {
                  children: [
                    r.jsx("h3", {
                      className: "text-base font-black text-white flex items-center gap-2",
                      children: s("জিমেইল ইনবক্স থেকে রিড করা ট্রানজেকশন তালিকা", "Parsed Deposit Emails from Gmail"),
                    }),
                    r.jsx("p", {
                      className: "text-xs text-slate-400 mt-0.5",
                      children: s(
                        "বাইনান্স ও বাইবিট থেকে আপনার জিমেইলে আসা ইমেইল নোটিফিকেশনের রিয়েল-টাইম হিস্ট্রি",
                        "Audit log of incoming deposit emails parsed and matched against pending user subscriptions."
                      ),
                    }),
                  ],
                }),
                r.jsxs("button", {
                  onClick: refreshData,
                  className: "px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer",
                  children: [r.jsx(iu("RefreshCw"), { className: "w-3.5 h-3.5" }), s("রিফ্রেশ", "Refresh")],
                }),
              ],
            }),

            emailLogs.length === 0
              ? r.jsxs("div", {
                  className: "text-center py-12 text-slate-400 space-y-2",
                  children: [
                    r.jsx(iu("Inbox"), { className: "w-8 h-8 mx-auto opacity-30" }),
                    r.jsx("p", { className: "text-xs font-bold", children: s("এখনও কোনো ইমেইল লগ রেকর্ড নেই।", "No email logs recorded yet.") }),
                  ],
                })
              : r.jsx("div", {
                  className: "overflow-x-auto",
                  children: r.jsxs("table", {
                    className: "w-full text-left text-xs",
                    children: [
                      r.jsx("thead", {
                        className: "bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px]",
                        children: r.jsxs("tr", {
                          children: [
                            r.jsx("th", { className: "p-3 rounded-l-xl", children: "Platform" }),
                            r.jsx("th", { className: "p-3", children: "Amount" }),
                            r.jsx("th", { className: "p-3", children: "TxID / Order ID" }),
                            r.jsx("th", { className: "p-3", children: "Sender" }),
                            r.jsx("th", { className: "p-3", children: "Received At" }),
                            r.jsx("th", { className: "p-3 rounded-r-xl text-right", children: "Matched Status" }),
                          ],
                        }),
                      }),
                      r.jsx("tbody", {
                        className: "divide-y divide-slate-800 font-mono text-[11px]",
                        children: emailLogs.map((log) =>
                          r.jsxs(
                            "tr",
                            {
                              key: log.id,
                              className: "hover:bg-slate-800/40 transition-colors",
                              children: [
                                r.jsx("td", {
                                  className: "p-3 font-black uppercase text-amber-400",
                                  children: log.platform,
                                }),
                                r.jsxs("td", { className: "p-3 font-bold text-white", children: [`${log.amount} ${log.currency}`] }),
                                r.jsx("td", { className: "p-3 text-emerald-400 font-bold", children: log.txId }),
                                r.jsx("td", { className: "p-3 text-slate-300 font-sans text-xs", children: log.senderInfo }),
                                r.jsx("td", { className: "p-3 text-slate-400 font-sans text-[11px]", children: new Date(log.receivedAt).toLocaleTimeString() }),
                                r.jsx("td", {
                                  className: "p-3 text-right font-sans",
                                  children: r.jsx("span", {
                                    className: `px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      log.isMatched
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                    }`,
                                    children: log.isMatched ? "MATCHED & ACTIVATED" : "STANDBY",
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
  });
}
