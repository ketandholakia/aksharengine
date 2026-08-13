/**
 * Generate public/profiles/nudi.json — Nudi (Kannada) legacy font profile.
 *
 * Mapping data source: aravindavk/ascii2unicode (GPL-3.0) — canonical Nudi
 * glyph-encoded ASCII -> Kannada Unicode table (https://github.com/aravindavk/ascii2unicode).
 * The legacy Nudi encoding maps each Kannada glyph onto ASCII code points
 * (e.g. "PÀ£ÀßqÀ" -> "ಕನ್ನಡ"), so the conversion requires:
 *   1. Direct longest-match substitution (the mapping dict below).
 *   2. Post-substitution transforms for:
 *      - ignore_list chars (ö ÷) that carry no Unicode value,
 *      - broken_cases (Ã Ä Æ È Ê) that merge with the previous matra,
 *      - vattaksharagalu (subscript consonant codes) that become ್ + base letter,
 *        with dependent-vowel rearrangement,
 *      - arkavattu (ð) which becomes the ರ್ reph form before the base letter.
 */

const fs = require('fs');
const path = require('path');

// Direct mapping of ASCII chars to Unicode (aravindavk mapping dict, verbatim).
// Entry with trailing spaces ("ªÉ  " -> ವೆ) intentionally dropped to avoid
// swallowing word separators.
const mapping = {
  C: '\u0C85', // ಅ
  D: '\u0C86', // ಆ
  E: '\u0C87', // ಇ
  F: '\u0C88', // ಈ
  G: '\u0C89', // ಉ
  H: '\u0C8A', // ಊ
  'I\u00C4': '\u0C8B', // ಋ
  J: '\u0C8E', // ಎ
  K: '\u0C8F', // ಏ
  L: '\u0C90', // ಐ
  M: '\u0C92', // ಒ
  N: '\u0C93', // ಓ
  O: '\u0C94', // ಔ
  A: '\u0C82', // ಂ
  B: '\u0C83', // ಃ
  'P\u00EF': '\u0C95\u0CCD', // ಕ್
  'P\u00C0': '\u0C95', // ಕ
  'P\u00C1': '\u0C95\u0CBE', // ಕಾ
  Q: '\u0C95\u0CBF', // ಕಿ
  'P\u00C9': '\u0C95\u0CC6', // ಕೆ
  'P\u00CB': '\u0C95\u0CCC', // ಕೌ
  'S\u00EF': '\u0C96\u0CCD', // ಖ್
  R: '\u0C96', // ಖ
  'S\u00C1': '\u0C96\u0CBE', // ಖಾ
  T: '\u0C96\u0CBF', // ಖಿ
  'S\u00C9': '\u0C96\u0CC6', // ಖೆ
  'S\u00CB': '\u0C96\u0CCB', // ಖೌ
  'U\u00EF': '\u0C97\u0CCD', // ಗ್
  'U\u00C0': '\u0C97', // ಗ
  'U\u00C1': '\u0C97\u0CBE', // ಗಾ
  V: '\u0C97\u0CBF', // ಗಿ
  'U\u00C9': '\u0C97\u0CC6', // ಗೆ
  'U\u00CB': '\u0C97\u0CCC', // ಗೌ
  'W\u00EF': '\u0C98\u0CCD', // ಘ್
  'W\u00C0': '\u0C98', // ಘ
  'W\u00C1': '\u0C98\u0CBE', // ಘಾ
  X: '\u0C98\u0CBF', // ಘಿ
  'W\u00C9': '\u0C98\u0CC6', // ಘೆ
  'W\u00CB': '\u0C98\u0CCC', // ಘೌ
  k: '\u0C9E', // ಞ
  'Z\u00EF': '\u0C9A\u0CCD', // ಚ್
  'Z\u00C0': '\u0C9A', // ಚ
  'Z\u00C1': '\u0C9A\u0CBE', // ಚಾ
  a: '\u0C9A\u0CBF', // ಚಿ
  'Z\u00C9': '\u0C9A\u0CC6', // ಚೆ
  'Z\u00CB': '\u0C9A\u0CCC', // ಚೌ
  'b\u00EF': '\u0C9B\u0CCD', // ಛ್
  'b\u00C0': '\u0C9B', // ಛ
  'b\u00C1': '\u0C9B\u0CBE', // ಛಾ
  c: '\u0C9B\u0CBF', // ಛಿ
  'b\u00C9': '\u0C9B\u0CC6', // ಛೆ
  'b\u00CB': '\u0C9B\u0CCC', // ಛೌ
  'e\u00EF': '\u0C9C\u0CCD', // ಜ್
  d: '\u0C9C', // ಜ
  'e\u00C1': '\u0C9C\u0CBE', // ಜಾ
  f: '\u0C9C\u0CBF', // ಜಿ
  'e\u00C9': '\u0C9C\u0CC6', // ಜೆ
  'e\u00CB': '\u0C9C\u0CCC', // ಜೌ
  'g\u00C0hi\u00EF': '\u0C9D\u0CCD', // ಝ್
  'g\u00C0h\u00C4': '\u0C9D', // ಝ
  'g\u00C0hi\u00C1': '\u0C9D\u0CBE', // ಝಾ
  'jh\u00C4': '\u0C9D\u0CBF', // ಝಿ
  'g\u00C9h\u00C4': '\u0C9D\u0CC6', // ಝೆ
  'g\u00C9h\u00C6': '\u0C9D\u0CCA', // ಝೊ
  'g\u00C0hi\u00CB': '\u0C9D\u0CCC', // ಝೌ
  Y: '\u0C99', // ಙ
  'm\u00EF': '\u0C9F\u0CCD', // ಟ್
  l: '\u0C9F', // ಟ
  'm\u00C1': '\u0C9F\u0CBE', // ಟಾ
  n: '\u0C9F\u0CBF', // ಟಿ
  'm\u00C9': '\u0C9F\u0CC6', // ಟೆ
  'm\u00CB': '\u0C9F\u0CCC', // ಟೌ
  'o\u00EF': '\u0CA0\u0CCD', // ಠ್
  'o\u00C0': '\u0CA0', // ಠ
  'o\u00C1': '\u0CA0\u0CBE', // ಠಾ
  p: '\u0CA0\u0CBF', // ಠಿ
  'o\u00C9': '\u0CA0\u0CC6', // ಠೆ
  'o\u00CB': '\u0CA0\u0CCC', // ಠೌ
  'q\u00EF': '\u0CA1\u0CCD', // ಡ್
  'q\u00C0': '\u0CA1', // ಡ
  'q\u00C1': '\u0CA1\u0CBE', // ಡಾ
  r: '\u0CA1\u0CBF', // ಡಿ
  'q\u00C9': '\u0CA1\u0CC6', // ಡೆ
  'q\u00CB': '\u0CA1\u0CCC', // ಡೌ
  'qs\u00EF': '\u0CA2\u0CCD', // ಢ್
  'qs\u00C0': '\u0CA2', // ಢ
  'qs\u00C1': '\u0CA2\u0CBE', // ಢಾ
  'r\u00FC': '\u0CA2\u0CBF', // ಢಿ
  'qs\u00C9': '\u0CA2\u0CC6', // ಢೆ
  'qs\u00CB': '\u0CA2\u0CCC', // ಢೌ
  'u\u00EF': '\u0CA3\u0CCD', // ಣ್
  t: '\u0CA3', // ಣ
  'u\u00C1': '\u0CA3\u0CBE', // ಣಾ
  't\u00C2': '\u0CA3\u0CBF', // ಣಿ
  'u\u00C9': '\u0CA3\u0CC6', // ಣೆ
  'u\u00CB': '\u0CA3\u0CCC', // ಣೌ
  'v\u00EF': '\u0CA4\u0CCD', // ತ್
  'v\u00C0': '\u0CA4', // ತ
  'v\u00C1': '\u0CA4\u0CBE', // ತಾ
  w: '\u0CA4\u0CBF', // ತಿ
  'v\u00C9': '\u0CA4\u0CC6', // ತೆ
  'v\u00CB': '\u0CA4\u0CCC', // ತೌ
  'x\u00EF': '\u0CA5\u0CCD', // ಥ್
  'x\u00C0': '\u0CA5', // ಥ
  'x\u00C1': '\u0CA5\u0CBE', // ಥಾ
  y: '\u0CA5\u0CBF', // ಥಿ
  'x\u00C9': '\u0CA5\u0CC6', // ಥೆ
  'x\u00CB': '\u0CA5\u0CCC', // ಥೌ
  'z\u00EF': '\u0CA6\u0CCD', // ದ್
  'z\u00C0': '\u0CA6', // ದ
  'z\u00C1': '\u0CA6\u0CBE', // ದಾ
  '\u00A2': '\u0CA6\u0CBF', // ದಿ
  'z\u00C9': '\u0CA6\u0CC6', // ದೆ
  'z\u00CB': '\u0CA6\u0CCC', // ದೌ
  'zs\u00EF': '\u0CA7\u0CCD', // ಧ್
  'zs\u00C0': '\u0CA7', // ಧ
  'zs\u00C1': '\u0CA7\u0CBE', // ಧಾ
  '\u00A2\u00FC': '\u0CA7\u0CBF', // ಧಿ
  'zs\u00C9': '\u0CA7\u0CC6', // ಧೆ
  'zs\u00CB': '\u0CA7\u0CCC', // ಧೌ
  '\u00A3\u00EF': '\u0CA8\u0CCD', // ನ್
  '\u00A3\u00C0': '\u0CA8', // ನ
  '\u00A3\u00C1': '\u0CA8\u0CBE', // ನಾ
  '\u00A4': '\u0CA8\u0CBF', // ನಿ
  '\u00A3\u00C9': '\u0CA8\u0CC6', // ನೆ
  '\u00A3\u00CB': '\u0CA8\u0CCC', // ನೌ
  '\u00A5\u00EF': '\u0CAA\u0CCD', // ಪ್
  '\u00A5\u00C0': '\u0CAA', // ಪ
  '\u00A5\u00C1': '\u0CAA\u0CBE', // ಪಾ
  '\u00A6': '\u0CAA\u0CBF', // ಪಿ
  '\u00A5\u00C9': '\u0CAA\u0CC6', // ಪೆ
  '\u00A5\u00CB': '\u0CAA\u0CCC', // ಪೌ
  '\u00A5s\u00EF': '\u0CAB\u0CCD', // ಫ್
  '\u00A5s\u00C0': '\u0CAB', // ಫ
  '\u00A5s\u00C1': '\u0CAB\u0CBE', // ಫಾ
  '\u00A6\u00FC': '\u0CAB\u0CBF', // ಫಿ
  '\u00A5s\u00C9': '\u0CAB\u0CC6', // ಫೆ
  '\u00A5s\u00CB': '\u0CAB\u0CCC', // ಫೌ
  '\u00A8\u00EF': '\u0CAC\u0CCD', // ಬ್
  '\u00A7': '\u0CAC', // ಬ
  '\u00A8\u00C1': '\u0CAC\u0CBE', // ಬಾ
  '\u00A9': '\u0CAC\u0CBF', // ಬಿ
  '\u00A8\u00C9': '\u0CAC\u0CC6', // ಬೆ
  '\u00A8\u00CB': '\u0CAC\u0CCC', // ಬೌ
  '\u00A8s\u00EF': '\u0CAD\u0CCD', // ಭ್
  '\u00A8s\u00C0': '\u0CAD', // ಭ
  '\u00A8s\u00C1': '\u0CAD\u0CBE', // ಭಾ
  '\u00A9\u00FC': '\u0CAD\u0CBF', // ಭಿ
  '\u00A8s\u00C9': '\u0CAD\u0CC6', // ಭೆ
  '\u00A8s\u00CB': '\u0CAD\u0CCC', // ಭೌ
  '\u00AA\u00C0i\u00EF': '\u0CAE\u0CCD', // ಮ್
  '\u00AA\u00C0\u00C4': '\u0CAE', // ಮ
  '\u00AA\u00C0i\u00C1': '\u0CAE\u0CBE', // ಮಾ
  '\u00AB\u00C4': '\u0CAE\u0CBF', // ಮಿ
  '\u00AA\u00C9\u00C4': '\u0CAE\u0CC6', // ಮೆ
  '\u00AA\u00C0i\u00CB': '\u0CAE\u0CCC', // ಮೌ
  'Ai\u00C0i\u00EF': '\u0CAF\u0CCD', // ಯ್
  'Ai\u00C0\u00C4': '\u0CAF', // ಯ
  '0i\u00C0\u00C4': '\u0CAF', // ಯ
  'Ai\u00C0i\u00C1': '\u0CAF\u0CBE', // ಯಾ
  '0i\u00C0i\u00C1': '\u0CAF\u0CBE', // ಯಾ
  '\u00AC\u00C4': '\u0CAF\u0CBF', // ಯಿ
  '0i\u00C0\u00C4\u00C4': '\u0CAF\u0CC1', // ಯು
  'Ai\u00C9\u00C4': '\u0CAF\u0CC6', // ಯೆ
  '0i\u00C9\u00C6': '\u0CAF\u0CCA', // ಯೊ
  'Ai\u00C9\u00C6': '\u0CAF\u0CCA', // ಯೊ
  'Ai\u00C0i\u00CB': '\u0CAF\u0CCC', // ಯೌ
  'g\u00EF': '\u0CB0\u0CCD', // ರ್
  'g\u00C0': '\u0CB0', // ರ
  'g\u00C1': '\u0CB0\u0CBE', // ರಾ
  j: '\u0CB0\u0CBF', // ರಿ
  'g\u00C9': '\u0CB0\u0CC6', // ರೆ
  'g\u00CB': '\u0CB0\u0CCC', // ರೌ
  '\u00AF\u00EF': '\u0CB2\u0CCD', // ಲ್
  '\u00AE': '\u0CB2', // ಲ
  '\u00AF\u00C1': '\u0CB2\u0CBE', // ಲಾ
  '\u00B0': '\u0CB2\u0CBF', // ಲಿ
  '\u00AF\u00C9': '\u0CB2\u0CC6', // ಲೆ
  '\u00AF\u00CB': '\u0CB2\u0CCC', // ಲೌ
  '\u00AA\u00EF': '\u0CB5\u0CCD', // ವ್
  '\u00AA\u00C0': '\u0CB5', // ವ
  '\u00AA\u00C1': '\u0CB5\u0CBE', // ವಾ
  '\u00AB': '\u0CB5\u0CBF', // ವಿ
  '\u00AA\u00C0\u00C5': '\u0CB5\u0CC1', // ವು
  '\u00AA\u00C0\u00C7': '\u0CB5\u0CC2', // ವೂ
  '\u00AA\u00C9': '\u0CB5\u0CC6', // ವೆ
  '\u00AA\u00C9\u00C3': '\u0CB5\u0CC7', // ವೇ
  '\u00AA\u00C9\u00CA': '\u0CB5\u0CC8', // ವೈ
  '\u00AA\u00C9\u00C6': '\u0CAE\u0CCA', // ಮೊ
  '\u00AA\u00C9\u0CC6\u00C3': '\u0CAE\u0CCB', // ಮೋ
  '\u00AA\u00C9\u00C7': '\u0CB5\u0CCA', // ವೊ
  '\u00AA\u00C9\u00C7\u00C3': '\u0CB5\u0CCB', // ವೋ
  '\u00A5\u00C0\u00C5': '\u0CAA\u0CC1', // ಪು
  '\u00A5\u00C0\u00C7': '\u0CAA\u0CC2', // ಪೂ
  '\u00A5s\u00C0\u00C5': '\u0CAB\u0CC1', // ಫು
  '\u00A5s\u00C0\u00C7': '\u0CAB\u0CC2', // ಫೂ
  '\u00AA\u00CB': '\u0CB5\u0CCC', // ವೌ
  '\u00B1\u00EF': '\u0CB6\u0CCD', // ಶ್
  '\u00B1\u00C0': '\u0CB6', // ಶ
  '\u00B1\u00C1': '\u0CB6\u0CBE', // ಶಾ
  '\u00B2': '\u0CB6\u0CBF', // ಶಿ
  '\u00B1\u00C9': '\u0CB6\u0CC6', // ಶೆ
  '\u00B1\u00CB': '\u0CB6\u0CCC', // ಶೌ
  '\u00B5\u00EF': '\u0CB7\u0CCD', // ಷ್
  '\u00B5\u00C0': '\u0CB7', // ಷ
  '\u00B5\u00C1': '\u0CB7\u0CBE', // ಷಾ
  '\u00B6': '\u0CB7\u0CBF', // ಷಿ
  '\u00B5\u00C9': '\u0CB7\u0CC6', // ಷೆ
  '\u00B5\u00CB': '\u0CB7\u0CCC', // ಷೌ
  '\u00B8\u00EF': '\u0CB8\u0CCD', // ಸ್
  '\u00B8\u00C0': '\u0CB8', // ಸ
  '\u00B8\u00C1': '\u0CB8\u0CBE', // ಸಾ
  '\u00B9': '\u0CB8\u0CBF', // ಸಿ
  '\u00B8\u00C9': '\u0CB8\u0CC6', // ಸೆ
  '\u00B8\u00CB': '\u0CB8\u0CCC', // ಸೌ
  '\u00BA\u00EF': '\u0CB9\u0CCD', // ಹ್
  '\u00BA\u00C0': '\u0CB9', // ಹ
  '\u00BA\u00C1': '\u0CB9\u0CBE', // ಹಾ
  '\u00BB': '\u0CB9\u0CBF', // ಹಿ
  '\u00BA\u00C9': '\u0CB9\u0CC6', // ಹೆ
  '\u00BA\u00CB': '\u0CB9\u0CCC', // ಹೌ
  '\u00BC\u00EF': '\u0CB3\u0CCD', // ಳ್
  '\u00BC\u00C0': '\u0CB3', // ಳ
  '\u00BC\u00C1': '\u0CB3\u0CBE', // ಳಾ
  '\u00BD': '\u0CB3\u0CBF', // ಳಿ
  '\u00BC\u00C9': '\u0CB3\u0CC6', // ಳೆ
  '\u00BC\u00CB': '\u0CB3\u0CCC', // ಳೌ
};

