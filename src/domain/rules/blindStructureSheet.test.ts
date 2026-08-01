import { describe, expect, it } from 'vitest';
import {
  BLIND_SHEET_COLUMNS,
  blindLevelsFromSheetRows,
  blindLevelsToSheetRows,
  createBlindSheetTemplate,
  type SheetCell,
} from './blindStructureSheet';
const HEADER: SheetCell[] = [...BLIND_SHEET_COLUMNS];

describe('blindLevelsFromSheetRows', () => {
  it('parses levels and breaks, numbering play levels only', () => {
    const { levels, errors } = blindLevelsFromSheetRows([
      HEADER,
      ['Level', 1, 100, 200, 0, 20, '', '', ''],
      ['Break', '', '', '', '', 10, '1st', 'Yes', 'Race 1'],
      ['Level', 2, 200, 400, 400, 15, '', '', ''],
    ]);

    expect(errors).toEqual([]);
    expect(levels).toHaveLength(3);
    expect(levels[0]).toMatchObject({
      level: 1,
      smallBlind: 100,
      bigBlind: 200,
      durationSeconds: 1200,
    });
    expect(levels[1]).toMatchObject({
      level: 0,
      isBreak: true,
      durationSeconds: 600,
      breakLabel: '1st',
      chipRace: true,
      chipRaceLabel: 'Race 1',
    });
    // The break does not consume a level number.
    expect(levels[2]).toMatchObject({ level: 2, ante: 400, durationSeconds: 900 });
  });

  it('matches columns by name, so order does not matter', () => {
    const { levels, errors } = blindLevelsFromSheetRows([
      ['Minutes', 'BB', 'Type', 'SB'],
      [20, 200, 'Level', 100],
    ]);
    expect(errors).toEqual([]);
    expect(levels[0]).toMatchObject({ smallBlind: 100, bigBlind: 200, durationSeconds: 1200 });
  });

  it('rejects a sheet missing a required column', () => {
    const { errors } = blindLevelsFromSheetRows([['Type', 'SB', 'BB'], ['Level', 100, 200]]);
    expect(errors).toEqual(['Missing column(s): Minutes.']);
  });

  it('errors when the sheet has a header but no rows', () => {
    expect(blindLevelsFromSheetRows([HEADER]).errors).toEqual([
      'No rows found — the sheet has a header but nothing under it.',
    ]);
  });
});

describe('import cleanup', () => {
  it('trims blank rows off the top and bottom and counts them', () => {
    const blank = ['', '', '', '', '', '', '', '', ''];
    const { levels, errors, trimmedRows } = blindLevelsFromSheetRows([
      HEADER,
      blank,
      ['Level', 1, 100, 200, 0, 20, '', '', ''],
      blank,
      blank,
    ]);
    expect(errors).toEqual([]);
    expect(levels).toHaveLength(1);
    expect(trimmedRows).toBe(3);
  });

  it('keeps a blank row between filled rows as an empty level', () => {
    const { levels, trimmedRows } = blindLevelsFromSheetRows([
      HEADER,
      ['Level', 1, 100, 200, 0, 20, '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['Level', 3, 300, 600, 0, 20, '', '', ''],
    ]);
    expect(trimmedRows).toBe(0);
    expect(levels).toHaveLength(3);
    expect(levels[1]).toMatchObject({
      level: 2,
      isBreak: false,
      smallBlind: 0,
      bigBlind: 0,
      ante: 0,
      durationSeconds: 0,
    });
    // The placeholder still takes a level number, so the row after it is 3.
    expect(levels[2].level).toBe(3);
  });

  it('treats any row that is not a Break as a play level', () => {
    const { levels } = blindLevelsFromSheetRows([
      HEADER,
      ['Dinner', '', 100, 200, 0, 20, '', '', ''],
    ]);
    expect(levels[0]).toMatchObject({ isBreak: false, smallBlind: 100 });
  });

  it('falls back to 0 for blank numbers and empty strings for blank text', () => {
    const { levels } = blindLevelsFromSheetRows([
      HEADER,
      ['Level', '', '', 200, '', '', '', '', ''],
      ['Break', '', '', '', '', '', '', '', ''],
    ]);
    expect(levels[0]).toMatchObject({ smallBlind: 0, bigBlind: 200, ante: 0, durationSeconds: 0 });
    expect(levels[1]).toMatchObject({ durationSeconds: 0, breakLabel: '', chipRaceLabel: '' });
  });

  it('discards values that do not apply to the row type', () => {
    const { levels, errors } = blindLevelsFromSheetRows([
      HEADER,
      // Break fields on a play level, blinds on a break.
      ['Level', 1, 100, 200, 0, 20, 'Dinner', 'Yes', 'Race'],
      ['Break', '', 500, 1000, 100, 10, '1st', 'No', 'Race'],
    ]);
    expect(errors).toEqual([]);
    expect(levels[0]).toMatchObject({ isBreak: false, smallBlind: 100 });
    expect(levels[0]).not.toHaveProperty('breakLabel');
    expect(levels[1]).toMatchObject({
      isBreak: true,
      smallBlind: 0,
      bigBlind: 0,
      ante: 0,
      chipRace: false,
      // Dropped: the break has no chip race.
      chipRaceLabel: '',
    });
  });
});

describe('round trip', () => {
  it('re-imports an exported structure unchanged', () => {
    const original = blindLevelsFromSheetRows(createBlindSheetTemplate()).levels;
    const reimported = blindLevelsFromSheetRows(blindLevelsToSheetRows(original)).levels;
    expect(reimported).toEqual(original);
  });
});
