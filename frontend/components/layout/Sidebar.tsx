'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, BookOpen, ListVideo, Radio, Upload,
  Puzzle, LayoutGrid, Hash, BarChart2, Users, Settings, Shield,
} from 'lucide-react';

const NAV = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/notebook', icon: BookOpen, label: 'Notebook', stub: true },
  { href: '/playlist', icon: ListVideo, label: 'Playlist', stub: true },
  { href: '/meeting-status', icon: Radio, label: 'Meeting Status', stub: true },
  { href: '/uploads', icon: Upload, label: 'Uploads', stub: true },
];

const NAV2 = [
  { href: '/integrations', icon: Puzzle, label: 'Integrations', stub: true },
  { href: '/apps', icon: LayoutGrid, label: 'Apps', stub: true },
  { href: '/topic-tracker', icon: Hash, label: 'Topic Tracker', stub: true },
  { href: '/analytics', icon: BarChart2, label: 'Analytics', stub: true },
];

const NAV3 = [
  { href: '/team', icon: Users, label: 'Team', stub: true },
  { href: '/settings', icon: Settings, label: 'Settings', stub: true },
  { href: '/platform-rules', icon: Shield, label: 'Platform Rules', stub: true },
];

export default function Sidebar() {
  const pathname = usePathname();

  const NavItem = ({ href, icon: Icon, label, stub }: { href: string; icon: React.ElementType; label: string; stub?: boolean }) => {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
    return (
      <Link
        href={stub ? '#' : href}
        title={label}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
          ${active
            ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 font-semibold'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
      >
        <Icon size={18} className="shrink-0" />
        <span className="sidebar-label">{label}</span>
        {stub && <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-600 sidebar-label">Soon</span>}
      </Link>
    );
  };

  return (
    <aside className="w-56 shrink-0 bg-white dark:bg-[#141422] border-r border-gray-100 dark:border-gray-800/60 h-screen flex flex-col overflow-y-auto transition-colors duration-200">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-2.5 border-b border-gray-100 dark:border-gray-800/60">
        <Image
          src="/brand-mark.svg"
          alt="Fireflies logo"
          width={32}
          height={32}
          className="shrink-0"
        />
        <div className="flex items-baseline gap-0">
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">fireflies</span>
          <span className="text-violet-600 dark:text-violet-400 font-semibold text-sm">.ai</span>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map((item) => <NavItem key={item.href} {...item} />)}
        <div className="my-2 border-t border-gray-100 dark:border-gray-800/60" />
        {NAV2.map((item) => <NavItem key={item.href} {...item} />)}
        <div className="my-2 border-t border-gray-100 dark:border-gray-800/60" />
        {NAV3.map((item) => <NavItem key={item.href} {...item} />)}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800/60 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-semibold">
          U
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-900 dark:text-gray-200 truncate">User</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">user@example.com</p>
        </div>
      </div>
    </aside>
  );
}
