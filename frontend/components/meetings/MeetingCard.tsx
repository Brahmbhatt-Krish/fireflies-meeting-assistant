'use client';
import Link from 'next/link';
import { Calendar, Clock, MessageSquare, Users } from 'lucide-react';
import { format } from 'date-fns';
import { MeetingListItem } from '@/types';
import Avatar from '@/components/ui/Avatar';

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const STATUS_STYLES: Record<string, string> = {
  processed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30',
  processing: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30',
  failed: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200/50 dark:border-red-800/30',
};

interface Props {
  meeting: MeetingListItem;
}

export default function MeetingCard({ meeting }: Props) {
  return (
    <div className="bg-white dark:bg-[#181826] rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-xs hover:shadow-md hover:border-violet-300 dark:hover:border-violet-600 transition-all duration-200 p-5 group">
      <Link href={`/meetings/${meeting.id}`} className="block">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2">
            {meeting.title}
          </h3>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 capitalize ${STATUS_STYLES[meeting.status] || STATUS_STYLES.processed}`}>
            {meeting.status}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {format(new Date(meeting.date), 'EEE, MMM d · h:mm a')}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatDuration(meeting.duration_sec)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Users size={12} className="text-gray-300 dark:text-gray-600 mr-1" />
          {meeting.participants.slice(0, 5).map((p) => (
            <Avatar key={p.id} name={p.name} size="sm" />
          ))}
          {meeting.participants.length > 5 && (
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">+{meeting.participants.length - 5}</span>
          )}
          {meeting.participants.length === 0 && (
            <span className="text-xs text-gray-300 dark:text-gray-600">No participants</span>
          )}
        </div>
      </Link>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between gap-3">
        <Link
          href={`/meetings/${meeting.id}`}
          className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          Open meeting
        </Link>
        <Link
          href={`/meetings/${meeting.id}?chat=1`}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 px-3 py-2 text-xs font-semibold hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
        >
          <MessageSquare size={14} />
          Chat with AI
        </Link>
      </div>
    </div>
  );
}
