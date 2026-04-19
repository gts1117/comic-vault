import { useLibraryStore, useUIStore } from '../store'
import { ComicCard } from './ComicCard'

export function CategorizedGrid() {
  const { comics, isLoading, error } = useLibraryStore()
  const { activePublisher } = useUIStore()

  if (isLoading) return <div className="main-view">Loading library...</div>
  if (error) return <div className="main-view" style={{ color: 'red' }}>{error}</div>
  if (!comics || comics.length === 0) return <div className="main-view">Library is empty. Import some folders!</div>

  // Filter based on UI State
  const visibleComics = activePublisher 
    ? comics.filter(c => c.publisher === activePublisher)
    : comics

  // Group by Publisher for physical tabs
  const groups: Record<string, typeof comics> = {}
  for (const c of visibleComics) {
    const pub = c.publisher || "Unknown Publisher"
    if (!groups[pub]) groups[pub] = []
    groups[pub].push(c)
  }

  return (
    <div className="main-view">
      {Object.entries(groups).map(([publisher, items]) => (
        <div key={publisher} style={{ marginBottom: '40px' }}>
          <div className="publisher-tab">{publisher}</div>
          <div className="grid-divider"></div>
          <div className="comic-grid">
            {items.map(comic => (
              <ComicCard key={comic.id} comic={comic} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
