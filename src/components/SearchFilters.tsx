import { useState, useEffect, useRef } from 'react';
import { graphqlClient, STATIONS_QUERY } from '../api/graphql';
import { StationsResponse, Station, FilterState, SearchHistoryItem, Species } from '../types';
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
  availableSpecies: Species[];
}

export function SearchFilters({ onFiltersChange, availableSpecies }: SearchFiltersProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStations, setSelectedStations] = useState<Station[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // New filter states
  const [speciesSearchQuery, setSpeciesSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<Species[]>([]);
  const [showSpeciesDropdown, setShowSpeciesDropdown] = useState(false);
  const [minConfidence, setMinConfidence] = useState(0);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<('morning' | 'afternoon' | 'evening' | 'night')[]>([]);
  const [sortBy, setSortBy] = useState<FilterState['sortBy']>('time-desc');
  const speciesDropdownRef = useRef<HTMLDivElement>(null);
  const speciesInputRef = useRef<HTMLInputElement>(null);

  // Load filters from localStorage on mount
  useEffect(() => {
    const savedFilters = loadFilters();
    if (savedFilters) {
      if (savedFilters.stationIds.length > 0) {
        // Reconstruct selected stations from saved data
        const stations = savedFilters.stationIds.map((id, index) => ({
          id,
          name: savedFilters.stationNames[index] || `Station ${id}`,
        }));
        setSelectedStations(stations);
      }
      
      // Load other filter states
      if (savedFilters.speciesIds && savedFilters.speciesIds.length > 0) {
        const species = savedFilters.speciesIds.map((id, index) => ({
          id,
          commonName: savedFilters.speciesNames[index] || `Species ${id}`,
          scientificName: '',
          color: '#ffffff',
        }));
        setSelectedSpecies(species);
      }
      
      if (savedFilters.minConfidence !== undefined) {
        setMinConfidence(savedFilters.minConfidence);
      }
      
      if (savedFilters.timeOfDay) {
        setSelectedTimeOfDay(savedFilters.timeOfDay);
      }
      
      if (savedFilters.sortBy) {
        setSortBy(savedFilters.sortBy);
      }
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
      if (speciesDropdownRef.current && !speciesDropdownRef.current.contains(event.target as Node)) {
        setShowSpeciesDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update filters when any filter changes
  useEffect(() => {
    const filters: FilterState = {
      stationIds: selectedStations.map(s => s.id),
      stationNames: selectedStations.map(s => s.name),
      speciesIds: selectedSpecies.map(s => s.id),
      speciesNames: selectedSpecies.map(s => s.commonName),
      minConfidence,
      timeOfDay: selectedTimeOfDay,
      sortBy,
    };
    
    saveFilters(filters);
    onFiltersChange(filters);
  }, [selectedStations, selectedSpecies, minConfidence, selectedTimeOfDay, sortBy, onFiltersChange]);

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
    setSelectedSpecies([]);
    setMinConfidence(0);
    setSelectedTimeOfDay([]);
    setSortBy('time-desc');
    clearFilters();
    setSearchQuery('');
    setSpeciesSearchQuery('');
  };
  
  // Species filter handlers
  const handleSpeciesSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSpeciesSearchQuery(query);
    setShowSpeciesDropdown(query.length > 0 || availableSpecies.length > 0);
  };

  const handleSpeciesSearchFocus = () => {
    setShowSpeciesDropdown(true);
  };

  const handleSpeciesSelect = (species: Species) => {
    if (!selectedSpecies.find(s => s.id === species.id)) {
      setSelectedSpecies([...selectedSpecies, species]);
      addToSearchHistory({ type: 'species', id: species.id, name: species.commonName });
      setSearchHistory(getSearchHistory());
    }
    setSpeciesSearchQuery('');
    setShowSpeciesDropdown(false);
    speciesInputRef.current?.focus();
  };

  const handleSpeciesRemove = (speciesId: string) => {
    setSelectedSpecies(selectedSpecies.filter(s => s.id !== speciesId));
  };
  
  // Time of day filter handler
  const handleTimeOfDayToggle = (period: 'morning' | 'afternoon' | 'evening' | 'night') => {
    setSelectedTimeOfDay(prev => 
      prev.includes(period) 
        ? prev.filter(p => p !== period)
        : [...prev, period]
    );
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
  
  const historySpecies = searchHistory
    .filter(h => h.type === 'species')
    .filter(h => !selectedSpecies.find(s => s.id === h.id))
    .slice(0, 5);

  // Filter available species based on search query
  const filteredSpecies = availableSpecies.filter(species => {
    if (!speciesSearchQuery) return true;
    const query = speciesSearchQuery.toLowerCase();
    return (
      species.commonName.toLowerCase().includes(query) ||
      species.scientificName.toLowerCase().includes(query)
    );
  }).filter(species => !selectedSpecies.find(s => s.id === species.id));

  const hasActiveFilters = selectedStations.length > 0 || selectedSpecies.length > 0 || 
                           minConfidence > 0 || selectedTimeOfDay.length > 0;

  return (
    <div className="search-filters">
      {hasActiveFilters && (
        <div className="filters-header">
          <button onClick={handleClearAll} className="clear-all-btn">
            Clear All Filters
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

      {/* Species Filter */}
      <div className="filter-section">
        <label htmlFor="species-search">Species</label>
        <div className="search-input-wrapper" ref={speciesDropdownRef}>
          <input
            ref={speciesInputRef}
            id="species-search"
            type="text"
            value={speciesSearchQuery}
            onChange={handleSpeciesSearchChange}
            onFocus={handleSpeciesSearchFocus}
            placeholder="Search species..."
            className="search-input"
            disabled={availableSpecies.length === 0}
          />
          
          {showSpeciesDropdown && availableSpecies.length > 0 && (
            <div className="search-dropdown">
              {speciesSearchQuery.length === 0 && historySpecies.length > 0 && (
                <div className="history-section">
                  <div className="history-header">Recent Searches</div>
                  {historySpecies.map(item => (
                    <div
                      key={item.id}
                      className="dropdown-item history-item"
                      onClick={() => {
                        const species = availableSpecies.find(s => s.id === item.id);
                        if (species) handleSpeciesSelect(species);
                      }}
                    >
                      <span className="history-icon">🕒</span>
                      <span className="station-name">{item.name}</span>
                      <button
                        className="remove-history-btn"
                        onClick={(e) => handleRemoveFromHistory(item.id, 'species', e)}
                        aria-label="Remove from history"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {filteredSpecies.length > 0 ? (
                <div className="stations-list">
                  {filteredSpecies.slice(0, 50).map(species => (
                    <div
                      key={species.id}
                      className="dropdown-item species-item"
                      onClick={() => handleSpeciesSelect(species)}
                    >
                      <span className="species-icon">🐦</span>
                      <div className="species-info-dropdown">
                        <span className="species-common">{species.commonName}</span>
                        <span className="species-scientific">{species.scientificName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : speciesSearchQuery.length > 0 ? (
                <div className="dropdown-empty">No species found for "{speciesSearchQuery}"</div>
              ) : (
                <div className="dropdown-info">Start typing to search species...</div>
              )}
            </div>
          )}
        </div>

        {selectedSpecies.length > 0 && (
          <div className="selected-items">
            {selectedSpecies.map(species => (
              <div key={species.id} className="selected-tag">
                <span className="tag-icon">🐦</span>
                <span className="tag-name">{species.commonName}</span>
                <button
                  onClick={() => handleSpeciesRemove(species.id)}
                  className="tag-remove"
                  aria-label={`Remove ${species.commonName}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confidence Filter */}
      <div className="filter-section">
        <label htmlFor="confidence-slider">
          Minimum Confidence: {minConfidence}%
        </label>
        <input
          id="confidence-slider"
          type="range"
          min="0"
          max="100"
          step="5"
          value={minConfidence}
          onChange={(e) => setMinConfidence(Number(e.target.value))}
          className="confidence-slider"
        />
        <div className="slider-labels">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Time of Day Filter */}
      <div className="filter-section">
        <label>Time of Day</label>
        <div className="time-of-day-filters">
          {[
            { value: 'morning' as const, label: '🌅 Morning (5-12)', time: '5 AM - 12 PM' },
            { value: 'afternoon' as const, label: '☀️ Afternoon (12-17)', time: '12 PM - 5 PM' },
            { value: 'evening' as const, label: '🌆 Evening (17-21)', time: '5 PM - 9 PM' },
            { value: 'night' as const, label: '🌙 Night (21-5)', time: '9 PM - 5 AM' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleTimeOfDayToggle(value)}
              className={`time-filter-btn ${selectedTimeOfDay.includes(value) ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div className="filter-section">
        <label htmlFor="sort-select">Sort By</label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as FilterState['sortBy'])}
          className="sort-select"
        >
          <option value="time-desc">Time (Newest First)</option>
          <option value="time-asc">Time (Oldest First)</option>
          <option value="confidence-desc">Confidence (Highest First)</option>
          <option value="confidence-asc">Confidence (Lowest First)</option>
          <option value="species-asc">Species (A-Z)</option>
          <option value="species-desc">Species (Z-A)</option>
        </select>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="active-filters-summary">
          {selectedStations.length > 0 && (
            <div>📍 {selectedStations.length} {selectedStations.length === 1 ? 'station' : 'stations'}</div>
          )}
          {selectedSpecies.length > 0 && (
            <div>🐦 {selectedSpecies.length} {selectedSpecies.length === 1 ? 'species' : 'species'}</div>
          )}
          {minConfidence > 0 && (
            <div>📊 Min confidence: {minConfidence}%</div>
          )}
          {selectedTimeOfDay.length > 0 && (
            <div>🕐 {selectedTimeOfDay.length} time {selectedTimeOfDay.length === 1 ? 'period' : 'periods'}</div>
          )}
        </div>
      )}
    </div>
  );
}

