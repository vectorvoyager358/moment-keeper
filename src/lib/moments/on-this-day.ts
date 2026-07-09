export const ON_THIS_DAY_LIMIT = 12;

export type OnThisDayCalendar = {
  month: number;
  day: number;
  year: number;
};

/** Calendar parts in UTC — matches the on_this_day_moment_ids RPC. */
export function getUtcCalendarParts(date: Date): OnThisDayCalendar {
  return {
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    year: date.getUTCFullYear(),
  };
}

export function formatOnThisDayHeading(date: Date, locale = "en-US"): string {
  const label = new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);

  return `On this day · ${label}`;
}

export function yearsAgoLabel(
  occurredAt: string,
  referenceDate: Date = new Date(),
): string {
  const momentYear = new Date(occurredAt).getUTCFullYear();
  const referenceYear = referenceDate.getUTCFullYear();
  const yearsAgo = referenceYear - momentYear;

  if (yearsAgo <= 0) {
    return "This year";
  }

  if (yearsAgo === 1) {
    return "1 year ago";
  }

  return `${yearsAgo} years ago`;
}
