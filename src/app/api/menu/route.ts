import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminSupabase } from "@/lib/admin-api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");

    let supabase;
    let adminView = false;

    if (scope === "admin") {
      const auth = await requireAdminSupabase();
      if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
      }
      supabase = auth.supabase;
      adminView = true;
    } else {
      supabase = await createSupabaseServerClient();
    }

    const itemFieldsFull =
      "id,category_id,name,price,description,ingredients,is_hot_available,is_cold_available,requires_milk_customization,requires_roast_profile,is_available,sort_order";
    const itemFieldsBase =
      "id,category_id,name,price,description,ingredients,is_hot_available,is_cold_available,requires_milk_customization,is_available,sort_order";

    const loadItems = async (fields: string) => {
      let q = supabase.from("menu_items").select(fields).order("sort_order", { ascending: true });
      if (!adminView) q = q.eq("is_available", true);
      return q;
    };

    const [{ data: categories, error: catErr }, itemsResult] = await Promise.all([
      supabase
        .from("menu_categories")
        .select("id,name,description,icon_name,sort_order")
        .order("sort_order", { ascending: true }),
      loadItems(itemFieldsFull),
    ]);

    if (catErr) throw catErr;

    let items = itemsResult.data;
    let itemErr = itemsResult.error;
    if (itemErr?.message?.includes("requires_roast_profile")) {
      const fallback = await loadItems(itemFieldsBase);
      items = fallback.data;
      itemErr = fallback.error;
    }
    if (itemErr) throw itemErr;

    return NextResponse.json({ categories: categories ?? [], items: items ?? [] });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to load menu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
