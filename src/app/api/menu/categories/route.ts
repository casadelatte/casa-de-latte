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
    const { id, name, description = "", iconName = "Coffee", sortOrder = 0 } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required." }, { status: 400 });
    }

    const categoryId = id || slugify(String(name));

    const { data, error } = await auth.supabase
      .from("menu_categories")
      .insert({
        id: categoryId,
        name: String(name).trim(),
        description: String(description),
        icon_name: String(iconName),
        sort_order: Number(sortOrder) || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to create category.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
