"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import {
  calculateReceiptTotals,
  RECEIPT_CREDIT,
  viewReceipt,
  type PrintTicketData,
} from "@/lib/print/ticket";

interface ReceiptPreviewModalProps {
  receipt: PrintTicketData | null;
  onClose: () => void;
}

export default function ReceiptPreviewModal({ receipt, onClose }: ReceiptPreviewModalProps) {
  const totals = useMemo(
    () => (receipt ? calculateReceiptTotals(receipt) : null),
    [receipt]
  );

  if (!receipt || !totals) return null;

  const created = new Date(receipt.createdAt);
  const orderNum = receipt.orderNumber?.toString().padStart(3, "0");

  return (
    <AnimatePresence>
      {receipt && (
        <motion.div
          key="receipt-preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[8000] flex items-end sm:items-center justify-center p-4 bg-black/80"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#faf8f5] text-[#111] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-mono text-xs"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 bg-white">
              <span className="font-bold text-sm text-[#111] uppercase tracking-wider">
                Receipt #{orderNum}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-black/5 text-[#333]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-3 flex-1">
              <div className="text-center border-b border-dashed border-black/20 pb-3">
                <img src="/casa-logo.png" alt="" className="w-12 h-12 mx-auto mb-2 object-contain" />
                <div className="font-serif font-black text-base tracking-[0.2em]">CASA DE LATTE</div>
                <div className="text-[9px] uppercase tracking-widest text-black/50 mt-1">
                  Drive-In Order Receipt
                </div>
              </div>

              <div className="text-center">
                <div className="text-[9px] uppercase text-black/45">Order #</div>
                <div className="text-2xl font-black">#{orderNum}</div>
              </div>

              <div className="text-[10px] space-y-1">
                <div>
                  <span className="text-black/45 uppercase text-[8px]">Date &amp; time · </span>
                  {created.toLocaleString("en-IN")}
                </div>
                <div>
                  <span className="text-black/45 uppercase text-[8px]">Customer · </span>
                  <strong>{receipt.customerName}</strong>
                </div>
              </div>

              <div className="border-2 border-black rounded-lg p-2 text-center bg-black/[0.03]">
                <div className="text-[8px] uppercase text-black/45">Vehicle</div>
                <div className="text-lg font-black tracking-widest">{receipt.carPlate}</div>
                <div className="text-[10px] text-black/55">{receipt.carColor || "—"}</div>
              </div>

              <div className="space-y-2 border-t border-dashed border-black/15 pt-2">
                {receipt.items.map((it, i) => (
                  <div key={i} className="flex justify-between gap-2 border-b border-dashed border-black/10 pb-1.5">
                    <div>
                      <span className="font-bold">
                        {it.quantity}× {it.name}
                      </span>
                      {it.customizations && (
                        <span className="block text-[9px] text-black/50">{it.customizations}</span>
                      )}
                    </div>
                    <span className="font-bold shrink-0">₹{(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1 border-t-2 border-black">
                <div className="flex justify-between text-[10px]">
                  <span>Subtotal</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>GST (5%)</span>
                  <span>₹{totals.gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black pt-1">
                  <span>TOTAL</span>
                  <span>₹{totals.total.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-center text-[8px] text-black/45 pt-2 border-t border-dashed border-black/15">
                {RECEIPT_CREDIT}
              </p>
            </div>

            <div className="p-3 border-t border-black/10 flex gap-2 bg-white">
              <button
                type="button"
                onClick={() => viewReceipt(receipt)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#c7a17a] text-[#0c0a09] font-bold text-[10px] uppercase py-3 rounded-xl"
              >
                <ExternalLink size={14} />
                Open Full Receipt
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-xl border border-black/15 text-[10px] font-bold uppercase"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
