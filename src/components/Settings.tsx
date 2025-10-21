import { useState, useEffect } from 'react';
import { loadSettings, saveSettings, TimeFormat } from '../utils/settings';
import './Settings.css';

interface SettingsProps {
  onTimeFormatChange?: (format: TimeFormat) => void;
}

export function Settings({ onTimeFormatChange }: SettingsProps) {
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
    return loadSettings().timeFormat;
  });

  useEffect(() => {
    const settings = loadSettings();
    settings.timeFormat = timeFormat;
    saveSettings(settings);
    
    if (onTimeFormatChange) {
      onTimeFormatChange(timeFormat);
    }
  }, [timeFormat, onTimeFormatChange]);

  return (
    <div className="settings">
      <h3 className="settings-title">Settings</h3>
      
      <div className="setting-group">
        <label className="setting-label">Time Format</label>
        <div className="setting-options">
          <button
            className={`setting-option ${timeFormat === 'auto' ? 'active' : ''}`}
            onClick={() => setTimeFormat('auto')}
          >
            Auto
          </button>
          <button
            className={`setting-option ${timeFormat === '12h' ? 'active' : ''}`}
            onClick={() => setTimeFormat('12h')}
          >
            12h
          </button>
          <button
            className={`setting-option ${timeFormat === '24h' ? 'active' : ''}`}
            onClick={() => setTimeFormat('24h')}
          >
            24h
          </button>
        </div>
        <p className="setting-description">
          {timeFormat === 'auto' 
            ? 'Uses your system locale preference'
            : `Always displays time in ${timeFormat} format`
          }
        </p>
      </div>
    </div>
  );
}

