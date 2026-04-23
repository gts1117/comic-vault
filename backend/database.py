import sqlite3
import os
import threading
from pathlib import Path
from logger import get_logger

# Thread-local storage to keep one SQLite connection per thread 
# (SQLite in python restricts connections across threads by default unless check_same_thread=False)
local_storage = threading.local()
logger = get_logger("vault.db")

class DatabaseManager:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._ensure_db_dir()

    def _ensure_db_dir(self):
        db_dir = os.path.dirname(self.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)

    def get_connection(self) -> sqlite3.Connection:
        """Get a thread-local SQLite connection with ROW factory enabled."""
        if not hasattr(local_storage, "connection"):
            conn = sqlite3.connect(
                self.db_path, 
                check_same_thread=False,
                timeout=10.0 # Wait 10s if db is locked before throwing
            )
            conn.row_factory = sqlite3.Row
            # Enable Write-Ahead Logging for better concurrency
            conn.execute('PRAGMA journal_mode=WAL;')
            conn.execute('PRAGMA foreign_keys=ON;')
            local_storage.connection = conn
            
        return local_storage.connection

    def close_all(self):
        """Close connection on the current thread."""
        if hasattr(local_storage, "connection"):
            local_storage.connection.close()
            del local_storage.connection

    def apply_schema(self, schema_file: str):
        """Applies the base schema.sql to the database if tables are missing."""
        if not os.path.exists(schema_file):
            raise FileNotFoundError(f"Schema file not found: {schema_file}")
            
        with open(schema_file, 'r', encoding='utf-8') as f:
            sql_script = f.read()

        conn = self.get_connection()
        try:
            conn.executescript(sql_script)
            conn.commit()
        except sqlite3.Error as e:
            logger.error(f"Error applying schema: {e}")
            conn.rollback()

    # Helpers
    def fetch_one(self, query: str, parameters=()):
        c = self.get_connection().cursor()
        c.execute(query, parameters)
        return c.fetchone()

    def fetch_all(self, query: str, parameters=()):
        c = self.get_connection().cursor()
        c.execute(query, parameters)
        return c.fetchall()

    def execute(self, query: str, parameters=()):
        conn = self.get_connection()
        c = conn.cursor()
        c.execute(query, parameters)
        conn.commit()
        return c.lastrowid
