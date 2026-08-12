const fs = require('fs');

const mappings = [];

// Base mapping loop for core block
for (let hex = 0x0900; hex <= 0x097F; hex++) {
  const dev = String.fromCharCode(hex);
  const gujHex = hex + 0x0180;
  const guj = String.fromCharCode(gujHex);

  // We should assign categories if needed, but for transliteration from standard to standard,
  // we might not even need reordering rules because both are standard unicode!
  // Wait, if BOTH are standard unicode, we DON'T need reordering rules!
  // Standard Unicode already has matras in their logical phonetic order.
  // The ConverterEngine just substitutes string for string if reordering is disabled.

  mappings.push({
    legacy: dev,
    unicode: guj,
    category: 'transliteration'
  });
}

const profile = {
  id: 'devanagari-gujarati-transliteration',
  name: 'Devanagari ↔ Gujarati Transliteration',
  script: 'gujarati',
  language: 'gu',
  version: '1.0.0',
  fontFamilies: ['sans-serif'], // Standard fonts
  author: {
    name: 'AksharEngine'
  },
  isBuiltIn: true,
  reorderingRules: {
    // No reordering needed because standard unicode to standard unicode is phonetically ordered!
    leftMatraSymbols: [],
    rephSymbols: []
  },
  mappings: mappings
};

fs.writeFileSync('public/profiles/devanagari-gujarati-transliteration.json', JSON.stringify(profile, null, 2));
console.log('Created devanagari-gujarati-transliteration.json');
