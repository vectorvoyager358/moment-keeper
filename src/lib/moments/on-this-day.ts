import { getCalendarPartsInTimeZone, getYearInTimeZone } from "@/lib/timezone";

export const ON_THIS_DAY_LIMIT = 12;

export type OnThisDayCalendar = {
  month: number;
  day: number;
  year: number;
};

export function getLocalCalendarParts(
  date: Date,
  timeZone: string,
): OnThisDayCalendar {
  return getCalendarPartsInTimeZone(date, timeZone);
}

export function formatOnThisDayHeading(
  date: Date,
  timeZone: string,
  locale = "en-US",
): string {
  const label = new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    timeZone,
  }).format(date);

  return `On this day · ${label}`;
}

export function isOnThisDayMoment(
  occurredAt: string,
  todayIso: string,
  timeZone: string,
): boolean {
  const today = getLocalCalendarParts(new Date(todayIso), timeZone);
  const occurred = getLocalCalendarParts(new Date(occurredAt), timeZone);

  return (
    occurred.month === today.month &&
    occurred.day === today.day &&
    occurred.year < today.year
  );
}

export function yearsAgoLabel(
  occurredAt: string,
  referenceDate: Date = new Date(),
  timeZone = "UTC",
): string {
  const momentYear = getYearInTimeZone(occurredAt, timeZone);
  const referenceYear = getCalendarPartsInTimeZone(
    referenceDate,
    timeZone,
  ).year;
  const yearsAgo = referenceYear - momentYear;

  if (yearsAgo <= 0) {
    return "This year";
  }

  if (yearsAgo === 1) {
    return "1 year ago";
  }

  return `${yearsAgo} years ago`;
}
