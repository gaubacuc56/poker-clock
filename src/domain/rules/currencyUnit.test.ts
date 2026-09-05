import { describe, expect, it } from 'vitest';
import {
  normalizeUnitCode,
  sortUnits,
  UNIT_CODE_MAX_LENGTH,
  validateUnitCode,
} from './currencyUnit';
import type { Currency } from '../entities';

const STANDARD: Currency[] = [
  { id: '1', code: 'VND', label: 'VND' },
  { id: '2', code: 'USD', label: 'USD' },
];

const OWN: Currency = { id: '3', code: 'CHIPS', label: 'Chips', ownerId: 'me' };

describe('normalizeUnitCode', () => {
  it('uppercases and trims what the organiser typed', () => {
    expect(normalizeUnitCode('  chips ')).toBe('CHIPS');
  });

  it('truncates rather than rejecting an over-long code', () => {
    expect(normalizeUnitCode('a'.repeat(20))).toHaveLength(UNIT_CODE_MAX_LENGTH);
  });

  it('is empty for a blank field', () => {
    expect(normalizeUnitCode('   ')).toBe('');
  });
});

describe('validateUnitCode', () => {
  it('accepts a code nothing else is using', () => {
    expect(validateUnitCode('tickets', [...STANDARD, OWN])).toBeNull();
  });

  it('asks for something to be typed', () => {
    expect(validateUnitCode('  ', STANDARD)).toBe('Enter a unit name.');
  });

  it('refuses anything but letters and digits', () => {
    expect(validateUnitCode('my chips', STANDARD)).toBe('Use letters and digits only.');
    expect(validateUnitCode('€', STANDARD)).toBe('Use letters and digits only.');
  });

  it('refuses to shadow a standard unit, and says which kind of clash it is', () => {
    expect(validateUnitCode('usd', STANDARD)).toBe('USD is a standard unit.');
  });

  it('refuses a duplicate of the account’s own', () => {
    expect(validateUnitCode('chips', [...STANDARD, OWN])).toBe(
      'You already have a unit called CHIPS.',
    );
  });
});

describe('sortUnits', () => {
  it('puts the standard units first, then the account’s own, each alphabetical', () => {
    const units: Currency[] = [
      OWN,
      { id: '4', code: 'BEANS', label: 'Beans', ownerId: 'me' },
      ...STANDARD,
    ];
    expect(sortUnits(units).map((unit) => unit.code)).toEqual(['USD', 'VND', 'BEANS', 'CHIPS']);
  });

  it('leaves the caller’s array alone', () => {
    const units = [...STANDARD];
    sortUnits(units);
    expect(units.map((unit) => unit.code)).toEqual(['VND', 'USD']);
  });
});
