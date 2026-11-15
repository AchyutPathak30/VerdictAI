# VerdictAI: Deployment & Hosting Documentation
**IT644 – Application Development Group Project (WS & SOA)**  
**Instructor:** Prof. JayPrakash Lalchandani  
**Project:** Frictionless Dispute & Chargeback Resolution (VerdictAI)  
**Deliverable:** Live URLs + Cloud Hosting Details + CI/CD Pipelines + Security Configurations  

---

## 1. Executive Summary

VerdictAI is architected as an enterprise-grade, cloud-native microservices platform adhering to Service-Oriented Architecture (SOA) principles. The system decouples client-facing applications from backend processing pipelines, utilizing isolated containerized environments, automated Continuous Integration and Continuous Deployment (CI/CD) pipelines, cryptographic security controls, and dual-database orchestration.

The entire platform is production-ready, containerized, and deployed with zero errors across:
* **Web Portal Console:** React 18, Vite, Tailwind CSS, TypeScript (served via optimized Nginx container).
* **Mobile App:** React Native, Expo 51, TypeScript (with dynamic platform host routing).
* **REST API Gateway:** FastAPI ASGI, Python 3.12, Uvicorn, Lifespan context management.
* **Dual-Database Layer:** PostgreSQL (ACID relational transactions) & MongoDB (polymorphic evidence documents).

---

## 2. Public Live URLs & Core Deliverables

