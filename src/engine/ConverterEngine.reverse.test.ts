import { describe, it, expect } from 'vitest';
import { ConverterEngine } from './ConverterEngine';
import type { FontProfile } from '@/types/profile.types';

const mockProfile: FontProfile = {
  id: 'test-profile',
  name: 'Test Profile',
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
    { legacy: 'Z', unicode: 'ઁ', category: 'matra' },
    { legacy: 'r', unicode: 'ર', category: 'consonant' }
  ]
};

describe('ConverterEngine - Reverse (Unicode to Legacy)', () => {
  it('should reverse simple mappings', () => {
    const engine = new ConverterEngine({ profile: mockProfile, direction: 'reverse' });
    const result = engine.convert('ક');
    expect(result.text).toBe('k');
  });

  it('should reverse left-matra reordering', () => {
    // Unicode: ક + િ -> Legacy: a + k
    const engine = new ConverterEngine({ profile: mockProfile, direction: 'reverse' });
    const result = engine.convert('કિ');
    expect(result.text).toBe('ak');
  });

  it('should reverse reph reordering', () => {
    // Unicode: ઁ + ક -> Legacy: k + Z
    const engine = new ConverterEngine({ profile: mockProfile, direction: 'reverse' });
    const result = engine.convert('ઁક');
    expect(result.text).toBe('kZ');
  });

  it('should handle combination of reorderings', () => {
    // Unicode: ઁ + ક + િ -> ઁકિ
    // Matra moves BEFORE ક -> ઁિક
    // Reph moves AFTER ક -> િકઁ
    // Legacy: a + k + Z
    const engine = new ConverterEngine({ profile: mockProfile, direction: 'reverse' });
    const result = engine.convert('ઁકિ');
    expect(result.text).toBe('akZ');
  });
});
