'use client';
import { Clock, ChevronRight, Download } from 'lucide-react';
import { Topic, Summary } from '@/types';

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  summary: Summary | null;
  topics: Topic[];
  onSeek: (sec: number) => void;
  onExportPdf?: () => void;
  exportingPdf?: boolean;
}

export default function SummaryPanel({ summary, topics, onSeek, onExportPdf, exportingPdf = false }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* AI Summary */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shadow-xs">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">AI Meeting Summary</h3>
          </div>
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              disabled={exportingPdf}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              <span>{exportingPdf ? 'Exporting...' : 'Export PDF'}</span>
            </button>
          )}
        </div>
        {summary ? (
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{summary.overview_text}</p>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-400 dark:text-gray-500">No summary generated yet.</p>
          </div>
        )}
      </div>

      {/* Topics */}
      {topics.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Topics / Outline</h3>
          <div className="flex flex-col gap-1">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => onSeek(topic.start_sec)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/40 text-left transition-colors group border border-transparent hover:border-violet-100 dark:hover:border-violet-900/40"
              >
                <span className="text-xs font-mono text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 shrink-0">
                  <Clock size={10} />
                  {fmt(topic.start_sec)}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 group-hover:text-violet-800 dark:group-hover:text-violet-300 transition-colors">{topic.title}</span>
                <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-violet-400 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
