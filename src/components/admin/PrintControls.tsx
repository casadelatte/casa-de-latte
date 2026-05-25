"use client";

import React from "react";
import { FileText, RotateCcw } from "lucide-react";
import { reprintReceipt, type PrintTicketData } from "@/lib/print/ticket";

interface PrintControlsProps {
  lastReceipt: PrintTicketData | null;
  onViewReceipt: () => void;
}

export default function PrintControls({ lastReceipt, onViewReceipt }: PrintControlsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={onViewReceipt}
        disabled={!lastReceipt}
        className="p-2.5 rounded-xl border bg-white/5 border-white/10 text-warm-beige text-xs font-bold flex items-center gap-2 transition hover:border-crema/40 hover:text-crema disabled:opacity-40 disabled:pointer-events-none"
        title="View last receipt"
      >
        <FileText size={15} />
        <span className="hidden sm:inline">View Receipt</span>
      </button>

      {lastReceipt && (
        <button
          type="button"
          onClick={() => reprintReceipt(lastReceipt)}
          className="p-2.5 rounded-xl border bg-white/5 border-white/10 text-warm-beige text-xs font-bold flex items-center gap-2 transition hover:border-crema/40 hover:text-crema"
          title="Reprint last receipt"
        >
          <RotateCcw size={15} />
          <span className="hidden sm:inline">Reprint Last</span>
        </button>
      )}
    </div>
  );
}
