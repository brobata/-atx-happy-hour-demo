import { useState, useEffect, useRef } from 'react';
import { create, insert, search, type Orama } from '@orama/orama';
import { venues, type Venue } from '../data/venues';

export interface Filters {
  neighborhood: string | null;
  cuisine: string | null;
  day: string | null;
  maxPrice: number | null;
  timeFilter: 'all' | 'now' | 'soon' | 'today';
  dealType: 'all' | 'drinks' | 'food';
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

// Parse time string like "3:00 PM" to minutes since midnight
function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const isPM = match[3].toUpperCase() === 'PM';

  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

// Get current time in minutes since midnight
function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// Get current day name
function getCurrentDay(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

// Check if venue is currently in happy hour
function isHappeningNow(venue: Venue): boolean {
  const today = getCurrentDay();
  if (!venue.days.includes(today)) return false;

  const now = getCurrentTimeMinutes();
  const start = parseTimeToMinutes(venue.startTime);
  const end = parseTimeToMinutes(venue.endTime);

  return now >= start && now <= end;
}

// Check if venue happy hour starts within next 2 hours
function isStartingSoon(venue: Venue): boolean {
  const today = getCurrentDay();
  if (!venue.days.includes(today)) return false;

  const now = getCurrentTimeMinutes();
  const start = parseTimeToMinutes(venue.startTime);

  // Starting within next 2 hours and not started yet
  return start > now && start <= now + 120;
}

// Check if venue has happy hour today
function isHappeningToday(venue: Venue): boolean {
  const today = getCurrentDay();
  return venue.days.includes(today);
}

// Check if deal text mentions drinks
function hasDrinkSpecials(venue: Venue): boolean {
  const drinkKeywords = ['beer', 'wine', 'cocktail', 'margarita', 'sake', 'whiskey', 'wells', 'pint', 'draft', 'shot', 'mezcal', 'tequila'];
  const text = venue.dealText.toLowerCase();
  return drinkKeywords.some(kw => text.includes(kw)) || venue.drinks.length > 0;
}

// Check if deal text mentions food
function hasFoodSpecials(venue: Venue): boolean {
  const foodKeywords = ['taco', 'app', 'food', 'pizza', 'wing', 'nacho', 'oyster', 'burger', 'fries', 'snack', 'bao', 'sausage', 'pretzel'];
  const text = venue.dealText.toLowerCase();
  return foodKeywords.some(kw => text.includes(kw)) || venue.food.length > 0;
}

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

      // Check if any filters are active
      const hasFilters = filters.neighborhood || filters.cuisine || filters.day || filters.maxPrice ||
                         filters.timeFilter !== 'all' || filters.dealType !== 'all';

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

        let matchedVenues: Venue[];

        if (query.trim()) {
          const searchResults = await search(dbRef.current, {
            term: query.trim(),
            properties: ['name', 'dealText', 'neighborhood', 'cuisine', 'drinks', 'food'],
            limit: 100,
            where: Object.keys(where).length > 0 ? where : undefined,
          });

          // Map results back to full venue objects
          matchedVenues = searchResults.hits.map(hit => {
            const id = hit.document.id || hit.id;
            return venues.find(v => v.id === id) || hit.document as unknown as Venue;
          });
        } else {
          // No query, start with all venues and apply filters
          matchedVenues = [...venues];

          if (filters.neighborhood) {
            matchedVenues = matchedVenues.filter(v => v.neighborhood === filters.neighborhood);
          }
          if (filters.cuisine) {
            matchedVenues = matchedVenues.filter(v => v.cuisine === filters.cuisine);
          }
          if (filters.maxPrice) {
            matchedVenues = matchedVenues.filter(v => v.priceLevel <= filters.maxPrice!);
          }
        }

        // Apply day filter
        if (filters.day) {
          matchedVenues = matchedVenues.filter(v => v.days.includes(filters.day!));
        }

        // Apply time filter
        if (filters.timeFilter === 'now') {
          matchedVenues = matchedVenues.filter(isHappeningNow);
        } else if (filters.timeFilter === 'soon') {
          matchedVenues = matchedVenues.filter(isStartingSoon);
        } else if (filters.timeFilter === 'today') {
          matchedVenues = matchedVenues.filter(isHappeningToday);
        }

        // Apply deal type filter
        if (filters.dealType === 'drinks') {
          matchedVenues = matchedVenues.filter(hasDrinkSpecials);
        } else if (filters.dealType === 'food') {
          matchedVenues = matchedVenues.filter(hasFoodSpecials);
        }

        // Sort: happening now first, then by rating
        matchedVenues.sort((a, b) => {
          const aNow = isHappeningNow(a) ? 1 : 0;
          const bNow = isHappeningNow(b) ? 1 : 0;
          if (aNow !== bNow) return bNow - aNow;
          return b.rating - a.rating;
        });

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
        if (filters.timeFilter === 'now') {
          filtered = filtered.filter(isHappeningNow);
        } else if (filters.timeFilter === 'soon') {
          filtered = filtered.filter(isStartingSoon);
        } else if (filters.timeFilter === 'today') {
          filtered = filtered.filter(isHappeningToday);
        }
        if (filters.dealType === 'drinks') {
          filtered = filtered.filter(hasDrinkSpecials);
        } else if (filters.dealType === 'food') {
          filtered = filtered.filter(hasFoodSpecials);
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

// Export helper functions for use in components
export { isHappeningNow, isStartingSoon, getCurrentDay };
