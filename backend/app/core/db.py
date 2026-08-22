"""
VerdictAI Core Database Manager & Connection Pool
Author: Nirav Kachhiya (Project Lead / Backend Engineer)
"""

import os
from typing import Dict, Any, Optional
from dataclasses import dataclass


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

    def reset_in_memory_stores(self):
        """Clears all in-memory mock tables and collections."""
        for table in self.pg_tables.values():
            table.clear()
        for col in self.mongo_collections.values():
            col.clear()

    # --- PostgreSQL Operations ---
    def insert_pg_record(self, table_name: str, record_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if table_name not in self.pg_tables:
            self.pg_tables[table_name] = {}
        self.pg_tables[table_name][record_id] = data
        return data

    def get_pg_record(self, table_name: str, record_id: str) -> Optional[Dict[str, Any]]:
        return self.pg_tables.get(table_name, {}).get(record_id)

    def update_pg_record(self, table_name: str, record_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        record = self.get_pg_record(table_name, record_id)
        if record:
            record.update(updates)
        return record

    # --- MongoDB Operations ---
    def insert_mongo_doc(self, collection_name: str, doc_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if collection_name not in self.mongo_collections:
            self.mongo_collections[collection_name] = {}
        self.mongo_collections[collection_name][doc_id] = data
        return data

    def get_mongo_doc(self, collection_name: str, doc_id: str) -> Optional[Dict[str, Any]]:
        return self.mongo_collections.get(collection_name, {}).get(doc_id)

    def update_mongo_doc(self, collection_name: str, doc_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        doc = self.get_mongo_doc(collection_name, doc_id)
        if doc:
            doc.update(updates)
        return doc


db_manager = DualDatabaseManager(in_memory=True)
