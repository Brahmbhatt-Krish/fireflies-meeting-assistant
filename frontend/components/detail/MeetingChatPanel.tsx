'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MessageSquare, Send, X } from 'lucide-react';
import { chatWithMeeting } from '@/lib/api';
import { MeetingChatMessage, MeetingDetail } from '@/types';

interface Props {
  meeting: MeetingDetail;
  open: boolean;
  onClose: () => void;
}

function renderInlineFormatting(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

function renderMessageContent(content: string) {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  const elements: React.ReactNode[] = [];
  let bulletItems: string[] = [];

  const flushBullets = () => {
    if (bulletItems.length === 0) return;
    elements.push(
      <ul key={`bullets-${elements.length}`} className="space-y-2 pl-4 list-disc">
        {bulletItems.map((item, index) => (
          <li key={index}>{renderInlineFormatting(item)}</li>
        ))}
      </ul>
    );
    bulletItems = [];
  };

  for (const line of lines) {
    const bulletMatch = line.match(/^[*-]\s+(.*)$/);
    if (bulletMatch) {
      bulletItems.push(bulletMatch[1]);
      continue;
    }

    flushBullets();
    elements.push(
      <p key={`paragraph-${elements.length}`} className="leading-relaxed">
        {renderInlineFormatting(line)}
      </p>
    );
  }

  flushBullets();
  return <div className="space-y-3">{elements}</div>;
}

export default function MeetingChatPanel({ meeting, open, onClose }: Props) {
  const [messages, setMessages] = useState<MeetingChatMessage[]>([
    {
      role: 'assistant',
      content: `Ask anything about "${meeting.title}" and I’ll answer from the transcript, summary, and action items.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `Ask anything about "${meeting.title}" and I’ll answer from the transcript, summary, and action items.`,
      },
    ]);
  }, [meeting.id, meeting.title]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!open) return null;

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const nextMessages = [...messages, { role: 'user' as const, content: question }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const historyForApi = nextMessages.filter((message) => message.role === 'user' || message.role === 'assistant');
      const response = await chatWithMeeting(meeting.id, question, historyForApi);
      setMessages((prev) => [...prev, { role: 'assistant', content: response.answer }]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: error.message || 'I could not get a response from Gemini right now.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-y-0 right-0 z-30 w-full max-w-md border-l border-gray-200 dark:border-gray-800/60 bg-white dark:bg-[#11111d] shadow-2xl flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/60 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 text-white flex items-center justify-center">
              <MessageSquare size={14} />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Meeting Chat</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Ask Gemini anything about this meeting.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.08),_transparent_35%),linear-gradient(to_bottom,_transparent,_transparent)]">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                message.role === 'user'
                  ? 'bg-violet-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/80 dark:text-gray-100 rounded-bl-md'
              }`}
            >
              {renderMessageContent(message.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-900/80 text-gray-600 dark:text-gray-300 rounded-2xl rounded-bl-md px-4 py-3 text-sm inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800/60 bg-white dark:bg-[#11111d]">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/70 p-2 flex items-end gap-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question about this meeting..."
            className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-10 h-10 shrink-0 rounded-xl bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
