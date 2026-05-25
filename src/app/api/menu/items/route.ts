import { NextResponse } from "next/server";
import { requireAdminSupabase } from "@/lib/admin-api";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function POST(request: Request) {
  const auth = await requireAdminSupabase();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
  }

  try {
    const body = await request.json();
    const {
      id,
      categoryId,
      name,
      price,
      description = "",
      ingredients = [],
      isHotAvailable = false,
      isColdAvailable = false,
      requiresMilkCustomization = false,
      requiresRoastProfile = false,
      isAvailable = true,
      sortOrder = 0,
    } = body;

    if (!categoryId || !name || price == null) {
      return NextResponse.json({ error: "categoryId, name, and price are required." }, { status: 400 });
    }

    const itemId = id || `${slugify(name)}-${Date.now().toString(36)}`;

    const { data, error } = await auth.supabase
      .from("menu_items")
      .insert({
        id: itemId,
        category_id: categoryId,
        name: String(name).trim(),
        price: Number(price),
        description: String(description),
        ingredients: Array.isArray(ingredients) ? ingredients : [],
        is_hot_available: Boolean(isHotAvailable),
        is_cold_available: Boolean(isColdAvailable),
        requires_milk_customization: Boolean(requiresMilkCustomization),
        requires_roast_profile: Boolean(requiresRoastProfile),
        is_available: Boolean(isAvailable),
        sort_order: Number(sortOrder) || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to create menu item.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
