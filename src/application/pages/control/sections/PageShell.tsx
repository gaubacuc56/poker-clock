import type { ReactNode } from 'react';
import Screen from '../../../components/layout/Screen';

/** Full-screen message state for the control route — loading, or no tournament. */
export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <Screen>
      <div className="scroll felt grid place-items-center p-6 text-center text-muted">
        <div>{children}</div>
      </div>
    </Screen>
  );
}