// ASCII vattaksharagalu and their Unicode replacements (subscript forms).
const vattaksharagalu = {
  '\u00CC': '\u0C95', // ಕ
  '\u00CD': '\u0C96', // ಖ
  '\u00CE': '\u0C97', // ಗ
  '\u00CF': '\u0C98', // ಘ
  '\u00D5': '\u0C9E', // ಞ
  '\u00D1': '\u0C9A', // ಚ
  '\u00D2': '\u0C9B', // ಛ
  '\u00D3': '\u0C9C', // ಜ
  '\u00D4': '\u0C9D', // ಝ
  '\u00D6': '\u0C9F', // ಟ
  '\u00D7': '\u0CA0', // ಠ
  '\u00D8': '\u0CA1', // ಡ
  '\u00D9': '\u0CA2', // ಢ
  '\u00DA': '\u0CA3', // ಣ
  '\u00DB': '\u0CA4', // ತ
  '\u00DC': '\u0CA5', // ಥ
  '\u00DD': '\u0CA6', // ದ
  '\u00DE': '\u0CA7', // ಧ
  '\u00DF': '\u0CA8', // ನ
  '\u00E0': '\u0CAA', // ಪ
  '\u00E1': '\u0CAB', // ಫ
  '\u00E2': '\u0CAC', // ಬ
  '\u00E3': '\u0CAD', // ಭ
  '\u00E4': '\u0CAE', // ಮ
  '\u00E5': '\u0CAF', // ಯ
  '\u00E6': '\u0CB0', // ರ
  '\u00E8': '\u0CB2', // ಲ
  '\u00E9': '\u0CB5', // ವ
  '\u00EA': '\u0CB6', // ಶ
  '\u00EB': '\u0CB7', // ಷ
  '\u00EC': '\u0CB8', // ಸ
  '\u00ED': '\u0CB9', // ಹ
  '\u00EE': '\u0CB3', // ಳ
  '\u00E7': '\u0CB0', // ರ
};

