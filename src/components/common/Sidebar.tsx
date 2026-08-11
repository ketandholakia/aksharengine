import { cn } from '@/utils/cn';

type Tab = 'converter' | 'calibrator' | 'manager';

interface SidebarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'converter', label: 'Converter' },
  { id: 'calibrator', label: 'Calibrator' },
  { id: 'manager', label: 'Profiles' },
];

export function Sidebar({ active, onChange }: SidebarProps) {
  return (
    <nav className="w-48 shrink-0 border-r border-slate-200 bg-white p-3">
      <ul className="space-y-1">
        {tabs.map((tab) => (
          <li key={tab.id}>
            <button
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active === tab.id
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
