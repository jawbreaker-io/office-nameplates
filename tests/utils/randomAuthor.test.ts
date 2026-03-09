import { describe, it, expect } from 'vitest';
import { AUTHORS, getRandomAuthor } from '../../src/utils/randomAuthor';

const MAX_CHARS = 20;

describe('AUTHORS list', () => {
  it('contains exactly 50 authors', () => {
    expect(AUTHORS).toHaveLength(50);
  });

  it('every first name is within the character limit', () => {
    for (const [firstName] of AUTHORS) {
      expect(firstName.length, `"${firstName}" exceeds ${MAX_CHARS} chars`).toBeLessThanOrEqual(MAX_CHARS);
    }
  });

  it('every last name is within the character limit', () => {
    for (const [, lastName] of AUTHORS) {
      expect(lastName.length, `"${lastName}" exceeds ${MAX_CHARS} chars`).toBeLessThanOrEqual(MAX_CHARS);
    }
  });

  it('every first name is non-empty', () => {
    for (const [firstName] of AUTHORS) {
      expect(firstName.trim().length, `empty first name found`).toBeGreaterThan(0);
    }
  });

  it('every last name is non-empty', () => {
    for (const [, lastName] of AUTHORS) {
      expect(lastName.trim().length, `empty last name found`).toBeGreaterThan(0);
    }
  });

  it('last names are uppercase', () => {
    for (const [, lastName] of AUTHORS) {
      expect(lastName, `"${lastName}" is not uppercase`).toBe(lastName.toUpperCase());
    }
  });

  it('first names start with an uppercase letter', () => {
    for (const [firstName] of AUTHORS) {
      expect(
        firstName[0],
        `"${firstName}" does not start uppercase`,
      ).toBe(firstName[0].toUpperCase());
    }
  });

  it('has no duplicate entries', () => {
    const keys = AUTHORS.map(([f, l]) => `${f} ${l}`);
    expect(new Set(keys).size).toBe(AUTHORS.length);
  });
});

describe('getRandomAuthor', () => {
  it('returns a [firstName, lastName] tuple from the list', () => {
    const result = getRandomAuthor();
    expect(result).toHaveLength(2);
    expect(AUTHORS).toContainEqual(result);
  });

  it('returns varying results over multiple calls', () => {
    const results = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const [f, l] = getRandomAuthor();
      results.add(`${f} ${l}`);
    }
    // With 50 authors and 100 draws, we should see multiple unique results
    expect(results.size).toBeGreaterThan(1);
  });
});
