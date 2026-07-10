import { describe, expect, it } from 'vitest';
import { validateRebuyAddOnPrices, validateRebuyCount } from './tournamentValidation';

describe('validateRebuyCount', () => {
  it('allows rebuyCount equal to eliminatedCount', () => {
    expect(validateRebuyCount({ rebuyCount: 2, eliminatedCount: 2 })).toBeNull();
  });

  it('allows rebuyCount below eliminatedCount', () => {
    expect(validateRebuyCount({ rebuyCount: 1, eliminatedCount: 3 })).toBeNull();
  });

  it('rejects rebuyCount above eliminatedCount', () => {
    expect(validateRebuyCount({ rebuyCount: 2, eliminatedCount: 1 })).toMatch(
      /cannot exceed eliminations/,
    );
  });

  it('rejects rebuyCount above eliminatedCount when eliminatedCount is 0', () => {
    expect(validateRebuyCount({ rebuyCount: 1, eliminatedCount: 0 })).toMatch(
      /cannot exceed eliminations/,
    );
  });
});

describe('validateRebuyAddOnPrices', () => {
  it('allows both disabled regardless of price', () => {
    expect(
      validateRebuyAddOnPrices({
        allowRebuy: false,
        rebuyPrice: 0,
        allowAddOn: false,
        addOnPrice: 0,
      }),
    ).toBeNull();
  });

  it('allows a positive rebuy price when rebuys are enabled', () => {
    expect(
      validateRebuyAddOnPrices({
        allowRebuy: true,
        rebuyPrice: 20,
        allowAddOn: false,
        addOnPrice: 0,
      }),
    ).toBeNull();
  });

  it('rejects a zero rebuy price when rebuys are enabled', () => {
    expect(
      validateRebuyAddOnPrices({
        allowRebuy: true,
        rebuyPrice: 0,
        allowAddOn: false,
        addOnPrice: 0,
      }),
    ).toMatch(/Rebuy price is required/);
  });

  it('rejects a negative rebuy price when rebuys are enabled', () => {
    expect(
      validateRebuyAddOnPrices({
        allowRebuy: true,
        rebuyPrice: -5,
        allowAddOn: false,
        addOnPrice: 0,
      }),
    ).toMatch(/Rebuy price is required/);
  });

  it('rejects a zero add-on price when add-ons are enabled', () => {
    expect(
      validateRebuyAddOnPrices({
        allowRebuy: false,
        rebuyPrice: 0,
        allowAddOn: true,
        addOnPrice: 0,
      }),
    ).toMatch(/Add-on price is required/);
  });

  it('allows a positive add-on price when add-ons are enabled', () => {
    expect(
      validateRebuyAddOnPrices({
        allowRebuy: false,
        rebuyPrice: 0,
        allowAddOn: true,
        addOnPrice: 15,
      }),
    ).toBeNull();
  });
});
