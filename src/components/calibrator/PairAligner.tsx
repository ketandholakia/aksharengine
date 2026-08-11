import React, { useState } from 'react';
import { Play, Check, ArrowRight, Zap, Info } from 'lucide-react';
import type { FontProfile, MappingRule } from '../../types/profile.types';
import { PairAlignerAlgorithm, type ExtractedMapping } from '../../engine/PairAlignerAlgorithm';

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
  const [results, setResults] = useState<ExtractedMapping[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [hasRun, setHasRun] = useState(false);

  const handleExtract = () => {
    if (!legacySample.trim() || !unicodeSample.trim()) return;
    const extracted = PairAlignerAlgorithm.extract(legacySample, unicodeSample);

    // Filter out rules that already exist in the active profile
    const existingKeys = new Set(activeProfile.mappings.map((m) => m.legacy));
    const newDiscoveries = extracted.filter((r) => !existingKeys.has(r.legacy));

    setResults(newDiscoveries);
    // Auto-select highly confident mappings
    setSelectedIndices(new Set(newDiscoveries.map((_, i) => i)));
    setHasRun(true);
  };

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

    // Remove merged items from results view
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
            Paste a paragraph of legacy text and its exact Unicode translation. The engine will guess the character mappings.
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
            onChange={(e) => setLegacySample(e.target.value)}
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
            onChange={(e) => setUnicodeSample(e.target.value)}
            placeholder="Paste the exact equivalent in standard Unicode..."
            className="w-full h-32 p-3 text-sm border border-slate-300 dark:border-slate-700 bg-transparent dark:text-slate-200 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none transition-colors"
          />
        </div>
      </div>

      <button
        onClick={handleExtract}
        disabled={!legacySample || !unicodeSample}
        className="w-full py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
      >
        <Play className="w-4 h-4" />
        Run Alignment Engine
      </button>

      {hasRun && (
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Discovered Mappings ({results.length})
            </h3>
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

          {results.length === 0 ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm transition-colors">
              <Info className="w-4 h-4" />
              No new high-confidence mappings discovered, or all found mappings already exist in the profile.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1">
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
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        res.confidence > 90 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      }`}>
                        {res.confidence}% match
                      </span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-600" />
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-lg mt-1">
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{res.legacy}</span>
                      <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                      <span className="font-bold text-brand-700 dark:text-brand-400">{res.unicode}</span>
                    </div>

                    <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
                      {res.category} • {res.occurrences} instances
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
