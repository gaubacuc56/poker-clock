import { describe, expect, it } from 'vitest';
import { getEntryPriceLines } from './entryPricing';

describe('getEntryPriceLines', () => {
  it('shows only Buyin when rebuys and add-ons are disabled', () => {
    expect(
      getEntryPriceLines({
        buyIn: 2000,
        allowRebuy: false,
        rebuyPrice: undefined,
        allowAddOn: false,
        addOnPrice: undefined,
      }),
    ).toEqual([{ label: 'Buyin', amountCents: 2000 }]);
  });

  it('adds Rebuy when allowed, using its own price', () => {
    expect(
      getEntryPriceLines({
        buyIn: 2000,
        allowRebuy: true,
        rebuyPrice: 1500,
        allowAddOn: false,
        addOnPrice: undefined,
      }),
    ).toEqual([
      { label: 'Buyin', amountCents: 2000 },
      { label: 'Rebuy', amountCents: 1500 },
    ]);
  });

  it('falls back to the buy-in price when rebuy is allowed but has no own price', () => {
    expect(
      getEntryPriceLines({
        buyIn: 2000,
        allowRebuy: true,
        rebuyPrice: undefined,
        allowAddOn: false,
        addOnPrice: undefined,
      }),
    ).toEqual([
      { label: 'Buyin', amountCents: 2000 },
      { label: 'Rebuy', amountCents: 2000 },
    ]);
  });

  it('adds Addons when allowed, using its own price', () => {
    expect(
      getEntryPriceLines({
        buyIn: 2000,
        allowRebuy: false,
        rebuyPrice: undefined,
        allowAddOn: true,
        addOnPrice: 1000,
      }),
    ).toEqual([
      { label: 'Buyin', amountCents: 2000 },
      { label: 'Addons', amountCents: 1000 },
    ]);
  });

  it('shows all three in order when both are allowed', () => {
    expect(
      getEntryPriceLines({
        buyIn: 2000,
        allowRebuy: true,
        rebuyPrice: 1500,
        allowAddOn: true,
        addOnPrice: 1000,
      }),
    ).toEqual([
      { label: 'Buyin', amountCents: 2000 },
      { label: 'Rebuy', amountCents: 1500 },
      { label: 'Addons', amountCents: 1000 },
    ]);
  });
});
