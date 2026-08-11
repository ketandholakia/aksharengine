const DEFAULT_REPLACEMENTS: [RegExp, string][] = [
  // Gujarati rupee sign normalization (legacy fonts sometimes emit generic symbols)
  [/\u20A8/gu, '₹'],
];

export interface NormalizeOptions {
  /** Strip zero-width joiners/non-joiners (ZWJ/ZWNJ) if unneeded. */
  cleanZWJ?: boolean;
}

export function normalizeUnicode(input: string, options: NormalizeOptions = {}): string {
  let text = input.normalize('NFC');

  const replacements: [RegExp, string][] = [...DEFAULT_REPLACEMENTS];

  if (options.cleanZWJ) {
    replacements.push(
      [/\u200D/g, ''],
      [/\u200C/g, '']
    );
  }

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  return text;
}

export function cleanWhitespace(input: string): string {
  return input.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
}
