# ⚖️ VerdictAI — Automated & Explainable Dispute Resolution Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.0-61dafb.svg)](https://reactjs.org)
[![React Native](https://img.shields.io/badge/React_Native-Cross_Platform-02569B.svg)](https://reactnative.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791.svg)](https://postgresql.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0%2B-47A248.svg)](https://mongodb.com)

**VerdictAI** is a high-throughput, explainable AI backend and multi-client system designed to automate financial dispute and chargeback evaluations. It ingests unstructured evidence (receipts, carrier delivery logs, email threads), parses entities via NLP, applies an auditable fair-weighing scoring algorithm, and produces plain-language decision rationales using Google Gemini API.

---

## 📂 Repository Layout

```
VerdictAI/
├── backend/                  # FastAPI REST API Backend
│   ├── app/
│   │   ├── api/              # API route handlers (disputes, evidence, decisions)
│   │   ├── core/             # App configuration, security, DB connections
│   │   ├── models/           # SQLAlchemy & PyDantic models
│   │   ├── services/         # NLP parsing, Fair-Weighing & Gemini XAI services
│   │   └── main.py           # Application entrypoint
│   ├── tests/                # PyTest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend-web/             # React.js Admin & Merchant Operations Console
│   ├── src/
│   │   ├── components/       # UI components (DisputeQueue, EvidenceViewer, OverrideModal)
│   │   ├── pages/            # Dashboard, CaseDetails, Analytics
│   │   └── services/         # Axios API client
│   └── package.json
├── mobile-app/               # React Native Cardholder App
│   ├── src/
│   │   ├── screens/          # FileDisputeScreen, CaseTrackerScreen, RationaleView
│   │   └── navigation/       # App Stack Navigation
│   └── package.json
├── docker-compose.yml        # Local orchestration (FastAPI, Postgres, Mongo, Redis)
├── .env.example              # Template environment variables
└── README.md
```

---

## 🏗️ Technical Architecture & Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor CM as Card Member (Mobile)
    actor MER as Merchant / Ops (Web)
    participant API as FastAPI REST Gateway
    participant NLP as spaCy / HF Ingestion Service
    participant DB as MongoDB / PostgreSQL
    participant ENGINE as Fair-Weighing Scorer
    participant XAI as Gemini LLM Rationale Generator

    CM->>API: POST /api/v1/disputes (Initiate Case)
    MER->>API: POST /api/v1/evidence/upload (Submit Receipts/Tracking)
    API->>NLP: Trigger Async Evidence Extraction
    NLP->>DB: Store Structured Entities & Raw Artifacts
    API->>ENGINE: Execute Weighted Scoring Algorithm
    ENGINE->>XAI: Send Structured Evidence Matrix
    XAI-->>ENGINE: Return Natural Language Explanation & Confidence
    ENGINE->>DB: Persist Recommendation & Audit Log
    API-->>CM: Real-Time Status & Plain-Language Rationale
    API-->>MER: Merchant Resolution Breakdown
```

---

## 🔌 API Endpoint Specifications

### 1. Submit Dispute Evidence
```http
POST /api/v1/disputes/{dispute_id}/evidence
Content-Type: multipart/form-data

dispute_id: "DSP-2026-8941"
evidence_type: "proof_of_delivery"
file: [tracking_receipt.pdf]
```

**Response (`202 Accepted`):**
```json
{
  "status": "processing",
  "dispute_id": "DSP-2026-8941",
  "extracted_entities": {
    "carrier": "FedEx",
    "tracking_number": "781234567890",
    "delivery_timestamp": "2026-10-12T14:22:00Z",
    "signature_present": true
  }
}
```

### 2. Evaluate Case Resolution
```http
POST /api/v1/decisions/evaluate
Content-Type: application/json

{
  "dispute_id": "DSP-2026-8941",
  "force_reweigh": false
}
```

**Response (`200 OK`):**
```json
{
  "dispute_id": "DSP-2026-8941",
  "recommended_outcome": "MERCHANT_FAVOR",
  "confidence_score": 0.94,
  "requires_human_override": false,
  "reasoning_summary": "Merchant submitted carrier delivery confirmation with valid recipient signature timestamped 2 days prior to dispute filing. Refund policy clause 4.2 explicitly covers digital delivery receipts.",
  "weighted_factors": [
    { "factor": "carrier_signature_match", "weight": 0.45, "score": 1.0 },
    { "factor": "cardholder_claim_consistency", "weight": 0.35, "score": 0.2 },
    { "factor": "merchant_history_rating", "weight": 0.20, "score": 0.9 }
  ]
}
```

---

## ⚡ Quickstart & Local Setup

### Prerequisites
- **Docker & Docker Compose** (Recommended) OR **Python 3.10+**, **Node.js 18+**, **PostgreSQL 14**, **MongoDB 6**

### Option A: Docker Compose (Fastest)

```bash
# Clone the repository
git clone https://github.com/AchyutPathak30/VerdictAI.git
cd VerdictAI

# Copy environment settings
cp .env.example .env

# Spin up all containers (FastAPI, Postgres, Mongo, Web Dashboard)
docker-compose up --build
```
> Access FastAPI Docs at `http://localhost:8000/docs` and Web Admin Console at `http://localhost:3000`.

---

### Option B: Manual Local Installation

#### 1. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv

# Activate Virtual Environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 2. Web Admin Portal Setup (React)
```bash
cd ../frontend-web
npm install
npm start
```

#### 3. Cardholder Mobile App (React Native)
```bash
cd ../mobile-app
npm install
npx react-native run-android # or run-ios
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
# Application Settings
ENVIRONMENT=development
LOG_LEVEL=info
SECRET_KEY=super-secret-jwt-key-change-in-production

# Core API Gateway
HOST=0.0.0.0
PORT=8000

# Database URLs
DATABASE_URL=postgresql://verdict_user:verdict_pass@localhost:5432/verdictai_db
MONGODB_URI=mongodb://localhost:27017/verdictai_evidence

# AI & LLM Engine Keys
GEMINI_API_KEY=your_google_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key_fallback
```

---

## 🧪 Running Unit & Integration Tests

```bash
# Backend Test Suite (PyTest)
cd backend
pytest tests/ -v --cov=app

# Frontend Web Component Tests (Jest)
cd ../frontend-web
npm test -- --watchAll=false
```

---

## 👥 Core Team & Project Structure

| Role | Engineer | Domain Responsibility |
| :--- | :--- | :--- |
| **Project Lead** | **Nirav Kachhiya** (`202512011`) | Core API Architecture & Backend Coordination |
| **AI/NLP Engineer** | **Achyut Pathak** (`202512039`) | Unstructured Evidence Parser (spaCy/Transformers) |
| **ML Engineer** | **Akshay Purohit** (`202512033`) | Fair-Weighing Algorithm & Scoring Matrix |
| **Backend Engineer** | **Darshan Prajapati** (`202512026`) | Explainable AI (XAI) & Gemini Integration Layer |
| **Frontend Engineer (Web)** | **Rohit Peswani** (`202512115`) | Admin Override Queue & Merchant Portal (React) |
| **Mobile Engineer** | **Mayank Jayswal** (`202512093`) | Card Member Dispute Tracking App (React Native) |
| **DevOps & QA** | **Hardik Kansara** (`202512036`) | Docker Infrastructure, CI/CD & Automated Testing |

---

## 📜 License

This project is licensed under the **MIT License**. See `LICENSE` for details.
