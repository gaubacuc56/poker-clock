import { useRef, useState } from "react";
import type { BlindLevel } from "@domain/entities";
import {
  downloadBlindLevels,
  downloadBlindTemplate,
  readBlindLevelsFromFile,
} from "../../shared/blindStructureExcel";
import { UploadIcon } from "../icons";

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
      levels,
      errors: fileErrors,
      trimmedRows,
    } = await readBlindLevelsFromFile(file);
    setErrors(fileErrors);
    if (fileErrors.length > 0) {
      setSummary(null);
      return;
    }
    const trimmed =
      trimmedRows > 0 ? `, ignored ${trimmedRows} blank row(s) outside the structure` : "";
    setSummary(`Imported ${levels.length} row(s)${trimmed}.`);
    onImport(levels);
  }

  return (
    <div className="space-y-2">
      {/* Mobile: the two download buttons share one full-width line and Import
          takes the next. Desktop: all three on one line, Import pushed right. */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary flex-1 text-sm sm:flex-none"
            onClick={downloadBlindTemplate}
          >
            Download template
          </button>
          <button
            type="button"
            className="btn-secondary flex-1 text-sm sm:flex-none"
            onClick={() => downloadBlindLevels(levels, tournamentName)}
            disabled={levels.length === 0}
          >
            Export current
          </button>
        </div>
        <button
          type="button"
          className="btn-primary w-full text-sm sm:w-auto"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon className="h-4 w-4" />
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
            e.target.value = "";
            if (file) void handleFile(file);
          }}
        />
      </div>

      {summary && <p className="text-sm text-emerald-400">{summary}</p>}

      {errors.length > 0 && (
        <ul className="space-y-0.5 text-sm text-red-400">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
