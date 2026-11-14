"""
R-05 regression: in-memory store survives a restart when DB_PERSIST_PATH is set.
Author: Hardik Kansara (202512036) - Cloud/DevOps & QA Engineer
"""

from backend.app.core.db import DualDatabaseManager


def test_snapshot_survives_fresh_manager(tmp_path):
    snap = tmp_path / "store.json"

    db1 = DualDatabaseManager(persist_path=str(snap))
    db1.insert_pg_record("disputes", "D1", {"amount": 500})
    db1.insert_mongo_doc("evidence_payloads", "E1", {"hash": "abc"})
    db1.update_pg_record("disputes", "D1", {"status": "RESOLVED"})

    # Simulate a container restart: brand-new manager, same snapshot file.
    db2 = DualDatabaseManager(persist_path=str(snap))
    assert db2.get_pg_record("disputes", "D1") == {"amount": 500, "status": "RESOLVED"}
    assert db2.get_mongo_doc("evidence_payloads", "E1") == {"hash": "abc"}


def test_no_persist_path_writes_nothing(tmp_path):
    db = DualDatabaseManager(persist_path=None)
    db.insert_pg_record("disputes", "D1", {"amount": 1})
    assert not list(tmp_path.iterdir())


def test_corrupt_snapshot_boots_empty(tmp_path):
    snap = tmp_path / "store.json"
    snap.write_text("{ not json")
    db = DualDatabaseManager(persist_path=str(snap))
    assert db.get_pg_record("disputes", "D1") is None
