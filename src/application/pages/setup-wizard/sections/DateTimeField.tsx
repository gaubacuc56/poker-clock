import DatePicker from 'react-datepicker';
import { CalendarIcon } from '@application/components/ui/icons';
import { DATE_TIME_FORMAT, TIME_FORMAT, dateToValue, valueToDate } from './scheduleFieldFormat';

interface DateTimeFieldProps {
  label: string;
  value: string;
  disabled?: boolean;
  invalid?: boolean;
  onChange: (value: string) => void;
}

export default function DateTimeField({
  label,
  value,
  disabled = false,
  invalid = false,
  onChange,
}: DateTimeFieldProps) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="dp relative">
        <DatePicker
          selected={valueToDate(value)}
          onChange={(date: Date | null) => onChange(dateToValue(date))}
          disabled={disabled}
          showTimeSelect
         
          timeIntervals={15}
          timeFormat={TIME_FORMAT}
          timeCaption="Time"
          dateFormat={DATE_TIME_FORMAT}
          placeholderText="Select date and time"
          className={`input tabular-nums pr-11 ${invalid ? 'input-bad' : ''}`}
          portalId="schedule-picker-portal"
          shouldCloseOnSelect={false}
          aria-label={label}
        />
        <CalendarIcon className="pointer-events-none absolute top-1/2 right-3 size-[18px] -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}
