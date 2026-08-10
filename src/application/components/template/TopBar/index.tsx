import type { ReactNode } from 'react';

interface TopBarProps {
  /** `rail` is the wooden table edge (tournament screens); `chrome` is the
   *  flatter bar used for setup and settings. */
  tone?: 'rail' | 'chrome';
  children: ReactNode;
}

/** The bar every screen starts with. Contents are composed by each screen. */
export default function TopBar({ tone = 'chrome', children }: TopBarProps) {
  const isRail = tone === 'rail';
  return (
    <header className={isRail ? 'rail' : 'bar bar-top'}>
      {/* The bar spans the window; its contents stay on the shared column. */}
      <div className={`content flex items-center ${isRail ? 'gap-2' : 'gap-2.5'}`}>{children}</div>
    </header>
  );
}
