/** A currency unit available for tournaments — the allowed set lives in the `currencies` table, not in code. */
export interface Currency {
  code: string;
  label: string;
}
