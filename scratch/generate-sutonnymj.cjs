/**
 * Generate public/profiles/sutonnymj.json — SutonnyMJ / Bijoy 52 (Bengali)
 * legacy font profile.
 *
 * Mapping data source: bahar/BijoyToUnicode (AGPL-3.0) — canonical Bijoy
 * ASCII -> Bengali Unicode conversion table
 * (https://github.com/bahar/BijoyToUnicode/blob/master/bijoy2unicode.php).
 *
 * The reference implementation is a multi-pass pipeline:
 *   1. preConversionMap — ASCII-level typo fixes. Every entry that is a
 *      static string (e.g. doubled hrosh-u-kar "yy") is folded into the
 *      substitution trie below as a direct legacy key; the whitespace
 *      collapse patterns are reproduced via customTransforms instead.
 *   2. conversionMap — longest-match substitution (verbatim below).
 *   3. reArrangeUnicodeConvertedText — reorder passes:
 *      a. Reph: "©" -> "র্" moves before the preceding consonant cluster.
 *      b. kar + HALANT + consonant -> HALANT + consonant + kar
 *      c. র্ + kar -> kar + র্
 *      d. Pre-kars (ে ি ৈ) typed before the cluster move after the full
 *         conjunct-aware cluster (base consonant + (হলন্ত+consonant)*).
 *      e. Nukta (ঁ) moves after post-kars.
 *   4. postConversionMap — discrete merges (ো->ো, ৌ->ৌ, অা->আ) and the
 *      colon/space artifacts.
 * The engine applies substitution then customTransforms (after its own
 * leftMatra/reph handling), so the reorder logic is expressed as ordered
 * customTransforms here. leftMatraSymbols is deliberately EMPTY: the
 * engine's single-character matra mover would break conjuncts, and its
 * rephSymbols mover is equally unsafe in reverse mode (moves র্ past the
 * whole next word), so the conjunct-aware reph move is also a transform.
 */

const fs = require('fs');
const path = require('path');

// Reference conversionMap verbatim (bahar/BijoyToUnicode).
const conversionMap = {
  // Vowels
  Av: 'আ',
  A: 'অ',
  B: 'ই',
  C: 'ঈ',
  D: 'উ',
  E: 'ঊ',
  F: 'ঋ',
  G: 'এ',
  H: 'ঐ',
  I: 'ও',
  J: 'ঔ',
  // Consonants
  K: 'ক',
  L: 'খ',
  M: 'গ',
  N: 'ঘ',
  O: 'ঙ',
  P: 'চ',
  Q: 'ছ',
  R: 'জ',
  S: 'ঝ',
  T: 'ঞ',
  U: 'ট',
  V: 'ঠ',
  W: 'ড',
  X: 'ঢ',
  Y: 'ণ',
  Z: 'ত',
  _: 'থ',
  '`': 'দ',
  a: 'ধ',
  b: 'ন',
  c: 'প',
  d: 'ফ',
  e: 'ব',
  f: 'ভ',
  g: 'ম',
  h: 'য',
  i: 'র',
  j: 'ল',
  k: 'শ',
  l: 'ষ',
  m: 'স',
  n: 'হ',
  o: 'ড়',
  p: 'ঢ়',
  q: 'য়',
  r: 'ৎ',
  s: 'ং',
  t: 'ঃ',
  u: 'ঁ',
  // Numbers
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
  // Kars
  '•': 'ঙ্',
  v: 'া', // Aa-Kar
  w: 'ি', // i-Kar
  x: 'ী', // I-Kar
  y: 'ু', // u-Kar
  z: 'ু', // u-Kar
  '“': 'ু', // u-kar
  '–': 'ু', // u-kar
  '~': 'ূ', // U-kar
  'ƒ': 'ূ', // U-kaar
  '‚': 'ূ', // U-kaar
  '„„': 'ৃ', // Double Rri-kar Bug
  '„': 'ৃ', // Ri-Kar
  '…': 'ৃ', // Ri-Kar
  '†': 'ে', // E-Kar
  '‡': 'ে', // E-Kar
  'ˆ': 'ৈ', // Oi-Kar
  '‰': 'ৈ', // Oi-Kar
  'Š': 'ৗ', // Ou-Kar
  '\\|': '।', // Full-Stop
  '\\&': '্\u200C', // Ho-shonto + ZWNJ
  // Jukto Okkhor
  '\\^': '্ব',
  '‘': '্তু',
  '’': '্থ',
  '‹': '্ক',
  'Œ': '্ক্র',
  '”': 'চ্',
  '—': '্ত',
  '˜': 'দ্',
  '™': 'দ্',
  'š': 'ন্',
  '›': 'ন্',
  'œ': '্ন',
  'Ÿ': '্ব',
  '¡': '্ব',
  '¢': '্ভ',
  '£': '্ভ্র',
  '¤': 'ম্',
  '¥': '্ম',
  '¦': '্ব',
  '§': '্ম',
  '¨': '্য',
  '©': 'র্',
  'ª': '্র',
  '«': '্র',
  '¬': '্ল',
  '\u00AD': '্ল', // soft hyphen
  '®': 'ষ্',
  '¯': 'স্',
  '°': 'ক্ক',
  '±': 'ক্ট',
  '²': 'ক্ষ্ণ', // shu(kkhno)
  '³': 'ক্ত',
  '´': 'ক্ম',
  'µ': 'ক্র',
  '¶': 'ক্ষ',
  '·': 'ক্স',
  '¸': 'গু',
  '¹': 'জ্ঞ',
  'º': 'গ্দ',
  '»': 'গ্ধ',
  '¼': 'ঙ্ক',
  '½': 'ঙ্গ',
  '¾': 'জ্জ',
  '¿': '্ত্র',
  'À': 'জ্ঝ',
  'Á': 'জ্ঞ',
  'Â': 'ঞ্চ',
  'Ã': 'ঞ্ছ',
  'Ä': 'ঞ্জ',
  'Å': 'ঞ্ঝ',
  'Æ': 'ট্ট',
  'Ç': 'ড্ড',
  'È': 'ণ্ট',
  'É': 'ণ্ঠ',
  'Ê': 'ণ্ড',
  'Ë': 'ত্ত',
  'Ì': 'ত্থ',
  'Í': 'ত্ম',
  'Î': 'ত্র',
  'Ï': 'দ্দ',
  'Ð': '-',
  'Ñ': '-',
  'Ò': '"',
  'Ó': '"',
  'Ô': "'",
  'Õ': "'",
  'Ö': '্র',
  '×': 'দ্ধ',
  'Ø': 'দ্ব',
  'Ù': 'দ্ম',
  'Ú': 'ন্ঠ',
  'Û': 'ন্ড',
  'Ü': 'ন্ধ',
  'Ý': 'ন্স',
  'Þ': 'প্ট',
  'ß': 'প্ত',
  'à': 'প্প',
  'á': 'প্স',
  'â': 'ব্জ',
  'ã': 'ব্দ',
  'ä': 'ব্ধ',
  'å': 'ভ্র',
  'æ': 'ম্ন',
  'ç': 'ম্ফ',
  'è': '্ন',
  'é': 'ল্ক',
  'ê': 'ল্গ',
  'ë': 'ল্ট',
  'ì': 'ল্ড',
  'í': 'ল্প',
  'î': 'ল্ফ',
  'ï': 'শু',
  'ð': 'শ্চ',
  'ñ': 'শ্ছ',
  'ò': 'ষ্ণ',
  'ó': 'ষ্ট',
  'ô': 'ষ্ঠ',
  'õ': 'ষ্ফ',
  'ö': 'স্খ',
  '÷': 'স্ট',
  'ø': 'স্ন', // (sn)eho //†ønØ
  'ù': 'স্ফ',
  'ú': '্প',
  'û': 'হু',
  'ü': 'হৃ',
  'ý': 'হ্ন',
  'þ': 'হ্ম',
};

