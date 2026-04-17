import uvicorn
import socket
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys

from contextlib import asynccontextmanager
from database import DatabaseManager
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "comic_vault.sqlite")
db = DatabaseManager(DB_PATH)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    print("Applying schema if not exists...", flush=True)
    db.apply_schema(schema_path)
    yield
    # Shutdown logic
    db.close_all()

app = FastAPI(title="Comic Vault Backend API", lifespan=lifespan)

# Allow CORS for Tauri frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Tauri webview origin could be various depending on platform
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping")
def ping():
    return {"status": "ok", "message": "Backend is alive!"}

@app.get("/api/db/stats")
def db_stats():
    """Verify database responsiveness by returning basic row counts"""
    try:
        series_count = db.fetch_one("SELECT COUNT(*) as count FROM series;")['count']
        comics_count = db.fetch_one("SELECT COUNT(*) as count FROM comics;")['count']
        return {
            "status": "ok",
            "counts": {
                "series": series_count,
                "comics": comics_count
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

from pydantic import BaseModel

class ImportRequest(BaseModel):
    source_dir: str

@app.post("/api/import")
def trigger_import(req: ImportRequest):
    import api_import
    # Run the worker synchronously for now (production would wrap in background task)
    results = api_import.scan_and_import(req.source_dir, db)
    return results

@app.get("/api/library")
def get_library():
    """Returns library tree"""
    try:
        # Just grab the top 100 for basic verification rendering
        rows = db.fetch_all('''
            SELECT c.id, c.title, c.issue_number, s.name as series_name, s.publisher
            FROM comics c
            JOIN series s ON c.series_id = s.id
            LIMIT 100
        ''')
        return [dict(r) for r in rows]
    except Exception as e:
        return {"status": "error", "message": str(e)}

def get_free_port():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('', 0))
    port = s.getsockname()[1]
    s.close()
    return port

if __name__ == "__main__":
    port = get_free_port()
    # Print the port to stdout so Tauri can capture it
    print(f"PORT={port}", flush=True)
    
    # Run user application
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="error")
