"use client";

import React, { useEffect, useState, useCallback } from "react";
import CasaLogo from "@/components/CasaLogo";
import LoadingScreen from "@/components/LoadingScreen";
import FloatingBeans from "@/components/FloatingBeans";
import GlowEffect from "@/components/GlowEffect";
import NewOrderModal, { IncomingOrder } from "@/components/NewOrderModal";
import MenuManager from "@/components/admin/MenuManager";
import ReceiptPreviewModal from "@/components/admin/ReceiptPreviewModal";
import { orderToReceiptData, viewReceipt, type PrintTicketData } from "@/lib/print/ticket";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAdminOrders } from "@/hooks/useAdminOrders";
import PrintControls from "@/components/admin/PrintControls";
import {
  getStoredNotificationsEnabled,
  requestAdminNotificationPermission,
  setStoredNotificationsEnabled,
} from "@/lib/admin-notifications";
import {
  DollarSign,
  Coffee,
  CheckCircle,
  QrCode,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  ClipboardList,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Car,
  LogOut,
  FileText,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  customizations: string;
}

interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  carPlate: string;
  carColor: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

// Custom animated odometer for revenue
function AnimatedRevenueCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = count;
    const end = value;
    if (start === end) return;
    const totalDuration = 1000;
    const incrementTime = 30;
    const totalSteps = Math.ceil(totalDuration / incrementTime);
    const stepValue = (end - start) / totalSteps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      start += stepValue;
      if (step >= totalSteps) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.floor(start));
      }
    }, incrementTime);
    return () => clearInterval(timer);
  }, [value]);

  return <span>₹{count.toLocaleString()}</span>;
}

