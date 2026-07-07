"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { IncomingOrder } from "@/components/NewOrderModal";
import { notifyNewDriveInOrder } from "@/lib/admin-notifications";

export interface AdminOrder {
  id: string;
  orderNumber: number;
  customerName: string;
  carPlate: string;
  carColor: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    customizations: string;
  }>;
}

function mapApiOrder(o: AdminOrder): AdminOrder {
  return o;
}

function mapRowToPartial(row: Record<string, unknown>): Partial<AdminOrder> {
  return {
    id: row.id as string,
    orderNumber: Number(row.order_number),
    customerName: row.customer_name as string,
    carPlate: row.car_plate as string,
    carColor: (row.car_color as string) || "",
    status: row.status as string,
    totalAmount: Number(row.total_amount),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function useAdminOrders(options: {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}) {
  const { soundEnabled, notificationsEnabled } = options;

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingModal, setPendingModal] = useState<IncomingOrder | null>(null);

  const prevOrderIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);
  const modalQueue = useRef<IncomingOrder[]>([]);
  const pendingModalRef = useRef<IncomingOrder | null>(null);
  const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingIds = useRef<Set<string>>(new Set());

  pendingModalRef.current = pendingModal;

  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playTone = (freq: number, delay: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur);
      };
      playTone(880, 0, 0.8);
      playTone(1318.51, 0.15, 0.6);
    } catch {
      /* ignore */
    }
  }, [soundEnabled]);

  const enqueuePendingOrder = useCallback((order: IncomingOrder) => {
    if (processingIds.current.has(order.id)) return;
    modalQueue.current.push(order);
    if (!pendingModalRef.current) {
      setPendingModal(modalQueue.current.shift()!);
    }
  }, []);

  const handleNewOrders = useCallback(
    (newOrders: AdminOrder[]) => {
      for (const o of newOrders) {
        if (o.status !== "PENDING") continue;
        playChime();
        if (notificationsEnabled) {
          void notifyNewDriveInOrder(o);
        }
        enqueuePendingOrder(o as IncomingOrder);
      }
    },
    [playChime, notificationsEnabled, enqueuePendingOrder]
  );

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/orders?limit=150");
      if (!response.ok) throw new Error("Failed to load orders.");
      const data: AdminOrder[] = await response.json();
      setOrders(data);

      if (!isFirstLoad.current) {
        const newOrders = data.filter((o) => !prevOrderIds.current.has(o.id));
        if (newOrders.length > 0) handleNewOrders(newOrders);
      }

      prevOrderIds.current = new Set(data.map((o) => o.id));
      isFirstLoad.current = false;
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [handleNewOrders]);

  const scheduleFullFetch = useCallback(() => {
    if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
    fetchDebounceRef.current = setTimeout(() => {
      void fetchOrders();
    }, 600);
  }, [fetchOrders]);

  const fetchAndMergeOrder = useCallback(
    async (orderId: string) => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) return;
        const order: AdminOrder = await res.json();

        setOrders((prev) => {
          const idx = prev.findIndex((o) => o.id === orderId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = mapApiOrder(order);
            return next;
          }
          return [order, ...prev].slice(0, 150);
        });

        if (!prevOrderIds.current.has(orderId)) {
          prevOrderIds.current.add(orderId);
          if (!isFirstLoad.current && order.status === "PENDING") {
            handleNewOrders([order]);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch order", orderId, e);
        scheduleFullFetch();
      }
    },
    [handleNewOrders, scheduleFullFetch]
  );

  useEffect(() => {
    void fetchOrders();

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("cdl-admin-orders-v2")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row?.id) void fetchAndMergeOrder(row.id as string);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (!row?.id) return;

          // If status is absent from the payload (happens when REPLICA IDENTITY
          // is not FULL — only the PK is included), fall back to a full fetch so
          // we never apply a partial merge that leaves status stale.
          if (row.status == null) {
            void fetchAndMergeOrder(row.id as string);
            return;
          }

          const partial = mapRowToPartial(row);
          setOrders((prev) =>
            prev.map((o) => (o.id === partial.id ? { ...o, ...partial } : o))
          );
        }
      )
      .subscribe();

    const fallback = setInterval(() => void fetchOrders(), 120_000);

    return () => {
      if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
      clearInterval(fallback);
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, fetchAndMergeOrder]);

  const dequeueModal = useCallback(() => {
    if (modalQueue.current.length > 0) {
      setPendingModal(modalQueue.current.shift()!);
    } else {
      setPendingModal(null);
    }
  }, []);

  return {
    orders,
    setOrders,
    loading,
    pendingModal,
    setPendingModal,
    fetchOrders,
    dequeueModal,
    processingIds,
    modalQueue,
  };
}