// Arkavattu ASCII code and its Unicode replacement (reph form of ರ).
const arkavattu = '\u00F0';

// Dependent vowels (incl. halant) per the reference implementation.
const dependentVowels = ['\u0CCD', '\u0CBE', '\u0CBF', '\u0CC0', '\u0CC1', '\u0CC2', '\u0CC3', '\u0CC6', '\u0CC7', '\u0CC8', '\u0CCA', '\u0CCB', '\u0CCC'];

// Ignore-list spacing chars with no Unicode value.
const ignoreList = ['\u00F6', '\u00F7'];

const vowelPattern = dependentVowels.join('');

const customTransforms = [
  {
    pattern: `[${ignoreList.join('')}]`,
    replacement: '',
    description: 'Drop Nudi spacing chars (ö ÷) that carry no Unicode value.',
  },
  // Broken cases: merge the combining mark with the preceding matra.
  { pattern: `\u0CBF\u00C3`, replacement: '\u0CC0', description: 'ಿ + Ã -> ೀ' },
  { pattern: `\u0CC6\u00C3`, replacement: '\u0CC7', description: 'ೆ + Ã -> ೇ' },
  { pattern: `\u0CCA\u00C3`, replacement: '\u0CCB', description: 'ೊ + Ã -> ೋ' },
  { pattern: `\u00C3`, replacement: '\u0CC0', description: 'Ã -> ೀ' },
  { pattern: `\u0CC6\u00C6`, replacement: '\u0CCA', description: 'ೆ + Æ -> ೊ' },
  { pattern: `\u00C6`, replacement: '\u0CC2', description: 'Æ -> ೂ' },
  { pattern: `\u00C8`, replacement: '\u0CC3', description: 'È -> ೃ' },
  { pattern: `\u0CC6\u00CA`, replacement: '\u0CC8', description: 'ೆ + Ê -> ೈ' },
  { pattern: `\u00CA`, replacement: '\u0CC8', description: 'Ê -> ೈ' },
  // Vattakshara with a preceding dependent vowel: move the vowel after the
  // halant + subscript base letter.
  ...Object.entries(vattaksharagalu).map(([code, letter]) => ({
    pattern: `([${vowelPattern}])${code}`,
    replacement: `\u0CCD${letter}$1`,
    description: `Vattu ${code} after dependent vowel -> ್${letter} + vowel`,
  })),
  // Vattakshara without a dependent vowel: plain halant + base letter.
  ...Object.entries(vattaksharagalu).map(([code, letter]) => ({
    pattern: code,
    replacement: `\u0CCD${letter}`,
    description: `Vattu ${code} -> ್${letter}`,
  })),
  // Arkavattu with a preceding dependent vowel (precomposed C+V tokens).
  {
    pattern: `(.)([${vowelPattern}])${arkavattu}`,
    replacement: `\u0CB0\u0CCD$1$2`,
    description: 'Arkavattu after C+V -> ರ್ + C + V',
  },
  // Arkavattu in all other positions: reph before the base letter.
  {
    pattern: `(.)${arkavattu}`,
    replacement: `\u0CB0\u0CCD$1`,
    description: 'Arkavattu -> ರ್ + base letter',
  },
];

