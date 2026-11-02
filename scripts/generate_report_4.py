"""
Script to generate Bi-weeklyStatusReport_4_Frictionless_Dispute_Resolution.pdf
Matching the exact academic typography and structure of Reports #2 and #3.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and print total page count in header/footer."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        self.setFont("Times-Roman", 9)
        self.setFillColor(colors.HexColor("#333333"))

        # Running header on every page
        self.drawString(54, 750, "Bi-Weekly Status Report #4")
        self.drawRightString(612 - 54, 750, f"{self._pageNumber}")
        self.setStrokeColor(colors.HexColor("#CCCCCC"))
        self.setLineWidth(0.5)
        self.line(54, 744, 612 - 54, 744)

        self.restoreState()


def build_pdf(filename="Bi-weeklyStatusReport_4_Frictionless_Dispute_Resolution.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom styles matching LaTeX Times Roman appearance
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Times-Bold",
        fontSize=18,
        leading=22,
        alignment=1,  # Center
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=11,
        leading=14,
        alignment=1,
        spaceAfter=14,
    )

    meta_style = ParagraphStyle(
        "MetaText",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=9.5,
        leading=13,
    )

    h1_style = ParagraphStyle(
        "Heading1_Custom",
        parent=styles["Normal"],
        fontName="Times-Bold",
        fontSize=12,
        leading=15,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        "Heading2_Custom",
        parent=styles["Normal"],
        fontName="Times-Bold",
        fontSize=10.5,
        leading=14,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "Body_Custom",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=9,
        leading=12.5,
        alignment=4,  # Justified
        spaceAfter=5,
    )

    bullet_style = ParagraphStyle(
        "Bullet_Custom",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=8.5,
        leading=11.5,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=4,
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Times-Bold",
        fontSize=8.5,
        leading=11,
        alignment=0,
    )

    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Times-Roman",
        fontSize=8,
        leading=10.5,
        alignment=0,
    )

    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Times-Bold",
        fontSize=8,
        leading=10.5,
        alignment=0,
    )

    story = []

    # ── Page 1: Title & Overview ───────────────────────────────────────────
    story.append(Paragraph("Bi-Weekly Project Status Report #4", title_style))
    story.append(Paragraph("IT644 – Application Development Group Project", subtitle_style))

    meta_text = """
    <b>Project Name:</b> Frictionless Dispute & Chargeback Resolution<br/>
    <b>Report Period:</b> 15 Sep 2026 – 28 Sep 2026 (Cycle 4 / Weeks 7–8)<br/>
    <b>Prepared By:</b> Nirav Kachhiya (Project Lead) & Akshay Purohit (ML Engineer)<br/>
    <b>Date Submitted:</b> 30/09/2026<br/>
    <b>GitHub Repository:</b> https://github.com/AchyutPathak30/VerdictAI
    """
    story.append(Paragraph(meta_text, meta_style))
    story.append(Spacer(1, 10))

    # Project Status Summary Box
    story.append(Paragraph("Project Status Summary", h1_style))
    summary_box_data = [
        [
            Paragraph("<b>Sprint/Milestone</b>", table_cell_bold),
            Paragraph("Phase 3 (Fair-Weighing & Transparent Reasoning) Completed → Milestone 3 Sign-off; Phase 4/5 Active", table_cell_style),
        ],
        [
            Paragraph("<b>% Complete (overall)</b>", table_cell_bold),
            Paragraph("75%", table_cell_style),
        ],
    ]
    t_summary = Table(summary_box_data, colWidths=[130, 374])
    t_summary.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor("#D0D0D0")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 10))

    # Indicator Table
    ind_headers = ["Indicator", "Current", "Previous", "Trend", "Status"]
    ind_rows = [
        ["Overall Project", "75%", "55%", "↑", "On Track"],
        ["Schedule", "95% (P3 Done, P4 Active)", "95% (P2 Done, P3 Active)", "→", "On Track"],
        ["Scope", "100% (P3 & P4 Scope)", "100% (P2 & P3 Scope)", "→", "On Track"],
        ["Quality", "100% Tests Pass (316+ tests)", "100% Tests Pass (182 tests)", "↑", "On Track"],
        ["Team Contribution", "100%", "100%", "→", "On Track"],
        ["Dependencies", "98%", "98%", "→", "On Track"],
    ]
    ind_table_data = [[Paragraph(f"<b>{h}</b>", table_header_style) for h in ind_headers]]
    for row in ind_rows:
        ind_table_data.append([
            Paragraph(f"<b>{row[0]}</b>", table_cell_style),
            Paragraph(row[1], table_cell_style),
            Paragraph(row[2], table_cell_style),
            Paragraph(row[3], table_cell_style),
            Paragraph(f"<font color='green'><b>{row[4]}</b></font>", table_cell_style),
        ])
    t_ind = Table(ind_table_data, colWidths=[150, 110, 100, 50, 94])
    t_ind.setStyle(TableStyle([
        ("LINEABOVE", (0, 0), (-1, 0), 1, colors.black),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.black),
        ("LINEBELOW", (0, -1), (-1, -1), 1, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(t_ind)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Summary Notes:", h1_style))
    summary_p1 = """
    Over the past two weeks (Weeks 7–8 / Cycle 4), the team achieved full Milestone 3 sign-off, concluding
    all core deliverables for Phase 3 (Fair-Weighing & Transparent Reasoning Engine) while pulling forward major
    Phase 4 and Phase 5 integration deliverables. All 102 synthetic chargeback scenarios now execute through
    the end-to-end REST API with 100% pass rates across all 12 test suites (316+ automated tests).
    """
    summary_p2 = """
    A key breakthrough of this cycle was the delivery of the <b>Transparent Reasoning Engine & LLM Hallucination Guardrails</b>
    by Akshay Purohit, which bridges mathematical scoring into auditable, natural-language explanations powered by Google Gemini 2.0 Flash
    with a deterministic fallback. Concurrently, Akshay resolved the critical <b>FR-17 routing gap</b> by recalibrating the missing-primary-evidence
    penalty from -15 to -20 points, ensuring statement-only disputes (CAT-02 and CAT-05) reliably route to the Dispute-Ops Manual Review Queue
    (confidence drops to 46.1%, strictly below the 50.0% threshold). In addition, an industry-grade <b>Algorithmic Fairness Audit Engine</b>
    was completed, confirming 100% compliance with the US EEOC 4/5ths Rule (DIR ≥ 0.80) and zero disparate treatment across cardholder tiers.
    Darshan Prajapati delivered the Phase 3 REST APIs; Rohit Peswani advanced the React Web Console; Mayank Jayswal integrated the Mobile App
    scaffolding; and Hardik Kansara built the 102-scenario E2E integration test harness.
    """
    story.append(Paragraph(summary_p1, body_style))
    story.append(Paragraph(summary_p2, body_style))

    story.append(PageBreak())

    # ── Page 2: Key Accomplishments in Two Weeks ───────────────────────────
    story.append(Paragraph("Key Accomplishments in Two Weeks", h1_style))

    story.append(Paragraph(
        "• <b>Transparent Reasoning Engine Implementation (Akshay Purohit & Darshan Prajapati):</b> "
        "Architected and deployed <code>TransparentReasoningEngine</code> (backend/app/services/reasoning_layer/engine.py) "
        "providing dual-perspective explainable AI (XAI) for Card Members and Merchants. Generates objective 2-3 sentence summaries "
        "grounded in verified evidence factors using Google Gemini 2.0 Flash, with an instantaneous deterministic safe fallback.",
        bullet_style
    ))

    story.append(Paragraph(
        "• <b>Deterministic LLM Hallucination Guardrails (Akshay Purohit):</b> "
        "Engineered <code>HallucinationGuardrail</code> (backend/app/services/reasoning_layer/guardrails.py) enforcing strict financial policy boundaries: "
        "PII sanitization (redacting 16-digit card and 10-digit phone numbers), prohibition of unauthorized settlement guarantees (e.g. 'promise full refund in 2 hours'), "
        "blocking derogatory/accusatory language, masking internal mathematical formulas, and validating monetary amount consistency against case headers.",
        bullet_style
    ))

    story.append(Paragraph(
        "• <b>Resolution of FR-17 / AC-09 Auto-Escalation Defect (Akshay Purohit):</b> "
        "Calibrated missing-primary-evidence penalty from -15.0 to -20.0 points in <code>fair_weighing_model.py</code>. "
        "Directly resolves the defect identified in Milestone 3 testing where CAT-02 (Defective Product) and CAT-05 (Cancelled Subscription) "
        "statement-only disputes incorrectly reached 51.1% confidence. The recalibrated model yields 46.1% confidence, forcing correct automatic "
        "routing to <code>MANUAL_REVIEW_QUEUE</code>.",
        bullet_style
    ))

    story.append(Paragraph(
        "• <b>Algorithmic Fairness & Bias Audit Engine (Akshay Purohit):</b> "
        "Delivered production-grade statistical fairness auditor (akshay_ml_fairweighing/phase4_fairness_audit/) evaluating "
        "Disparate Impact Ratio (DIR ≥ 0.80 / EEOC 4/5ths Rule), Statistical Parity Difference (|SPD| ≤ 0.10), Equal Opportunity Difference (|EOD| ≤ 0.05), "
        "and Counterfactual Fairness Invariance (100% invariance when customer account tier is mutated on identical evidence).",
        bullet_style
    ))

    story.append(Paragraph(
        "• <b>Model Diagnostics, Evidence Attribution & Calibration (Akshay Purohit):</b> "
        "Constructed Shapley-style evidence attribution waterfall and Expected Calibration Error (ECE) diagnostic toolkit "
        "(akshay_ml_fairweighing/phase5_diagnostics/), quantifying exact point contributions per evidence artifact (EV-01 to EV-10) and verifying Brier Score < 0.05.",
        bullet_style
    ))

    story.append(Paragraph(
        "• <b>Milestone 3 End-to-End System Integration Suite (Hardik Kansara):</b> "
        "Authored <code>test_e2e_milestone3.py</code> validating all 102 synthetic chargeback scenarios end-to-end through public REST APIs: "
        "dispute creation → evidence attachment (parsers) → synchronous scoring → lifecycle routing → XAI reasoning → Merkle audit trail.",
        bullet_style
    ))

    story.append(Paragraph(
        "• <b>Transparent Reasoning REST Endpoints & Schemas (Darshan Prajapati):</b> "
        "Exposed <code>POST /api/v1/reasoning/explain</code>, <code>POST /api/v1/reasoning/audit-guardrails</code>, and <code>GET /api/v1/reasoning/capabilities</code> "
        "with Pydantic request/response validation schemas and 12 passing API tests in <code>test_reasoning_api.py</code>.",
        bullet_style
    ))

    story.append(Paragraph(
        "• <b>React Web Console & Wireframes (Rohit Peswani):</b> "
        "Merged PR #6 delivering full React web application scaffold (frontend/web/), Visily wireframe exports, "
        "admin triage queue, and dispute detail views with responsive layout shell.",
        bullet_style
    ))

    story.append(Paragraph(
        "• <b>React Native Card Member Mobile App Scaffold (Mayank Jayswal):</b> "
        "Merged PR #4 delivering 32 TypeScript source files in mobile-app/ with tab navigation (Disputes, New Claim, Evidence, Notifications) "
        "and multi-part evidence attachment forms.",
        bullet_style
    ))

    story.append(Paragraph(
        "• <b>Test Suite Expansion to 316+ Tests:</b> "
        "Total passing tests expanded from 182 to 316+ across all 12 test suites with 100% pass rate in ~7 seconds.",
        bullet_style
    ))

    story.append(Spacer(1, 10))

    # ── Page 3: Planned vs. Actual Table ──────────────────────────────────
    story.append(Paragraph("Planned vs. Actual", h1_style))
    pva_headers = ["Task / Deliverable", "Planned Completion", "Current Forecast", "Actual Status", "Notes"]
    pva_rows = [
        ["Transparent reasoning layer design", "Sep 22", "Sep 22", "Done", "Darshan & Akshay: prompt templates & schemas"],
        ["Transparent Reasoning Engine build", "Sep 22", "Sep 25", "Done", "Gemini 2.0 Flash XAI + deterministic fallback"],
        ["LLM Hallucination Guardrails", "Sep 25", "Sep 25", "Done", "PII redaction, formula secrecy, policy checks"],
        ["FR-17 Routing Defect Resolution", "Sep 28", "Sep 27", "Done", "Penalty calibrated to -20pts; confidence 46.1%"],
        ["Algorithmic Fairness Audit Engine", "Sep 28", "Sep 26", "Done", "EEOC 4/5ths Rule & DIR >= 0.80 verified"],
        ["Milestone 3 E2E Test Suite (102 cases)", "Sep 28", "Sep 28", "Done", "100% passing across 102 dispute scenarios"],
        ["Reasoning REST API Gateways (3 routers)", "Sep 28", "Sep 26", "Done", "POST /explain, POST /audit-guardrails"],
        ["Web Console Scaffold & Routing", "Sep 21", "Sep 16", "Done", "PR #6 merged (Rohit: React web scaffold)"],
        ["Card Member Mobile Scaffold", "Oct 05", "Sep 09", "Done", "PR #4 merged (Mayank: 32 TypeScript files)"],
        ["Client API Wiring (Phase 4)", "Oct 19", "Oct 01", "In Progress", "Connecting React web & mobile to FastAPI"],
        ["Docker Compose & CI hardening", "Oct 11", "Oct 11", "In Progress", "Hardik: multi-stage Docker & GitHub Actions"],
    ]

    pva_table_data = [[Paragraph(f"<b>{h}</b>", table_header_style) for h in pva_headers]]
    for row in pva_rows:
        status_color = "green" if row[3] == "Done" else "orange"
        pva_table_data.append([
            Paragraph(f"<b>{row[0]}</b>", table_cell_style),
            Paragraph(row[1], table_cell_style),
            Paragraph(row[2], table_cell_style),
            Paragraph(f"<font color='{status_color}'><b>{row[3]}</b></font>", table_cell_style),
            Paragraph(row[4], table_cell_style),
        ])
    t_pva = Table(pva_table_data, colWidths=[130, 75, 75, 64, 160])
    t_pva.setStyle(TableStyle([
        ("LINEABOVE", (0, 0), (-1, 0), 1, colors.black),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.black),
        ("LINEBELOW", (0, -1), (-1, -1), 1, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
    ]))
    story.append(t_pva)

    story.append(PageBreak())

    # ── Page 4: Risks, Issues, Decisions & Scope Changes ───────────────────
    story.append(Paragraph("Project Risks, Issues, & Dependencies", h1_style))
    risk_headers = ["Type (ID)", "Description", "Impact", "Owner", "Mitigation / Current Status"]
    risk_rows = [
        ["Risk (R-01)", "FR-17 Defect: Low-evidence disputes bypassing manual review", "High", "Akshay P.", "Resolved – missing-primary penalty calibrated to -20pts; confidence drops to 46.1%."],
        ["Dependency (D-01)", "Gemini API token limits & network latency for XAI", "Medium", "Akshay P.", "Resolved – deterministic safe fallback deployed; sub-30s SLA guaranteed."],
        ["Risk (R-02)", "LLM Hallucinations on binding legal / settlement terms", "High", "Akshay P.", "Resolved – regex assertion guardrails & PII redaction layer strictly enforced."],
        ["Risk (R-03)", "Multi-client synchronization (Web Console & Mobile App)", "Low", "Darshan P.", "On Track – REST polling implemented; WebSocket integration planned for Phase 4."],
        ["Issue (I-01)", "Asynchronous socket pair hang during sandboxed test runs", "Medium", "Hardik K.", "Resolved – identified AnyIO loopback socket requirement on Windows."],
    ]
    risk_table_data = [[Paragraph(f"<b>{h}</b>", table_header_style) for h in risk_headers]]
    for row in risk_rows:
        risk_table_data.append([
            Paragraph(f"<b>{row[0]}</b>", table_cell_style),
            Paragraph(row[1], table_cell_style),
            Paragraph(row[2], table_cell_style),
            Paragraph(row[3], table_cell_style),
            Paragraph(row[4], table_cell_style),
        ])
    t_risk = Table(risk_table_data, colWidths=[75, 125, 55, 65, 184])
    t_risk.setStyle(TableStyle([
        ("LINEABOVE", (0, 0), (-1, 0), 1, colors.black),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.black),
        ("LINEBELOW", (0, -1), (-1, -1), 1, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
    ]))
    story.append(t_risk)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Project Decisions", h1_style))
    dec_headers = ["Decision", "Rationale", "Impact", "Decided By", "Date"]
    dec_rows = [
        [
            "Missing-Primary Penalty Calibration (-20pts)",
            "Guarantees that disputes lacking primary evidence cannot exceed 50% confidence.",
            "Resolves FR-17 defect across CAT-02 and CAT-05.",
            "Akshay P. & Hardik K.",
            "Sep 27"
        ],
        [
            "Deterministic Rule Guardrails before LLM Output Release",
            "Prevents hallucinated legal commitments, formula leaks, and PII leakage.",
            "Satisfies ISO/IEC 24027 and financial compliance.",
            "Akshay P. & Nirav K.",
            "Sep 25"
        ],
        [
            "Dual-Perspective XAI Output Architecture",
            "Provides customized rationales for Cardholder vs. Merchant viewpoints.",
            "Enhances user trust and transparency.",
            "Darshan P. & Akshay P.",
            "Sep 22"
        ],
        [
            "FastAPI Lifespan Startup Seeding",
            "Pre-populates demonstration dispute cases on container startup.",
            "Instant readiness for live web & mobile testing.",
            "Nirav K.",
            "Sep 26"
        ],
    ]
    dec_table_data = [[Paragraph(f"<b>{h}</b>", table_header_style) for h in dec_headers]]
    for row in dec_rows:
        dec_table_data.append([
            Paragraph(f"<b>{row[0]}</b>", table_cell_style),
            Paragraph(row[1], table_cell_style),
            Paragraph(row[2], table_cell_style),
            Paragraph(row[3], table_cell_style),
            Paragraph(row[4], table_cell_style),
        ])
    t_dec = Table(dec_table_data, colWidths=[105, 125, 110, 110, 54])
    t_dec.setStyle(TableStyle([
        ("LINEABOVE", (0, 0), (-1, 0), 1, colors.black),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.black),
        ("LINEBELOW", (0, -1), (-1, -1), 1, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
    ]))
    story.append(t_dec)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Project Scope Changes", h1_style))
    story.append(Paragraph(
        "• <b>Phase 3 Scope Baseline:</b> Officially Closed & Signed Off. Milestone 3 deliverables (scoring model, reasoning engine, "
        "LLM guardrails, and 102-scenario E2E test harness) are 100% merged on main.<br/>"
        "• <b>Fairness Audit & Model Diagnostics Pulled Forward:</b> Algorithmic bias audit and calibration diagnostics originally scheduled for "
        "Phase 6 were completed during Cycle 4 (+30 days buffer for final presentation).",
        body_style
    ))

    story.append(PageBreak())

    # ── Page 5: Upcoming Work & Team Member Contributions ──────────────────
    story.append(Paragraph("Upcoming Work (Next Two Weeks’ Plan – Cycle 5 / Weeks 9–10)", h1_style))
    story.append(Paragraph(
        "• <b>Phase 4 Client Application Integration:</b> Connect React Web Console and React Native Mobile App to live REST API endpoints (Rohit & Mayank).<br/>"
        "• <b>Dynamic Role-Based Access Control (RBAC):</b> Implement JWT persona tokens for Card Member, Merchant, and Dispute-Ops Admin (Darshan & Nirav).<br/>"
        "• <b>Real Evidence Attachment & Upload Ingestion:</b> Implement multi-part binary file uploads (PDF/PNG/TXT) with SHA-256 integrity digests (Achyut & Darshan).<br/>"
        "• <b>Full Containerization with Docker Compose:</b> Build production-ready Docker containers for FastAPI backend and Vite web console (Hardik).<br/>"
        "• <b>Continuous Fairness Monitoring:</b> Embed automated fairness audit checks into GitHub Actions CI pipeline (Akshay & Hardik).",
        body_style
    ))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Team Member Contributions", h1_style))

    # Akshay Purohit (Highlighting ML Engineer tasks)
    story.append(Paragraph("<b>Name: Akshay Purohit (202512033)</b>", h2_style))
    story.append(Paragraph("<b>Role: ML Engineer – Fair-Weighing Model & Transparent Reasoning</b>", body_style))
    story.append(Paragraph(
        "<b>Tasks Completed:</b> Built and integrated <code>TransparentReasoningEngine</code> (engine.py) with Google Gemini 2.0 Flash XAI "
        "and deterministic safe fallback; developed <code>HallucinationGuardrail</code> (guardrails.py) enforcing PII redaction, settlement "
        "protection, and formula secrecy; resolved FR-17 defect by recalibrating missing-primary penalty from -15 to -20 points; "
        "authored <code>test_reasoning_guardrails.py</code> (10/10 tests passing); built production-grade <code>FairnessAuditEngine</code> "
        "(verifying EEOC 4/5ths Rule DIR ≥ 0.80 and 100% counterfactual invariance); developed <code>ModelDiagnosticsEngine</code> "
        "with Shapley-style evidence attribution and calibration evaluation; authored unit test suites (<code>test_ml_fairness_audit.py</code>, "
        "<code>test_ml_diagnostics.py</code>); merged PR #8 (commit d0bf6cd / 164da7f).<br/>"
        "<b>Tasks In Progress:</b> Continuous fairness monitoring in CI and production calibration tuning.<br/>"
        "<b>Contribution Type:</b> ML Engineering / Algorithm Design / Safety & Guardrails / Testing / Documentation<br/>"
        "<b>Hours / Capacity:</b> 54 / 70 hrs logged this cycle (Cumulative: 190 / 205 hrs).<br/>"
        "<b>Evidence:</b> Git commits d0bf6cd, 164da7f; backend/app/services/reasoning_layer/; akshay_ml_fairweighing/phase4_fairness_audit/; "
        "akshay_ml_fairweighing/phase5_diagnostics/; 41 passing ML & reasoning tests.",
        body_style
    ))
    story.append(Spacer(1, 6))

    # Nirav Kachhiya
    story.append(Paragraph("<b>Name: Nirav Kachhiya (202512011)</b>", h2_style))
    story.append(Paragraph("<b>Role: Project Lead / Backend Engineer</b>", body_style))
    story.append(Paragraph(
        "<b>Tasks Completed:</b> Integrated Transparent Reasoning Engine with CaseService; implemented Merkle audit trail inclusion proofs; "
        "reviewed and merged PR #6, #7, and #8; coordinated Milestone 3 sign-off; authored system architecture and database design updates.<br/>"
        "<b>Hours / Capacity:</b> 50 / 70 hrs logged this cycle (Cumulative: 196 / 210 hrs).<br/>"
        "<b>Evidence:</b> Git commits 164da7f, 3d2d3eb; system_architecture.md; database_design.md.",
        body_style
    ))
    story.append(Spacer(1, 6))

    # Darshan Prajapati
    story.append(Paragraph("<b>Name: Darshan Prajapati (202512026)</b>", h2_style))
    story.append(Paragraph("<b>Role: Backend Engineer – Reasoning & APIs</b>", body_style))
    story.append(Paragraph(
        "<b>Tasks Completed:</b> Implemented Phase 3 reasoning layer REST API endpoints (/api/v1/reasoning/explain, /audit-guardrails, /capabilities); "
        "authored 12 passing unit & integration tests in test_reasoning_api.py; prepared PR #9 (commit 968a234 / 3d2d3eb).<br/>"
        "<b>Hours / Capacity:</b> 46 / 70 hrs logged this cycle (Cumulative: 160 / 200 hrs).<br/>"
        "<b>Evidence:</b> backend/app/api/v1/reasoning.py; backend/tests/test_reasoning_api.py.",
        body_style
    ))
    story.append(Spacer(1, 6))

    # Achyut Pathak
    story.append(Paragraph("<b>Name: Achyut Pathak (202512039)</b>", h2_style))
    story.append(Paragraph("<b>Role: AI/NLP Engineer – Evidence Parsing</b>", body_style))
    story.append(Paragraph(
        "<b>Tasks Completed:</b> Built evidence highlight summarizer feeding structured evidence extracts to reasoning layer; "
        "integrated parser dispatcher into dispute upload pipeline; prepared PR #11.<br/>"
        "<b>Hours / Capacity:</b> 42 / 70 hrs logged this cycle (Cumulative: 154 / 208 hrs).<br/>"
        "<b>Evidence:</b> backend/app/services/parsers/; test_evidence_summarizer.py.",
        body_style
    ))

    story.append(PageBreak())

    # ── Page 6: Remaining Team Members ─────────────────────────────────────
    # Rohit Peswani
    story.append(Paragraph("<b>Name: Rohit Peswani (202512115)</b>", h2_style))
    story.append(Paragraph("<b>Role: Frontend Engineer – Web (Admin/Merchant)</b>", body_style))
    story.append(Paragraph(
        "<b>Tasks Completed:</b> Completed React web console scaffold with Vite and TailwindCSS (PR #6); implemented dispute queue table, "
        "evidence preview modal, and review dashboard; began connecting REST API endpoints with toast notifications (PR #10).<br/>"
        "<b>Hours / Capacity:</b> 48 / 70 hrs logged this cycle (Cumulative: 136 / 204 hrs).<br/>"
        "<b>Evidence:</b> web-app/ codebase; Git commit 922ff0b, beebc6e.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # Mayank Jayswal
    story.append(Paragraph("<b>Name: Mayank Jayswal (202512093)</b>", h2_style))
    story.append(Paragraph("<b>Role: Mobile Engineer – Card Member App</b>", body_style))
    story.append(Paragraph(
        "<b>Tasks Completed:</b> Completed React Native Expo mobile application scaffolding (PR #4, 32 TypeScript source files); "
        "built bottom tab navigation, dispute submission flows, and evidence capture screens; initiated Phase 4 API integration.<br/>"
        "<b>Hours / Capacity:</b> 46 / 70 hrs logged this cycle (Cumulative: 144 / 200 hrs).<br/>"
        "<b>Evidence:</b> mobile-app/ codebase; Git commit b0b4afd.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # Hardik Kansara
    story.append(Paragraph("<b>Name: Hardik Kansara (202512036)</b>", h2_style))
    story.append(Paragraph("<b>Role: Cloud/DevOps & QA Engineer</b>", body_style))
    story.append(Paragraph(
        "<b>Tasks Completed:</b> Developed Milestone 3 End-to-End automated test harness (test_e2e_milestone3.py) covering 102 synthetic "
        "chargeback scenarios; filed and verified closure of FR-17 defect; configured CI/CD build workflows; authored test harness documentation.<br/>"
        "<b>Hours / Capacity:</b> 50 / 70 hrs logged this cycle (Cumulative: 154 / 203 hrs).<br/>"
        "<b>Evidence:</b> backend/tests/test_e2e_milestone3.py; backend/tests/README.md; Git commit 0ef9303, f1e2276.",
        body_style
    ))

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Report #4 PDF generated successfully: {filename} (Size: {os.path.getsize(filename)} bytes)")


if __name__ == "__main__":
    build_pdf()

