import type { ReactNode } from 'react';

export default function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="felt flex h-screen w-screen items-center justify-center px-8 text-center text-2xl text-muted">
      {children}
    </div>
  );
}
