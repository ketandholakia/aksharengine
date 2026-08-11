import React, { useRef, useState } from 'react';
import { 
  FolderKanban, 
  Upload, 
  Download, 
  Trash2, 
  FileJson, 
  ShieldCheck, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import type { FontProfile } from '../../types/profile.types';
import { useProfileSync } from '../../hooks/useProfileSync';

interface ProfileManagerProps {
  profiles: FontProfile[];
  onImportProfile: (profile: FontProfile) => void;
  onDeleteProfile: (profileId: string) => void;
  onUpdateProfiles: (updatedProfiles: FontProfile[]) => void;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  profiles,
  onImportProfile,
  onDeleteProfile,
  onUpdateProfiles,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const { syncProfiles, isSyncing, lastSyncResult } = useProfileSync(profiles, (updatedProfiles) => {
    onUpdateProfiles(updatedProfiles);
  });

  // Trigger hidden file input
  const handleImportClick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  // Handle JSON file reading and validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const parsedProfile = JSON.parse(jsonContent) as FontProfile;

        // Basic schema validation
        if (!parsedProfile.id || !parsedProfile.name || !Array.isArray(parsedProfile.mappings)) {
          throw new Error('Invalid profile schema. Missing required fields (id, name, mappings).');
        }

        // Ensure custom profiles don't overwrite built-in flags inadvertently
        const safeProfile: FontProfile = {
          ...parsedProfile,
          isBuiltIn: false,
          updatedAt: new Date().toISOString(),
        };

        onImportProfile(safeProfile);
        
        // Reset input so the same file can be imported again if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err: any) {
        setError(err.message || 'Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Handle downloading profile as a JSON file
  const handleExport = (profile: FontProfile) => {
    const jsonString = JSON.stringify(profile, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header & Import Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Profile Manager
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage, import, and export your legacy font mapping profiles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={syncProfiles}
            disabled={isSyncing}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Checking...' : 'Check for Updates'}
          </button>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <button
            onClick={handleImportClick}
            className="w-full sm:w-auto px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm shadow-brand-500/20 transition-all"
          >
            <Upload className="w-4 h-4" />
            Import JSON Profile
          </button>
        </div>
      </div>

      {lastSyncResult && (
        <div className={`flex items-center gap-2 p-3 ${lastSyncResult.updatedCount > 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'} border rounded-lg text-sm font-medium transition-colors`}>
          <AlertCircle className="w-4 h-4" />
          {lastSyncResult.message}
        </div>
      )}

      {/* Error Message Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium transition-colors">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((profile) => (
          <div 
            key={profile.id} 
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col overflow-hidden"
          >
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate" title={profile.name}>
                    {profile.name}
                  </h3>
                </div>
                {profile.isBuiltIn && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-2 py-1 rounded-full uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3" />
                    Built-in
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <p><span className="font-medium text-slate-600 dark:text-slate-300">Script:</span> <span className="capitalize">{profile.script}</span></p>
                <p><span className="font-medium text-slate-600 dark:text-slate-300">Mappings:</span> {profile.mappings.length} rules</p>
                <p><span className="font-medium text-slate-600 dark:text-slate-300">Version:</span> {profile.version}</p>
                {profile.author?.name && (
                  <p><span className="font-medium text-slate-600 dark:text-slate-300">Author:</span> {profile.author.name}</p>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors">
              <button
                onClick={() => handleExport(profile)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
              
              {!profile.isBuiltIn && (
                <button
                  onClick={() => onDeleteProfile(profile.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
