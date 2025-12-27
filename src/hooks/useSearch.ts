import { useState, useEffect, useRef } from 'react';
import { create, insert, search, type Orama } from '@orama/orama';
import { venues, type Venue } from '../data/venues';

export interface Filters {
  neighborhood: string | null;
  cuisine: string | null;
  day: string | null;
  maxPrice: number | null;
}

interface SearchResult {
  results: Venue[];
  searchTimeMs: number;
  totalResults: number;
}

// Create schema for Orama
const schema = {
  name: 'string',
  neighborhood: 'string',
  cuisine: 'string',
  dealText: 'string',
  address: 'string',
  drinks: 'string[]',
  food: 'string[]',
  days: 'string[]',
  priceLevel: 'number',
} as const;

export function useSearch(query: string, filters: Filters): SearchResult & { isLoading: boolean } {
  const [results, setResults] = useState<Venue[]>(venues);
  const [searchTimeMs, setSearchTimeMs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const dbRef = useRef<Orama<typeof schema> | null>(null);

  // Initialize search index once
  useEffect(() => {
    async function initIndex() {
      const startInit = performance.now();

      const db = await create({ schema });

      // Insert all venues
      for (const venue of venues) {
        await insert(db, {
          ...venue,
        });
      }

      dbRef.current = db;
      setIsLoading(false);
      console.log(`🔍 Search index built in ${(performance.now() - startInit).toFixed(1)}ms`);
    }

    initIndex();
  }, []);

  // Perform search when query or filters change
  useEffect(() => {
    async function performSearch() {
      const startSearch = performance.now();

      // If no index yet, show all
      if (!dbRef.current) {
        setResults(venues);
        return;
      }

      // If no query and no filters, show all
      const hasFilters = filters.neighborhood || filters.cuisine || filters.day || filters.maxPrice;

      if (!query.trim() && !hasFilters) {
        setResults(venues);
        setSearchTimeMs(performance.now() - startSearch);
        return;
      }

      try {
        // Build where clause for filters
        const where: Record<string, unknown> = {};
        if (filters.neighborhood) {
          where.neighborhood = filters.neighborhood;
        }
        if (filters.cuisine) {
          where.cuisine = filters.cuisine;
        }
        if (filters.maxPrice) {
          where.priceLevel = { lte: filters.maxPrice };
        }

        const searchResults = await search(dbRef.current, {
          term: query.trim(),
          properties: ['name', 'dealText', 'neighborhood', 'cuisine', 'drinks', 'food'],
          limit: 50,
          where: Object.keys(where).length > 0 ? where : undefined,
        });

        // Map results back to full venue objects
        let matchedVenues = searchResults.hits.map(hit => {
          const id = hit.document.id || hit.id;
          return venues.find(v => v.id === id) || hit.document as unknown as Venue;
        });

        // Apply day filter (post-search since it's an array)
        if (filters.day) {
          matchedVenues = matchedVenues.filter(v => v.days.includes(filters.day!));
        }

        setResults(matchedVenues);
        setSearchTimeMs(performance.now() - startSearch);
      } catch (err) {
        console.error('Search error:', err);
        // Fallback to simple filter
        let filtered = venues;

        if (query.trim()) {
          const q = query.toLowerCase();
          filtered = filtered.filter(v =>
            v.name.toLowerCase().includes(q) ||
            v.dealText.toLowerCase().includes(q) ||
            v.neighborhood.toLowerCase().includes(q)
          );
        }

        if (filters.neighborhood) {
          filtered = filtered.filter(v => v.neighborhood === filters.neighborhood);
        }
        if (filters.cuisine) {
          filtered = filtered.filter(v => v.cuisine === filters.cuisine);
        }
        if (filters.day) {
          filtered = filtered.filter(v => v.days.includes(filters.day!));
        }
        if (filters.maxPrice) {
          filtered = filtered.filter(v => v.priceLevel <= filters.maxPrice!);
        }

        setResults(filtered);
        setSearchTimeMs(performance.now() - startSearch);
      }
    }

    performSearch();
  }, [query, filters]);

  return {
    results,
    searchTimeMs,
    totalResults: results.length,
    isLoading,
  };
}

// Debounce hook for search input
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