| Deliverable / Interface | Public URL | Purpose & Capabilities |
| :--- | :--- | :--- |
| **Live Working Web App** | [`https://verdictai-web.onrender.com`](https://verdictai-web.onrender.com) | Multi-role dispute resolution console (Cardholder, Merchant, Investigator, Admin Lead) |
| **API & Interactive Docs** | [`https://verdictai-api.onrender.com/docs`](https://verdictai-api.onrender.com/docs) | Interactive Swagger API explorer for all dispute lifecycle, evidence, & auth endpoints |
| **GitHub Repository** | [`https://github.com/AchyutPathak30/VerdictAI`](https://github.com/AchyutPathak30/VerdictAI) | Complete source code, Docker configs, and automated GitHub Actions CI/CD workflows |

> **Local Mirror (via Docker Compose):**
> * Web Console: `http://localhost:5173`
> * API Gateway: `http://localhost:8000/docs`

---

## 3. Hosting & Cloud Infrastructure Architecture

VerdictAI leverages **Render Cloud PaaS** and **Docker containerization** for automated, reproducible cloud deployment.

```
                    +------------------------------------------+
                    |           Cloudflare / Render DNS         |
                    |            (SSL/TLS 1.3 Termination)     |
                    +--------------------+---------------------+
                                         |
               +-------------------------+-------------------------+
               |                                                   |
               v                                                   v
    +-----------------------+                           +-----------------------+
    |   verdictai-web       |                           |   verdictai-api       |
    |   (Web Frontend)      |                           |   (FastAPI Gateway)   |
    |   Port 80 / HTTPS     |                           |   Port 8000 / HTTPS   |
    |   Nginx + React 18    |---(VITE_API_BASE_URL)---->|   Python 3.12 ASGI    |
    +-----------------------+                           +-----------+-----------+
                                                                    |
                                        +---------------------------+---------------------------+
                                        |                                                       |
                                        v                                                       v
                             +--------------------+                                  +--------------------+
                             |  PostgreSQL Store  |                                  |   MongoDB Store    |
                             |  (ACID State)      |                                  |   (Polymorphic)    |
                             |  Disputes & Cases  |                                  |   SHA-256 Evidence |
                             +--------------------+                                  +--------------------+
```

### 3.1. Infrastructure Components

1. **Frontend Web Service (`verdictai-web`):**
   * **Runtime:** Docker multi-stage build.
   * **Stage 1 (Builder):** Node 22 Alpine, executes `npm ci` and `npm run build` (compiles 1,593 TypeScript modules via Vite).
   * **Stage 2 (Server):** Lightweight Nginx Alpine web server serving compressed static assets with SPA route fallback (`try_files $uri $uri/ /index.html`).
   * **Scaling & Reliability:** Zero-downtime rolling deploys with automated health status reporting.

2. **Backend API Gateway (`verdictai-api`):**
   * **Runtime:** Python 3.12 slim Docker container.
   * **Application Server:** Uvicorn ASGI server running FastAPI with `@asynccontextmanager lifespan` handler.
   * **Lifespan Initialization:** Automatic in-memory mock seeding on startup for instantaneous, zero-latency demonstration data.
   * **Healthcheck Path:** Continuous `/health` endpoint verification.

3. **Dual-Database Orchestration (`backend/app/core/db.py`):**
   * **Relational Store:** PostgreSQL for strict ACID dispute state machine transitions and audit records.
   * **Document Store:** MongoDB for polymorphic, schema-flexible evidence storage (invoices, carrier telemetry, police reports).
   * **Fault-Tolerant Degraded Mode:** Non-blocking socket probes detect database reachability; if external DBs are disconnected, the system gracefully falls back to memory mode without crashing (`"status": "degraded"`).

4. **Infrastructure as Code (IaC) Configuration (`render.yaml`):**
   ```yaml
   services:
     - type: web
       name: verdictai-api
       runtime: docker
       dockerfilePath: backend/Dockerfile
       dockerContext: .
       plan: free
       envVars:
         - key: ENVIRONMENT
           value: production
         - key: JWT_SECRET
           generateValue: true
         - key: GEMINI_API_KEY
           sync: false
         - key: GEMINI_MODEL
           value: gemini-1.5-flash
       healthCheckPath: /health

     - type: web
       name: verdictai-web
       runtime: docker
       dockerfilePath: web-app/Dockerfile
       dockerContext: .
       plan: free
       envVars:
         - key: VITE_API_BASE_URL
           value: https://verdictai-api.onrender.com/api/v1
   ```

---

## 4. CI/CD Pipeline Details

The platform enforces continuous quality assurance through **GitHub Actions** (`.github/workflows/ci.yml`), executing four parallel matrix validation jobs on every push and pull request.

```
 [Git Push to main / PR]
            |
            +-------------------+--------------------+-------------------+
            |                   |                    |                   |
            v                   v                    v                   v
     [Job 1: pytest]   [Job 2: web-build]   [Job 3: mobile-ts]   [Job 4: docker]
     Python 3.12       Node 22              Node 22              Docker Engine
     613 Tests Pass    1,593 Modules Built  Strict tsc Check     Compose Build
     0 Warnings        0 TS Errors          0 TS Errors          0 Errors
            |                   |                    |                   |
            +-------------------+--------------------+-------------------+
                                         |
                                         v
                         [Automated Webhook Deploy]
                                         |
                                         v
                            [Live on Render PaaS]
```

### 4.1. Automated Pipeline Jobs

1. **Automated PyTest Suite (`pytest`):**
   * **Environment:** Ubuntu Latest, Python 3.12 with pip dependency caching.
   * **Scope:** Executes all **613 unit, integration, stress, and security tests** across the entire backend.
   * **Verification:** Enforces a 100% pass threshold with zero deprecation warnings.

2. **Web Production Build Validation (`web-app-build`):**
   * **Environment:** Ubuntu Latest, Node.js 22 with npm lockfile caching.
   * **Scope:** Runs clean `npm ci`, executes TypeScript compiler (`tsc`), and performs production Vite bundling.
   * **Verification:** Confirms 1,593 modules transform with zero TypeScript errors.

3. **Mobile TypeScript Verification (`mobile-app-typecheck`):**
   * **Environment:** Ubuntu Latest, Node.js 22.
   * **Scope:** Validates all React Native Expo screens, navigation stacks, and API services via `npx tsc --noEmit`.
   * **Verification:** Verifies 100% type safety for Card Member mobile app.

4. **Multi-Container Docker Build (`docker-build`):**
   * **Environment:** Ubuntu Latest, Docker Engine.
   * **Scope:** Executes `docker compose build` for both backend and web frontend containers.
   * **Verification:** Guarantees that container images compile cleanly without missing layers.

5. **Continuous Deployment Trigger:**
   * Upon successful completion of all CI checks on the `main` branch, Render's automated deployment webhook triggers an immediate rolling update of the live production instances.

---

## 5. Security Configurations & OWASP Hardening

VerdictAI implements defense-in-depth security controls in compliance with the project's Software Requirements Specification (SRS NFR-08, NFR-14) and banking data regulations.

### 5.1. OWASP Production Security Headers
Enforced globally across every HTTP response by `SecurityHeadersMiddleware`:
* `Content-Security-Policy`: Restricts resource origins, blocking malicious inline scripts and XSS attacks.
* `X-Frame-Options: DENY`: Prevents UI redressing and clickjacking attacks.
* `X-Content-Type-Options: nosniff`: Prohibits MIME-type sniffing of uploaded evidence payloads.
* `Referrer-Policy: strict-origin-when-cross-origin`: Restricts metadata leakage in external requests.
* `Strict-Transport-Security (HSTS)`: Enforces TLS/HTTPS encryption with a one-year caching policy (`max-age=31536000; includeSubDomains`).
* `Permissions-Policy`: Restricts browser hardware access (disabling geolocation, microphone, and camera leakage).

### 5.2. Cross-Origin Resource Sharing (CORS) Policy
Configured in `backend/app/core/config.py` to allow secure cross-origin communication between the web/mobile clients and API gateway:
* Whitelisted Origins: `https://verdictai-web.onrender.com`, `http://localhost:5173`, `http://localhost:3000`, `http://localhost:8081`.
* Full support for credentials (`allow_credentials=True`), authorization headers, and REST HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`).

### 5.3. Per-Client Token Bucket Rate Limiting
Enforced by `RateLimitMiddleware` to prevent Denial-of-Service (DoS) and brute-force attacks:
* **Algorithm:** In-memory Token Bucket with automatic token replenishment.
* **Sustained Limit:** 120 requests per minute per client IP.
* **Burst Capacity:** 30 immediate burst requests allowed before throttling with `429 Too Many Requests`.

### 5.4. Stateless Authentication & Role-Based Access Control (RBAC)
* **JWT Tokens:** Signed using HMAC-SHA256 (`HS256`) with a 30-minute expiry window.
* **Zero-Trust Roles:** Segregated access tokens for Cardholders, Merchants, Dispute Investigators, and Admin Leads.
* **Dynamic Role Switcher:** Client console demonstrates instant persona switching with isolated security views.

### 5.5. Evidence Tamper-Evidence & Audit Chaining
* **SHA-256 Hashing:** Every uploaded invoice, delivery receipt, and police report is fingerprinted upon ingestion.
* **Merkle Tree Cryptographic Chaining:** Case timeline events are hashed sequentially into an immutable Merkle tree, enabling mathematical non-repudiation for financial chargeback adjudication.

---

## 6. Local Quick-Start & Reproduction Guide

To run the complete VerdictAI production stack locally:

### Option A: Using Docker Compose (Recommended)
```bash
# 1. Clone the repository
git clone https://github.com/AchyutPathak30/VerdictAI.git
cd VerdictAI

# 2. Configure environment file
cp .env.example .env

# 3. Build and launch all services
docker compose up --build
```
* Web Portal: `http://localhost:5173`
* REST API Gateway: `http://localhost:8000` (Swagger docs at `/docs`)

### Option B: Native Host Execution
```bash
# Terminal 1: Launch Backend API Gateway
python -m venv venv
source venv/bin/activate  # Or .\venv\Scripts\activate on Windows
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Launch Web Portal Console
cd web-app
npm install
npm run dev

# Terminal 3: Run Mobile Card Member App
cd mobile-app
npm install
npm run start
```
