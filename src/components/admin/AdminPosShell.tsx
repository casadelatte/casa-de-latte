"use client";

import React, { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Registers the admin service worker for background notifications. */
export default function AdminPosShell({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAdmin(Boolean(user));
    })();
  }, []);

  useEffect(() => {
    if (!isAdmin || typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        const ping = () => reg.active?.postMessage({ type: "ping" });
        ping();
        const interval = setInterval(ping, 60_000);
        return () => clearInterval(interval);
      })
      .catch((err) => console.warn("[CDL] SW registration failed", err));
  }, [isAdmin]);

  return <>{children}</>;
}
