import { cookies } from "next/headers";

/**
 * Legacy cookie-based admin session — superseded by Supabase Auth.
 * Retained only to prevent import errors; always returns false.
 *
 * SECURITY: All credential constants and their hardcoded fallbacks have been
 * removed. Admin authentication is handled exclusively by Supabase Auth
 * (see /admin/login and middleware.ts).
 */
export const SESSION_COOKIE = "cdl_admin_session";

export async function getAdminSession(): Promise<boolean> {
  try {
    // Legacy session check — always returns false now that Supabase Auth is used.
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);
    // No valid secret to compare against; always deny.
    return session?.value === undefined ? false : false;
  } catch {
    return false;
  }
}
