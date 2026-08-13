import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ConverterEngine } from './ConverterEngine';
import type { FontProfile } from '../types/profile.types';

function loadProfile(name: string): FontProfile {
  const url = new URL(`../../public/profiles/${name}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, 'utf8')) as FontProfile;
}

function convert(profile: FontProfile, text: string): string {
  return new ConverterEngine({ profile }).convert(text).text;
}

describe('Nudi (Kannada) profile', () => {
  const profile = loadProfile('nudi');

  it('converts the canonical vector "PÀ£ÀßqÀ" to "ಕನ್ನಡ"', () => {
    expect(convert(profile, 'PÀ£ÀßqÀ')).toBe('ಕನ್ನಡ');
  });

  it('handles vattaksharagalu (subscript consonants)', () => {
    // ß = vattu ನ: PÀ£Àß = ಕನ್ನ
    expect(convert(profile, 'PÀ£ÀßqÀ')).toBe('ಕನ್ನಡ');
    // Arkavattu ð -> ರ್ before the base letter (reference a2u_old.js).
    expect(convert(profile, 'PÀð')).toBe('ರ್ಕ');
    // Arkavattu after a dependent vowel rearranges: ಕೆ + ð -> ರ್ + ಕೆ
    expect(convert(profile, 'PÉð')).toBe('ರ್ಕೆ');
  });

  it('passes numerals through unchanged (digits are native in Nudi)', () => {
    expect(convert(profile, '0123456789')).toBe('0123456789');
  });
});

describe('SutonnyMJ (Bengali) profile', () => {
  const profile = loadProfile('sutonnymj');

  it('converts canonical Bijoy vectors', () => {
    expect(convert(profile, 'Avgvi')).toBe('আমার');
    expect(convert(profile, 'evsjv‡`k')).toBe('বাংলাদেশ');
  });

  it('moves pre-kars after the consonant cluster', () => {
    expect(convert(profile, '‡Kv')).toBe('কো');
    expect(convert(profile, 'wK')).toBe('কি');
    expect(convert(profile, '‡³')).toBe('ক্তে');
  });

  it('moves the reph (©) before its cluster', () => {
    expect(convert(profile, 'K©')).toBe('র্ক');
    expect(convert(profile, '†K©')).toBe('র্কে');
  });

  it('fixes the independent vowel আ and digit-colon artifacts', () => {
    expect(convert(profile, 'Av')).toBe('আ');
    expect(convert(profile, 'Av' + '‡Kv')).toBe('আ' + 'কো');
    expect(convert(profile, '1ঃ2')).toBe('১:২');
  });

  it('maps Bengali numerals', () => {
    expect(convert(profile, '123')).toBe('১২৩');
  });
});

describe('Bamini (Tamil) profile', () => {
  const profile = loadProfile('bamini');

  it('converts canonical Bamini vectors', () => {
    expect(convert(profile, 'jkpo;')).toBe('தமிழ்');
    expect(convert(profile, 'jkpo; xU nrk;nkhop')).toBe('தமிழ் ஒரு செம்மொழி');
  });

  it('handles precomposed o/oo/au syllables', () => {
    expect(convert(profile, 'nfh')).toBe('கொ');
    expect(convert(profile, 'Nfh')).toBe('கோ');
    expect(convert(profile, 'nfs')).toBe('கௌ');
  });

  it('handles short-u special forms and pulli', () => {
    expect(convert(profile, 'F')).toBe('கு');
    expect(convert(profile, 'f;')).toBe('க்');
    expect(convert(profile, '$')).toBe('கூ');
  });

  it('is exactly reversible for unambiguous text', () => {
    const reverse = (text: string) =>
      new ConverterEngine({ profile, direction: 'reverse' }).convert(text).text;
    expect(reverse('தமிழ்')).toBe('jkpo;');
    expect(reverse('கொ')).toBe('nfh');
    expect(reverse('கௌ')).toBe('nfs');
  });

  it('collapses the "*" collision to ஙு (reference order)', () => {
    expect(convert(profile, '*')).toBe('ஙு');
  });
});