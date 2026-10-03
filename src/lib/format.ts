/**
 * Display formatting.
 *
 * The product is built for the Nepal market — the prototype renders prices as
 * "NPR 31,200" and job locations in the Kathmandu valley — so amounts are
 * formatted NPR-first rather than with a currency symbol that would render as
 * "$" or "₹" depending on locale.
 */

const NPR_FORMATTER = new Intl.NumberFormat("en-NP", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** "NPR 31,200" */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "NPR 0";
  return `NPR ${NPR_FORMATTER.format(amount)}`;
}

/** Same number, no currency prefix — for table cells with a unit header. */
export function formatAmount(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "0";
  return NPR_FORMATTER.format(amount);
}

export function formatCompactCurrency(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "NPR 0";
  if (amount >= 1_000_000) {
    return `NPR ${NPR_FORMATTER.format(amount / 1_000_000)}M`;
  }
  if (amount >= 1_000) {
    return `NPR ${NPR_FORMATTER.format(amount / 1_000)}k`;
  }
  return `NPR ${NPR_FORMATTER.format(amount)}`;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatDate(iso: string | null | undefined): string {
  const date = parseDate(iso);
  return date ? DATE_FORMATTER.format(date) : "—";
}

export function formatDateTime(iso: string | null | undefined): string {
  const date = parseDate(iso);
  return date ? DATE_TIME_FORMATTER.format(date) : "—";
}

/** "22 Aug 2026 at 11:00 AM" — matches the prototype's request rows. */
export function formatSchedule(isoDate: string | null | undefined, time: string | null | undefined): string {
  const date = parseDate(isoDate);
  if (!date) return time ?? "—";
  const base = DATE_FORMATTER.format(date);
  return time ? `${base} at ${time}` : base;
}

export function formatRelativeTime(iso: string | null | undefined): string {
  const date = parseDate(iso);
  if (!date) return "";

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absolute = Math.abs(diffSeconds);

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absolute < 60) return formatter.format(Math.round(diffSeconds), "second");
  if (absolute < 3600) return formatter.format(Math.round(diffSeconds / 60), "minute");
  if (absolute < 86_400) return formatter.format(Math.round(diffSeconds / 3600), "hour");
  if (absolute < 604_800) return formatter.format(Math.round(diffSeconds / 86_400), "day");

  return DATE_FORMATTER.format(date);
}

/**
 * The API stores every timestamp as DateTime.UtcNow and returns ISO-8601, but
 * ScheduledDate is a plain date that the API compares against UtcNow.Date on the
 * server. Parsing as local time keeps the calendar day stable for the user, which
 * matters because booking dates are always presented as a calendar day.
 */
function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** yyyy-MM-dd for <input type="date">, in the user's local timezone. */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** yyyy-MM-dd for <input type="date">, from an API ISO timestamp. */
export function isoToDateInputValue(iso: string | null | undefined): string {
  const date = parseDate(iso);
  return date ? toDateInputValue(date) : "";
}

/** Today, in the same yyyy-MM-dd shape, for min={} on date inputs. */
export function todayDateInputValue(): string {
  return toDateInputValue(new Date());
}

/**
 * The booking API stores ScheduledTime as a free-form string ("10:00 AM") rather
 * than a time type, so slots are generated as display strings rather than parsed.
 */
export const TIME_SLOTS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
] as const;

/** "Ram Shrestha" -> "RS". Used for the avatar initials in the portal shell. */
export function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** First name only, for greetings like "Good morning, Ram". */
export function firstNameOf(name: string | null | undefined): string {
  if (!name) return "there";
  return name.trim().split(/\s+/)[0] || "there";
}

/** Time-of-day greeting, matching the prototype's "Good Morning, Ram!" heading. */
export function greetingFor(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}