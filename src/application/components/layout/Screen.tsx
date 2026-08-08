import type { ReactNode } from 'react';

interface ScreenProps {
  children: ReactNode;
}

/**
 * Root wrapper for every operator screen: a column locked to the viewport so
 * the top and bottom bars stay put and only the middle `.scroll` region moves —
 * the window itself never scrolls.
 */
export default function Screen({ children }: ScreenProps) {
  return <div className="flex h-svh flex-col overflow-hidden">{children}</div>;
}
