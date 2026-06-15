"use client";

/**
 * /test-firebase — OTP Modal Demo Page
 *
 * Use this page to test the PhoneOtpModal in isolation.
 * It is NOT connected to any ordering or user flow.
 */

import { useState } from "react";
import PhoneOtpModal from "@/components/PhoneOtpModal";
import { Phone, CheckCircle } from "lucide-react";

export default function TestFirebasePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastVerified, setLastVerified] = useState<string | null>(null);

  const handleVerified = (phone: string) => {
    setLastVerified(phone);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      {/* Page header */}
      <div className="text-center space-y-2 max-w-sm">
        <h1 className="font-serif text-3xl font-bold text-crema">
          OTP Modal — Test Page
        </h1>
        <p className="text-sm text-warm-beige/50">
          Isolated demo for Firebase Phone Authentication.
          Nothing is saved to the database.
        </p>
      </div>

      {/* Trigger button */}
      <button
        id="open-otp-modal-button"
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2.5 bg-crema hover:bg-crema-light text-matte-black font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-crema/20 transition-all duration-300 active:scale-95"
      >
        <Phone size={18} />
        Open Phone OTP Modal
      </button>

      {/* Success feedback */}
      {lastVerified && (
        <div className="flex items-center gap-3 glass-premium px-6 py-4 rounded-2xl border border-emerald-500/25">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs uppercase tracking-widest text-warm-beige/40 font-bold">Last verified</p>
            <p className="text-sm font-bold text-crema">{lastVerified}</p>
          </div>
        </div>
      )}

      {/* Status note */}
      <div className="glass rounded-2xl px-5 py-3 border border-white/5 max-w-xs text-center">
        <p className="text-[10px] uppercase tracking-widest text-warm-beige/30 font-bold mb-1">
          Test Instructions
        </p>
        <ol className="text-xs text-warm-beige/50 space-y-0.5 text-left list-decimal list-inside">
          <li>Enter a real Indian mobile number</li>
          <li>Wait for the 6-digit SMS code</li>
          <li>Enter it in the OTP boxes</li>
          <li>Watch the success animation</li>
        </ol>
      </div>

      {/* The modal */}
      <PhoneOtpModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onVerified={handleVerified}
      />
    </main>
  );
}