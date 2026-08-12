/**
 * AksharEngine - Core Type Definitions & JSON Profile Schemas
 */

/**
 * Supported script types for Indic language mapping.
 */
  | 'gujarati'
  | 'devanagari'
  | 'bengali'
  | 'gurmukhi'
  | 'odia'
  | 'tamil'
  | 'telugu'
  | 'kannada'
  | 'malayalam'
  | 'perso-arabic'
  | 'ol-chiki'
  | 'meetei-mayek'
  | 'custom'
  | string;

/**
 * Single character or sequence mapping definition.
 */
export interface MappingRule {
  /** The legacy glyph sequence (e.g., 'à', 'ö', 's', 'ક્ષ') */
  legacy: string;
  /** The corresponding Unicode character or conjunct (e.g., 'ા', 'ૌ', 'ક', 'ક્ષ') */
  unicode: string;
  /** Optional description or label for calibration UI tooltips */
  description?: string;
  /** Tags for categorization (e.g., 'vowel', 'consonant', 'matra', 'conjunct') */
  category?: 'vowel' | 'consonant' | 'matra' | 'conjunct' | 'numeral' | 'symbol' | 'modifier';
}

/**
 * Legacy alias kept for backwards compatibility with simpler components.
 * @deprecated Prefer MappingRule.
 */
export type LegacyMapping = MappingRule;

/**
 * Script-specific reordering rules for non-linear glyph alignments.
 */
export interface ReorderingRules {
  /**
   * Symbol(s) representing Left Matra (Chhoti-I) that appear BEFORE
   * the consonant in legacy text but must be positioned AFTER the consonant in Unicode.
   */
  leftMatraSymbols?: string[];

  /**
   * Symbol(s) representing Reph (Arkavattu / Flying R) that appear AFTER
   * or OVER the consonant in legacy text but precede it in Unicode decomposition.
   */
  rephSymbols?: string[];

  /**
   * Custom Regex transformation patterns for complex font-specific edge cases.
   * Executed after primary direct substitution and basic matra reordering.
   */
  customTransforms?: Array<{
    pattern: string;
    replacement: string;
    flags?: string;
    description?: string;
  }>;
}

/**
 * Backwards-compatible single-symbol reordering config.
 * @deprecated Prefer ReorderingRules.
 */
export interface ReorderingRulesConfig {
  leftMatraSymbol: string;
  rephSymbol: string;
}

/**
 * Complete structure of a Font Mapping JSON Profile.
 */
export interface FontProfile {
  /** Unique identifier for the profile (e.g., 'terafont-kinnari-gujarati') */
  id: string;

  /** Human-readable display name (e.g., 'TeraFont Kinnari (Gujarati)') */
  name: string;

  /** Target Indic script type */
  script: ScriptType;

  /** Target language code (e.g., 'gu', 'hi', 'ne', 'mr') */
  language?: string;

  /** Profile schema versioning (e.g., '1.0.0') */
  version: string;

  /** Author or maintainer info */
  author?: {
    name: string;
    email?: string;
    url?: string;
  };

  /** Font family names this profile applies to */
  fontFamilies?: string[];

  /** Reordering rules for matras, reph, and special conjuncts */
  reorderingRules?: ReorderingRules;

  /** Backwards-compatible single-symbol reordering config. */
  reorderingRulesLegacy?: ReorderingRulesConfig;

  /** Array of legacy-to-Unicode mapping rules */
  mappings: MappingRule[];

  /** Metadata flags */
  isBuiltIn?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Storage profile item structure used by local storage or IndexedDB adapters.
 */
export interface StoredProfileEntry {
  profile: FontProfile;
  isFavorite?: boolean;
  lastUsedAt?: string;
}
