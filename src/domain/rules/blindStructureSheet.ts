import type { BlindLevel } from '../entities';
import {
  DEFAULT_BREAK_DURATION_SECONDS,
  DEFAULT_LEVEL_DURATION_SECONDS,
  renumberLevels,
} from './blindStructureEditor';
import { minutesToSeconds, secondsToMinutes } from './duration';

/**
 * The spreadsheet exchange format for a blind structure. The domain owns the
 * column contract and every rule about what may appear where; the application
 * layer only turns these rows into an .xlsx (with the matching dropdowns and
 * cell validation) and back.
 *
 * Every field the manual editor exposes has a column, so a structure round
 * trips: export, edit in Excel, import, and get the same levels back.
 */
export type SheetCell = string | number;

export const BLIND_SHEET_NAME = 'Blind Structure';

export const COLUMN_TYPE = 'Type';
export const COLUMN_LEVEL = 'Level';
export const COLUMN_SMALL_BLIND = 'SB';
export const COLUMN_BIG_BLIND = 'BB';
export const COLUMN_ANTE = 'Ante';
export const COLUMN_MINUTES = 'Minutes';
export const COLUMN_BREAK_TITLE = 'Break Title';
export const COLUMN_CHIP_RACE = 'Chip Race';
export const COLUMN_CHIP_RACE_TITLE = 'Chip Race Title';

export const BLIND_SHEET_COLUMNS = [
  COLUMN_TYPE,
  COLUMN_LEVEL,
  COLUMN_SMALL_BLIND,
  COLUMN_BIG_BLIND,
  COLUMN_ANTE,
  COLUMN_MINUTES,
  COLUMN_BREAK_TITLE,
  COLUMN_CHIP_RACE,
  COLUMN_CHIP_RACE_TITLE,
] as const;

/** Columns that only mean something on a play level; blank on a break. */
export const LEVEL_ONLY_COLUMNS = [COLUMN_SMALL_BLIND, COLUMN_BIG_BLIND, COLUMN_ANTE];
/** Columns that only mean something on a break; blank on a play level. */
export const BREAK_ONLY_COLUMNS = [
  COLUMN_BREAK_TITLE,
  COLUMN_CHIP_RACE,
  COLUMN_CHIP_RACE_TITLE,
];

export const TYPE_LEVEL = 'Level';
export const TYPE_BREAK = 'Break';
/** The only two values the Type dropdown offers. */
export const TYPE_OPTIONS = [TYPE_LEVEL, TYPE_BREAK] as const;

export const YES = 'Yes';
export const NO = 'No';
/** The only two values the Chip Race dropdown offers. */
export const YES_NO_OPTIONS = [YES, NO] as const;

export const DEFAULT_LEVEL_MINUTES = secondsToMinutes(DEFAULT_LEVEL_DURATION_SECONDS);
export const DEFAULT_BREAK_MINUTES = secondsToMinutes(DEFAULT_BREAK_DURATION_SECONDS);

/** Example rows for the template — two levels, a break with a chip race, one more level. */
export function createBlindSheetTemplate(): SheetCell[][] {
  return [
    [...BLIND_SHEET_COLUMNS],
    [TYPE_LEVEL, 1, 100, 200, 0, DEFAULT_LEVEL_MINUTES, '', '', ''],
    [TYPE_LEVEL, 2, 200, 400, 400, DEFAULT_LEVEL_MINUTES, '', '', ''],
    [TYPE_BREAK, '', '', '', '', DEFAULT_BREAK_MINUTES, '1st', YES, '1st'],
    [TYPE_LEVEL, 3, 300, 600, 600, DEFAULT_LEVEL_MINUTES, '', '', ''],
  ];
}

/** A structure as sheet rows, header included — the export side of the format. */
export function blindLevelsToSheetRows(levels: BlindLevel[]): SheetCell[][] {
  return [
    [...BLIND_SHEET_COLUMNS],
    ...levels.map((level) =>
      level.isBreak
        ? [
            TYPE_BREAK,
            '',
            '',
            '',
            '',
            secondsToMinutes(level.durationSeconds),
            level.breakLabel ?? '',
            level.chipRace ? YES : NO,
            (level.chipRace && level.chipRaceLabel) || '',
          ]
        : [
            TYPE_LEVEL,
            level.level,
            level.smallBlind,
            level.bigBlind,
            level.ante,
            secondsToMinutes(level.durationSeconds),
            '',
            '',
            '',
          ],
    ),
  ];
}

export interface BlindSheetParseResult {
  /** Renumbered and ready to use. Empty when `errors` is non-empty. */
  levels: BlindLevel[];
  /** Problems that stop the import outright — a wrong file, or nothing usable in it. */
  errors: string[];
  /** How many blank rows were trimmed off the bottom of the sheet. */
  trimmedRows: number;
}

