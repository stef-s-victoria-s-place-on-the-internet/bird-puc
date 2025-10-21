/**
 * Get audio URL with optional normalization
 */
export const getAudioUrl = (url: string, normalize: boolean): string => {
  if (normalize) {
    return url
      .replace('/soundscapes/', '/soundscapes/normalize/')
      .replace('media.birdweather', 'app.birdweather');
  }
  return url;
};

