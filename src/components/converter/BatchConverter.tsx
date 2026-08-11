import React, { useState, useRef, useMemo } from 'react';
import { 
  Upload, 
  FileText, 
  Download, 
  CheckCircle2, 
  Trash2, 
  ArrowRightLeft,
  Loader2,
  FileDown
} from 'lucide-react';
import type { ConversionResult } from '../../types/engine.types';
import type { FontProfile } from '../../types/profile.types';
import { ConverterEngine } from '../../engine/ConverterEngine';

interface BatchConverterProps {
  profiles: FontProfile[];
  selectedProfileId: string;
  onSelectProfile: (profileId: string) => void;
}

interface ProcessedFile {
  id: string;
  originalName: string;
  originalText: string;
  convertedText: string | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  stats?: ConversionResult['stats'];
}

export const BatchConverter: React.FC<BatchConverterProps> = ({
  profiles,
  selectedProfileId,
  onSelectProfile,
}) => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active profile and Engine instance
  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === selectedProfileId) || profiles[0];
  }, [profiles, selectedProfileId]);

  const engine = useMemo(() => {
    return activeProfile ? new ConverterEngine({ profile: activeProfile }) : null;
  }, [activeProfile]);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    const newFiles: ProcessedFile[] = [];

    for (const file of selectedFiles) {
      try {
        const text = await file.text();
        newFiles.push({
          id: crypto.randomUUID(),
          originalName: file.name,
          originalText: text,
          convertedText: null,
          status: 'pending',
        });
      } catch (err) {
        console.error(`Failed to read ${file.name}`, err);
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
  };

  // Process all pending files
  const handleProcessAll = async () => {
    if (!engine || isProcessing) return;
    setIsProcessing(true);

    const updatedFiles = [...files];

    // Process sequentially to avoid blocking the main thread heavily
    for (let i = 0; i < updatedFiles.length; i++) {
      if (updatedFiles[i].status !== 'done') {
        updatedFiles[i].status = 'processing';
        setFiles([...updatedFiles]); // Trigger UI update to show processing state

        // Slight artificial delay to allow UI to render the 'processing' badge
        await new Promise((resolve) => setTimeout(resolve, 50)); 

        try {
          const result = engine.convert(updatedFiles[i].originalText);
          updatedFiles[i].convertedText = result.text;
          updatedFiles[i].stats = result.stats;
          updatedFiles[i].status = 'done';
        } catch (err) {
          updatedFiles[i].status = 'error';
        }
      }
    }

    setFiles([...updatedFiles]);
    setIsProcessing(false);
  };

  // Download a single file
  const handleDownload = (file: ProcessedFile) => {
    if (!file.convertedText) return;
    
    // Create new filename: original.txt -> original_unicode.txt
    const newName = file.originalName.replace(/\.txt$/i, '') + '_unicode.txt';
    
    const blob = new Blob([file.convertedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = newName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download all processed files (staggered to prevent browser blocking)
  const handleDownloadAll = async () => {
    const doneFiles = files.filter(f => f.status === 'done');
    for (const file of doneFiles) {
      handleDownload(file);
      await new Promise(resolve => setTimeout(resolve, 300)); // 300ms gap
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleClearAll = () => {
    setFiles([]);
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const doneCount = files.filter(f => f.status === 'done').length;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Bar: Profile Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div className="flex-1 sm:flex-none">
            <label htmlFor="batch-profile-select" className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
              Select Font Profile
            </label>
            <select
              id="batch-profile-select"
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
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Dropzone & Actions */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-fit space-y-4 transition-colors">
          <div className="text-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <input 
              type="file" 
              multiple 
              accept=".txt" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <div className="mx-auto w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center mb-3 text-brand-600 dark:text-brand-400 shadow-sm transition-colors">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Upload .txt Files</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Select multiple legacy text files for batch conversion.</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              Browse Files
            </button>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleProcessAll}
              disabled={pendingCount === 0 || isProcessing}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm shadow-brand-500/20"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isProcessing ? 'Processing...' : `Convert All (${pendingCount} pending)`}
            </button>
            
            <button
              onClick={handleDownloadAll}
              disabled={doneCount === 0 || isProcessing}
              className="w-full py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <FileDown className="w-4 h-4" />
              Download All Converted ({doneCount})
            </button>
          </div>
        </div>

        {/* Right Column: File List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Queue ({files.length})
            </span>
            {files.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Queue
              </button>
            )}
          </div>
          
          <div className="p-2 overflow-y-auto max-h-[500px]">
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                <FileText className="w-12 h-12 mb-3 text-slate-200 dark:text-slate-700" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Queue is empty</p>
                <p className="text-xs">Upload .txt files to get started</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {files.map((file) => (
                  <li key={file.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate" title={file.originalName}>
                          {file.originalName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {file.status === 'pending' && <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-1.5 rounded">Pending</span>}
                          {file.status === 'processing' && <span className="text-[10px] font-bold uppercase text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-1.5 rounded flex items-center gap-1"><Loader2 className="w-2.5 h-2.5 animate-spin"/> Processing</span>}
                          {file.status === 'done' && <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 rounded">Done</span>}
                          {file.status === 'error' && <span className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-1.5 rounded">Failed</span>}
                          
                          {file.stats && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {file.stats.executionTimeMs}ms • {file.stats.replacementCount} edits
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      {file.status === 'done' && (
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded transition-colors"
                          title="Download Converted File"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
