export const TIMEZONE_COOKIE = "mk_timezone";

const IANA_TIMEZONE =
  /^(?:UTC|Etc\/GMT[+-]?\d{1,2}|[A-Za-z_+-]+\/[A-Za-z_+-]+(?:\/[A-Za-z_+-]+)?)$/;

export function normalizeTimeZone(value: string | null | undefined): string {
  const trimmed = value?.trim();

  if (!trimmed || !IANA_TIMEZONE.test(trimmed)) {
    return "UTC";
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return trimmed;
  } catch {
    return "UTC";
  }
}

export function getCalendarPartsInTimeZone(
  date: Date,
  timeZone: string,
): { month: number; day: number; year: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    month: read("month"),
    day: read("day"),
    year: read("year"),
  };
}

export function getYearInTimeZone(iso: string, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
  }).formatToParts(new Date(iso));

  return Number(parts.find((part) => part.type === "year")?.value);
}

export function localDateKey(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
