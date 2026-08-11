const fs = require('fs');
const path = require('path');

const script = fs.readFileSync(path.join(__dirname, 'xdvng-script.txt'), 'utf8');

// Parse replace calls
const matches = [...script.matchAll(/replace\s*\(\s*\/(.*?)\/g\s*,\s*"([^"]*)"\s*\)/g)];
const m2 = [...script.matchAll(/replace\s*\(\s*"([^"]*)"\s*,\s*"([^"]*)"\s*\)/g)];
const allMatches = matches.concat(m2);

const mappings = [];
for (const match of allMatches) {
  const legacy = match[1];
  const unicode = match[2];
  
  if (legacy.includes('[') || legacy.includes('(') || legacy.includes('\\')) continue; // Skip complex regexes
  
  let category = 'other';
  if (unicode.match(/[क-ह]/)) category = 'consonant';
  if (unicode.match(/[ा-ौ]/)) category = 'matra';
  if (unicode.match(/[०-९]/) || unicode.match(/[0-9]/)) category = 'number';
  
  mappings.push({ legacy, unicode, category });
}

// XDVNG has some manual fixes in the script:
// New_Text = New_Text.replace( /e/g , "ि" ) ;
// New_Text.replace ( /r/g , "र्" ) ;
// New_Text.replace ( /ü/g , "र्" ) ;
// New_Text.replace ( /ý/g , "र्" ) ;

const profile = {
  id: "xdvng",
  name: "XDVNG",
  script: "devanagari",
  language: "hi",
  version: "1.0.0",
  fontFamilies: ["XDVNG"],
  isBuiltIn: true,
  reorderingRules: {
    leftMatraSymbols: ["e"],
    rephSymbols: ["ü", "ý"],
    customTransforms: []
  },
  mappings: mappings
};

fs.writeFileSync(
  path.join(__dirname, '../public/profiles/xdvng.json'),
  JSON.stringify(profile, null, 2)
);

console.log("Successfully built public/profiles/xdvng.json");
