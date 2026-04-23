import sys
import os

# Add engine to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "engine"))
from engine import inference
from engine import metadata as engine_metadata
from engine.core import ComicSorterEngine

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
            
            # File uniqueness validation
            stat = os.stat(file_path)
            file_size = stat.st_size
            
            if db.fetch_one("SELECT id FROM files WHERE file_path = ? OR file_size = ?", (file_path, file_size)):
                results["errors"].append(f"Skipped duplicate: {f}")
                continue
                
            try:
                # 1. Parse metadata via engine
                # Returns: publisher, ip, storyline, issue, volume
                pub, series_name, storyline, issue, volume = engine_metadata.extract_metadata(file_path)
                
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
                    """INSERT INTO comics (series_id, issue_number, title, volume)
                       VALUES (?, ?, ?, ?)""",
                    (series_id, issue, series_name, volume) # Using series_name as default title
                )
                
                # Log File wrapper
                db.execute(
                    "INSERT INTO files (comic_id, file_path, file_size, checksum, cover_page_index) VALUES (?, ?, ?, ?, ?)",
                    (comic_id, file_path, file_size, f"basic-hash-{file_size}", 0)
                )
                
                results["imported"] += 1

            except Exception as e:
                print(f"  [!] Import failed for {f}: {e}")
                results["errors"].append(f"Failed {f}: {str(e)}")

    return results


def organized_import(source_dir: str, dest_dir: str, move_files: bool, db):
    """
    Uses the ComicSorterEngine to physically move/copy files into the 
    library using the structured format, then indexes the results.
    """
    status = {
        "success": False,
        "summary": {},
        "errors": []
    }

    # Setup callbacks for the engine
    def on_finish(summary):
        status["success"] = True
        status["summary"] = summary

    callbacks = {
        "on_finish": on_finish,
        "log": lambda m: print(f"[Engine] {m}")
    }

    engine = ComicSorterEngine(callbacks)
    
    try:
        engine.process_comics(
            source_dir=source_dir,
            dest_dir=dest_dir,
            is_move_operation=move_files,
            mode=1,
            dry_run=False
        )
        
        # After sorting is done, we need to INDEX the destination dir to update our DB
        scan_and_import(dest_dir, db)
        
    except Exception as e:
        status["errors"].append(str(e))

    return status
