"""
VerdictAI Optimized Fair-Weighing ML Service with Evidence Digest Caching
Project: Frictionless Dispute & Chargeback Resolution (VerdictAI)
Author: Akshay Purohit (202512033) - ML Engineer (Fair-Weighing Model)
Phase: Phase 5 & Phase 6 - High-Throughput Production Optimization
Coverage: SRS FR-15, SIR-07, NFR-02 (Sub-50ms SLA at 1000+ RPS)
"""

import time
import hashlib
import json
import threading
from collections import OrderedDict
from dataclasses import dataclass
from typing import Dict, Any, List, Optional, Tuple

from akshay_ml_fairweighing.phase3_model.fair_weighing_model import FairWeighingModel


@dataclass
class CacheStatistics:
    total_requests: int
    cache_hits: int
    cache_misses: int
    hit_ratio_percentage: float
    current_cache_size: int
    max_capacity: int
    estimated_time_saved_ms: float


class OptimizedFairWeighingService:
    """
    Production-grade high-throughput wrapper around FairWeighingModel incorporating
    canonical SHA-256 evidence signature caching for sub-millisecond evaluation of recurring dispute patterns.
    """

    def __init__(self, model: Optional[FairWeighingModel] = None, max_cache_size: int = 2048):
        self.model = model or FairWeighingModel()
        self.max_cache_size = max_cache_size
        self._cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self._lock = threading.Lock()
        
        # Performance metrics
        self._total_requests = 0
        self._hits = 0
        self._misses = 0
        self._time_saved_ms = 0.0

    @staticmethod
    def compute_evidence_fingerprint(case_data: Dict[str, Any]) -> str:
        """
        Computes a deterministic canonical SHA-256 hash of the dispute category
        and evidence items (type, status, quality, favours).
        """
        cat_id = case_data.get("dispute_category_id", "CAT-01")
        evidence_items = case_data.get("evidence_items", [])

        # Create sorted canonical representation
        normalized_items = []
        for it in evidence_items:
            normalized_items.append((
                it.get("evidence_id", ""),
                it.get("status", "Present"),
                round(float(it.get("quality_score", 1.0)), 3),
                it.get("favours", "NEUTRAL")
            ))
        normalized_items.sort()

        fingerprint_str = f"{cat_id}|{normalized_items}"
        return hashlib.sha256(fingerprint_str.encode("utf-8")).hexdigest()

    def evaluate_case_optimized(self, case_data: Dict[str, Any]) -> Tuple[Dict[str, Any], bool, float]:
        """
        Evaluates dispute case using canonical fingerprint cache.
        Returns (result, was_cache_hit, latency_ms).
        """
        t0 = time.perf_counter()
        fingerprint = self.compute_evidence_fingerprint(case_data)

        with self._lock:
            self._total_requests += 1
            if fingerprint in self._cache:
                # Move to end for LRU
                self._cache.move_to_end(fingerprint)
                cached_res = dict(self._cache[fingerprint])
                self._hits += 1
                latency_ms = (time.perf_counter() - t0) * 1000.0
                self._time_saved_ms += 1.5  # average model eval saved
                # Update case_id in cached result to match current query
                cached_res["case_id"] = case_data.get("case_id", cached_res.get("case_id"))
                return cached_res, True, latency_ms

            self._misses += 1

        # Cache miss: Execute raw ML evaluation
        eval_result = self.model.evaluate_case(case_data)

        with self._lock:
            # Store in LRU cache
            self._cache[fingerprint] = dict(eval_result)
            if len(self._cache) > self.max_cache_size:
                self._cache.popitem(last=False)  # Evict oldest entry

        latency_ms = (time.perf_counter() - t0) * 1000.0
        return eval_result, False, latency_ms

    def get_cache_statistics(self) -> CacheStatistics:
        """Returns thread-safe cache utilization metrics."""
        with self._lock:
            total = self._total_requests
            hits = self._hits
            hit_ratio = (hits / total * 100.0) if total > 0 else 0.0
            return CacheStatistics(
                total_requests=total,
                cache_hits=hits,
                cache_misses=self._misses,
                hit_ratio_percentage=round(hit_ratio, 2),
                current_cache_size=len(self._cache),
                max_capacity=self.max_cache_size,
                estimated_time_saved_ms=round(self._time_saved_ms, 2)
            )

    def clear_cache(self):
        """Clears LRU cache and resets counters."""
        with self._lock:
            self._cache.clear()
            self._total_requests = 0
            self._hits = 0
            self._misses = 0
            self._time_saved_ms = 0.0
