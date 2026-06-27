'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

export function usePlayer(durationSec: number) {
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((t) => {
          if (t >= durationSec) {
            clearTick();
            setPlaying(false);
            return durationSec;
          }
          return t + 0.25;
        });
      }, 250);
    } else {
      clearTick();
    }
    return clearTick;
  }, [playing, durationSec, clearTick]);

  const seek = useCallback((sec: number) => {
    setCurrentTime(Math.max(0, Math.min(sec, durationSec)));
  }, [durationSec]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (!p && currentTime >= durationSec) setCurrentTime(0);
      return !p;
    });
  }, [currentTime, durationSec]);

  return { currentTime, playing, seek, togglePlay };
}
