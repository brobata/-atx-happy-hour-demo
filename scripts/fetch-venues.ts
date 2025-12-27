/**
 * Fetches venue data from Google Places API at build time.
 * Run with: npm run fetch-venues
 *
 * Requires GOOGLE_PLACES_API_KEY environment variable.
 */

import { writeFileSync, existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  opening_hours?: {
    weekday_text?: string[];
    open_now?: boolean;
  };
  photos?: Array<{
    photo_reference: string;
  }>;
  vicinity?: string;
}

interface Venue {
  id: string;
  name: string;
  neighborhood: string;
  address: string;
  cuisine: string;
  dealText: string;
  drinks: string[];
  food: string[];
  priceLevel: number;
  days: string[];
  startTime: string;
  endTime: string;
  rating: number;
  ratingsCount: number;
  image: string;
  photoUrl: string | null;
  lat: number;
  lng: number;
  placeId: string;
  googleMapsUrl: string;
}

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const OUTPUT_PATH = resolve(__dirname, '../src/data/venues-generated.json');
const CACHE_PATH = resolve(__dirname, '../.venues-cache.json');

// Austin neighborhoods to search
const SEARCH_QUERIES = [
  { query: 'happy hour downtown Austin TX', neighborhood: 'Downtown' },
  { query: 'happy hour East Austin TX', neighborhood: 'East Austin' },
  { query: 'happy hour South Lamar Austin TX', neighborhood: 'South Lamar' },
  { query: 'happy hour Rainey Street Austin TX', neighborhood: 'Rainey Street' },
  { query: 'happy hour South Congress Austin TX', neighborhood: 'South Congress' },
  { query: 'happy hour North Loop Austin TX', neighborhood: 'North Loop' },
  { query: 'happy hour Mueller Austin TX', neighborhood: 'Mueller' },
  { query: 'bars and restaurants 6th street Austin TX', neighborhood: 'Sixth Street' },
  { query: 'cocktail bars Austin TX', neighborhood: 'Downtown' },
  { query: 'breweries Austin TX', neighborhood: 'East Austin' },
];

// Map place types to cuisine/venue type
function getCuisineFromTypes(types: string[]): string {
  if (types.includes('bar')) return 'Bar';
  if (types.includes('night_club')) return 'Night Club';
  if (types.includes('restaurant')) {
    if (types.includes('mexican_restaurant')) return 'Mexican';
    if (types.includes('italian_restaurant')) return 'Italian';
    if (types.includes('japanese_restaurant')) return 'Japanese';
    if (types.includes('thai_restaurant')) return 'Thai';
    if (types.includes('french_restaurant')) return 'French';
    if (types.includes('american_restaurant')) return 'American';
    return 'Restaurant';
  }
  if (types.includes('brewery')) return 'Brewery';
  if (types.includes('cafe')) return 'Cafe';
  return 'Bar & Grill';
}

// Generate placeholder happy hour deal text
function generateDealText(priceLevel: number, cuisine: string): string {
  const deals = [
    '$5 wells, $4 draft beers',
    '$6 house wine, $7 cocktails',
    '$4 local drafts, half-price apps',
    '$3 Lone Stars, $5 margaritas',
    '$2 off all drinks, $5 snacks',
    '$6 craft cocktails, $4 beer',
    '$5 sake, $6 beer specials',
    '$7 signature cocktails',
    '$4 pints, $6 wines by the glass',
    '$5 frozen drinks, $3 tacos',
  ];
  return deals[Math.floor(Math.random() * deals.length)];
}

// Get drinks based on cuisine type
function getDrinks(cuisine: string): string[] {
  const drinkMap: Record<string, string[]> = {
    'Mexican': ['margaritas', 'tequila', 'beer', 'mezcal'],
    'Japanese': ['sake', 'japanese whiskey', 'beer', 'cocktails'],
    'Italian': ['wine', 'aperol spritz', 'negroni', 'beer'],
    'French': ['wine', 'champagne', 'cocktails'],
    'Brewery': ['craft beer', 'cider', 'local brews'],
    'Bar': ['cocktails', 'beer', 'whiskey', 'wine'],
    'Thai': ['thai beer', 'cocktails', 'wine'],
    'default': ['beer', 'wine', 'cocktails'],
  };
  return drinkMap[cuisine] || drinkMap['default'];
}

// Get food based on cuisine type
function getFood(cuisine: string): string[] {
  const foodMap: Record<string, string[]> = {
    'Mexican': ['tacos', 'queso', 'guacamole', 'nachos'],
    'Japanese': ['sushi', 'edamame', 'gyoza'],
    'Italian': ['pizza', 'bruschetta', 'antipasti'],
    'French': ['frites', 'charcuterie', 'oysters'],
    'Brewery': ['pretzels', 'wings', 'nachos'],
    'Bar': ['wings', 'fries', 'sliders'],
    'Thai': ['spring rolls', 'satay', 'curry puffs'],
    'default': ['appetizers', 'bar snacks'],
  };
  return foodMap[cuisine] || foodMap['default'];
}

