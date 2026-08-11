#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const profilesDir = path.resolve(process.cwd(), 'public', 'profiles');
const outputFile = path.join(profilesDir, 'index.json');

try {
  const entries = fs
    .readdirSync(profilesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'index.json')
    .map((entry) => `/profiles/${entry.name}`)
    .sort((a, b) => a.localeCompare(b));

  fs.writeFileSync(outputFile, JSON.stringify(entries, null, 2) + '\n', 'utf-8');
  console.log(`Success: wrote ${entries.length} profile paths to public/profiles/index.json`);
} catch (error) {
  console.error(`Execution Error: ${error.message}`);
  process.exit(1);
}
