import { describe, it, expect } from 'vitest';
import { ConverterEngine } from './ConverterEngine';
import type { FontProfile } from '../types/profile.types';

const mockProfile: FontProfile = {
  id: 'test-profile',
  name: 'Test Profile',
  script: 'devanagari',
  version: '1.0',
  reorderingRules: {
    leftMatraSymbols: ['ि'],
    rephSymbols: ['र्']
  },
  mappings: [
    // Standard Consonants and Vowels
    { legacy: 'd', unicode: 'क', category: 'consonant' },
    { legacy: 'K', unicode: 'ा', category: 'matra' },
    { legacy: 'f', unicode: 'ि', category: 'matra' },
    { legacy: 'Z', unicode: 'र्', category: 'matra' },
    
    // Longest-Match Test Cases
    { legacy: 'ksh', unicode: 'क्ष', category: 'conjunct' },
    { legacy: 'k', unicode: 'क्', category: 'consonant' },
    { legacy: 's', unicode: 'स्', category: 'consonant' },
    { legacy: 'h', unicode: 'ह्', category: 'consonant' }
  ]
};

describe('ConverterEngine', () => {
  it('should initialize and return empty string for empty input', () => {
    const engine = new ConverterEngine({ profile: mockProfile });
    const result = engine.convert('');
    expect(result.text).toBe('');
    expect(result.stats.outputCharCount).toBe(0);
  });

  it('should apply longest-match substitution correctly', () => {
    // Disable reordering to strictly test substitution logic
    const engine = new ConverterEngine({ 
      profile: mockProfile,
      enableMatraReordering: false, 
      enableRephReordering: false 
    });
    
    // 'ksh' should map to 'क्ष' in a single pass, rather than 'क्' + 'स्' + 'ह्'
    const result = engine.convert('ksh');
    expect(result.text).toBe('क्ष');
    expect(result.stats.replacementCount).toBe(1);
  });

  it('should reorder Left-Matra (Chhoti-I) correctly', () => {
    const engine = new ConverterEngine({ profile: mockProfile });
    
    // Legacy: 'f' -> 'ि', 'd' -> 'क'. 
    // Raw Substitution: 'िक'
    // Engine Reordering: 'कि'
    const result = engine.convert('fd');
    expect(result.text).toBe('कि');
  });

  it('should reorder Reph (Flying R) correctly', () => {
    const engine = new ConverterEngine({ profile: mockProfile });
    
    // Legacy: 'd' -> 'क', 'Z' -> 'र्'. 
    // Raw Substitution: 'कर्'
    // Engine Reordering: 'र्क'
    const result = engine.convert('dZ');
    expect(result.text).toBe('र्क');
  });

  it('should preserve unmapped legacy characters', () => {
    const engine = new ConverterEngine({ profile: mockProfile });
    
    // 'x' and 'y' do not exist in the profile mapping
    const result = engine.convert('d x y d');
    expect(result.text).toBe('क x y क');
  });

  it('should output accurate telemetry stats', () => {
    const engine = new ConverterEngine({ profile: mockProfile });
    const result = engine.convert('fd'); // 'कि'
    
    expect(result.stats).toHaveProperty('executionTimeMs');
    expect(result.stats.inputCharCount).toBe(2);
    expect(result.stats.outputCharCount).toBe(2);
    expect(result.stats.replacementCount).toBe(2); // 'f' and 'd' are two mappings
  });
});
