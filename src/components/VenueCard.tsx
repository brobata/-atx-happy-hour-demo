import type { Venue } from '../data/venues';

interface VenueCardProps {
  venue: Venue;
  searchQuery?: string;
}

// Highlight matching text
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="highlight">{part}</mark> : part
  );
}

export function VenueCard({ venue, searchQuery = '' }: VenueCardProps) {
  return (
    <div className="venue-card">
      <div className="venue-emoji">{venue.image}</div>
      <div className="venue-content">
        <div className="venue-header">
          <h3 className="venue-name">{highlightMatch(venue.name, searchQuery)}</h3>
          <span className="venue-rating">⭐ {venue.rating}</span>
        </div>
        <p className="venue-deal">{highlightMatch(venue.dealText, searchQuery)}</p>
        <div className="venue-meta">
          <span className="venue-neighborhood">📍 {venue.neighborhood}</span>
          <span className="venue-time">🕐 {venue.startTime} - {venue.endTime}</span>
          <span className="venue-price">{'$'.repeat(venue.priceLevel)}</span>
        </div>
        <div className="venue-days">
          {venue.days.map(d => (
            <span key={d} className="day-tag">{d.slice(0, 3)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for perceived performance
export function VenueCardSkeleton() {
  return (
    <div className="venue-card skeleton">
      <div className="venue-emoji skeleton-box">⬜</div>
      <div className="venue-content">
        <div className="skeleton-box" style={{ width: '60%', height: '1.5rem' }} />
        <div className="skeleton-box" style={{ width: '90%', height: '1rem', marginTop: '0.5rem' }} />
        <div className="skeleton-box" style={{ width: '70%', height: '1rem', marginTop: '0.5rem' }} />
      </div>
    </div>
  );
}