// Get emoji for cuisine type
function getEmoji(cuisine: string): string {
  const emojiMap: Record<string, string> = {
    'Mexican': '🌮',
    'Japanese': '🍣',
    'Italian': '🍕',
    'French': '🥂',
    'Brewery': '🍺',
    'Bar': '🍸',
    'Thai': '🍜',
    'Night Club': '🎵',
    'American': '🍔',
    'Cafe': '☕',
    'Restaurant': '🍽️',
    'Bar & Grill': '🍻',
  };
  return emojiMap[cuisine] || '🍻';
}

async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', query);
  url.searchParams.set('key', API_KEY!);
  url.searchParams.set('type', 'bar|restaurant');

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.error(`Places API error for "${query}":`, data.status, data.error_message);
    return [];
  }

  return data.results || [];
}

async function getPlaceDetails(placeId: string): Promise<Partial<PlaceResult> | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('key', API_KEY!);
  url.searchParams.set('fields', 'opening_hours,price_level,types,photos');

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status !== 'OK') {
    return null;
  }

  return data.result;
}

function getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${API_KEY}`;
}

async function fetchAllVenues(): Promise<Venue[]> {
  console.log('🔍 Fetching venues from Google Places API...\n');

  const allPlaces = new Map<string, { place: PlaceResult; neighborhood: string }>();

  // Search each neighborhood
  for (const { query, neighborhood } of SEARCH_QUERIES) {
    console.log(`  Searching: ${query}`);
    const places = await searchPlaces(query);
    console.log(`    Found ${places.length} results`);

    for (const place of places) {
      if (!allPlaces.has(place.place_id)) {
        allPlaces.set(place.place_id, { place, neighborhood });
      }
    }

    // Rate limiting - be nice to the API
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n📍 Total unique venues: ${allPlaces.size}`);
  console.log('🔎 Fetching details for top venues...\n');

  // Sort by rating and take top 50
  const sortedPlaces = Array.from(allPlaces.values())
    .filter(({ place }) => place.rating && place.rating >= 3.5)
    .sort((a, b) => (b.place.rating || 0) - (a.place.rating || 0))
    .slice(0, 50);

  const venues: Venue[] = [];

  for (const { place, neighborhood } of sortedPlaces) {
    // Get additional details
    const details = await getPlaceDetails(place.place_id);
    await new Promise(r => setTimeout(r, 100)); // Rate limit

    const types = details?.types || place.types || [];
    const cuisine = getCuisineFromTypes(types);
    const priceLevel = details?.price_level || place.price_level || 2;

    // Get photo URL if available
    let photoUrl: string | null = null;
    if (details?.photos?.[0]?.photo_reference) {
      photoUrl = getPhotoUrl(details.photos[0].photo_reference);
    } else if (place.photos?.[0]?.photo_reference) {
      photoUrl = getPhotoUrl(place.photos[0].photo_reference);
    }

    // Parse opening hours to guess happy hour days
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const venue: Venue = {
      id: place.place_id,
      name: place.name,
      neighborhood,
      address: place.formatted_address || place.vicinity || '',
      cuisine,
      dealText: generateDealText(priceLevel, cuisine),
      drinks: getDrinks(cuisine),
      food: getFood(cuisine),
      priceLevel,
      days,
      startTime: '4:00 PM',
      endTime: '7:00 PM',
      rating: place.rating || 4.0,
      ratingsCount: place.user_ratings_total || 0,
      image: getEmoji(cuisine),
      photoUrl,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      placeId: place.place_id,
      googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    };

    venues.push(venue);
    console.log(`  ✓ ${venue.name} (${venue.neighborhood})`);
  }

  return venues;
}

async function main() {
  // Check for API key
  if (!API_KEY) {
    console.log('⚠️  GOOGLE_PLACES_API_KEY not set.');
    console.log('   Using cached/fallback data.\n');

    // Check for cached data
    if (existsSync(CACHE_PATH)) {
      console.log('📦 Using cached venue data from previous build.');
      const cached = readFileSync(CACHE_PATH, 'utf-8');
      writeFileSync(OUTPUT_PATH, cached);
      return;
    }

    // Use the static fallback
    console.log('📦 Using static fallback venue data.');
    return;
  }

  try {
    const venues = await fetchAllVenues();

    // Save to generated file
    const output = JSON.stringify(venues, null, 2);
    writeFileSync(OUTPUT_PATH, output);
    writeFileSync(CACHE_PATH, output); // Cache for builds without API key

    console.log(`\n✅ Saved ${venues.length} venues to venues-generated.json`);
    console.log('   This data will be used for client-side search.');

  } catch (error) {
    console.error('❌ Error fetching venues:', error);

    // Try to use cache on error
    if (existsSync(CACHE_PATH)) {
      console.log('📦 Using cached venue data due to error.');
      const cached = readFileSync(CACHE_PATH, 'utf-8');
      writeFileSync(OUTPUT_PATH, cached);
    }
  }
}

main();
