import { pu } from '@application/shared/projectorScale';

interface LevelDotsProps {
  levelIndex: number;
  levelCount: number;
  isBreak: boolean;
}

/**
 * One dot per entry in the blind structure — played ones dimmed gold, the
 * current one stretched into a dash, the rest hairline.
 */
export default function LevelDots({ levelIndex, levelCount, isBreak }: LevelDotsProps) {
  return (
    <div className="flex items-center" style={{ gap: pu(0.55), marginTop: pu(0.4) }}>
      {Array.from({ length: levelCount }, (_, index) => (
        <span
          key={index}
          style={{
            width: index === levelIndex ? pu(1.5) : pu(0.5),
            height: pu(0.5),
            borderRadius: '999px',
            background: dotColor(index, levelIndex, isBreak),
          }}
        />
      ))}
    </div>
  );
}

function dotColor(index: number, levelIndex: number, isBreak: boolean): string {
  if (index === levelIndex) return isBreak ? 'var(--color-break)' : 'var(--pj-gold)';
  return index < levelIndex ? 'var(--pj-gold-dim)' : 'var(--pj-hair-2)';
}
