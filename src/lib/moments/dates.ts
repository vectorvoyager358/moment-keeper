const FUTURE_TOLERANCE_MS = 60 * 60 * 1000;

export function validateOccurredAt(value: string): string | null {
  const date = new Date(value);

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

export function truncateBody(body: string, maxLength = 160): string {
  if (body.length <= maxLength) {
    return body;
  }

  return `${body.slice(0, maxLength).trimEnd()}…`;
}
