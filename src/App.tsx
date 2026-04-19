import { Sidebar } from './components/Sidebar'
import { CategorizedGrid } from './components/CategorizedGrid'
import { useBackend } from './hooks/useBackend'
import './App.css'

function App() {
  // Initialize the IPC Handshake and populate Zustand
  useBackend()

  return (
    <div className="app-container">
      <Sidebar />
      <CategorizedGrid />
    </div>
  )
}

export default App
