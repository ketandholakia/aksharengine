import type { FontProfile } from '@/types/profile.types';

interface ProfileSelectorProps {
  profiles: FontProfile[];
  selected: FontProfile | null;
  onSelect: (profile: FontProfile) => void;
}

export function ProfileSelector({ profiles, selected, onSelect }: ProfileSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor="profile" className="text-sm font-medium text-slate-700">
        Font Profile
      </label>
      <select
        id="profile"
        value={selected?.id ?? ''}
        onChange={(e) => {
          const profile = profiles.find((p) => p.id === e.target.value);
          if (profile) onSelect(profile);
        }}
        className="block w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        <option value="">Select a profile...</option>
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.name}
          </option>
        ))}
      </select>
    </div>
  );
}
