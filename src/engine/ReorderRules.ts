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

// Cached Intl.Segmenter for grapheme clusters with fallback to Array.from
let segmenter: Intl.Segmenter | null = null;
function initSegmenter() {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    try {
      segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    } catch {
      // Fallback to Array.from if Intl.Segmenter fails
      segmenter = null;
    }
  }
}
// Initialize on module load
initSegmenter();

export function getGraphemeClusters(text: string): string[] {
  if (segmenter) {
    return Array.from(segmenter.segment(text)).map(({ segment }) => segment);
  }
  // Fallback: split by Unicode code points (not perfect but better than nothing for basic Latin)
  return Array.from(text);
}

/**
 * Move the FIRST occurrence of each symbol to the end of the FOLLOWING cluster.
 * If the symbol is in the last cluster, it is appended to the end of that same cluster.
 * Handles symbols that are either standalone clusters or fused inside a cluster.
 */
function moveLeadingSymbolToTrailingEdge(text: string, symbols: string[]): string {
  if (!symbols || symbols.length === 0) return text;
  let result = text;
  for (const symbol of symbols) {
    if (!symbol) continue;
    const clusters = getGraphemeClusters(result);
    let found = false;
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const index = cluster.indexOf(symbol);
      if (index === -1) continue;
      found = true;
      // Remove the FIRST occurrence of the symbol from this cluster
      const before = cluster.slice(0, index);
      const after = cluster.slice(index + symbol.length);
      const rest = before + after;
      
      // Check if there is a following cluster
      if (i + 1 < clusters.length) {
        // There is a following cluster: append symbol to its END
        const followingCluster = clusters[i + 1];
        const newFollowing = followingCluster + symbol;
        
        // Build new clusters list
        const newClusters: string[] = [];
        // Clusters before i
        for (let j = 0; j < i; j++) newClusters.push(clusters[j]);
        // Current cluster: rest (if not empty)
        if (rest !== '') {
          newClusters.push(rest);
        }
        // Following cluster: newFollowing (with symbol appended to end)
        newClusters.push(newFollowing);
        // Clusters after i+1
        for (let j = i + 2; j < clusters.length; j++) newClusters.push(clusters[j]);
        result = newClusters.join('');
      } else {
        // No following cluster, so append symbol to the end of the current cluster's rest
        const newClusters: string[] = [];
        // Clusters before i
        for (let j = 0; j < i; j++) newClusters.push(clusters[j]);
        // Current cluster: rest + symbol
        const newCurrent = rest + symbol;
        if (newCurrent !== '') {
          newClusters.push(newCurrent);
        }
        // No clusters after i (since i is the last)
        result = newClusters.join('');
      }
      break; // only first occurrence of each symbol
    }
    if (!found) {
      // Symbol not found, continue to next symbol
      continue;
    }
  }
  return result;
}

/**
 * Move the LAST occurrence of each symbol to the beginning of the PRECEDING cluster.
 * If the symbol is in the first cluster, it is prepended to the beginning of that same cluster.
 * Handles symbols that are either standalone clusters or fused inside a cluster.
 */
function moveTrailingSymbolToLeadingEdge(text: string, symbols: string[]): string {
  if (!symbols || symbols.length === 0) return text;
  let result = text;
  for (const symbol of symbols) {
    if (!symbol) continue;
    const clusters = getGraphemeClusters(result);
    let found = false;
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const lastIndex = cluster.lastIndexOf(symbol);
      if (lastIndex === -1) continue;
      found = true;
      // Remove the LAST occurrence of the symbol from this cluster
      const before = cluster.slice(0, lastIndex);
      const after = cluster.slice(lastIndex + symbol.length);
      const rest = before + after;
      // Determine where to insert the symbol:
      // If there is a preceding cluster, insert it into the beginning of that cluster.
      // Otherwise, insert it into the beginning of the current cluster's rest (i.e., prepend to rest).
      if (i > 0) {
        // There is a preceding cluster
        const precedingCluster = clusters[i - 1];
        const newPreceding = symbol + precedingCluster;
        // Build new clusters list
        const newClusters: string[] = [];
        // Clusters before i-1
        for (let j = 0; j < i - 1; j++) newClusters.push(clusters[j]);
        // Preceding cluster: newPreceding
        newClusters.push(newPreceding);
        // Current cluster: rest (if not empty)
        if (rest !== '') {
          newClusters.push(rest);
        }
        // Clusters after i
        for (let j = i + 1; j < clusters.length; j++) newClusters.push(clusters[j]);
        result = newClusters.join('');
      } else {
        // No preceding cluster, so prepend symbol to the beginning of the current cluster's rest
        const newClusters: string[] = [];
        // No clusters before i
        // Current cluster: symbol + rest
        const newCurrent = symbol + rest;
        if (newCurrent !== '') {
          newClusters.push(newCurrent);
        }
        // Clusters after i
        for (let j = i + 1; j < clusters.length; j++) newClusters.push(clusters[j]);
        result = newClusters.join('');
      }
      break; // only first occurrence of each symbol
    }
    if (!found) {
      // Symbol not found, continue to next symbol
      continue;
    }
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

// Primitives for grapheme-aware symbol movement
export const moveSymbolsBeforeNextCluster = moveLeadingSymbolToTrailingEdge;   // forward matra
export const moveSymbolsAfterCluster = moveTrailingSymbolToLeadingEdge;       // forward reph
export const moveSymbolsBeforePreviousChar = moveTrailingSymbolToLeadingEdge; // reverse matra
export const moveSymbolsAfterNextWord = moveLeadingSymbolToTrailingEdge;      // reverse reph

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