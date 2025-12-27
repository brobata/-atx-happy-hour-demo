import { neighborhoods, cuisines, days } from '../data/venues';
import type { Filters } from '../hooks/useSearch';

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onChange({ ...filters, [key]: value === filters[key] ? null : value });
  };

  const clearAll = () => {
    onChange({ neighborhood: null, cuisine: null, day: null, maxPrice: null });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== null);

  return (
    <div className="filter-bar">
      <div className="filter-section">
        <label className="filter-label">Neighborhood</label>
        <div className="filter-chips">
          {neighborhoods.map(n => (
            <button
              key={n}
              className={`chip ${filters.neighborhood === n ? 'active' : ''}`}
              onClick={() => updateFilter('neighborhood', n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">Cuisine</label>
        <div className="filter-chips">
          {cuisines.slice(0, 8).map(c => (
            <button
              key={c}
              className={`chip ${filters.cuisine === c ? 'active' : ''}`}
              onClick={() => updateFilter('cuisine', c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">Day</label>
        <div className="filter-chips">
          {days.map(d => (
            <button
              key={d}
              className={`chip ${filters.day === d ? 'active' : ''}`}
              onClick={() => updateFilter('day', d)}
            >
              {d.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">Max Price</label>
        <div className="filter-chips">
          {[1, 2, 3, 4].map(p => (
            <button
              key={p}
              className={`chip ${filters.maxPrice === p ? 'active' : ''}`}
              onClick={() => updateFilter('maxPrice', p)}
            >
              {'$'.repeat(p)}
            </button>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <button className="clear-filters" onClick={clearAll}>
          Clear all filters
        </button>
      )}
    </div>
  );
}
