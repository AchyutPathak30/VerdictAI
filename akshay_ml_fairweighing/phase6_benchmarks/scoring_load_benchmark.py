"""
VerdictAI Fair-Weighing ML Model - High-Concurrency Load & Throughput Benchmark
Project: Frictionless Dispute & Chargeback Resolution (VerdictAI)
Author: Akshay Purohit (202512033) - ML Engineer (Fair-Weighing Model)
Collaborator: Hardik Kansara (DevOps & QA Engineer)
Phase: Phase 5 & Phase 6 - End-to-End System Benchmark & Load Testing
Deliverable: Bi-Weekly Status Report #5 Deliverable (500+ Concurrent Evaluations, Sub-50ms SLA)
Coverage: SRS FR-15, SIR-07, NFR-02, NFR-14
"""

import time
import math
import statistics
import concurrent.futures
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Tuple

from akshay_ml_fairweighing.phase3_model.fair_weighing_model import FairWeighingModel


@dataclass
class BenchmarkMetrics:
    total_evaluations: int
    concurrency_workers: int
    total_duration_seconds: float
    throughput_disputes_per_sec: float
    latency_avg_ms: float
    latency_p50_ms: float
    latency_p95_ms: float
    latency_p99_ms: float
    latency_min_ms: float
    latency_max_ms: float
    sla_target_ms: float
    sub_50ms_sla_met: bool
    error_count: int
    success_rate: float
    deterministic_consistency_passed: bool


class ScoringLoadBenchmark:
    """
    Enterprise benchmarking suite simulating high-volume dispute spikes (e.g., flash sales, holiday rushes)
    to validate model scalability, latency distribution, and thread-safety under heavy concurrency.
    """

    SLA_LATENCY_CEILING_MS = 50.0  # Target P95 inference latency per SRS SIR-07 / NFR-02

    def __init__(self, model: Optional[FairWeighingModel] = None):
        self.model = model or FairWeighingModel()

    @staticmethod
    def generate_benchmark_workload(count: int = 500) -> List[Dict[str, Any]]:
        """
        Generates diverse synthetic dispute payloads distributed across all 6 categories
        with varied evidence items and amounts to stress-test scoring logic.
        """
        categories = [
            ("CAT-01", "Item Not Received", "EV-03"),
            ("CAT-02", "Item Not as Described / Defective", "EV-06"),
            ("CAT-03", "Unauthorized Transaction", "EV-08"),
            ("CAT-04", "Duplicate Charge", "EV-01_DUP"),
            ("CAT-05", "Cancelled Subscription", "EV-07"),
            ("CAT-06", "Incorrect Amount Charged", "EV-07"),
        ]

        workload = []
        for i in range(count):
            cat_id, cat_name, primary_ev = categories[i % len(categories)]
            amount = round(150.0 + (i * 37.5) % 15000.0, 2)
            has_primary = (i % 7 != 0)  # 1 in 7 cases has missing primary evidence (testing FR-17)

            evidence_items = [
                {
                    "evidence_id": "EV-01",
                    "evidence_type": "Transaction Record",
                    "status": "Present",
                    "quality_score": 0.95,
                    "favours": "NEUTRAL"
                },
                {
                    "evidence_id": "EV-02",
                    "evidence_type": "Merchant Receipt",
                    "status": "Present",
                    "quality_score": 0.90,
                    "favours": "MERCHANT"
                }
            ]

            if has_primary:
                evidence_items.append({
                    "evidence_id": primary_ev,
                    "evidence_type": "Primary Evidence",
                    "status": "Present",
                    "quality_score": 0.95 if i % 2 == 0 else 0.70,
                    "favours": "MERCHANT" if i % 3 != 0 else "CARD_MEMBER"
                })
            else:
                evidence_items.append({
                    "evidence_id": primary_ev,
                    "evidence_type": "Primary Evidence",
                    "status": "Missing",
                    "quality_score": 0.0,
                    "favours": "CARD_MEMBER"
                })

            workload.append({
                "case_id": f"BENCH-{i:04d}",
                "dispute_category_id": cat_id,
                "dispute_category_name": cat_name,
                "amount": amount,
                "currency": "INR",
                "evidence_items": evidence_items
            })

        return workload

    def execute_concurrent_benchmark(
        self,
        num_cases: int = 500,
        max_workers: int = 10
    ) -> BenchmarkMetrics:
        """
        Executes multi-worker concurrent dispute evaluation workload and records performance metrics.
        """
        workload = self.generate_benchmark_workload(count=num_cases)
        latencies_ms: List[float] = []
        errors = 0
        predictions_map: Dict[str, Tuple[float, str]] = {}

        def evaluate_single_dispute(case: Dict[str, Any]) -> Tuple[str, float, float, str]:
            t0 = time.perf_counter()
            res = self.model.evaluate_case(case)
            latency_ms = (time.perf_counter() - t0) * 1000.0
            return (
                case["case_id"],
                latency_ms,
                res["confidence_score"],
                res["recommended_resolution"]
            )

        start_time = time.perf_counter()

        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_case = {
                executor.submit(evaluate_single_dispute, c): c["case_id"]
                for c in workload
            }
            for future in concurrent.futures.as_completed(future_to_case):
                try:
                    case_id, lat_ms, conf, outcome = future.result()
                    latencies_ms.append(lat_ms)
                    predictions_map[case_id] = (conf, outcome)
                except Exception as e:
                    errors += 1

        total_duration = time.perf_counter() - start_time
        throughput = len(latencies_ms) / total_duration if total_duration > 0 else 0.0

        latencies_sorted = sorted(latencies_ms)
        p50 = statistics.median(latencies_sorted) if latencies_sorted else 0.0
        p95 = latencies_sorted[int(len(latencies_sorted) * 0.95)] if latencies_sorted else 0.0
        p99 = latencies_sorted[int(len(latencies_sorted) * 0.99)] if latencies_sorted else 0.0
        avg_lat = statistics.mean(latencies_sorted) if latencies_sorted else 0.0
        min_lat = min(latencies_sorted) if latencies_sorted else 0.0
        max_lat = max(latencies_sorted) if latencies_sorted else 0.0

        # Verify thread-safety: Re-run a sample of 20 cases sequentially; outputs must be strictly identical
        consistency_passed = True
        for c in workload[:20]:
            cid = c["case_id"]
            seq_res = self.model.evaluate_case(c)
            if cid in predictions_map:
                concurrent_conf, concurrent_outcome = predictions_map[cid]
                if abs(seq_res["confidence_score"] - concurrent_conf) > 1e-4 or seq_res["recommended_resolution"] != concurrent_outcome:
                    consistency_passed = False
                    break

        success_rate = (len(latencies_ms) / num_cases) * 100.0 if num_cases > 0 else 0.0
        sub_50ms_met = (p95 <= self.SLA_LATENCY_CEILING_MS)

        return BenchmarkMetrics(
            total_evaluations=len(latencies_ms),
            concurrency_workers=max_workers,
            total_duration_seconds=round(total_duration, 4),
            throughput_disputes_per_sec=round(throughput, 2),
            latency_avg_ms=round(avg_lat, 3),
            latency_p50_ms=round(p50, 3),
            latency_p95_ms=round(p95, 3),
            latency_p99_ms=round(p99, 3),
            latency_min_ms=round(min_lat, 3),
            latency_max_ms=round(max_lat, 3),
            sla_target_ms=self.SLA_LATENCY_CEILING_MS,
            sub_50ms_sla_met=sub_50ms_met,
            error_count=errors,
            success_rate=round(success_rate, 2),
            deterministic_consistency_passed=consistency_passed
        )
