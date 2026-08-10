interface BarTitleProps {
  title: string;
  subtitle?: string;
}

/** Bar title, optionally over a quieter second line. Truncates rather than wraps. */
export default function BarTitle({ title, subtitle }: BarTitleProps) {
  return (
    <div className="min-w-0">
      <div
        className={`engrave display truncate text-fg-strong ${subtitle ? 'text-[22px]' : 'text-[23px]'}`}
      >
        {title}
      </div>
    </div>
  );
}
