import DatePicker from 'react-datepicker';
import { ClockIcon } from '@application/components/ui/icons';
import { TIME_FORMAT, dateToTime, timeToDate } from './scheduleFieldFormat';

interface TimeFieldProps {
  /** `HH:mm`, 24-hour. Empty when unset. */
  value: string;
  ariaLabel: string;
  disabled?: boolean;
  invalid?: boolean;
  onChange: (value: string) => void;
}

/**
 * A time of day, picked in the app's own clock and always written 24-hour.
 *
 * Same reason as the date: `<input type="time">` renders in the browser's locale,
 * so a US machine shows `07:00 PM` where the rest of the app — the projector's
 * Reg End line, the Next session box, the poster the organiser is copying — says
 * `19:00`.
 *
 * Renders the control only. Callers own the label, because the three places this
 * appears label it differently.
 */
export default function TimeField({
  value,
  ariaLabel,
  disabled = false,
  invalid = false,
  onChange,
}: TimeFieldProps) {
  return (
    <div className="dp relative min-w-0">
      <DatePicker
        selected={timeToDate(value)}
        onChange={(date: Date | null) => onChange(dateToTime(date))}
        disabled={disabled}
        showTimeSelect
        showTimeSelectOnly
        timeIntervals={15}
        timeFormat={TIME_FORMAT}
        timeCaption="Time"
        dateFormat={TIME_FORMAT}
        placeholderText="Select time"
        className={`input tabular-nums pr-11 ${invalid ? 'input-bad' : ''}`}
        portalId="schedule-picker-portal"
        aria-label={ariaLabel}
      />
      <ClockIcon className="pointer-events-none absolute top-1/2 right-3 size-[18px] -translate-y-1/2 text-muted" />
    </div>
  );
}
