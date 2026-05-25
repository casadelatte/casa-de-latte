"use client";

export const NOTIFICATIONS_STORAGE_KEY = "cdl_admin_notifications_enabled";

export function isNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getStoredNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setStoredNotificationsEnabled(enabled: boolean) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    /* ignore */
  }
}

export async function requestAdminNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  const permission = await Notification.requestPermission();
  const granted = permission === "granted";
  setStoredNotificationsEnabled(granted);
  if (granted) {
    await showAdminNotification({
      title: "Casa De Latte POS",
      body: "Drive-in alerts are enabled for this device.",
      tag: "cdl-setup",
      requireInteraction: false,
    });
  }
  return granted;
}

export interface AdminNotificationPayload {
  title: string;
  body: string;
  tag: string;
  requireInteraction?: boolean;
  orderId?: string;
  vibrate?: number[];
}

/** Show notification via SW (background) or Notification API (foreground). Admin-only callers. */
export async function showAdminNotification(payload: AdminNotificationPayload) {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;

  const options = {
    body: payload.body,
    icon: "/casa-logo.png",
    badge: "/casa-logo.png",
    tag: payload.tag,
    requireInteraction: payload.requireInteraction ?? true,
    vibrate: payload.vibrate ?? [300, 100, 300, 100, 500],
    data: { orderId: payload.orderId, url: "/admin" },
    silent: false,
  } as NotificationOptions & { vibrate?: number[] };

  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(payload.title, options);
      return;
    } catch {
      /* fall through */
    }
  }

  new Notification(payload.title, options);
}

export function notifyNewDriveInOrder(order: {
  id: string;
  orderNumber: number;
  customerName: string;
  carPlate: string;
  carColor: string;
  totalAmount: number;
  items: unknown[];
}) {
  return showAdminNotification({
    title: "New Drive-In Order",
    body: `${order.customerName} · ${order.carColor || ""} ${order.carPlate} · ${order.items.length} item(s) · ₹${order.totalAmount}`,
    tag: `order-${order.id}`,
    requireInteraction: true,
    orderId: order.id,
  });
}
