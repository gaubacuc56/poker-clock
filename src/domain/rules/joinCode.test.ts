import { describe, expect, it } from 'vitest';
import { generateJoinCode } from './joinCode';

describe('generateJoinCode', () => {
  it('defaults to a 5-character code', () => {
    expect(generateJoinCode()).toHaveLength(5);
  });

  it('respects a custom length', () => {
    expect(generateJoinCode(8)).toHaveLength(8);
  });

  it('only uses unambiguous uppercase letters and digits (no 0/O/1/I/L)', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateJoinCode(20)).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]+$/);
    }
  });
});
