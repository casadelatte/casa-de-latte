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
    if (body.description != null) patch.description = String(body.description);
    if (body.iconName != null) patch.icon_name = String(body.iconName);
    if (body.sortOrder != null) patch.sort_order = Number(body.sortOrder);

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("menu_categories")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to update category.";
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
    const { count, error: countErr } = await auth.supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);
    if (countErr) throw countErr;
    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: "Remove or reassign all items in this category before deleting." },
        { status: 400 }
      );
    }

    const { error } = await auth.supabase.from("menu_categories").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to delete category.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
