# Trading Strategy Playbook & Community Backtest Journal
## ট্রেডিং স্ট্র্যাটেজি প্লেবুক ও ব্যাকটেস্টিং জার্নাল হাব

A high-conviction trading playbook and community journaling engine designed for institutional Forex and Gold traders. Traders can document high-probability setups, tag market sessions (New York, London, Asian, Overlaps), specify technical execution zones (Support, Resistance, Liquidity Sweeps, Order Blocks), upload TradingView chart snapshots, embed YouTube video breakdowns, track win/loss performance charts with pass/fail reasons, and share strategies publicly with community commenting and upvotes while retaining strict owner-only editing permissions.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed via interactive clarification:

- **Confirmed Navigation Location**: Dedicated "Strategy Playbook" subpage seamlessly integrated into the primary Trading navigation hierarchy.
- **Confirmed Media Evidence**: Support for direct file upload of TradingView chart snapshots, external TradingView snapshot URLs, and interactive YouTube video embeds.
- **Confirmed Community Scope**: Full public community interaction with discussion comment threads and helpful upvoting, while strictly enforcing read-only permissions for non-owners (only the setup author can edit or delete).
- **Confirmed Data Persistence**: Full database synchronization on the backend with persisted file storage (`storage/playbook_entries.json` & `storage/playbook_comments.json`) so setups, stats, images, and comments persist permanently across page refreshes and server restarts.

---

## 1. Overview & Core Concept

### What It Does
The **Trading Strategy Playbook & Journal** empowers traders to catalog and backtest their highest-conviction trading models with institutional precision:
1. **Session & Macro Timing**: Tag exact trading sessions where the strategy achieves peak edge (New York Open, London Open, Asian Range, or London/NY Overlap).
2. **Technical Architecture**: Document execution zones (Key Support, Resistance, Order Block, Fair Value Gap, Liquidity Sweep, Range Breakout), timeframe (1m, 5m, 15m, 1h, 4h, Daily), and candlestick trigger patterns.
3. **Multi-Media Evidence**: Upload TradingView chart screenshots directly (or link them) and embed YouTube trade recap/recording videos.
4. **Performance Metrics & Analytics**: Track total trades executed, wins, losses, win rate percentage, profit factor, risk-to-reward (RR) ratio, and an interactive win-loss distribution chart.
5. **Pass / Fail Post-Mortem Notes**: Document why a trade setup succeeded (pass) or failed (loss) to eliminate emotional trading mistakes.
6. **Community Collaboration**: Set privacy to "Public" (visible to all community members) or "Only Me" (private personal journal). Public setups can be browsed, upvoted, and discussed in a dedicated comment thread, but never edited by other traders.

### Target Audience & Persona
- Prop firm traders, institutional Forex/Gold scalpers, and retail swing traders looking to transform ad-hoc trading into a repeatable, statistical business.

### Key Value
Eliminates trading guesswork by converting subjective chart patterns into audited, visual, and measurable strategies with verifiable win rates and community peer review.

---

## 2. User Experience & Visual Design

### Key User Flows

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. Browse Playbook Feed                                                                │
│    Tabs: [All Public Setups] [My Setups] [Top Win Rate] [By Session: NY / LDN / ASIA] │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. Interactive Strategy Card                                                           │
│    • Win Rate Badge (e.g. 78.4% Win Rate)  • Session & Timeframe Tags                 │
│    • TradingView Snapshot Thumbnail        • YouTube Video Player Embed                │
│    • Key Technical Condition (Support / Resistance / Order Block)                      │
│    • Community Upvotes & Comment Count     • Quick View Details / Discussion Drawer    │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                   ┌────────────────────────┴────────────────────────┐
                   ▼                                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────────────────┐
