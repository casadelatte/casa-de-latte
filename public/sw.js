// Casa De Latte Admin Service Worker (v5)
const CACHE_NAME = "cdl-admin-v5";
const STATIC_ASSETS = ["/admin", "/admin/login", "/casa-logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (url.pathname.startsWith("/admin")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request).then((r) => r || caches.match("/admin")))
    );
    return;
  }
});

// Client-triggered notifications (admin session only on client side)
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  if (data.type === "ping") {
    event.ports[0]?.postMessage("pong");
    return;
  }

  if (data.type === "SHOW_NOTIFICATION" && data.payload) {
    const p = data.payload;
    event.waitUntil(
      self.registration.showNotification(p.title || "Casa De Latte", {
        body: p.body || "New drive-in order",
        icon: "/casa-logo.png",
        badge: "/casa-logo.png",
        tag: p.tag || "cdl-order",
        requireInteraction: p.requireInteraction !== false,
        vibrate: p.vibrate || [300, 100, 300, 100, 500],
        data: { url: p.url || "/admin", orderId: p.orderId },
        actions: [
          { action: "view", title: "Open Dashboard" },
          { action: "dismiss", title: "Dismiss" },
        ],
      })
    );
  }
});

self.addEventListener("push", (event) => {
  let data = { title: "Casa De Latte", body: "New drive-in order!" };
  try {
    if (event.data) data = event.data.json();
  } catch {
    /* ignore */
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Casa De Latte", {
      body: data.body || "New drive-in order!",
      icon: "/casa-logo.png",
      badge: "/casa-logo.png",
      tag: data.tag || "cdl-order",
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 500],
      data: data,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const target = event.notification.data?.url || "/admin";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const adminClient = clients.find((c) => c.url.includes("/admin"));
      if (adminClient) return adminClient.focus();
      return self.clients.openWindow(target);
    })
  );
});
