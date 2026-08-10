import { PlusIcon } from '@application/components/ui/icons';

interface InsertBarProps {
  onAddLevel: () => void;
  /** Omitted below a break, where a back-to-back break makes no sense. */
  onAddBreak?: () => void;
}

/** Slim insertion point between cards — adds a level or break at this exact position. */
export default function InsertBar({ onAddLevel, onAddBreak }: InsertBarProps) {
  return (
    <div className="flex items-center gap-2 py-[5px]">
      <div className="h-px flex-1 bg-linear-to-r from-transparent via-line to-transparent" />
      <button type="button" className="btn btn-ghost text-[18px]" onClick={onAddLevel}>
        <PlusIcon className="size-[13px]" />
        Level
      </button>
      {onAddBreak && (
        <button
          type="button"
          className="btn btn-ghost text-[18px] text-break hover:bg-break/10"
          onClick={onAddBreak}
        >
          <PlusIcon className="size-[13px]" />
          Break
        </button>
      )}
      <div className="h-px flex-1 bg-linear-to-r from-transparent via-line to-transparent" />
    </div>
  );
}