│ 3. Create / Edit Playbook Modal      │  │ 4. Full Strategy Deep-Dive & Comments        │
│    • Title & Strategy Concept        │  │    • High-res TradingView Zoomable Chart     │
│    • Session & Timeframe Selection   │  │    • YouTube Video Analysis Player           │
│    • Level: Support / Resistance     │  │    • Visual Win/Loss Analytics Chart         │
│    • Candlestick & Pattern Trigger   │  │    • Pass / Fail Debrief & Trader Notes      │
│    • Chart Screenshot Upload / Link  │  │    • Public Comment Thread with Upvoting     │
│    • YouTube Embed URL               │  │    • Owner Edit/Delete Controls (Protected)  │
│    • Total Trades, Wins, Losses      │  └──────────────────────────────────────────────┘
│    • Pass / Fail Reason Notes        │
│    • Visibility: Public vs Only Me   │
└──────────────────────────────────────┘
```

### Visual Identity & Theme
- **Color Palette**:
  - Dominant Canvas (60%): Deep Institutional Slate (`#0B0F19` and `#0F172A`)
  - Structural Cards & Surfaces (30%): Elevated dark card background (`#1E293B`) with crisp hairline borders (`rgba(255,255,255,0.08)`)
  - Semantic Accents (10%):
    - Emerald Green (`#10B981`): Win Rate, Buy / Long bias, Support zones
    - Rose / Crimson (`#F43F5E`): Loss Rate, Sell / Short bias, Resistance zones
    - Amber Gold (`#F59E0B`): Gold (XAU/USD) focus, Key Session tags (New York / London)
    - Cyan / Sky (`#0EA5E9`): Technical Timeframe, YouTube video player accents
- **Typography**:
  - Headings: `Plus Jakarta Sans` bold title-case for clean readability
  - Numeric Telemetry & Metrics: Monospace `tabular-nums` (`JetBrains Mono` / `font-mono`) for win rates, pips, and prices
  - Metadata: Zero-pill clean text with unboxed bullet separators (`·`)
- **Interactive States**:
  - Instant client-side search by setup name, session, or technical condition
  - Live preview of uploaded TradingView screenshots before saving
  - Responsive YouTube player responsive 16:9 container with zero layout shift
  - Animated SVG win-loss ring chart showing win vs loss ratio

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Image & Chart Snapshot Handling
- **Chosen Approach**: Dual-support architecture:
  1. Direct file upload (`PNG`, `JPG`, `WEBP`) stored on the server under `public/uploads/playbook/` with unique hash names.
  2. Direct TradingView snapshot URL link (e.g. `https://www.tradingview.com/x/...`) with immediate live preview.
- **Why**: Traders frequently grab quick TradingView snapshot links (`Alt+S`) or save high-res desktop screenshots; supporting both provides zero friction.

### Decision 2: Video Embed Integration
- **Chosen Approach**: Native YouTube embed parser accepting standard YouTube links (`https://youtube.com/watch?v=...`), short links (`https://youtu.be/...`), and embed codes.
- **Why**: Keeps video hosting scalable and free for users while leveraging YouTube's high-speed video streaming directly inside the strategy card.

### Decision 3: Security & Ownership Protection
- **Chosen Approach**: Server-side user identity verification on all mutations:
  - Setup creation tags the author's `userId` and `authorName`.
  - Edit and Delete operations verify that `req.headers.authorization` matches the setup author (or user has `admin` role).
  - Other users can view public setups, vote, and add comments, but edit/delete buttons are completely disabled and rejected by backend middleware.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                           Client Browser                               │
│  ┌────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │ Strategy Playbook View │  │ Strategy Modal & Creator Form        │  │
│  └───────────┬────────────┘  └──────────────────┬───────────────────┘  │
│              │                                  │                      │
│              │ GET /api/playbook                │ POST /api/playbook   │
│              │ POST /api/playbook/:id/vote      │ POST /upload         │
│              │ POST /api/playbook/:id/comment   │                      │
└──────────────┼──────────────────────────────────┼──────────────────────┘
               ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Express Backend Server (server.ts)                  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Playbook Controller & Auth Guard Router                          │  │
