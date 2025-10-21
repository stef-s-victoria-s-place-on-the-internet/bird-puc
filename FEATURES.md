# Bird Detection Viewer - Features

## 📐 Layout

### Collapsible Sidebar
- **Fixed Position**: Left sidebar that stays in place while scrolling
- **Toggle Button**: Expand/collapse sidebar with arrow button
- **Collapsed State**: Reduces to 60px width showing only toggle
- **Persistent State**: Sidebar state saved to localStorage
- **Mobile Responsive**: Automatically adapts on mobile devices
- **Smooth Animations**: Transitions for expand/collapse actions

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
- `src/utils/localStorage.ts` - LocalStorage utilities
- Updated `src/types.ts` - Added filter types
- Updated `src/api/graphql.ts` - Added stations query
- Updated `src/components/DetectionsList.tsx` - Integrated filters

### Key Features:
- TypeScript for type safety
- React hooks (useState, useEffect, useRef, useCallback)
- GraphQL integration with server-side filtering
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

2. **Filter by Station**:
   - Open the sidebar if collapsed
   - Click the station search input
   - Type to search or view recent searches
   - Click a station to add it to filters
   - Detections automatically update

3. **Manage Filters**:
   - Click × on a tag to remove a station
   - Click "Clear All" to remove all filters
   - Filters persist automatically
   - Works seamlessly with date changes

4. **Search History**:
   - Recent searches appear when input is focused
   - Click × on history items to remove them
   - History limited to 10 most recent items

## 📝 Future Enhancements (Ideas)

- Add species filtering
- Add confidence threshold slider
- Add date range selection
- Export filtered results
- Save filter presets
- Share filter URLs

