'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Calendar, Clock, Trash2, Edit2, Check, X, Sparkles, MessageSquare, Loader2, Users, Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { MeetingDetail } from '@/types';
import {
  getMeeting, updateMeeting, deleteMeeting, regenerateAI, exportMeetingSummaryPdf,
  createActionItem, updateActionItem, deleteActionItem,
} from '@/lib/api';
import { usePlayer } from '@/hooks/usePlayer';
import { useToastContext } from '@/components/ui/ToastContext';

import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import SeekBar from '@/components/detail/SeekBar';
import TranscriptPanel from '@/components/detail/TranscriptPanel';
import SummaryPanel from '@/components/detail/SummaryPanel';
import ActionItemsPanel from '@/components/detail/ActionItemsPanel';
import MeetingChatPanel from '@/components/detail/MeetingChatPanel';

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const meetingId = parseInt(resolvedParams.id, 10);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToastContext();

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable title
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState('');

  // Edit metadata modal (date + participants)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editParticipants, setEditParticipants] = useState<string[]>([]);
  const [participantInput, setParticipantInput] = useState('');
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Left pane active tab
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('transcript');

  const { currentTime, playing, seek, togglePlay } = usePlayer(meeting?.duration_sec || 0);

  const fetchMeeting = useCallback(async () => {
    try {
      const data = await getMeeting(meetingId);
      setMeeting(data);
      setTitleText(data.title);
    } catch (err: any) {
      setError(err.message || 'Failed to load meeting details');
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  useEffect(() => {
    if (searchParams.get('chat') === '1') {
      setShowChat(true);
    }
  }, [searchParams]);

  // Handle title edit
  const handleSaveTitle = async () => {
    if (!meeting || !titleText.trim()) return;
    try {
      const updated = await updateMeeting(meeting.id, { title: titleText.trim() });
      setMeeting(updated);
      setIsEditingTitle(false);
      addToast('Title updated successfully', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update title', 'error');
    }
  };

  const openEditModal = () => {
    if (!meeting) return;
    setEditDate(new Date(meeting.date).toISOString().slice(0, 16));
    setEditParticipants(meeting.participants.map((p) => p.name));
    setParticipantInput('');
    setShowEditModal(true);
  };

  const handleAddParticipant = () => {
    const name = participantInput.trim();
    if (!name || editParticipants.includes(name)) return;
    setEditParticipants([...editParticipants, name]);
    setParticipantInput('');
  };

  const handleRemoveParticipant = (name: string) => {
    setEditParticipants(editParticipants.filter((p) => p !== name));
  };

  const handleSaveMetadata = async () => {
    if (!meeting || isSavingMetadata) return;
    setIsSavingMetadata(true);
    try {
      const updated = await updateMeeting(meeting.id, {
        date: new Date(editDate).toISOString(),
        participants: editParticipants,
      });
      setMeeting(updated);
      setShowEditModal(false);
      addToast('Meeting details updated', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update meeting details', 'error');
    } finally {
      setIsSavingMetadata(false);
    }
  };

  // Handle delete meeting
  const handleDeleteMeeting = async () => {
    if (!meeting) return;
    try {
      await deleteMeeting(meeting.id);
      addToast('Meeting deleted', 'info');
      router.push('/');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete meeting', 'error');
    }
  };

  // Handle regenerate AI
  const handleRegenerateAI = async () => {
    if (!meeting) return;
    setIsRegenerating(true);
    try {
      const updated = await regenerateAI(meeting.id);
      setMeeting(updated);
      addToast('AI Summary & Action items regenerated!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to regenerate AI content', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleExportSummaryPdf = async () => {
    if (!meeting) return;
    setIsExportingPdf(true);
    try {
      const blob = await exportMeetingSummaryPdf(meeting.id);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${meeting.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'meeting'}-summary.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      addToast('Summary PDF exported', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to export summary PDF', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Action item handlers
  const handleToggleActionItem = async (id: number, completed: boolean) => {
    try {
      const updatedItem = await updateActionItem(id, { completed });
      setMeeting((prev) =>
        prev
          ? {
              ...prev,
              action_items: prev.action_items.map((item) =>
                item.id === id ? updatedItem : item
              ),
            }
          : null
      );
      addToast(`Action item marked as ${completed ? 'completed' : 'pending'}`, 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to update action item', 'error');
    }
  };

  const handleAddActionItem = async (text: string, assignee?: string) => {
    if (!meeting) return;
    try {
      const newItem = await createActionItem(meeting.id, { text, assignee });
      setMeeting((prev) =>
        prev ? { ...prev, action_items: [...prev.action_items, newItem] } : null
      );
      addToast('Action item created', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to create action item', 'error');
    }
  };

  const handleEditActionItem = async (id: number, text: string) => {
    try {
      const updatedItem = await updateActionItem(id, { text });
      setMeeting((prev) =>
        prev
          ? {
              ...prev,
              action_items: prev.action_items.map((item) =>
                item.id === id ? updatedItem : item
              ),
            }
          : null
      );
      addToast('Action item updated', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update action item', 'error');
    }
  };

  const handleDeleteActionItem = async (id: number) => {
    try {
      await deleteActionItem(id);
      setMeeting((prev) =>
        prev
          ? {
              ...prev,
              action_items: prev.action_items.filter((item) => item.id !== id),
            }
          : null
      );
      addToast('Action item deleted', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete action item', 'error');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-[#0f0f1a]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-violet-600 dark:text-violet-400" />
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-red-700 dark:text-red-300 mb-2">Meeting Not Found</h2>
          <p className="text-xs text-red-500 dark:text-red-400 mb-4">{error || "The meeting you're looking for does not exist."}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-violet-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 bg-slate-50 dark:bg-[#0f0f1a] overflow-hidden transition-colors relative">
      {/* Detail Top Header */}
      <div className="bg-white dark:bg-[#181826] border-b border-gray-200 dark:border-gray-800/60 px-6 py-4 flex items-center justify-between shrink-0 shadow-xs transition-colors">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Link
            href="/"
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="text"
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  className="text-lg font-bold text-gray-900 dark:text-gray-100 border-b-2 border-violet-600 focus:outline-none bg-transparent w-full px-1"
                  autoFocus
                />
                <button onClick={handleSaveTitle} className="p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700">
                  <Check size={18} />
                </button>
                <button onClick={() => setIsEditingTitle(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate tracking-tight">{meeting.title}</h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-opacity"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {format(new Date(meeting.date), 'EEE, MMM d, yyyy · h:mm a')}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatDuration(meeting.duration_sec)}
              </span>
              <button
                type="button"
                onClick={openEditModal}
                className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 font-medium transition-colors"
              >
                <Edit2 size={11} />
                Edit details
              </button>
            </div>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 border-r border-gray-100 dark:border-gray-800 pr-4">
            {meeting.participants.map((p) => (
              <Avatar key={p.id} name={p.name} size="sm" />
            ))}
          </div>

          <button
            onClick={() => setShowChat(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-gray-900/60 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors"
          >
            <MessageSquare size={14} />
            <span>Ask AI</span>
          </button>

          <button
            onClick={handleRegenerateAI}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 text-xs font-semibold bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/60 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            {isRegenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>Regenerate AI</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
            title="Delete Meeting"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area: Two Pane Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left / Main Pane */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#181826] border-r border-gray-200 dark:border-gray-800/60 transition-colors">
          {/* Tabs header */}
          <div className="flex items-center border-b border-gray-100 dark:border-gray-800/60 px-6 pt-2 bg-white dark:bg-[#181826] shrink-0">
            <button
              onClick={() => setActiveTab('transcript')}
              className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'transcript'
                  ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              Transcript ({meeting.transcript_lines.length})
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'summary'
                  ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              Summary Overview
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === 'transcript' ? (
              <TranscriptPanel
                lines={meeting.transcript_lines}
                currentTime={currentTime}
                onSeek={seek}
              />
            ) : (
              <div className="p-6 overflow-y-auto h-full">
                <SummaryPanel
                  summary={meeting.summary}
                  topics={meeting.topics}
                  onExportPdf={handleExportSummaryPdf}
                  exportingPdf={isExportingPdf}
                  onSeek={(s) => {
                    seek(s);
                    setActiveTab('transcript');
                  }}
                />
              </div>
            )}
          </div>

          {/* Bottom Player Bar */}
          <SeekBar
            currentTime={currentTime}
            duration={meeting.duration_sec}
            playing={playing}
            onTogglePlay={togglePlay}
            onSeek={seek}
          />
        </div>

        {/* Right Pane (Summary, Topics, Action Items) */}
        <div className="w-full md:w-80 lg:w-96 bg-slate-50 dark:bg-[#0f0f1a] flex flex-col min-h-0 overflow-y-auto p-6 gap-6 border-l border-gray-100 dark:border-gray-800/60 transition-colors">
          <SummaryPanel
            summary={meeting.summary}
            topics={meeting.topics}
            onExportPdf={handleExportSummaryPdf}
            exportingPdf={isExportingPdf}
            onSeek={seek}
          />

          <hr className="border-gray-200 dark:border-gray-800" />

          <ActionItemsPanel
            items={meeting.action_items}
            onToggle={handleToggleActionItem}
            onDelete={handleDeleteActionItem}
            onAdd={handleAddActionItem}
            onEdit={handleEditActionItem}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        title="Delete Meeting"
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteMeeting}
        confirmLabel="Delete Meeting"
        confirmDanger
      >
        Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-gray-100">"{meeting.title}"</span>? This will permanently delete all transcript lines, summaries, and action items associated with it.
      </Modal>

      {/* Edit Metadata Modal */}
      <Modal
        open={showEditModal}
        title="Edit Meeting Details"
        onClose={() => !isSavingMetadata && setShowEditModal(false)}
        onConfirm={handleSaveMetadata}
        confirmLabel={isSavingMetadata ? 'Saving...' : 'Save Changes'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Date & Time</label>
            <input
              type="datetime-local"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              <span className="inline-flex items-center gap-1.5"><Users size={13} /> Participants</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddParticipant();
                  }
                }}
                placeholder="Add participant name..."
                className="flex-1 text-sm px-3 py-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
              <button
                type="button"
                onClick={handleAddParticipant}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {editParticipants.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {editParticipants.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-800/50 px-3 py-1 rounded-lg text-xs font-medium"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(name)}
                      className="hover:text-violet-900 dark:hover:text-violet-100"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500">No participants added yet.</p>
            )}
          </div>
        </div>
      </Modal>

      <MeetingChatPanel
        meeting={meeting}
        open={showChat}
        onClose={() => setShowChat(false)}
      />
    </div>
  );
}