// Static entries of the reference preConversionMap folded into the trie
// (longest match wins, so "yy" correctly beats "y" etc.).
const preConversionKeys = {
  yy: 'ু', // Double Hrosh-u-Kar
  'y&': 'ু', // Hoshonto+Hrosh-u
  vv: 'া', // Double Aa-Kar
  '„&': 'ৃ', // Hoshonto+Ri-Kar
  '‡u': 'ঁে', // ChondroBindu error (‡u -> u‡)
  wu: 'ঁি', // ChondroBindu error (wu -> uw)
  '\u00AD\u00AD': '্ল', // Double Jukto-L
  ' \\|': '।', // space + danda key
  // Bare '&' also means ho-shonto in common Bijoy text (the PHP spells
  // it '\&' after its own backslash cleanup pass).
  '&': '্\u200C',
};

const mapping = { ...conversionMap, ...preConversionKeys };

// Conjunct-aware cluster: base consonant, optionally followed by any number
// of (হলন্ত + consonant) pairs (zung around ZWNJ after halant).
const HALANT = '\u09CD';
const ZWNJ = '\u200C';
const CONSONANT = '[\u0995-\u09B9\u09CE\u0982\u0983\u0981]'; // ক-হ + ৎ ং ঃ ঁ
const POST_KAR = '[\u09BE\u09CB\u09CC\u09D7\u09C1\u09C2\u09C0\u09C3]'; // া ো ৌ ৗ ু ূ ী ৃ
const ALL_KAR = '[\u09BE\u09CB\u09CC\u09D7\u09C1\u09C2\u09C0\u09C3\u09C7\u09BF\u09C8\u0981]'; // + ে ি ৈ ঁ

