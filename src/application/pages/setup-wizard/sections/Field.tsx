import type { ReactNode } from 'react';

export default function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
