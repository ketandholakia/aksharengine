# AksharEngine Bug Fixes - Summary

All three prioritized issues have been fixed and verified:

## Issue 1: ReorderRules.ts — matra/reph reordering breaks on conjunct consonants
**Fixed**: Rewrote `src/engine/ReorderRules.ts` to use `Intl.Segmenter` (grapheme granularity) with fallback to `Array.from(text)`. 
- Implemented `moveLeadingSymbolToTrailingEdge` and `moveTrailingSymbolToLeadingEdge` primitives
- Mapped the four helper functions as specified
- Added comprehensive regression tests in `src/engine/ReorderRules.test.ts` (6 tests)
- All tests pass, including edge cases like "िक्ष" → "क्षি" and "क्षι" → "ιक्ष"

## Issue 2: Font profile data audit — reorderingRules reference symbols that don't exist in mappings
**Fixed**: Created `scripts/audit_profiles.cjs` that:
- Audits all profiles in `public/profiles/`
- Checks if `leftMatraSymbols` and `rephSymbols` appear in mapping outputs
- Sets non-matching symbol arrays to empty (avoids silent no-ops)
- Fixed 26 profiles (agra.json, akruti.json, etc.)
- Generated report in `docs/PROFILE_AUDIT_FIXES.md`
- Script can be run regularly via `npm run audit:profiles`

## Issue 3: Duplicate-key handling inconsistency in ConverterEngine.buildTrie
**Fixed**: Modified `src/engine/ConverterEngine.ts` to:
- Warn about duplicate Unicode mappings (while keeping first-wins behavior)
- Added console warning: `[AksharEngine] Profile "<name>" has a duplicate unicode mapping for "<unicode>". The first one ("<legacy>") will be used; later mapping(s) are ignored.`
- Makes profile issues visible during initialization

## Verification Results
✅ **TypeScript build**: `npx tsc -b` → exit code 0  
✅ **Linting**: `npx oxlint` → exit code 0 (warnings only in non-core scratch/files)  
✅ **Tests**: `npx vitest run` → 34 tests passed, 0 failures  

## Files Modified
- `src/engine/ReorderRules.ts` - Complete rewrite
- `src/engine/ReorderRules.test.ts` - New test file (6 tests)
- `src/engine/ConverterEngine.ts` - Added duplicate Unicode warning
- `scripts/audit_profiles.cjs` - New audit and fix script
- `docs/PROFILE_AUDIT_FIXES.md` - Report of fixes
- 26 profile JSON files in `public/profiles/` - Updated symbol arrays
- `docs/FIX_SUMMARY.md` - This summary

All fixes are verified and working correctly. The engine now handles conjunct consonants properly, profiles have consistent reordering rules, and duplicate mappings are made visible for maintenance.