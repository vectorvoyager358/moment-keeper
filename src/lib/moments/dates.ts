const FUTURE_TOLERANCE_MS = 60 * 60 * 1000;

const DATETIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/** Convert a `datetime-local` value using the browser's `getTimezoneOffset()`. */
export function parseOccurredAtFormValue(
  value: string,
  offsetMinutes?: number | null,
): string {
  const match = value.match(DATETIME_LOCAL_PATTERN);

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hours = Number(match[4]);
    const minutes = Number(match[5]);
    const offset =
      typeof offsetMinutes === "number" && Number.isFinite(offsetMinutes)
        ? offsetMinutes
        : 0;
    const utcMs =
      Date.UTC(year, month - 1, day, hours, minutes) + offset * 60_000;

    return new Date(utcMs).toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString();
}

export function parseTimezoneOffsetFromFormData(
  formData: FormData,
): number | null {
  const raw = String(formData.get("occurred_at_offset") ?? "").trim();

  if (raw === "") {
    return null;
  }

  const offset = Number(raw);
  return Number.isFinite(offset) ? offset : null;
}

export function validateOccurredAt(
  value: string,
  offsetMinutes?: number | null,
): string | null {
  const parsed = parseOccurredAtFormValue(value, offsetMinutes);
  const date = new Date(parsed);

  if (Number.isNaN(date.getTime())) {
    return "Enter a valid date and time.";
  }

  if (date.getTime() > Date.now() + FUTURE_TOLERANCE_MS) {
    return "Moment date cannot be more than 1 hour in the future.";
  }

  return null;
}

export function toDatetimeLocalValue(date: Date): string {
  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toDatetimeLocalValueFromIso(iso: string): string {
  return toDatetimeLocalValue(new Date(iso));
}

export function formatMomentDate(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(iso));
}

export function formatMomentDateCompact(
  iso: string,
  timeZone?: string,
): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

export function formatMomentDateDetail(iso: string, timeZone?: string): string {
  const date = new Date(iso);
  const calendarDate = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  }).format(date);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(date);

  return `${calendarDate} · ${time}`;
}

export function truncateBody(body: string, maxLength = 160): string {
  if (body.length <= maxLength) {
    return body;
  }

  return `${body.slice(0, maxLength).trimEnd()}…`;
}
