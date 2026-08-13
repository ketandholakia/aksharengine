import { describe, it, expect } from 'vitest';
import { AksharLinter } from './Validator';
import type { FontProfile } from '@/types/profile.types';

const mockProfile: FontProfile = {
  id: 'test',
  name: 'Test',
  script: 'gujarati',
  language: 'gu',
  version: '1.0.0',
  isBuiltIn: false,
  reorderingRules: {
    leftMatraSymbols: [],
    rephSymbols: []
  },
  mappings: [
    { legacy: 'a', unicode: 'િ', category: 'matra' },
    { legacy: 'b', unicode: 'ી', category: 'matra' },
    { legacy: 'h', unicode: '્', category: 'modifier' as any },
    { legacy: 'k', unicode: 'ક', category: 'consonant' },
  ]
};

describe('AksharLinter', () => {
  it('should not report errors for perfectly formed text', () => {
    const linter = new AksharLinter(mockProfile);
    const errors = linter.lint('કિ');
    expect(errors.length).toBe(0);
  });

  it('should detect orphan matras', () => {
    const linter = new AksharLinter(mockProfile);
    const errors = linter.lint(' િ');
    expect(errors.length).toBe(1);
    expect(errors[0].type).toBe('ORPHAN_MATRA');
    expect(errors[0].index).toBe(1);
  });

  it('should detect multiple consecutive matras', () => {
    const linter = new AksharLinter(mockProfile);
    const errors = linter.lint('કીિ'); // ક + ી + િ
    expect(errors.length).toBe(1);
    expect(errors[0].type).toBe('MULTIPLE_MATRAS');
    expect(errors[0].index).toBe(1);
  });

  it('should detect consecutive halants', () => {
    const linter = new AksharLinter(mockProfile);
    const errors = linter.lint('ક્્');
    expect(errors.length).toBe(1);
    expect(errors[0].type).toBe('CONSECUTIVE_HALANT');
    expect(errors[0].index).toBe(1);
  });

  it('should detect orphan halants', () => {
    const linter = new AksharLinter(mockProfile);
    const errors = linter.lint(' ્');
    expect(errors.length).toBe(1);
    expect(errors[0].type).toBe('ORPHAN_HALANT');
  });
});