/**
 * Parses sheet rows back into levels, cleaning the file up rather than refusing
 * it. The spreadsheet's own dropdowns and cell validation are where mistakes
 * get caught while typing; by the time a file is imported, the useful behaviour
 * is to take what's there.
 *
 * The cleanup rules:
 * - Blank rows at the bottom are the unused part of the template, so they're
 *   trimmed. A blank row *between* filled rows is a row the author meant to
 *   keep, so it's imported as an empty play level for them to fill in.
 * - Blank number cells become 0, blank text cells become ''.
 * - A row is a break only when Type says so; anything else is a play level.
 * - Values in columns that don't apply to the row's type are discarded (a break
 *   title on a play level, blinds on a break).
 *
 * Columns are matched by header name, so their order doesn't matter, and the
 * Level column is ignored since numbering is derived.
 */
export function blindLevelsFromSheetRows(rows: SheetCell[][]): BlindSheetParseResult {
  const [header, ...body] = rows;
  if (!header) return { levels: [], errors: ['The sheet is empty.'], trimmedRows: 0 };

  const columns = indexColumns(header);
  const missing = [COLUMN_TYPE, COLUMN_SMALL_BLIND, COLUMN_BIG_BLIND, COLUMN_MINUTES].filter(
    (name) => columns[normalize(name)] === undefined,
  );
  if (missing.length > 0) {
    return {
      levels: [],
      errors: [`Missing column(s): ${missing.join(', ')}.`],
      trimmedRows: 0,
    };
  }

  const used = trimOuterBlankRows(body);
  const trimmedRows = body.length - used.length;

  if (used.length === 0) {
    return {
      levels: [],
      errors: ['No rows found — the sheet has a header but nothing under it.'],
      trimmedRows,
    };
  }

  const levels = used.map((row) => {
    const cell = (name: string) => row[columns[normalize(name)] ?? -1];
    const minutes = readNumber(cell(COLUMN_MINUTES)) ?? 0;

    if (normalize(String(cell(COLUMN_TYPE) ?? '')) === normalize(TYPE_BREAK)) {
      const chipRace = isYes(readText(cell(COLUMN_CHIP_RACE)));
      return {
        level: 0,
        smallBlind: 0,
        bigBlind: 0,
        ante: 0,
        isBigBlindAnte: false,
        durationSeconds: minutesToSeconds(minutes),
        isBreak: true,
        breakLabel: readText(cell(COLUMN_BREAK_TITLE)),
        chipRace,
        // Discarded unless the break actually has a chip race.
        chipRaceLabel: chipRace ? readText(cell(COLUMN_CHIP_RACE_TITLE)) : '',
      } satisfies BlindLevel;
    }

    return {
      level: 0,
      smallBlind: readNumber(cell(COLUMN_SMALL_BLIND)) ?? 0,
      bigBlind: readNumber(cell(COLUMN_BIG_BLIND)) ?? 0,
      ante: readNumber(cell(COLUMN_ANTE)) ?? 0,
      isBigBlindAnte: false,
      durationSeconds: minutesToSeconds(minutes),
      isBreak: false,
    } satisfies BlindLevel;
  });

  return { levels: renumberLevels(levels), errors: [], trimmedRows };
}

/**
 * Drops blank rows above the first filled row and below the last one — those
 * are just unused parts of the sheet. Blank rows in between are kept: they sit
 * where the author put them, so they come in as empty levels to fill in.
 */
function trimOuterBlankRows(rows: SheetCell[][]): SheetCell[][] {
  let start = 0;
  let end = rows.length;
  while (start < end && isBlankRow(rows[start])) start++;
  while (end > start && isBlankRow(rows[end - 1])) end--;
  return rows.slice(start, end);
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

function indexColumns(header: SheetCell[]): Record<string, number> {
  const columns: Record<string, number> = {};
  header.forEach((name, index) => {
    if (typeof name === 'string' || typeof name === 'number') {
      columns[normalize(String(name))] = index;
    }
  });
  return columns;
}

function isBlankRow(row: SheetCell[]): boolean {
  return row.every((cell) => cell === undefined || String(cell).trim() === '');
}

/** Blank cells read as `undefined`; anything non-numeric also reads as `undefined`. */
function readNumber(cell: SheetCell | undefined): number | undefined {
  if (cell === undefined || String(cell).trim() === '') return undefined;
  const value = Number(cell);
  return Number.isFinite(value) ? value : undefined;
}

function readText(cell: SheetCell | undefined): string {
  return String(cell ?? '').trim();
}

function isYes(value: string): boolean {
  return normalize(value) === normalize(YES);
}
