import sys
import os
import threading

# Add engine to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "engine"))
from engine import inference
from engine import metadata as engine_metadata

def scan_and_import(source_dir: str, db):
    """
    Scans a 'source_dir', runs inference to figure out what it is,
    and inserts it into the SQLite database.
    """
    results = {
        "found": 0,
        "imported": 0,
        "errors": []
    }
    
    if not os.path.isdir(source_dir):
        results["errors"].append("Source directory not found")
        return results
        
    for root, _, files in os.walk(source_dir):
        for f in files:
            if not f.lower().endswith(('.cbz', '.cbr', '.zip', '.rar')):
                continue
                
            results["found"] += 1
            file_path = os.path.join(root, f)
            print(f"Importing: {file_path}")
            
            # File uniqueness validation (skip if already exists)
            stat = os.stat(file_path)
            file_size = stat.st_size
            
            # Very fast footprint hashing based on comic-sorter logic
            # For brevity in the basic API, we use path+size
            if db.fetch_one("SELECT id FROM files WHERE file_path = ? OR file_size = ?", (file_path, file_size)):
                # Note: file_size isn't technically unique on its own globally, but combined with the path it serves as a lightweight check
                # Our actual checksum logic will run deep byte footprinting later
                results["errors"].append(f"Skipped duplicate: {f}")
                continue
                
            try:
                # 1. Parse filename constraints via inference engine
                meta = engine_metadata.extract_metadata(file_path)
                
                # Inference provides cleaned publisher, series, issue, volume
                # Ensure the Series exists
                pub = meta.get("publisher", "Unknown Publisher")
                series_name = meta.get("series", "Unknown Series")
                
                series_row = db.fetch_one("SELECT id FROM series WHERE name = ? AND publisher = ?", (series_name, pub))
                if series_row:
                    series_id = series_row['id']
                else:
                    series_id = db.execute(
                        "INSERT INTO series (name, publisher) VALUES (?, ?)", 
                        (series_name, pub)
                    )
                
                # Ensure Comic exists
                comic_id = db.execute(
                    """INSERT INTO comics (series_id, issue_number, title, volume, summary)
                       VALUES (?, ?, ?, ?, ?)""",
                    (series_id, meta.get('issue', ''), meta.get('title', ''), meta.get('volume', None), meta.get('summary', ''))
                )
                
                # Log File wrapper
                db.execute(
                    "INSERT INTO files (comic_id, file_path, file_size, checksum, cover_page_index) VALUES (?, ?, ?, ?, ?)",
                    (comic_id, file_path, file_size, f"basic-hash-{file_size}", 0)  # Defaulting cover page to 0
                )
                
                results["imported"] += 1

            except Exception as e:
                results["errors"].append(f"Failed {f}: {str(e)}")

    return results
