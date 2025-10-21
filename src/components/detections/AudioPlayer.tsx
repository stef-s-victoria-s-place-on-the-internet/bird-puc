import { Soundscape } from '../../types';
import { formatDuration, formatFileSize } from '../../utils/formatters';

interface AudioPlayerProps {
  soundscape: Soundscape | undefined;
  audioUrl: string | null;
}

export function AudioPlayer({ soundscape, audioUrl }: AudioPlayerProps) {
  if (!soundscape?.id || !audioUrl) {
    return <div className="audio-spacer"></div>;
  }

  const hasMetadata = soundscape.duration || 
    soundscape.startTime !== undefined || 
    soundscape.filesize || 
    soundscape.mode;

  return (
    <div className="audio-wrapper">
      <audio controls preload="none" className="audio-player">
        <source src={audioUrl} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      {hasMetadata && (
        <div className="audio-metadata">
          {soundscape.duration !== undefined && (
            <span className="audio-info" title="Duration">
              ⏱️ {formatDuration(soundscape.duration)}
            </span>
          )}
          {soundscape.startTime !== undefined && soundscape.endTime !== undefined && (
            <span className="audio-info" title="Detection window">
              📍 {soundscape.startTime.toFixed(1)}s - {soundscape.endTime.toFixed(1)}s
            </span>
          )}
          {soundscape.filesize !== undefined && (
            <span className="audio-info" title="File size">
              💾 {formatFileSize(soundscape.filesize)}
            </span>
          )}
          {soundscape.mode && (
            <span className="audio-info audio-mode" title="Recording mode">
              {soundscape.mode}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

