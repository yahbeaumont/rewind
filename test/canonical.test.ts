import { describe, expect, it } from 'vitest';
import { canonical, pick } from '../src/tape/canonical.js';

describe('canonical', () => {
  it('sorts keys regardless of insertion order', () => {
    expect(canonical({ b: 1, a: 2 })).toBe(canonical({ a: 2, b: 1 }));
  });

  it('keeps array order', () => {
    expect(canonical([1, 2])).not.toBe(canonical([2, 1]));
  });

  it('omits undefined values', () => {
    expect(canonical({ a: 1, b: undefined })).toBe('{"a":1}');
  });

  it('nests deterministically', () => {
    expect(canonical({ x: { d: 1, c: 2 } })).toBe('{"x":{"c":2,"d":1}}');
  });

  it('picks only the requested keys', () => {
    expect(pick({ a: 1, b: 2 }, ['a'])).toEqual({ a: 1 });
  });
});
