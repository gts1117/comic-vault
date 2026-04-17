import uvicorn
import socket
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys

app = FastAPI(title="Comic Vault Backend API")

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
