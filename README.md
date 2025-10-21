# Bird PUC - BirdWeather Detection Viewer

A beautiful React application for viewing bird detections from the BirdWeather API.

## Features

- 🐦 View bird detections by date
- 📅 Easy date navigation with date picker
- 🔍 Collapsible sidebar with advanced filters
- 🎯 Filter by station with search and history
- 🎵 Listen to bird soundscapes
- 📊 See detection confidence scores
- 📍 View detection locations and stations
- 🎨 Modern, responsive UI with gradient backgrounds
- 💾 Filter persistence with localStorage

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
│   └── SearchFilters.css
├── utils/
│   └── localStorage.ts     # LocalStorage utilities
├── types.ts                # TypeScript type definitions
├── App.tsx                 # Main app component
└── main.tsx               # Entry point
```

## Development

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview production build
- `bun run lint` - Run ESLint
