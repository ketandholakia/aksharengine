import { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Download,
  Trash2,
  ArrowRightLeft,
  Zap,
  Clock,
  FileText,
  Grid,
  Files,
} from 'lucide-react';
import { useEngine } from '@/hooks/useEngine';
import { downloadText } from '@/utils/exporter';
import type { FontProfile } from '@/types/profile.types';
import type { ConversionResult } from '@/types/engine.types';

interface DualTextareaProps {
  profiles: FontProfile[];
  selectedProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onOpenCalibrator?: () => void;
  onOpenBatch?: () => void;
}

const emptyResult = (): ConversionResult => ({
  text: '',
  stats: {
    executionTimeMs: 0,
    inputCharCount: 0,
    outputCharCount: 0,
    replacementCount: 0,
  },
});

export function DualTextarea({
  profiles,
  selectedProfileId,
  onSelectProfile,
  onOpenCalibrator,
  onOpenBatch,
}: DualTextareaProps) {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'reverse'>('forward');

  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === selectedProfileId) ?? profiles[0];
  }, [profiles, selectedProfileId]);

  const legacyFontFamily = activeProfile?.fontFamilies?.[0] || 'monospace';

  const { convert } = useEngine(activeProfile ?? null, direction);

  const result: ConversionResult = useMemo(() => {
    if (!activeProfile || !inputText) return emptyResult();
    return convert(inputText);
  }, [convert, activeProfile, inputText, direction]);

  const handleCopy = async () => {
    if (!result.text) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    if (!result.text || !activeProfile) return;
    downloadText(`converted-unicode-${activeProfile.id}.txt`, result.text);
  };

  const handleClear = () => {
    setInputText('');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setDirection(d => d === 'forward' ? 'reverse' : 'forward')}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
              direction === 'forward'
                ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50'
                : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50'
            }`}
            title="Swap Conversion Direction"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 sm:flex-none">
            <label
              htmlFor="profile-select"
              className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5"
            >
              Select Font Profile
            </label>
            <select
              id="profile-select"
              value={selectedProfileId}
              onChange={(e) => onSelectProfile(e.target.value)}
              className="w-full sm:w-64 font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-colors"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.script})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 self-end mt-4 sm:mt-0 ml-0 sm:ml-2">
            {onOpenCalibrator && (
              <button
                onClick={onOpenCalibrator}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 sm:py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm font-medium"
                title="Open Calibrator"
              >
                <Grid className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Calibrator</span>
              </button>
            )}
            {onOpenBatch && (
              <button
                onClick={onOpenBatch}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 sm:py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm font-medium"
                title="Batch Conversion"
              >
                <Files className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Batch</span>
              </button>
            )}
          </div>
        </div>

        {inputText && (
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 w-full sm:w-auto justify-between sm:justify-end transition-colors">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              {result.stats.executionTimeMs} ms
            </span>
            <span className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              {result.stats.replacementCount} replacements
            </span>
            {result.stats.reorderCount ? (
              <>
                <span className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
                <span className="flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
                  {result.stats.reorderCount} reorders
                </span>
              </>
            ) : null}
            <span className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              {result.stats.outputCharCount} chars
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-all">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 transition-colors">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {direction === 'forward' ? 'Legacy Non-Unicode Text' : 'Standard Unicode Text'}
            </span>
            {inputText && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
                title="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={direction === 'forward' ? "Paste your legacy text here (e.g., Krutidev, TeraFont, Gujlys)..." : "Paste your standard Unicode text here..."}
            className={`${direction === 'forward' ? 'legacy-input' : ''} w-full h-80 md:h-96 p-4 resize-none focus:outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent`}
            style={{ 
              fontFamily: direction === 'forward' ? `"${legacyFontFamily}", sans-serif` : 'system-ui, -apple-system, sans-serif',
              fontSize: direction === 'forward' ? '1.25rem' : '1.125rem',
              lineHeight: '1.6'
            }}
          />
        </div>

        <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 transition-colors">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {direction === 'forward' ? 'Unicode Output' : 'Legacy Output'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!result.text}
                className={`text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition-all ${
                  copied
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!result.text}
                className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium transition-all"
                title="Download as .txt"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={result.text}
            placeholder={direction === 'forward' ? "Standardized Unicode text will appear here automatically..." : "Converted legacy text will appear here automatically..."}
            className={`${direction === 'reverse' ? 'legacy-input' : ''} w-full h-80 md:h-96 p-4 resize-none focus:outline-none text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/30`}
            style={{ 
              fontFamily: direction === 'forward' ? 'system-ui, -apple-system, sans-serif' : `"${legacyFontFamily}", sans-serif`,
              fontSize: direction === 'forward' ? '1.125rem' : '1.25rem',
              lineHeight: '1.6'
            }}
          />
        </div>
      </div>
    </div>
  );
}
