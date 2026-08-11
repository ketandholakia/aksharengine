import type { FontProfile, MappingRule } from '@/types/profile.types';
import type { ConversionOptions, ConversionResult, PipelineState } from '@/types/engine.types';
import { applyReorderRules } from './ReorderRules';
import { normalizeUnicode } from './Normalizer';

export class ConverterEngine {
  private profile: FontProfile;
  private trie: Map<string, unknown> = new Map();
  private options: Required<Omit<ConversionOptions, 'profile'>>;

  constructor(options: ConversionOptions) {
    this.profile = options.profile;
    this.options = {
      enableMatraReordering: options.enableMatraReordering ?? true,
      enableRephReordering: options.enableRephReordering ?? true,
      normalizeNFC: options.normalizeNFC ?? true,
      preserveUnmappedChars: options.preserveUnmappedChars ?? true,
      cleanZWJ: options.cleanZWJ ?? false,
    };
    this.buildTrie(options.profile.mappings);
  }

  private buildTrie(mappings: MappingRule[]): void {
    for (const { legacy, unicode } of mappings) {
      let node = this.trie;
      for (const char of legacy) {
        if (!node.has(char)) {
          node.set(char, new Map());
        }
        node = node.get(char) as Map<string, unknown>;
      }
      node.set('__value__', unicode);
    }
  }

  private longestMatchAt(
    text: string,
    startIndex: number
  ): { matched: string; replacement: string | null; endIndex: number } {
    let node = this.trie;
    let lastMatch: { endIndex: number; value: string } | null = null;
    let i = startIndex;

    while (i < text.length) {
      const char = text[i];
      if (!node.has(char)) break;
      node = node.get(char) as Map<string, unknown>;
      if (node.has('__value__')) {
        lastMatch = {
          endIndex: i + 1,
          value: node.get('__value__') as string,
        };
      }
      i++;
    }

    if (lastMatch) {
      return {
        matched: text.slice(startIndex, lastMatch.endIndex),
        replacement: lastMatch.value,
        endIndex: lastMatch.endIndex,
      };
    }

    return {
      matched: text[startIndex],
      replacement: null,
      endIndex: startIndex + 1,
    };
  }

  private directSubstitution(text: string): { text: string; unmatched: Set<string>; replacements: number } {
    let output = '';
    let index = 0;
    const unmatched = new Set<string>();
    let replacements = 0;

    while (index < text.length) {
      const result = this.longestMatchAt(text, index);
      if (result.replacement !== null) {
        output += result.replacement;
        replacements++;
      } else {
        output += this.options.preserveUnmappedChars ? result.matched : '';
        if (/\S/.test(result.matched)) {
          unmatched.add(result.matched);
        }
      }
      index = result.endIndex;
    }

    return { text: output, unmatched, replacements };
  }

  public convert(input: string): ConversionResult {
    const startTime = performance.now();

    const { text: substituted, unmatched, replacements } = this.directSubstitution(input);

    const reorderResult = applyReorderRules({
      text: substituted,
      rules: this.profile.reorderingRules,
      enableMatraReordering: this.options.enableMatraReordering,
      enableRephReordering: this.options.enableRephReordering,
    });

    const normalized = this.options.normalizeNFC
      ? normalizeUnicode(reorderResult.text, { cleanZWJ: this.options.cleanZWJ })
      : reorderResult.text;

    return {
      text: normalized,
      stats: {
        executionTimeMs: Math.round(performance.now() - startTime),
        inputCharCount: input.length,
        outputCharCount: normalized.length,
        replacementCount: replacements,
        unmatched: Array.from(unmatched),
      },
    };
  }

  public getPipeline(input: string): PipelineState[] {
    const states: PipelineState[] = [];
    const { text: substituted } = this.directSubstitution(input);
    states.push({ stage: 'substitution', text: substituted });

    const reorderResult = applyReorderRules({
      text: substituted,
      rules: this.profile.reorderingRules,
      enableMatraReordering: this.options.enableMatraReordering,
      enableRephReordering: this.options.enableRephReordering,
    });
    states.push({ stage: 'reordering', text: reorderResult.text });

    const normalized = this.options.normalizeNFC
      ? normalizeUnicode(reorderResult.text, { cleanZWJ: this.options.cleanZWJ })
      : reorderResult.text;
    states.push({ stage: 'normalization', text: normalized });

    return states;
  }
}
