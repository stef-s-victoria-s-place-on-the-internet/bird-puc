import { useState, useEffect } from 'react';
import { loadSettings, saveSettings, TimeFormat } from '../utils/settings';
import './Settings.css';

interface SettingsProps {
  onTimeFormatChange?: (format: TimeFormat) => void;
  onNormalizeAudioUrlsChange?: (enabled: boolean) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

export function Settings({ onTimeFormatChange, onNormalizeAudioUrlsChange, pageSize, onPageSizeChange }: SettingsProps) {
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
    return loadSettings().timeFormat;
  });

  const [normalizeAudioUrls, setNormalizeAudioUrls] = useState<boolean>(() => {
    return loadSettings().normalizeAudioUrls;
  });

  useEffect(() => {
    const settings = loadSettings();
    settings.timeFormat = timeFormat;
    saveSettings(settings);
    
    if (onTimeFormatChange) {
      onTimeFormatChange(timeFormat);
    }
  }, [timeFormat, onTimeFormatChange]);

  useEffect(() => {
    const settings = loadSettings();
    settings.normalizeAudioUrls = normalizeAudioUrls;
    saveSettings(settings);
    
    if (onNormalizeAudioUrlsChange) {
      onNormalizeAudioUrlsChange(normalizeAudioUrls);
    }
  }, [normalizeAudioUrls, onNormalizeAudioUrlsChange]);

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

      <div className="setting-group">
        <label className="setting-label">Audio Normalization</label>
        <div className="setting-options">
          <button
            className={`setting-option ${normalizeAudioUrls ? 'active' : ''}`}
            onClick={() => setNormalizeAudioUrls(true)}
          >
            Enabled
          </button>
          <button
            className={`setting-option ${!normalizeAudioUrls ? 'active' : ''}`}
            onClick={() => setNormalizeAudioUrls(false)}
          >
            Disabled
          </button>
        </div>
        <p className="setting-description">
          {normalizeAudioUrls 
            ? 'Uses normalized audio URLs for better compatibility'
            : 'Uses original audio URLs from the API'
          }
        </p>
      </div>

      {pageSize !== undefined && onPageSizeChange && (
        <div className="setting-group">
          <label className="setting-label" htmlFor="page-size-setting">
            Page Size
          </label>
          <select
            id="page-size-setting"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="setting-select"
          >
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
            <option value={2500}>2500</option>
            <option value={5000}>5000</option>
          </select>
          <p className="setting-description">
            Number of detections to show per page
          </p>
        </div>
      )}
    </div>
  );
}

