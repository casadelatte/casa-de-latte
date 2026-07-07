import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PatchOrderSchema } from "@/lib/validation";

/** Maximum accepted request body size in bytes (4 KB — status update only). */
const MAX_BODY_BYTES = 4 * 1024;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = createSupabaseAdminClient();

    const [{ data: order, error: orderErr }, { data: items, error: itemsErr }] = await Promise.all([
      admin
        .from("orders")
        .select("id,order_number,customer_name,car_plate,car_color,status,total_amount,created_at")
        .eq("id", id)
        .single(),
      admin.from("order_items").select("name,price,quantity,customizations").eq("order_id", id),
    ]);

    if (orderErr) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (itemsErr) throw itemsErr;

    // Public endpoint (customer tracking): only returns the order by id.
    return NextResponse.json({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      carPlate: order.car_plate,
      carColor: order.car_color,
      status: order.status,
      totalAmount: Number(order.total_amount),
      createdAt: order.created_at,
      items: (items ?? []).map((it: { name: string; price: number; quantity: number; customizations: string }) => ({
        name: it.name,
        price: Number(it.price),
        quantity: it.quantity,
        customizations: it.customizations,
      })),
    });
  } catch (error: unknown) {
    // Never leak raw DB error messages to the client.
    console.error("Failed to fetch order:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Request size limit (4 KB — status string only)
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body too large." }, { status: 413 });
    }

    // 2. Auth check — must be a logged-in admin
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 3. Parse body with size guard
    let rawBody: string;
    try {
      rawBody = await request.text();
    } catch {
      return NextResponse.json({ error: "Failed to read request body." }, { status: 400 });
    }

    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body too large." }, { status: 413 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
    }

    // 4. Zod validation — status must be from the allowlist; no extra fields accepted
    const result = PatchOrderSchema.safeParse(parsed);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed.", details: fieldErrors },
        { status: 400 }
      );
    }

    const { id } = await params;
    const { status } = result.data;

    // 5. Terminal-state guard — CANCELLED and COMPLETED orders are immutable
    const { data: existing, error: existingErr } = await supabase
      .from("orders")
      .select("status")
      .eq("id", id)
      .single();
    if (existingErr || !existing) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    const TERMINAL_STATUSES = ["CANCELLED", "COMPLETED"] as const;
    if (TERMINAL_STATUSES.includes(existing.status as (typeof TERMINAL_STATUSES)[number])) {
      return NextResponse.json(
        { error: `Order is already ${existing.status.toLowerCase()} and cannot be modified.` },
        { status: 409 }
      );
    }

    // 6. Update order status
    const { data: updated, error: updErr } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select("id,order_number,customer_name,car_plate,car_color,status,total_amount,created_at,updated_at")
      .single();
    if (updErr) throw updErr;

    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("name,price,quantity,customizations")
      .eq("order_id", id);
    if (itemsErr) throw itemsErr;

    return NextResponse.json({
      id: updated.id,
      orderNumber: updated.order_number,
      customerName: updated.customer_name,
      carPlate: updated.car_plate,
      carColor: updated.car_color,
      status: updated.status,
      totalAmount: Number(updated.total_amount),
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      items: (items ?? []).map((it: { name: string; price: number; quantity: number; customizations: string }) => ({
        name: it.name,
        price: Number(it.price),
        quantity: it.quantity,
        customizations: it.customizations,
      })),
    });
  } catch (error: unknown) {
    // Never leak raw DB error messages to the client.
    console.error("Failed to update order status:", error);
    return NextResponse.json({ error: "Failed to update order status." }, { status: 500 });
  }
}
