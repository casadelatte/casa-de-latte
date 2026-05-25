/**
 * ESC/POS command builders for 58mm / 80mm thermal printers.
 * Use with Bluetooth/USB raw print apps or future native bridge.
 */

const ESC = 0x1b;
const GS = 0x1d;

export function escInit(): Uint8Array {
  return new Uint8Array([ESC, 0x40]);
}

export function escAlign(mode: "left" | "center" | "right"): Uint8Array {
  const n = mode === "left" ? 0 : mode === "center" ? 1 : 2;
  return new Uint8Array([ESC, 0x61, n]);
}

export function escBold(on: boolean): Uint8Array {
  return new Uint8Array([ESC, 0x45, on ? 1 : 0]);
}

export function escDoubleHeight(on: boolean): Uint8Array {
  return new Uint8Array([GS, 0x21, on ? 0x11 : 0x00]);
}

export function escText(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

export function escNewLine(lines = 1): Uint8Array {
  return escText("\n".repeat(lines));
}

export function escCut(partial = false): Uint8Array {
  return new Uint8Array([GS, 0x56, partial ? 1 : 0]);
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

export interface EscPosReceiptInput {
  orderNumber: number;
  customerName: string;
  carPlate: string;
  carColor: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    customizations?: string;
  }>;
  totalAmount: number;
  createdAt: string;
  status?: string;
}

/** Build a raw ESC/POS byte stream (UTF-8 text mode). */
export function buildEscPosReceipt(data: EscPosReceiptInput): Uint8Array {
  const created = new Date(data.createdAt);
  const dateStr = created.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = created.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const subtotal = data.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const taxes = Math.max(0, data.totalAmount - subtotal);
  const orderLabel = `#${data.orderNumber?.toString().padStart(3, "0")}`;

  const lines: Uint8Array[] = [
    escInit(),
    escAlign("center"),
    escBold(true),
    escText("CASA DE LATTE\n"),
    escBold(false),
    escText("Drive-In Receipt\n"),
    escNewLine(),
    escAlign("left"),
    escBold(true),
    escDoubleHeight(true),
    escText(`ORDER ${orderLabel}\n`),
    escDoubleHeight(false),
    escBold(false),
    escText(`${dateStr} ${timeStr}\n`),
    escText("--------------------------------\n"),
    escText(`Customer: ${data.customerName}\n`),
    escBold(true),
    escText(`VEHICLE: ${data.carPlate}\n`),
    escText(`${data.carColor || "—"}\n`),
    escBold(false),
    escText("--------------------------------\n"),
  ];

  for (const it of data.items) {
    lines.push(escText(`${it.quantity}x ${it.name}\n`));
    if (it.customizations) {
      lines.push(escText(`  ${it.customizations}\n`));
    }
    lines.push(
      escText(`  Rs.${(it.price * it.quantity).toFixed(2)}\n`)
    );
  }

  lines.push(
    escText("--------------------------------\n"),
    escText(`Subtotal     Rs.${subtotal.toFixed(2)}\n`),
    escText(`GST (5%)     Rs.${taxes.toFixed(2)}\n`),
    escBold(true),
    escText(`TOTAL        Rs.${data.totalAmount.toFixed(2)}\n`),
    escBold(false),
    escText("--------------------------------\n"),
    escAlign("center"),
    escText("Pay at delivery\n"),
    escText("Thank you!\n"),
    escText("Designed & Developed by\n"),
    escText("Arbab Ansar Ali\n"),
    escNewLine(3),
    escCut()
  );

  return concatBytes(...lines);
}
