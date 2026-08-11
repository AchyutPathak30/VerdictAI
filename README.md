# ⚖️ VerdictAI: Frictionless Dispute & Chargeback Resolution

> **A transparent, evidence-driven AI system for resolving contested card charges in minutes, not weeks.**

[![GitHub Repository](https://img.shields.io/badge/GitHub-VerdictAI-181717?style=for-the-badge&logo=github)](https://github.com/AchyutPathak30/VerdictAI)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![React Native](https://img.shields.io/badge/React_Native-Cross_Platform-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini_API-8E75B2?style=for-the-badge&logo=googlecloud&logoColor=white)](https://ai.google.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 📌 Executive Summary

Today's credit card dispute and chargeback resolution process is **slow, manual, and opaque**. When a cardholder disputes a charge, analysts must manually chase down digital receipts, courier tracking logs, and customer communication records. Decisions often take weeks to arrive with little to no explanation of how they were derived, resulting in high operational costs for card issuers, lost revenue for merchants, and user frustration for cardholders.

**VerdictAI** solves this challenge by automating the end-to-end dispute workflow:
1. **Automated Evidence Ingestion:** Instantly aggregates transaction metadata, receipts, shipping/delivery confirmations, and communication threads into a structured case file.
2. **Fair-Weighing Decision Model:** Evaluates cardholder vs. merchant evidence using objective, auditable criteria rather than subjective human calls.
3. **Explainable AI (XAI) Layer:** Generates clear, plain-language explanations of the exact factors behind every decision—visible to both parties and logged for compliance auditing.
4. **Human-in-the-Loop Safeguards:** Provides dispute-ops analysts with an Admin Console to review automated resolutions, escalate edge cases, and execute manual overrides before final settlement.

> 💡 **Scope Clarification:** VerdictAI specifically targets charges *already disputed* by a cardholder. Upstream fraud detection is deliberately out of scope to maintain a hyper-focused, fully explainable decision engine.

---

## 🏗️ System Architecture & Workflow

```mermaid
flowchart TD
    subgraph Clients["User Touchpoints"]
        CM["📱 Card Member Mobile App\n(React Native)"]
        ADM["💻 Admin & Merchant Console\n(React Web)"]
    end

    subgraph Backend["Shared API Core (FastAPI)"]
        API["⚡ FastAPI REST Gateway"]
        EVI["📦 Evidence Ingestion Pipeline\n(spaCy / Hugging Face NLP)"]
        SCORER["⚖️ Fair-Weighing Decision Engine"]
        XAI["🧠 Explainable Reasoning Layer\n(Google Gemini / OpenRouter API)"]
    end

    subgraph Storage["Data Persistence"]
        PG[(🐘 PostgreSQL\nTransactions & Audit Logs)]
        MONGO[(🍃 MongoDB\nUnstructured Evidence & Files)]
    end

    CM -->|File Dispute & Track Status| API
    ADM -->|Upload Merchant Evidence & Admin Override| API

    API --> EVI
    EVI --> MONGO
    API --> PG

    EVI --> SCORER
    SCORER --> XAI
    XAI -->|Structured Decision + Natural Language Rationale| API
    API -->|Real-time Push Notifications & Audit Report| CM & ADM
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose & Usage |
| :--- | :--- | :--- |
| **Web Frontend** | **React.js** | Desktop-optimized console for merchants and dispute-ops admins (dense data grids, evidence upload, override queue). |
| **Mobile Frontend** | **React Native** | Cross-platform mobile app for cardholders to file disputes, upload evidence, and receive real-time push updates. |
| **API Backend** | **FastAPI (Python)** | Asynchronous, high-performance RESTful API powering core business logic and client integrations. |
| **NLP & Evidence Ingestion** | **spaCy & Hugging Face** | Information extraction pipeline parsing raw receipts, tracking documents, and customer-merchant email threads. |
| **AI Decision & XAI Engine** | **Google Gemini API / OpenRouter** | Large Language Model (LLM) powered evidence scoring and plain-language reasoning generation. |
| **Relational Database** | **PostgreSQL** | Transactional ledger, dispute case states, user credentials, and immutable audit logs. |
| **Document Database** | **MongoDB** | Flexible storage for unstructured evidence artifacts, raw NLP parses, and attachments. |
| **Cloud Infrastructure** | **Render / Railway** | Containerized microservice hosting with automated CI/CD pipeline deployments. |
| **Testing & QA** | **PyTest, Jest, Postman/Newman** | Automated backend unit testing, frontend UI component tests, and API contract verification. |

---

## ✨ Key Features

- **⚡ Minutes-Not-Weeks Turnaround:** Drastically cuts down dispute cycle duration from 14–30 days down to a few minutes.
- **📄 Automated Evidence Parser:** Automatically extracts key entities (timestamps, tracking numbers, itemized lists, refund policy clauses) from uploaded PDFs, images, and emails.
- **⚖️ Objective Evidence Weighing:** Calculates weighted confidence scores balancing merchant delivery proof against cardholder claim details.
- **🔍 Explainable AI Rationales:** Generates natural language summaries explaining *why* a dispute was approved or denied (e.g., *"Merchant provided valid carrier tracking showing signature upon delivery on Oct 12"*).
- **🛡️ Human-in-the-Loop Admin Queue:** Ops teams retain complete control with configurable confidence thresholds triggering mandatory human analyst sign-off.
- **📊 Comprehensive Audit Reports:** One-click compliance report generation detailing complete evidence timelines and AI reasoning pathways.

---

## 👥 Team & Responsibilities

| # | Name | Student ID | Primary Role | Key Responsibilities |
| :-: | :--- | :-: | :--- | :--- |
| 👑 1 | **Nirav Kachhiya** | `202512011` | **Project Lead / Backend Engineer** | Overall project coordination, architecture sign-off, core FastAPI endpoints. |
| 🧠 2 | **Achyut Pathak** | `202512039` | **AI/NLP Engineer (Evidence Parsing)** | Auto-collection pipeline, spaCy/Transformers NLP parsing for receipts & emails. |
| 📊 3 | **Akshay Purohit** | `202512033` | **ML Engineer (Fair-Weighing Model)** | Evidence scoring algorithms, feature weighting, and outcome recommendation model. |
| 🔍 4 | **Darshan Prajapati** | `202512026` | **Backend Engineer (Reasoning & APIs)** | Transparent reasoning layer integration, LLM prompt engineering, dispute APIs. |
| 💻 5 | **Rohit Peswani** | `202512115` | **Frontend Engineer (Web)** | Merchant evidence portal, Ops Admin override dashboard in React.js. |
| 📱 6 | **Mayank Jayswal** | `202512093` | **Mobile Engineer (Card Member App)** | Cardholder React Native app, dispute submission flow, real-time notifications. |
| ☁️ 7 | **Hardik Kansara** | `202512036` | **Cloud/DevOps & QA Engineer** | Infrastructure setup on Render/Railway, CI/CD pipelines, PyTest/Jest automation. |

---

## 📅 Project Roadmap & Milestones

The project runs for 15 weeks (August 4, 2026 – November 16, 2026):

```
Phase 1: Discovery & Architecture Signoff  [Aug 04 - Aug 17]
Phase 2: Evidence Ingestion & NLP Parsing    [Aug 18 - Sep 07]
Phase 3: Fair-Weighing & XAI Model Engine  [Sep 08 - Sep 28]
Phase 4: Web Console & Mobile App Dev     [Sep 29 - Oct 19]
Phase 5: End-to-End System Integration     [Oct 20 - Nov 02]
Phase 6: Testing, Fairness & Speed UAT     [Nov 03 - Nov 09]
Phase 7: Cloud Deployment & Final Polish   [Nov 10 - Nov 15]
Phase 8: Project Submission & Demo         [Nov 16, 2026]  🚀
```

---

## 🚀 Getting Started

### Prerequisites

- **Python:** `3.10+`
- **Node.js:** `v18+` & `npm` / `yarn`
- **PostgreSQL:** `v14+`
- **MongoDB:** `v6+`
- **Google Gemini API Key** or **OpenRouter API Key**

### 1. Repository Setup

```bash
git clone https://github.com/AchyutPathak30/VerdictAI.git
cd VerdictAI
```

### 2. Backend Installation (FastAPI)

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` root:
```env
PORT=8000
DATABASE_URL=postgresql://user:password@localhost:5432/verdictai_db
MONGODB_URI=mongodb://localhost:27017/verdictai_evidence
GEMINI_API_KEY=your_google_gemini_api_key_here
```

Run the backend development server:
```bash
uvicorn app.main:app --reload --port 8000
```
> Interactive API Docs will be available at `http://localhost:8000/docs`.

### 3. Web Console Setup (React)

```bash
cd ../frontend-web
npm install
npm start
```
> Web console will open at `http://localhost:3000`.

### 4. Mobile App Setup (React Native)

```bash
cd ../mobile-app
npm install
npx react-native run-android # or run-ios
```

---

## 🧪 Testing

Run backend tests:
```bash
cd backend
pytest -v
```

Run frontend web unit tests:
```bash
cd frontend-web
npm test
```

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 📬 Contact & Support

- **Repository Owner:** [Achyut Pathak](https://github.com/AchyutPathak30)
- **Project Repository:** [VerdictAI on GitHub](https://github.com/AchyutPathak30/VerdictAI)
