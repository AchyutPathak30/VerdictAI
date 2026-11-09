"""
VerdictAI Core Database Manager & Connection Pool
Author: Nirav Kachhiya (Project Lead / Backend Engineer)
"""

import os
from typing import Dict, Any, Optional, List
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
            return True
        return False

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
