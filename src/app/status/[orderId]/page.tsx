"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FloatingBeans from "@/components/FloatingBeans";
import GlowEffect from "@/components/GlowEffect";
import CasaLogo from "@/components/CasaLogo";
import LoadingScreen from "@/components/LoadingScreen";
import { CheckCircle2, Home, CreditCard, Car, Phone } from "lucide-react";
import { CAFE_PHONE } from "@/lib/constants";
import { motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  customizations: string;
}

interface OrderDetail {
  id: string;
  orderNumber: number;
  customerName: string;
  carPlate: string;
  carColor: string;
  status: string; // PENDING, PREPARING, READY, COMPLETED, REJECTED
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderStatusPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.orderId as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          throw new Error("Order not found.");
        }
        const data = await response.json();
        setOrder(data);
        setLoading(false);
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not fetch order status.");
        setLoading(false);
      }
    };

    const scheduleFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => void fetchStatus(), 350);
    };

    void fetchStatus();

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`cdl-order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        scheduleFetch
      )
      .subscribe();

    const interval = setInterval(fetchStatus, 30_000);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (loading) {
    return <LoadingScreen message="Connecting to baristas..." />;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-matte-black text-cream-light flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl max-w-sm mb-6">
          <h2 className="font-serif text-lg font-bold mb-2">Order Not Found</h2>
          <p className="text-xs leading-relaxed">{error || "The requested order does not exist or has expired."}</p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-crema font-bold hover:text-crema-light transition"
        >
          <Home size={14} /> Back to Menu
        </button>
      </div>
    );
  }

  // Stepper Status Definition
  const statuses = [
    { code: "PENDING", label: "Queued", desc: "Sent to baristas" },
    { code: "PREPARING", label: "Brewing", desc: "Handcrafting your order" },
    { code: "READY", label: "Ready", desc: "On its way to your car!" },
    { code: "COMPLETED", label: "Delivered", desc: "Enjoy your coffee ☕" },
  ];

  const getStatusIndex = (currentCode: string) => {
    const idx = statuses.findIndex((s) => s.code === currentCode);
    return idx === -1 ? 0 : idx;
  };

  const currentIndex = getStatusIndex(order.status);
  const isRejected = order.status === "REJECTED";

  return (
    <div className="relative min-h-screen bg-matte-black text-cream-light py-16 px-4 md:px-6 overflow-hidden">
      <FloatingBeans />
      <GlowEffect />

      <div className="max-w-xl mx-auto z-10 relative space-y-6">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <span className="font-serif text-2xl font-bold tracking-widest text-crema">
            CASA DE LATTE
          </span>
          <p className="text-[10px] tracking-[0.2em] text-warm-beige/40 font-bold uppercase mt-1">
            Drive-In Order Tracker
          </p>
        </div>

        {/* Order Number Badge */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 bg-crema/10 border border-crema/20 rounded-full px-4 py-1.5 text-xs font-bold text-crema tracking-widest">
            ORDER #{order.orderNumber?.toString().padStart(3, "0") || "—"}
          </span>
        </div>

        {/* REJECTED State */}
        {isRejected ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-3xl p-8 border border-red-500/30 text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto border border-red-500/30">
              <span className="text-3xl">✕</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-red-400">Order Rejected</h3>
            <p className="text-xs text-warm-beige/60 leading-relaxed">
              We apologize — your order could not be processed at this time. Please visit the counter or place a new order.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-crema text-matte-black font-bold px-6 py-3 rounded-xl text-sm mt-2 inline-flex items-center gap-2 transition hover:bg-crema-light"
            >
              <Home size={14} /> Return to Menu
            </button>
          </motion.div>
        ) : (
          <>
            {/* Status Stepper Card */}
            <div className="glass rounded-3xl p-6 md:p-8 border border-white/5 space-y-6 relative overflow-hidden">
              {/* Subtle Ambient Glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-crema/5 rounded-full blur-2xl pointer-events-none" />

              {/* Stepper Progress Visual */}
              <div className="flex flex-col items-center text-center">
                {order.status === "READY" ? (
                  <div className="relative">
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-3 animate-pulse" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  </div>
                ) : order.status === "COMPLETED" ? (
                  <CheckCircle2 className="w-16 h-16 text-crema mb-3" />
                ) : (
                  <div className="relative mb-3 flex justify-center items-center h-20 w-20 bg-white/5 rounded-full border border-white/10">
                    <motion.div
                      animate={{ opacity: [0.75, 1, 0.75], scale: [0.96, 1, 0.96] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <CasaLogo size={48} glow />
                    </motion.div>
                  </div>
                )}

                <h3 className="font-serif text-xl font-bold text-crema tracking-wide">
                  {statuses[currentIndex]?.label || order.status}
                </h3>
                <p className="text-xs text-warm-beige/60 mt-1">
                  {statuses[currentIndex]?.desc}
                </p>
              </div>

              {/* Stepper Steps Line */}
              <div className="pt-6 border-t border-white/5">
                <div className="relative flex justify-between">
                  {/* Stepper Line Background */}
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-white/10 z-0" />

                  {/* Active Stepper Line Progress */}
                  <div
                    className="absolute top-4 left-4 h-0.5 bg-crema z-0 transition-all duration-1000"
                    style={{
                      width: `${(currentIndex / (statuses.length - 1)) * 90}%`,
                    }}
                  />

                  {statuses.map((step, idx) => {
                    const isPassed = idx <= currentIndex;
                    const isActive = idx === currentIndex;

                    return (
                      <div key={step.code} className="flex flex-col items-center z-10 relative">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 border ${
                            isActive
                              ? "bg-crema border-crema text-matte-black ring-4 ring-crema/25 shadow-lg shadow-crema/10"
                              : isPassed
                              ? "bg-crema-dark border-crema text-crema"
                              : "bg-matte-card border-white/10 text-white/40"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span
                          className={`text-[10px] font-bold mt-2 tracking-wide uppercase ${
                            isActive
                              ? "text-crema"
                              : isPassed
                              ? "text-crema-light/80"
                              : "text-white/30"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex items-center gap-3 bg-black/20 rounded-xl px-4 py-3 border border-white/5">
                  <Car size={14} className="text-crema shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[9px] text-warm-beige/40 uppercase tracking-widest font-bold">Your Vehicle</span>
                    <span className="text-xs font-bold text-crema uppercase tracking-widest mt-0.5">
                      {order.carColor && `${order.carColor} · `}{order.carPlate}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-black/20 rounded-xl px-4 py-3 border border-white/5">
                  <span className="text-crema text-sm shrink-0">👤</span>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-warm-beige/40 uppercase tracking-widest font-bold">Customer</span>
                    <span className="text-xs font-bold text-warm-beige mt-0.5">{order.customerName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PAY & PICKUP CALLOUT */}
            {order.status === "READY" && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-3xl flex items-start gap-4 shadow-xl shadow-emerald-500/5"
              >
                <div className="p-3 bg-emerald-500/20 rounded-2xl">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight text-emerald-300">
                    🚗 Your Order is On Its Way!
                  </h4>
                  <p className="text-xs leading-relaxed text-emerald-300/80 mt-1">
                    Our barista is heading to your <strong>{order.carColor}</strong> car — plate <strong>{order.carPlate}</strong>. Please have payment ready!
                  </p>
                </div>
              </motion.div>
            )}

            {/* Summary Card */}
            <div className="glass rounded-3xl p-6 md:p-8 border border-white/5 space-y-4">
              <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-crema border-b border-white/5 pb-2 mb-3">
                Brew Summary
              </h4>
              <div className="space-y-3.5">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <div>
                      <span className="font-bold text-warm-beige">
                        {it.quantity}x {it.name}
                      </span>
                      {it.customizations && (
                        <span className="text-[10px] text-crema-light/50 block mt-0.5">
                          {it.customizations}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-warm-beige">
                      ₹{it.price * it.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/5 pt-3.5 mt-3.5 flex justify-between items-center text-xs">
                <span className="text-warm-beige/40">Taxes Included (5% GST)</span>
                <span className="font-serif text-sm font-bold text-crema">
                  Total: ₹{order.totalAmount}
                </span>
              </div>
            </div>

            {/* Call Cafe Section */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="glass rounded-3xl p-6 md:p-8 border border-crema/20 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-crema/10 border border-crema/20 flex items-center justify-center shrink-0">
                  <Phone size={18} className="text-crema" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold text-crema tracking-wide">
                    Your order has been placed successfully!
                  </h4>
                </div>
              </div>

              {/* Instruction */}
              <p className="text-xs text-warm-beige/70 leading-relaxed">
                When you arrive at Casa De Latte, please call us and mention your order number so we can bring it to your car.
              </p>

              {/* Displayed phone number */}
              <p className="text-[10px] uppercase tracking-widest text-warm-beige/40 font-bold">
                Cafe Direct Line
              </p>
              <p className="font-serif text-lg font-bold text-crema tracking-wider">
                {CAFE_PHONE}
              </p>

              {/* Call Cafe Button */}
              <a
                id="call-cafe-btn"
                href={`tel:${CAFE_PHONE}`}
                className="w-full bg-crema hover:bg-crema-light active:scale-95 text-matte-black py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all duration-300 shadow-lg shadow-crema/15 text-sm"
              >
                <Phone size={16} />
                Call Cafe
              </a>
            </motion.div>

            {/* Action Button */}
            <div className="text-center pt-4">
              <button
                onClick={() => router.push("/")}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-warm-beige text-xs uppercase tracking-widest font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 mx-auto transition-all duration-300"
              >
                <Home size={14} className="text-crema" />
                <span>Return to Menu</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
