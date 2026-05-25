/**
 * Links an existing Supabase Auth user to profiles (role=admin).
 * Set ADMIN_EMAIL in .env.local to the staff login email, then run: npm run db:admin-profile
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!adminEmail) {
  console.error("Set ADMIN_EMAIL in .env.local (must match a Supabase Auth user email).");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;

  const email = adminEmail!;
  const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error(
      `No Auth user found for ${adminEmail}. Create the user in Supabase Dashboard → Authentication → Users first.`
    );
    process.exit(1);
  }

  const { error: profileErr } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: user.email,
      role: "admin",
    },
    { onConflict: "id" }
  );

  if (profileErr) throw profileErr;

  console.log(`Admin profile linked for ${adminEmail} (${user.id}).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
