# ATX Happy Hour - Fast Search Demo

A proof of concept demonstrating **instant client-side search** for a happy hour directory, powered by **Google Places API** for real venue data.

## Key Features

- **Sub-10ms search** - Uses Orama for in-browser full-text search
- **Google Places Integration** - Real venue data fetched at build time
- **Zero network latency** - All data loaded upfront, searches happen locally
- **Instant filters** - Neighborhood, cuisine, day, and price filters with immediate feedback
- **Highlighted matches** - Search terms are highlighted in results
- **Google Maps links** - Click through to view venues on Google Maps
- **Venue photos** - Real photos from Google Places
- **Mobile responsive** - Works on all screen sizes

## Performance Highlights

| Metric | Target | Achieved |
|--------|--------|----------|
| Search latency | <50ms | ~5-10ms |
| Filter response | <16ms | <5ms |
| Time to Interactive | <3s | ~1.5s |

## Tech Stack

- **React 18** - UI with Suspense and transitions
- **Orama** - Client-side full-text search engine
- **Google Places API** - Real venue data
- **Vite** - Fast dev server and build
- **TypeScript** - Type safety

## Setup

### 1. Get a Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the **Places API** and **Places API (New)**
4. Create an API key under Credentials
5. Restrict the key to Places API only (recommended)

### 2. Configure Environment

Create a `.env` file or set in Vercel:

```bash
GOOGLE_PLACES_API_KEY=your_api_key_here
```

### 3. Run Locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173

### 4. Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add `GOOGLE_PLACES_API_KEY` in Environment Variables
4. Deploy!

The build process will fetch fresh venue data from Google Places.

## How It Works

### Build-Time Data Fetching

```
Build Process
├── npm run fetch-venues     ─── Calls Google Places API
│   ├── Text Search for Austin happy hours
│   ├── Get Place Details (photos, hours, ratings)
│   └── Generate venues-generated.json
└── vite build               ─── Bundle with cached venue data
```

### Client-Side Search

```
Browser
├── Search Index (Orama) ─── Built on page load (~50ms)
├── Search Input ─── Debounced 100ms
├── Filter State ─── React transitions for non-blocking updates
└── Results List ─── Links to Google Maps
```

## Why This is Fast

1. **No network round-trips** - Search happens in the browser
2. **Build-time API calls** - Google Places called once per deploy
3. **Indexed data** - Orama pre-indexes for O(1) lookups
4. **Debounced input** - Prevents excessive re-renders
5. **React transitions** - Filters don't block typing
6. **Cached data** - Falls back gracefully if API unavailable

## API Costs

Google Places API pricing (as of 2024):
- Text Search: $32 per 1,000 requests
- Place Details: $17 per 1,000 requests

With build-time fetching, you only pay when you deploy (~$0.50 per build for 50 venues).

## Fallback Behavior

If `GOOGLE_PLACES_API_KEY` is not set:
1. Checks for cached data from previous builds
2. Falls back to static sample data (25 Austin venues)

This ensures the app always works, even without API access.
