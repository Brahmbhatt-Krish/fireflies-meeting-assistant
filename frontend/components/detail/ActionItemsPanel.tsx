'use client';
import { useState } from 'react';
import { Check, Pencil, Trash2, Plus, X } from 'lucide-react';
import { ActionItem } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';

interface Props {
  items: ActionItem[];
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
  onAdd: (text: string, assignee?: string) => void;
  onEdit: (id: number, text: string) => void;
}

export default function ActionItemsPanel({ items, onToggle, onDelete, onAdd, onEdit }: Props) {
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleAdd = () => {
    if (!newText.trim()) return;
    onAdd(newText.trim(), newAssignee.trim() || undefined);
    setNewText(''); setNewAssignee(''); setAdding(false);
  };

  const handleEdit = (id: number) => {
    if (!editText.trim()) return;
    onEdit(id, editText.trim());
    setEditingId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Action Items</h3>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 font-medium transition-colors"
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {adding && (
        <div className="mb-3 p-3 border border-violet-200 dark:border-violet-800 rounded-xl bg-violet-50 dark:bg-violet-950/40">
          <input
            autoFocus
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Action item…"
            className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 mb-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <input
            value={newAssignee}
            onChange={(e) => setNewAssignee(e.target.value)}
            placeholder="Assignee (optional)"
            className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 mb-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 flex items-center gap-1"><X size={12} /> Cancel</button>
            <button onClick={handleAdd} className="text-xs bg-violet-600 text-white px-3 py-1 rounded-lg hover:bg-violet-700 transition-colors font-medium">Save</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {items.length === 0 && !adding && (
          <p className="text-xs text-gray-400 dark:text-gray-500 py-4 text-center">No action items yet.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className={`group flex items-start gap-3 p-3 rounded-xl border transition-colors ${item.completed ? 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800/40' : 'bg-white dark:bg-[#181826] border-gray-100 dark:border-gray-800/60'}`}>
            <button
              onClick={() => onToggle(item.id, !item.completed)}
              className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-600 hover:border-violet-400'}`}
            >
              {item.completed && <Check size={10} className="text-white" />}
            </button>
            <div className="flex-1 min-w-0">
              {editingId === item.id ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(item.id); if (e.key === 'Escape') setEditingId(null); }}
                    className="flex-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-violet-400 rounded px-2 py-0.5 focus:outline-none"
                  />
                  <button onClick={() => handleEdit(item.id)} className="text-xs text-violet-600 dark:text-violet-400 font-semibold">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-gray-400">Cancel</button>
                </div>
              ) : (
                <p className={`text-sm leading-snug ${item.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>{item.text}</p>
              )}
              {item.assignee && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Avatar name={item.assignee} size="sm" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{item.assignee}</span>
                </div>
              )}
            </div>
            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingId(item.id); setEditText(item.text); }} className="p-1 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                <Pencil size={13} />
              </button>
              <button onClick={() => setDeleteId(item.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={deleteId !== null}
        title="Delete Action Item"
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId !== null) { onDelete(deleteId); setDeleteId(null); } }}
        confirmLabel="Delete"
        confirmDanger
      >
        Are you sure you want to delete this action item? This cannot be undone.
      </Modal>
    </div>
  );
}
