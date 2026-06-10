"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Coffee, Lock, User, Eye, EyeOff, LogIn, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import CasaLogo from "@/components/CasaLogo";
import LoadingScreen from "@/components/LoadingScreen";
import GlowEffect from "@/components/GlowEffect";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function AdminLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: username,
        password,
      });
      if (error) throw error;

      router.push(redirect);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-matte-black text-cream-light flex items-center justify-center p-6 overflow-hidden">

      <GlowEffect />

      {/* Background Ambient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-crema/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-coffee-brown/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <CasaLogo size={64} glow className="mb-2 mx-auto" />
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coffee className="w-6 h-6 text-crema" />
            <span className="font-brand-title text-2xl font-bold tracking-[0.12em] text-crema">
              Casa De Latte
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Sparkles size={10} className="text-crema/50" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-warm-beige/40 font-bold">
              Staff Portal — Admin Access Only
            </span>
            <Sparkles size={10} className="text-crema/50" />
          </div>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="glass-premium rounded-3xl p-8 border border-crema/10 shadow-2xl shadow-black/50"
        >
          <div className="mb-6">
            <h1 className="font-serif text-2xl font-bold text-cream-light">
              Staff Sign In
            </h1>
            <p className="text-xs text-warm-beige/50 mt-1">
              Access the drive-in kitchen operations dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-warm-beige/50 font-bold mb-2">
                <User size={9} />
                Username
              </label>
              <div className="relative">
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  autoComplete="username"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-cream-light placeholder-warm-beige/30 focus:outline-none focus:border-crema/60 focus:ring-1 focus:ring-crema/30 transition font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-warm-beige/50 font-bold mb-2">
                <Lock size={9} />
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-cream-light placeholder-warm-beige/30 focus:outline-none focus:border-crema/60 focus:ring-1 focus:ring-crema/30 transition font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-beige/40 hover:text-crema transition"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2"
              >
                <span className="text-red-400 text-xs font-bold">⚠ {error}</span>
              </motion.div>
            )}

            {/* Submit */}
            <button
              id="admin-login-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-crema hover:bg-crema-light text-matte-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-crema/20 active:scale-98 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In to Staff Portal
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Hint */}
          {/* Credentials are managed in Supabase Auth */}          
        </motion.div>

        <p className="text-center text-[9px] text-warm-beige/20 mt-6 uppercase tracking-widest">
          © 2026 Casa De Latte — Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={<LoadingScreen message="Loading sign in..." />}
    >
      <AdminLoginInner />
    </Suspense>
  );
}
