export type CalendarMonth = {
  year: number;
  month: number;
};

export type CalendarDay = {
  dateKey: string;
  dayNumber: number;
  inMonth: boolean;
};

const MIN_CALENDAR_YEAR = 1900;
const MAX_CALENDAR_YEAR = 2100;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function parseCalendarParams(
  params: {
    year?: string | string[];
    month?: string | string[];
    day?: string | string[];
    date?: string | string[];
  },
  now: Date = new Date(),
): CalendarMonth & { day: string | null } {
  const exactDate = typeof params.date === "string" ? params.date : null;
  const parsedExactDate = exactDate
    ? new Date(`${exactDate}T00:00:00.000Z`)
    : null;
  const validExactDate =
    exactDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(exactDate) &&
    parsedExactDate &&
    !Number.isNaN(parsedExactDate.getTime()) &&
    parsedExactDate.toISOString().slice(0, 10) === exactDate &&
    Number(exactDate.slice(0, 4)) >= MIN_CALENDAR_YEAR &&
    Number(exactDate.slice(0, 4)) <= MAX_CALENDAR_YEAR
      ? exactDate
      : null;
  const rawYear = validExactDate
    ? Number(validExactDate.slice(0, 4))
    : typeof params.year === "string"
      ? Number(params.year)
      : NaN;
  const rawMonth = validExactDate
    ? Number(validExactDate.slice(5, 7))
    : typeof params.month === "string"
      ? Number(params.month)
      : NaN;
  const year =
    Number.isInteger(rawYear) &&
    rawYear >= MIN_CALENDAR_YEAR &&
    rawYear <= MAX_CALENDAR_YEAR
      ? rawYear
      : now.getUTCFullYear();
  const month =
    Number.isInteger(rawMonth) && rawMonth >= 1 && rawMonth <= 12
      ? rawMonth
      : now.getUTCMonth() + 1;
  const rawDay =
    validExactDate ?? (typeof params.day === "string" ? params.day : null);
  const monthPrefix = `${year}-${pad(month)}-`;
  const parsedDay = rawDay ? new Date(`${rawDay}T00:00:00.000Z`) : null;
  const day =
    rawDay &&
    /^\d{4}-\d{2}-\d{2}$/.test(rawDay) &&
    rawDay.startsWith(monthPrefix) &&
    parsedDay &&
    !Number.isNaN(parsedDay.getTime()) &&
    parsedDay.toISOString().slice(0, 10) === rawDay
      ? rawDay
      : null;

  return { year, month, day };
}

export function getCalendarMonthRange({ year, month }: CalendarMonth): {
  start: string;
  end: string;
} {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)).toISOString(),
    end: new Date(Date.UTC(year, month, 1)).toISOString(),
  };
}

export function shiftCalendarMonth(
  { year, month }: CalendarMonth,
  offset: number,
): CalendarMonth {
  const shifted = new Date(Date.UTC(year, month - 1 + offset, 1));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
  };
}

export function buildCalendarDays({
  year,
  month,
}: CalendarMonth): CalendarDay[] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const start = new Date(firstOfMonth);
  start.setUTCDate(1 - firstOfMonth.getUTCDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);

    return {
      dateKey: `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
      dayNumber: date.getUTCDate(),
      inMonth:
        date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month,
    };
  });
}

export function calendarDayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function formatCalendarMonth({ year, month }: CalendarMonth): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}
