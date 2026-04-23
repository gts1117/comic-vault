import { useEffect } from 'react'
import { listen, emit } from '@tauri-apps/api/event'
import { useUIStore, useLibraryStore } from '../store'

export function useBackend() {
  const { apiPort, setApiPort, setLibraryPath } = useUIStore()
  const { setComics, setError, setLoading } = useLibraryStore()

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    async function setupHandshake() {
      try {
        console.log("Setting up handshake listeners...");
        
        // 1. Listen for the backend port
        unlisten = await listen<number>('backend-ready', (event) => {
          const port = event.payload;
          console.log("Handshake successful via event. API running on port", port);
          setApiPort(port)
          initializeStates(port)
        })

        // 2. Tell Rust we're ready to receive the port
        // If the sidecar already started, Rust will re-emit on this signal.
        console.log("Signaling 'frontend-ready' to Rust...");
        await emit('frontend-ready');
        
      } catch (e) {
        console.error("Failed to setup handshake", e)
        setError("Error setting up backend connection.")
      }
    }

    if (!apiPort) {
      setupHandshake()
    }

    return () => {
      if (unlisten) unlisten()
    }
  }, [apiPort])

  async function initializeStates(port: number) {
      // 1. Fetch settings (Library Path)
      try {
          // Small delay to ensure server is fully bound
          await new Promise(r => setTimeout(r, 500));
          
          const sResp = await fetch(`http://127.0.0.1:${port}/api/settings`)
          if (sResp.ok) {
              const settings = await sResp.json()
              if (settings.library_path) {
                  setLibraryPath(settings.library_path)
              }
          }
      } catch (e) {
          console.error("Failed to fetch settings", e)
      }

      // 2. Fetch Initial Library
      fetchLibraryWithRetry(port)
  }

  async function fetchLibraryWithRetry(port: number, retries = 5) {
    setLoading(true)
    try {
      console.log(`Fetching library from 127.0.0.1:${port} (retries: ${retries})...`);
      const resp = await fetch(`http://127.0.0.1:${port}/api/library`)
      if (!resp.ok) throw new Error("Network response was not ok")
      const data = await resp.json()
      if (Array.isArray(data)) {
        console.log(`Loaded ${data.length} comics.`);
        setComics(data)
      } else {
        console.error("Library data is not an array:", data);
        setError("Received invalid data format from server.")
      }
    } catch (e) {
      console.error(`Fetch attempt failed (${retries} left):`, e)
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return fetchLibraryWithRetry(port, retries - 1);
      }
      setError("Failed to fetch library data.")
    }
  }
}
