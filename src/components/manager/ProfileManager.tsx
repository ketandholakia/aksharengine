import React, { useMemo, useRef, useState } from 'react';
import { 
  FolderKanban, 
  Upload, 
  Download, 
  Trash2, 
  FileJson, 
  ShieldCheck, 
  AlertCircle,
  RefreshCw,
  Grid,
  Files
} from 'lucide-react';
import type { FontProfile } from '../../types/profile.types';
import type { FidelityReport } from '../../types/engine.types';
import { useProfileSync } from '../../hooks/useProfileSync';
import { FidelityChecker } from '../../engine';

interface ProfileManagerProps {
  profiles: FontProfile[];
  onImportProfile: (profile: FontProfile) => void;
  onDeleteProfile: (profileId: string) => void;
  onUpdateProfiles: (updatedProfiles: FontProfile[]) => void;
  onOpenCalibrator: (profileId: string) => void;
  onOpenBatch: (profileId: string) => void;
}

const GUJARATI_TEMPLATE_ID = 'gujarati-master-template';
const FONT_PRESETS_BY_SCRIPT: Record<string, string[]> = {
  gujarati: [
    'Terafont Varun',
    'Terafont Kinnari',
    'Gujlys 1',
    'Shree-Guj',
    'Bhasha Bharti',
    'LMG-Arun',
    'LMG Arun',
    'Akruti',
    'Chanakya',
    'Kundali',
    'Saumil',
    'Richa',
    'Sahara',
    'Shreelipi',
    'Suchi Dev',
    'Shusha',
    'Agra',
    'Bhaskar',
    'Yuvaraj',
  ],
  devanagari: ['Shivaji', 'Walkman Chanakya', 'Kundali', 'Akruti', 'Shreelipi', 'Chanakya'],
  nepali: ['Preeti', 'Kantipur', 'Himalaya', 'Mangal'],
  bengali: ['SutonnyMJ', 'SolaimanLipi Legacy', 'Bangla2000'],
  gurmukhi: ['AnmolLipi', 'Raavi', 'GurbaniAkhar'],
  tamil: ['Bamini', 'Latha'],
  telugu: ['Gautami', 'Pothana2000'],
  kannada: ['Nudi', 'Tunga'],
  malayalam: ['ML-TTRevathi', 'Rachana'],
  custom: [],
};

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  profiles,
  onImportProfile,
  onDeleteProfile,
  onUpdateProfiles,
  onOpenCalibrator,
  onOpenBatch,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [templateToClone, setTemplateToClone] = useState<FontProfile | null>(null);
  const [cloneId, setCloneId] = useState('');
  const [cloneName, setCloneName] = useState('');
  const [cloneFontFamilies, setCloneFontFamilies] = useState('');
  const [useTemplateFonts, setUseTemplateFonts] = useState(true);
  const [selectedFontPreset, setSelectedFontPreset] = useState('template');
  const [searchQuery, setSearchQuery] = useState('');
  const [fidelityReport, setFidelityReport] = useState<{ profile: FontProfile; report: FidelityReport } | null>(null);

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
        if (!parsedProfile.script) {
          throw new Error('Invalid profile schema. Missing required field: script.');
        }
        if (!parsedProfile.version) {
          throw new Error('Invalid profile schema. Missing required field: version.');
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

  const handleCreateFromTemplate = (template: FontProfile) => {
    setTemplateToClone(template);
    setCloneId(`${template.id}-copy`);
    setCloneName(`${template.name} Copy`);
    setCloneFontFamilies(template.fontFamilies?.join(', ') ?? '');
    setUseTemplateFonts(true);
    setSelectedFontPreset('template');
    setError(null);
  };

  const getPresetOptions = (script?: string) => {
    const options = FONT_PRESETS_BY_SCRIPT[script ?? ''] ?? [];
    return options;
  };

  const closeCloneModal = () => {
    setTemplateToClone(null);
    setCloneId('');
    setCloneName('');
    setCloneFontFamilies('');
    setUseTemplateFonts(true);
    setSelectedFontPreset('template');
  };

  const handleConfirmClone = () => {
    if (!templateToClone) return;

    const id = cloneId.trim();
    const name = cloneName.trim();
    if (!id || !name) {
      setError('Profile id and name are required.');
      return;
    }

    if (profiles.some((profile) => profile.id === id)) {
      setError(`Profile id "${id}" already exists.`);
      return;
    }

    const clonedProfile: FontProfile = {
      ...templateToClone,
      id,
      name,
      fontFamilies: useTemplateFonts
        ? templateToClone.fontFamilies
        : cloneFontFamilies
            .split(',')
            .map((family) => family.trim())
            .filter(Boolean),
      isBuiltIn: false,
      updatedAt: new Date().toISOString(),
      author: {
        name: templateToClone.author?.name ?? 'AksharEngine User',
      },
    };

    onImportProfile(clonedProfile);
    closeCloneModal();
  };

  const handleFidelityCheck = (profile: FontProfile) => {
    const checker = new FidelityChecker(profile);
    const report = checker.checkProfile();
    setFidelityReport({ profile, report });
  };

  const currentPresetOptions = templateToClone ? getPresetOptions(templateToClone.script) : [];
  const sortedProfiles = useMemo(() => {
    return [...profiles].sort((a, b) => {
      if (a.id === GUJARATI_TEMPLATE_ID) return -1;
      if (b.id === GUJARATI_TEMPLATE_ID) return 1;

      if (a.isBuiltIn && !b.isBuiltIn) return -1;
      if (!a.isBuiltIn && b.isBuiltIn) return 1;

      return a.name.localeCompare(b.name);
    });
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sortedProfiles;

    return sortedProfiles.filter((profile) => {
      const haystack = [
        profile.id,
        profile.name,
        profile.script,
        profile.language ?? '',
        profile.version,
        profile.author?.name ?? '',
        ...(profile.fontFamilies ?? []),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [searchQuery, sortedProfiles]);

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
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 dark:bg-slate-200 hover:bg-slate-800 dark:hover:bg-slate-300 text-white dark:text-slate-900 border border-slate-900 dark:border-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm shadow-slate-900/20 dark:shadow-slate-200/10 transition-all"
          >
            <Upload className="w-4 h-4" />
            Import JSON Profile
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search profiles by name, id, script, author, or font family..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 pr-20 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
            >
              Clear
            </button>
          )}
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {filteredProfiles.length} of {sortedProfiles.length} profiles
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
        {filteredProfiles.map((profile) => {
          const isMasterTemplate = profile.id === GUJARATI_TEMPLATE_ID;
          return (
          <div 
            key={profile.id} 
            className={`relative overflow-hidden flex flex-col rounded-xl border shadow-sm transition-all ${
              isMasterTemplate
                ? 'border-amber-300 dark:border-amber-800 bg-gradient-to-br from-amber-50 via-white to-white dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 ring-1 ring-amber-200/60 dark:ring-amber-900/40'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {isMasterTemplate && (
              <div className="absolute right-0 top-0 rounded-bl-xl bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                Master Template
              </div>
            )}
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    isMasterTemplate
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {isMasterTemplate ? <ShieldCheck className="w-4 h-4" /> : <FileJson className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate" title={profile.name}>
                      {profile.name}
                    </h3>
                    {isMasterTemplate && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-300">
                        Base profile for cloning
                      </p>
                    )}
                  </div>
                </div>
                {profile.isBuiltIn && !isMasterTemplate && (
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
            <div className={`px-5 py-3 border-t flex items-center justify-between transition-colors ${
              isMasterTemplate
                ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
            }`}>
              <button
                onClick={() => handleExport(profile)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>

              {!isMasterTemplate && (
                <>
                  <button
                    onClick={() => onOpenCalibrator(profile.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    <Grid className="w-3.5 h-3.5" />
                    Calibrator
                  </button>
                  <button
                    onClick={() => handleFidelityCheck(profile)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Fidelity
                  </button>
                  <button
                    onClick={() => onOpenBatch(profile.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    <Files className="w-3.5 h-3.5" />
                    Batch
                  </button>
                </>
              )}

              {isMasterTemplate && (
                <button
                  onClick={() => handleCreateFromTemplate(profile)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  Create Copy
                </button>
              )}
              
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
          );
        })}
      </div>

      {filteredProfiles.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
          No profiles match your search.
        </div>
      )}

      {templateToClone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 p-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Create Profile from Template
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Cloning {templateToClone.name}. The new profile will start with the Gujarati master mappings.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCloneModal}
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Profile Id
                </label>
                <input
                  type="text"
                  value={cloneId}
                  onChange={(e) => setCloneId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. terafont-varun-custom"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Display Name
                </label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Terafont Varun Custom"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Font Families
                </label>
                <div className="mb-2 flex items-center gap-2">
                  <input
                    id="use-template-fonts"
                    type="checkbox"
                    checked={useTemplateFonts}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setUseTemplateFonts(checked);
                      if (checked) {
                        setCloneFontFamilies(templateToClone?.fontFamilies?.join(', ') ?? '');
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="use-template-fonts" className="text-xs text-slate-600 dark:text-slate-300">
                    Use template font families
                  </label>
                </div>
                <select
                  value={selectedFontPreset}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedFontPreset(value);
                    if (value === 'custom') {
                      setUseTemplateFonts(false);
                      return;
                    }
                    if (value === 'template') {
                      setUseTemplateFonts(true);
                      setCloneFontFamilies(templateToClone?.fontFamilies?.join(', ') ?? '');
                      return;
                    }

                    setUseTemplateFonts(false);
                    setCloneFontFamilies(value);
                  }}
                  className="mb-2 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="template">Use template font families</option>
                  {currentPresetOptions.map((fontName) => (
                    <option key={fontName} value={fontName}>
                      {fontName}
                    </option>
                  ))}
                  <option value="custom">Custom...</option>
                </select>
                <input
                  type="text"
                  value={cloneFontFamilies}
                  onChange={(e) => {
                    setCloneFontFamilies(e.target.value);
                    setUseTemplateFonts(false);
                    setSelectedFontPreset('custom');
                  }}
                  disabled={useTemplateFonts}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Terafont Varun"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  These are the font names used by the legacy textarea preview.
                </p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
                This copies mappings and reordering rules. Update the font families to match the legacy font file.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 p-5">
              <button
                type="button"
                onClick={closeCloneModal}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClone}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Create Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fidelity Report Modal */}
      {fidelityReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 p-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className={`w-5 h-5 ${fidelityReport.report.isPerfect ? 'text-emerald-500' : 'text-red-500'}`} />
                  Round-Trip Fidelity Report
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Profile: <span className="font-semibold text-slate-700 dark:text-slate-300">{fidelityReport.profile.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFidelityReport(null)}
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Total Mappings</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{fidelityReport.report.totalMappings}</p>
                </div>
                <div className={`p-4 rounded-xl border ${fidelityReport.report.isPerfect ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50'}`}>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Lossy Mappings</p>
                  <p className={`text-2xl font-bold mt-1 ${fidelityReport.report.isPerfect ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                    {fidelityReport.report.lossyMappings.length}
                  </p>
                </div>
              </div>

              {fidelityReport.report.lossyMappings.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Lossy Mapping Details</h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Legacy (Input)</th>
                          <th className="px-4 py-3 font-semibold">Unicode</th>
                          <th className="px-4 py-3 font-semibold">Legacy (Round-trip)</th>
                          <th className="px-4 py-3 font-semibold">Category</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {fidelityReport.report.lossyMappings.map((lossy, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{lossy.legacy}</td>
                            <td className="px-4 py-3 font-mono text-emerald-600 dark:text-emerald-400">{lossy.unicodeActual}</td>
                            <td className="px-4 py-3 font-mono text-red-600 dark:text-red-400">{lossy.legacyRoundtrip}</td>
                            <td className="px-4 py-3 text-xs text-slate-500">{lossy.category || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Perfect Fidelity!</h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                    All mappings in this profile can be successfully converted to Unicode and back to Legacy without any data loss.
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <span>Execution Time: {fidelityReport.report.executionTimeMs}ms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
