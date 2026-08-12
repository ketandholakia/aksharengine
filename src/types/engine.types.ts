import type { FontProfile } from './profile.types';

/**
 * Options passed into the ConverterEngine transformation pipeline.
 */
export interface ConversionOptions {
  /** Target font profile. Required. */
  profile: FontProfile;

  /** Conversion direction. Default: 'forward' (Legacy to Unicode) */
  direction?: 'forward' | 'reverse';

  /** Enable or disable Left-Matra (Chhoti-I) positional reordering. Default: true */
  enableMatraReordering?: boolean;

  /** Enable or disable Reph (Flying R) positional reordering. Default: true */
  enableRephReordering?: boolean;

  /** Enable Unicode Normalization Form C (NFC) post-processing. Default: true */
  normalizeNFC?: boolean;

  /** Preserve unknown legacy characters as-is instead of stripping them. Default: true */
  preserveUnmappedChars?: boolean;

  /** Strip zero-width joiners/non-joiners (ZWJ/ZWNJ) if unneeded. Default: false */
  cleanZWJ?: boolean;
}

/**
 * Result object returned by the conversion engine, including execution stats.
 */
export interface ConversionResult {
  /** The final transformed Unicode text */
  text: string;

  /** Execution metadata and diagnostics */
  stats: {
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Total characters processed from input */
    inputCharCount: number;
    /** Total characters in generated output */
    outputCharCount: number;
    /** Total number of trie substitutions matched (legacy<->Unicode glyph swaps only) */
    replacementCount: number;
    /** Number of reordering rule categories (matra/reph/custom) that altered the text */
    reorderCount?: number;
    /** Characters that had no mapping match (when preserveUnmappedChars is true) */
    unmatched?: string[];
    /** Structural warnings detected in the output string */
    lintErrors?: LintError[];
  };
}

export type LintWarningType = 'ORPHAN_MATRA' | 'MULTIPLE_MATRAS' | 'CONSECUTIVE_HALANT' | 'ORPHAN_HALANT';

export interface LintError {
  type: LintWarningType;
  index: number;
  length: number;
  message: string;
}

export type ConversionStage =
  | 'substitution'
  | 'reordering'
  | 'normalization';

export interface PipelineState {
  stage: ConversionStage;
  text: string;
}

export interface LossyMapping {
  legacy: string;
  unicodeActual: string;
  legacyRoundtrip: string;
  category?: string;
}

export interface FidelityReport {
  isPerfect: boolean;
  totalMappings: number;
  lossyMappings: LossyMapping[];
  executionTimeMs: number;
}
