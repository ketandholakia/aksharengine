import type { FontProfile } from '@/types/profile.types';
import type { FidelityReport, LossyMapping } from '@/types/engine.types';
import { ConverterEngine } from './ConverterEngine';

export class FidelityChecker {
  private profile: FontProfile;
  private forwardEngine: ConverterEngine;
  private reverseEngine: ConverterEngine;

  constructor(profile: FontProfile) {
    this.profile = profile;
    this.forwardEngine = new ConverterEngine({
      profile,
      direction: 'forward',
      enableMatraReordering: true,
      enableRephReordering: true,
      normalizeNFC: true,
      preserveUnmappedChars: true,
    });
    this.reverseEngine = new ConverterEngine({
      profile,
      direction: 'reverse',
      enableMatraReordering: true,
      enableRephReordering: true,
      normalizeNFC: true,
      preserveUnmappedChars: true,
    });
  }

  /**
   * Evaluates all mappings in the profile to see if they can survive a round-trip
   * (Legacy -> Unicode -> Legacy).
   */
  public checkProfile(): FidelityReport {
    const startTime = performance.now();
    const lossyMappings: LossyMapping[] = [];

    // Filter out mappings where legacy is empty
    const validMappings = this.profile.mappings.filter(m => m.legacy && m.legacy.trim() !== '');

    for (const mapping of validMappings) {
      const { legacy } = mapping;

      // 1. Forward Conversion (Legacy -> Unicode)
      const forwardResult = this.forwardEngine.convert(legacy);
      const unicodeActual = forwardResult.text;

      // 2. Reverse Conversion (Unicode -> Legacy)
      const reverseResult = this.reverseEngine.convert(unicodeActual);
      const legacyRoundtrip = reverseResult.text;

      // 3. Diff
      if (legacy !== legacyRoundtrip) {
        lossyMappings.push({
          legacy,
          unicodeActual,
          legacyRoundtrip,
          category: mapping.category,
        });
      }
    }

    const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(2));

    return {
      isPerfect: lossyMappings.length === 0,
      totalMappings: validMappings.length,
      lossyMappings,
      executionTimeMs,
    };
  }
}
