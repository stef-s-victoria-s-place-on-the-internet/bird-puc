import { TimeFormat } from './settings';

/**
 * Format date for API in local timezone
 */
export const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
};

/**
 * Format time based on user preference
 */
export const formatTime = (timestamp: string, timeFormat: TimeFormat): string => {
  const date = new Date(timestamp);
  
  let hour12: boolean | undefined = undefined;
  if (timeFormat === '12h') {
    hour12 = true;
  } else if (timeFormat === '24h') {
    hour12 = false;
  }
  // If 'auto', leave undefined to use locale default
  
  return date.toLocaleTimeString(navigator.language, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: hour12
  });
};

/**
 * Format confidence as percentage
 */
export const formatConfidence = (confidence: number): string => {
  return `${(confidence * 100).toFixed(1)}%`;
};

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Format duration in minutes:seconds
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds);
  const secs = Math.floor((seconds - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

