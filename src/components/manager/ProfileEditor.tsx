import { useState } from 'react';
import type { FontProfile, ScriptType } from '@/types/profile.types';

interface ProfileEditorProps {
  initial?: FontProfile;
  onSave: (profile: FontProfile) => void;
  onCancel: () => void;
}

const emptyProfile: FontProfile = {
  id: '',
  name: '',
  script: 'gujarati',
  language: 'gu',
  version: '1.0.0',
  reorderingRules: {
    leftMatraSymbols: [],
    rephSymbols: [],
    customTransforms: [],
  },
  mappings: [],
};

const scripts: ScriptType[] = [
  'gujarati',
  'devanagari',
  'nepali',
  'bengali',
  'gurmukhi',
  'tamil',
  'telugu',
  'kannada',
  'malayalam',
  'custom',
];

export function ProfileEditor({ initial, onSave, onCancel }: ProfileEditorProps) {
  const [profile, setProfile] = useState<FontProfile>(initial ?? emptyProfile);

  const updateField = <K extends keyof FontProfile>(field: K, value: FontProfile[K]) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.id || !profile.name) return;
    onSave(profile);
  };

  const leftMatraValue = profile.reorderingRules?.leftMatraSymbols?.join(', ') ?? '';
  const rephValue = profile.reorderingRules?.rephSymbols?.join(', ') ?? '';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-slate-200 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Profile ID</label>
          <input
            type="text"
            value={profile.id}
            onChange={(e) => updateField('id', e.target.value)}
            placeholder="e.g. myfont-gujarati"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="e.g. MyFont Gujarati"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Script</label>
          <select
            value={profile.script}
            onChange={(e) => updateField('script', e.target.value as ScriptType)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {scripts.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Language Code</label>
          <input
            type="text"
            value={profile.language ?? ''}
            onChange={(e) => updateField('language', e.target.value || undefined)}
            placeholder="e.g. gu"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Version</label>
          <input
            type="text"
            value={profile.version}
            onChange={(e) => updateField('version', e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Font Families</label>
          <input
            type="text"
            value={profile.fontFamilies?.join(', ') ?? ''}
            onChange={(e) =>
              updateField(
                'fontFamilies',
                e.target.value ? e.target.value.split(',').map((s) => s.trim()) : undefined
              )
            }
            placeholder="Comma separated"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Left Matra Symbols</label>
          <input
            type="text"
            value={leftMatraValue}
            onChange={(e) =>
              updateField('reorderingRules', {
                ...profile.reorderingRules,
                leftMatraSymbols: e.target.value.split(',').map((s) => s.trim()),
              })
            }
            placeholder="Comma separated, e.g. િ"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Reph Symbols</label>
          <input
            type="text"
            value={rephValue}
            onChange={(e) =>
              updateField('reorderingRules', {
                ...profile.reorderingRules,
                rephSymbols: e.target.value.split(',').map((s) => s.trim()),
              })
            }
            placeholder="Comma separated, e.g. ઁ"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Save
        </button>
      </div>
    </form>
  );
}
