import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, ChevronDown, Volume2, Gauge } from 'lucide-react';
import { getAudioUrl } from '@/utils/s3Utils';

interface AudioPlayerProps {
  audioSrc: string;
  downloadUrl?: string;
  fileName?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioSrc, downloadUrl, fileName }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedSlider, setShowSpeedSlider] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const src = getAudioUrl(audioSrc);
  const download = downloadUrl || src;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    // Set initial volume and playback rate
    audio.volume = volume;
    audio.playbackRate = playbackRate;

    // Events
    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);

    // Cleanup
    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
    };
  }, []);

  // Update volume when volume state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  // Update playback rate when playbackRate state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Close sliders when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.audio-player')) {
        setShowVolumeSlider(false);
        setShowSpeedSlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseFloat(e.target.value);
    setPlaybackRate(newSpeed);
  };

  const toggleVolumeSlider = () => {
    setShowVolumeSlider(!showVolumeSlider);
    setShowSpeedSlider(false); // Close speed slider when opening volume
  };

  const toggleSpeedSlider = () => {
    setShowSpeedSlider(!showSpeedSlider);
    setShowVolumeSlider(false); // Close volume slider when opening speed
  };



  // Format time in mm:ss
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-player bg-parchment rounded-lg p-3 sm:p-4 shadow-md flex flex-col relative">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Main audio controls */}
      <div className="flex items-center gap-2">
        {/* Play button */}
        <button 
          onClick={togglePlay}
          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-biblical-burgundy rounded-full text-white flex-shrink-0"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={14} className="sm:w-[18px] sm:h-[18px]" /> : <Play size={14} className="sm:w-[18px] sm:h-[18px]" />}
        </button>

        {/* Progress bar */}
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleProgressChange}
          className="flex-1 h-2 bg-parchment-dark rounded-md appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 sm:[&::-webkit-slider-thumb]:h-4 sm:[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-biblical-burgundy"
          aria-label="Audio progress"
        />

        {/* Time display */}
        <div className="text-xs sm:text-sm text-biblical-brown flex-shrink-0 min-w-[60px] sm:min-w-[70px]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Volume control */}
        <button 
          onClick={toggleVolumeSlider}
          className="flex items-center justify-center w-8 h-8 text-biblical-navy hover:text-biblical-burgundy transition-colors flex-shrink-0"
          aria-label="Volume control"
        >
          <Volume2 size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>

        {/* Speed control */}
        <button 
          onClick={toggleSpeedSlider}
          className="flex items-center justify-center w-8 h-8 text-biblical-navy hover:text-biblical-burgundy transition-colors flex-shrink-0"
          aria-label="Playback speed"
        >
          <Gauge size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>

        {/* Download button */}
        <a 
          href={download}
          download={fileName || 'audio.mp3'}
          className="flex items-center justify-center w-8 h-8 text-biblical-navy hover:text-biblical-burgundy transition-colors flex-shrink-0"
          aria-label="Download audio"
        >
          <ChevronDown size={16} className="sm:w-[18px] sm:h-[18px]" />
        </a>
      </div>

      {/* Volume slider */}
      {showVolumeSlider && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-parchment-dark rounded-lg p-3 shadow-lg z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-biblical-brown">Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-2 bg-parchment-dark rounded-md appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-biblical-burgundy"
              aria-label="Volume level"
            />
            <span className="text-xs text-biblical-brown">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}

      {/* Speed slider */}
      {showSpeedSlider && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-parchment-dark rounded-lg p-3 shadow-lg z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-biblical-brown">Speed:</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={playbackRate}
              onChange={handleSpeedChange}
              className="w-20 h-2 bg-parchment-dark rounded-md appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-biblical-burgundy"
              aria-label="Playback speed"
            />
            <span className="text-xs text-biblical-brown">{playbackRate}x</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
