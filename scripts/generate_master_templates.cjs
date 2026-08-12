const fs = require('fs');
const path = require('path');

const profilesDir = path.join(__dirname, '../public/profiles');
const gujTemplate = require(path.join(profilesDir, 'gujarati-master-template.json'));

// Base Unicode block start for Gujarati is 0x0A80
const GUJ_BASE = 0x0A80;

const scripts = [
  // Devanagari Block (0x0900)
  { id: 'hindi', name: 'Hindi Master Template', lang: 'hi', base: 0x0900, type: 'brahmi', scriptName: 'devanagari' },
  { id: 'marathi', name: 'Marathi Master Template', lang: 'mr', base: 0x0900, type: 'brahmi', scriptName: 'devanagari' },
  { id: 'sanskrit', name: 'Sanskrit Master Template', lang: 'sa', base: 0x0900, type: 'brahmi', scriptName: 'devanagari' },
  { id: 'nepali', name: 'Nepali Master Template', lang: 'ne', base: 0x0900, type: 'brahmi', scriptName: 'devanagari' },
  { id: 'konkani', name: 'Konkani Master Template', lang: 'kok', base: 0x0900, type: 'brahmi', scriptName: 'devanagari' },
  { id: 'maithili', name: 'Maithili Master Template', lang: 'mai', base: 0x0900, type: 'brahmi', scriptName: 'devanagari' },
  { id: 'bodo', name: 'Bodo Master Template', lang: 'brx', base: 0x0900, type: 'brahmi', scriptName: 'devanagari' },
  { id: 'dogri', name: 'Dogri Master Template', lang: 'doi', base: 0x0900, type: 'brahmi', scriptName: 'devanagari' },
  
  // Bengali Block (0x0980)
  { id: 'bengali', name: 'Bengali Master Template', lang: 'bn', base: 0x0980, type: 'brahmi', scriptName: 'bengali' },
  { id: 'assamese', name: 'Assamese Master Template', lang: 'as', base: 0x0980, type: 'brahmi', scriptName: 'bengali' },
  
  // Other Brahmi Blocks
  { id: 'punjabi', name: 'Punjabi Master Template', lang: 'pa', base: 0x0A00, type: 'brahmi', scriptName: 'gurmukhi' },
  { id: 'odia', name: 'Odia Master Template', lang: 'or', base: 0x0B00, type: 'brahmi', scriptName: 'odia' },
  { id: 'tamil', name: 'Tamil Master Template', lang: 'ta', base: 0x0B80, type: 'brahmi', scriptName: 'tamil' },
  { id: 'telugu', name: 'Telugu Master Template', lang: 'te', base: 0x0C00, type: 'brahmi', scriptName: 'telugu' },
  { id: 'kannada', name: 'Kannada Master Template', lang: 'kn', base: 0x0C80, type: 'brahmi', scriptName: 'kannada' },
  { id: 'malayalam', name: 'Malayalam Master Template', lang: 'ml', base: 0x0D00, type: 'brahmi', scriptName: 'malayalam' },

  // Non-Brahmi Scripts (Require manual mapping, so we generate empty templates)
  { id: 'urdu', name: 'Urdu Master Template', lang: 'ur', type: 'empty', scriptName: 'perso-arabic' },
  { id: 'sindhi', name: 'Sindhi Master Template', lang: 'sd', type: 'empty', scriptName: 'perso-arabic' },
  { id: 'kashmiri', name: 'Kashmiri Master Template', lang: 'ks', type: 'empty', scriptName: 'perso-arabic' },
  { id: 'santali', name: 'Santali Master Template', lang: 'sat', type: 'empty', scriptName: 'ol-chiki' },
  { id: 'manipuri', name: 'Manipuri Master Template', lang: 'mni', type: 'empty', scriptName: 'meetei-mayek' }
];

function transliterateText(text, offset) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= GUJ_BASE && code <= GUJ_BASE + 0x7F) {
      result += String.fromCharCode(code + offset);
    } else {
      result += text[i];
    }
  }
  return result;
}

scripts.forEach(script => {
  let reorderingRules = { leftMatraSymbols: [], rephSymbols: [] };
  let mappings = [];

  if (script.type === 'brahmi') {
    const offset = script.base - GUJ_BASE;
    reorderingRules = {
      leftMatraSymbols: gujTemplate.reorderingRules.leftMatraSymbols.map(sym => transliterateText(sym, offset)),
      rephSymbols: gujTemplate.reorderingRules.rephSymbols.map(sym => transliterateText(sym, offset))
    };
    mappings = gujTemplate.mappings.map(m => {
      const trans = transliterateText(m.unicode, offset);
      return { legacy: trans, unicode: trans, category: m.category };
    });
  }
  
  const newProfile = {
    id: `${script.id}-master-template`,
    name: script.name,
    script: script.scriptName,
    language: script.lang,
    version: '1.0.0',
    author: { name: 'AksharEngine' },
    isBuiltIn: true,
    reorderingRules,
    mappings
  };
  
  fs.writeFileSync(
    path.join(profilesDir, `${newProfile.id}.json`),
    JSON.stringify(newProfile, null, 2)
  );
  console.log(`Generated ${newProfile.id}.json`);
});

// Now update index.json
const indexPath = path.join(profilesDir, 'index.json');
let indexFiles = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

scripts.forEach(script => {
  const entry = `/profiles/${script.id}-master-template.json`;
  if (!indexFiles.includes(entry)) {
    indexFiles.push(entry);
  }
});

indexFiles.sort();
fs.writeFileSync(indexPath, JSON.stringify(indexFiles, null, 2));
console.log('Updated index.json');
