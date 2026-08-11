import type { FontProfile, MappingRule } from '@/types/profile.types';
import type { ConversionOptions, ConversionResult, PipelineState } from '@/types/engine.types';
import { applyReorderRules } from './ReorderRules';
import { normalizeUnicode } from './Normalizer';

type TrieNode = Map<string, TrieNode | string>;

export class ConverterEngine {
  private profile: FontProfile;
  private trie: TrieNode = new Map();
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
    const seenLegacyKeys = new Set<string>();

    for (const { legacy, unicode } of mappings) {
      let node: TrieNode = this.trie;
      for (const char of legacy) {
        if (!node.has(char)) {
          node.set(char, new Map());
        }
        node = node.get(char) as TrieNode;
      }

      if (seenLegacyKeys.has(legacy)) {
        // A profile with two rules for the same legacy sequence is almost
        // always a data-entry mistake (e.g. from hand-editing or a bad merge
        // in the profile generator). The later mapping silently wins, which
        // is easy to miss, so surface it instead of failing silently.
        console.warn(
          `[AksharEngine] Profile "${this.profile.id}" has a duplicate mapping for "${legacy}". ` +
          `The last one ("${unicode}") will be used; earlier mapping(s) are ignored.`
        );
      }

      seenLegacyKeys.add(legacy);
      node.set('__value__', unicode);
    }
  }

  private longestMatchAt(
    text: string,
    startIndex: number
  ): { matched: string; replacement: string | null; endIndex: number } {
    let node: TrieNode = this.trie;
    let lastMatch: { endIndex: number; value: string } | null = null;
    let i = startIndex;

    while (i < text.length) {
      const char = text[i];
      if (!node.has(char)) break;
      node = node.get(char) as TrieNode;
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
        executionTimeMs: parseFloat((performance.now() - startTime).toFixed(2)),
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
