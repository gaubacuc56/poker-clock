/** Label on the left, sliding switch on the right — the "Allow rebuys / add-ons" toggles. */
export default function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="check w-full justify-between">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch" />
    </label>
  );
}
