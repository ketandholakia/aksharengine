#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  unicode: null,
  legacy: null,
  output: null,
  id: 'new-font-profile',
  name: 'New Legacy Font',
  script: 'gujarati' // Default to gujarati for your main use case
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-u' || args[i] === '--unicode') options.unicode = args[++i];
  else if (args[i] === '-l' || args[i] === '--legacy') options.legacy = args[++i];
  else if (args[i] === '-o' || args[i] === '--output') options.output = args[++i];
  else if (args[i] === '--id') options.id = args[++i];
  else if (args[i] === '--name') options.name = args[++i];
  else if (args[i] === '--script') options.script = args[++i];
}

if (!options.unicode || !options.legacy || !options.output) {
  console.log(`
અ AksharEngine Profile Generator
------------------------------------------------
Usage: node bin/generate-profile.js -u <master.txt> -l <legacy.txt> -o <output.json>

Options:
  -u, --unicode   Path to the Master Unicode text file
  -l, --legacy    Path to the Legacy Font equivalent text file
  -o, --output    Path to save the generated JSON profile
  --id            Profile ID (e.g., terafont-varun)
  --name          Display Name (e.g., "Terafont Varun")
  --script        Target Script (gujarati, devanagari, bengali)
  `);
  process.exit(1);
}

try {
  // Read and clean the text files
  const readLines = (filePath) => {
    const content = fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf-8');
    return content.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  };

  const uniLines = readLines(options.unicode);
  const legLines = readLines(options.legacy);

  // 1. Line Count Validation
  if (uniLines.length !== legLines.length) {
    console.error(`❌ Error: Line count mismatch!`);
    console.error(`   Unicode file has ${uniLines.length} lines.`);
    console.error(`   Legacy file has ${legLines.length} lines.`);
    process.exit(1);
  }

  const mappings = [];
  const seenLegacyKeys = new Set(); // To prevent duplicate mappings

  // 2. Token-by-Token Alignment
  for (let i = 0; i < uniLines.length; i++) {
    const uTokens = uniLines[i].split(/\s+/);
    const lTokens = legLines[i].split(/\s+/);

    if (uTokens.length !== lTokens.length) {
      console.error(`❌ Error: Token mismatch on Line ${i + 1}`);
      console.error(`   Unicode (${uTokens.length} items): ${uniLines[i]}`);
      console.error(`   Legacy  (${lTokens.length} items): ${legLines[i]}`);
      process.exit(1);
    }

    for (let j = 0; j < uTokens.length; j++) {
      const uChar = uTokens[j];
      const lChar = lTokens[j];

      // Skip if we already mapped this exact legacy sequence (prevents redundant JSON objects)
      if (!seenLegacyKeys.has(lChar)) {
        
        // Basic heuristic categorizer for the JSON readability
        let category = 'consonant';
        if (/[૦-૯०-९0-9]/.test(uChar)) category = 'numeral';
        else if (uChar.length > 1) category = 'conjunct';
        else if (/[ાિીુૂેૈોૌંઃ]/.test(uChar)) category = 'matra';
        else if (/[અઆઇઈઉઊઋએઐઓઔ]/.test(uChar)) category = 'vowel';

        mappings.push({
          legacy: lChar,
          unicode: uChar,
          category: category
        });
        
        seenLegacyKeys.add(lChar);
      }
    }
  }

  // 3. Construct the JSON Profile
  const profileJSON = {
    id: options.id,
    name: options.name,
    script: options.script,
    language: options.script === 'gujarati' ? 'gu' : 'hi',
    version: "1.0.0",
    author: { name: "AksharEngine Auto-Generator" },
    isBuiltIn: false,
    reorderingRules: {
      leftMatraSymbols: [], // These still require manual visual identification
      rephSymbols: []
    },
    mappings: mappings
  };

  // 4. Save to Disk
  fs.writeFileSync(
    path.resolve(process.cwd(), options.output), 
    JSON.stringify(profileJSON, null, 2), 
    'utf-8'
  );

  console.log(`✅ Success! Profile generated at ${options.output}`);
  console.log(`   Mapped ${mappings.length} unique tokens perfectly.`);
  console.log(`   Note: You still need to manually define 'leftMatraSymbols' and 'rephSymbols' in the JSON.`);

} catch (error) {
  console.error(`Execution Error: ${error.message}`);
  process.exit(1);
}
