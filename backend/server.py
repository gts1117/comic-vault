import uvicorn
import socket
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys

from contextlib import asynccontextmanager
from database import DatabaseManager
import os

# When bundled by PyInstaller, resource files are in sys._MEIPASS.
# When running from source, they live next to this file.
if getattr(sys, 'frozen', False):
    # Bundled: schema/engine code is in the temp extraction dir
    BUNDLE_DIR = sys._MEIPASS
    # Database and thumbs should persist next to the actual binary, not in the temp dir
    RUNTIME_DIR = os.path.dirname(sys.executable)
else:
    BUNDLE_DIR = os.path.dirname(os.path.abspath(__file__))
    RUNTIME_DIR = BUNDLE_DIR

from logger import get_logger

DB_PATH = os.path.join(RUNTIME_DIR, "comic_vault.sqlite")
logger = get_logger("vault.server", RUNTIME_DIR)
db = DatabaseManager(DB_PATH)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    schema_path = os.path.join(BUNDLE_DIR, "schema.sql")
    logger.info(f"Applying schema from: {schema_path}")
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
            SELECT c.id, c.title, c.issue_number, s.name as series_name, s.publisher, f.file_path
            FROM comics c
            JOIN series s ON c.series_id = s.id
            JOIN files f ON f.comic_id = c.id
            ORDER BY s.publisher, s.name, c.issue_number
        ''')
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"Library fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/thumb/{comic_id}")
def get_thumb(comic_id: int):
    from fastapi.responses import FileResponse
    from fastapi import HTTPException
    import api_thumb
    
    thumb_path = api_thumb.get_thumbnail_path(comic_id, RUNTIME_DIR)
    if os.path.exists(thumb_path):
        return FileResponse(thumb_path)
        
    row = db.fetch_one("SELECT file_path, cover_page_index FROM files WHERE comic_id = ?", (comic_id,))
    if not row:
        raise HTTPException(status_code=404, detail="Comic file not mapped in DB")
        
    file_path = row['file_path']
    cover_idx = row['cover_page_index']
    
    success = api_thumb.extract_and_cache_thumbnail(file_path, thumb_path, cover_idx)
    
    if success and os.path.exists(thumb_path):
        return FileResponse(thumb_path)
    else:
        # If it's a CBR, it returns False. 422 triggers Frontend to show Convert Button.
        raise HTTPException(status_code=422, detail="Needs Conversion")

@app.get("/api/comic/{comic_id}/read")
def get_comic_read_status(comic_id: int):
    from fastapi import HTTPException
    import api_reader
    
    row = db.fetch_one('''
        SELECT c.current_page, c.read_status, f.file_path 
        FROM comics c
        JOIN files f ON f.comic_id = c.id
        WHERE c.id = ?
    ''', (comic_id,))
    
    if not row:
        raise HTTPException(status_code=404, detail="Comic not found")
        
    file_path = row['file_path']
    if file_path.lower().endswith(('.cbr', '.rar')):
        raise HTTPException(status_code=422, detail="Needs Conversion")
        
    meta = api_reader.get_comic_metadata(file_path)
    if "error" in meta:
        raise HTTPException(status_code=500, detail=meta["error"])
        
    return {
        "current_page": row['current_page'],
        "read_status": row['read_status'],
        "total_pages": meta['total_pages']
    }

@app.get("/api/comic/{comic_id}/page/{page_num}")
def get_comic_page(comic_id: int, page_num: int):
    from fastapi import HTTPException
    from fastapi.responses import Response
    import api_reader
    
    row = db.fetch_one("SELECT file_path FROM files WHERE comic_id = ?", (comic_id,))
    if not row:
        raise HTTPException(status_code=404, detail="File not found")
        
    file_path = row['file_path']
    result = api_reader.get_page_image_bytes(file_path, page_num)
    
    if not result:
        raise HTTPException(status_code=404, detail="Page not found or error extracting")
        
    img_data, content_type = result
    return Response(content=img_data, media_type=content_type)

class ProgressUpdate(BaseModel):
    current_page: int
    is_completed: bool = False

@app.post("/api/comic/{comic_id}/progress")
def update_progress(comic_id: int, req: ProgressUpdate):
    read_status = 2 if req.is_completed else 1 # 2: Read, 1: In Progress
    
    db.execute(
        "UPDATE comics SET current_page = ?, read_status = ? WHERE id = ?",
        (req.current_page, read_status, comic_id)
    )
    return {"status": "ok"}

@app.post("/api/convert/{comic_id}")
def trigger_conversion(comic_id: int):
    from fastapi import HTTPException
    
    row_file = db.fetch_one("SELECT id, file_path FROM files WHERE comic_id = ?", (comic_id,))
    if not row_file:
        raise HTTPException(status_code=404, detail="File entry not found")
        
    file_path = row_file['file_path']
    if not file_path.lower().endswith(('.cbr', '.rar')):
        return {"status": "ok", "message": "File is already standardized."}
        
    row_comic = db.fetch_one('''
        SELECT c.issue_number, c.volume, s.name as series_name, s.publisher
        FROM comics c
        JOIN series s ON c.series_id = s.id
        WHERE c.id = ?
    ''', (comic_id,))
    
    import sys
    sys.path.insert(0, os.path.join(BUNDLE_DIR, "engine"))
    try:
        from engine import injector
        
        pub = row_comic['publisher'] if row_comic else "Unknown"
        series = row_comic['series_name'] if row_comic else "Unknown"
        issue = row_comic['issue_number'] if row_comic else ""
        vol = str(row_comic['volume']) if row_comic and row_comic['volume'] else ""
        
        new_path = injector.convert_cbr_to_cbz_and_inject(file_path, pub, series, "", issue, vol)
        
        # Update Database with new path mapping so UI doesn't lose it
        db.execute("UPDATE files SET file_path = ? WHERE comic_id = ?", (new_path, comic_id))
        
        return {"status": "ok", "message": "Converted to CBZ successfully", "new_path": new_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

# --- SETTINGS ---

@app.get("/api/settings")
def get_settings():
    rows = db.fetch_all("SELECT key, value FROM settings")
    return {row['key']: row['value'] for row in rows}

class SettingsUpdate(BaseModel):
    settings: dict

@app.post("/api/settings")
def update_settings(req: SettingsUpdate):
    for key, value in req.settings.items():
        db.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            (key, value)
        )
        
        # If the library path is set, trigger an initial scan so the user sees results immediately
        if key == "library_path" and value:
            import api_import
            logger.info(f"Triggering initial library scan for: {value}")
            api_import.scan_and_import(value, db)
            
    return {"status": "success"}

# --- ORGANIZED IMPORT ---

class OrganizedImportRequest(BaseModel):
    source_dir: str
    mode: str = "copy" # "copy" or "move"

@app.post("/api/import/organized")
def trigger_organized_import(req: OrganizedImportRequest):
    # Get master library path
    lib_row = db.fetch_one("SELECT value FROM settings WHERE key = 'library_path'")
    if not lib_row or not lib_row['value']:
        raise HTTPException(status_code=400, detail="Master library path not set in settings.")
    
    dest_dir = lib_row['value']
    
    import api_import
    results = api_import.organized_import(req.source_dir, dest_dir, req.mode == "move", db)
    return results

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
    logger.info(f"Starting uvicorn on port {port}")
    
    # Run user application
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="error")
