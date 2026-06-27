'use client';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { Toast, ToastType } from '@/hooks/useToast';

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} />,
  error: <XCircle size={16} />,
  info: <Info size={16} />,
};

const STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

interface Props {
  toasts: Toast[];
  onRemove: (id: number) => void;
}

export default function ToastContainer({ toasts, onRemove }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${STYLES[t.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-64 animate-slide-in`}
        >
          {ICONS[t.type]}
          <span className="text-sm font-medium flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
