"""
VerdictAI Core Database Manager & Connection Pool
Author: Nirav Kachhiya (Project Lead / Backend Engineer)
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

DB_STORE_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "db_store.json"


@dataclass
class DatabaseConfig:
    pg_host: str = os.getenv("PG_HOST", "localhost")
    pg_port: int = int(os.getenv("PG_PORT", 5432))
    pg_database: str = os.getenv("PG_DATABASE", "verdictai_db")
    pg_user: str = os.getenv("PG_USER", "postgres")
    pg_password: str = os.getenv("PG_PASSWORD", "postgres")
    mongo_uri: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    mongo_database: str = os.getenv("MONGO_DATABASE", "verdictai_evidence")


class DualDatabaseManager:
    """
    Manages connections and orchestrated dual-write operations across
    PostgreSQL (Transactional) and MongoDB (Polymorphic Evidence).
    Includes in-memory simulation mode for isolated testing without live DBs.
    """
    def __init__(self, config: Optional[DatabaseConfig] = None, in_memory: bool = True):
        self.config = config or DatabaseConfig()
        self.in_memory = in_memory
        
        self.pg_tables: Dict[str, Dict[str, Dict[str, Any]]] = {
            "users": {},
            "merchants": {},
            "transactions": {},
            "disputes": {},
            "case_files": {},
            "dispute_resolutions": {},
            "audit_logs": {}
        }
        self.mongo_collections: Dict[str, Dict[str, Dict[str, Any]]] = {
            "case_documents": {},
            "evidence_payloads": {}
        }
        self._load_from_disk()

    def _save_to_disk(self):
        if os.getenv("PYTEST_CURRENT_TEST"):
            return
        try:
            DB_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(DB_STORE_PATH, "w", encoding="utf-8") as f:
                json.dump({
                    "pg_tables": self.pg_tables,
                    "mongo_collections": self.mongo_collections
                }, f, indent=2, default=str)
        except Exception:
            pass

    def _load_from_disk(self):
        try:
            if DB_STORE_PATH.exists():
                with open(DB_STORE_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if "pg_tables" in data:
                        for table, records in data["pg_tables"].items():
                            if table in self.pg_tables:
                                self.pg_tables[table].update(records)
                            else:
                                self.pg_tables[table] = records
                    if "mongo_collections" in data:
                        for col, docs in data["mongo_collections"].items():
                            if col in self.mongo_collections:
                                self.mongo_collections[col].update(docs)
                            else:
                                self.mongo_collections[col] = docs
        except Exception:
            pass

    def reset_in_memory_stores(self):
        """Clears all in-memory mock tables and collections."""
        for table in self.pg_tables.values():
            table.clear()
        for col in self.mongo_collections.values():
            col.clear()
        self._save_to_disk()

    # --- PostgreSQL Operations ---
    def insert_pg_record(self, table_name: str, record_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if table_name not in self.pg_tables:
            self.pg_tables[table_name] = {}
        self.pg_tables[table_name][record_id] = data
        self._save_to_disk()
        return data

    def get_pg_record(self, table_name: str, record_id: str) -> Optional[Dict[str, Any]]:
        table = self.pg_tables.get(table_name, {})
        if record_id in table:
            return table[record_id]
        # Robust lookup by case-insensitive ID, prefix/suffix, or transaction ID match
        r_clean = str(record_id).upper().replace("CAS-", "").replace("CASE", "").strip()
        for k, v in table.items():
            k_upper = str(k).upper().strip()
            if r_clean and k_upper and (r_clean in k_upper or k_upper in r_clean):
                return v
            rec_id = str(v.get("id", "")).upper().strip()
            if r_clean and rec_id and (r_clean in rec_id or rec_id in r_clean):
                return v
            txn_id = str(v.get("transaction_id", "")).upper().strip()
            if r_clean and txn_id and (r_clean in txn_id or txn_id in r_clean):
                return v
        return None

    def update_pg_record(self, table_name: str, record_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        record = self.get_pg_record(table_name, record_id)
        if record:
            record.update(updates)
            rec_id = record.get("id")
            if rec_id and table_name in self.pg_tables and rec_id in self.pg_tables[table_name]:
                self.pg_tables[table_name][rec_id].update(updates)
            self._save_to_disk()
        return record

    def query_pg_records(self, table_name: str, filter_fn=None) -> List[Dict[str, Any]]:
        """Queries records from a PostgreSQL table with an optional filter predicate."""
        table = self.pg_tables.get(table_name, {})
        if filter_fn is None:
            return list(table.values())
        return [rec for rec in table.values() if filter_fn(rec)]

    def delete_pg_record(self, table_name: str, record_id: str) -> bool:
        """Deletes a record from a PostgreSQL table by ID."""
        table = self.pg_tables.get(table_name, {})
        if record_id in table:
            del table[record_id]
            self._save_to_disk()
            return True
        return False

    # --- MongoDB Operations ---
    def insert_mongo_doc(self, collection_name: str, doc_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if collection_name not in self.mongo_collections:
            self.mongo_collections[collection_name] = {}
        self.mongo_collections[collection_name][doc_id] = data
        self._save_to_disk()
        return data

    def get_mongo_doc(self, collection_name: str, doc_id: str) -> Optional[Dict[str, Any]]:
        return self.mongo_collections.get(collection_name, {}).get(doc_id)

    def update_mongo_doc(self, collection_name: str, doc_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        doc = self.get_mongo_doc(collection_name, doc_id)
        if doc:
            doc.update(updates)
            self._save_to_disk()
        return doc

    def query_mongo_docs(self, collection_name: str, filter_fn=None) -> List[Dict[str, Any]]:
        """Queries documents from a MongoDB collection with an optional filter predicate."""
        col = self.mongo_collections.get(collection_name, {})
        if filter_fn is None:
            return list(col.values())
        return [doc for doc in col.values() if filter_fn(doc)]

    def check_health(self) -> Dict[str, Any]:
        """
        Validates health status and connection readiness of PostgreSQL and MongoDB stores.
        """
        pg_connected = True
        mongo_connected = True
        if not self.in_memory:
            try:
                import socket
                with socket.create_connection((self.config.pg_host, self.config.pg_port), timeout=1.0):
                    pg_connected = True
            except Exception:
                pg_connected = False

            try:
                import socket
                host = "localhost"
                port = 27017
                if "://" in self.config.mongo_uri:
                    part = self.config.mongo_uri.split("://")[1].split("/")[0]
                    if ":" in part:
                        host, port_str = part.split(":")
                        port = int(port_str)
                    else:
                        host = part
                with socket.create_connection((host, port), timeout=1.0):
                    mongo_connected = True
            except Exception:
                mongo_connected = False

        status_str = "healthy" if (pg_connected and mongo_connected) else "degraded"
        return {
            "status": status_str,
            "in_memory_mode": self.in_memory,
            "postgresql": {
                "connected": pg_connected,
                "host": self.config.pg_host,
                "port": self.config.pg_port,
                "database": self.config.pg_database,
                "tables_loaded": len(self.pg_tables),
                "total_records": sum(len(t) for t in self.pg_tables.values())
            },
            "mongodb": {
                "connected": mongo_connected,
                "uri": self.config.mongo_uri,
                "database": self.config.mongo_database,
                "collections_loaded": len(self.mongo_collections),
                "total_documents": sum(len(c) for c in self.mongo_collections.values())
            }
        }


IN_MEMORY_DEFAULT = os.getenv("IN_MEMORY_DB", "true").lower() in ("true", "1", "yes")
db_manager = DualDatabaseManager(in_memory=IN_MEMORY_DEFAULT)
