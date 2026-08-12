import React, { useState, useMemo, useEffect } from 'react';
import {
  Grid,
  Plus,
  Trash2,
  Search,
  Filter,
  Save,
  RotateCcw,
  Sparkles,
  Check,
  AlertCircle,
  CheckSquare,
  Square,
  Download,
  Upload
} from 'lucide-react';
import type { FontProfile, MappingRule } from '../../types/profile.types';
import { downloadCSV, parseCSV, readFileAsText } from '../../utils/exporter';

interface GridMapperProps {
  activeProfile: FontProfile;
  onSaveProfile: (updatedProfile: FontProfile) => void;
}

type CategoryFilter = 'all' | 'consonant' | 'vowel' | 'matra' | 'conjunct' | 'numeral' | 'modifier' | 'symbol';

export const GridMapper: React.FC<GridMapperProps> = ({
  activeProfile,
  onSaveProfile,
}) => {
  const [mappings, setMappings] = useState<MappingRule[]>(activeProfile.mappings || []);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  
  // Bulk selection state
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Sync local mappings when the active profile changes
  useEffect(() => {
    setMappings(activeProfile.mappings || []);
    setSelectedIndices(new Set());
  }, [activeProfile.id]);

  // New Rule Form State
  const [newLegacy, setNewLegacy] = useState<string>('');
  const [newUnicode, setNewUnicode] = useState<string>('');
  const [newCategory, setNewCategory] = useState<MappingRule['category']>('consonant');

  const profileFontFamily = useMemo(() => {
    const families = activeProfile.fontFamilies ?? [];
    if (families.length === 0) return 'monospace';
    return [...families.map((family) => `"${family}"`), 'monospace'].join(', ');
  }, [activeProfile.fontFamilies]);

  // Compute Conflicts (Duplicate Legacy or Duplicate Unicode)
  const conflicts = useMemo(() => {
    const map = new Map<number, 'duplicate-legacy' | 'duplicate-unicode'>();
    const legacyCounts = new Map<string, number[]>();
    const unicodeCounts = new Map<string, number[]>();

    mappings.forEach((rule, idx) => {
      if (!legacyCounts.has(rule.legacy)) legacyCounts.set(rule.legacy, []);
      legacyCounts.get(rule.legacy)!.push(idx);

      if (!unicodeCounts.has(rule.unicode)) unicodeCounts.set(rule.unicode, []);
      unicodeCounts.get(rule.unicode)!.push(idx);
    });

    legacyCounts.forEach((indices) => {
      if (indices.length > 1) {
        indices.forEach(idx => map.set(idx, 'duplicate-legacy'));
      }
    });

    unicodeCounts.forEach((indices) => {
      if (indices.length > 1) {
        // Only set duplicate-unicode if it's not already a duplicate-legacy (legacy conflict is more critical)
        indices.forEach(idx => {
          if (!map.has(idx)) map.set(idx, 'duplicate-unicode');
        });
      }
    });

    return map;
  }, [mappings]);

  // Filter Mappings based on Search and Category
  const filteredIndices = useMemo(() => {
    return mappings
      .map((rule, idx) => ({ rule, idx }))
      .filter(({ rule }) => {
        const matchesSearch =
          rule.legacy.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rule.unicode.includes(searchQuery);
        const matchesCategory =
          selectedCategory === 'all' || rule.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .map(({ idx }) => idx);
  }, [mappings, searchQuery, selectedCategory]);

  const handleRuleChange = (index: number, field: 'legacy' | 'unicode', value: string) => {
    const updated = [...mappings];
    updated[index] = { ...updated[index], [field]: value };
    setMappings(updated);
  };

  const handleDeleteRule = (index: number) => {
    const updated = mappings.filter((_, i) => i !== index);
    setMappings(updated);
    const newSelected = new Set(selectedIndices);
    newSelected.delete(index);
    // Shift indices above down by 1 to maintain selection? It's easier to just clear selection
    setSelectedIndices(new Set());
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLegacy.trim() || !newUnicode.trim()) return;

    const newRule: MappingRule = {
      legacy: newLegacy.trim(),
      unicode: newUnicode.trim(),
      category: newCategory,
    };

    setMappings([newRule, ...mappings]);
    setNewLegacy('');
    setNewUnicode('');
    setSelectedIndices(new Set());
  };

  const handleSave = () => {
    const updatedProfile: FontProfile = {
      ...activeProfile,
      mappings,
      updatedAt: new Date().toISOString(),
    };
    onSaveProfile(updatedProfile);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = () => {
    setMappings(activeProfile.mappings || []);
    setSelectedIndices(new Set());
  };

  // CSV Import/Export
  const handleExportCSV = () => {
    const rows = [['Legacy', 'Unicode', 'Category']];
    mappings.forEach(m => rows.push([m.legacy, m.unicode, m.category]));
    downloadCSV(`${activeProfile.id}-mappings`, rows);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await readFileAsText(file);
      const rows = parseCSV(text);
      
      // Skip header row if it exists
      const startIndex = rows[0]?.[0]?.toLowerCase() === 'legacy' ? 1 : 0;
      
      const newMappings: MappingRule[] = [];
      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (row.length >= 2 && row[0].trim() && row[1].trim()) {
          newMappings.push({
            legacy: row[0].trim(),
            unicode: row[1].trim(),
            category: (row[2]?.trim().toLowerCase() as MappingRule['category']) || 'consonant'
          });
        }
      }

      if (newMappings.length > 0) {
        // Merge with existing, avoiding exact duplicates (same legacy + unicode)
        const existingSet = new Set(mappings.map(m => `${m.legacy}::${m.unicode}`));
        const filteredNew = newMappings.filter(m => !existingSet.has(`${m.legacy}::${m.unicode}`));
        
        setMappings([...filteredNew, ...mappings]);
        setSelectedIndices(new Set());
      }
    } catch (err) {
      console.error('Failed to import CSV:', err);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Bulk Operations
  const toggleSelection = (idx: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setSelectedIndices(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === filteredIndices.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(filteredIndices));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIndices.size === 0) return;
    const updated = mappings.filter((_, idx) => !selectedIndices.has(idx));
    setMappings(updated);
    setSelectedIndices(new Set());
  };

  const handleBulkCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (selectedIndices.size === 0) return;
    const cat = e.target.value as MappingRule['category'];
    if (!cat) return;
    const updated = mappings.map((rule, idx) => {
      if (selectedIndices.has(idx)) return { ...rule, category: cat };
      return rule;
    });
    setMappings(updated);
    // don't clear selection so they can do more things if needed
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Header & Save Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
            <Grid className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Grid Mapper Calibration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Editing profile: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeProfile.name}</span> ({mappings.length} glyph rules)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleReset}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1"></div>

          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleImportCSV}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            title="Import mappings from CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            title="Export mappings to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={handleSave}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 text-white shadow-sm transition-all ${
              savedSuccess
                ? 'bg-emerald-600 dark:bg-emerald-500'
                : 'bg-brand-600 dark:bg-brand-500 hover:bg-brand-700 dark:hover:bg-brand-600 shadow-brand-500/20'
            }`}
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {savedSuccess ? 'Changes Saved!' : 'Save Mapping Profile'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Add New Rule Panel */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 h-fit transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 transition-colors">
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Add Glyph Mapping Rule</h3>
          </div>

          <form onSubmit={handleAddRule} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Legacy Key / Glyph Code
              </label>
              <input
                type="text"
                value={newLegacy}
                onChange={(e) => setNewLegacy(e.target.value)}
                placeholder="e.g. s or à"
                className="w-full px-3 py-2 font-mono text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-slate-200 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Target Unicode Character
              </label>
              <input
                type="text"
                value={newUnicode}
                onChange={(e) => setNewUnicode(e.target.value)}
                placeholder="e.g. ક or ા"
                className="w-full px-3 py-2 text-base border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-slate-200 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Glyph Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as MappingRule['category'])}
                className="w-full px-3 py-2 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              >
                <option value="consonant">Consonant</option>
                <option value="vowel">Vowel</option>
                <option value="matra">Matra / Vowel Sign</option>
                <option value="conjunct">Conjunct / Half-Letter</option>
                <option value="numeral">Numeral</option>
                <option value="modifier">Modifier / Anusvara</option>
                <option value="symbol">Symbol</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors pt-2.5"
            >
              <Plus className="w-4 h-4" />
              Add Rule
            </button>
          </form>
        </div>

        {/* Right Column: Filterable Character Mapping Grid */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search, Filter & Bulk Actions Bar */}
          <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by legacy key or Unicode character..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 hidden sm:block" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as CategoryFilter)}
                  className="w-full sm:w-auto px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                >
                  <option value="all">All Categories</option>
                  <option value="consonant">Consonants</option>
                  <option value="vowel">Vowels</option>
                  <option value="matra">Matras</option>
                  <option value="conjunct">Conjuncts</option>
                  <option value="numeral">Numerals</option>
                  <option value="symbol">Symbols</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions Toolbar */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                {selectedIndices.size > 0 && selectedIndices.size === filteredIndices.length ? (
                  <CheckSquare className="w-4 h-4 text-brand-600" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                Select All
              </button>
              
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {selectedIndices.size} selected
              </span>

              {selectedIndices.size > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <select
                    onChange={handleBulkCategoryChange}
                    defaultValue=""
                    className="px-2 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  >
                    <option value="" disabled>Set Category...</option>
                    <option value="consonant">Consonant</option>
                    <option value="vowel">Vowel</option>
                    <option value="matra">Matra</option>
                    <option value="conjunct">Conjunct</option>
                    <option value="numeral">Numeral</option>
                    <option value="symbol">Symbol</option>
                  </select>
                  
                  <button
                    onClick={handleBulkDelete}
                    className="px-2 py-1 flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Grid View */}
          {filteredIndices.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-xs transition-colors">
              No matching mapping rules found. Try clearing your search query or filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
              {filteredIndices.map((originalIdx) => {
                const rule = mappings[originalIdx];
                const stableKey = `${rule.legacy}-${rule.unicode}-${originalIdx}`;
                const conflictType = conflicts.get(originalIdx);
                const isSelected = selectedIndices.has(originalIdx);

                let borderClass = isSelected ? 'border-brand-400 dark:border-brand-500 bg-brand-50/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
                if (conflictType === 'duplicate-legacy') {
                  borderClass = 'border-red-400 dark:border-red-500/70 bg-red-50/30 dark:bg-red-900/10';
                } else if (conflictType === 'duplicate-unicode') {
                  borderClass = 'border-amber-400 dark:border-amber-500/70 bg-amber-50/30 dark:bg-amber-900/10';
                }

                return (
                  <div
                    key={stableKey}
                    className={`p-3 rounded-xl border shadow-sm flex items-start gap-3 transition-all group ${borderClass} hover:shadow-md cursor-pointer`}
                    onClick={() => toggleSelection(originalIdx)}
                  >
                    <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                       <button onClick={() => toggleSelection(originalIdx)} className="text-slate-400 hover:text-brand-500">
                         {isSelected ? <CheckSquare className="w-4 h-4 text-brand-500" /> : <Square className="w-4 h-4" />}
                       </button>
                    </div>

                    <div className="flex items-center gap-2 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                      {/* Legacy Key Input */}
                      <div className="flex-1">
                        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                          Legacy
                          {conflictType === 'duplicate-legacy' && (
                            <AlertCircle className="w-3 h-3 text-red-500" title="Duplicate Legacy Key (Conflict)" />
                          )}
                        </span>
                        <input
                          type="text"
                          value={rule.legacy}
                          onChange={(e) => handleRuleChange(originalIdx, 'legacy', e.target.value)}
                          className={`w-full px-2 py-1 font-mono text-xs border rounded focus:outline-none focus:ring-1 transition-colors ${
                            conflictType === 'duplicate-legacy' 
                              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:ring-red-500' 
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-brand-500'
                          }`}
                        />
                      </div>

                      <span className="text-slate-300 dark:text-slate-600 font-bold text-xs mt-3">➔</span>

                      {/* Target Unicode Input */}
                      <div className="flex-1">
                        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                          Unicode
                          {conflictType === 'duplicate-unicode' && (
                            <AlertCircle className="w-3 h-3 text-amber-500" title="Duplicate Unicode (Lossy)" />
                          )}
                        </span>
                        <input
                          type="text"
                          value={rule.unicode}
                          onChange={(e) => handleRuleChange(originalIdx, 'unicode', e.target.value)}
                          className={`w-full px-2 py-1 text-sm font-semibold border rounded focus:outline-none focus:ring-1 text-slate-800 dark:text-slate-200 transition-colors ${
                            conflictType === 'duplicate-unicode'
                              ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 focus:ring-amber-500'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-brand-500'
                          }`}
                        />
                      </div>

                      {/* Profile Font Preview */}
                      <div className="flex-1 min-w-0">
                        <span className="block text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                          Preview
                        </span>
                        <div
                          className="w-full px-2 py-1 rounded bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/40 text-slate-900 dark:text-slate-100 text-sm leading-none truncate"
                          style={{ fontFamily: profileFontFamily }}
                          title={rule.legacy}
                        >
                          {rule.legacy || ' '}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 mt-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDeleteRule(originalIdx)}
                        className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Delete rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
