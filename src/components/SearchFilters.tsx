import { useState, useEffect, useRef } from 'react';
import { graphqlClient, STATIONS_QUERY } from '../api/graphql';
import { StationsResponse, Station, FilterState, SearchHistoryItem } from '../types';
import { 
  saveFilters, 
  loadFilters, 
  clearFilters,
  addToSearchHistory,
  getSearchHistory,
  removeFromSearchHistory 
} from '../utils/localStorage';
import './SearchFilters.css';

interface SearchFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
}

export function SearchFilters({ onFiltersChange }: SearchFiltersProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStations, setSelectedStations] = useState<Station[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  // Load filters from localStorage on mount
  useEffect(() => {
    const savedFilters = loadFilters();
    if (savedFilters && savedFilters.stationIds.length > 0) {
      // Reconstruct selected stations from saved data
      const stations = savedFilters.stationIds.map((id, index) => ({
        id,
        name: savedFilters.stationNames[index] || `Station ${id}`,
      }));
      setSelectedStations(stations);
    }
    
    setSearchHistory(getSearchHistory());
  }, []);

  // Fetch stations based on search query with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchStations(searchQuery);
      }, 300); // 300ms debounce
    } else {
      // Clear stations when search is empty
      setStations([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update filters when selected stations change
  useEffect(() => {
    const filters: FilterState = {
      stationIds: selectedStations.map(s => s.id),
      stationNames: selectedStations.map(s => s.name),
    };
    
    saveFilters(filters);
    onFiltersChange(filters);
  }, [selectedStations, onFiltersChange]);

  const fetchStations = async (query: string) => {
    setLoading(true);
    try {
      const variables: { first: number; query?: string } = {
        first: 50,
      };
      
      if (query && query.trim().length > 0) {
        variables.query = query.trim();
      }

      const data = await graphqlClient.request<StationsResponse>(
        STATIONS_QUERY,
        variables
      );
      setStations(data.stations.nodes);
    } catch (error) {
      console.error('Error fetching stations:', error);
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowDropdown(query.length > 0);
    setShowHistory(query.length === 0);
  };

  const handleSearchFocus = () => {
    if (searchQuery.length === 0) {
      setShowHistory(true);
    } else {
      setShowDropdown(true);
    }
  };

  const handleStationSelect = (station: Station) => {
    if (!selectedStations.find(s => s.id === station.id)) {
      setSelectedStations([...selectedStations, station]);
      addToSearchHistory({ type: 'station', id: station.id, name: station.name });
      setSearchHistory(getSearchHistory());
    }
    setSearchQuery('');
    setShowDropdown(false);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const handleStationRemove = (stationId: string) => {
    setSelectedStations(selectedStations.filter(s => s.id !== stationId));
  };

  const handleClearAll = () => {
    setSelectedStations([]);
    clearFilters();
    setSearchQuery('');
  };

  const handleRemoveFromHistory = (id: string, type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromSearchHistory(id, type);
    setSearchHistory(getSearchHistory());
  };

  // Filter out already selected stations
  const availableStations = stations.filter(station =>
    !selectedStations.find(s => s.id === station.id)
  );

  const historyStations = searchHistory
    .filter(h => h.type === 'station')
    .filter(h => !selectedStations.find(s => s.id === h.id))
    .slice(0, 5); // Show only 5 most recent

  return (
    <div className="search-filters">
      {selectedStations.length > 0 && (
        <div className="filters-header">
          <button onClick={handleClearAll} className="clear-all-btn">
            Clear All
          </button>
        </div>
      )}

      <div className="filter-section">
        <label htmlFor="station-search">Station</label>
        <div className="search-input-wrapper" ref={dropdownRef}>
          <input
            ref={inputRef}
            id="station-search"
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            placeholder="Search stations..."
            className="search-input"
          />
          
          {(showDropdown || showHistory) && (
            <div className="search-dropdown">
              {showHistory && historyStations.length > 0 && (
                <div className="history-section">
                  <div className="history-header">Recent Searches</div>
                  {historyStations.map(item => (
                    <div
                      key={item.id}
                      className="dropdown-item history-item"
                      onClick={() => handleStationSelect({ id: item.id, name: item.name })}
                    >
                      <span className="history-icon">🕒</span>
                      <span className="station-name">{item.name}</span>
                      <button
                        className="remove-history-btn"
                        onClick={(e) => handleRemoveFromHistory(item.id, 'station', e)}
                        aria-label="Remove from history"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {showDropdown && (
                <>
                  {loading ? (
                    <div className="dropdown-loading">
                      <div className="mini-spinner"></div>
                      <span>Searching...</span>
                    </div>
                  ) : searchQuery.length === 0 ? (
                    <div className="dropdown-info">Type to search stations...</div>
                  ) : availableStations.length > 0 ? (
                    <div className="stations-list">
                      {availableStations.map(station => (
                        <div
                          key={station.id}
                          className="dropdown-item"
                          onClick={() => handleStationSelect(station)}
                        >
                          <span className="station-icon">📍</span>
                          <span className="station-name">{station.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="dropdown-empty">No stations found for "{searchQuery}"</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {selectedStations.length > 0 && (
          <div className="selected-items">
            {selectedStations.map(station => (
              <div key={station.id} className="selected-tag">
                <span className="tag-icon">📍</span>
                <span className="tag-name">{station.name}</span>
                <button
                  onClick={() => handleStationRemove(station.id)}
                  className="tag-remove"
                  aria-label={`Remove ${station.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedStations.length > 0 && (
        <div className="active-filters-summary">
          Filtering by {selectedStations.length} {selectedStations.length === 1 ? 'station' : 'stations'}
        </div>
      )}
    </div>
  );
}

