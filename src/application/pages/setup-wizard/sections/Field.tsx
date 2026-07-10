import type { ReactNode } from 'react';

export default function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-themed-muted">{label}</span>
      {children}
    </label>
  );
}
