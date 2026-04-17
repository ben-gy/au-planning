import { describe, expect, it } from 'vitest';
import { lookupTerm, getAllTerms, searchGlossary } from '../src/glossary';

describe('lookupTerm', () => {
  it('finds DA term', () => {
    const entry = lookupTerm('da');
    expect(entry).toBeDefined();
    expect(entry?.term).toBe('Development Application');
    expect(entry?.abbr).toBe('DA');
  });

  it('finds VicSmart', () => {
    const entry = lookupTerm('vicsmart');
    expect(entry).toBeDefined();
    expect(entry?.term).toBe('VicSmart');
  });

  it('returns undefined for unknown term', () => {
    expect(lookupTerm('nonexistent')).toBeUndefined();
  });

  it('finds subdivision', () => {
    const entry = lookupTerm('subdivision');
    expect(entry).toBeDefined();
    expect(entry?.definition).toContain('land');
  });
});

describe('getAllTerms', () => {
  it('returns all terms sorted alphabetically', () => {
    const terms = getAllTerms();
    expect(terms.length).toBeGreaterThan(10);
    for (let i = 1; i < terms.length; i++) {
      expect(terms[i].term.localeCompare(terms[i - 1].term)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('searchGlossary', () => {
  it('finds terms by name', () => {
    const results = searchGlossary('VicSmart');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].term).toBe('VicSmart');
  });

  it('finds terms by abbreviation', () => {
    const results = searchGlossary('DA');
    expect(results.some(r => r.abbr === 'DA')).toBe(true);
  });

  it('finds terms by definition keyword', () => {
    const results = searchGlossary('council');
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty for no match', () => {
    const results = searchGlossary('xyznonexistent');
    expect(results.length).toBe(0);
  });

  it('is case insensitive', () => {
    const results = searchGlossary('vicsmart');
    expect(results.length).toBeGreaterThan(0);
  });
});
