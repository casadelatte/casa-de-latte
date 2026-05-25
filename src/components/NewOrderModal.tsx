"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Check, X, Clock } from "lucide-react";

export interface IncomingOrder {
  id: string;
  orderNumber: number;
  customerName: string;
  carPlate: string;
  carColor: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    customizations: string;
  }>;
}

interface NewOrderModalProps {
  order: IncomingOrder | null;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
}

export default function NewOrderModal({ order, onAccept, onReject }: NewOrderModalProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vibIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAlarm = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (vibIntervalRef.current) {
      clearInterval(vibIntervalRef.current);
      vibIntervalRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if ("vibrate" in navigator) navigator.vibrate(0);
  };

  const playAlarmBurst = () => {
    try {
      const ACtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!ACtx) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new ACtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        void ctx.resume();
      }

      const playTone = (freq: number, delay: number, dur: number, vol: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur);
      };

      playTone(880, 0, 0.35, 0.2);
      playTone(660, 0.12, 0.35, 0.16);
      playTone(988, 0.28, 0.4, 0.14);
    } catch (e) {
      console.warn("Alarm audio error:", e);
    }
  };

  const vibratePattern = () => {
    if (!("vibrate" in navigator)) return;
    navigator.vibrate([400, 120, 400, 120, 600]);
  };

  useEffect(() => {
    if (!order) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    setElapsedSeconds(0);
    playAlarmBurst();
    vibratePattern();

    alarmIntervalRef.current = setInterval(playAlarmBurst, 1400);
    vibIntervalRef.current = setInterval(vibratePattern, 2800);

    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => {
      document.body.style.overflow = "";
      stopAlarm();
    };
  }, [order]);

  const handleAccept = () => {
    stopAlarm();
    if (order) onAccept(order.id);
  };

  const handleReject = () => {
    stopAlarm();
    if (order) onReject(order.id);
  };

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m > 0) return `${m}m ${sec}s waiting`;
    return `${sec}s waiting`;
  };

  return (
    <AnimatePresence mode="wait">
      {order && (
        <motion.div
          key={order.id}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="new-order-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center touch-none"
          style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <motion.div
            className="absolute inset-0 bg-black"
            animate={{ opacity: [0.92, 0.82, 0.92] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />

          <motion.div
            className="absolute inset-0 pointer-events-none border-[5px] border-crema z-10"
            animate={{ opacity: [0.15, 1, 0.15] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />

          <motion.div
            initial={{ scale: 0.88, y: 48, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.88, y: 48, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 220 }}
            className="relative z-20 w-full max-w-lg mx-4 max-h-[92vh] flex flex-col"
          >
            <motion.div
              animate={{ backgroundColor: ["#c7a17a", "#a67d52", "#c7a17a"] }}
              transition={{ duration: 1.1, repeat: Infinity }}
              className="rounded-t-3xl px-6 py-4 flex items-center justify-between shrink-0"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.65, repeat: Infinity }}
                  className="w-3.5 h-3.5 rounded-full bg-matte-black"
                />
                <span id="new-order-title" className="font-bold text-matte-black text-sm uppercase tracking-widest">
                  New Drive-In Order
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-matte-black/70 text-[10px] font-bold">
                <Clock size={11} />
                {formatElapsed(elapsedSeconds)}
              </div>
            </motion.div>

            <div className="glass-premium rounded-b-3xl border border-crema/25 p-6 space-y-5 shadow-2xl overflow-y-auto flex-1 min-h-0">
              <div className="flex items-center justify-between">
                <span className="bg-crema/15 border border-crema/25 text-crema text-[11px] font-black px-3 py-1 rounded-xl tracking-widest uppercase">
                  Order #{order.orderNumber?.toString().padStart(3, "0")}
                </span>
                <span className="text-[10px] text-warm-beige/40">
                  {new Date(order.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3 border border-white/5">
                  <span className="text-lg">👤</span>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-warm-beige/40 block font-bold">
                      Customer
                    </span>
                    <span className="text-base font-bold text-cream-light">{order.customerName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-crema/5 rounded-2xl px-4 py-3 border border-crema/15">
                  <Car className="text-crema shrink-0" size={20} />
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-crema/50 block font-bold">
                      Vehicle
                    </span>
                    <span className="text-lg font-black text-crema uppercase tracking-widest">
                      {order.carColor ? `${order.carColor} · ` : ""}
                      {order.carPlate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-widest text-warm-beige/40 font-bold">
                  Order Items
                </span>
                <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between text-xs bg-white/5 rounded-xl px-3 py-2.5 border border-white/5"
                    >
                      <div className="flex-1">
                        <span className="font-bold text-warm-beige">
                          {item.quantity}× {item.name}
                        </span>
                        {item.customizations && (
                          <span className="text-[10px] text-crema/50 block mt-0.5">{item.customizations}</span>
                        )}
                      </div>
                      <span className="font-bold text-crema pl-2">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center bg-crema/10 border border-crema/20 rounded-2xl px-4 py-3">
                <span className="text-xs font-bold text-warm-beige uppercase tracking-wide">Total Amount</span>
                <span className="font-serif text-xl font-bold text-crema">₹{order.totalAmount}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  id={`reject-order-${order.id}`}
                  onClick={handleReject}
                  className="flex items-center justify-center gap-2 bg-red-500/15 border-2 border-red-500/40 hover:border-red-500/70 text-red-400 font-black text-sm py-4 rounded-2xl transition-all duration-200 active:scale-95 min-h-[52px]"
                >
                  <X size={18} />
                  Reject
                </button>
                <button
                  type="button"
                  id={`accept-order-${order.id}`}
                  onClick={handleAccept}
                  className="flex items-center justify-center gap-2 bg-emerald-500/25 border-2 border-emerald-500/50 hover:border-emerald-400 text-emerald-300 font-black text-sm py-4 rounded-2xl transition-all duration-200 active:scale-95 min-h-[52px]"
                >
                  <Check size={18} />
                  Accept &amp; Open Receipt
                </button>
              </div>

              <p className="text-center text-[9px] text-warm-beige/30 uppercase tracking-widest">
                Alarm continues until you accept or reject
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
