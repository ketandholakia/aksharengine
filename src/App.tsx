import React, { useState } from 'react';
import { 
  Type, 
  Grid, 
  FolderKanban, 
  Sparkles, 
  GitBranch, 
  Loader2,
  Wand2,
  Settings2,
  Files,
  Sun,
  Moon
} from 'lucide-react';
import { useProfiles } from './hooks/useProfiles';
import { useTheme } from './hooks/useTheme';
import { DualTextarea } from './components/converter/DualTextarea';
import { GridMapper } from './components/calibrator/GridMapper';
import { ProfileManager } from './components/manager/ProfileManager';
import { PairAligner } from './components/calibrator/PairAligner';
import { BatchConverter } from './components/converter/BatchConverter';
import type { MappingRule } from './types/profile.types';

type ActiveTab = 'converter' | 'batch' | 'calibrator' | 'profiles';
type CalibratorMode = 'manual' | 'auto';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('converter');
  const [calibratorMode, setCalibratorMode] = useState<CalibratorMode>('manual');
  const { theme, toggleTheme } = useTheme();
  
  const { 
    profiles, 
    selectedProfileId, 
    setSelectedProfileId, 
    loading,
    handleImportProfile,
    handleDeleteProfile,
    handleSaveProfile,
    handleBulkUpdateProfiles
  } = useProfiles();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 transition-colors">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Initializing AksharEngine...</p>
      </div>
    );
  }

  const activeProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0];

  // Handler for merging new discovered rules from PairAligner
  const handleAppendMappings = (newRules: MappingRule[]) => {
    if (!activeProfile) return;
    const updatedProfile = {
      ...activeProfile,
      mappings: [...newRules, ...activeProfile.mappings],
      updatedAt: new Date().toISOString()
    };
    handleSaveProfile(updatedProfile);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header & Navigation */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-brand-500/30">
              અ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight leading-none">
                  AksharEngine
                </h1>
                <span className="text-[10px] font-semibold bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-800/50 px-1.5 py-0.5 rounded-md">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block mt-0.5">
                Legacy Non-Unicode to Unicode Font Converter
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
            <button
              onClick={() => setActiveTab('converter')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'converter'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Converter</span>
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'batch'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Files className="w-4 h-4" />
              <span>Batch</span>
            </button>
            <button
              onClick={() => setActiveTab('calibrator')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'calibrator'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Calibrator</span>
            </button>
            <button
              onClick={() => setActiveTab('profiles')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'profiles'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              <span>Profiles</span>
            </button>
          </nav>

          {/* External Links & Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <a
              href="https://github.com/ketandholakia/aksharengine"
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"

              title="GitHub Repository"
            >
              <GitBranch className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 py-6">
        {activeTab === 'converter' && (
          <DualTextarea
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            onSelectProfile={setSelectedProfileId}
            onOpenCalibrator={() => setActiveTab('calibrator')}
            onOpenBatch={() => setActiveTab('batch')}
          />
        )}

        {activeTab === 'batch' && (
          <BatchConverter
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            onSelectProfile={setSelectedProfileId}
          />
        )}

        {activeTab === 'calibrator' && activeProfile && (
          <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
            {/* Calibrator Sub-Navigation Toggle */}
            <div className="flex bg-slate-200/60 dark:bg-slate-800/60 p-1.5 rounded-xl w-full sm:w-fit mb-6 transition-colors">
              <button
                onClick={() => setCalibratorMode('manual')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  calibratorMode === 'manual' 
                    ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Settings2 className="w-4 h-4" />
                Manual Grid Mapping
              </button>
              <button
                onClick={() => setCalibratorMode('auto')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  calibratorMode === 'auto' 
                    ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                Auto-Alignment
              </button>
            </div>

            {/* Render Selected Tool */}
            {calibratorMode === 'manual' ? (
              <GridMapper
                activeProfile={activeProfile}
                onSaveProfile={handleSaveProfile}
              />
            ) : (
              <PairAligner 
                activeProfile={activeProfile}
                onAppendMappings={handleAppendMappings}
              />
            )}
          </div>
        )}

        {activeTab === 'profiles' && (
          <ProfileManager
            profiles={profiles}
            onImportProfile={handleImportProfile}
            onDeleteProfile={handleDeleteProfile}
            onUpdateProfiles={handleBulkUpdateProfiles}
            onOpenCalibrator={(id) => {
              setSelectedProfileId(id);
              setActiveTab('calibrator');
            }}
            onOpenBatch={(id) => {
              setSelectedProfileId(id);
              setActiveTab('batch');
            }}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AksharEngine • Client-Side Offline Indic Font Converter</span>
          <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
            Zero dependencies • Pure TypeScript Engine
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