│  │ • Validates owner permission for Edit/Delete                     │  │
│  │ • Computes Win Rate %, Profit Factor & Session Analytics         │  │
│  │ • Handles Multipart File Uploads to /public/uploads/playbook/    │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Persistent Storage Layer (JSON Files)                │
│                                                                        │
│  ┌────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │ storage/playbook_entries.json  │  │ storage/playbook_comments.js │  │
│  │ • Strategy details, tags       │  │ • Comment thread, user info  │  │
│  │ • Win/Loss metrics, pass/fail  │  │ • Timestamp, replies         │  │
│  │ • Image paths, YouTube URLs    │  └──────────────────────────────┘  │
│  └────────────────────────────────┘                                    │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Schema Specification

#### 1. Playbook Entry Entity (`PlaybookEntry`)
```typescript
interface PlaybookEntry {
  id: string;                         // e.g. "pb_9f812a"
  authorId: string;                   // User ID of the creator
  authorName: string;                 // Display name of trader
  title: string;                      // e.g. "London Breakout Gold 5m Sweep"
  description: string;                // Detailed trade rules & logic
  session: "New York" | "London" | "Asian" | "London/NY Overlap" | "Any Session";
  technicalLevel: "Support" | "Resistance" | "Order Block" | "Liquidity Sweep" | "Breakout" | "Range";
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "Daily";
  candlestickPattern: string;         // e.g. "Bullish Engulfing / FVG Tap"
  chartImageUrl?: string;             // Local upload path or TradingView URL
  youtubeVideoUrl?: string;           // YouTube recording link
  totalTrades: number;                // e.g. 50
  winCount: number;                   // e.g. 38
  lossCount: number;                  // e.g. 12
  winRatePercent: number;             // Auto-computed: (winCount / totalTrades) * 100
  riskRewardRatio: string;            // e.g. "1:2.5"
  passReasons: string[];              // Why it passes (e.g. "Clean DXY alignment", "Higher TF confirmation")
  failReasons: string[];              // Why it fails (e.g. "Trading into High Impact CPI News", "Late entry")
  visibility: "public" | "private";   // Public community or Only Me
  upvotes: string[];                  // Array of user IDs who upvoted
  createdAt: string;                  // ISO Date string
  updatedAt: string;                  // ISO Date string
}
```

#### 2. Playbook Comment Entity (`PlaybookComment`)
```typescript
interface PlaybookComment {
  id: string;                         // e.g. "cm_31a7"
  playbookId: string;                 // Associated entry ID
  authorId: string;                   // Commenter's user ID
  authorName: string;                 // Commenter's display name
  commentText: string;                // Text of the feedback or question
  createdAt: string;                  // ISO Date string
}
```

---

## 5. Execution Roadmap & Verification Plan

1. **Backend Persistence Engine**:
   - Create `storage/playbook_entries.json` and `storage/playbook_comments.json` with sample high-conviction Gold & Forex setups.
   - Implement REST endpoints in `server.ts`:
     - `GET /api/playbook` (List setups with filtering by session, win rate, and privacy)
     - `POST /api/playbook` (Create new setup with image/video validation)
     - `PUT /api/playbook/:id` (Update setup with strict author-ownership check)
     - `DELETE /api/playbook/:id` (Delete setup with author-ownership check)
     - `POST /api/playbook/:id/vote` (Toggle helpful upvote)
     - `GET /api/playbook/:id/comments` (Retrieve comment thread)
     - `POST /api/playbook/:id/comments` (Post new comment)
     - `POST /api/playbook/upload` (Handle chart screenshot upload)
2. **Frontend UI & Components**:
   - Build `StrategyPlaybookView`:
     - Clean Top Bar filter navigation (Public Setups, My Setups, Session filters).
     - Responsive grid of Strategy Playbook cards with SVG win-rate rings, TradingView previews, and YouTube video embeds.
     - Interactive modal for Strategy Detail Deep-Dive with pass/fail debrief and live comment thread.
     - Strategy Creator / Editor modal with live chart preview, metrics calculator, and privacy toggles.
3. **Verification**:
   - Verify file upload and TradingView snapshot rendering.
   - Verify YouTube video embedding with clean 16:9 responsive display.
   - Verify owner-only edit/delete permissions (user cannot edit another user's setup).
   - Verify public comment and upvote persistence across page reloads.
   - Verify `compile_applet`, `lint_applet`, and regression test suite pass 100%.
