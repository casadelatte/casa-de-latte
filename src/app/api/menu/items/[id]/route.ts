import { NextResponse } from "next/server";
import { requireAdminSupabase } from "@/lib/admin-api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSupabase();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const patch: Record<string, unknown> = {};
    if (body.name != null) patch.name = String(body.name).trim();
    if (body.price != null) patch.price = Number(body.price);
    if (body.description != null) patch.description = String(body.description);
    if (body.categoryId != null) patch.category_id = body.categoryId;
    if (body.ingredients != null) patch.ingredients = body.ingredients;
    if (body.isHotAvailable != null) patch.is_hot_available = Boolean(body.isHotAvailable);
    if (body.isColdAvailable != null) patch.is_cold_available = Boolean(body.isColdAvailable);
    if (body.requiresMilkCustomization != null) {
      patch.requires_milk_customization = Boolean(body.requiresMilkCustomization);
    }
    if (body.requiresRoastProfile != null) {
      patch.requires_roast_profile = Boolean(body.requiresRoastProfile);
    }
    if (body.isAvailable != null) patch.is_available = Boolean(body.isAvailable);
    if (body.sortOrder != null) patch.sort_order = Number(body.sortOrder);

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("menu_items")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to update menu item.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSupabase();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
  }

  try {
    const { id } = await params;
    const { error } = await auth.supabase.from("menu_items").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to delete menu item.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
