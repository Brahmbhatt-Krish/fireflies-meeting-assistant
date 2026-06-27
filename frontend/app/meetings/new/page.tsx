'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Upload, Sparkles, Plus, X, Loader2 } from 'lucide-react';
import { createMeeting } from '@/lib/api';
import { useToastContext } from '@/components/ui/ToastContext';

export default function NewMeetingPage() {
  const router = useRouter();
  const { addToast } = useToastContext();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [participantInput, setParticipantInput] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [transcriptText, setTranscriptText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generateAi, setGenerateAi] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const handleAddParticipant = () => {
    if (!participantInput.trim()) return;
    if (!participants.includes(participantInput.trim())) {
      setParticipants([...participants, participantInput.trim()]);
    }
    setParticipantInput('');
  };

  const handleRemoveParticipant = (name: string) => {
    setParticipants(participants.filter((p) => p !== name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Please provide a meeting title', 'error');
      return;
    }

    if (activeTab === 'paste' && !transcriptText.trim()) {
      addToast('Please paste a transcript or switch to upload', 'error');
      return;
    }

    if (activeTab === 'upload' && !selectedFile) {
      addToast('Please select a transcript file (.txt, .vtt, .json)', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('date', new Date(date).toISOString());
      formData.append('participants', JSON.stringify(participants));
      formData.append('generate_ai', generateAi.toString());

      if (activeTab === 'paste') {
        formData.append('transcript_text', transcriptText);
      } else if (selectedFile) {
        formData.append('transcript_file', selectedFile);
      }

      const meeting = await createMeeting(formData);
      addToast('Meeting created successfully!', 'success');
      router.push(`/meetings/${meeting.id}`);
    } catch (err: any) {
      addToast(err.message || 'Failed to create meeting', 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Meetings
      </Link>

      <div className="bg-white dark:bg-[#181826] rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-xs p-8 transition-colors">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Create New Meeting</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-8">
          Upload or paste a transcript to generate interactive speaker timelines, action items, and summaries.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Meeting Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Product Strategy Review"
                className="w-full text-sm px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Date & Time</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Participants</label>
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
                placeholder="Add attendee name and press Enter..."
                className="flex-1 text-sm px-3.5 py-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
              <button
                type="button"
                onClick={handleAddParticipant}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Add
              </button>
            </div>

            {participants.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {participants.map((name) => (
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
            )}
          </div>

          {/* Transcript Input Tabs */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Transcript Source</label>
            <div className="flex border-b border-gray-100 dark:border-gray-800 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`flex items-center gap-2 pb-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'paste'
                    ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                    : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <FileText size={16} />
                Paste Text
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-2 pb-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'upload'
                    ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                    : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <Upload size={16} />
                Upload File (.txt, .vtt, .json)
              </button>
            </div>

            {activeTab === 'paste' ? (
              <div>
                <textarea
                  rows={8}
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  placeholder={"Speaker 1: Hello team, welcome to the sync.\nSpeaker 2: Hi everyone! Excited to get started.\nSpeaker 1: Let's discuss our upcoming launch."}
                  className="w-full text-sm font-mono p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                  Format each line as <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-gray-700 dark:text-gray-300">Speaker Name: Dialogue text</code> for automatic speaker separation.
                </p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center bg-gray-50/50 dark:bg-gray-800/20 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  accept=".txt,.vtt,.json"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload size={32} className="text-violet-500 mb-2" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {selectedFile ? selectedFile.name : 'Click to select a file'}
                  </span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Supports .txt, .vtt (WebVTT), and .json</span>
                </label>
              </div>
            )}
          </div>

          {/* AI Toggle */}
          <div className="bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-950/30 dark:to-pink-950/20 border border-violet-100 dark:border-violet-900/40 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Generate AI Summary & Action Items</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Extract key takeaways and topics via Gemini API automatically.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={generateAi}
                onChange={(e) => setGenerateAi(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Link
              href="/"
              className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all duration-200 disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              <span>{submitting ? 'Processing Meeting...' : 'Create Meeting'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
