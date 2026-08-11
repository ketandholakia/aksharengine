const fs = require('fs');
const path = require('path');

const a1Str = fs.readFileSync(path.join(__dirname, 'akruti-a1.txt'), 'utf16le');

// Since array_one contains BOTH legacy and unicode interleaved
// e.g. "ˆÅ" ,	"क" ,
// we need to split by comma and extract pairs

const tokens = a1Str.split('","').map(s => s.replace(/^"|"$/g, '').replace(/^[ \t]+|[ \t]+$/g, ''));
// Sometimes commas are bare, let's try a better parser
// Actually splitting by '","' won't work well if there's whitespace.
// Let's use regex to find all quoted strings.
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
  id: "akruti-dev",
  name: "Akruti Dev",
  script: "devanagari",
  language: "hi",
  version: "1.0.0",
  fontFamilies: ["AkrutiOfficePriya", "AkrutiDev"],
  isBuiltIn: true,
  reorderingRules: {
    leftMatraSymbols: ["¦", "¢", "ç"], // Based on the JS logic
    rephSymbols: ["Ä"],          // Reph 'र्'
    customTransforms: []
  },
  mappings: mappings
};

fs.writeFileSync(
  path.join(__dirname, '../public/profiles/akruti.json'),
  JSON.stringify(profile, null, 2)
);

console.log("Successfully built public/profiles/akruti.json");