const customTransforms = [
  // proConversionMap analogue: collapse doubled halants (from overlapping
  // precomposed keys like ©/® chains) before any reordering.
  { pattern: `${HALANT}${HALANT}`, replacement: HALANT, description: 'Double halant -> single halant' },
  { pattern: `${HALANT}${ZWNJ}${HALANT}${ZWNJ}`, replacement: `${HALANT}${ZWNJ}`, description: 'Double halant+ZWNJ -> single' },
  { pattern: `${HALANT}${ZWNJ}${HALANT}`, replacement: `${HALANT}${ZWNJ}`, description: 'Mixed doubled halant -> halant+ZWNJ' },
  // Reph: © -> র্ moves before the preceding consonant cluster (or a
  // single kar), mirroring the reference back-scan. Requires a preceding
  // cluster/kar and must not be preceded by halant (i.e. not a ্র conjunct).
  // Runs BEFORE the pre-kar moves so that a reph followed by a pre-kar
  // cluster (†K©) lands as র্+cluster+ে instead of cluster+র্+ে.
  {
    pattern: `(?<!${HALANT})(${CONSONANT}(?:${HALANT}(?:${ZWNJ})?${CONSONANT})*|${ALL_KAR})র\u09CD`,
    replacement: `র\u09CD$1`,
    description: 'Reph র্ moved before preceding cluster',
  },
  // kar + HALANT + consonant -> HALANT + consonant + kar (artifact of
  // precomposed kar-conjunct keys like ¸ -> গু followed by a halant).
  { pattern: `(${ALL_KAR})(${HALANT})(${CONSONANT})`, replacement: `$2$3$1`, description: 'Kar before halant reordered after cluster' },
  // র্ + kar -> kar + র্ (e.g. typed র্ followed by a kaar).
  { pattern: `(?<!${HALANT})র\u09CD(${POST_KAR})`, replacement: `$1র\u09CD`, description: 'র্ + kar swapped' },
  // Pre-kars move after the full conjunct-aware cluster.
  { pattern: `ে(${CONSONANT}(?:${HALANT}(?:${ZWNJ})?${CONSONANT})*)`, replacement: `$1ে`, description: 'ে moved after cluster' },
  { pattern: `ি(${CONSONANT}(?:${HALANT}(?:${ZWNJ})?${CONSONANT})*)`, replacement: `$1ি`, description: 'ি moved after cluster' },
  { pattern: `ৈ(${CONSONANT}(?:${HALANT}(?:${ZWNJ})?${CONSONANT})*)`, replacement: `$1ৈ`, description: 'ৈ moved after cluster' },
  // Merge pre-kar + post-kar into the composed forms.
  { pattern: `ো`, replacement: 'ো', description: 'ে + া -> ো' },
  { pattern: `ৌ`, replacement: 'ৌ', description: 'ে + ৗ -> ৌ' },
  // Nukta moves after post-kars.
  { pattern: `ঁ(${POST_KAR})`, replacement: `$1ঁ`, description: 'Nukta moved after kaar' },
  // postConversionMap: independent vowel আ fixing and colon artifacts.
  { pattern: 'অা', replacement: 'আ', description: 'অ + া -> আ' },
  { pattern: '([\u09E6-\u09EF])\u0983', replacement: '$1:', description: 'Digit + visarga -> digit + colon' },
  { pattern: ' \u0983', replacement: ' :', description: 'Space + visarga -> space + colon' },
  { pattern: '\\]\u0983', replacement: ']:', description: '] + visarga -> ] + colon' },
  { pattern: '\\[\u0983', replacement: '[:', description: '[ + visarga -> [ + colon' },
  { pattern: ' ,', replacement: ',', description: 'Space before comma removed' },
  { pattern: ' {2,}', replacement: ' ', description: 'Repeated spaces collapsed' },
];

const mappings = Object.entries(mapping).map(([legacy, unicode]) => {
  let category = 'consonant';
  if (/[\u09E6-\u09EF]/.test(unicode)) category = 'numeral'; // ০-৯
  else if (/[\u09C1\u09C2\u09C0\u09C3\u09BE\u09C7\u09BF\u09C8\u09CB\u09CC\u09D7\u09CD]/.test(unicode)) category = 'matra';
  else if (/[\u0981\u0982\u0983]/.test(unicode)) category = 'modifier';
  else if (unicode.length > 1) category = 'conjunct';
  else if (/[\u0985\u0986\u0987\u0988\u0989\u098A\u098B\u098F\u0990\u0993\u0994]/.test(unicode)) category = 'vowel';
  return { legacy, unicode, category };
});

const profile = {
  id: 'sutonnymj-bengali',
  name: 'SutonnyMJ (Bengali)',
  script: 'bengali',
  language: 'bn',
  version: '1.0.0',
  author: {
    name: 'AksharEngine Base',
    url: 'https://github.com/bahar/BijoyToUnicode',
  },
  fontFamilies: ['SutonnyMJ', 'SutonnyOMJ', 'SolaimanLipi Legacy'],
  isBuiltIn: true,
  reorderingRules: {
    leftMatraSymbols: [],
    rephSymbols: [],
    customTransforms,
  },
  mappings,
};

fs.writeFileSync(
  path.join(__dirname, '../public/profiles/sutonnymj.json'),
  JSON.stringify(profile, null, 2)
);

console.log(
  `Successfully built public/profiles/sutonnymj.json (${mappings.length} mappings, ${customTransforms.length} transforms)`
);