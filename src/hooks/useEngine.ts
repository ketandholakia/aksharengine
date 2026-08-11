import { useMemo, useCallback } from 'react';
import { ConverterEngine } from '@/engine';
import type { FontProfile } from '@/types/profile.types';
import type { ConversionResult, PipelineState } from '@/types/engine.types';

const defaultResult = (input: string): ConversionResult => ({
  text: input,
  stats: {
    executionTimeMs: 0,
    inputCharCount: input.length,
    outputCharCount: input.length,
    replacementCount: 0,
    unmatched: [],
  },
});

export function useEngine(profile: FontProfile | null) {
  const engine = useMemo(() => {
    return profile ? new ConverterEngine({ profile }) : null;
  }, [profile]);

  const convert = useCallback(
    (input: string): ConversionResult => {
      if (!engine) return defaultResult(input);
      return engine.convert(input);
    },
    [engine]
  );

  const getPipeline = useCallback(
    (input: string): PipelineState[] => {
      if (!engine) return [];
      return engine.getPipeline(input);
    },
    [engine]
  );

  return { convert, getPipeline };
}
