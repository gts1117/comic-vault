import os
import zipfile
from logger import get_logger

logger = get_logger("vault.reader")

def _get_valid_images(z: zipfile.ZipFile):
    valid = [
        f for f in z.namelist() 
        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')) 
        and not f.startswith('__MACOSX') 
        and not '/.' in f
    ]
    valid.sort()
    return valid

def get_comic_metadata(file_path: str) -> dict:
    """Returns the total number of pages in the archive."""
    if not os.path.exists(file_path):
        return {"error": "File not found", "total_pages": 0}
        
    try:
        if file_path.lower().endswith(('.cbz', '.zip')):
            with zipfile.ZipFile(file_path, 'r') as z:
                images = _get_valid_images(z)
                return {"total_pages": len(images)}
        elif file_path.lower().endswith(('.cbr', '.rar')):
            return {"error": "needs_conversion", "total_pages": 0}
        else:
            return {"error": "Unsupported format", "total_pages": 0}
            
    except Exception as e:
        logger.error(f"Failed to read metadata for {file_path}: {e}")
        return {"error": str(e), "total_pages": 0}

def get_page_image_bytes(file_path: str, page_idx: int):
    """Extracts the raw bytes of a specific page index."""
    if not os.path.exists(file_path):
        return None
        
    try:
        if file_path.lower().endswith(('.cbz', '.zip')):
            with zipfile.ZipFile(file_path, 'r') as z:
                images = _get_valid_images(z)
                
                if page_idx < 0 or page_idx >= len(images):
                    return None
                    
                target_image = images[page_idx]
                
                # Determine content type based on extension
                ext = target_image.lower().split('.')[-1]
                content_type = "image/jpeg"
                if ext == "png":
                    content_type = "image/png"
                elif ext == "webp":
                    content_type = "image/webp"
                    
                return z.read(target_image), content_type
                
    except Exception as e:
        logger.error(f"Failed to extract page {page_idx} from {file_path}: {e}")
        return None
        
    return None
