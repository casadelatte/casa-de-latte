import { cookies } from "next/headers";

// Demo admin credentials — override with env vars in production
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "casadelatte2026";
export const SESSION_COOKIE = "cdl_admin_session";
export const SESSION_SECRET = process.env.SESSION_SECRET || "casadelatte_secret_key_2026";

export async function getAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);
    return session?.value === SESSION_SECRET;
  } catch {
    return false;
  }
}
