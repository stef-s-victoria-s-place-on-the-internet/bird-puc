import { useState, useEffect } from 'react';
import { SearchFilters } from './SearchFilters';
import { Settings } from './Settings';
import { DateSelector } from './DateSelector';
import { FilterState } from '../types';
import { TimeFormat } from '../utils/settings';
import './Sidebar.css';

interface SidebarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onFiltersChange: (filters: FilterState) => void;
  onTimeFormatChange?: (format: TimeFormat) => void;
  dayCounts?: Record<string, number>;
}

const SIDEBAR_STATE_KEY = 'birdweather_sidebar_collapsed';

export function Sidebar({ selectedDate, onDateChange, onFiltersChange, onTimeFormatChange, dayCounts = {} }: SidebarProps) {
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
            <div className="sidebar-divider" />
            <SearchFilters onFiltersChange={onFiltersChange} />
            <div className="sidebar-divider" />
            <Settings onTimeFormatChange={onTimeFormatChange} />
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

