import React, { useMemo, useState } from 'react';
import { Play, Check, ArrowRight, Zap, Info, Edit3, Settings2 } from 'lucide-react';
import type { FontProfile, MappingRule } from '../../types/profile.types';
import { PairAlignerAlgorithm, type ExtractedMapping, type WordPair } from '../../engine/PairAlignerAlgorithm';

interface PairAlignerProps {
  activeProfile: FontProfile;
  onAppendMappings: (newRules: MappingRule[]) => void;
}

export const PairAligner: React.FC<PairAlignerProps> = ({
  activeProfile,
  onAppendMappings,
}) => {
  const [legacySample, setLegacySample] = useState('');
  const [unicodeSample, setUnicodeSample] = useState('');
  
  // State for step 1: Word Alignment
  const [wordPairs, setWordPairs] = useState<WordPair[]>([]);
  const [isAligning, setIsAligning] = useState(false);
  const [editingPairIdx, setEditingPairIdx] = useState<number | null>(null);

  // State for step 2: Extraction
  const [results, setResults] = useState<ExtractedMapping[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [hasExtracted, setHasExtracted] = useState(false);

  const profileFontFamily = useMemo(() => {
    const families = activeProfile.fontFamilies ?? [];
    if (families.length === 0) return 'monospace';
    return [...families.map((family) => `"${family}"`), 'monospace'].join(', ');
  }, [activeProfile.fontFamilies]);

  // Step 1: Align Words
  const handleAlignWords = () => {
    if (!legacySample.trim() || !unicodeSample.trim()) return;
    const pairs = PairAlignerAlgorithm.alignWords(legacySample, unicodeSample);
    setWordPairs(pairs);
    setIsAligning(true);
    setHasExtracted(false);
    setResults([]);
  };

  const handlePairChange = (idx: number, field: 'legacy' | 'unicode', value: string) => {
    const updated = [...wordPairs];
    updated[idx] = { ...updated[idx], [field]: value };
    setWordPairs(updated);
  };

  const handleDeletePair = (idx: number) => {
    const updated = wordPairs.filter((_, i) => i !== idx);
    setWordPairs(updated);
    if (editingPairIdx === idx) setEditingPairIdx(null);
  };

  // Step 2: Extract Mappings
  const handleExtract = () => {
    if (wordPairs.length === 0) return;
    const extracted = PairAlignerAlgorithm.extractFromPairs(wordPairs);

    const existingKeys = new Set(activeProfile.mappings.map((m) => m.legacy));
    const newDiscoveries = extracted.filter((r) => !existingKeys.has(r.legacy));

    setResults(newDiscoveries);
    setSelectedIndices(new Set(newDiscoveries.map((_, i) => i)));
    setHasExtracted(true);
    setIsAligning(false); // Move to extraction view
  };

  // Step 3: Merge Mappings
  const toggleSelection = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedIndices(newSet);
  };

  const handleMerge = () => {
    const rulesToAdd = results
      .filter((_, idx) => selectedIndices.has(idx))
      .map((r) => ({
        legacy: r.legacy,
        unicode: r.unicode,
        category: r.category,
      } as MappingRule));

    onAppendMappings(rulesToAdd);
    setResults(results.filter((_, idx) => !selectedIndices.has(idx)));
    setSelectedIndices(new Set());
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Auto-Calibration Aligner</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Paste a paragraph of legacy text and its exact Unicode translation to automatically extract character mappings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
            Legacy Text Sample
          </label>
          <textarea
            value={legacySample}
            onChange={(e) => { setLegacySample(e.target.value); setIsAligning(false); setHasExtracted(false); }}
            placeholder="Paste text in Krutidev, TeraFont, etc..."
            className="w-full h-32 p-3 font-mono text-sm border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
            Unicode Reference Text
          </label>
          <textarea
            value={unicodeSample}
            onChange={(e) => { setUnicodeSample(e.target.value); setIsAligning(false); setHasExtracted(false); }}
            placeholder="Paste the exact equivalent in standard Unicode..."
            className="w-full h-32 p-3 text-sm border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none transition-colors"
          />
        </div>
      </div>

      {!isAligning && !hasExtracted && (
        <button
          onClick={handleAlignWords}
          disabled={!legacySample || !unicodeSample}
          className="w-full py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
        >
          <Settings2 className="w-4 h-4" />
          Align Words (Step 1)
        </button>
      )}

      {/* Step 1: Word Alignment Interactive View */}
      {isAligning && (
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4 transition-colors animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Word Alignments ({wordPairs.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verify that the legacy words perfectly match the Unicode words before extracting mappings. Click any pair to edit.
              </p>
            </div>
            <button
              onClick={handleExtract}
              disabled={wordPairs.length === 0}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all"
            >
              <Play className="w-4 h-4" />
              Extract Mappings
            </button>
          </div>

          <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-1">
            {wordPairs.map((pair, idx) => (
              <div 
                key={idx} 
                onClick={() => setEditingPairIdx(editingPairIdx === idx ? null : idx)}
                className={`relative group cursor-pointer border rounded-lg overflow-hidden transition-all ${
                  editingPairIdx === idx 
                    ? 'border-brand-500 ring-2 ring-brand-500/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-brand-300'
                }`}
              >
                {editingPairIdx === idx ? (
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-2 min-w-[150px]">
                    <input
                      type="text"
                      value={pair.legacy}
                      onChange={(e) => handlePairChange(idx, 'legacy', e.target.value)}
                      className="w-full px-2 py-1 text-xs font-mono border rounded bg-white dark:bg-slate-900"
                      placeholder="Legacy"
                      onClick={e => e.stopPropagation()}
                    />
                    <input
                      type="text"
                      value={pair.unicode}
                      onChange={(e) => handlePairChange(idx, 'unicode', e.target.value)}
                      className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-900"
                      placeholder="Unicode"
                      onClick={e => e.stopPropagation()}
                    />
                    <div className="flex gap-2 mt-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingPairIdx(null); }}
                        className="flex-1 px-2 py-1 bg-slate-200 dark:bg-slate-700 text-xs rounded hover:bg-slate-300"
                      >
                        Done
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeletePair(idx); }}
                        className="flex-1 px-2 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200"
                      >
                        Drop
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col bg-white dark:bg-slate-800">
                    <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
                      <div className="text-xs font-mono text-slate-700 dark:text-slate-300 text-center" style={{ fontFamily: profileFontFamily }}>
                        {pair.legacy || <span className="opacity-30">empty</span>}
                      </div>
                    </div>
                    <div className="px-3 py-1.5 text-center text-xs font-medium text-brand-700 dark:text-brand-400">
                      {pair.unicode || <span className="opacity-30">empty</span>}
                    </div>
                    <div className="absolute inset-0 bg-slate-900/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Edit3 className="w-4 h-4 text-slate-600 dark:text-slate-300 drop-shadow" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Extraction Results View */}
      {hasExtracted && (
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4 transition-colors animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Discovered Mappings ({results.length})
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setIsAligning(true); setHasExtracted(false); }}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold rounded-lg transition-all"
              >
                Back to Alignment
              </button>
              {results.length > 0 && (
                <button
                  onClick={handleMerge}
                  disabled={selectedIndices.size === 0}
                  className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  Merge {selectedIndices.size} Selected
                </button>
              )}
            </div>
          </div>

          {results.length === 0 ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm transition-colors">
              <Info className="w-4 h-4" />
              No new high-confidence mappings discovered, or all found mappings already exist in the profile.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
              {results.map((res, idx) => {
                const isSelected = selectedIndices.has(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleSelection(idx)}
                    className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      isSelected
                        ? 'border-brand-500 dark:border-brand-400 bg-brand-50 dark:bg-brand-900/30'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          res.confidence > 90
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {res.confidence}% match
                      </span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-600" />
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 w-full items-center mt-1">
                      <div className="min-w-0">
                        <span className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                          Legacy
                        </span>
                        <div className="truncate font-mono font-bold text-slate-700 dark:text-slate-200 text-lg">
                          {res.legacy}
                        </div>
                      </div>
                      <div className="flex justify-center pt-3">
                        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                          Preview
                        </span>
                        <div
                          className="truncate font-bold text-slate-900 dark:text-slate-100 text-lg"
                          style={{ fontFamily: profileFontFamily }}
                          title={res.legacy}
                        >
                          {res.legacy}
                        </div>
                      </div>
                    </div>

                    <div className="w-full">
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                        Unicode
                      </span>
                      <div className="font-bold text-brand-700 dark:text-brand-400 text-base leading-snug">
                        {res.unicode}
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize self-start">
                      {res.category} {"•"} {res.occurrences} instances
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
