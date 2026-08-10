interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  /** Render 0 as an empty field rather than a literal "0" — for optional
   *  figures like break length, where empty means "use the default". */
  allowEmpty?: boolean;
  placeholder?: string;
}

/** One labeled numeric field inside an editable level card. */
export default function NumberField({
  label,
  value,
  onChange,
  min = 0,
  step,
  allowEmpty = false,
  placeholder,
}: NumberFieldProps) {
  return (
    <label className="block min-w-0">
      <span className="field-label">{label}</span>
      <input
        type="number"
        min={min}
        step={step}
        inputMode="numeric"
        placeholder={placeholder}
        className="input tabular-nums"
        value={allowEmpty && value === 0 ? '' : value}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      />
    </label>
  );
}
