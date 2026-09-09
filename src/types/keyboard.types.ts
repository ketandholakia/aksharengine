export type KeyboardLayoutType = 'inscript' | 'phonetic' | 'remington';

export interface KeyboardKey {
  code: string;
  base: string;
  shift: string | null;
  category: 'vowel-matra' | 'consonant' | 'halant' | 'sign' | 'digit' | 'punctuation' | 'modifier';
  needsVerification?: boolean;
}

export interface KeyboardLayout {
  id: string;
  name: string;
  script: string;
  language: string;
  layoutType: KeyboardLayoutType;
  version: string;
  isBuiltIn?: boolean;
  reorderingRulesRef: string;
  deadKeys?: string[];
  keys: KeyboardKey[];
  notes?: string;
}
