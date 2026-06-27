'use client';
import { useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  currentTime: number;
  duration: number;
  playing: boolean;
  onTogglePlay: () => void;
  onSeek: (sec: number) => void;
}

export default function SeekBar({ currentTime, duration, playing, onTogglePlay, onSeek }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const pct = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(ratio * duration);
  }, [duration, onSeek]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1 || !barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  }, [duration, onSeek]);

  return (
    <div className="bg-white dark:bg-[#181826] border-t border-gray-100 dark:border-gray-800/60 px-6 py-3 transition-colors duration-200">
      {/* Seek bar */}
      <div
        ref={barRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        className="relative h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full cursor-pointer group mb-3"
      >
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-pink-500 rounded-full shadow border-2 border-white dark:border-gray-900 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${pct}% - 7px)` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums w-12">{fmt(currentTime)}</span>
        <div className="flex items-center gap-2 flex-1 justify-center">
          <button onClick={() => onSeek(Math.max(0, currentTime - 10))} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <SkipBack size={16} />
          </button>
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 bg-pink-500 hover:bg-pink-600 text-white rounded-full flex items-center justify-center shadow transition-colors"
          >
            {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
          <button onClick={() => onSeek(Math.min(duration, currentTime + 10))} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <SkipForward size={16} />
          </button>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums w-12 text-right">{fmt(duration)}</span>
      </div>
    </div>
  );
}
