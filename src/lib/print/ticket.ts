import { buildEscPosReceipt, type EscPosReceiptInput } from "./escpos";

export const RECEIPT_CREDIT = "Designed & Developed by Arbab Ansar Ali";
export const GST_RATE = 0.05;

export type PrintTicketData = EscPosReceiptInput & {
  status: string;
};

export interface PrintOptions {
  /** Trigger browser print dialog (unreliable on some POS browsers). */
  autoPrint?: boolean;
}

export interface ReceiptTotals {
  subtotal: number;
  gst: number;
  total: number;
}

export function calculateReceiptTotals(data: Pick<PrintTicketData, "items" | "totalAmount">): ReceiptTotals {
  const subtotal = data.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const gstFromTotal = Math.max(0, data.totalAmount - subtotal);
  const gstCalculated = Math.round(subtotal * GST_RATE * 100) / 100;
  const gst = gstFromTotal > 0 ? gstFromTotal : gstCalculated;
  return {
    subtotal,
    gst,
    total: data.totalAmount,
  };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildTicketHtml(data: PrintTicketData, options: { showToolbar?: boolean } = {}): string {
  const { showToolbar = true } = options;
  const createdDate = new Date(data.createdAt);
  const dateStr = createdDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = createdDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const { subtotal, gst, total } = calculateReceiptTotals(data);
  const orderNum = data.orderNumber?.toString().padStart(3, "0");

  const itemRows = data.items
    .map(
      (it) =>
        `<tr>
          <td>
            <strong>${it.quantity}×</strong> ${escapeHtml(it.name)}
            ${it.customizations ? `<span class="receipt-item-meta">${escapeHtml(it.customizations)}</span>` : ""}
          </td>
          <td>₹${(it.price * it.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const toolbar = showToolbar
    ? `<div class="receipt-toolbar no-print">
        <button type="button" onclick="window.print()">Print</button>
        <button type="button" class="secondary" onclick="window.close()">Close</button>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Order #${orderNum} — Casa De Latte</title>
  <link rel="stylesheet" href="/receipt-print.css" />
</head>
<body class="receipt-body">
  ${toolbar}
  <div class="receipt-center">
    <img src="/casa-logo.png" alt="Casa De Latte" class="receipt-logo" width="52" height="52" />
    <div class="receipt-brand">CASA DE LATTE</div>
    <div class="receipt-tagline">Specialty Coffee</div>
    <div class="receipt-tagline">Drive-In Order Receipt</div>
  </div>
  <hr class="receipt-divider-solid" />
  <div class="receipt-center">
    <div class="receipt-label">Order Number</div>
    <div class="receipt-order-num">#${orderNum}</div>
  </div>
  <hr class="receipt-divider" />
  <div>
    <div class="receipt-label">Date &amp; Time</div>
    <div class="receipt-value">${dateStr} · ${timeStr}</div>
  </div>
  <div style="margin-top:6px;">
    <div class="receipt-label">Customer Name</div>
    <div class="receipt-value">${escapeHtml(data.customerName)}</div>
  </div>
  <div class="receipt-vehicle">
    <div class="receipt-label receipt-center">Vehicle</div>
    <div class="receipt-plate">${escapeHtml(data.carPlate)}</div>
    <div class="receipt-plate-sub">${escapeHtml(data.carColor || "Color not specified")}</div>
  </div>
  <hr class="receipt-divider" />
  <div class="receipt-label" style="margin-bottom:4px;">Ordered Items</div>
  <table class="receipt-items">
    ${itemRows}
  </table>
  <table class="receipt-items receipt-totals" style="margin-top:8px;">
    <tr>
      <td>Subtotal</td>
      <td>₹${subtotal.toFixed(2)}</td>
    </tr>
    <tr>
      <td>GST (5%)</td>
      <td>₹${gst.toFixed(2)}</td>
    </tr>
    <tr class="receipt-grand">
      <td>TOTAL</td>
      <td>₹${total.toFixed(2)}</td>
    </tr>
  </table>
  <hr class="receipt-divider" />
  <div class="receipt-footer">
    <div>Payment: Cash at Delivery</div>
    <div style="margin-top:4px;">Thank you for choosing Casa De Latte!</div>
    <div class="receipt-credit">${escapeHtml(RECEIPT_CREDIT)}</div>
  </div>
</body>
</html>`;
}

function openReceiptWindow(html: string, autoPrint: boolean): Window | null {
  const win = window.open("", "_blank", "width=400,height=720,scrollbars=yes");
  if (!win) {
    alert("Pop-up blocked. Allow pop-ups to open receipts.");
    return null;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  if (autoPrint) {
    win.addEventListener("load", () => {
      setTimeout(() => {
        win.print();
      }, 400);
    });
  }
  return win;
}

/** Open receipt in a new tab for viewing (recommended on POS browsers). */
export function viewReceipt(data: PrintTicketData) {
  openReceiptWindow(buildTicketHtml(data, { showToolbar: true }), false);
}

export function openReceipt(data: PrintTicketData) {
  viewReceipt(data);
}

/** @deprecated Prefer viewReceipt — kept for callers that explicitly want print dialog */
export function printTicket(data: PrintTicketData, options: PrintOptions = {}) {
  const { autoPrint = false } = options;
  openReceiptWindow(buildTicketHtml(data), autoPrint);
}

export function reprintReceipt(data: PrintTicketData) {
  viewReceipt(data);
}

export function printTestTicket() {
  const now = new Date().toISOString();
  viewReceipt({
    orderNumber: 0,
    customerName: "Test Customer",
    carPlate: "TEST 1234",
    carColor: "Silver",
    status: "TEST",
    totalAmount: 281.45,
    createdAt: now,
    items: [
      { name: "Latte", price: 169, quantity: 1, customizations: "Whole Milk, Hot, Medium Roast" },
      { name: "Butter Croissant", price: 100, quantity: 1, customizations: "" },
    ],
  });
}

export function downloadEscPosReceipt(data: PrintTicketData) {
  const bytes = buildEscPosReceipt(data);
  const blob = new Blob([Uint8Array.from(bytes)], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cdl-order-${data.orderNumber?.toString().padStart(3, "0") || "ticket"}.bin`;
  a.click();
  URL.revokeObjectURL(url);
}

export function orderToReceiptData(order: {
  orderNumber: number;
  customerName: string;
  carPlate: string;
  carColor: string;
  items: PrintTicketData["items"];
  totalAmount: number;
  createdAt: string;
  status: string;
}): PrintTicketData {
  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    carPlate: order.carPlate,
    carColor: order.carColor,
    items: order.items,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    status: order.status,
  };
}
