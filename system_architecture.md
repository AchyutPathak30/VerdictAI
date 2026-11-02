# 🏛️ VerdictAI: System Architecture & Subsystem Specification
**Author:** Nirav Kachhiya (Project Lead / Backend Engineer)  
**Course:** IT644 — Application Development Group Project  
**Date:** November 2026  
**Document Version:** 2.0 (Milestone 5/6 System Architecture Final)

---

## 1. 4-Tier Enterprise Architecture Topology

VerdictAI is organized into four cleanly decoupled tiers to guarantee horizontal scalability, fault tolerance, and security isolation:

```
[ Tier 1: Client Interfaces ]
  • React.js Web Console (Admin Lead, Senior Investigator, Store Merchant)
  • React Native Expo Mobile App (Card Member Dispute Wizard)
               |
               v (HTTPS / REST JSON / Multipart Uploads)
[ Tier 2: REST API Gateway & Security ]
  • FastAPI Gateway (CORS, Rate Limiting, OpenAPI 3.0)
  • Zero-Trust Dynamic RBAC & Token Scoping (4 Enterprise Personas)
               |
               v (Internal Service Invocations)
[ Tier 3: Core Domain Services & AI Engines ]
  • Case File Builder & Aggregator (Nirav Kachhiya)
  • Dispute Lifecycle State Machine & SLA Engine (Nirav Kachhiya)
  • Multi-Modal Evidence Parsing & NLP Extraction (Achyut Pathak)
  • Fair-Weighing Algorithmic ML Scoring (Akshay Purohit)
  • Transparent Reasoning Layer & XAI Guardrails (Darshan Prajapati)
  • Merkle-Tree Cryptographic Audit Engine (Nirav Kachhiya)
               |
               v (Dual-Write Orchestration)
[ Tier 4: Polyglot Persistence & Storage ]
  • PostgreSQL (ACID Relational Core: Users, Merchants, Disputes, Audit Logs)
  • MongoDB (Polymorphic Documents: Evidence Payloads, OCR Tokens, Telematics)
```

---

## 2. Asynchronous Dispute Lifecycle Pipeline

The end-to-end processing pipeline executes sequentially through verified state transitions:

```
[Cardholder Submits Claim] (POST /api/v1/disputes)
          |
          v
[State: SUBMITTED] --> SLA Deadline Calculated (48h)
          |
          v
[Evidence Attached] (POST /api/v1/disputes/{id}/evidence)
          |
          v
[Polymorphic Parsing & Anomaly Flagging] (dispatcher.py)
          |
          v
[State: EVIDENCE_INGESTED] --> SHA-256 Hashing & Merkle Block Appended
          |
          v
[Fair-Weighing ML Evaluation] (POST /api/v1/disputes/{id}/score)
          |
          v
[Transparent Reasoning XAI Generation] (Gemini 2.0 + Deterministic Fallback)
          |
          v
[Confidence >= 75%] ---------> [AUTO_RESOLVED] (Instant Credit / Refund)
          |
[Confidence < 75% or Anomaly] -> [MANUAL_REVIEW_QUEUE] (Investigator Review)
          |
          v
[Admin Manual Override] (POST /api/v1/admin/disputes/{id}/override)
          |
          v
[State: ADMIN_OVERRIDDEN] --> Tamper-Evident Merkle Proof Sealed
```

---

## 3. Subsystem Breakdown & Ownership

| Subsystem | Owner | Primary Language / Stack | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Case Service & FSM** | Nirav Kachhiya | Python 3.13 / Pydantic | Cross-database compilation, 11-stage FSM, SLA monitoring. |
| **Audit Engine** | Nirav Kachhiya | Python 3.13 / Hashlib | SHA-256 block chaining, Merkle tree root computation. |
| **Evidence Parsers** | Achyut Pathak | Python 3.13 / Regex / spaCy | Receipt OCR, GPS carrier tracking, dialogue NLP. |
| **Fair-Weighing ML** | Akshay Purohit | Python 3.13 / Scikit / NumPy | Calibrated rubric scoring, category anchors, bias neutrality. |
| **XAI Reasoning** | Darshan Prajapati | Python 3.13 / Google GenAI | Dual-perspective plain language rationale, PII guardrails. |
| **Web Console** | Rohit Peswani | React 18 / Vite / TypeScript | Dispute queue, dynamic RBAC switcher, evidence viewer. |
| **Mobile Client** | Mayank Jayswal | React Native / Expo | 4-step dispute wizard, camera upload, push alerts. |
| **DevOps & CI/CD** | Hardik Kansara | Docker Compose / GitHub Actions| Multi-container orchestration, 454-test automated matrix. |
