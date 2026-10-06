# Evidence-Scoring Algorithm Design Document
**Project:** Frictionless Dispute & Chargeback Resolution  
**Author:** Akshay Purohit (202512033) — ML Engineer – Fair-Weighing Model  
**Phase:** Phase 3 – Fair-Weighing Model  
**Date:** September 16, 2026

---

## 1. Executive Summary

This document specifies the algorithmic architecture of the Fair-Weighing Model. The model operates as a **hybrid deterministic-LLM engine**:
1. **Mathematical Scoring Layer (Deterministic):** Evaluates quantitative evidence weights, quality scores, and category matrices to produce normalized confidence scores and side attributions.
2. **Reasoning & Explanation Layer (Google Gemini API):** Consumes structured scoring factors and generates plain-language, transparent explanations for Card Members, Merchants, and Dispute Analysts without revealing raw internal formulas.

---

## 2. System Architecture

```
                    ┌───────────────────────────────┐
                    │ Parsed Case File JSON         │
                    │ (Achyut/Nirav Ingestion API)  │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  1. Deterministic Math Engine │
                    │  - Base Reliability S(e_i)    │
                    │  - Category Weight W(e_i, cat)│
                    │  - Quality Q(e_i) & Status    │
                    └───────────────┬───────────────┘
                                    │
                         Calculates Raw Scores
                         & Confidence Score
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ 2. Outcome Classifier & Gate  │
                    │ - C >= 70  --> RESOLVED       │
                    │ - C < 50   --> ESCALATE       │
                    └───────────────┬───────────────┘
                                    │
                         Prepares Prompt Context
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  3. Google Gemini 2.0 Flash   │
                    │  - Plain-language summary     │
                    │  - 3+ contributing factors    │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  Final Scoring Result JSON    │
                    └───────────────────────────────┘
```

---

## 3. Mathematical Formula Specification

Given a case with evidence set $E = \{e_1, e_2, \dots, e_n\}$ and category $cat$:

### 3.1 Item Score $S_{effective}(e_i)$
$$S_{effective}(e_i) = S_{base}(e_i) \times W(e_i, cat) \times P(e_i) \times Q(e_i)$$

Where:
- $S_{base}(e_i) \in [0, 10]$ is intrinsic evidence reliability.
- $W(e_i, cat) \in [0, 1.0]$ is category weight.
- $P(e_i) \in \{0, 1\}$ indicates presence.
- $Q(e_i) \in [0.0, 1.0]$ is NLP extraction quality score.

### 3.2 Side Scores
$$\text{Score}_{CM} = \sum_{e_i \in E_{CM}} S_{effective}(e_i) + \frac{1}{2} \sum_{e_k \in E_{Neutral}} S_{effective}(e_k)$$
$$\text{Score}_{MR} = \sum_{e_j \in E_{MR}} S_{effective}(e_j) + \frac{1}{2} \sum_{e_k \in E_{Neutral}} S_{effective}(e_k)$$

### 3.3 Normalisation & Confidence
$$\text{Total} = \text{Score}_{CM} + \text{Score}_{MR}$$
$$\text{Norm}_{CM} = \frac{\text{Score}_{CM}}{\text{Total}} \times 100, \quad \text{Norm}_{MR} = \frac{\text{Score}_{MR}}{\text{Total}} \times 100$$
$$\text{Confidence Score } C = \max(\text{Norm}_{CM}, \text{Norm}_{MR})$$

### 3.4 Penalties & Floor Caps
- **Primary Evidence Missing Penalty:** $-20$ points to $C$ (calibrated from $-15$ to ensure statement-only claims in CAT-02 and CAT-05 escalate to `MANUAL_REVIEW_QUEUE` per SRS FR-17 and AC-09).
- **Low Confidence Threshold:** If $C < 50$, Recommendation = `ESCALATE`.


---

## 4. Google Gemini Prompt Design

The model passes sanitized evidence context to `gemini-2.0-flash` with strict constraints:

```text
You are an objective dispute resolution AI analyst for a financial transaction platform.
Analyze the following dispute case evidence summary:

Case Category: {category_name}
Card Member Score Contribution: {cm_score}%
Merchant Score Contribution: {mr_score}%
Calculated Confidence: {confidence_score}%
Recommended Resolution: {recommendation}

Key Evidence Factors Evaluated:
{factor_text_list}

Instructions:
1. Provide a concise, plain-language explanation (2-3 sentences) explaining why this decision was reached.
2. List at least 3 distinct contributing factors that led to this outcome.
3. Do NOT mention internal raw formulas or weights.
4. Maintain a neutral, professional tone.
```

---

## 5. Non-Functional Requirements Compliance

- **Latency (NFR-02):** Model P95 execution time $\le 30$ seconds (Deterministic engine $<10$ms + Gemini API $<3$s).
- **Explainability (NFR-13):** Every run records audit metrics including raw factors, weights, and LLM prompt/response.
- **Fairness (NFR-14):** Demographics and historical user counts are excluded. False Positive Rate targeted $\le 2\%$.
