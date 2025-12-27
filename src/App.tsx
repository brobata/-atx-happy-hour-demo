import { useState, useTransition } from 'react';
import { SearchInput } from './components/SearchInput';
import { FilterBar } from './components/FilterBar';
import { VenueCard, VenueCardSkeleton } from './components/VenueCard';
import { useSearch, useDebounce, type Filters } from './hooks/useSearch';
import './styles.css';

const initialFilters: Filters = {
  neighborhood: null,
  cuisine: null,
  day: null,
  maxPrice: null,
};

export default function App() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [isPending, startTransition] = useTransition();

  // Debounce search query for 100ms (fast but prevents excessive re-renders)
  const debouncedQuery = useDebounce(query, 100);

  const { results, searchTimeMs, totalResults, isLoading } = useSearch(debouncedQuery, filters);

  const handleFilterChange = (newFilters: Filters) => {
    startTransition(() => {
      setFilters(newFilters);
    });
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🍻 ATX Happy Hour</h1>
        <p className="tagline">Find the best drink & food deals in Austin, TX</p>
      </header>

      <main className="main">
        <SearchInput
          value={query}
          onChange={setQuery}
          resultCount={totalResults}
          searchTimeMs={searchTimeMs}
        />

        <FilterBar filters={filters} onChange={handleFilterChange} />

        <div className="results-header">
          <span className="results-count">
            Showing {totalResults} happy hour{totalResults !== 1 ? 's' : ''}
          </span>
          {isPending && <span className="updating">Updating...</span>}
        </div>

        <div className="results-list">
          {isLoading ? (
            // Show skeletons while loading
            Array.from({ length: 5 }).map((_, i) => (
              <VenueCardSkeleton key={i} />
            ))
          ) : results.length === 0 ? (
            <div className="no-results">
              <p>No happy hours found matching your criteria.</p>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
            results.map(venue => (
              <VenueCard key={venue.id} venue={venue} searchQuery={debouncedQuery} />
            ))
          )}
        </div>
      </main>

      <footer className="footer">
        <p>
          ⚡ Powered by client-side search — <strong>0ms network latency</strong>
        </p>
        <p className="tech-stack">
          Built with React + Orama + Vite
        </p>
      </footer>
    </div>
  );
}
