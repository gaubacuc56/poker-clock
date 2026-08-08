import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './icons';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
}

export default function PasswordInput({ value, onChange, autoComplete, required }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        required={required}
        className="input pr-11"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="btn btn-icon btn-quiet absolute top-1/2 right-0.5 -translate-y-1/2"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOffIcon className="size-[17px]" /> : <EyeIcon className="size-[17px]" />}
      </button>
    </div>
  );
}
