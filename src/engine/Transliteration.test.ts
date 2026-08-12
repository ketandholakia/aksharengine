import { describe, it, expect } from 'vitest';
import { ConverterEngine } from './ConverterEngine';
import fs from 'fs';
import path from 'path';

// Load the generated profile directly
const profilePath = path.join(__dirname, '../../public/profiles/devanagari-gujarati-transliteration.json');
const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));

describe('Script-to-Script Transliteration (Devanagari ↔ Gujarati)', () => {
  it('should transliterate Devanagari to Gujarati (Forward Mode)', () => {
    const engine = new ConverterEngine({
      profile,
      direction: 'forward',
      enableMatraReordering: false, // No structural reordering needed for Standard Unicode to Standard Unicode
      enableRephReordering: false,
    });

    const devanagariText = 'अक्षर'; // A-ksha-ra
    const expectedGujarati = 'અક્ષર';
    
    const result = engine.convert(devanagariText);
    expect(result.text).toBe(expectedGujarati);
  });

  it('should transliterate Gujarati to Devanagari (Reverse Mode)', () => {
    const engine = new ConverterEngine({
      profile,
      direction: 'reverse',
      enableMatraReordering: false,
      enableRephReordering: false,
    });

    const gujaratiText = 'ગુજરાતી'; // gu-ja-ra-ti
    const expectedDevanagari = 'गुजराती';
    
    const result = engine.convert(gujaratiText);
    expect(result.text).toBe(expectedDevanagari);
  });
});
