import type { ReactNode } from 'react';
import { useThemeStore } from '@composition/container';

interface ScreenProps {
  children: ReactNode;
}

/**
 * Root wrapper for every operator screen: a column locked to the viewport so
 * the top and bottom bars stay put and only the middle `.scroll` region moves —
 * the window itself never scrolls.
 *
 * It also carries the light/dark `data-theme`, which is what keeps the theme to
 * the operator app: the projector renders outside `Screen`, so it always
 * resolves the base tokens no matter what is set here.
 */
export default function Screen({ children }: ScreenProps) {
  const theme = useThemeStore((state) => state.theme);

  return (
    // `text-fg` is not decoration: `body`'s color resolves against the base
    // tokens outside this wrapper, so without it every element that just
    // inherits (page headings, the ticket name) keeps the dark theme's colour.
    <div data-theme={theme} className="flex h-svh flex-col overflow-hidden bg-base text-fg">
      {children}
    </div>
  );
}
