#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import the compiled engine (ensure you've run `npm run build:lib` first)
import { ConverterEngine } from '../dist-lib/akshar-engine.es.js';

// Setup file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple argument parser
const args = process.argv.slice(2);
const options = {
  input: null,
  output: null,
  profile: null,
  help: false,
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-i' || args[i] === '--input') options.input = args[++i];
  else if (args[i] === '-o' || args[i] === '--output') options.output = args[++i];
  else if (args[i] === '-p' || args[i] === '--profile') options.profile = args[++i];
  else if (args[i] === '-h' || args[i] === '--help') options.help = true;
}

// Help Menu
if (options.help || args.length === 0) {
  console.log(`
અ AksharEngine CLI 
------------------------------------------------
Usage: akshar -i <input.txt> -p <profile.json> [-o <output.txt>]

Options:
  -i, --input     Path to the legacy text file (Required)
  -p, --profile   Path to the font mapping JSON profile (Required)
  -o, --output    Path to save the converted Unicode file (Optional, defaults to stdout)
  -h, --help      Display this help menu

Example:
  akshar -i legacy_document.txt -p krutidev-010.json -o converted.txt
  `);
  process.exit(0);
}

// Validation
if (!options.input) {
  console.error('Error: Input file (-i) is required.');
  process.exit(1);
}
if (!options.profile) {
  console.error('Error: Profile JSON file (-p) is required.');
  process.exit(1);
}

try {
  // 1. Read input text
  const inputPath = path.resolve(process.cwd(), options.input);
  const rawText = fs.readFileSync(inputPath, 'utf-8');

  // 2. Read and parse the JSON profile
  const profilePath = path.resolve(process.cwd(), options.profile);
  const profileData = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));

  // 3. Instantiate Engine and Convert
  const engine = new ConverterEngine({ profile: profileData });
  const result = engine.convert(rawText);

  // 4. Output the result
  if (options.output) {
    const outputPath = path.resolve(process.cwd(), options.output);
    fs.writeFileSync(outputPath, result.text, 'utf-8');
    console.log(`✓ Conversion complete! Saved to ${options.output}`);
    console.log(`  Stats: ${result.stats.executionTimeMs}ms • ${result.stats.replacementCount} replacements`);
  } else {
    // If no output file is specified, print directly to the terminal (useful for piping in bash)
    console.log(result.text);
  }

} catch (error) {
  console.error(`Execution Error: ${error.message}`);
  process.exit(1);
}
