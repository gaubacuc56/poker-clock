interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** One labeled text field inside an editable level card. */
export default function TextField({ label, value, onChange, placeholder }: TextFieldProps) {
  return (
    <label className="block min-w-0">
      <span className="field-label">{label}</span>
      <input
        type="text"
        className="input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
