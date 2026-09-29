# VerdictAI — DisputeOps Merchant & Admin Web Console

> **Role:** Rohit Peswani (`202512115`) — Frontend Engineer (Web — Admin/Merchant)  
> **Framework:** React 18 + TypeScript + Vite + Tailwind CSS v3  
> **Course:** IT644 — Application Development Group Project / Web Services & SOA  
> **Design References:** `docs/design/web-screens/` & `docs/design/web_wireframes.md`

---

## 💻 Overview

The **VerdictAI Web Console (`web-app`)** is the desktop-first, financial-grade workspace serving **Dispute-Ops Admins/Investigators** and **Merchants**. It provides end-to-end operational visibility, straight-through auto-resolution tracking, explainable AI score inspections, evidence collection, and immutable manual overrides.

### Core Workspaces & Screens Delivered

1. **Operational Overview Dashboard (`admin-home-dashboard.png`):**
   - 4 Top-level KPI metric cards (Total Disputes `1,247`, Pending Review `38`, Auto-Resolved `1,156`, Escalated `53`).
   - Prioritized Active Case Queue with real-time status chips and quick triage links.
   - AI Recommendations card (*14 Disputes Ready for Auto-Pilot Resolution*).
   - Real-time System Health monitor (1.4s response time, 98.2% evidence processing).
   - Dispute Resolution Trends (Jan–Jun monthly bar & escalation trends) and Volume by Merchant Segment spline chart.

2. **Case Detail & AI Evidence Review (`case-detail-&-ai-evidence-review.png`):**
   - Case Header (`Case DSP-1041 – Not Received`) with `PENDING REVIEW` tag and 4-day SLA deadline alert.
   - Transaction Overview card (MID-00441, Total $1,249.50, Account **** 4492, quote of disputed reason).
   - Merchant Profile card with Tier 1 status, risk rating (B+), and historical dispute rate (0.42%).
   - Multi-modal Collected Evidence grid (PDF, CSV, DOCX, JPG) with file-type badges, interactive lightbox modal, and manual upload slot.
   - AI Resolution Intelligence panel with 72% semi-circular radial gauge (`FAVOUR MEMBER`), 4 primary reasoning factor progress bars, plain-language AI narrative summary card, and single-click resolution actions.

3. **Manual Decision Override Console (`admin-override-console.png`):**
   - Low confidence warning banner (*AI Score Low 44% – Manual Review Required for Case CHB-99281-DX*).
   - AI Evidence Summary detailing key conflict points (Mismatched IP, Velocity trigger, Merchant validation).
   - Related evidence document links and historical Override Audit Trail with user/system timestamps.
   - Final Determination Form with custom radio outcomes, mandatory character-counted reasoning textarea, and audit commit button.
   - Network Risk Comparison metrics (similar case resolution rate & merchant dispute ratio).

4. **Merchant Portal & Evidence Submission (`merchant-portal-&-evidence-submission.png`):**
   - Merchant Profile banner (`Global Retail Group`, MID-992031-GRG, Enterprise Tier).
   - 4 Merchant KPI cards (Active Disputes `24`, Win Rate `78.4%`, Pending Evidence `8 Cases`, At Risk Volume `$14,205`).
   - Disputes Requiring Evidence worklist with urgency badges (`CRITICAL: 2 days left`).
   - Evidence Submission Module with 40% completion progress bar, interactive requirement checklist, drag-and-drop file upload zone, attached document list, and legal certification checkbox.

5. **Reports & Compliance Analytics (`reports-&-analytics.png`):**
   - Filter bar with Date Range, Category selector, and export trigger.
   - 4 Key performance metrics (Avg Resolution Time `4.2 min`, Auto-Resolution Rate `92.7%`, False Positive Rate `1.3%`, Merchant Win Rate `38%`).
   - Monthly Dispute Volume bar chart (Jan–Jul) and Dispute Category Breakdown (Not Received 54%, Duplicate 22%, Defective 24%) with AI Insight card.
   - Recent Audit Exports table with download triggers for compliance PDF/CSV reports.

6. **Filterable Case Queue View (`CaseQueueScreen.tsx`):**
   - Search by Case ID, merchant, or reason code with instant client-side filtering and pagination.

---

## 🗂️ Project Structure

```
web-app/
├── index.html                             # Single page entry with Inter font
├── package.json                           # React 18, Tailwind CSS v3, Vite, Lucide React
├── tsconfig.json                          # TypeScript configuration
├── vite.config.ts                         # Vite development server config
├── tailwind.config.js                     # Tailwind theme tokens & color palette
├── postcss.config.js                      # PostCSS plugins
├── README.md                              # Web App documentation
└── src/
    ├── main.tsx                           # React entrypoint
    ├── App.tsx                            # Root router, global shell layout, and view switcher
    ├── index.css                          # Global styles and Tailwind base directives
    ├── types/
    │   └── dispute.ts                     # TypeScript interfaces (DisputeCase, EvidenceItem, AuditLog)
    ├── data/
    │   └── mockData.ts                    # High-fidelity mock datasets matching Visily wireframes
    └── components/
        ├── layout/
        │   ├── Sidebar.tsx                # Deep navy #0F172A sidebar navigation with screen switching
        │   ├── TopHeader.tsx              # Global search, notifications, and user persona switcher
        │   └── Footer.tsx                 # Compliance footer and system node status
        ├── common/
        │   ├── StatusBadge.tsx            # WCAG AA compliant badges (Critical, Review, Auto-Res)
        │   ├── ScoreGauge.tsx             # 0-100% SVG semi-circular radial gauge
        │   ├── ProgressBar.tsx            # Horizontal reasoning factor & progress bars
        │   └── EvidenceCard.tsx           # Document type cards (PDF, CSV, DOCX, JPG, LOG)
        └── screens/
            ├── AdminDashboardScreen.tsx   # Screen 1: Operational Overview
            ├── CaseDetailScreen.tsx       # Screen 2: Case DSP-1041 & AI Evidence Review
            ├── AdminOverrideScreen.tsx    # Screen 3: CHB-99281-DX Decision Override & Audit Trail
            ├── MerchantPortalScreen.tsx   # Screen 4: Merchant Portal & Evidence Submission Module
            ├── ReportsAnalyticsScreen.tsx # Screen 5: Reports, Analytics & Audit Exports
            └── CaseQueueScreen.tsx        # Paginated full case queue view
```

---

## 🚀 Running the Web App Locally

### Prerequisites
- Node.js (v18+) and npm

### Development Server

```bash
# 1. Navigate into the web app directory
cd VerdictAI/web-app

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

The web console will be available locally at `http://localhost:3000`.

### Building for Production

```bash
npm run build
```

---

## 👥 Persona Switching in UI

The top header includes an interactive user profile dropdown that enables switching between personas:
- **Elena Vance** (Admin Lead) $\rightarrow$ Operational Overview Dashboard
- **Alex Rivera** (Senior Administrator) $\rightarrow$ Case Detail & Evidence Review
- **Marcus Chen** (Senior Dispute Investigator) $\rightarrow$ Manual Decision Override Console
- **Michael Sterling** (Store Operations Manager) $\rightarrow$ Merchant Portal & Evidence Submission
