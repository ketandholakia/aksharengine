import React, { useState, useEffect, useCallback } from 'react';
import type { MouseEvent } from 'react';
import type { KeyboardLayout } from '@/types/keyboard.types';
import { KeyboardEngine } from '@/engine/KeyboardEngine';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import type { ReorderingRules } from '@/types/profile.types';

interface VirtualKeyboardProps {
  layout: KeyboardLayout;
  targetRef: React.RefObject<HTMLTextAreaElement | null>;
  reorderingRules?: ReorderingRules;
}

const keyRows = [
  ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'],
  ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight'],
  ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'],
  ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash']
];

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ layout, targetRef, reorderingRules }) => {
  const [shiftActive, setShiftActive] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const keyboardRef = React.useRef<HTMLDivElement>(null);

  const engine = new KeyboardEngine({ layout, reorderingRules });

  const exportPDF = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!keyboardRef.current) return;
    try {
      const imgData = await toPng(keyboardRef.current, {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#f1f5f9',
        cacheBust: true,
      });
      
      const width = Math.max(keyboardRef.current.offsetWidth, 100);
      const height = Math.max(keyboardRef.current.offsetHeight, 100);
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [width, height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`${layout.id}-layout.pdf`);
    } catch (err) {
      console.error('Failed to export PDF', err);
      alert('Failed to generate PDF. See console for details.');
    }
  };

  const handleShiftToggle = (e?: MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShiftActive(prev => !prev);
  };

  const insertTextAtCursor = useCallback((text: string) => {
    const el = targetRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentValue = el.value;

    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    el.value = newValue;
    
    // Dispatch an input event to notify any listeners (like React's onChange)
    const event = new Event('input', { bubbles: true });
    el.dispatchEvent(event);

    el.selectionStart = el.selectionEnd = start + text.length;
  }, [targetRef]);

  const handleKeyClick = useCallback((e: React.PointerEvent | React.MouseEvent, code: string) => {
    e.preventDefault(); // prevent losing focus
    
    // Simulate key press for basic special keys
    if (code === 'Backspace') {
      const el = targetRef.current;
      if (el && el.selectionStart > 0) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const currentValue = el.value;
        if (start === end) {
           el.value = currentValue.substring(0, start - 1) + currentValue.substring(end);
           el.selectionStart = el.selectionEnd = start - 1;
        } else {
           el.value = currentValue.substring(0, start) + currentValue.substring(end);
           el.selectionStart = el.selectionEnd = start;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return;
    }
    if (code === 'Enter') {
      insertTextAtCursor('\n');
      return;
    }
    if (code === 'Space') {
      insertTextAtCursor(' ');
      return;
    }

    const glyph = engine.insertGlyph(code, { shift: shiftActive, altGr: false });
    if (glyph) {
      insertTextAtCursor(glyph);
    }
    
    // Flash key visual state
    setActiveKey(code);
    setTimeout(() => setActiveKey(null), 100);
  }, [engine, shiftActive, insertTextAtCursor, targetRef]);

  // Sync with physical keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftActive(true);
      } else {
        const code = e.code;
        setActiveKey(code);
        
        // If the event target is the textarea, we intercept if we have a mapping
        if (e.target === targetRef.current) {
           const glyph = engine.insertGlyph(code, { shift: e.shiftKey, altGr: e.getModifierState('AltGraph') });
           if (glyph) {
             e.preventDefault();
             insertTextAtCursor(glyph);
           }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftActive(false);
      }
      setActiveKey(null);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, [engine, targetRef, insertTextAtCursor]);

  const renderKey = (code: string, extraClasses = '') => {
    const keyDef = layout.keys.find(k => k.code === code);
    
    const displayBase = keyDef ? keyDef.base : '';
    const displayShift = keyDef && keyDef.shift ? keyDef.shift : '';
    
    const isPressed = activeKey === code;

    let engChar = '';
    if (code.startsWith('Key')) engChar = code.substring(3);
    else if (code.startsWith('Digit')) engChar = code.substring(5);
    else if (code === 'Minus') engChar = '-';
    else if (code === 'Equal') engChar = '=';
    else if (code === 'BracketLeft') engChar = '[';
    else if (code === 'BracketRight') engChar = ']';
    else if (code === 'Semicolon') engChar = ';';
    else if (code === 'Quote') engChar = "'";
    else if (code === 'Comma') engChar = ',';
    else if (code === 'Period') engChar = '.';
    else if (code === 'Slash') engChar = '/';

    return (
      <button
        key={code}
        onPointerDown={(e) => handleKeyClick(e, code)}
        className={`relative flex flex-col items-center justify-center border border-slate-300 dark:border-slate-600 rounded select-none min-h-[44px] transition-colors
          ${isPressed ? 'bg-slate-200 dark:bg-slate-600' : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'}
          ${extraClasses}`}
      >
        {engChar && (
          <span className="absolute top-0.5 left-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
            {engChar}
          </span>
        )}
        <span className="absolute top-0.5 right-1.5 text-xs text-slate-500 dark:text-slate-400">{displayShift}</span>
        <span className={`text-base font-medium mt-3 ${shiftActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-800 dark:text-slate-200'}`}>
          {shiftActive && displayShift ? displayShift : displayBase}
        </span>
      </button>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-slate-100 dark:bg-slate-900 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700 relative">
      <div className="absolute top-2 right-2 z-10">
        <button
          type="button"
          onClick={exportPDF}
          className="text-[10px] sm:text-xs font-semibold px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          Export PDF
        </button>
      </div>
      <div ref={keyboardRef} className="flex flex-col gap-1.5 pt-6 pb-2 px-2 bg-slate-100 dark:bg-slate-900 rounded-lg">
        {/* Row 1: Digits */}
        <div className="flex gap-1.5 justify-center">
          {keyRows[0].map(code => renderKey(code, 'w-10 sm:w-12'))}
          <button 
            onPointerDown={(e) => handleKeyClick(e, 'Backspace')}
            className={`w-16 sm:w-20 border border-slate-300 dark:border-slate-600 rounded bg-slate-200 dark:bg-slate-700 text-sm font-semibold flex items-center justify-center transition-colors ${activeKey === 'Backspace' ? 'bg-slate-300 dark:bg-slate-600' : ''}`}
          >
            Bksp
          </button>
        </div>
        
        {/* Row 2: QWERTY... */}
        <div className="flex gap-1.5 justify-center">
          <div className="w-12 sm:w-16 border border-slate-300 dark:border-slate-600 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm">Tab</div>
          {keyRows[1].map(code => renderKey(code, 'w-10 sm:w-12'))}
        </div>

        {/* Row 3: ASDF... */}
        <div className="flex gap-1.5 justify-center">
          <div className="w-16 sm:w-20 border border-slate-300 dark:border-slate-600 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm">Caps</div>
          {keyRows[2].map(code => renderKey(code, 'w-10 sm:w-12'))}
          <button 
            onPointerDown={(e) => handleKeyClick(e, 'Enter')}
            className={`w-16 sm:w-20 border border-slate-300 dark:border-slate-600 rounded bg-slate-200 dark:bg-slate-700 text-sm font-semibold flex items-center justify-center transition-colors ${activeKey === 'Enter' ? 'bg-slate-300 dark:bg-slate-600' : ''}`}
          >
            Enter
          </button>
        </div>

        {/* Row 4: ZXCV... */}
        <div className="flex gap-1.5 justify-center">
          <button 
            onPointerDown={(e) => { e.preventDefault(); handleShiftToggle(e); }}
            className={`w-20 sm:w-24 border border-slate-300 dark:border-slate-600 rounded flex items-center justify-center text-sm font-semibold transition-colors
              ${shiftActive || activeKey === 'ShiftLeft' ? 'bg-brand-500 text-white border-brand-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}
            `}
          >
            Shift
          </button>
          {keyRows[3].map(code => renderKey(code, 'w-10 sm:w-12'))}
          <button 
            onPointerDown={(e) => { e.preventDefault(); handleShiftToggle(e); }}
            className={`w-20 sm:w-24 border border-slate-300 dark:border-slate-600 rounded flex items-center justify-center text-sm font-semibold transition-colors
              ${shiftActive || activeKey === 'ShiftRight' ? 'bg-brand-500 text-white border-brand-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}
            `}
          >
            Shift
          </button>
        </div>

        {/* Row 5: Spacebar */}
        <div className="flex gap-1.5 justify-center">
          <button 
            onPointerDown={(e) => handleKeyClick(e, 'Space')}
            className={`w-64 sm:w-96 min-h-[44px] border border-slate-300 dark:border-slate-600 rounded transition-colors ${activeKey === 'Space' ? 'bg-slate-300 dark:bg-slate-600' : 'bg-white dark:bg-slate-800'}`}
          />
        </div>
      </div>
    </div>
  );
};
