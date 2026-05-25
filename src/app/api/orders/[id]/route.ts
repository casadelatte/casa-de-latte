import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
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
      items: (items ?? []).map((it: any) => ({
        name: it.name,
        price: Number(it.price),
        quantity: it.quantity,
        customizations: it.customizations,
      })),
    });
  } catch (error: any) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required." },
        { status: 400 }
      );
    }

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
      items: (items ?? []).map((it: any) => ({
        name: it.name,
        price: Number(it.price),
        quantity: it.quantity,
        customizations: it.customizations,
      })),
    });
  } catch (error: any) {
    console.error("Failed to update order status:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
