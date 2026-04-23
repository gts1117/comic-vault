#!/bin/bash
set -e

# Get Rust default target architecture (e.g. aarch64-apple-darwin)
TARGET=$(rustc -vV | sed -n 's|host: ||p')
echo "Building backend for target: $TARGET"

# Make sure we're in the backend directory
cd "$(dirname "$0")"
source venv/bin/activate

# Bundle with PyInstaller
# Bundle with PyInstaller - include schema.sql and the engine folder as data files
pyinstaller --noconfirm --onefile --console \
    --name "api-server-$TARGET" \
    --add-data "schema.sql:." \
    --add-data "engine:engine" \
    server.py

# Move to Tauri directory
mkdir -p ../src-tauri/binaries
cp dist/"api-server-$TARGET" ../src-tauri/binaries/

echo "Backend build complete!"
