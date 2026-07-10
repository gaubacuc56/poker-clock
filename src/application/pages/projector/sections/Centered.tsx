import type { ReactNode } from 'react';

export default function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-2xl text-white">
      {children}
    </div>
  );
}
