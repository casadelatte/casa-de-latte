import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { SEED_CATEGORIES, SEED_ITEMS } from "../src/lib/menuSeedData";

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

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  console.log(`Seeding ${SEED_CATEGORIES.length} categories, ${SEED_ITEMS.length} items...`);

  const categoryRows = SEED_CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    icon_name: c.iconName,
    sort_order: c.sortOrder,
  }));

  const { error: catErr } = await supabase.from("menu_categories").upsert(categoryRows, { onConflict: "id" });
  if (catErr) throw catErr;

  const itemRows = SEED_ITEMS.map((i) => ({
    id: i.id,
    category_id: i.categoryId,
    name: i.name,
    price: i.price,
    description: i.description || "",
    ingredients: i.ingredients || [],
    is_hot_available: Boolean(i.isHotAvailable),
    is_cold_available: Boolean(i.isColdAvailable),
    requires_milk_customization: Boolean(i.requiresMilkCustomization),
    is_available: true,
    sort_order: i.sortOrder,
  }));

  const { error: itemErr } = await supabase.from("menu_items").upsert(itemRows, { onConflict: "id" });
  if (itemErr) throw itemErr;

  const { count: catCount } = await supabase.from("menu_categories").select("*", { count: "exact", head: true });
  const { count: itemCount } = await supabase.from("menu_items").select("*", { count: "exact", head: true });

  console.log(`Done. Database now has ${catCount} categories and ${itemCount} menu items.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
