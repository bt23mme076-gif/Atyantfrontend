// visualize-booking.tsx
// Minimal availability calendar — click a date, see it highlight, see which
// days are already recurring-available. No booking history, no meeting info,
// no view toggles. Just enough to place a date in context.
import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type DayType = {
  day: string;        // label shown in the cell, e.g. "14"
  fullDate: string;    // "YYYY-MM-DD"
  isPadding: boolean;  // day belongs to the previous/next month
  available: boolean;  // bookable on this exact date (weekly recurrence, minus exceptions, plus one-off overrides)
};

const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function isDateAvailable(iso: string, dow: number, availableDaysOfWeek: Set<number>, exceptionDates: Set<string>, overrideDates: Set<string>) {
  if (overrideDates.has(iso)) return true;
  if (exceptionDates.has(iso)) return false;
  return availableDaysOfWeek.has(dow);
}

function buildMonthGrid(
  monthDate: Date,
  availableDaysOfWeek: Set<number>,
  exceptionDates: Set<string>,
  overrideDates: Set<string>
): DayType[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  const cells: DayType[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const iso = toISO(d);
    const isPadding = d.getMonth() !== month;
    cells.push({
      day: String(d.getDate()),
      fullDate: iso,
      isPadding,
      available: !isPadding && isDateAvailable(iso, d.getDay(), availableDaysOfWeek, exceptionDates, overrideDates),
    });
  }
  return cells;
}

interface InteractiveCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  monthDate?: Date;
  availableDaysOfWeek?: number[];
  exceptionDates?: string[];
  overrideDates?: string[];
  selectedDate?: string | null;
  onSelectDate?: (fullDate: string) => void;
  onMonthChange?: (monthDate: Date) => void;
}

const InteractiveCalendar = React.forwardRef<HTMLDivElement, InteractiveCalendarProps>(
  (
    {
      className,
      monthDate = new Date(),
      availableDaysOfWeek = [],
      exceptionDates = [],
      overrideDates = [],
      selectedDate = null,
      onSelectDate,
      onMonthChange,
      ...props
    },
    ref
  ) => {
    const availSet = useMemo(() => new Set(availableDaysOfWeek), [availableDaysOfWeek]);
    const exceptionSet = useMemo(() => new Set(exceptionDates), [exceptionDates]);
    const overrideSet = useMemo(() => new Set(overrideDates), [overrideDates]);

    const days = useMemo(
      () => buildMonthGrid(monthDate, availSet, exceptionSet, overrideSet),
      [monthDate, availSet, exceptionSet, overrideSet]
    );

    const monthLabel = monthDate.toLocaleString('en-US', { month: 'long' });
    const stepMonth = (delta: number) => onMonthChange?.(new Date(monthDate.getFullYear(), monthDate.getMonth() + delta, 1));

    return (
      <div ref={ref} className="w-full max-w-sm mx-auto flex flex-col gap-5" {...props}>
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => stepMonth(-1)} className="rounded-full p-2 text-[var(--c-textMuted)] hover:bg-[var(--c-cardHover)] transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-base font-semibold text-[var(--c-text)]">
            {monthLabel} <span className="text-[var(--c-textMuted)] font-normal">{monthDate.getFullYear()}</span>
          </h2>
          <button type="button" onClick={() => stepMonth(1)} className="rounded-full p-2 text-[var(--c-textMuted)] hover:bg-[var(--c-cardHover)] transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-2">
          {daysOfWeek.map((d, i) => (
            <div key={i} className="text-center text-[11px] font-medium text-[var(--c-textMuted)]">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-2">
          {days.map((day) => {
            const isSelected = day.fullDate === selectedDate;
            return (
              <button
                key={day.fullDate}
                type="button"
                disabled={day.isPadding}
                onClick={() => onSelectDate?.(day.fullDate)}
                className={[
                  'relative mx-auto flex size-10 items-center justify-center rounded-full text-sm transition-colors',
                  day.isPadding ? 'text-[var(--c-textMuted)]/40 cursor-default' : 'cursor-pointer',
                  isSelected ? 'bg-[#7567C9] text-white font-semibold' : day.isPadding ? '' : 'text-[var(--c-text)] hover:bg-[var(--c-cardHover)]',
                ].join(' ')}
              >
                {day.day}
                {day.available && !isSelected && (
                  <span className="absolute bottom-1 size-1 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);
InteractiveCalendar.displayName = 'InteractiveCalendar';

export default InteractiveCalendar;
