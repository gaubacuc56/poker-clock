import type { Cell, Workbook, Worksheet } from 'exceljs';
import type { BlindLevel } from '@domain/entities';
import {
  BLIND_SHEET_COLUMNS,
  BLIND_SHEET_NAME,
  type BlindSheetParseResult,
  DEFAULT_BREAK_MINUTES,
  DEFAULT_LEVEL_MINUTES,
  type SheetCell,
  TYPE_BREAK,
  TYPE_LEVEL,
  TYPE_OPTIONS,
  YES,
  YES_NO_OPTIONS,
  blindLevelsFromSheetRows,
  blindLevelsToSheetRows,
  createBlindSheetTemplate,
} from '@domain/rules/blindStructureSheet';

/**
 * Reading and writing the .xlsx itself. ExcelJS is loaded on demand so it never
 * lands in the initial bundle — the setup wizard is the only screen that can
 * reach this.
 *
 * The generated file is meant to feel like the on-screen editor: Type and Chip
 * Race are dropdowns, Level numbers fill themselves in, numeric cells reject
 * anything that isn't a whole number, and cells that don't apply to a row's
 * type are greyed out and refuse input.
 */
async function excelJs() {
  return (await import('exceljs')).default;
}

/**
 * How many data rows the sheet is set up for. An export with more levels than
 * this extends to fit them; a shorter one still gets blank rows up to here, so
 * there's room to keep typing.
 */
const SETUP_ROWS = 25;

/** Column letters, in BLIND_SHEET_COLUMNS order. */
const COL = {
  type: 'A',
  level: 'B',
  smallBlind: 'C',
  bigBlind: 'D',
  ante: 'E',
  minutes: 'F',
  breakTitle: 'G',
  chipRace: 'H',
  chipRaceTitle: 'I',
} as const;

const COLUMN_WIDTHS = [10, 7, 10, 10, 10, 10, 16, 11, 18];

const HEADER_FILL = 'FF1F2937';
const HEADER_FONT = 'FFF9FAFB';
const DERIVED_FONT = 'FF6B7280';
const DISABLED_FILL = 'FFE5E7EB';

/** Row is a play level / is a break — the condition every guarded cell hangs off. */
const isType = (row: number, type: string) => `$${COL.type}${row}="${type}"`;

/**
 * Auto-numbers play levels the way the editor does: breaks get no number, and
 * the count runs from the top of the sheet.
 */
const levelFormula = (row: number) =>
  `IF($${COL.type}${row}="","",IF(${isType(row, TYPE_BREAK)},"",COUNTIF($${COL.type}$2:$${COL.type}${row},"${TYPE_LEVEL}")))`;

function dropdown(cell: Cell, options: readonly string[], error: string) {
  cell.dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [`"${options.join(',')}"`],
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: 'Pick from the list',
    error,
  };
}

/** Accepts input only while `condition` holds; blanks are always allowed. */
function onlyWhen(cell: Cell, condition: string, errorTitle: string, error: string) {
  cell.dataValidation = {
    type: 'custom',
    allowBlank: true,
    // Stored without a leading "=", which is how Excel writes formula1 itself.
    formulae: [condition],
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle,
    error,
  };
}

/** A whole number at or above `minimum`, and only on rows of the given Type. */
function wholeNumber(sheet: Worksheet, column: string, row: number, type: string, minimum: number) {
  const ref = `${column}${row}`;
  onlyWhen(
    sheet.getCell(ref),
    `AND(${isType(row, type)},ISNUMBER(${ref}),${ref}>=${minimum},MOD(${ref},1)=0)`,
    `${type} rows only`,
    `Set Type to ${type} on this row, then enter a whole number${minimum > 0 ? ' above 0' : ' (0 or more)'}.`,
  );
}

/** Shades the column wherever the row's Type makes it irrelevant. */
function greyOutWhen(sheet: Worksheet, columns: string[], lastRow: number, condition: string) {
  for (const column of columns) {
    sheet.addConditionalFormatting({
      ref: `${column}2:${column}${lastRow}`,
      rules: [
        {
          type: 'expression',
          formulae: [condition],
          priority: 1,
          style: {
            fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: DISABLED_FILL } },
          },
        },
      ],
    });
  }
}

function addInstructions(workbook: Workbook) {
  const sheet = workbook.addWorksheet('How to use');
  sheet.getColumn(1).width = 100;
  sheet.addRows([
    ['Blind structure — how to fill this in'],
    [''],
    ['1. Set Type on each row: Level for a playing level, Break for a break. Both are dropdowns.'],
    ['2. Level numbers fill in by themselves. Breaks are not numbered.'],
    ['3. Level rows: fill SB, BB, Ante and Minutes. Ante 0 means no ante.'],
    ['4. Break rows: fill Minutes, and optionally a Break Title and Chip Race.'],
    ['5. Greyed-out cells do not apply to that row and are rejected if typed in.'],
    ['6. Leave unused rows blank — they are ignored on import.'],
    [''],
    [`Blank Minutes falls back to ${DEFAULT_LEVEL_MINUTES} for a level, ${DEFAULT_BREAK_MINUTES} for a break.`],
  ]);
  sheet.getRow(1).font = { bold: true, size: 14 };
}

