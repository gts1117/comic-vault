import { create } from 'zustand'

export interface Comic {
  id: number
  title: string
  issue_number: string
  series_name: string
  publisher: string
}

interface LibraryState {
  comics: Comic[]
  isLoading: boolean
  error: string | null
  setComics: (comics: Comic[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useLibraryStore = create<LibraryState>((set) => ({
  comics: [],
  isLoading: true,
  error: null,
  setComics: (comics) => set({ comics, isLoading: false, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
}))

interface UIState {
  apiPort: number | null
  activePublisher: string | null
  searchQuery: string
  setApiPort: (port: number) => void
  setActivePublisher: (pub: string | null) => void
  setSearchQuery: (query: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  apiPort: null,
  activePublisher: null,
  searchQuery: "",
  setApiPort: (apiPort) => set({ apiPort }),
  setActivePublisher: (activePublisher) => set({ activePublisher }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}))
