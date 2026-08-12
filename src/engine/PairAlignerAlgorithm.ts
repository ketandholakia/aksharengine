import type { MappingRule } from '../types/profile.types';

export interface ExtractedMapping extends MappingRule {
  confidence: number;
  occurrences: number;
}

export interface WordPair {
  legacy: string;
  unicode: string;
}

export class PairAlignerAlgorithm {
  /**
   * Step 1: Aligns words from legacy and unicode text.
   * Users can modify these pairs before extraction.
   */
  public static alignWords(legacyText: string, unicodeText: string): WordPair[] {
    const legacyWords = legacyText.trim().split(/\s+/);
    const unicodeWords = unicodeText.trim().split(/\s+/);
    
    const minLength = Math.min(legacyWords.length, unicodeWords.length);
    const pairs: WordPair[] = [];
    
    for (let i = 0; i < minLength; i++) {
      pairs.push({
        legacy: legacyWords[i],
        unicode: unicodeWords[i]
      });
    }
    
    return pairs;
  }

  /**
   * Step 2: Extracts font mappings from aligned word pairs.
   */
  public static extractFromPairs(pairs: WordPair[]): ExtractedMapping[] {
    const pairFrequencies = new Map<string, Map<string, number>>();

    // Step A: Linear Alignment for words of the same length
    for (const pair of pairs) {
      const legWord = pair.legacy;
      const uniWord = pair.unicode;

      // Use spread to iterate by Unicode code point, not UTF-16 code unit
      const legChars = [...legWord];
      const uniChars = [...uniWord];
      if (legChars.length === uniChars.length) {
        for (let charIdx = 0; charIdx < legChars.length; charIdx++) {
          this.recordPair(pairFrequencies, legChars[charIdx], uniChars[charIdx]);
        }
      }
    }

    // Step B: Crossover Detection (Left-Matra Correction)
    for (const pair of pairs) {
      const legWord = pair.legacy;
      const uniWord = pair.unicode;

      // Use spread to iterate by Unicode code point
      const legChars = [...legWord];
      const uniChars = [...uniWord];
      if (legChars.length === uniChars.length) {
        for (let c = 0; c < legChars.length - 1; c++) {
          const l1 = legChars[c];
          const l2 = legChars[c + 1];
          const u1 = uniChars[c];
          const u2 = uniChars[c + 1];

          // If global frequency suggests l1 actually maps to u2, and l2 maps to u1
          const l1_u1_score = this.getScore(pairFrequencies, l1, u1);
          const l1_u2_score = this.getScore(pairFrequencies, l1, u2);
          const l2_u2_score = this.getScore(pairFrequencies, l2, u2);
          const l2_u1_score = this.getScore(pairFrequencies, l2, u1);

          if (l1_u2_score > l1_u1_score && l2_u1_score > l2_u2_score) {
            // It's a crossover! (e.g. Left Matra). Adjust weights.
            this.recordPair(pairFrequencies, l1, u2, 5); // heavily weight the crossover
            this.recordPair(pairFrequencies, l2, u1, 5);
          }
        }
      }
    }

    // Step C: Resolve the highest probability mappings
    const results: ExtractedMapping[] = [];

    pairFrequencies.forEach((uniMap, legacyChar) => {
      let bestUniChar = '';
      let maxCount = 0;
      let totalCount = 0;

      uniMap.forEach((count, uniChar) => {
        totalCount += count;
        if (count > maxCount) {
          maxCount = count;
          bestUniChar = uniChar;
        }
      });

      // Only keep mappings with > 50% confidence
      const confidence = Math.round((maxCount / totalCount) * 100);

      if (confidence > 50) {
        results.push({
          legacy: legacyChar,
          unicode: bestUniChar,
          category: this.guessCategory(bestUniChar),
          confidence,
          occurrences: maxCount,
        });
      }
    });

    // Sort by confidence (highest first), then occurrences
    return results.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return b.occurrences - a.occurrences;
    });
  }

  /**
   * One-shot method that combines alignment and extraction (for backward compatibility).
   */
  public static extract(legacyText: string, unicodeText: string): ExtractedMapping[] {
    const pairs = this.alignWords(legacyText, unicodeText);
    return this.extractFromPairs(pairs);
  }

  private static recordPair(
    freqMap: Map<string, Map<string, number>>,
    legacyChar: string,
    unicodeChar: string,
    weight: number = 1
  ) {
    if (!freqMap.has(legacyChar)) {
      freqMap.set(legacyChar, new Map());
    }
    const uniMap = freqMap.get(legacyChar)!;
    uniMap.set(unicodeChar, (uniMap.get(unicodeChar) || 0) + weight);
  }

  private static getScore(
    freqMap: Map<string, Map<string, number>>,
    legacyChar: string,
    unicodeChar: string
  ): number {
    return freqMap.get(legacyChar)?.get(unicodeChar) || 0;
  }

  /**
   * Guesses the morphological category based on the Unicode hex block.
   */
  private static guessCategory(uniChar: string): MappingRule['category'] {
    // Multi-codepoint strings are likely conjuncts
    if ([...uniChar].length > 1) {
      return 'conjunct';
    }

    const code = uniChar.codePointAt(0) ?? 0;

    // Devanagari & Gujarati Matra Ranges
    if ((code >= 0x093e && code <= 0x094c) || (code >= 0x0abe && code <= 0x0acc)) {
      return 'matra';
    }
    // Devanagari & Gujarati Numerals
    if ((code >= 0x0966 && code <= 0x096f) || (code >= 0x0ae6 && code <= 0x0aef)) {
      return 'numeral';
    }
    // Anusvara, Visarga, Halant
    if ([0x0902, 0x0903, 0x094d, 0x0a82, 0x0a83, 0x0acd].includes(code)) {
      return 'modifier';
    }
    // Assumed Consonant or Vowel otherwise
    return 'consonant';
  }
}
