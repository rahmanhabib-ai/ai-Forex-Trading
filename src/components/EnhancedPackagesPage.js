// Forex AI News V2.2 — Dynamic Packages, Pricing & Subscription Management Engine
// Compatible with bundle runtime: Xo(), b (React), r (jsx runtime), iu (lucide loader), Fr, iu

function PackagesPage({ page: t, section: e, portalType: n, onOpenCodeStudio: a }) {
  const { currentUser: user, language: lang } = Xo();
  const isAdmin = user && (user.role === "admin" || user.id === "usr_admin_master");
  const userPlanId = (user && user.plan) || "free_starter";
  const s = (bn, en) => (lang === "bn" ? bn : en);

  const [selectedPlan, setSelectedPlan] = b.useState("standard");
  const [showCheckout, setShowCheckout] = b.useState(false);

  // Dynamic Packages State from /api/packages
  const [packages, setPackages] = b.useState([]);
  const [loading, setLoading] = b.useState(true);

  // Admin Package Edit Modal State
  const [editingPlan, setEditingPlan] = b.useState(null);
  const [isSavingPlan, setIsSavingPlan] = b.useState(false);
  const [planSaveMessage, setPlanSaveMessage] = b.useState("");
  const [newFeatureText, setNewFeatureText] = b.useState("");

  const loadPackages = () => {
    fetch("/api/packages")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.packages && d.packages.length > 0) {
          setPackages(d.packages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  b.useEffect(() => {
    loadPackages();
  }, []);

  const handleSavePackage = async (ev) => {
    if (ev) ev.preventDefault();
    if (!editingPlan) return;
    setIsSavingPlan(true);
    setPlanSaveMessage("");

    try {
      const token = localStorage.getItem("auth_token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/packages/${editingPlan.id}`, {
        method: "POST",
        headers,
        body: JSON.stringify(editingPlan),
      });
      const data = await res.json();
      if (data.success) {
        setPlanSaveMessage(s("✅ প্যাকেজ সফলভাবে আপডেট হয়েছে!", "✅ Package updated successfully!"));
        loadPackages();
        setTimeout(() => {
          setPlanSaveMessage("");
          setEditingPlan(null);
        }, 1500);
      } else {
        setPlanSaveMessage(data.error || "Save error");
      }
    } catch (err) {
      setPlanSaveMessage("Network error");
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim() || !editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: [...(editingPlan.features || []), newFeatureText.trim()],
    });
    setNewFeatureText("");
  };

  const handleRemoveFeature = (idx) => {
    if (!editingPlan) return;
    const updated = [...(editingPlan.features || [])];
    updated.splice(idx, 1);
    setEditingPlan({
      ...editingPlan,
      features: updated,
    });
  };

  if (showCheckout) {
    return r.jsx(PaymentGatewayPage, {
      preselectedPackageId: selectedPlan,
      onBackToPackages: () => setShowCheckout(false),
    });
  }

  // Fallback default plans if loading
  const displayPlans = packages.length > 0 ? packages : [
    {
      id: "free_starter",
      nameBn: "৭ দিন ফ্রি ট্রায়াল (Free Starter)",
      nameEn: "7-Day Free Trial (Starter)",
      priceUsd: 0,
      originalPriceUsd: 0,
      discountBadge: "নতুনদের জন্য",
      periodBn: "৭ দিন সম্পূর্ণ ফ্রি",
      periodEn: "7 Days Free Trial",
      tagBn: "নতুনদের জন্য",
      tagEn: "Starter Trial",
      color: "emerald",
      descBn: "ফরেক্স এআই প্ল্যাটফর্ম পরখ করে দেখতে নতুন ট্রেডারদের জন্য বিশেষ ৭ দিনের ফ্রি ট্রায়াল।",
      descEn: "Experience institutional pre-market alerts completely free for your first 7 days.",
      features: [
        "প্রতিদিনের হাই-ইমপ্যাক্ট ফরেক্স নিউজ অ্যালার্ট",
        "বেসিক সেন্ট্রাল এআই ম্যাক্রো সেন্টিমেন্ট ওভারভিউ",
        "হোয়াটসঅ্যাপ টেস্ট ভেরিফিকেশন ও সংযোগ",
        "লাইভ ইকোনমিক ক্যালেন্ডার ও টাইমলাইন",
        "কোনো পেমেন্ট ছাড়াই ইনস্ট্যান্ট অ্যাক্টিভেশন",
      ],
      limitations: {
        dailyNotesLimit: 3,
        playbookStrategiesLimit: 2,
        aiForecastsLimit: 5,
        socialMediaAutoPost: false,
      },
      isActive: true,
      isFree: true,
    },
    {
      id: "standard",
      nameBn: "স্ট্যান্ডার্ড ট্রেডার (Standard Trader)",
      nameEn: "Standard Trader (Monthly)",
      priceUsd: 29,
      originalPriceUsd: 49,
      discountBadge: "🔥 ৪০% স্পেশাল ছাড়",
      periodBn: "প্রতি মাসে (29 USDT / Month)",
      periodEn: "29 USDT / Month",
      tagBn: "🔥 সর্বাধিক জনপ্রিয়",
      tagEn: "🔥 Most Popular",
      color: "indigo",
      descBn: "নিয়মিত ডে ও সুইং ট্রেডারদের জন্য আদর্শ প্রি-মার্কেট প্রেডিকশন ও ডিরেকশনাল সেন্টিমেন্ট।",
      descEn: "Essential pre-market directional bias & fast WhatsApp delivery for active traders.",
      features: [
        "৫-১০ মিনিট পূর্বে সরাসরি হোয়াটসঅ্যাপে নোটিফিকেশন",
        "মেজর পেয়ার্স: EUR/USD, GBP/USD, USD/JPY ও Gold (XAU)",
        "CPI, NFP, PPI ও FOMC প্রি-মার্কেট এআই প্রেডিকশন",
        "সেন্ট্রাল এআই ডিরেকশনাল বাই/সেল সেন্টিমেন্ট সংকেত",
        "আনলিমিটেড ট্রেডিং ডায়েরি ও সাইকোলজি নোটস",
        "আনলিমিটেড ট্রেডিং প্লেবুক ও চার্ট আপলোড",
        "১-ক্লিক সোশ্যাল মিডিয়া অটো-পোস্টিং (আসন্ন / Roadmap)",
      ],
      limitations: {
        dailyNotesLimit: -1,
        playbookStrategiesLimit: -1,
        aiForecastsLimit: -1,
        socialMediaAutoPost: true,
      },
      isActive: true,
      isPopular: true,
    },
    {
      id: "vip_pro",
      nameBn: "ভিআইপি ইনস্টিটিউশনাল প্রো (VIP Pro)",
      nameEn: "VIP Institutional Pro (Quarterly)",
      priceUsd: 79,
      originalPriceUsd: 119,
      discountBadge: "👑 সেরা ভ্যালু অফার",
      periodBn: "৩ মাসের অ্যাক্সেস (79 USDT / 3 Months)",
      periodEn: "79 USDT / 3 Months (Save 35%)",
      tagBn: "👑 সেরা পছন্দ (VIP Value)",
      tagEn: "👑 Best Value (VIP Value)",
      color: "purple",
      descBn: "প্রো ও ফান্ডেড ট্রেডারদের জন্য ডাবল-অ্যালার্ট ও বিস্তারিত ডেভিয়েশন রেঞ্জ সহ কমপ্লিট স্যুট।",
      descEn: "Complete suite for prop & pro traders with double alert mechanism & deviation guidance.",
      features: [
        "সকল ফরেক্স পেয়ার, গোল্ড ও ক্রিপ্টো ম্যাক্রো কাভারেজ",
        "ডবল অ্যালার্ট সিস্টেম (১০ মি. আগে প্রাথমিক + ২ মি. আগে ফাইনাল রিভাইসড)",
        "বিস্তারিত ডেভিয়েশন রেঞ্জ ও সেফ লট সাইজ গাইডলাইন",
        "আনলিমিটেড ট্রেডিং প্লেবুক ও স্ট্র্যাটেজি জার্নাল অ্যাক্সেস",
        "২৪/৭ প্রায়োরিটি ভিআইপি হোয়াটসঅ্যাপ সাপোর্ট",
        "লাইভ টিভি (Bloomberg & CNBC) ও চার্ট ডেস্ক",
        "১-ক্লিক মাল্টি-সোশ্যাল মিডিয়া অটো-পোস্ট ইঞ্জিন (শীঘ্রই আসছে)",
      ],
      limitations: {
        dailyNotesLimit: -1,
        playbookStrategiesLimit: -1,
        aiForecastsLimit: -1,
        socialMediaAutoPost: true,
      },
      isActive: true,
    },
    {
      id: "lifetime_alpha",
      nameBn: "লাইফটাইম আলফা ভিআইপি (Lifetime VIP)",
      nameEn: "Lifetime Alpha VIP (One-Time)",
      priceUsd: 199,
      originalPriceUsd: 399,
      discountBadge: "💎 ৫০% লিমিটেড লাইফটাইম ছাড়",
      periodBn: "এককালীন লাইফটাইম (199 USDT One-Time)",
      periodEn: "199 USDT Lifetime Access",
      tagBn: "💎 আজীবন লাইফটাইম",
      tagEn: "💎 Lifetime Access",
      color: "amber",
      descBn: "একবার ফি পরিশোধ করে আজীবন ফরেক্স এআই নিউজ, সিগন্যাল ও ভবিষ্যৎ সকল ফিচার উপভোগ করুন।",
      descEn: "Pay once and unlock all current and future Forex AI news, signals & algorithms forever.",
      features: [
        "আজীবন আনলিমিটেড ফরেক্স এআই নিউজ ও প্রেডিকশন অ্যালার্ট",
        "ভবিষ্যতের সকল এআই মডেল ও সোশ্যাল অটো-পোস্টিং ফ্রি লাইফটাইম অ্যাক্সেস",
        "গোল্ড (XAU/USD) ও বিটকয়েন (BTC) প্রায়োরিটি ব্রেকডাউন",
        "ইনস্টিটিউশনাল অর্ডারবুক ও সেন্ট্রাল ব্যাংক ডেভিয়েশন টেবিল",
        "প্রাইভেট ডিরেক্ট হোয়াটসঅ্যাপ লাইন ও ওয়ান-অন-ওয়ান কনসালটেশন",
        "কোনো মাসিক রিনিউয়াল বা অতিরিক্ত চার্জ নেই",
      ],
      limitations: {
        dailyNotesLimit: -1,
        playbookStrategiesLimit: -1,
        aiForecastsLimit: -1,
        socialMediaAutoPost: true,
      },
      isActive: true,
    },
  ];

  return r.jsxs("div", {
    className: "max-w-7xl mx-auto space-y-10 pb-20 animate-fade-in px-2 sm:px-4 text-left",
    children: [
      // Top Header
      r.jsxs("div", {
        className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800",
        children: [
          r.jsxs("div", {
            className: "space-y-1",
            children: [
              r.jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                  r.jsx("span", {
                    className: "px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[10px] font-mono font-black uppercase tracking-wider",
                    children: "ChartLogic Institutional Pricing",
                  }),
                  r.jsx("span", {
                    className: "px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold",
                    children: "⚡ Binance & Bybit 0% Fee",
                  }),
                ],
              }),
              r.jsx("h1", {
                className: "text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight",
                children: isAdmin ? s("প্যাকেজ ও প্রাইসিং ম্যানেজমেন্ট (Admin)", "Packages & Pricing Management") : s("My Package Plan (প্যাকেজ ও মেম্বারশিপ)", "My Package Plan"),
              }),
              r.jsx("p", {
                className: "text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl",
                children: isAdmin 
                  ? s("ইউজারদের সাবস্ক্রিপশন প্যাকেজের মূল্য, অফার ও ফিচার নিয়ন্ত্রণ করুন।", "Manage package prices, discounts, and tier limitations.")
                  : s("আপনার বর্তমান ট্রেডিং মেম্বারশিপ এবং সাবস্ক্রিপশন প্ল্যান। এখান থেকে যে কোনো সময় উচ্চতর প্যাকেজে আপগ্রেড করতে পারবেন।", "Your active trading plan and subscription status. Upgrade anytime for institutional access."),
              }),
            ],
          }),

          // Admin Control Trigger
          isAdmin &&
            r.jsxs("div", {
              className: "flex items-center gap-2 shrink-0",
              children: [
                r.jsxs("button", {
                  onClick: () => setEditingPlan(displayPlans[1] || displayPlans[0]),
                  className: "px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer",
                  children: [r.jsx(iu("Settings"), { className: "w-4 h-4" }), s("⚙️ প্যাকেজ ও প্রাইস এডিটর (Admin)", "⚙️ Edit Packages & Pricing")],
                }),
              ],
            }),
        ],
      }),

      // Current Active Plan Status Banner for User
      !isAdmin &&
        r.jsxs("div", {
          className: "p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm",
          children: [
            r.jsxs("div", {
              className: "flex items-center gap-3.5",
              children: [
                r.jsx("div", {
                  className: "w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold",
                  children: r.jsx(iu("ShieldCheck"), { className: "w-6 h-6" }),
                }),
                r.jsxs("div", {
                  children: [
                    r.jsxs("div", {
                      className: "flex items-center gap-2",
                      children: [
                        r.jsx("span", {
                          className: "text-[10px] font-black uppercase tracking-wider text-emerald-400 block",
                          children: s("আপনার বর্তমান সক্রিয় প্ল্যান", "Your Current Active Plan"),
                        }),
                        r.jsx("span", {
                          className: "px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold",
                          children: "ACTIVE PLAN",
                        }),
                      ],
                    }),
                    r.jsx("h3", {
                      className: "text-base sm:text-lg font-black text-white",
                      children: userPlanId === "vip_pro"
                        ? s("ভিআইপি ইনস্টিটিউশনাল প্রো", "VIP Institutional Pro")
                        : userPlanId === "lifetime_alpha"
                        ? s("লাইফটাইম আলফা", "Lifetime Alpha")
                        : userPlanId === "standard"
                        ? s("স্ট্যান্ডার্ড ট্রেডার", "Standard Trader")
                        : s("৭ দিন ফ্রি ট্রায়াল (Starter Free)", "7-Day Free Trial (Starter)"),
                    }),
                    r.jsx("p", {
                      className: "text-xs text-slate-400",
                      children: s("স্ট্যাটাস: মেয়াদ সক্রিয় রয়েছে • কোনো অটো-কাট বা হিডেন ফি নেই", "Status: Active & Valid • No recurring hidden fees"),
                    }),
                  ],
                }),
              ],
            }),
            r.jsx("button", {
              onClick: () => {
                setSelectedPlan("standard");
                setShowCheckout(true);
              },
              className: "px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer",
              children: [r.jsx(iu("Zap"), { className: "w-4 h-4" }), s("⚡ নতুন প্ল্যানে আপগ্রেড করুন", "⚡ Upgrade Plan")],
            }),
          ],
        }),

      // 4 Dynamic Package Cards Grid
      r.jsx("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
        children: displayPlans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const isFree = plan.isFree || plan.priceUsd === 0;
          const hasDiscount = plan.originalPriceUsd && plan.originalPriceUsd > plan.priceUsd;

          return r.jsxs(
            "div",
            {
              key: plan.id,
              className: `relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 border-2 ${
                plan.isPopular
                  ? "bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/20"
                  : plan.id === "lifetime_alpha"
                  ? "bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/50 shadow-xl shadow-amber-500/10"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
              } ${!plan.isActive ? "opacity-60 grayscale" : ""}`,
              children: [
                // Top Tag & Badges
                r.jsxs("div", {
                  className: "space-y-4",
                  children: [
                    r.jsxs("div", {
                      className: "flex items-center justify-between gap-2",
                      children: [
                        r.jsx("span", {
                          className: `px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            plan.color === "emerald"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : plan.color === "indigo"
                              ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                              : plan.color === "purple"
                              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`,
                          children: s(plan.tagBn, plan.tagEn),
                        }),

                        // Discount or Testing Badge
                        plan.isTestingMode ? (
                          r.jsx("span", {
                            className: "px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold animate-pulse",
                            children: "🧪 টেস্টিং মোড",
                          })
                        ) : plan.discountBadge ? (
                          r.jsx("span", {
                            className: "px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold",
                            children: plan.discountBadge,
                          })
                        ) : null,
                      ],
                    }),

                    // Plan Title & Description
                    r.jsxs("div", {
                      children: [
                        r.jsx("h3", {
                          className: "text-lg font-black text-slate-900 dark:text-white tracking-tight",
                          children: s(plan.nameBn, plan.nameEn),
                        }),
                        r.jsx("p", {
                          className: "text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2",
                          children: s(plan.descBn, plan.descEn),
                        }),
                      ],
                    }),

                    // Price Section with Discount crossed-out
                    r.jsxs("div", {
                      className: "py-3 border-y border-slate-100 dark:border-slate-800",
                      children: [
                        r.jsxs("div", {
                          className: "flex items-baseline gap-2",
                          children: [
                            r.jsx("span", {
                              className: "text-3xl font-black text-slate-900 dark:text-white tracking-tight",
                              children: isFree ? s("০ USDT", "FREE") : `${plan.priceUsd} USDT`,
                            }),
                            hasDiscount &&
                              r.jsx("span", {
                                className: "text-sm text-slate-400 line-through font-mono font-bold",
                                children: `${plan.originalPriceUsd} USDT`,
                              }),
                            !isFree &&
                              r.jsx("span", {
                                className: "text-[11px] font-mono text-slate-400",
                                children: `($ ${plan.priceUsd})`,
                              }),
                          ],
                        }),
                        r.jsx("p", {
                          className: "text-[11px] font-medium text-slate-400 mt-0.5",
                          children: s(plan.periodBn, plan.periodEn),
                        }),
                      ],
                    }),

                    // Limitations Box (Crucial for Free vs Paid clarity)
                    r.jsxs("div", {
                      className: `p-3 rounded-2xl text-[11px] space-y-1.5 ${
                        isFree
                          ? "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                          : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                      }`,
                      children: [
                        r.jsxs("div", {
                          className: "font-black flex items-center gap-1.5 text-xs",
                          children: [
                            r.jsx(iu(isFree ? "AlertTriangle" : "ShieldCheck"), { className: "w-3.5 h-3.5" }),
                            isFree ? s("সীমিত ফিচার অ্যাক্সেস (Limits):", "Plan Limitations:") : s("আনলিমিটেড অ্যাক্সেস (No Limits):", "Full Tier Privileges:"),
                          ],
                        }),
                        r.jsxs("p", {
                          className: "text-[10px] leading-snug opacity-90",
                          children: [
                            "• ",
                            plan.limitations?.dailyNotesLimit === -1 || !isFree
                              ? s("ট্রেডিং ডায়েরি: আনলিমিটেড এন্ট্রি", "Trading Journal: Unlimited")
                              : s(`ট্রেডিং ডায়েরি: দিনে সর্বোচ্চ ${plan.limitations?.dailyNotesLimit || 3}টি নোটস`, `Trading Journal: Max ${plan.limitations?.dailyNotesLimit || 3}/day`),
                          ],
                        }),
                        r.jsxs("p", {
                          className: "text-[10px] leading-snug opacity-90",
                          children: [
                            "• ",
                            plan.limitations?.playbookStrategiesLimit === -1 || !isFree
                              ? s("প্লেবুক: আনলিমিটেড স্ট্র্যাটেজি ও চার্ট", "Playbook: Unlimited Strategies")
                              : s(`প্লেবুক: সর্বোচ্চ ${plan.limitations?.playbookStrategiesLimit || 2}টি স্ট্র্যাটেজি অ্যাক্সেস`, `Playbook: Max ${plan.limitations?.playbookStrategiesLimit || 2} strategies`),
                          ],
                        }),
                        !isFree &&
                          r.jsx("p", {
                            className: "text-[10px] leading-snug text-indigo-300 font-bold",
                            children: s("• ১-ক্লিক সোশ্যাল মিডিয়া অটো-পোস্টিং (শীঘ্রই আসছে)", "• 1-Click Social Media Auto Post (Coming Soon)"),
                          }),
                      ],
                    }),

                    // Feature Checklist
                    r.jsx("div", {
                      className: "space-y-2 pt-1",
                      children: (plan.features || []).map((feat, idx) =>
                        r.jsxs(
                          "div",
                          {
                            key: idx,
                            className: "flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300",
                            children: [
                              r.jsx(iu("Check"), {
                                className: `w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                  plan.color === "emerald"
                                    ? "text-emerald-500"
                                    : plan.color === "indigo"
                                    ? "text-indigo-400"
                                    : plan.color === "purple"
                                    ? "text-purple-400"
                                    : "text-amber-400"
                                }`,
                              }),
                              r.jsx("span", { children: feat }),
                            ],
                          }
                        )
                      ),
                    }),
                  ],
                }),

                // Bottom CTA Button & Admin Quick Edit
                r.jsxs("div", {
                  className: "pt-6 space-y-2",
                  children: [
                    r.jsx("button", {
                      onClick: () => {
                        setSelectedPlan(plan.id);
                        setShowCheckout(true);
                      },
                      disabled: !plan.isActive || plan.isTestingMode,
                      className: `w-full py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                        isFree
                          ? "bg-slate-800 hover:bg-slate-700 text-white"
                          : plan.isPopular
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
                          : plan.id === "lifetime_alpha"
                          ? "bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 text-slate-950 font-black"
                          : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30"
                      }`,
                      children: (!isAdmin && (userPlanId === plan.id || (isFree && userPlanId === "free_starter")))
                        ? s("✅ বর্তমান সক্রিয় প্ল্যান", "✅ Current Active Plan")
                        : plan.isTestingMode
                        ? s("🧪 টেস্টিং পার্পাস (সাময়িক বন্ধ)", "Testing Purpose (Closed)")
                        : isFree
                        ? s("৭ দিনের ফ্রি ট্রায়াল", "7-Day Free Trial")
                        : s(`আপগ্রেড করুন (${plan.priceUsd} USDT)`, `Upgrade (${plan.priceUsd} USDT)`),
                    }),

                    // Admin Edit trigger for this plan
                    isAdmin &&
                      r.jsxs("button", {
                        onClick: () => setEditingPlan(plan),
                        className: "w-full py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-amber-400 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer",
                        children: [r.jsx(iu("Edit"), { className: "w-3 h-3" }), s("⚙️ প্রাইস ও অফার এডিট করুন", "Edit Price & Offer")],
                      }),
                  ],
                }),
              ],
            }
          );
        }),
      }),

      // =======================================================================
      // Admin Package & Dynamic Pricing Editor Modal
      // =======================================================================
      isAdmin &&
        editingPlan &&
        r.jsx("div", {
          className: "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in",
          children: r.jsxs("div", {
            className: "w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto",
            children: [
              r.jsxs("div", {
                className: "flex items-center justify-between pb-3 border-b border-slate-800",
                children: [
                  r.jsxs("div", {
                    children: [
                      r.jsx("h2", {
                        className: "text-lg font-black text-white flex items-center gap-2",
                        children: s(`প্যাকেজ এডিটর: ${editingPlan.nameBn}`, `Edit Plan: ${editingPlan.nameEn}`),
                      }),
                      r.jsx("p", {
                        className: "text-xs text-slate-400 mt-0.5",
                        children: s("প্রাইস, ডিসকাউন্ট অফার, টাইমিং ও লিমিটেশন রিয়েল-টাইমে পরিবর্তন করুন।", "Update price, discount offers, timing, and feature limits in real time."),
                      }),
                    ],
                  }),
                  r.jsx("button", {
                    onClick: () => setEditingPlan(null),
                    className: "w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer",
                    children: "✕",
                  }),
                ],
              }),

              planSaveMessage &&
                r.jsx("div", {
                  className: "p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center",
                  children: planSaveMessage,
                }),

              r.jsxs("form", {
                onSubmit: handleSavePackage,
                className: "space-y-5",
                children: [
                  // Price & Original Price (Discount)
                  r.jsxs("div", {
                    className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
                    children: [
                      r.jsxs("div", {
                        className: "space-y-1",
                        children: [
                          r.jsx("label", { className: "text-xs font-bold text-slate-300", children: s("প্রাইস (Price in USDT / USD): *", "Current Price (USDT): *") }),
                          r.jsx("input", {
                            type: "number",
                            required: true,
                            value: editingPlan.priceUsd,
                            onChange: (e) => setEditingPlan({ ...editingPlan, priceUsd: Number(e.target.value) }),
                            className: "w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-amber-400 outline-none focus:border-amber-400",
                          }),
                        ],
                      }),

                      r.jsxs("div", {
                        className: "space-y-1",
                        children: [
                          r.jsx("label", { className: "text-xs font-bold text-slate-300", children: s("মূল প্রাইস (Original Price - কাটা থাকবে):", "Original Price (Strikethrough):") }),
                          r.jsx("input", {
                            type: "number",
                            value: editingPlan.originalPriceUsd || 0,
                            onChange: (e) => setEditingPlan({ ...editingPlan, originalPriceUsd: Number(e.target.value) }),
                            className: "w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-300 outline-none focus:border-amber-400",
                          }),
                        ],
                      }),
                    ],
                  }),

                  // Discount Badge & Offer Period
                  r.jsxs("div", {
                    className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
                    children: [
                      r.jsxs("div", {
                        className: "space-y-1",
                        children: [
                          r.jsx("label", { className: "text-xs font-bold text-slate-300", children: s("অফার ব্যাজ লেখা (Offer Badge):", "Offer Badge Text:") }),
                          r.jsx("input", {
                            type: "text",
                            value: editingPlan.discountBadge || "",
                            onChange: (e) => setEditingPlan({ ...editingPlan, discountBadge: e.target.value }),
                            placeholder: "যেমন: 🔥 ৪০% স্পেশাল ছাড়",
                            className: "w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-amber-400",
                          }),
                        ],
                      }),

                      r.jsxs("div", {
                        className: "space-y-1",
                        children: [
                          r.jsx("label", { className: "text-xs font-bold text-slate-300", children: s("মেয়াদ কালীন লেখা (Period Text):", "Period Text:") }),
                          r.jsx("input", {
                            type: "text",
                            value: editingPlan.periodBn,
                            onChange: (e) => setEditingPlan({ ...editingPlan, periodBn: e.target.value }),
                            className: "w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-amber-400",
                          }),
                        ],
                      }),
                    ],
                  }),

                  // Status Switches: Testing Purpose / Active
                  r.jsxs("div", {
                    className: "p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3",
                    children: [
                      r.jsx("h4", { className: "text-xs font-black uppercase text-amber-400", children: s("প্যাকেজ স্ট্যাটাস ও টেস্টিং মোড কন্ট্রোল", "Status & Testing Purpose Control") }),
                      r.jsxs("div", {
                        className: "grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs",
                        children: [
                          r.jsxs("label", {
                            className: "flex items-center gap-2 cursor-pointer",
                            children: [
                              r.jsx("input", {
                                type: "checkbox",
                                checked: editingPlan.isActive,
                                onChange: (e) => setEditingPlan({ ...editingPlan, isActive: e.target.checked }),
                                className: "rounded w-4 h-4 text-amber-500",
                              }),
                              r.jsx("span", { children: "প্যাকেজটি চালু রাখুন (Active for Purchase)" }),
                            ],
                          }),
                          r.jsxs("label", {
                            className: "flex items-center gap-2 cursor-pointer",
                            children: [
                              r.jsx("input", {
                                type: "checkbox",
                                checked: editingPlan.isTestingMode,
                                onChange: (e) => setEditingPlan({ ...editingPlan, isTestingMode: e.target.checked }),
                                className: "rounded w-4 h-4 text-rose-500",
                              }),
                              r.jsx("span", { className: "text-rose-400 font-bold", children: "🧪 টেস্টিং পার্পাস / সাময়িক বন্ধ (Testing Mode)" }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),

                  // Tier Limitations: Free Notes limit & Strategy limit
                  r.jsxs("div", {
                    className: "p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3",
                    children: [
                      r.jsx("h4", { className: "text-xs font-black uppercase text-amber-400", children: s("ফিচার সীমাবদ্ধতা (Feature Limitations - Free vs VIP)", "Feature Limits") }),
                      r.jsxs("div", {
                        className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
                        children: [
                          r.jsxs("div", {
                            className: "space-y-1",
                            children: [
                              r.jsx("label", { className: "text-xs font-bold text-slate-300", children: s("দৈনিক ট্রেডিং নোটস লিমিট (-১ দিলে আনলিমিটেড):", "Daily Notes Limit (-1 for unlimited):") }),
                              r.jsx("input", {
                                type: "number",
                                value: editingPlan.limitations?.dailyNotesLimit ?? 3,
                                onChange: (e) =>
                                  setEditingPlan({
                                    ...editingPlan,
                                    limitations: {
                                      ...(editingPlan.limitations || {}),
                                      dailyNotesLimit: Number(e.target.value),
                                    },
                                  }),
                                className: "w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none",
                              }),
                            ],
                          }),
                          r.jsxs("div", {
                            className: "space-y-1",
                            children: [
                              r.jsx("label", { className: "text-xs font-bold text-slate-300", children: s("প্লেবুক স্ট্র্যাটেজি লিমিট (-১ দিলে আনলিমিটেড):", "Playbook Strategies Limit (-1 for unlimited):") }),
                              r.jsx("input", {
                                type: "number",
                                value: editingPlan.limitations?.playbookStrategiesLimit ?? 2,
                                onChange: (e) =>
                                  setEditingPlan({
                                    ...editingPlan,
                                    limitations: {
                                      ...(editingPlan.limitations || {}),
                                      playbookStrategiesLimit: Number(e.target.value),
                                    },
                                  }),
                                className: "w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none",
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),

                  // Features Checklist Manager
                  r.jsxs("div", {
                    className: "space-y-2",
                    children: [
                      r.jsx("label", { className: "text-xs font-bold text-slate-300", children: s("প্যাকেজ ফিচার লিস্ট (Features Included):", "Package Features:") }),
                      r.jsx("div", {
                        className: "space-y-1.5 max-h-40 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800",
                        children: (editingPlan.features || []).map((feat, idx) =>
                          r.jsxs(
                            "div",
                            {
                              key: idx,
                              className: "flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-900 text-xs",
                              children: [
                                r.jsx("span", { className: "truncate", children: feat }),
                                r.jsx("button", {
                                  type: "button",
                                  onClick: () => handleRemoveFeature(idx),
                                  className: "text-rose-400 hover:text-rose-300 font-bold px-1.5 cursor-pointer",
                                  children: "✕",
                                }),
                              ],
                            }
                          )
                        ),
                      }),
                      r.jsxs("div", {
                        className: "flex items-center gap-2 pt-1",
                        children: [
                          r.jsx("input", {
                            type: "text",
                            value: newFeatureText,
                            onChange: (e) => setNewFeatureText(e.target.value),
                            placeholder: "নতুন ফিচার লিখুন (যেমন: ১-ক্লিক সোশ্যাল অটো-পোস্টিং)",
                            className: "flex-1 p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none",
                          }),
                          r.jsx("button", {
                            type: "button",
                            onClick: handleAddFeature,
                            className: "px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer",
                            children: "+ যোগ করুন",
                          }),
                        ],
                      }),
                    ],
                  }),

                  // Action Buttons
                  r.jsxs("div", {
                    className: "flex items-center justify-end gap-3 pt-4 border-t border-slate-800",
                    children: [
                      r.jsx("button", {
                        type: "button",
                        onClick: () => setEditingPlan(null),
                        className: "px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer",
                        children: s("বাতিল", "Cancel"),
                      }),
                      r.jsxs("button", {
                        type: "submit",
                        disabled: isSavingPlan,
                        className: "px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50",
                        children: [
                          r.jsx(iu("Save"), { className: "w-4 h-4" }),
                          isSavingPlan ? s("সংরক্ষণ হচ্ছে...", "Saving...") : s("পরিবর্তন সেভ করুন", "Save Changes"),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),

      // Info Notice Card
      r.jsxs("div", {
        className: "p-6 sm:p-8 rounded-3xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4",
        children: [
          r.jsxs("div", {
            className: "flex items-center gap-3",
            children: [
              r.jsx("div", {
                className: "w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold",
                children: r.jsx(iu("Wallet"), { className: "w-5 h-5" }),
              }),
              r.jsxs("div", {
                children: [
                  r.jsx("h4", {
                    className: "font-black text-base text-slate-900 dark:text-white",
                    children: s("ক্রিপ্টো সাবস্ক্রিপশন ও অটো-ভেরিফিকেশন তথ্যাবলী", "Crypto Subscription & Auto-Verification"),
                  }),
                  r.jsx("p", {
                    className: "text-xs text-slate-500 dark:text-slate-400",
                    children: s(
                      "বাইনান্স পে (Binance Pay ID: 336527372) অথবা বাইবিট (Bybit UID: 412658047) ০% ফি-তে সরাসরি USDT ট্রান্সফার করুন",
                      "Instant USDT transfers via official Binance Pay or Bybit UID with 0% fee"
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
