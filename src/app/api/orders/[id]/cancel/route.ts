import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/orders/[id]/cancel
 *
 * Public customer-facing endpoint. Allows cancelling an order only when its
 * current status is PENDING. Orders that have progressed (PREPARING, READY,
 * COMPLETED) cannot be cancelled by the customer.
 *
 * No admin auth is required — the guard is the status check itself.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string" || id.length > 100) {
      return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    // 1. Fetch current order status (using admin client so no auth cookie needed)
    const { data: order, error: fetchErr } = await admin
      .from("orders")
      .select("id, status")
      .eq("id", id)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // 2. Only PENDING orders may be cancelled by the customer
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "This order can no longer be cancelled." },
        { status: 409 }
      );
    }

    // 3. Set status to CANCELLED
    const { data: updated, error: updateErr } = await admin
      .from("orders")
      .update({ status: "CANCELLED" })
      .eq("id", id)
      .select("id, order_number, customer_name, car_plate, car_color, status, total_amount, created_at")
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({
      id: updated.id,
      orderNumber: updated.order_number,
      customerName: updated.customer_name,
      carPlate: updated.car_plate,
      carColor: updated.car_color,
      status: updated.status,
      totalAmount: Number(updated.total_amount),
      createdAt: updated.created_at,
    });
  } catch (error: unknown) {
    console.error("Failed to cancel order:", error);
    return NextResponse.json({ error: "Failed to cancel order." }, { status: 500 });
  }
}
