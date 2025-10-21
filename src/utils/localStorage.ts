import { FilterState, SearchHistoryItem } from '../types';

const FILTERS_KEY = 'birdweather_filters';
const SEARCH_HISTORY_KEY = 'birdweather_search_history';
const MAX_HISTORY_ITEMS = 10;

export const saveFilters = (filters: FilterState): void => {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error('Failed to save filters to localStorage:', error);
  }
};

export const loadFilters = (): FilterState | null => {
  try {
    const stored = localStorage.getItem(FILTERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load filters from localStorage:', error);
  }
  return null;
};

export const clearFilters = (): void => {
  try {
    localStorage.removeItem(FILTERS_KEY);
  } catch (error) {
    console.error('Failed to clear filters from localStorage:', error);
  }
};

export const addToSearchHistory = (item: Omit<SearchHistoryItem, 'timestamp'>): void => {
  try {
    const history = getSearchHistory();
    
    // Remove duplicates
    const filtered = history.filter(
      h => !(h.type === item.type && h.id === item.id)
    );
    
    // Add new item to the beginning
    const newHistory = [
      { ...item, timestamp: Date.now() },
      ...filtered
    ].slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Failed to add to search history:', error);
  }
};

export const getSearchHistory = (): SearchHistoryItem[] => {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load search history:', error);
  }
  return [];
};

export const clearSearchHistory = (): void => {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
};

export const removeFromSearchHistory = (id: string, type: string): void => {
  try {
    const history = getSearchHistory();
    const filtered = history.filter(h => !(h.id === id && h.type === type));
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove from search history:', error);
  }
};

