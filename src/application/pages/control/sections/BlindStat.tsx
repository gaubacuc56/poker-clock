export default function BlindStat({
  label,
  value,
  small,
  valueClassName,
}: {
  label: string;
  value: string;
  small?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="text-center">
      <div
        className={`mb-1 uppercase tracking-wide text-themed-muted ${small ? 'text-xs' : 'text-sm sm:text-lg'}`}
      >
        {label}
      </div>
      <div
        className={`font-bold ${small ? 'text-xl text-themed-secondary' : 'text-4xl sm:text-5xl md:text-6xl'} ${valueClassName ?? 'text-themed-primary'}`}
      >
        {value}
      </div>
    </div>
  );
}
