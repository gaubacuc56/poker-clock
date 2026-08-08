import { useRef, useState } from 'react';
import type { BlindLevel } from '@domain/entities';
import {
  downloadBlindLevels,
  downloadBlindTemplate,
  readBlindLevelsFromFile,
} from '../../shared/blindStructureExcel';
import { CheckCircleIcon, DownloadIcon, UploadIcon, WarningIcon } from '../icons';

interface BlindStructureImportProps {
  levels: BlindLevel[];
  onImport: (levels: BlindLevel[]) => void;
  /** Used to name the exported file. */
  tournamentName?: string;
}

/** Download a template (or the current structure), fill it in Excel, import it back. */
export default function BlindStructureImport({
  levels,
  onImport,
  tournamentName,
}: BlindStructureImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [summary, setSummary] = useState<string | null>(null);

  async function handleFile(file: File) {
    const {
      levels: imported,
      errors: fileErrors,
      trimmedRows,
    } = await readBlindLevelsFromFile(file);
    setErrors(fileErrors);
    if (fileErrors.length > 0) {
      setSummary(null);
      return;
    }
    const trimmed =
      trimmedRows > 0 ? `, ignored ${trimmedRows} blank row(s) outside the structure` : '';
    setSummary(`Imported ${imported.length} row(s)${trimmed}.`);
    onImport(imported);
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-surface-2 px-3 py-2.5 shadow-lift-sm">
        <span className="kicker mr-1 tracking-[.14em]">Excel</span>
        <button type="button" className="btn btn-secondary" onClick={downloadBlindTemplate}>
          <DownloadIcon className="size-4" />
          Download template
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => downloadBlindLevels(levels, tournamentName)}
          disabled={levels.length === 0}
        >
          <DownloadIcon className="size-4" />
          Export current
        </button>
        <button
          type="button"
          className="btn btn-primary ml-auto"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon className="size-4" />
          Import Excel
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            // Reset first, so re-picking the same file fires change again.
            e.target.value = '';
            if (file) void handleFile(file);
          }}
        />
      </div>

      {summary && (
        <div className="flex gap-2 rounded-2xl bg-accent/15 px-[11px] py-2.5 text-[18px] text-accent-lift">
          <CheckCircleIcon className="size-4 shrink-0" />
          <span>{summary}</span>
        </div>
      )}

      {errors.length > 0 && (
        <div className="flex gap-2 rounded-2xl bg-coral/10 px-[11px] py-2.5 text-[18px] text-coral-text">
          <WarningIcon className="size-4 shrink-0" />
          <div>
            <div className="display">The file could not be imported.</div>
            {errors.map((error) => (
              <div key={error} className="opacity-85">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
