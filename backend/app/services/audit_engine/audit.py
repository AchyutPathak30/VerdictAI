"""
VerdictAI Cryptographic Audit Logging & State Integrity Engine
Author: Nirav Kachhiya (Project Lead / Backend Engineer)
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AuditLogEntry(BaseModel):
    log_id: str
    dispute_id: str
    performed_by: str
    action_type: str
    previous_state: Optional[Dict[str, Any]] = None
    new_state: Optional[Dict[str, Any]] = None
    state_delta: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=utc_now)
    previous_log_hash: Optional[str] = None
    cryptographic_hash: str = ""


class AuditEngine:
    """
    Implements tamper-evident hash chaining for all dispute transitions and modifications.
    Every event generates a cryptographic digest linking back to the prior entry.
    """
    def __init__(self):
        self._chain_store: Dict[str, List[AuditLogEntry]] = {}

    def log_event(
        self,
        dispute_id: str,
        performed_by: str,
        action_type: str,
        previous_state: Optional[Dict[str, Any]] = None,
        new_state: Optional[Dict[str, Any]] = None,
        state_delta: Optional[Dict[str, Any]] = None
    ) -> AuditLogEntry:
        if dispute_id not in self._chain_store:
            self._chain_store[dispute_id] = []

        history = self._chain_store[dispute_id]
        previous_hash = history[-1].cryptographic_hash if history else "GENESIS_ROOT_HASH"

        log_id = f"aud_{dispute_id[:8]}_{len(history) + 1}_{int(utc_now().timestamp())}"
        
        payload_to_hash = {
            "log_id": log_id,
            "dispute_id": dispute_id,
            "performed_by": performed_by,
            "action_type": action_type,
            "previous_state": previous_state,
            "new_state": new_state,
            "state_delta": state_delta,
            "previous_hash": previous_hash
        }
        serialized = json.dumps(payload_to_hash, sort_keys=True, default=str).encode("utf-8")
        current_hash = hashlib.sha256(serialized).hexdigest()

        entry = AuditLogEntry(
            log_id=log_id,
            dispute_id=dispute_id,
            performed_by=performed_by,
            action_type=action_type,
            previous_state=previous_state,
            new_state=new_state,
            state_delta=state_delta,
            previous_log_hash=previous_hash,
            cryptographic_hash=current_hash
        )

        history.append(entry)
        return entry

    def verify_integrity(self, dispute_id: str) -> bool:
        """
        Validates whether the audit trail for a given dispute has suffered tampering.
        """
        history = self._chain_store.get(dispute_id, [])
        if not history:
            return True

        expected_prev_hash = "GENESIS_ROOT_HASH"
        for entry in history:
            if entry.previous_log_hash != expected_prev_hash:
                return False
            
            payload_to_hash = {
                "log_id": entry.log_id,
                "dispute_id": entry.dispute_id,
                "performed_by": entry.performed_by,
                "action_type": entry.action_type,
                "previous_state": entry.previous_state,
                "new_state": entry.new_state,
                "state_delta": entry.state_delta,
                "previous_hash": expected_prev_hash
            }
            serialized = json.dumps(payload_to_hash, sort_keys=True, default=str).encode("utf-8")
            calculated_hash = hashlib.sha256(serialized).hexdigest()

            if calculated_hash != entry.cryptographic_hash:
                return False

            expected_prev_hash = entry.cryptographic_hash

        return True

    def get_audit_trail(self, dispute_id: str) -> List[AuditLogEntry]:
        return self._chain_store.get(dispute_id, [])


audit_engine = AuditEngine()
