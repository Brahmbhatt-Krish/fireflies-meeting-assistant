interface Props {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500',
];

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return COLORS[Math.abs(h) % COLORS.length];
}

const SIZES = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' };

export default function Avatar({ name, size = 'md', color }: Props) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={`${SIZES[size]} ${color || colorFor(name)} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
      {initials}
    </div>
  );
}
