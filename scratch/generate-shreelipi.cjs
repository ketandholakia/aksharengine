const fs = require('fs');
const path = require('path');

const a1Str = fs.readFileSync(path.join(__dirname, 'shreelipi-a1.txt'), 'utf16le');
const a2Str = fs.readFileSync(path.join(__dirname, 'shreelipi-a2.txt'), 'utf16le');

const array_one = a1Str.split('","').map(s => s.replace(/^"|"$/g, '').trim());
const array_two = a2Str.split('","').map(s => s.replace(/^"|"$/g, '').trim());

const mappings = [];
for (let i = 0; i < array_one.length; i++) {
  const legacy = array_one[i];
  const unicode = array_two[i];
  
  if (!unicode || !legacy || unicode.includes('//') || legacy.includes('//')) continue;
  
  let category = 'other';
  if (unicode.match(/[क-ह]/)) category = 'consonant';
  if (unicode.match(/[ा-ौ]/)) category = 'matra';
  if (unicode.match(/[०-९]/) || unicode.match(/[0-9]/)) category = 'number';
  
  mappings.push({ legacy, unicode, category });
}

const profile = {
  id: "shreelipi-dev",
  name: "Shree-Lipi / Shree Dev",
  script: "devanagari",
  language: "hi",
  version: "1.0.0",
  fontFamilies: ["Shree-Lipi", "Shree-Dev", "Shree-Dev-0702"],
  isBuiltIn: true,
  reorderingRules: {
    leftMatraSymbols: ["o", "q"], // "o" for ि, "q" for िं
    rephSymbols: ["©"],          // Reph 'र्'
    customTransforms: []
  },
  mappings: mappings
};

fs.writeFileSync(
  path.join(__dirname, '../public/profiles/shreelipi.json'),
  JSON.stringify(profile, null, 2)
);

console.log("Successfully built public/profiles/shreelipi.json");
