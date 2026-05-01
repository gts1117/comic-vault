import { create } from 'zustand'

export interface Comic {
  id: number
  title: string
  issue_number: string
  series_name: string
  publisher: string
  file_path: string
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
  libraryPath: string | null
  isImporting: boolean
  activeComicId: number | null
  isSidebarOpen: boolean
  editMode: boolean
  isAddingBox: boolean
  setApiPort: (port: number) => void
  setActivePublisher: (pub: string | null) => void
  setSearchQuery: (query: string) => void
  setLibraryPath: (path: string | null) => void
  setIsImporting: (isImporting: boolean) => void
  setActiveComicId: (id: number | null) => void
  setSidebarOpen: (isOpen: boolean) => void
  setEditMode: (editMode: boolean) => void
  setIsAddingBox: (isAddingBox: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  apiPort: null,
  activePublisher: null,
  searchQuery: "",
  libraryPath: null,
  isImporting: false,
  activeComicId: null,
  isSidebarOpen: true,
  editMode: false,
  isAddingBox: false,
  setApiPort: (apiPort) => set({ apiPort }),
  setActivePublisher: (activePublisher) => set({ activePublisher }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setLibraryPath: (libraryPath) => set({ libraryPath }),
  setIsImporting: (isImporting) => set({ isImporting }),
  setActiveComicId: (activeComicId) => set({ activeComicId }),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setEditMode: (editMode) => set({ editMode }),
  setIsAddingBox: (isAddingBox) => set({ isAddingBox }),
}))
