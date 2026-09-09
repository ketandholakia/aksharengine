import { describe, it, expect } from 'vitest';
import { KeyboardEngine } from './KeyboardEngine';
import type { KeyboardLayout } from '@/types/keyboard.types';
import inscriptDevanagari from '../../public/keyboards/inscript-devanagari.json';

describe('KeyboardEngine', () => {
  const layout = inscriptDevanagari as KeyboardLayout;

  it('inserts plain consonants correctly', () => {
    const engine = new KeyboardEngine({ layout });
    expect(engine.insertGlyph('KeyK', { shift: false, altGr: false })).toBe('क');
    expect(engine.insertGlyph('KeyK', { shift: true, altGr: false })).toBe('ख');
    expect(engine.insertGlyph('KeyI', { shift: false, altGr: false })).toBe('ग');
  });

  it('inserts matras correctly', () => {
    const engine = new KeyboardEngine({ layout });
    expect(engine.insertGlyph('KeyE', { shift: false, altGr: false })).toBe('ा');
    expect(engine.insertGlyph('KeyE', { shift: true, altGr: false })).toBe('आ');
    expect(engine.insertGlyph('KeyF', { shift: false, altGr: false })).toBe('ि');
  });

  it('handles halant based conjuncts manually if simulated by typing sequence', () => {
    const engine = new KeyboardEngine({ layout });
    const sequence = ['KeyV', 'KeyC', 'KeyM', 'KeyD', 'KeyL', 'KeyS']; // न म स ् त े (नमस्ते)
    let output = '';
    for (const code of sequence) {
      output += engine.insertGlyph(code, { shift: false, altGr: false });
    }
    expect(output).toBe('नमस्ते');
  });

  it('handles anusvara/chandrabindu', () => {
    const engine = new KeyboardEngine({ layout });
    expect(engine.insertGlyph('KeyX', { shift: false, altGr: false })).toBe('ं');
    expect(engine.insertGlyph('KeyX', { shift: true, altGr: false })).toBe('ँ');
  });
});
