import React, { useState, useMemo } from 'react';
import {
  Grid,
  Plus,
  Trash2,
  Search,
  Filter,
  Save,
  RotateCcw,
  Sparkles,
  Check
} from 'lucide-react';
import type { FontProfile, MappingRule } from '../../types/profile.types';

interface GridMapperProps {
  activeProfile: FontProfile;
  onSaveProfile: (updatedProfile: FontProfile) => void;
}

type CategoryFilter = 'all' | 'consonant' | 'vowel' | 'matra' | 'conjunct' | 'numeral' | 'symbol';

export const GridMapper: React.FC<GridMapperProps> = ({
  activeProfile,
  onSaveProfile,
}) => {
  const [mappings, setMappings] = useState<MappingRule[]>(activeProfile.mappings || []);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // New Rule Form State
  const [newLegacy, setNewLegacy] = useState<string>('');
  const [newUnicode, setNewUnicode] = useState<string>('');
  const [newCategory, setNewCategory] = useState<MappingRule['category']>('consonant');

  // Filter Mappings based on Search and Category
  const filteredMappings = useMemo(() => {
    return mappings.filter((rule) => {
      const matchesSearch =
        rule.legacy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.unicode.includes(searchQuery);

      const matchesCategory =
        selectedCategory === 'all' || rule.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [mappings, searchQuery, selectedCategory]);

  // Update a single rule entry in the local array
  const handleRuleChange = (index: number, field: 'legacy' | 'unicode', value: string) => {
    const updated = [...mappings];
    updated[index] = { ...updated[index], [field]: value };
    setMappings(updated);
  };

  // Delete a rule
  const handleDeleteRule = (index: number) => {
    const updated = mappings.filter((_, i) => i !== index);
    setMappings(updated);
  };

  // Add a new mapping rule
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
  };

  // Save changes back to parent profile state
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

  // Reset local changes back to the active profile's initial mappings
  const handleReset = () => {
    setMappings(activeProfile.mappings || []);
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

      {/* Add New Mapping Form & Filters Toolbar */}
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
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
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

          {/* Grid View */}
          {filteredMappings.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-xs transition-colors">
              No matching mapping rules found. Try clearing your search query or filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
              {filteredMappings.map((rule, idx) => {
                const stableKey = `${rule.legacy}-${rule.unicode}-${idx}`;
                return (
                  <div
                    key={stableKey}
                    className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {/* Legacy Key Input */}
                      <div className="flex-1">
                        <span className="block text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                          Legacy
                        </span>
                        <input
                          type="text"
                          value={rule.legacy}
                          onChange={(e) => handleRuleChange(idx, 'legacy', e.target.value)}
                          className="w-full px-2 py-1 font-mono text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
                        />
                      </div>

                      <span className="text-slate-300 dark:text-slate-600 font-bold text-xs mt-3">➔</span>

                      {/* Target Unicode Input */}
                      <div className="flex-1">
                        <span className="block text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                          Unicode
                        </span>
                        <input
                          type="text"
                          value={rule.unicode}
                          onChange={(e) => handleRuleChange(idx, 'unicode', e.target.value)}
                          className="w-full px-2 py-1 text-sm font-semibold border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800 dark:text-slate-200 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => handleDeleteRule(idx)}
                      className="p-1.5 text-slate-300 dark:text-slate-600 group-hover:text-red-500 dark:group-hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors mt-3"
                      title="Delete rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
