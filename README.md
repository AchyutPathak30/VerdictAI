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
