const fs = require('fs');
const path = require('path');

const a1Str = fs.readFileSync(path.join(__dirname, 'bhaskar-a1.txt'), 'utf16le');

const matches = [...a1Str.matchAll(/"([^"\\]*(\\.[^"\\]*)*)"/g)].map(m => m[1]);

const mappings = [];
for (let i = 0; i < matches.length; i += 2) {
  const legacy = matches[i];
  const unicode = matches[i+1];
  
  if (!unicode || !legacy || unicode.includes('//') || legacy.includes('//')) continue;
  
  let category = 'other';
  if (unicode.match(/[क-ह]/)) category = 'consonant';
  if (unicode.match(/[ा-ौ]/)) category = 'matra';
  if (unicode.match(/[०-९]/) || unicode.match(/[0-9]/)) category = 'number';
  
  mappings.push({ legacy, unicode, category });
}

const profile = {
  id: "bhaskar",
  name: "Bhaskar",
  script: "devanagari",
  language: "hi",
  version: "1.0.0",
  fontFamilies: ["Bhaskar"],
  isBuiltIn: true,
  reorderingRules: {
    leftMatraSymbols: ["Ç", "¨", "ç"], // From script
    rephSymbols: ["ü"],          // Reph 'र्'
    customTransforms: []
  },
  mappings: mappings
};

fs.writeFileSync(
  path.join(__dirname, '../public/profiles/bhaskar.json'),
  JSON.stringify(profile, null, 2)
);

console.log("Successfully built public/profiles/bhaskar.json");
