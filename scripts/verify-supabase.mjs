import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal } from "./load-env.mjs";

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const tables = ["profiles", "menu_categories", "menu_items", "orders", "order_items"];

async function main() {
  console.log("Supabase URL:", url);
  const results = {};

  for (const table of tables) {
    const { error, count } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) {
      results[table] = { ok: false, error: error.message };
    } else {
      results[table] = { ok: true, count: count ?? 0 };
    }
  }

  console.log(JSON.stringify(results, null, 2));

  const allOk = Object.values(results).every((r) => r.ok);
  if (!allOk) {
    console.error("\nSome tables are missing. Run: npm run db:migrate");
    process.exit(1);
  }

  console.log(
    `\nMenu: ${results.menu_categories.count} categories, ${results.menu_items.count} items`
  );
  console.log(`Orders: ${results.orders.count} orders`);

  if (results.menu_items.count === 0) {
    console.warn("\nMenu is empty. Run: npm run db:seed");
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
