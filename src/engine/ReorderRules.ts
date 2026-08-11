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
    const regex = new RegExp(`([^\\s])(${escaped})`, 'gu');
    result = result.replace(regex, (_, cluster, sym) => sym + cluster);
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
