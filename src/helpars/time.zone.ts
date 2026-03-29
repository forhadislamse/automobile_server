// utils/dateParser.ts
type MaybeString = string | undefined | null;

/**
 * Parse many common date formats:
 * - d/m/yyyy, d-m-yyyy
 * - m/d/yyyy, m-d-yyyy
 * - yyyy/m/d, yyyy-m-d
 * - ISO with timezone => Date constructor
 *
 * timezoneOffsetMinutes: optional. This should be the client's `new Date().getTimezoneOffset()` value.
 *   - getTimezoneOffset() returns (UTC - local) in minutes. Example: for Asia/Dhaka (UTC+6) it returns -360.
 * If timezoneOffsetMinutes is provided, we interpret the input as local date/time in that client timezone
 * and convert to a proper UTC Date (so DB stores correct instant).
 *
 * Defaults/assumptions:
 * - ambiguous numeric orders (e.g. 03/04/2025) -> assume d/m/yyyy (non-US default).
 */
export function parseFlexibleDateToUTC(
  input: MaybeString,
  timezoneOffsetMinutes?: number // client-side getTimezoneOffset()
): Date | null {
  if (!input) return null;

  const raw = String(input).trim();

  // If looks like ISO with timezone or full ISO, try direct Date parse first
  // (ISO with offset like 2025-09-26T00:00:00+06:00 is safe)
  const isoLike = /^\d{4}-\d{2}-\d{2}T.*|^\d{4}-\d{2}-\d{2}$/.test(raw);
  if (isoLike) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d; // parsed successfully
  }

  // Normalize separators to '-'
  const s = raw.replace(/\//g, "-").replace(/\s+/g, "");
  const parts = s.split("-").filter(Boolean);

  // helper to toInt
  const toInt = (v?: string) => (v ? parseInt(v, 10) : NaN);

  let year: number | null = null;
  let month: number | null = null; // 1-12
  let day: number | null = null;
  let hour = 0;
  let minute = 0;

  // If contains time part like "26-09-2025T13:20" or "26-09-2025 13:20"
  let datePart = s;
  let timePart: string | null = null;
  if (s.includes("T")) {
    [datePart, timePart] = s.split("T");
  } else if (raw.includes(" ")) {
    const idx = s.indexOf(" ");
    if (idx > 0) {
      datePart = s.slice(0, idx);
      timePart = s.slice(idx + 1);
    }
  }

  const dateParts = datePart.split("-").filter(Boolean);

  if (dateParts.length === 3) {
    const [p1, p2, p3] = dateParts;
    // detect year position
    if (p1.length === 4) {
      // yyyy-mm-dd
      year = toInt(p1);
      month = toInt(p2);
      day = toInt(p3);
    } else if (p3.length === 4) {
      // assume dd-mm-yyyy or mm-dd-yyyy
      // Ambiguity when both p1 and p2 <= 12. Default to dd-mm-yyyy (non-US).
      const a = toInt(p1);
      const b = toInt(p2);
      const c = toInt(p3);
      year = c;
      // decide month/day
      if (a > 12) {
        // a must be day
        day = a;
        month = b;
      } else if (b > 12) {
        // b must be day
        day = b;
        month = a;
      } else {
        // both <= 12 -> ambiguous, assume d/m/y
        day = a;
        month = b;
      }
    } else {
      // fallback attempt
      year = toInt(p3);
      month = toInt(p2);
      day = toInt(p1);
    }
  } else {
    // unknown format
    return null;
  }

  // parse time if present
  if (timePart) {
    const tm = timePart.split(":");
    if (tm.length >= 1) hour = toInt(tm[0]) || 0;
    if (tm.length >= 2) minute = toInt(tm[1]) || 0;
  }

  if (!year || !month || !day) return null;

  // Validate ranges
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  // Convert local client components to a UTC timestamp:
  // Build a UTC milliseconds for the given Y-M-D h:m considered AS IF they are UTC,
  // then subtract the client's timezone offset to get the correct UTC instant.
  // Calculation:
  //   utcMillis = Date.UTC(year, month-1, day, hour, minute) - (timezoneOffsetMinutes * 60 * 1000)
  // Example: local Dhaka midnight -> timezoneOffsetMinutes = -360
  // Date.UTC(...) gives 00:00 UTC for those components; minus (-360min) => +6h => 06:00 UTC => correct instant.
  const baseUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);

  let utcMs = baseUtcMs;
  if (typeof timezoneOffsetMinutes === "number") {
    utcMs = baseUtcMs - timezoneOffsetMinutes * 60 * 1000;
  } else {
    // If we don't have client tz offset, we will assume server local interpretation:
    // create a Date using local constructor and take its UTC time.
    // This is less reliable across server timezones, so prefer passing timezoneOffsetMinutes from client.
    const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
    utcMs = localDate.getTime();
  }

  const finalDate = new Date(utcMs);
  if (isNaN(finalDate.getTime())) return null;
  return finalDate;
}

// simple date parser (supports d/m/y, m-d-y, y/m/d)
export const parseDate = (input: string): Date => {
  if (!input) throw new Error("expiryDate is required");

  const raw = input.trim();
  const parts = raw.split(/[/-]/).map(Number);

  if (parts.length !== 3) throw new Error("Invalid expiryDate format");

  let day: number, month: number, year: number;

  if (parts[0] > 12 && parts[1] <= 12) {
    // dd-mm-yyyy
    [day, month, year] = parts;
  } else if (parts[1] > 12 && parts[0] <= 12) {
    // mm-dd-yyyy
    [month, day, year] = parts;
  } else {
    // default yyyy-mm-dd
    [year, month, day] = parts;
  }

  const parsed = new Date(year, month - 1, day);
  if (isNaN(parsed.getTime())) throw new Error("Invalid expiryDate format");

  return parsed;
};
