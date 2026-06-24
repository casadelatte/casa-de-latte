import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  cartHasRestrictedItems,
  isDevOrderingBypass,
  isOrderingOpen,
  CLOSED_MESSAGE,
} from "@/lib/businessHours";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { CreateOrderSchema } from "@/lib/validation";

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDER_SELECT =
  "id,order_number,customer_name,car_plate,car_color,status,total_amount,payment_mode,created_at,updated_at";

/** Maximum accepted request body size in bytes (32 KB). */
const MAX_BODY_BYTES = 32 * 1024;

/** Rate limit: 10 order creation requests per IP per 10 minutes. */
const ORDER_RATE_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── POST /api/orders ─────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // 1. Request size limit
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body too large." },
        { status: 413 }
      );
    }

    // 2. Rate limiting (per IP)
    const ip = getClientIp(request);
    const rl = rateLimit(`orders:${ip}`, ORDER_RATE_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a few minutes and try again." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    // 3. Parse body (with size guard — read at most MAX_BODY_BYTES)
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

    // 4. Zod schema validation (strict — rejects extra fields)
    const result = CreateOrderSchema.safeParse(parsed);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const formErrors = result.error.flatten().formErrors;
      return NextResponse.json(
        {
          error: "Validation failed.",
          details: { ...fieldErrors, ...(formErrors.length ? { _form: formErrors } : {}) },
        },
        { status: 400 }
      );
    }

    const { customerName, mobileNumber, carPlate, carColor, items, totalAmount, paymentMode } =
      result.data;

    // 5. Business-hours check
    const host = request.headers.get("host");
    if (!isOrderingOpen(new Date(), host)) {
      return NextResponse.json({ error: CLOSED_MESSAGE }, { status: 403 });
    }

    // 6. Late-night restricted items check
    const devBypass = isDevOrderingBypass(host);
    if (
      !devBypass &&
      cartHasRestrictedItems(
        items.map((it) => ({
          item: { category: String(it.categoryId ?? "") },
        }))
      )
    ) {
      return NextResponse.json(
        { error: "Some items in your cart are unavailable after 11:45 PM IST." },
        { status: 403 }
      );
    }

    // 7. Admin Supabase client
    let admin: ReturnType<typeof createSupabaseAdminClient>;
    try {
      admin = createSupabaseAdminClient();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Supabase is not configured.";
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    // 8. Insert order
    const orderPayload = {
      customer_name: customerName,
      mobile_number: mobileNumber,
      car_plate: carPlate,
      car_color: carColor ?? "",
      total_amount: totalAmount,
      payment_mode: paymentMode,
      status: "PENDING",
    };

    const { data: orderRow, error: orderErr } = await insertOrderRow(admin, orderPayload);
    if (orderErr) throw orderErr;

    const { error: itemsErr } = await admin.from("order_items").insert(
      items.map((item) => ({
        order_id: orderRow.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        customizations: item.customizations ?? "",
      }))
    );
    if (itemsErr) throw itemsErr;

    // 9. Fetch the full created order to return
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
    // Never leak raw DB error messages to the client.
    console.error("Failed to create order:", error);
    return NextResponse.json({ error: "Failed to create order. Please try again." }, { status: 500 });
  }
}

// ─── GET /api/orders ──────────────────────────────────────────────────────────

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
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}
