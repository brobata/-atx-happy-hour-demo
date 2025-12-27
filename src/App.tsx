import { useState, useTransition } from 'react';
import { SearchInput } from './components/SearchInput';
import { CategoryTabs } from './components/CategoryTabs';
import { TimeFilter } from './components/TimeFilter';
import { DealTypeFilter } from './components/DealTypeFilter';
import { VenueCard, VenueCardSkeleton } from './components/VenueCard';
import { FeedbackDialog, FeedbackButton } from './components/FeedbackDialog';
import { useSearch, useDebounce, isHappeningNow, type Filters } from './hooks/useSearch';
import { neighborhoods } from './data/venues';
import './styles.css';

const initialFilters: Filters = {
  neighborhood: null,
  cuisine: null,
  day: null,
  maxPrice: null,
  timeFilter: 'all',
  dealType: 'all',
};

export default function App() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [isPending, startTransition] = useTransition();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Debounce search query for 100ms
  const debouncedQuery = useDebounce(query, 100);

  const { results, searchTimeMs, totalResults, isLoading } = useSearch(debouncedQuery, filters);

  const handleFilterChange = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    startTransition(() => {
      setFilters(prev => ({ ...prev, [key]: value }));
    });
  };

  const clearAllFilters = () => {
    startTransition(() => {
      setFilters(initialFilters);
      setQuery('');
    });
  };

  const hasActiveFilters = filters.neighborhood || filters.cuisine || filters.day ||
    filters.maxPrice || filters.timeFilter !== 'all' || filters.dealType !== 'all' || query;

  // Count venues happening now
  const happeningNowCount = results.filter(isHappeningNow).length;

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

        {/* Category Tabs - Cuisine Filter */}
        <section className="filter-section-wrapper">
          <CategoryTabs
            selected={filters.cuisine}
            onChange={(cuisine) => handleFilterChange('cuisine', cuisine)}
          />
        </section>

        {/* Time Filter - Now / Soon / Today / Specific Day */}
        <TimeFilter
          timeFilter={filters.timeFilter}
          selectedDay={filters.day}
          onTimeFilterChange={(tf) => handleFilterChange('timeFilter', tf)}
          onDayChange={(day) => handleFilterChange('day', day)}
        />

        {/* Deal Type - Drinks vs Food */}
        <DealTypeFilter
          dealType={filters.dealType}
          onChange={(dt) => handleFilterChange('dealType', dt)}
        />

        {/* Additional Filters */}
        <div className="compact-filters">
          <div className="compact-filter-group">
            <label className="filter-label">Neighborhood</label>
            <div className="filter-chips">
              {neighborhoods.slice(0, 6).map(n => (
                <button
                  key={n}
                  className={`chip ${filters.neighborhood === n ? 'active' : ''}`}
                  onClick={() => handleFilterChange('neighborhood', filters.neighborhood === n ? null : n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="compact-filter-group">
            <label className="filter-label">Max Price</label>
            <div className="filter-chips">
              {[1, 2, 3, 4].map(p => (
                <button
                  key={p}
                  className={`chip ${filters.maxPrice === p ? 'active' : ''}`}
                  onClick={() => handleFilterChange('maxPrice', filters.maxPrice === p ? null : p)}
                >
                  {'$'.repeat(p)}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button className="clear-filters" onClick={clearAllFilters}>
              Clear all filters
            </button>
          )}
        </div>

        {/* Results Header */}
        <div className="results-header">
          <div className="results-info">
            <span className="results-count">
              Showing {totalResults} happy hour{totalResults !== 1 ? 's' : ''}
            </span>
            {happeningNowCount > 0 && filters.timeFilter !== 'now' && (
              <span className="happening-now-badge">
                <span className="pulse-dot"></span>
                {happeningNowCount} happening now
              </span>
            )}
          </div>
          {isPending && <span className="updating">Updating...</span>}
        </div>

        {/* Results List */}
        <div className="results-list">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <VenueCardSkeleton key={i} />
            ))
          ) : results.length === 0 ? (
            <div className="no-results">
              <p>No happy hours found matching your criteria.</p>
              <p>Try adjusting your search or filters.</p>
              {hasActiveFilters && (
                <button className="btn-clear-filters" onClick={clearAllFilters}>
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            results.map(venue => (
              <VenueCard
                key={venue.id}
                venue={venue}
                searchQuery={debouncedQuery}
                isHappeningNow={isHappeningNow(venue)}
              />
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

      {/* Feedback Button */}
      <FeedbackButton onClick={() => setFeedbackOpen(true)} />

      {/* Feedback Dialog */}
      <FeedbackDialog isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
