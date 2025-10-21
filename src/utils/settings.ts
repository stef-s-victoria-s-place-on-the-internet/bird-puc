const SETTINGS_KEY = 'birdweather_settings';

export type TimeFormat = 'auto' | '12h' | '24h';

export interface Settings {
  timeFormat: TimeFormat;
  normalizeAudioUrls: boolean;
}

const defaultSettings: Settings = {
  timeFormat: 'auto',
  normalizeAudioUrls: true,
};

export const loadSettings = (): Settings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return defaultSettings;
};

export const saveSettings = (settings: Settings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

export const updateSetting = <K extends keyof Settings>(
  key: K,
  value: Settings[K]
): void => {
  const settings = loadSettings();
  settings[key] = value;
  saveSettings(settings);
};

