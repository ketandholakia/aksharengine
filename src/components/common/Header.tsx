import { FlaskConical } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
        <div className="bg-brand-100 text-brand-700 p-2 rounded-lg">
          <FlaskConical size={22} />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">AksharEngine</h1>
        <span className="ml-auto text-sm text-slate-500">Unicode Conversion Studio</span>
      </div>
    </header>
  );
}
