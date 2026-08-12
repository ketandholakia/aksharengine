import { describe, it, expect } from 'vitest';
import { PairAlignerAlgorithm } from './PairAlignerAlgorithm';

describe('PairAlignerAlgorithm', () => {
  it('should extract mappings perfectly with one-shot backward compatibility method', () => {
    const legacy = 'k k k K';
    const unicode = 'ક ક ક ખ';
    const results = PairAlignerAlgorithm.extract(legacy, unicode);

    expect(results.length).toBe(2);
    expect(results[0].legacy).toBe('k');
    expect(results[0].unicode).toBe('ક');
    expect(results[0].occurrences).toBe(3);
    
    expect(results[1].legacy).toBe('K');
    expect(results[1].unicode).toBe('ખ');
    expect(results[1].occurrences).toBe(1);
  });

  it('should support the new 2-step alignment process', () => {
    const legacy = 'bad_k K';
    const unicode = 'ક ખ';
    
    // Step 1: Align words
    const pairs = PairAlignerAlgorithm.alignWords(legacy, unicode);
    expect(pairs.length).toBe(2);
    expect(pairs[0].legacy).toBe('bad_k');
    
    // User fixes alignment manually in UI!
    pairs[0].legacy = 'k';
    
    // Step 2: Extract from pairs
    const results = PairAlignerAlgorithm.extractFromPairs(pairs);
    expect(results.length).toBe(2);
    expect(results.find(r => r.legacy === 'k')?.unicode).toBe('ક');
  });

});
