"""
VerdictAI Fair-Weighing ML High-Concurrency Benchmark & Optimization Test Suite
Author: Akshay Purohit (202512033) - ML Engineer (Fair-Weighing Model)
Collaborator: Hardik Kansara (DevOps & QA Engineer)
Phase: Phase 5 & Phase 6 - Load Testing, Throughput Benchmarking & Model Governance
Coverage: Bi-Weekly Status Report #5 Deliverable (500+ disputes, sub-50ms SLA, NFR-02, NFR-14)
"""

import json
import os
import pytest
from akshay_ml_fairweighing.phase6_benchmarks.scoring_load_benchmark import (
    ScoringLoadBenchmark,
    BenchmarkMetrics,
)
from akshay_ml_fairweighing.phase6_benchmarks.optimized_scoring_service import (
    OptimizedFairWeighingService,
    CacheStatistics,
)
from akshay_ml_fairweighing.phase6_continuous_eval.model_drift_monitor import (
    ModelDriftMonitor,
    DriftReport,
)
from akshay_ml_fairweighing.phase3_model.fair_weighing_model import FairWeighingModel


@pytest.fixture
def benchmark_engine():
    return ScoringLoadBenchmark()


@pytest.fixture
def optimized_service():
    return OptimizedFairWeighingService(max_cache_size=100)


@pytest.fixture
def drift_monitor():
    return ModelDriftMonitor()


@pytest.fixture
def benchmark_dataset():
    data_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "akshay_ml_fairweighing",
        "phase2_mockdata",
        "mock_disputes_dataset.json"
    )
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)["cases"]


# ─── 1. Report #5 High-Concurrency Benchmark (500+ Disputes, Sub-50ms SLA) ────

def test_concurrent_scoring_500_disputes_throughput(benchmark_engine):
    """
    Bi-Weekly Report #5 Deliverable:
    Simulates 500 simultaneous dispute evaluations across 10 concurrent thread workers.
    Verifies that 100% of disputes evaluate with 0 errors and P95 latency is sub-50ms.
    """
    metrics: BenchmarkMetrics = benchmark_engine.execute_concurrent_benchmark(
        num_cases=500,
        max_workers=10
    )

    assert metrics.total_evaluations == 500
    assert metrics.error_count == 0
    assert metrics.success_rate == 100.0
    assert metrics.latency_p95_ms < 50.0  # Sub-50ms SLA requirement
    assert metrics.sub_50ms_sla_met is True
    assert metrics.deterministic_consistency_passed is True
    assert metrics.throughput_disputes_per_sec > 100.0  # Enterprise throughput > 100 ops/sec


# ─── 2. LRU Evidence Fingerprint Caching & Acceleration ───────────────────────

def test_optimized_scoring_service_lru_caching(optimized_service, benchmark_dataset):
    """
    Verifies that the canonical SHA-256 evidence caching layer delivers sub-millisecond
    evaluations for recurring dispute evidence patterns.
    """
    test_case = benchmark_dataset[0]

    # First call: Cache miss
    res1, hit1, lat1 = optimized_service.evaluate_case_optimized(test_case)
    assert hit1 is False

    # Second call: Cache hit
    res2, hit2, lat2 = optimized_service.evaluate_case_optimized(test_case)
    assert hit2 is True
    assert lat2 < 2.0  # Sub-2ms cached retrieval
    assert res1["confidence_score"] == res2["confidence_score"]
    assert res1["recommended_resolution"] == res2["recommended_resolution"]

    stats: CacheStatistics = optimized_service.get_cache_statistics()
    assert stats.total_requests == 2
    assert stats.cache_hits == 1
    assert stats.cache_misses == 1
    assert stats.hit_ratio_percentage == 50.0
    assert stats.current_cache_size == 1


# ─── 3. Population Stability Index (PSI) Drift Calculation ─────────────────────

def test_population_stability_index_drift_detection(drift_monitor):
    """
    Verifies PSI accurately flags distribution stability vs. severe population shift.
    """
    baseline = {"CARD_MEMBER_FAVOUR": 0.50, "MERCHANT_FAVOUR": 0.40, "ESCALATE": 0.10}

    # Case A: Identical distribution -> PSI ~ 0.0
    psi_stable = drift_monitor.calculate_psi(baseline, baseline)
    assert psi_stable < 0.01

    # Case B: Severe distribution shift -> PSI >= 0.25 (Triggers Alert)
    shifted = {"CARD_MEMBER_FAVOUR": 0.10, "MERCHANT_FAVOUR": 0.85, "ESCALATE": 0.05}
    psi_drift = drift_monitor.calculate_psi(baseline, shifted)
    assert psi_drift >= 0.25


# ─── 4. Continuous Model Evaluation & NFR-14 Bounds ────────────────────────────

def test_model_drift_monitoring_on_benchmark_dataset(drift_monitor, benchmark_dataset):
    """
    Verifies continuous monitoring report confirms NFR-14 compliance (FPR < 5%)
    and stability across the 56 synthetic dispute benchmark cases.
    """
    report: DriftReport = drift_monitor.evaluate_batch_drift(benchmark_dataset)

    assert report.total_evaluations == len(benchmark_dataset)
    assert report.fpr_compliant_nfr14 is True
    assert report.false_positive_rate <= 0.05
    assert len(report.category_win_rates) >= 4


# ─── 5. Thread-Safety & Invariance Under Multi-Worker Concurrency ──────────────

def test_thread_safety_under_extreme_concurrency(benchmark_dataset):
    """
    Tests 20 worker threads evaluating the exact same case simultaneously.
    Asserts zero race conditions and 100% identical outputs across all threads.
    """
    import concurrent.futures
    model = FairWeighingModel()
    case = benchmark_dataset[1]

    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = [executor.submit(model.evaluate_case, case) for _ in range(50)]
        for f in concurrent.futures.as_completed(futures):
            results.append(f.result())

    first_conf = results[0]["confidence_score"]
    first_res = results[0]["recommended_resolution"]

    for r in results:
        assert r["confidence_score"] == first_conf
        assert r["recommended_resolution"] == first_res
