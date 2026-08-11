import { useState } from 'react';
import { ConverterEngine } from '@/engine';
import type { FontProfile } from '@/types/profile.types';

interface LiveSandboxProps {
  profile: FontProfile;
}

export function LiveSandbox({ profile }: LiveSandboxProps) {
  const [sample, setSample] = useState('');
  const engine = new ConverterEngine({ profile });
  const output = engine.convert(sample);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-700">Live Sandbox</h3>
      <textarea
        value={sample}
        onChange={(e) => setSample(e.target.value)}
        placeholder="Type legacy text to preview conversion..."
        className="w-full h-24 rounded-md border border-slate-300 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-sm min-h-[3rem]">
        {output.text || <span className="text-slate-400">Preview...</span>}
      </div>
    </div>
  );
}
