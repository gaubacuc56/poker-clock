import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, HomeIcon } from '../icons';

interface TopBarProps {
  /** `rail` is the wooden table edge (tournament screens); `chrome` is the flatter bar used for setup and settings. */
  tone?: 'rail' | 'chrome';
  children: ReactNode;
}

/** The bar every screen starts with. Contents are composed by each screen. */
export default function TopBar({ tone = 'chrome', children }: TopBarProps) {
  const isRail = tone === 'rail';
  return (
    <header className={isRail ? 'rail' : 'bar bar-top'}>
      {/* The bar spans the window; its contents stay on the shared column. */}
      <div className={`content flex items-center ${isRail ? 'gap-2' : 'gap-2.5'}`}>
        {children}
      </div>
    </header>
  );
}

interface BackProps {
  to: string;
  label: string;
  /** `home` renders the house glyph, `caret` the back arrow. */
  glyph?: 'home' | 'caret';
}

export function BackLink({ to, label, glyph = 'caret' }: BackProps) {
  return (
    <Link
      to={to}
      className={`btn btn-icon ${glyph === 'home' ? 'btn-secondary' : 'btn-quiet'}`}
      title={label}
      aria-label={label}
    >
      {glyph === 'home' ? (
        <HomeIcon className="size-4" />
      ) : (
        <ChevronLeftIcon className="size-[19px]" />
      )}
    </Link>
  );
}

interface TitleProps {
  title: string;
  subtitle?: string;
}

/** Bar title, optionally over a quieter second line. Truncates rather than wraps. */
export function BarTitle({ title, subtitle }: TitleProps) {
  return (
    <div className="min-w-0">
      <div
        className={`engrave display truncate text-white ${subtitle ? 'text-[22px]' : 'text-[23px]'}`}
      >
        {title}
      </div>
      {subtitle && <div className="truncate text-[16px] text-muted">{subtitle}</div>}
    </div>
  );
}
