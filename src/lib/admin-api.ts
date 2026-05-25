import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Returns Supabase client + user when the request is from an admin (profiles.role = admin). */
export async function requireAdminSupabase() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { supabase, user: null, error: "Unauthorized" as const };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { supabase, user: null, error: "Forbidden" as const };
  }

  return { supabase, user, error: null };
}
