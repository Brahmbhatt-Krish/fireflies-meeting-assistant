'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Filter, ArrowUpDown, Plus, Calendar, User } from 'lucide-react';
import { MeetingListItem, SortOrder } from '@/types';
import { getMeetings } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import MeetingCard from '@/components/meetings/MeetingCard';
import { MeetingCardSkeleton } from '@/components/ui/Skeleton';

export default function MeetingsLibraryPage() {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [participant, setParticipant] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState<SortOrder>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedParticipant = useDebounce(participant, 300);

  const hasActiveFilters = Boolean(participant || dateFrom || dateTo);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMeetings({
        search: debouncedSearch || undefined,
        participant: debouncedParticipant || undefined,
        date_from: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined,
        date_to: dateTo ? new Date(`${dateTo}T23:59:59`).toISOString() : undefined,
        sort,
      });
      setMeetings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, debouncedParticipant, dateFrom, dateTo, sort]);

  const clearFilters = () => {
    setParticipant('');
    setDateFrom('');
    setDateTo('');
  };

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-3 rounded-2xl border border-pink-100 bg-white/80 px-4 py-2 shadow-xs mb-4 dark:border-pink-900/30 dark:bg-[#181826]">
            <Image
              src="/brand-mark.svg"
              alt="Fireflies logo"
              width={28}
              height={28}
              className="shrink-0"
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pink-600 dark:text-pink-300">
                Fireflies Workspace
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Meeting notes, summaries, and transcript intelligence
              </p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">My Meetings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View, search, and manage all your transcribed meeting recordings.
          </p>
        </div>
        <Link
          href="/meetings/new"
          className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-200"
        >
          <Plus size={18} />
          <span>Upload / Transcribe</span>
        </Link>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-white dark:bg-[#181826] p-4 rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-xs mb-6 flex flex-col md:flex-row gap-3 items-center justify-between transition-colors">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings by title or participant..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
          />
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-xl border transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300'
                : 'bg-white dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Filter size={16} />
            <span>Filter</span>
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-violet-600" />}
          </button>

          <button
            onClick={() => setSort(sort === 'recent' ? 'oldest' : 'recent')}
            className="flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowUpDown size={16} />
            <span className="capitalize">{sort}</span>
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-violet-50/50 dark:bg-violet-950/20 p-4 rounded-2xl border border-violet-100 dark:border-violet-900/30 mb-6 flex flex-wrap gap-4 items-end animate-slide-in">
          <div className="flex items-center gap-2">
            <User size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Participant:</span>
            <input
              type="text"
              value={participant}
              onChange={(e) => setParticipant(e.target.value)}
              placeholder="e.g. Alice"
              className="text-xs px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-violet-600 dark:text-violet-400 shrink-0" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">To:</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium ml-auto"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Meetings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <MeetingCardSkeleton />
          <MeetingCardSkeleton />
          <MeetingCardSkeleton />
          <MeetingCardSkeleton />
          <MeetingCardSkeleton />
          <MeetingCardSkeleton />
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 text-center text-red-700 dark:text-red-300">
          <p className="font-semibold text-sm mb-1">Error loading meetings</p>
          <p className="text-xs text-red-500 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchMeetings}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-medium hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-white dark:bg-[#181826] border border-gray-100 dark:border-gray-800/60 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-4">
            <Calendar size={24} />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">No meetings found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
            {search || hasActiveFilters
              ? 'No meetings match your current search criteria. Try clearing filters.'
              : 'Start by creating or uploading your first meeting transcript to see AI summaries and key takeaways.'}
          </p>
          <Link
            href="/meetings/new"
            className="inline-flex items-center gap-2 bg-violet-600 text-white text-xs font-medium px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors"
          >
            <Plus size={16} />
            Create First Meeting
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {meetings.map((m) => (
            <MeetingCard key={m.id} meeting={m} />
          ))}
        </div>
      )}
    </div>
  );
}
