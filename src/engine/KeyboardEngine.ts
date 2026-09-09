import type { KeyboardLayout } from '@/types/keyboard.types';
import type { ReorderingRules } from '@/types/profile.types';
import { applyReorderRules } from './ReorderRules';

export class KeyboardEngine {
  private layout: KeyboardLayout;
  private reorderingRules?: ReorderingRules;

  constructor(options: { layout: KeyboardLayout; reorderingRules?: ReorderingRules }) {
    this.layout = options.layout;
    this.reorderingRules = options.reorderingRules;
  }

  public insertGlyph(code: string, modifiers: { shift: boolean; altGr: boolean }): string {
    const key = this.layout.keys.find(k => k.code === code);
    if (!key) return '';

    let glyph = modifiers.shift && key.shift !== null ? key.shift : key.base;
    
    if (this.reorderingRules) {
      const reorderResult = applyReorderRules({
        text: glyph,
        rules: this.reorderingRules,
        enableMatraReordering: true,
        enableRephReordering: true,
      });
      return reorderResult.text;
    }

    return glyph;
  }
}
