'use client';
import Link from 'next/link';
import { Plus, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeContext';

interface Props {
  title?: string;
}

export default function Navbar({ title }: Props) {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <header className="h-14 bg-white dark:bg-[#181826] border-b border-gray-100 dark:border-gray-800/60 flex items-center px-6 gap-4 shrink-0 transition-colors duration-200">
      {title && <h1 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{title}</h1>}
      <div className="flex-1" />
      
      {/* Sun / Moon Theme Toggle Button */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle Theme"
        className="p-2 text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-all cursor-pointer select-none"
        title={mounted && theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {mounted && theme === 'dark' ? (
          <Sun size={18} className="text-amber-400" />
        ) : (
          <Moon size={18} />
        )}
      </button>

      <button type="button" className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
        <Bell size={18} />
      </button>

      <Link
        href="/meetings/new"
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-xs"
      >
        <Plus size={16} />
        New Meeting
      </Link>

      <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-semibold">
        U
      </div>
    </header>
  );
}