const mappings = Object.entries(mapping).map(([legacy, unicode]) => {
  let category = 'consonant';
  if (/[೦-೯]/.test(unicode)) category = 'numeral';
  else if (unicode.length > 1) category = 'conjunct';
  else if (/[ಅಆಇಈಉಊಋಎಏಐಒಓಔ]/.test(unicode)) category = 'vowel';
  else if (/[ಀ-ಏಐ-ಔ]/.test(unicode)) category = 'consonant';
  else if (/[ಂಃ]/.test(unicode)) category = 'modifier';
  return { legacy, unicode, category };
});

const profile = {
  id: 'nudi',
  name: 'Nudi',
  script: 'kannada',
  language: 'kn',
  version: '1.0.0',
  author: {
    name: 'AksharEngine Base',
    url: 'https://github.com/aravindavk/ascii2unicode',
  },
  fontFamilies: ['Nudi', 'Nudi 01-e', 'Nudi 4.0', 'Nudi 5.0', 'Nudi 6.0'],
  isBuiltIn: true,
  reorderingRules: {
    leftMatraSymbols: [],
    rephSymbols: [],
    customTransforms,
  },
  mappings,
};

fs.writeFileSync(
  path.join(__dirname, '../public/profiles/nudi.json'),
  JSON.stringify(profile, null, 2)
);

console.log(`Successfully built public/profiles/nudi.json (${mappings.length} mappings, ${customTransforms.length} transforms)`);
