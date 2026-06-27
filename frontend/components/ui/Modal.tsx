'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmDanger?: boolean;
}

export default function Modal({ open, title, children, onClose, onConfirm, confirmLabel = 'Confirm', confirmDanger }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div ref={ref} className="bg-white dark:bg-[#181826] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{children}</div>
        {onConfirm && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors ${confirmDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-violet-600 hover:bg-violet-700'}`}
            >
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
