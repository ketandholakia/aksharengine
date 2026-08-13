import { useState, useMemo } from 'react';
import {
  Upload,
  Download,
  Trash2,
  FileText,
  Check,
  Copy,
  Zap,
  Clock,
} from 'lucide-react';
import { ConverterEngine } from '@/engine/ConverterEngine';
import { downloadText, readFileAsText } from '@/utils/exporter';
import type { FontProfile } from '@/types/profile.types';
import type { ConversionResult } from '@/types/engine.types';

interface BatchConverterProps {
  profiles: FontProfile[];
  selectedProfileId: string;
  onSelectProfile?: (profileId: string) => void;
}

interface FileConversion {
  fileName: string;
  legacyContent: string;
  unicodeContent: string;
  stats: ConversionResult['stats'];
  error?: string;
}

const emptyStats = () => ({
  executionTimeMs: 0,
  inputCharCount: 0,
  outputCharCount: 0,
  replacementCount: 0,
});

export function BatchConverter({
  profiles,
  selectedProfileId,
}: BatchConverterProps) {
  const [files, setFiles] = useState<FileConversion[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === selectedProfileId) ?? profiles[0];
  }, [profiles, selectedProfileId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const newFiles: FileConversion[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const content = await readFileAsText(file);
        newFiles.push({
          fileName: file.name,
          legacyContent: content,
          unicodeContent: '',
          stats: emptyStats(),
        });
      } catch {
        newFiles.push({
          fileName: file.name,
          legacyContent: '',
          unicodeContent: '',
          stats: emptyStats(),
          error: 'Failed to read file',
        });
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleConvert = async () => {
    if (!activeProfile || files.length === 0) return;
    
    setIsConverting(true);
    
    const engine = new ConverterEngine({ profile: activeProfile });
    
    const updatedFiles = await Promise.all(
      files.map((file) => {
        if (file.error || !file.legacyContent) {
          return file;
        }
        
        try {
          const result = engine.convert(file.legacyContent);
          return {
            ...file,
            unicodeContent: result.text,
            stats: result.stats,
          };
        } catch {
          return {
            ...file,
            error: 'Conversion failed',
          };
        }
      })
    );
    
    setFiles(updatedFiles);
    setIsConverting(false);
  };

  const handleClear = () => {
    setFiles([]);
  };

  const handleDownloadAll = () => {
    const allContent = files
      .filter((f) => f.unicodeContent)
      .map((f) => `=== ${f.fileName} ===\n${f.unicodeContent}`)
      .join('\n\n');
    
    if (allContent) {
      downloadText('batch-converted-output.txt', allContent);
    }
  };

  const handleCopyResults = async () => {
    const allContent = files
      .filter((f) => f.unicodeContent)
      .map((f) => f.unicodeContent)
      .join('\n');
    
    if (allContent) {
      try {
        await navigator.clipboard.writeText(allContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        console.error('Failed to copy');
      }
    }
  };

  const totalStats = useMemo(() => {
    return files.reduce(
      (acc, file) => ({
        executionTimeMs: acc.executionTimeMs + file.stats.executionTimeMs,
        inputCharCount: acc.inputCharCount + file.stats.inputCharCount,
        outputCharCount: acc.outputCharCount + file.stats.outputCharCount,
        replacementCount: acc.replacementCount + file.stats.replacementCount,
      }),
      { executionTimeMs: 0, inputCharCount: 0, outputCharCount: 0, replacementCount: 0 }
    );
  }, [files]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Batch Converter
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Convert multiple files at once
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="file"
            accept=".txt"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="batch-file-input"
          />
          <label
            htmlFor="batch-file-input"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload Files
          </label>
          
          <button
            onClick={handleConvert}
            disabled={isConverting || files.length === 0}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            {isConverting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Convert All
          </button>
          
          {files.length > 0 && (
            <button
              onClick={handleClear}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      {files.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 w-full sm:w-auto justify-between sm:justify-end transition-colors">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            {totalStats.executionTimeMs} ms
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            {totalStats.replacementCount} replacements
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            {totalStats.outputCharCount} chars
          </span>
        </div>
      )}

      {/* Results Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map((file, index) => (
            <div
              key={`${file.fileName}-${index}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors"
            >
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 transition-colors">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  {file.fileName}
                </span>
                {file.error && (
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Error
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-0">
                <div className="border-r border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 px-3 py-2 bg-slate-50 dark:bg-slate-800/50">
                    Legacy
                  </div>
                  <div className="h-32 p-3 font-mono text-xs overflow-y-auto auto-rows-min break-all bg-transparent text-slate-800 dark:text-slate-200">
                    {file.error ? '⚠️ ' + file.error : file.legacyContent || '(empty)'}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 px-3 py-2 bg-slate-50 dark:bg-slate-800/50">
                    Unicode
                  </div>
                  <div className="h-32 p-3 overflow-y-auto auto-rows-min break-all bg-transparent text-slate-900 dark:text-slate-100">
                    {file.unicodeContent || '(not converted yet)'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {files.some((f) => f.unicodeContent) && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyResults}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium transition-all text-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy All'}
          </button>
          <button
            onClick={handleDownloadAll}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm shadow-brand-500/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Download All
          </button>
        </div>
      )}
    </div>
  );
}
