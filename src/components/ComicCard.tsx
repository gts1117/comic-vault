import { Comic } from '../store'

export function ComicCard({ comic }: { comic: Comic }) {
  return (
    <div className="comic-card">
      <div className="comic-cover">
        {/* Placeholder until thumbnail serving endpoint is built */}
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '0.8rem' }}>
          No Cover
        </div>
      </div>
      <div className="comic-info">
        <h3 className="comic-title">{comic.title || "Unknown Title"}</h3>
        <p className="comic-issue">
          {comic.series_name} #{comic.issue_number}
        </p>
      </div>
    </div>
  )
}
