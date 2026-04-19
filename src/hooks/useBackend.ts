import { useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useUIStore, useLibraryStore } from '../store'

export function useBackend() {
  const { apiPort, setApiPort } = useUIStore()
  const { setComics, setError, setLoading } = useLibraryStore()

  useEffect(() => {
    async function handShake() {
      try {
        console.log("Requesting port from Rust...")
        // We poll because the python sidecar takes a second to boot and bind
        let retries = 5;
        let port: number | null = null;
        while (retries > 0 && port === null) {
          port = await invoke('get_backend_port')
          if (port) break;
          await new Promise(r => setTimeout(r, 1000));
          retries--;
        }
        
        if (port) {
            console.log("Handshake successful. API running on port", port);
            setApiPort(port)
            fetchLibrary(port)
        } else {
            setError("Failed to get backend port from sidecar.")
        }
      } catch (e) {
        console.error(e)
        setError("Error connecting to backend sidecar.")
      }
    }
    
    if (!apiPort) {
        handShake()
    }
  }, [apiPort])

  async function fetchLibrary(port: number) {
    setLoading(true)
    try {
      const resp = await fetch(`http://localhost:${port}/api/library`)
      if (!resp.ok) throw new Error("Network response was not ok")
      const data = await resp.json()
      setComics(data)
    } catch (e) {
      console.error(e)
      setError("Failed to fetch library data.")
    }
  }
}
