import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  cartHasRestrictedItems,
  isDevOrderingBypass,
  isOrderingOpen,
  CLOSED_MESSAGE,
} from "@/lib/businessHours";

const ORDER_SELECT =
  "id,order_number,customer_name,car_plate,car_color,status,total_amount,payment_mode,created_at,updated_at";

async function insertOrderRow(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  payload: Record<string, unknown>
) {
  const attempt = await admin.from("orders").insert(payload).select(ORDER_SELECT).single();
  if (
    attempt.error?.message &&
    /mobile_number|column/i.test(attempt.error.message)
  ) {
    const { mobile_number: _m, ...withoutMobile } = payload;
    return admin.from("orders").insert(withoutMobile).select(ORDER_SELECT).single();
  }
  return attempt;
}

export async function POST(request: Request) {
  try {
    const host = request.headers.get("host");
    const body = await request.json();
    const { customerName, mobileNumber, carPlate, carColor, items, totalAmount, paymentMode } =
      body;

    if (!isOrderingOpen(new Date(), host)) {
      return NextResponse.json({ error: CLOSED_MESSAGE }, { status: 403 });
    }

    if (!customerName || !mobileNumber || !carPlate || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Customer name, mobile number, car plate, and items are required." },
        { status: 400 }
      );
    }

    const mobile = String(mobileNumber).replace(/\D/g, "");
    if (mobile.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const devBypass = isDevOrderingBypass(host);
    if (
      !devBypass &&
      cartHasRestrictedItems(
        (items as { categoryId?: string }[]).map((it) => ({
          item: { category: String(it.categoryId ?? "") },
        }))
      )
    ) {
      return NextResponse.json(
        { error: "Some items in your cart are unavailable after 11:45 PM IST." },
        { status: 403 }
      );
    }

    let admin: ReturnType<typeof createSupabaseAdminClient>;
    try {
      admin = createSupabaseAdminClient();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Supabase is not configured.";
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    const orderPayload = {
      customer_name: String(customerName).trim(),
      mobile_number: mobile,
      car_plate: String(carPlate).trim().toUpperCase(),
      car_color: String(carColor || "").trim(),
      total_amount: Number(totalAmount),
      payment_mode: paymentMode || "DEMO",
      status: "PENDING",
    };

    const { data: orderRow, error: orderErr } = await insertOrderRow(admin, orderPayload);
    if (orderErr) throw orderErr;

    const { error: itemsErr } = await admin.from("order_items").insert(
      (items as { name: string; price: number; quantity: number; customizations?: string }[]).map(
        (item) => ({
          order_id: orderRow.id,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          customizations: item.customizations || "",
        })
      )
    );
    if (itemsErr) throw itemsErr;

    const [{ data: fullOrder, error: fullErr }, { data: fullItems, error: fullItemsErr }] =
      await Promise.all([
        admin.from("orders").select(ORDER_SELECT).eq("id", orderRow.id).single(),
        admin
          .from("order_items")
          .select("name,price,quantity,customizations")
          .eq("order_id", orderRow.id),
      ]);
    if (fullErr) throw fullErr;
    if (fullItemsErr) throw fullItemsErr;

    const order = {
      id: fullOrder!.id,
      orderNumber: fullOrder!.order_number,
      customerName: fullOrder!.customer_name,
      carPlate: fullOrder!.car_plate,
      carColor: fullOrder!.car_color,
      status: fullOrder!.status,
      totalAmount: Number(fullOrder!.total_amount),
      paymentMode: fullOrder!.payment_mode,
      createdAt: fullOrder!.created_at,
      updatedAt: fullOrder!.updated_at,
      items: fullItems ?? [],
    };

    return NextResponse.json(order, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create order.";
    console.error("Failed to create order:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "150", 10), 1), 300);

    const { data: orders, error: ordersErr } = await supabase
      .from("orders")
      .select("id,order_number,customer_name,car_plate,car_color,status,total_amount,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (ordersErr) throw ordersErr;

    const orderIds = (orders ?? []).map((o) => o.id);
    let items: {
      order_id: string;
      name: string;
      price: number;
      quantity: number;
      customizations: string;
    }[] = [];

    if (orderIds.length > 0) {
      const { data: itemRows, error: itemsErr } = await supabase
        .from("order_items")
        .select("order_id,name,price,quantity,customizations")
        .in("order_id", orderIds);
      if (itemsErr) throw itemsErr;
      items = itemRows ?? [];
    }

    const itemsByOrder = new Map<string, unknown[]>();
    items.forEach((it) => {
      const arr = itemsByOrder.get(it.order_id) ?? [];
      arr.push({
        name: it.name,
        price: Number(it.price),
        quantity: it.quantity,
        customizations: it.customizations,
      });
      itemsByOrder.set(it.order_id, arr);
    });

    const shaped = (orders ?? []).map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      customerName: o.customer_name,
      carPlate: o.car_plate,
      carColor: o.car_color,
      status: o.status,
      totalAmount: Number(o.total_amount),
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      items: itemsByOrder.get(o.id) ?? [],
    }));

    return NextResponse.json(shaped);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders.";
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
