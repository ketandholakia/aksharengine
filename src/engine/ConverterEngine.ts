import type { FontProfile, MappingRule } from '@/types/profile.types';
import type { ConversionOptions, ConversionResult, PipelineState } from '@/types/engine.types';
import { applyReorderRules, applyReverseReorderRules } from './ReorderRules';
import { normalizeUnicode } from './Normalizer';

type TrieNode = Map<string, TrieNode | string>;

export class ConverterEngine {
  private profile: FontProfile;
  private trie: TrieNode = new Map();
  private reverseTrie: TrieNode = new Map();
  private options: Required<Omit<ConversionOptions, 'profile'>>;

  constructor(options: ConversionOptions) {
    this.profile = options.profile;
    this.options = {
      direction: options.direction ?? 'forward',
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
    const seenUnicodeKeys = new Set<string>();

    for (const { legacy, unicode } of mappings) {
      let node: TrieNode = this.trie;
      for (const char of legacy) {
        if (!node.has(char)) {
          node.set(char, new Map());
        }
        node = node.get(char) as TrieNode;
      }

      if (seenLegacyKeys.has(legacy)) {
        console.warn(
          `[AksharEngine] Profile "${this.profile.id}" has a duplicate mapping for "${legacy}". ` +
          `The last one ("${unicode}") will be used; earlier mapping(s) are ignored.`
        );
      }

      seenLegacyKeys.add(legacy);
      node.set('__value__', unicode);

      if (!seenUnicodeKeys.has(unicode)) {
        let revNode: TrieNode = this.reverseTrie;
        for (const char of unicode) {
          if (!revNode.has(char)) {
            revNode.set(char, new Map());
          }
          revNode = revNode.get(char) as TrieNode;
        }
        revNode.set('__value__', legacy);
        seenUnicodeKeys.add(unicode);
      }
    }
  }

  private longestMatchAt(
    text: string,
    startIndex: number,
    trie: TrieNode
  ): { matched: string; replacement: string | null; endIndex: number } {
    let node: TrieNode = trie;
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

  private substitution(text: string, isReverse: boolean): { text: string; unmatched: Set<string>; replacements: number } {
    let output = '';
    let index = 0;
    const unmatched = new Set<string>();
    let replacements = 0;
    const trie = isReverse ? this.reverseTrie : this.trie;

    while (index < text.length) {
      const result = this.longestMatchAt(text, index, trie);
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

    if (this.options.direction === 'reverse') {
      const normalized = this.options.normalizeNFC
        ? normalizeUnicode(input, { cleanZWJ: this.options.cleanZWJ })
        : input;

      const reorderResult = applyReverseReorderRules({
        text: normalized,
        rules: this.profile.reorderingRules,
        enableMatraReordering: this.options.enableMatraReordering,
        enableRephReordering: this.options.enableRephReordering,
      });

      const { text: substituted, unmatched, replacements } = this.substitution(reorderResult.text, true);

      return {
        text: substituted,
        stats: {
          executionTimeMs: parseFloat((performance.now() - startTime).toFixed(2)),
          inputCharCount: input.length,
          outputCharCount: substituted.length,
          replacementCount: replacements + reorderResult.changes,
          unmatched: Array.from(unmatched),
        },
      };
    }

    const { text: substituted, unmatched, replacements } = this.substitution(input, false);

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
        replacementCount: replacements + reorderResult.changes,
        unmatched: Array.from(unmatched),
      },
    };
  }

  public getPipeline(input: string): PipelineState[] {
    const states: PipelineState[] = [];

    if (this.options.direction === 'reverse') {
      const normalized = this.options.normalizeNFC
        ? normalizeUnicode(input, { cleanZWJ: this.options.cleanZWJ })
        : input;
      states.push({ stage: 'normalization', text: normalized });

      const reorderResult = applyReverseReorderRules({
        text: normalized,
        rules: this.profile.reorderingRules,
        enableMatraReordering: this.options.enableMatraReordering,
        enableRephReordering: this.options.enableRephReordering,
      });
      states.push({ stage: 'reordering', text: reorderResult.text });

      const { text: substituted } = this.substitution(reorderResult.text, true);
      states.push({ stage: 'substitution', text: substituted });

      return states;
    }

    const { text: substituted } = this.substitution(input, false);
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
