import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import type { FontProfile } from '@/types/profile.types';

interface ProfileSearchSelectProps {
  profiles: FontProfile[];
  selectedProfileId: string;
  onSelectProfile: (profileId: string) => void;
  icon?: ReactNode;
  label?: string;
}

export function ProfileSearchSelect({
  profiles,
  selectedProfileId,
  onSelectProfile,
  icon = <ArrowRightLeft className="w-5 h-5" />,
  label = 'Select Font Profile',
}: ProfileSearchSelectProps) {
  const [profileQuery, setProfileQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const filteredProfiles = useMemo(() => {
    const query = profileQuery.trim().toLowerCase();
    if (!query) return profiles;

    return profiles.filter((profile) => {
      const haystack = [
        profile.id,
        profile.name,
        profile.script,
        profile.language ?? '',
        ...(profile.fontFamilies ?? []),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [profiles, profileQuery]);

  useEffect(() => {
    const selected = profiles.find((profile) => profile.id === selectedProfileId);
    if (selected) {
      setProfileQuery(`${selected.name} (${selected.script})`);
    }
  }, [profiles, selectedProfileId]);

  const handleSelectProfile = (profileId: string) => {
    onSelectProfile(profileId);
    const selected = profiles.find((profile) => profile.id === profileId);
    setProfileQuery(selected ? `${selected.name} (${selected.script})` : '');
    setProfileDropdownOpen(false);
  };

  return (
    <div className="flex items-center gap-3 w-full sm:w-auto">
      <div className="p-2 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
        {icon}
      </div>
      <div className="flex-1 sm:flex-none">
        <label
          htmlFor="profile-select"
          className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5"
        >
          {label}
        </label>
        <div className="relative w-full sm:w-72">
          <input
            id="profile-select"
            type="text"
            value={profileQuery}
            onChange={(e) => {
              setProfileQuery(e.target.value);
              setProfileDropdownOpen(true);
            }}
            onFocus={() => setProfileDropdownOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setProfileDropdownOpen(false), 150);
            }}
            placeholder="Type to find a profile..."
            className="w-full font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-colors"
          />
          {profileDropdownOpen && filteredProfiles.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
              {filteredProfiles.map((profile) => {
                const isActive = profile.id === selectedProfileId;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectProfile(profile.id)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{profile.name}</span>
                    <span className="ml-3 shrink-0 text-xs text-slate-400 dark:text-slate-500 capitalize">
                      {profile.script}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {profileDropdownOpen && filteredProfiles.length === 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 shadow-lg">
              No matching profiles.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
