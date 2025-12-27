import { useState } from 'react';
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
  const [imageError, setImageError] = useState(false);
  const hasPhoto = venue.photoUrl && !imageError;

  return (
    <div className="venue-card">
      {hasPhoto ? (
        <div className="venue-photo">
          <img
            src={venue.photoUrl!}
            alt={venue.name}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="venue-emoji">{venue.image}</div>
      )}
      <div className="venue-content">
        <div className="venue-header">
          <h3 className="venue-name">
            {venue.googleMapsUrl ? (
              <a href={venue.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                {highlightMatch(venue.name, searchQuery)}
              </a>
            ) : (
              highlightMatch(venue.name, searchQuery)
            )}
          </h3>
          <span className="venue-rating">
            ⭐ {venue.rating.toFixed(1)}
            {venue.ratingsCount && (
              <span className="ratings-count">({venue.ratingsCount.toLocaleString()})</span>
            )}
          </span>
        </div>
        <p className="venue-deal">{highlightMatch(venue.dealText, searchQuery)}</p>
        <div className="venue-meta">
          <span className="venue-neighborhood">📍 {highlightMatch(venue.neighborhood, searchQuery)}</span>
          <span className="venue-time">🕐 {venue.startTime} - {venue.endTime}</span>
          <span className="venue-price">{'$'.repeat(venue.priceLevel)}</span>
        </div>
        <div className="venue-footer">
          <div className="venue-days">
            {venue.days.map(d => (
              <span key={d} className="day-tag">{d.slice(0, 3)}</span>
            ))}
          </div>
          {venue.googleMapsUrl && (
            <a
              href={venue.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="maps-link"
            >
              View on Maps →
            </a>
          )}
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
