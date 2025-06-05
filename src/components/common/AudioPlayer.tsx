import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download } from 'lucide-react';
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

    // Events
    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);

    // Cleanup
    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
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

  // Handle local download
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(download);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName || 'audio.mp3';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to direct link if fetch fails
      const a = document.createElement('a');
      a.href = download;
      a.download = fileName || 'audio.mp3';
      a.click();
    }
  };

  // Format time in mm:ss
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-parchment rounded-lg p-3 sm:p-4 shadow-md flex flex-col">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center min-w-0 flex-1">
          <button 
            onClick={togglePlay}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-biblical-burgundy rounded-full text-white mr-2 sm:mr-4 flex-shrink-0"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={14} className="sm:w-[18px] sm:h-[18px]" /> : <Play size={14} className="sm:w-[18px] sm:h-[18px]" />}
          </button>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm text-biblical-brown">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleDownload}
          className="flex items-center text-xs sm:text-sm text-biblical-navy hover:text-biblical-burgundy flex-shrink-0"
          aria-label="Download audio"
        >
          <Download size={14} className="mr-1 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Download</span>
          <span className="sm:hidden">DL</span>
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleProgressChange}
          className="w-full h-2 bg-parchment-dark rounded-md appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 sm:[&::-webkit-slider-thumb]:h-4 sm:[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-biblical-burgundy"
          aria-label="Audio progress"
        />
      </div>
    </div>
  );
};

export default AudioPlayer;
