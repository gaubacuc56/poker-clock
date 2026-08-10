export default function BlindStat({
  label,
  value,
  small,
  tone = 'default',
}: {
  label: string;
  value: string;
  /** The compact scale used inside the Next Level box. */
  small?: boolean;
  tone?: 'default' | 'accent' | 'faint';
}) {
  return (
    <div className="text-center">
      <div
        className={`tracking-[.14em] uppercase ${
          small ? 'text-[12px] text-faint' : 'text-[13px] text-muted'
        }`}
      >
        {label}
      </div>
      <div
        className={`display tabular-nums leading-[1.1] ${small ? 'text-[24px]' : 'text-[36px]'} ${
          tone === 'accent'
            ? 'text-accent'
            : tone === 'faint'
              ? 'text-faint'
              : 'engrave'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
