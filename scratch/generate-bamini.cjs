/**
 * Generate public/profiles/bamini.json — Bamini (Tamil) legacy font profile.
 *
 * Mapping data source: Pakeetharan/unicode-bamini-converter (MIT) — the
 * canonical Unicode -> Bamini replacement table
 * (https://github.com/Pakeetharan/unicode-bamini-converter/blob/main/convert.js).
 *
 * The legacy Bamini encoding is a one-to-many character grid: each Tamil
 * syllable is a precomposed (base consonant or vowel) plus postfix kars,
 * e.g. க= f, கா= fh, கி= fp, கீ= fP, கெ= nf, கே= Nf, கை= if, கௌ= nfs,
 * கோ= Nfh, கொ= nfh, க்= f; — with per-consonant special forms for the
 * short/long u kars (கு= F, கூ= $, சு= R, ...). The profile below stores
 * the INVERTED table (legacy -> Unicode); Dhuru longest-match substitution
 * resolves prefix pairs such as nf/nfs and W/W}.
 *
 * Known ambiguity, mirroring the reference table verbatim: the legacy key
 * "*" maps to ஙு, ஞு AND ழூ. First-in-table (ஙு) wins, so reverse
 * (Unicode -> legacy) conversion is lossy for ஞு/ழூ, exactly like most
 * simple Bamini converters.
 *
 * No reordering is needed: every multi-sign syllable (ொ ோ ௌ) is a single
 * NFC-precomposed Unicode code point, so the substitution alone suffices.
 */

const fs = require('fs');
const path = require('path');

// Unicode Tamil base letters and their lone Bamini glyphs.
const vowels = [
  ['அ', 'm'],
  ['ஆ', 'M'],
  ['இ', ','],
  ['ஈ', '<'],
  ['உ', 'c'],
  ['ஊ', 'C'],
  ['எ', 'v'],
  ['ஏ', 'V'],
  ['ஐ', 'I'],
  ['ஒ', 'x'],
  ['ஓ', 'X'],
  ['ஔ', 'xs'],
  ['ஃ', '/'],
];

// Unicode consonant bases -> lone Bamini code point.
const consonants = {
  க: 'f',
  ங: 'q',
  ச: 'r',
  ஞ: 'Q',
  ட: 'l',
  ண: 'z',
  த: 'j',
  ந: 'e',
  ன: 'd',
  ப: 'g',
  ம: 'k',
  ய: 'a',
  ர: 'u',
  ல: 'y',
  ள: 's',
  வ: 't',
  ழ: 'o',
  ற: 'w',
  ஹ: '`',
  ஷ: '\\',
  ஸ: ']',
  ஜ: '[',
};

// Per-consonant short-u and long-u (ū) special forms; every consonant has
// an explicit entry, so no generic fallback "{"/"_" is ever emitted.
const uKar = {
  க: 'F',
  ங: '*',
  ஞ: '*',
  ச: 'R',
  ட: 'L',
  ண: 'Z',
  த: 'J',
  ந: 'E',
  ன: 'D',
  ப: 'G',
  ம: 'K',
  ய: 'A',
  ர: 'U',
  ல: 'Y',
  ள: 'S',
  வ: 'T',
  ழ: 'O',
  ற: 'W',
  ஹ: '{`',
  ஷ: '{',
  ஸ: ']{',
  ஜ: '[{',
};

const uuKar = {
  க: '$',
  ங: '*',
  ஞ: '*',
  ச: 'R+',
  ட: '^',
  ண: 'Z}',
  த: 'J}',
  ந: 'E}',
  ன: 'D}',
  ப: 'G+',
  ம: '%',
  ய: 'A+',
  ர: '\\&',
  ல: 'Y}',
  ள: 'Sh',
  வ: 'T+',
  ழ: '*',
  ற: 'W}',
  ஹ: '`_',
  ஷ: '\\_',
  ஸ: ']_',
  ஜ: '',
};

// The reference table has no ஜூ (ஜ + long-u) rule, so no key is emitted
// for it; the entry above keeps the grid alignment.

// [unicode, legacy] pairs in reference-table order (first occurrence of a
// legacy key wins after inversion, resolving the "*" ஙு/ஞு/ழூ collision
// to ஙு exactly like the reference's own replace order).
const unicodeToLegacy = [];

for (const v of vowels) unicodeToLegacy.push(v);

for (const [base, legacy] of Object.entries(consonants)) {
  unicodeToLegacy.push([`${base}ா`, `${legacy}h`]); // a-kar
  unicodeToLegacy.push([`${base}ி`, `${legacy}p`]); // i-kar
  unicodeToLegacy.push([`${base}ீ`, `${legacy}P`]); // ee-kar
  unicodeToLegacy.push([`${base}ு`, uKar[base]]); // u-kar
  if (uuKar[base]) unicodeToLegacy.push([`${base}ூ`, uuKar[base]]); // uu-kar
  unicodeToLegacy.push([`${base}ெ`, `n${legacy}`]); // e-kar
  unicodeToLegacy.push([`${base}ே`, `N${legacy}`]); // ee-kar
  unicodeToLegacy.push([`${base}ை`, `i${legacy}`]); // ai-kar
  unicodeToLegacy.push([`${base}ௌ`, `n${legacy}s`]); // au-kar
  unicodeToLegacy.push([`${base}ோ`, `N${legacy}h`]); // oo-kar
  unicodeToLegacy.push([`${base}ொ`, `n${legacy}h`]); // o-kar
  unicodeToLegacy.push([`${base}்`, `${legacy};`]); // pulli
  unicodeToLegacy.push([base, legacy]); // bare consonant
}

unicodeToLegacy.push(['ஸ்ரீ', '=']);
unicodeToLegacy.push([',', '>']);

// Invert: legacy -> Unicode, first occurrence wins.
const legacyToUnicode = new Map();
for (const [unicode, legacy] of unicodeToLegacy) {
  if (!legacyToUnicode.has(legacy)) legacyToUnicode.set(legacy, unicode);
}

const mappings = [...legacyToUnicode.entries()].map(([legacy, unicode]) => {
  let category = 'consonant';
  if (/[\u0BE6-\u0BEF]/.test(unicode)) category = 'numeral'; // ௦-௯
  else if (/[\u0B82\u0B83]/.test(unicode)) category = 'modifier'; // ஂ ஃ
  else if (/[\u0BBE-\u0BCC]/.test(unicode)) category = 'matra'; // kars
  else if (unicode.length > 1) category = 'conjunct';
  else if (/[\u0B85-\u0B94]/.test(unicode)) category = 'vowel';
  return { legacy, unicode, category };
});

const profile = {
  id: 'bamini',
  name: 'Bamini',
  script: 'tamil',
  language: 'ta',
  version: '1.0.0',
  author: {
    name: 'AksharEngine Base',
    url: 'https://github.com/Pakeetharan/unicode-bamini-converter',
  },
  fontFamilies: ['Bamini', 'Bamini New', 'Bamoon'],
  isBuiltIn: true,
  reorderingRules: {
    leftMatraSymbols: [],
    rephSymbols: [],
    customTransforms: [],
  },
  mappings,
};

fs.writeFileSync(
  path.join(__dirname, '../public/profiles/bamini.json'),
  JSON.stringify(profile, null, 2)
);

console.log(
  `Successfully built public/profiles/bamini.json (${mappings.length} mappings, of ${unicodeToLegacy.length} reference pairs)`
);