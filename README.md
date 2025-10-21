# Bird PUC - BirdWeather Detection Viewer

A beautiful React application for viewing bird detections from the BirdWeather API.

## Features

- 🐦 View bird detections by date
- 📅 **Calendar picker in sidebar** - Visual date selection
- 🔍 Collapsible sidebar with advanced filters
- 🎯 Filter by station with search and history
- ⚙️ Customizable settings (time format)
- 🕐 Choose between 12h, 24h, or auto time format
- 🎵 Listen to bird soundscapes
- 📥 **Download all audio files as ZIP** - Organized by species
- 📊 See detection confidence scores
- 📍 View detection locations and stations
- 🎨 Modern, responsive UI with gradient backgrounds
- 💾 Persistent preferences with localStorage
- ⚡ **Smart caching with React Query** - Lightning-fast page loads
- 🔄 **Automatic background refresh** - Always up-to-date data
- 💽 **IndexedDB persistence** - Cache survives page refreshes
- 🌐 **Offline support** - View cached data without internet

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Configure your API key:
   - Copy your BirdWeather API key
   - Create a `.env` file in the root directory
   - Add: `VITE_BIRDWEATHER_API_KEY=your_api_key_here`

3. Start the development server:
   ```bash
   bun run dev
   ```

4. Open your browser to the URL shown in the terminal (usually `http://localhost:5173`)

## API

This application uses the [BirdWeather GraphQL API](https://app.birdweather.com/api/index.html) to fetch bird detection data.

## Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **GraphQL** - API query language
- **TanStack Query** - Data fetching and caching
- **date-fns** - Date utilities
- **Bun** - Package manager and runtime

## Project Structure

```
src/
├── api/
│   └── graphql.ts          # GraphQL client and queries
├── components/
│   ├── DatePicker.tsx      # Date selection component
│   ├── DatePicker.css
│   ├── DetectionsList.tsx  # Main detections list view
│   ├── DetectionsList.css
│   ├── Sidebar.tsx         # Collapsible sidebar container
│   ├── Sidebar.css
│   ├── SearchFilters.tsx   # Filter components
│   ├── SearchFilters.css
│   ├── Settings.tsx        # Settings panel
│   └── Settings.css
├── utils/
│   ├── localStorage.ts     # Filter persistence utilities
│   └── settings.ts         # Settings management
├── types.ts                # TypeScript type definitions
├── App.tsx                 # Main app component
└── main.tsx               # Entry point
```

## Caching

This app features intelligent caching for optimal performance:

- **Instant page loads** - Previously viewed data loads instantly from cache
- **Background updates** - Fresh data fetched automatically in the background
- **Persistent storage** - Cache survives browser restarts (24-hour expiry)
- **Smart invalidation** - Cache automatically refreshes when stale

For more details, see [CACHING.md](./CACHING.md).

## Development

- `bun run dev` - Start development server with React Query DevTools
- `bun run build` - Build for production
- `bun run preview` - Preview production build
- `bun run lint` - Run ESLint
