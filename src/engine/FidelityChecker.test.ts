import { describe, it, expect } from 'vitest';
import { FidelityChecker } from './FidelityChecker';
import type { FontProfile } from '@/types/profile.types';

const perfectProfile: FontProfile = {
  id: 'perfect-profile',
  name: 'Perfect Profile',
  script: 'gujarati',
  language: 'gu',
  version: '1.0.0',
  author: { name: 'Test' },
  isBuiltIn: false,
  reorderingRules: {
    leftMatraSymbols: ['િ'],
    rephSymbols: ['ઁ']
  },
  mappings: [
    { legacy: 'k', unicode: 'ક', category: 'consonant' },
    { legacy: 'a', unicode: 'િ', category: 'matra' },
  ]
};

const lossyProfile: FontProfile = {
  id: 'lossy-profile',
  name: 'Lossy Profile',
  script: 'gujarati',
  language: 'gu',
  version: '1.0.0',
  author: { name: 'Test' },
  isBuiltIn: false,
  reorderingRules: {
    leftMatraSymbols: [],
    rephSymbols: []
  },
  mappings: [
    { legacy: 'k', unicode: 'ક', category: 'consonant' },
    { legacy: 'K', unicode: 'ક', category: 'consonant' }, // k and K both map to ક. Roundtrip of K will be k. Lossy!
  ]
};

describe('FidelityChecker', () => {
  it('should report perfect fidelity for a 1:1 mapping profile', () => {
    const checker = new FidelityChecker(perfectProfile);
    const report = checker.checkProfile();
    
    expect(report.isPerfect).toBe(true);
    expect(report.totalMappings).toBe(2);
    expect(report.lossyMappings.length).toBe(0);
  });

  it('should identify lossy mappings when multiple legacy chars map to the same unicode char', () => {
    const checker = new FidelityChecker(lossyProfile);
    const report = checker.checkProfile();
    
    expect(report.isPerfect).toBe(false);
    expect(report.totalMappings).toBe(2);
    
    // K maps to ક. But when converting ક back to legacy, it uses the first match in Trie (which is k, because 'k' is inserted first or K is overridden depending on logic).
    // Actually, in our ConverterEngine, if multiple legacy strings map to same unicode, reverseTrie will store the LAST one or FIRST one?
    // In ConverterEngine: `this.reverseTrie.insert(unicode, legacy)`. It overwrites. So the last one inserted (K) will be the reverse mapping for 'ક'.
    // Wait, let's see which one is lossy.
    // If K overwrites k in reverseTrie, then reverse(ક) = K.
    // So forward(k) -> ક. reverse(ક) -> K. Thus 'k' is lossy because k -> ક -> K.
    
    expect(report.lossyMappings.length).toBe(1);
    expect(report.lossyMappings[0].legacy).not.toBe(report.lossyMappings[0].legacyRoundtrip);
  });
});
