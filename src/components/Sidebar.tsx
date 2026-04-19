import { useUIStore } from '../store'

export function Sidebar() {
  const { activePublisher, setActivePublisher, apiPort } = useUIStore()

  const categories = [
    { id: 'all', label: 'All Comics', pub: null },
    { id: 'dc', label: 'DC', pub: 'DC' },
    { id: 'marvel', label: 'Marvel', pub: 'Marvel' },
    { id: 'image', label: 'Image', pub: 'Image' },
  ]

  return (
    <div className="sidebar">
      <h2>Comic Vault</h2>
      {categories.map(c => (
        <button
          key={c.id}
          className={`sidebar-button ${activePublisher === c.pub ? 'active' : ''}`}
          onClick={() => setActivePublisher(c.pub)}
        >
          {c.label}
        </button>
      ))}
      <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: '#666' }}>
        Status: {apiPort ? `Connected (:${apiPort})` : 'Disconnected'}
      </div>
    </div>
  )
}
