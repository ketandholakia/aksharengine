#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { ConverterEngine } from '../dist-lib/akshar-engine.es.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const options = {
  input: null,
  text: null,
  stdin: false,
  output: null,
  profile: null,
  help: false,
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-i' || args[i] === '--input') options.input = args[++i];
  else if (args[i] === '--text') options.text = args[++i];
  else if (args[i] === '--stdin') options.stdin = true;
  else if (args[i] === '-o' || args[i] === '--output') options.output = args[++i];
  else if (args[i] === '-p' || args[i] === '--profile') options.profile = args[++i];
  else if (args[i] === '-h' || args[i] === '--help') options.help = true;
}

const usage = `
AksharEngine CLI
------------------------------------------------
Usage:
  akshar -i <input.txt> -p <profile.json> [-o <output.txt>]
  akshar --text "legacy text" -p <profile.json> [-o <output.txt>]
  echo "legacy text" | akshar --stdin -p <profile.json> [-o <output.txt>]

Options:
  -i, --input     Path to the legacy text file
      --text      Legacy text provided directly on the command line
      --stdin     Read legacy text from standard input
  -p, --profile   Path to the font mapping JSON profile (Required)
  -o, --output    Path to save the converted Unicode file (Optional, defaults to stdout)
  -h, --help      Display this help menu

Example:
  akshar -i legacy_document.txt -p krutidev-010.json -o converted.txt
  akshar --text "legacy text" -p krutidev-010.json
`;

if (options.help || args.length === 0) {
  console.log(usage);
  process.exit(0);
}

if (!options.input && !options.text && !options.stdin) {
  console.error('Error: Provide -i, --text, or --stdin.');
  process.exit(1);
}

if (!options.profile) {
  console.error('Error: Profile JSON file (-p) is required.');
  process.exit(1);
}

try {
  let rawText = '';
  if (options.text) {
    rawText = options.text;
  } else if (options.stdin) {
    rawText = fs.readFileSync(0, 'utf-8');
  } else {
    const inputPath = path.resolve(process.cwd(), options.input);
    rawText = fs.readFileSync(inputPath, 'utf-8');
  }

  const profilePath = path.resolve(process.cwd(), options.profile);
  const profileData = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));

  const engine = new ConverterEngine({ profile: profileData });
  const result = engine.convert(rawText);

  if (options.output) {
    const outputPath = path.resolve(process.cwd(), options.output);
    fs.writeFileSync(outputPath, result.text, 'utf-8');
    console.log(`✓ Conversion complete! Saved to ${options.output}`);
    console.log(`  Stats: ${result.stats.executionTimeMs}ms • ${result.stats.replacementCount} replacements`);
  } else {
    console.log(result.text);
  }
} catch (error) {
  console.error(`Execution Error: ${error.message}`);
  process.exit(1);
}
