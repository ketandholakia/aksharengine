import type { FontProfile } from '@/types/profile.types';
import type { LintError } from '@/types/engine.types';

export class AksharLinter {
  private matras: Set<string>;
  private halants: Set<string>;

  constructor(profile: FontProfile) {
    this.matras = new Set<string>();
    this.halants = new Set([
      '\u094D', // Devanagari
      '\u09CD', // Bengali
      '\u0A4D', // Gurmukhi
      '\u0ACD', // Gujarati
      '\u0B4D', // Oriya
      '\u0BCD', // Tamil
      '\u0C4D', // Telugu
      '\u0CCD', // Kannada
      '\u0D4D', // Malayalam
      '\u0DCA', // Sinhala
    ]);

    // Build matras and halants sets from mappings
    profile.mappings.forEach(m => {
      if (m.category === 'matra') {
        for (const char of m.unicode) {
          this.matras.add(char);
        }
      }
      if ((m.category as string) === 'halant') {
        this.halants.add(m.unicode);
      }
    });
  }

  public lint(unicodeText: string): LintError[] {
    const errors: LintError[] = [];
    if (!unicodeText) return errors;

    // Helper to check if a character is whitespace (including common non-breaking spaces)
    const isWhitespace = (char: string): boolean => {
      return /[\s\u00A0]/.test(char);
    };

    for (let i = 0; i < unicodeText.length; i++) {
      const char = unicodeText[i];

      // 1. Check for Orphan Matra (Matra at start of string or after whitespace)
      if (this.matras.has(char)) {
        if (i === 0 || isWhitespace(unicodeText[i - 1])) {
          errors.push({
            type: 'ORPHAN_MATRA',
            index: i,
            length: 1,
            message: `Orphan matra '${char}' found at the beginning of a word. Matras must follow a consonant.`,
          });
        }

        // 2. Check for Multiple Matras
        // If the previous character is also a matra (and not just an anusvara/visarga which might not be in the matras set depending on profile)
        if (i > 0 && this.matras.has(unicodeText[i - 1])) {
          errors.push({
            type: 'MULTIPLE_MATRAS',
            index: i - 1,
            length: 2,
            message: `Multiple consecutive matras found: '${unicodeText[i - 1]}${char}'. A consonant usually only takes one vowel sign.`,
          });
        }
      }

      // 3. Check for Consecutive Halants
      if (this.halants.has(char)) {
        if (i > 0 && this.halants.has(unicodeText[i - 1])) {
          errors.push({
            type: 'CONSECUTIVE_HALANT',
            index: i - 1,
            length: 2,
            message: `Consecutive halants found. Structurally invalid sequence.`,
          });
        }

        // 4. Check for Orphan Halant (start of string or after space)
        if (i === 0 || isWhitespace(unicodeText[i - 1])) {
          errors.push({
            type: 'ORPHAN_HALANT',
            index: i,
            length: 1,
            message: `Orphan halant found at the beginning of a word.`,
          });
        }
      }
    }

    return errors;
  }
}