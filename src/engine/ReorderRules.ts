import type { ReorderingRules } from '@/types/profile.types';

export interface ReorderContext {
  text: string;
  rules?: ReorderingRules;
  enableMatraReordering?: boolean;
  enableRephReordering?: boolean;
}

export interface ReorderResult {
  text: string;
  changes: number;
}

function escapeForRegex(symbol: string): string {
  return symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function moveSymbolsBeforeNextCluster(text: string, symbols: string[]): string {
  let result = text;
  for (const symbol of symbols) {
    if (!symbol) continue;
    const escaped = escapeForRegex(symbol);
    const regex = new RegExp(`(${escaped})(.)`, 'gu');
    result = result.replace(regex, (_, sym, nextChar) => nextChar + sym);
  }
  return result;
}

function moveSymbolsAfterCluster(text: string, symbols: string[]): string {
  let result = text;
  for (const symbol of symbols) {
    if (!symbol) continue;
    const escaped = escapeForRegex(symbol);
    // Use \S+? (non-greedy) to capture the full preceding grapheme cluster,
    // not just a single code unit — important for multi-codepoint Indic sequences.
    const regex = new RegExp(`(\\S+?)(${escaped})`, 'gu');
    result = result.replace(regex, (_, cluster, sym) => sym + cluster);
  }
  return result;
}

function moveSymbolsBeforePreviousChar(text: string, symbols: string[]): string {
  let result = text;
  for (const symbol of symbols) {
    if (!symbol) continue;
    const escaped = escapeForRegex(symbol);
    const regex = new RegExp(`(.)(${escaped})`, 'gu');
    result = result.replace(regex, (_, prevChar, sym) => sym + prevChar);
  }
  return result;
}

function moveSymbolsAfterNextWord(text: string, symbols: string[]): string {
  let result = text;
  for (const symbol of symbols) {
    if (!symbol) continue;
    const escaped = escapeForRegex(symbol);
    // Move the symbol to the end of the subsequent non-whitespace characters
    const regex = new RegExp(`(${escaped})(\\S+)`, 'gu');
    result = result.replace(regex, (_, sym, word) => word + sym);
  }
  return result;
}

function applyCustomTransforms(
  text: string,
  transforms: NonNullable<ReorderingRules['customTransforms']>
): string {
  let result = text;
  for (const { pattern, replacement, flags } of transforms) {
    const regex = new RegExp(pattern, flags ?? 'gu');
    result = result.replace(regex, replacement);
  }
  return result;
}

export function applyReorderRules(context: ReorderContext): ReorderResult {
  let text = context.text;
  let changes = 0;
  const rules = context.rules ?? {};

  if (context.enableMatraReordering !== false && rules.leftMatraSymbols && rules.leftMatraSymbols.length > 0) {
    const before = text;
    text = moveSymbolsBeforeNextCluster(text, rules.leftMatraSymbols);
    if (text !== before) changes++;
  }

  if (context.enableRephReordering !== false && rules.rephSymbols && rules.rephSymbols.length > 0) {
    const before = text;
    text = moveSymbolsAfterCluster(text, rules.rephSymbols);
    if (text !== before) changes++;
  }

  if (rules.customTransforms && rules.customTransforms.length > 0) {
    const before = text;
    text = applyCustomTransforms(text, rules.customTransforms);
    if (text !== before) changes++;
  }

  return { text, changes };
}

export function applyReverseReorderRules(context: ReorderContext): ReorderResult {
  let text = context.text;
  let changes = 0;
  const rules = context.rules ?? {};

  // For reverse, we do NOT run customTransforms currently, as regexes are not automatically reversible.

  if (context.enableRephReordering !== false && rules.rephSymbols && rules.rephSymbols.length > 0) {
    const before = text;
    text = moveSymbolsAfterNextWord(text, rules.rephSymbols);
    if (text !== before) changes++;
  }

  if (context.enableMatraReordering !== false && rules.leftMatraSymbols && rules.leftMatraSymbols.length > 0) {
    const before = text;
    text = moveSymbolsBeforePreviousChar(text, rules.leftMatraSymbols);
    if (text !== before) changes++;
  }

  return { text, changes };
}
