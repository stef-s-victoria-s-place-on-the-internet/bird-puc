import { Soundscape } from '../../types';

interface AudioPlayerProps {
  soundscape: Soundscape | undefined;
  audioUrl: string | null;
}

export function AudioPlayer({ soundscape, audioUrl }: AudioPlayerProps) {
  if (!soundscape?.id || !audioUrl) {
    return <div className="audio-spacer"></div>;
  }

  return (
    <div className="audio-wrapper">
      <audio controls preload="none" className="audio-player">
        <source src={audioUrl} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}

