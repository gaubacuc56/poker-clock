import type { ReactNode } from 'react';

export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-themed-primary text-themed-primary">
      <div className="text-center">{children}</div>
    </div>
  );
}
