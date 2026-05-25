import type { Metadata, Viewport } from "next";
import AdminPosShell from "@/components/admin/AdminPosShell";

export const metadata: Metadata = {
  title: "Casa De Latte — Staff Dashboard",
  description: "Drive-in kitchen operations dashboard",
};

export const viewport: Viewport = {
  themeColor: "#c7a17a",
  width: "device-width",
  initialScale: 1,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminPosShell>{children}</AdminPosShell>;
}
