import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { MomentCard } from "@/components/timeline/MomentCard";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { localDateKey } from "@/lib/timezone";
import { toUserErrorMessage } from "@/lib/errors";
import {
  buildCalendarDays,
  calendarDayKey,
  formatCalendarMonth,
  shiftCalendarMonth,
  type CalendarMonth,
} from "@/lib/moments/calendar";
import { getCalendarMoments } from "@/lib/moments/queries";

type CalendarViewProps = CalendarMonth & {
  selectedDay: string | null;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function monthUrl(month: CalendarMonth, day?: string): string {
  const params = new URLSearchParams({
    view: "calendar",
    year: String(month.year),
    month: String(month.month),
  });

  if (day) {
    params.set("day", day);
  }

  return `/browse?${params.toString()}`;
}

export async function CalendarView({
  year,
  month,
  selectedDay,
}: CalendarViewProps) {
  let moments;

  try {
    moments = await getCalendarMoments(year, month);
  } catch (error) {
    throw new Error(toUserErrorMessage(error, "Could not load your calendar."));
  }

  const calendarMonth = { year, month };
  const previousMonth = shiftCalendarMonth(calendarMonth, -1);
  const nextMonth = shiftCalendarMonth(calendarMonth, 1);
  const calendarDays = buildCalendarDays(calendarMonth);
  const momentsByDay = new Map<string, typeof moments>();

  for (const moment of moments) {
    const dateKey = calendarDayKey(moment.occurred_at);
    const dayMoments = momentsByDay.get(dateKey) ?? [];
    dayMoments.push(moment);
    momentsByDay.set(dateKey, dayMoments);
  }

  const selectedMoments = selectedDay
    ? (momentsByDay.get(selectedDay) ?? [])
    : [];
  const todayKey = localDateKey();

  return (
    <div className="space-y-8">
      <Card padding="md" className="rounded-[1.5rem]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link
            href={monthUrl(previousMonth)}
            className={buttonClassName({
              variant: "ghost",
              size: "sm",
              className: "px-2.5",
            })}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Link>
          <div className="text-center">
            <h2 className="font-display text-xl font-semibold text-ink">
              {formatCalendarMonth(calendarMonth)}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {moments.length} {moments.length === 1 ? "moment" : "moments"}{" "}
              kept
            </p>
          </div>
          <Link
            href={monthUrl(nextMonth)}
            className={buttonClassName({
              variant: "ghost",
              size: "sm",
              className: "px-2.5",
            })}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mb-5 rounded-2xl bg-accent-subtle/45 p-3">
          <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
            <form
              action="/browse"
              method="get"
              className="flex min-w-0 flex-col gap-3"
            >
              <input type="hidden" name="view" value="calendar" />
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_5.5rem] sm:items-end sm:gap-2">
                <Label className="block min-w-0 text-xs font-semibold text-muted">
                  Month
                  <Select
                    name="month"
                    defaultValue={month}
                    className="mt-1 h-10"
                  >
                    {MONTHS.map((label, index) => (
                      <option key={label} value={index + 1}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Label>
                <Label className="block min-w-0 text-xs font-semibold text-muted">
                  Year
                  <Input
                    type="number"
                    name="year"
                    min="1900"
                    max="2100"
                    defaultValue={year}
                    required
                    inputMode="numeric"
                    className="mt-1 h-10"
                  />
                </Label>
              </div>
              <div className="mt-auto">
                <button
                  type="submit"
                  className={buttonClassName({
                    size: "sm",
                    className: "h-10 w-full",
                  })}
                >
                  Open month
                </button>
              </div>
            </form>

            <form
              action="/browse"
              method="get"
              className="flex min-w-0 flex-col gap-3"
            >
              <input type="hidden" name="view" value="calendar" />
              <Label className="block min-w-0 text-xs font-semibold text-muted">
                Choose a date
                <Input
                  type="date"
                  name="date"
                  min="1900-01-01"
                  max="2100-12-31"
                  defaultValue={selectedDay ?? ""}
                  required
                  className="date-field mt-1 box-border h-10 py-2"
                />
              </Label>
              <div className="mt-auto">
                <button
                  type="submit"
                  className={buttonClassName({
                    variant: "secondary",
                    size: "sm",
                    className: "h-10 w-full",
                  })}
                >
                  Relive
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              className="pb-1 text-center text-[0.65rem] font-semibold tracking-wide text-muted uppercase sm:text-xs"
            >
              {weekday}
            </div>
          ))}

          {calendarDays.map((day) => {
            const dayMoments = momentsByDay.get(day.dateKey) ?? [];
            const thumbnail = dayMoments.find(
              (moment) => moment.thumbnailUrl,
            )?.thumbnailUrl;
            const selected = selectedDay === day.dateKey;
            const populated = day.inMonth && dayMoments.length > 0;
            const content = (
              <>
                {thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL
                  <img
                    src={thumbnail}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
                {thumbnail ? (
                  <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                ) : null}
                <span
                  className={cn(
                    "relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:h-7 sm:w-7 sm:text-sm",
                    thumbnail
                      ? "text-white"
                      : selected
                        ? "bg-accent text-white"
                        : day.dateKey === todayKey
                          ? "bg-accent-subtle text-accent"
                          : "text-ink",
                  )}
                >
                  {day.dayNumber}
                </span>
                {dayMoments.length > 0 ? (
                  <span
                    className={cn(
                      "relative z-10 mt-auto text-[0.6rem] font-semibold sm:text-xs",
                      thumbnail ? "text-white" : "text-accent",
                    )}
                  >
                    {dayMoments.length}
                  </span>
                ) : null}
              </>
            );

            return populated ? (
              <Link
                key={day.dateKey}
                href={monthUrl(calendarMonth, day.dateKey)}
                aria-label={`${day.dateKey}: ${dayMoments.length} moments`}
                className={cn(
                  "relative flex aspect-square min-w-0 flex-col overflow-hidden rounded-lg border p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 sm:rounded-xl sm:p-1.5",
                  selected
                    ? "border-accent shadow-sm"
                    : "border-border bg-accent-subtle/30 hover:border-accent/50",
                )}
              >
                {content}
              </Link>
            ) : (
              <div
                key={day.dateKey}
                className={cn(
                  "relative flex aspect-square min-w-0 flex-col rounded-lg p-1 sm:rounded-xl sm:p-1.5",
                  day.inMonth ? "bg-surface" : "opacity-25",
                )}
                aria-hidden={!day.inMonth}
              >
                {content}
              </div>
            );
          })}
        </div>
      </Card>

      {selectedDay ? (
        <section aria-labelledby="selected-day-heading">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2
                id="selected-day-heading"
                className="font-display text-xl font-semibold text-ink"
              >
                {new Intl.DateTimeFormat(undefined, {
                  dateStyle: "full",
                  timeZone: "UTC",
                }).format(new Date(`${selectedDay}T00:00:00.000Z`))}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {selectedMoments.length}{" "}
                {selectedMoments.length === 1 ? "moment" : "moments"}
              </p>
            </div>
            <Link
              href={monthUrl(calendarMonth)}
              className="text-sm font-medium text-accent hover:underline"
            >
              Back to month
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {selectedMoments.map((moment) => (
              <li key={moment.id}>
                <MomentCard moment={moment} />
              </li>
            ))}
          </ul>
        </section>
      ) : moments.length > 0 ? (
        <p className="text-center text-sm text-muted">
          Choose a highlighted day to relive its moments.
        </p>
      ) : (
        <Card
          padding="lg"
          className="border-dashed border-border-strong text-center"
        >
          <p className="font-display text-lg font-semibold text-ink">
            A quiet month
          </p>
          <p className="mt-2 text-sm text-muted">
            Try another month, or keep something from today.
          </p>
          <Link
            href="/capture"
            className={buttonClassName({ className: "mt-5" })}
          >
            Capture today&apos;s moment
          </Link>
        </Card>
      )}
    </div>
  );
}