async function buildWorkbook(rows: SheetCell[][]): Promise<Workbook> {
  const ExcelJS = await excelJs();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(BLIND_SHEET_NAME, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const [, ...body] = rows;
  sheet.addRow([...BLIND_SHEET_COLUMNS]);
  body.forEach((row) => sheet.addRow(row));

  const lastRow = 1 + Math.max(body.length, SETUP_ROWS);

  COLUMN_WIDTHS.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: HEADER_FONT } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
  header.alignment = { vertical: 'middle', horizontal: 'center' };
  header.height = 22;

  for (let row = 2; row <= lastRow; row++) {
    // Level is derived from Type, never typed.
    const levelCell = sheet.getCell(`${COL.level}${row}`);
    levelCell.value = { formula: levelFormula(row), date1904: false };
    levelCell.alignment = { horizontal: 'center' };
    levelCell.font = { color: { argb: DERIVED_FONT } };
    onlyWhen(
      levelCell,
      'FALSE',
      'Filled in for you',
      'Level numbers are assigned automatically from the Type column.',
    );

    dropdown(sheet.getCell(`${COL.type}${row}`), TYPE_OPTIONS, 'Pick Level or Break.');
    dropdown(
      sheet.getCell(`${COL.chipRace}${row}`),
      YES_NO_OPTIONS,
      'Breaks only — pick Yes or No.',
    );

    wholeNumber(sheet, COL.smallBlind, row, TYPE_LEVEL, 1);
    wholeNumber(sheet, COL.bigBlind, row, TYPE_LEVEL, 1);
    wholeNumber(sheet, COL.ante, row, TYPE_LEVEL, 0);

    // Minutes applies to both row types, so it carries no Type condition.
    sheet.getCell(`${COL.minutes}${row}`).dataValidation = {
      type: 'whole',
      operator: 'greaterThan',
      formulae: [0],
      allowBlank: true,
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Whole minutes',
      error: 'Enter the length in whole minutes, e.g. 20.',
    };

    onlyWhen(
      sheet.getCell(`${COL.breakTitle}${row}`),
      isType(row, TYPE_BREAK),
      'Break rows only',
      'Set Type to Break on this row to give it a title.',
    );
    onlyWhen(
      sheet.getCell(`${COL.chipRaceTitle}${row}`),
      `AND(${isType(row, TYPE_BREAK)},$${COL.chipRace}${row}="${YES}")`,
      'Chip race rows only',
      `Set Type to Break and Chip Race to ${YES} on this row first.`,
    );
  }

  greyOutWhen(
    sheet,
    [COL.smallBlind, COL.bigBlind, COL.ante],
    lastRow,
    isType(2, TYPE_BREAK),
  );
  greyOutWhen(
    sheet,
    [COL.breakTitle, COL.chipRace, COL.chipRaceTitle],
    lastRow,
    isType(2, TYPE_LEVEL),
  );

  addInstructions(workbook);
  return workbook;
}

async function download(rows: SheetCell[][], fileName: string) {
  const workbook = await buildWorkbook(rows);
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** An example file showing the expected columns, with all validation in place. */
export async function downloadBlindTemplate() {
  await download(createBlindSheetTemplate(), 'blind-structure-template.xlsx');
}

/** The current structure, as an editable file that can be imported back. */
export async function downloadBlindLevels(levels: BlindLevel[], tournamentName?: string) {
  const name = fileNameSafe(tournamentName);
  await download(
    blindLevelsToSheetRows(levels),
    name ? `${name}-blind-structure.xlsx` : 'blind-structure.xlsx',
  );
}

/** Strips anything that doesn't belong in a download filename. */
function fileNameSafe(value: string | undefined): string {
  return (value ?? '').replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '');
}

export async function readBlindLevelsFromFile(file: File): Promise<BlindSheetParseResult> {
  let rows: SheetCell[][];
  try {
    const ExcelJS = await excelJs();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    // Prefer the sheet we write, but fall back to the first one so a file saved
    // from Google Sheets or renamed by hand still imports.
    const sheet = workbook.getWorksheet(BLIND_SHEET_NAME) ?? workbook.worksheets[0];
    if (!sheet) {
      return { levels: [], errors: ["That file doesn't contain any sheets."], trimmedRows: 0 };
    }
    rows = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      // ExcelJS pads index 0; drop it so the array is column-aligned.
      rows.push((row.values as unknown[]).slice(1).map(readCell));
    });
  } catch {
    return {
      levels: [],
      errors: ["That file couldn't be read as a spreadsheet."],
      trimmedRows: 0,
    };
  }
  return blindLevelsFromSheetRows(rows);
}

/** Flattens ExcelJS cell values (formula results, rich text) to a plain cell. */
function readCell(value: unknown): SheetCell {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (typeof value === 'object') {
    const record = value as { result?: unknown; text?: unknown; richText?: { text: string }[] };
    if (record.richText) return record.richText.map((part) => part.text).join('');
    if (record.result !== undefined) return readCell(record.result);
    if (record.text !== undefined) return readCell(record.text);
  }
  return String(value);
}
