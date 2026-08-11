#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const options = {
  unicodeLine: null,
  legacyLine: null,
  unicodeFile: null,
  legacyFile: null,
  output: null,
  mergeWith: null,
  profile: false,
  help: false,
  id: 'new-font-profile',
  name: 'New Legacy Font',
  script: 'gujarati',
  language: 'gu',
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--unicode-line' || arg === '-u') options.unicodeLine = args[++i];
  else if (arg === '--legacy-line' || arg === '-l') options.legacyLine = args[++i];
  else if (arg === '--unicode-file') options.unicodeFile = args[++i];
  else if (arg === '--legacy-file') options.legacyFile = args[++i];
  else if (arg === '--output' || arg === '-o') options.output = args[++i];
  else if (arg === '--merge-with') options.mergeWith = args[++i];
  else if (arg === '--profile') options.profile = true;
  else if (arg === '--id') options.id = args[++i];
  else if (arg === '--name') options.name = args[++i];
  else if (arg === '--script') options.script = args[++i];
  else if (arg === '--language') options.language = args[++i];
  else if (arg === '-h' || arg === '--help') options.help = true;
}

const usage = `
AksharEngine Pair Mapper
------------------------------------------------
Usage:
  node bin/map-pairs.js --unicode-line "અ આ ઇ" --legacy-line "a ai e" [--output profile.json]

Options:
  -u, --unicode-line   Pasted Unicode line
  -l, --legacy-line    Pasted legacy line
      --unicode-file   Path to a file containing the Unicode line
      --legacy-file    Path to a file containing the legacy line
  -o, --output         Output path. If omitted, prints JSON to stdout
      --profile        Write a full font profile instead of only mappings
      --merge-with     Merge into an existing profile JSON file
      --id             Profile ID (default: new-font-profile)
      --name           Profile name (default: New Legacy Font)
      --script         Target script (default: gujarati)
      --language       Language code (default: gu)
`;

if (options.help) {
  console.log(usage);
  process.exit(0);
}

const readText = (filePath) => fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf-8').trim();
const toTokens = (text) => text.split(/\s+/).map((t) => t.trim()).filter(Boolean);
const flattenText = (text) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => toTokens(line));

const unicodeText = options.unicodeLine ?? (options.unicodeFile ? readText(options.unicodeFile) : null);
const legacyText = options.legacyLine ?? (options.legacyFile ? readText(options.legacyFile) : null);

if (!unicodeText || !legacyText) {
  console.log(usage);
  process.exit(1);
}

const unicodeTokens = flattenText(unicodeText);
const legacyTokens = flattenText(legacyText);

if (unicodeTokens.length !== legacyTokens.length) {
  console.error(`Error: token count mismatch.`);
  console.error(`Unicode tokens: ${unicodeTokens.length}`);
  console.error(`Legacy tokens: ${legacyTokens.length}`);
  process.exit(1);
}

const isVowel = (u) => /[અઆઇઈઉઊઋઌએઐઓઔ]/.test(u);
const isNumeral = (u) => /[૦-૯0-9]/.test(u);
const isMatra = (u) => /[ાિીુૂૃૄેૈૉોૌંઃ્]/.test(u) || u.length > 1 && /[ાિીુૂૃૄેૈૉોૌંઃ્]/.test(u);
const isModifier = (u) => /[ંઃ્ઁ]/.test(u);
const isLeftMatraUnicode = (u) => /[િીૈે]/.test(u);
const isRephUnicode = (u) => /^(ર્|र्)/.test(u);

const mappings = [];
const seenLegacy = new Set();
const leftMatraSymbols = new Set();
const rephSymbols = new Set();

for (let i = 0; i < unicodeTokens.length; i++) {
  const unicode = unicodeTokens[i];
  const legacy = legacyTokens[i];

  if (seenLegacy.has(legacy)) continue;

  let category = 'consonant';
  if (isNumeral(unicode)) category = 'numeral';
  else if (isVowel(unicode)) category = 'vowel';
  else if (isMatra(unicode)) category = 'matra';
  else if (isModifier(unicode) || unicode.length > 1) category = 'conjunct';

  if (isLeftMatraUnicode(unicode)) leftMatraSymbols.add(legacy);
  if (isRephUnicode(unicode)) rephSymbols.add(legacy);

  mappings.push({ legacy, unicode, category });
  seenLegacy.add(legacy);
}

const mergeProfile = options.mergeWith
  ? JSON.parse(fs.readFileSync(path.resolve(process.cwd(), options.mergeWith), 'utf-8'))
  : null;

const existingMappings = Array.isArray(mergeProfile?.mappings) ? mergeProfile.mappings : [];
const mergedMappingMap = new Map(existingMappings.map((m) => [m.legacy, m]));
for (const mapping of mappings) {
  mergedMappingMap.set(mapping.legacy, mapping);
}

const mergedMappings = Array.from(mergedMappingMap.values());

const baseProfile = mergeProfile ?? {
  id: options.id,
  name: options.name,
  script: options.script,
  language: options.language,
  version: '1.0.0',
  author: { name: 'AksharEngine Auto-Generator' },
  isBuiltIn: false,
  reorderingRules: {
    leftMatraSymbols: [],
    rephSymbols: [],
  },
  mappings: [],
};

const outputData = options.profile || options.mergeWith
  ? {
      ...baseProfile,
      id: options.mergeWith ? baseProfile.id : options.id,
      name: options.mergeWith ? baseProfile.name : options.name,
      script: options.mergeWith ? baseProfile.script : options.script,
      language: options.mergeWith ? baseProfile.language : options.language,
      isBuiltIn: false,
      updatedAt: new Date().toISOString(),
      reorderingRules: {
        ...(baseProfile.reorderingRules ?? {}),
        leftMatraSymbols: Array.from(new Set([
          ...((baseProfile.reorderingRules?.leftMatraSymbols) ?? []),
          ...leftMatraSymbols,
        ])),
        rephSymbols: Array.from(new Set([
          ...((baseProfile.reorderingRules?.rephSymbols) ?? []),
          ...rephSymbols,
        ])),
      },
      mappings: mergedMappings,
    }
  : mappings;

const serialized = JSON.stringify(outputData, null, 2);

if (options.output) {
  fs.writeFileSync(path.resolve(process.cwd(), options.output), serialized + '\n', 'utf-8');
  console.log(`Success: wrote ${options.profile || options.mergeWith ? 'profile' : 'mappings'} to ${options.output}`);
} else {
  console.log(serialized);
}
