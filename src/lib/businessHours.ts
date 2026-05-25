/** Casa De Latte ordering windows — Asia/Kolkata (IST) only. */

export const TIMEZONE = "Asia/Kolkata";

/** Categories unavailable after 11:45 PM IST */
export const LATE_NIGHT_CATEGORY_IDS = new Set(["crushed-affairs", "sandwich-bagel"]);

const OPEN_START_MIN = 7 * 60 + 30; // 07:30
const OPEN_END_MIN = 15; // 00:15 (12:15 AM)
const LATE_NIGHT_START_MIN = 23 * 60 + 45; // 23:45

export function getISTMinutes(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Local dev/testing only: bypass closed-hours gate for ordering.
 * Production (Vercel) always uses real IST hours. Late-night rules unchanged.
 */
export function isDevOrderingBypass(hostHeader?: string | null): boolean {
  if (process.env.NODE_ENV === "development") return true;

  if (hostHeader) {
    const host = hostHeader.split(":")[0].toLowerCase();
    if (LOCAL_HOSTS.has(host)) return true;
  }

  if (typeof window !== "undefined") {
    if (LOCAL_HOSTS.has(window.location.hostname)) return true;
  }

  return false;
}

/** Open 07:30 → 12:15 AM (next calendar day segment 00:00–00:15). */
export function isOrderingOpen(now = new Date(), hostHeader?: string | null): boolean {
  if (isDevOrderingBypass(hostHeader)) return true;

  const m = getISTMinutes(now);
  if (m >= OPEN_START_MIN) return true;
  if (m <= OPEN_END_MIN) return true;
  return false;
}

export function isLateNightRestricted(now = new Date()): boolean {
  const m = getISTMinutes(now);
  return m >= LATE_NIGHT_START_MIN || m <= OPEN_END_MIN;
}

export function isCategoryUnavailableLateNight(categoryId: string, now = new Date()): boolean {
  if (!LATE_NIGHT_CATEGORY_IDS.has(categoryId)) return false;
  return isLateNightRestricted(now);
}

export function cartHasRestrictedItems(
  items: Array<{ item: { category: string } }>,
  now = new Date()
): boolean {
  if (!isLateNightRestricted(now)) return false;
  return items.some((c) => LATE_NIGHT_CATEGORY_IDS.has(c.item.category));
}

export const CLOSED_MESSAGE =
  "We're currently closed. Drive-in ordering is available daily from 7:30 AM to 12:15 AM (IST).";

export const LATE_NIGHT_LABEL = "Unavailable after 11:45 PM";
