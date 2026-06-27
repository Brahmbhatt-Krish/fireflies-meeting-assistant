'use client';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import { TranscriptLine } from '@/types';
import Avatar from '@/components/ui/Avatar';

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function highlight(text: string, query: string) {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/60 text-yellow-900 dark:text-yellow-200 rounded px-0.5">{p}</mark>
          : p
      )}
    </>
  );
}

interface Props {
  lines: TranscriptLine[];
  currentTime: number;
  onSeek: (sec: number) => void;
}

export default function TranscriptPanel({ lines, currentTime, onSeek }: Props) {
  const [query, setQuery] = useState('');
  const [matchIdx, setMatchIdx] = useState(0);
  const activeRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeLineIdx = useMemo(() => {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].start_sec <= currentTime) return i;
    }
    return -1;
  }, [lines, currentTime]);

  const matchingIndices = useMemo(() => {
    if (!query) return [];
    return lines.reduce<number[]>((acc, l, i) => {
      if (l.text.toLowerCase().includes(query.toLowerCase()) || l.speaker.toLowerCase().includes(query.toLowerCase()))
        acc.push(i);
      return acc;
    }, []);
  }, [lines, query]);

  // Auto-scroll active line into view
  useEffect(() => {
    if (!query && activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeLineIdx, query]);

  // Scroll to match
  useEffect(() => {
    if (matchingIndices.length > 0 && containerRef.current) {
      const el = containerRef.current.querySelector(`[data-idx="${matchingIndices[matchIdx]}"]`);
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [matchIdx, matchingIndices]);

  const nextMatch = useCallback(() => setMatchIdx((i) => (i + 1) % matchingIndices.length), [matchingIndices]);
  const prevMatch = useCallback(() => setMatchIdx((i) => (i - 1 + matchingIndices.length) % matchingIndices.length), [matchingIndices]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#181826] transition-colors duration-200">
      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800/60 flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setMatchIdx(0); }}
            placeholder="Search transcript…"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
        {matchingIndices.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <span>{matchIdx + 1}/{matchingIndices.length}</span>
            <button onClick={prevMatch} className="p-1 hover:text-violet-600 dark:hover:text-violet-400"><ChevronUp size={14} /></button>
            <button onClick={nextMatch} className="p-1 hover:text-violet-600 dark:hover:text-violet-400"><ChevronDown size={14} /></button>
          </div>
        )}
      </div>

      {/* Lines */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-2">
        {lines.length === 0 && (
          <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-12">No transcript available.</p>
        )}
        {lines.map((line, i) => {
          const isActive = i === activeLineIdx;
          const isMatch = matchingIndices.includes(i) && query;
          const isCurrentMatch = matchingIndices[matchIdx] === i && query;
          return (
            <div
              key={line.id}
              data-idx={i}
              ref={isActive ? activeRef : null}
              onClick={() => onSeek(line.start_sec)}
              className={`flex gap-3 px-3 py-2.5 rounded-xl mb-1 cursor-pointer transition-all duration-150
                ${isActive ? 'bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}
                ${isCurrentMatch ? 'ring-2 ring-yellow-400' : ''}
                ${isMatch && !isCurrentMatch ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}
              `}
            >
              <Avatar name={line.speaker} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{line.speaker}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{fmt(line.start_sec)}</span>
                </div>
                <p className={`text-sm leading-relaxed ${isActive ? 'text-violet-900 dark:text-violet-200 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                  {highlight(line.text, query)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
