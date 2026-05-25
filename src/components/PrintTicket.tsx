"use client";

import React from "react";
import { printTicket, type PrintTicketData } from "@/lib/print/ticket";

export type { PrintTicketData };
export { printTicket, printTestTicket, downloadEscPosReceipt } from "@/lib/print/ticket";

export default function PrintTicket({ data }: { data: PrintTicketData }) {
  return (
    <button
      type="button"
      onClick={() => printTicket(data, { autoPrint: true })}
      className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-warm-beige text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
      title="Print Ticket"
    >
      🖨 Print
    </button>
  );
}
