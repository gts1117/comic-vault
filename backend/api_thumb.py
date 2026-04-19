import os
import zipfile
from io import BytesIO
from PIL import Image

def get_thumbnail_path(comic_id: int, base_dir: str) -> str:
    thumbs_dir = os.path.join(base_dir, "thumbs")
    os.makedirs(thumbs_dir, exist_ok=True)
    return os.path.join(thumbs_dir, f"{comic_id}.jpg")

def extract_and_cache_thumbnail(file_path: str, thumb_path: str, cover_idx: int = 0) -> bool:
    """
    Extracts the image at `cover_idx` from the CBZ archive, resizes it, and saves it.
    """
    if not os.path.exists(file_path):
        print(f"Archive missing: {file_path}")
        return False
        
    try:
        if file_path.lower().endswith('.cbz') or file_path.lower().endswith('.zip'):
            with zipfile.ZipFile(file_path, 'r') as z:
                # Filter to only parse images, omit hidden/system macOS files
                valid_images = [
                    f for f in z.namelist() 
                    if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')) and not f.startswith('__MACOSX') and not '/.' in f
                ]
                
                if not valid_images:
                    return False
                    
                # Standard sorting to ensure chronological page layout
                valid_images.sort()
                
                # Protect index out of bounds
                actual_idx = cover_idx if cover_idx < len(valid_images) else 0
                target_image = valid_images[actual_idx]
                
                img_data = z.read(target_image)
                
                img = Image.open(BytesIO(img_data))
                img = img.convert("RGB")
                
                # Resize to max height 600px maintaining aspect ratio
                base_height = 600
                if img.height > base_height:
                    h_percent = (base_height / float(img.height))
                    w_size = int((float(img.width) * float(h_percent)))
                    img = img.resize((w_size, base_height), Image.Resampling.LANCZOS)
                
                img.save(thumb_path, "JPEG", quality=85)
                return True
                
        elif file_path.lower().endswith('.cbr') or file_path.lower().endswith('.rar'):
            # Prompt UI for CBR conversion instead, returning false to trigger the fallback UI
            return False
            
    except Exception as e:
        print(f"Failed to generate thumbnail for {file_path}: {e}")
        return False
        
    return False
