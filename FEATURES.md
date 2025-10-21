# Bird Detection Viewer - Features

## 📐 Layout

### Collapsible Sidebar
- **Fixed Position**: Left sidebar that stays in place while scrolling
- **Toggle Button**: Expand/collapse sidebar with arrow button
- **Collapsed State**: Reduces to 60px width showing only toggle
- **Persistent State**: Sidebar state saved to localStorage
- **Mobile Responsive**: Automatically adapts on mobile devices
- **Smooth Animations**: Transitions for expand/collapse actions
- **Organized Sections**: Calendar → Filters → Settings with dividers

### Calendar Date Selector
- **Visual Calendar**: Full month calendar view in sidebar
- **Interactive Selection**: Click any date to view detections
- **Today Indicator**: Blue highlight for current date
- **Selected State**: Purple highlight for selected date
- **Date Restrictions**: Cannot select future dates
- **Month Navigation**: Arrow buttons to browse months
- **Compact Display**: Fits perfectly in sidebar width

## 📥 Batch Download

### Download All Detections
- **Green Download Button**: Appears in header when detections are loaded
- **Organized by Species**: Creates folders for each bird species
- **Smart Naming**: Files named with timestamp and confidence percentage
- **Progress Indicator**: Shows download progress (e.g., "12/50")
- **Client-side Processing**: Everything happens in your browser (no server needed)

### File Structure
```
birdweather_2025-10-21.zip
├── American_Robin/
│   ├── 2025-10-21_08-15-32_95pct.mp3
│   ├── 2025-10-21_09-23-45_87pct.mp3
│   └── 2025-10-21_14-42-18_92pct.mp3
├── Blue_Jay/
│   ├── 2025-10-21_07-30-12_89pct.mp3
│   └── 2025-10-21_13-15-44_94pct.mp3
└── Northern_Cardinal/
    └── 2025-10-21_10-05-23_91pct.mp3
```

### Features:
- **Automatic Grouping**: Each species gets its own folder
- **Descriptive Filenames**: Date, time, and confidence in filename
- **Smart ZIP Naming**: Includes date and filter status
- **Error Handling**: Continues if individual files fail
- **Live Progress**: Real-time download counter

## ⚙️ Settings

### Time Format Preferences
- **Auto Mode**: Uses your browser/system locale preference
- **12-Hour Format**: Always displays times with AM/PM (e.g., 3:45:12 PM)
- **24-Hour Format**: Always displays times in 24h format (e.g., 15:45:12)
- **Persistent**: Choice saved to localStorage
- **Real-time Update**: Changes apply immediately to all timestamps
- **Visual Buttons**: Three-button toggle with active state indicator

## 🔍 Search & Filter System

### Station Filtering
- **Server-side Search**: Type to search stations with real-time API queries
- **Debounced Input**: 300ms delay to reduce API calls while typing
- **Multi-select**: Add multiple stations to filter detections
- **Visual Tags**: Selected stations appear as removable tags
- **Real-time Updates**: Detection list updates automatically when filters change
- **Smart Results**: Shows top 50 matching stations from server

### Search History
- **Recent Searches**: Previous station searches are saved and displayed
- **Quick Access**: Click on recent searches to re-apply filters
- **History Management**: Remove individual items from history
- **Limit**: Keeps the 10 most recent searches

### Persistence
- **LocalStorage**: All filters are saved to browser storage
- **Auto-restore**: Filters are automatically restored on page reload
- **Clear All**: Easy button to clear all active filters
- **Session Continuity**: Your filter preferences persist across sessions

## 📊 Active Filter Indicators

- **Count Badge**: Shows number of active filters
- **Summary Bar**: Displays filter summary at bottom of filter panel
- **Visual Feedback**: Selected stations highlighted with color-coded tags

## 🎨 UI/UX Features

### Filter Panel
- Glassmorphic design with backdrop blur
- Smooth animations on interactions
- Dropdown with keyboard navigation support
- Click-outside to close dropdown
- Responsive design for mobile/tablet

### Search Dropdown
- Shows up to 50 results at once
- Infinite scroll support
- Recent searches section at top
- Empty state messaging
- Loading indicators

### Filter Tags
- Color-coded for easy identification
- Hover effects for better UX
- One-click removal
- Icon indicators (📍 for stations, 🕒 for history)

## 🛠️ Technical Implementation

### Files Created:
- `src/components/SearchFilters.tsx` - Main filter component
- `src/components/SearchFilters.css` - Filter styling
- `src/components/Settings.tsx` - Settings panel
- `src/components/Settings.css` - Settings styling
- `src/utils/localStorage.ts` - Filter persistence utilities
- `src/utils/settings.ts` - Settings management
- Updated `src/types.ts` - Added filter types
- Updated `src/api/graphql.ts` - Added stations query
- Updated `src/components/DetectionsList.tsx` - Integrated filters & settings
- Updated `src/components/Sidebar.tsx` - Added settings section

### Key Features:
- TypeScript for type safety
- React hooks (useState, useEffect, useRef, useCallback)
- GraphQL integration with server-side filtering
- Client-side ZIP creation with JSZip
- Batch file download with progress tracking
- Debounced search input (300ms)
- LocalStorage persistence
- Search history management (recent 5 stations)
- Responsive design
- Optimized API calls

## 🚀 Usage

1. **Sidebar Navigation**:
   - Click the arrow button (← / →) to collapse/expand the sidebar
   - On mobile, tap outside the sidebar to close it
   - Sidebar state persists across sessions

2. **Date Selection**:
   - Open the sidebar to see the calendar
   - Click any date to load detections for that day
   - Use arrow buttons to navigate between months
   - Current date is highlighted in blue
   - Selected date shows in purple

3. **Filter by Station**:
   - Open the sidebar if collapsed
   - Click the station search input
   - Type to search or view recent searches
   - Click a station to add it to filters
   - Detections automatically update

4. **Manage Filters**:
   - Click × on a tag to remove a station
   - Click "Clear All" to remove all filters
   - Filters persist automatically
   - Works seamlessly with date changes

5. **Search History**:
   - Recent searches appear when input is focused
   - Click × on history items to remove them
   - History limited to 10 most recent items

6. **Settings**:
   - Scroll down in the sidebar to access settings
   - Change time format preference (Auto/12h/24h)
   - Settings save automatically
   - Changes apply immediately to all detections

7. **Download All**:
   - Click the green "Download All" button in the header
   - Wait for the download progress to complete
   - ZIP file will automatically download to your browser's download folder
   - Files are organized by species in separate folders

## 📝 Future Enhancements (Ideas)

- Add species filtering
- Add confidence threshold slider
- Add date range selection
- Add more settings (theme, units, etc.)
- Export metadata as CSV/JSON
- Selective download (choose species)
- Save filter presets
- Share filter URLs
- Dark/Light mode toggle
- Include detection metadata in ZIP

