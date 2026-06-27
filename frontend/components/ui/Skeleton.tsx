export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl ${className}`} />;
}

export function MeetingCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#181826] rounded-2xl p-5 shadow-xs border border-gray-100 dark:border-gray-800/60">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-7 w-7 rounded-full" />
      </div>
    </div>
  );
}
