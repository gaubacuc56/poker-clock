import { describe, expect, it } from 'vitest';
import { fromCents, toCents } from './money';

describe('toCents', () => {
  it('converts a plain amount to hundredths', () => {
    expect(toCents(20)).toBe(2000);
  });

  it('rounds to the nearest cent', () => {
    expect(toCents(19.999)).toBe(2000);
  });

  it('handles zero', () => {
    expect(toCents(0)).toBe(0);
  });
});

describe('fromCents', () => {
  it('converts hundredths back to a plain amount', () => {
    expect(fromCents(2000)).toBe(20);
  });

  it('handles zero', () => {
    expect(fromCents(0)).toBe(0);
  });

  it('round-trips with toCents', () => {
    expect(fromCents(toCents(19.5))).toBe(19.5);
  });
});
