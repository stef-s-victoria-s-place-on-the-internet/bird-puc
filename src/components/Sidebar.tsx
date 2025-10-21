import { useState, useEffect } from 'react';
import { SearchFilters } from './SearchFilters';
import { Settings } from './Settings';
import { DateSelector } from './DateSelector';
import { FilterState, Species } from '../types';
import { TimeFormat } from '../utils/settings';
import './Sidebar.css';

interface SidebarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onFiltersChange: (filters: FilterState) => void;
  onTimeFormatChange?: (format: TimeFormat) => void;
  onNormalizeAudioUrlsChange?: (enabled: boolean) => void;
  dayCounts?: Record<string, number>;
  availableSpecies?: Species[];
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

const SIDEBAR_STATE_KEY = 'birdweather_sidebar_collapsed';

export function Sidebar({ selectedDate, onDateChange, onFiltersChange, onTimeFormatChange, onNormalizeAudioUrlsChange, dayCounts = {}, availableSpecies = [], pageSize, onPageSizeChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!isCollapsed && <h2>Filters</h2>}
          <button 
            className="sidebar-toggle" 
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
        
        {!isCollapsed && (
          <div className="sidebar-content">
            <DateSelector selectedDate={selectedDate} onDateChange={onDateChange} dayCounts={dayCounts} />
            <SearchFilters onFiltersChange={onFiltersChange} availableSpecies={availableSpecies} />
            <Settings onTimeFormatChange={onTimeFormatChange} onNormalizeAudioUrlsChange={onNormalizeAudioUrlsChange} pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="sidebar-overlay" 
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}

