import sys
import os

# Append the submodule to system path so it can resolve its sibling imports natively
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "engine"))

try:
    import core
    import inference
    import metadata
    import scanner
    import app_paths
    
    print("SUCCESS: Core modules loaded.")
    
    # Try calling a basic inference helper if one exists, or simply test path resolution
    print("Paths configured efficiently via submodule!")
    
except ImportError as e:
    print(f"FAILED TO IMPORT SUBMODULE CODE: {e}")
    sys.exit(1)