// Vehicle badge component
function VehicleBadge({ carColor, carPlate, size = "sm" }: { carColor: string; carPlate: string; size?: "sm" | "lg" }) {
  const colorMap: Record<string, string> = {
    white: "#f5f5f5", black: "#1a1a1a", silver: "#c0c0c0",
    red: "#dc2626", blue: "#2563eb", grey: "#6b7280",
    gold: "#d97706", other: "#8b5cf6",
  };
  const dotColor = colorMap[carColor.toLowerCase()] || "#8b5cf6";
  const isSmall = size === "sm";

  return (
    <div className={`flex items-center gap-${isSmall ? "1.5" : "2"}`}>
      <span
        className={`inline-block rounded-full border border-white/20 shrink-0 ${isSmall ? "w-2.5 h-2.5" : "w-3.5 h-3.5"}`}
        style={{ backgroundColor: dotColor }}
        title={carColor}
      />
      <Car size={isSmall ? 11 : 14} className="text-crema shrink-0" />
      <span className={`font-bold text-crema uppercase tracking-widest ${isSmall ? "text-[10px]" : "text-sm"}`}>
        {carColor && `${carColor} · `}{carPlate}
      </span>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<PrintTicketData | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<PrintTicketData | null>(null);

  const [qrZoneInput, setQrZoneInput] = useState("A1");
  const [generatedQrUrl, setGeneratedQrUrl] = useState("");

  useEffect(() => {
    setNotificationsEnabled(getStoredNotificationsEnabled());
  }, []);

  const {
    orders,
    setOrders,
    loading,
    pendingModal,
    fetchOrders,
    dequeueModal,
    processingIds,
  } = useAdminOrders({ soundEnabled, notificationsEnabled });

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications on this device.");
      return;
    }
    const granted = await requestAdminNotificationPermission();
    setNotificationsEnabled(granted);
  };

  const toggleNotifications = () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      setStoredNotificationsEnabled(false);
    } else {
      void requestNotificationPermission();
    }
  };

  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      /* ignore */
    }
  }, [soundEnabled]);

  const saveAndOpenReceipt = useCallback((order: Order) => {
    const data = orderToReceiptData(order);
    setLastReceipt(data);
    viewReceipt(data);
  }, []);

  const showReceiptPreview = useCallback((order: Order) => {
    const data = orderToReceiptData(order);
    setLastReceipt(data);
    setPreviewReceipt(data);
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string, openReceiptAfter = false) => {
    // Terminal-state guard — CANCELLED and COMPLETED orders are immutable on the client too
    const current = orders.find((o) => o.id === id);
    if (current?.status === "CANCELLED" || current?.status === "COMPLETED") return;

    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      const updated: Order = await response.json();
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));

      if (openReceiptAfter) {
        saveAndOpenReceipt(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleModalAccept = async (orderId: string) => {
    processingIds.current.add(orderId);
    dequeueModal();
    await handleUpdateStatus(orderId, "PREPARING", true);
    processingIds.current.delete(orderId);
  };

  const handleModalReject = async (orderId: string) => {
    processingIds.current.add(orderId);
    dequeueModal();
    await handleUpdateStatus(orderId, "REJECTED");
    processingIds.current.delete(orderId);
  };

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const generateQrCode = () => {
    if (!qrZoneInput) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const scanUrl = `${origin}/`;
    const qrImageSource = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(scanUrl)}&color=0c0a09&bgcolor=faf8f5`;
    setGeneratedQrUrl(qrImageSource);
  };

  useEffect(() => { generateQrCode(); }, []);

  // Analytics
  const totalRevenue = orders.filter((o) => o.status === "COMPLETED").reduce((acc, curr) => acc + curr.totalAmount, 0);
  const activeOrdersCount = orders.filter((o) => o.status === "PENDING" || o.status === "PREPARING").length;
  const finishedOrdersCount = orders.filter((o) => o.status === "COMPLETED" || o.status === "REJECTED" || o.status === "CANCELLED").length;

  const getMostOrderedItems = () => {
    const counts: { [key: string]: number } = {};
    orders.forEach((o) => o.items.forEach((it) => { counts[it.name] = (counts[it.name] || 0) + it.quantity; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  };
  const topItems = getMostOrderedItems();

  // Kanban columns
  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const preparingOrders = orders.filter((o) => o.status === "PREPARING");
  const completedLive = orders.filter((o) => o.status === "COMPLETED").slice(0, 15);
  const rejectedRecent = orders.filter((o) => o.status === "REJECTED").slice(0, 5);
  const cancelledRecent = orders.filter((o) => o.status === "CANCELLED").slice(0, 5);

  const renderOrderCard = (order: Order, accentColor: string, actions: React.ReactNode) => (
    <motion.div
      layoutId={order.id}
      key={order.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`glass bg-matte-card rounded-2xl p-4 border space-y-3 ${
        accentColor === "crema"
          ? "border-crema/10"
          : accentColor === "orange"
          ? "border-orange-400/15"
          : accentColor === "emerald"
          ? "border-emerald-400/20"
          : "border-white/5"
      }`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <span className={`text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded-lg border ${
            accentColor === "crema"
              ? "bg-crema/10 text-crema border-crema/20"
              : accentColor === "orange"
              ? "bg-orange-400/10 text-orange-400 border-orange-400/20"
              : accentColor === "emerald"
              ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
              : "bg-white/5 text-white/50 border-white/10"
          }`}>
            #{order.orderNumber?.toString().padStart(3, "0")}
          </span>
          <div className="text-xs font-bold text-warm-beige">{order.customerName}</div>
        </div>
        <span className="text-[10px] text-warm-beige/30 shrink-0">
          {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Vehicle */}
      <VehicleBadge carColor={order.carColor} carPlate={order.carPlate} />

      {/* Items */}
      <div className="space-y-1">
        {order.items.map((it, idx) => (
          <div key={idx} className="text-xs">
            <span className="font-bold text-warm-beige">{it.quantity}× {it.name}</span>
            {it.customizations && (
              <span className="text-[10px] text-crema/50 block font-normal">{it.customizations}</span>
            )}
          </div>
        ))}
      </div>

      {/* Footer: Price + Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
        <span className="text-xs font-bold text-crema">₹{order.totalAmount}</span>
        <div className="flex items-center gap-1.5">
          {/* Print button */}
          <button
            onClick={() => showReceiptPreview(order)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-warm-beige/60 hover:text-warm-beige transition"
            title="View receipt"
          >
            <FileText size={11} />
          </button>
          {actions}
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return <LoadingScreen message="Loading kitchen dashboard..." />;
  }

  return (
    <div className="relative min-h-screen bg-matte-black text-cream-light py-10 px-4 md:px-8 overflow-hidden font-sans">
      <FloatingBeans />
      <GlowEffect />

      <NewOrderModal
        order={pendingModal}
        onAccept={handleModalAccept}
        onReject={handleModalReject}
      />

      <ReceiptPreviewModal receipt={previewReceipt} onClose={() => setPreviewReceipt(null)} />

      <div className="max-w-7xl mx-auto z-10 relative space-y-8">

        {/* Header Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3">
              <CasaLogo size={48} glow />
              <div>
                <motion.div className="flex items-center gap-2">
                  <span className="font-brand-title text-3xl font-bold tracking-[0.12em] text-crema">
                    Casa De Latte
                  </span>
                  <span className="bg-crema/10 text-crema text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-crema/20">
                    Staff Panel
                  </span>
                </motion.div>
                <p className="text-xs text-warm-beige/40 font-bold uppercase tracking-[0.2em] mt-1.5">
                  Drive-In Kitchen Operations · Live Dashboard
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* Notification Toggle */}
            <button
              id="toggle-notifications"
              onClick={toggleNotifications}
              className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center gap-2 text-xs font-bold ${
                notificationsEnabled
                  ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                  : "bg-white/5 border-white/5 text-white/30"
              }`}
              title="Toggle System Notifications"
            >
              {notificationsEnabled ? <Bell size={15} /> : <BellOff size={15} />}
              <span className="hidden sm:inline">{notificationsEnabled ? "Notifs ON" : "Notifs OFF"}</span>
            </button>

            {/* Sound Toggle */}
            <button
              id="toggle-sound"
              onClick={() => { setSoundEnabled(!soundEnabled); playChime(); }}
              className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center gap-2 text-xs font-bold ${
                soundEnabled
                  ? "bg-crema/10 border-crema/30 text-crema"
                  : "bg-white/5 border-white/5 text-white/30"
              }`}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span className="hidden sm:inline">{soundEnabled ? "Sound ON" : "Sound OFF"}</span>
            </button>

            <PrintControls
              lastReceipt={lastReceipt}
              onViewReceipt={() => lastReceipt && setPreviewReceipt(lastReceipt)}
            />

            {/* Refresh */}
            <button
              id="manual-refresh"
              onClick={fetchOrders}
              className="bg-white/5 hover:bg-white/10 border border-white/10 p-2.5 rounded-xl transition text-crema"
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>

            {/* Logout */}
            <button
              id="admin-logout"
              onClick={handleLogout}
              className="p-2.5 rounded-xl border bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 transition flex items-center gap-2 text-xs font-bold"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* ANALYTICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-3xl p-5 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-warm-beige/50">Revenue</span>
              <h3 className="font-serif text-2xl font-bold text-crema mt-1">
                <AnimatedRevenueCounter value={totalRevenue} />
              </h3>
            </div>
            <div className="p-3 bg-crema/10 border border-crema/20 rounded-2xl text-crema">
              <DollarSign size={18} />
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-warm-beige/50">Active Queue</span>
              <h3 className="font-serif text-2xl font-bold text-orange-400 mt-1">
                {activeOrdersCount} <span className="text-xs text-warm-beige/40 font-sans font-normal">orders</span>
              </h3>
            </div>
            <div className="p-3 bg-orange-400/10 border border-orange-400/20 rounded-2xl text-orange-400">
              <Coffee size={18} />
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-warm-beige/50">Dispatched</span>
              <h3 className="font-serif text-2xl font-bold text-emerald-400 mt-1">
                {finishedOrdersCount} <span className="text-xs text-warm-beige/40 font-sans font-normal">orders</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-400/10 border border-emerald-400/20 rounded-2xl text-emerald-400">
              <CheckCircle size={18} />
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-warm-beige/50 mb-2">Top Sellers</span>
            <div className="space-y-1.5">
              {topItems.length === 0 ? (
                <span className="text-xs text-white/30 italic block">No items ordered yet</span>
              ) : (
                topItems.map(([name, qty], idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] text-warm-beige font-semibold">
                    <span className="truncate pr-2">{idx + 1}. {name}</span>
                    <span className="text-crema">{qty} cups</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* LIVE KITCHEN PIPELINE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-[500px]">

          {/* PENDING */}
          <div className="flex flex-col h-full bg-black/20 rounded-3xl p-4 border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs uppercase tracking-widest font-bold text-crema flex items-center gap-1.5">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="h-2 w-2 rounded-full bg-crema"
                />
                Pending
              </span>
              <span className="bg-crema/10 text-crema text-xs px-2 py-0.5 rounded-full font-bold">{pendingOrders.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[600px] no-scrollbar">
              <AnimatePresence mode="popLayout">
                {pendingOrders.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-xs text-white/20 italic text-center">Queue is empty</div>
                ) : (
                  pendingOrders.map((order) =>
                    renderOrderCard(order, "crema",
                      <button
                        onClick={() => handleUpdateStatus(order.id, "PREPARING", true)}
                        className="bg-crema hover:bg-crema-light active:scale-95 text-matte-black text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                      >
                        Accept &amp; Receipt <ChevronRight size={10} />
                      </button>
                    )
                  )
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* PREPARING */}
          <div className="flex flex-col h-full bg-black/20 rounded-3xl p-4 border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs uppercase tracking-widest font-bold text-orange-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
                Brewing
              </span>
              <span className="bg-orange-400/10 text-orange-400 text-xs px-2 py-0.5 rounded-full font-bold">{preparingOrders.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[600px] no-scrollbar">
              <AnimatePresence mode="popLayout">
                {preparingOrders.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-xs text-white/20 italic text-center">No coffee brewing</div>
                ) : (
                  preparingOrders.map((order) =>
                    renderOrderCard(order, "orange",
                      <button
                        onClick={() => handleUpdateStatus(order.id, "COMPLETED")}
                        className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                      >
                        Complete <ChevronRight size={10} />
                      </button>
                    )
                  )
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* COMPLETED */}
          <div className="flex flex-col h-full bg-black/20 rounded-3xl p-4 border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs uppercase tracking-widest font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle size={11} />
                Completed
              </span>
              <span className="bg-emerald-400/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold">
                {completedLive.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[600px] no-scrollbar">
              <AnimatePresence mode="popLayout">
                {completedLive.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-xs text-white/20 italic text-center">
                    No completed orders yet
                  </div>
                ) : (
                  completedLive.map((order) =>
                    renderOrderCard(
                      order,
                      "emerald",
                      <button
                        onClick={() => showReceiptPreview(order)}
                        className="bg-white/10 hover:bg-white/15 text-warm-beige text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 transition border border-white/10"
                      >
                        Receipt <FileText size={10} />
                      </button>
                    )
                  )
                )}
              </AnimatePresence>
              {rejectedRecent.length > 0 && (
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <span className="text-[9px] uppercase tracking-widest text-red-400/80 font-bold flex items-center gap-1">
                    <ClipboardList size={10} /> Recent rejected
                  </span>
                  {rejectedRecent.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl p-3 border border-red-500/15 bg-red-500/5 opacity-70 text-xs"
                    >
                      <div className="flex justify-between">
                        <span className="font-bold text-warm-beige/70">
                          #{order.orderNumber?.toString().padStart(3, "0")} · {order.customerName}
                        </span>
                        <button
                          type="button"
                          onClick={() => showReceiptPreview(order)}
                          className="text-red-300/80"
                          title="View receipt"
                        >
                          <FileText size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {cancelledRecent.length > 0 && (
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <span className="text-[9px] uppercase tracking-widest text-orange-400/80 font-bold flex items-center gap-1">
                    <ClipboardList size={10} /> Customer cancelled
                  </span>
                  {cancelledRecent.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl p-3 border border-orange-500/15 bg-orange-500/5 opacity-70 text-xs"
                    >
                      <div className="flex justify-between">
                        <span className="font-bold text-warm-beige/70">
                          #{order.orderNumber?.toString().padStart(3, "0")} · {order.customerName}
                        </span>
                        <button
                          type="button"
                          onClick={() => showReceiptPreview(order)}
                          className="text-orange-300/80"
                          title="View receipt"
                        >
                          <FileText size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MENU MANAGER */}
        <MenuManager />

        {/* QR CODE GENERATOR */}
        <div className="glass rounded-3xl p-6 md:p-8 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <QrCode size={18} className="text-crema animate-pulse" />
            <h3 className="font-serif text-lg font-bold text-crema uppercase tracking-wide">
              Drive-In Zone QR Generator
            </h3>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4">
              <p className="text-xs text-warm-beige/60 leading-relaxed">
                Generate printable QR codes for each drive-in zone or parking spot. Customers scan to instantly open the Casa De Latte ordering menu on their phone.
              </p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[9px] uppercase tracking-widest text-crema font-bold mb-1.5">
                    Zone / Spot Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Zone A, Spot 5, Lane B"
                    value={qrZoneInput}
                    onChange={(e) => setQrZoneInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-cream-light focus:outline-none focus:border-crema focus:ring-1 focus:ring-crema font-bold transition"
                  />
                </div>
                <button
                  onClick={generateQrCode}
                  className="bg-crema hover:bg-crema-light text-matte-black font-extrabold text-xs uppercase px-6 rounded-xl flex items-center justify-center shadow-lg transition self-end h-[42px]"
                >
                  Generate
                </button>
              </div>
            </div>

            {generatedQrUrl && (
              <div className="w-[220px] bg-cream-light text-matte-black rounded-3xl p-5 border-4 border-crema flex flex-col items-center justify-between text-center shadow-2xl select-none">
                <span className="font-serif text-[9px] tracking-[0.3em] text-crema-gold font-black uppercase mb-1">
                  CASA DE LATTE
                </span>
                <h4 className="font-serif text-lg font-bold tracking-tight text-matte-black mb-2">
                  {qrZoneInput}
                </h4>
                <div className="w-36 h-36 relative rounded-2xl overflow-hidden border border-crema/10 shadow bg-white p-2">
                  <img src={generatedQrUrl} alt={`${qrZoneInput} QR`} className="w-full h-full object-contain" />
                </div>
                <span className="text-[8px] uppercase tracking-[0.15em] font-extrabold text-matte-black/50 mt-3 leading-normal">
                  Scan to order ·{" "}
                  <br />Drive-In Coffee
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
