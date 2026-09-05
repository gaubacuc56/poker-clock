import DatePicker from 'react-datepicker';
import { scheduleNowLocal } from '@domain/rules/tournamentSchedule';
import { CalendarIcon } from '@application/components/ui/icons';
import { DATE_TIME_FORMAT, TIME_FORMAT, dateToValue, valueToDate } from './scheduleFieldFormat';

interface DateTimeFieldProps {
  label: string;
  value: string;
  disabled?: boolean;
  invalid?: boolean;
  onChange: (value: string) => void;
}

/**
 * A moment the tournament is scheduled for: a date and a time of day, picked in
 * the app's own formats.
 *
 * The earliest offered is now — the day *and* the time. A tournament cannot be
 * scheduled for a moment that has gone, so half-past-nine is not on the list at
 * ten o'clock, on today only: tomorrow opens at midnight again.
 *
 * "Now" is now in UTC+7, expressed as the same wall-clock numbers this picker
 * shows (see `valueToDate` on why they are read as local). Taking the device's
 * own clock instead would let an organiser abroad pick a moment that is already
 * past in the room, or refuse them an evening that has not started there yet.
 */
export default function DateTimeField({
  label,
  value,
  disabled = false,
  invalid = false,
  onChange,
}: DateTimeFieldProps) {
  const selected = valueToDate(value);
  const earliest = valueToDate(scheduleNowLocal(Date.now()));
  // The time list is generated from the day in play, so one comparison covers
  // both cases: on today it drops the slots already gone, and on any later day
  // every slot is ahead of it.
  const isFutureTime = (time: Date) => !earliest || time.getTime() >= earliest.getTime();

  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="dp relative">
        <DatePicker
          selected={selected}
          onChange={(date: Date | null) => onChange(dateToValue(date))}
          disabled={disabled}
          minDate={earliest ?? undefined}
          filterTime={isFutureTime}
          // Only when there is nothing picked yet: `openToDate` outranks
          // `selected`, so passing it always would drag an edited schedule's
          // calendar back to this month.
          openToDate={selected ? undefined : (earliest ?? undefined)}
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
