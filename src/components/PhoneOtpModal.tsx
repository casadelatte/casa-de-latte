"use client";

/**
 * PhoneOtpModal — Reusable Firebase Phone OTP Modal
 *
 * Features:
 *  • Phone number input with E.164 formatting
 *  • Invisible reCAPTCHA (Firebase)
 *  • OTP input (6-digit split boxes)
 *  • Success state with animation
 *  • Loading states per action
 *  • Full error handling (invalid phone, wrong OTP, expired OTP, etc.)
 *
 * Does NOT:
 *  • Write anything to Supabase or any DB
 *  • Add sessions / localStorage
 *  • Connect to ordering flow
 */

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Shield, CheckCircle, AlertCircle, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  sendOtp,
  verifyOtp,
  clearRecaptchaVerifier,
  type OtpErrorResult,
} from "@/lib/firebasePhoneAuth";
import type { ConfirmationResult } from "firebase/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalStep = "phone" | "otp" | "success";

export interface PhoneOtpModalProps {
  /** Controls visibility */
  isOpen: boolean;
  /** Called when the user closes the modal (backdrop click, X button, or after success) */
  onClose: () => void;
  /**
   * Optional: called after OTP is successfully verified.
   * Receives the verified phone number in E.164 format.
   */
  onVerified?: (phoneNumber: string) => void;
  /**
   * Optional: pre-fills the phone input with this value when the modal opens.
   * Useful when the caller already has the phone number (e.g. from CartDrawer).
   */
  initialPhone?: string;
}

// ─── OTP digit input ──────────────────────────────────────────────────────────

const OTP_LENGTH = 6;

interface OtpBoxesProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

function OtpBoxes({ value, onChange, disabled }: OtpBoxesProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split("").concat(Array(OTP_LENGTH).fill("")).slice(0, OTP_LENGTH);

  const focusNext = (idx: number) => {
    inputsRef.current[idx + 1]?.focus();
  };
  const focusPrev = (idx: number) => {
    inputsRef.current[idx - 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace") {
      const next = value.slice(0, idx) + value.slice(idx + 1);
      onChange(next);
      if (idx > 0 && !digits[idx]) focusPrev(idx);
    } else if (e.key === "ArrowLeft") {
      focusPrev(idx);
    } else if (e.key === "ArrowRight") {
      focusNext(idx);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const incoming = e.target.value.replace(/\D/g, "").slice(-1);
    if (!incoming) return;
    const arr = digits.map((d) => d);
    arr[idx] = incoming;
    const next = arr.join("").slice(0, OTP_LENGTH);
    onChange(next);
    if (idx < OTP_LENGTH - 1) focusNext(idx);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted) {
      onChange(pasted);
      inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
      e.preventDefault();
    }
  };

  return (
    <div className="flex items-center gap-2 justify-center" role="group" aria-label="One-time password input">
      {Array.from({ length: OTP_LENGTH }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          id={`otp-digit-${i}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[i] ?? ""}
          disabled={disabled}
          aria-label={`OTP digit ${i + 1}`}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={[
            "w-11 h-13 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200",
            "bg-white/5 text-cream-light caret-crema",
            "focus:outline-none focus:ring-0",
            digits[i]
              ? "border-crema/70 bg-crema/10 shadow-sm shadow-crema/20"
              : "border-white/15 hover:border-white/30",
            disabled && "opacity-50 cursor-not-allowed",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function PhoneOtpModal({
  isOpen,
  onClose,
  onVerified,
  initialPhone = "",
}: PhoneOtpModalProps) {
  const recaptchaContainerId = useId().replace(/:/g, "_") + "_recaptcha";

  // Step state
  const [step, setStep] = useState<ModalStep>("phone");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Async state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Firebase confirmation result
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const verifiedPhoneRef = useRef<string>("");

  // Cooldown timer
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset everything when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay so exit animation plays first
      const t = setTimeout(() => {
        setStep("phone");
        setPhone("");
        setOtpCode("");
        setError(null);
        setLoading(false);
        setResendCooldown(0);
        confirmationRef.current = null;
        verifiedPhoneRef.current = "";
        clearRecaptchaVerifier();
        if (cooldownRef.current) clearInterval(cooldownRef.current);
      }, 350);
      return () => clearTimeout(t);
    } else {
      // Pre-fill phone from caller if available
      if (initialPhone) setPhone(initialPhone);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const startCooldown = useCallback((seconds: number) => {
    setResendCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  // ── Send OTP ──

  const handleSendOtp = async () => {
    setError(null);
    setLoading(true);

    const result = await sendOtp(auth, phone, recaptchaContainerId);

    setLoading(false);

    if ("code" in result) {
      setError((result as OtpErrorResult).message);
      return;
    }

    confirmationRef.current = result;
    verifiedPhoneRef.current = phone;
    setOtpCode("");
    setStep("otp");
    startCooldown(30);
  };

  // ── Verify OTP ──

  const handleVerifyOtp = async () => {
    if (otpCode.length !== OTP_LENGTH) {
      setError("Please enter all 6 digits.");
      return;
    }
    if (!confirmationRef.current) return;

    setError(null);
    setLoading(true);

    const result = await verifyOtp(confirmationRef.current, otpCode);

    setLoading(false);

    if (result !== true) {
      setError((result as OtpErrorResult).message);
      // Clear OTP on wrong code so user can retype
      if (result.code === "wrong-otp" || result.code === "expired-otp") {
        setOtpCode("");
      }
      return;
    }

    setStep("success");
    onVerified?.(verifiedPhoneRef.current);
  };

  // ── Resend OTP ──

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setOtpCode("");
    setError(null);
    setStep("phone");
    clearRecaptchaVerifier();
  };

  // ── Success auto-close ──

  useEffect(() => {
    if (step !== "success") return;
    const t = setTimeout(onClose, 2800);
    return () => clearTimeout(t);
  }, [step, onClose]);

  // ── Keyboard dismiss ──

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "success") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, step, onClose]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Invisible reCAPTCHA anchor — must be in DOM when modal is open */}
      {isOpen && (
        <div
          id={recaptchaContainerId}
          aria-hidden="true"
          style={{ position: "fixed", bottom: 0, right: 0, opacity: 0, pointerEvents: "none" }}
        />
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="otp-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Phone verification"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => step !== "success" && onClose()}
              className="absolute inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
            />

            {/* Card */}
            <motion.div
              key={step}
              initial={{ scale: 0.92, y: 28, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 28, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative z-10 w-full max-w-sm glass-premium rounded-3xl p-7 shadow-2xl overflow-hidden"
            >
              {/* Decorative aqua glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-32 rounded-full"
                style={{ background: "radial-gradient(ellipse, rgba(170,236,239,0.18) 0%, transparent 70%)" }}
              />

              {/* Close button */}
              {step !== "success" && (
                <button
                  type="button"
                  id="otp-modal-close"
                  onClick={onClose}
                  aria-label="Close verification modal"
                  className="absolute top-4 right-4 text-warm-beige/50 hover:text-crema p-1.5 rounded-full hover:bg-white/5 transition-all duration-200"
                >
                  <X size={18} />
                </button>
              )}

              {/* ── Step: Phone Input ── */}
              {step === "phone" && (
                <PhoneStep
                  phone={phone}
                  onPhoneChange={(v) => { setPhone(v); setError(null); }}
                  onSubmit={handleSendOtp}
                  loading={loading}
                  error={error}
                  recaptchaContainerId={recaptchaContainerId}
                />
              )}

              {/* ── Step: OTP Input ── */}
              {step === "otp" && (
                <OtpStep
                  phone={phone}
                  otpCode={otpCode}
                  onOtpChange={(v) => { setOtpCode(v); setError(null); }}
                  onVerify={handleVerifyOtp}
                  onResend={handleResend}
                  onBack={() => { setStep("phone"); setError(null); clearRecaptchaVerifier(); }}
                  loading={loading}
                  error={error}
                  resendCooldown={resendCooldown}
                />
              )}

              {/* ── Step: Success ── */}
              {step === "success" && <SuccessStep phone={phone} />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Step: Phone ──────────────────────────────────────────────────────────────

function PhoneStep({
  phone,
  onPhoneChange,
  onSubmit,
  loading,
  error,
}: {
  phone: string;
  onPhoneChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
  recaptchaContainerId: string;
}) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSubmit();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1.5 pt-1">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-crema/10 border border-crema/25 flex items-center justify-center">
            <Phone size={24} className="text-crema" />
          </div>
        </div>
        <h2 className="font-serif text-xl font-bold text-crema">Verify Your Phone</h2>
        <p className="text-sm text-warm-beige/60 leading-relaxed">
          We&apos;ll send a one-time code to your number.
        </p>
      </div>

      {/* Phone input */}
      <div className="space-y-2">
        <label htmlFor="otp-phone-input" className="text-[10px] uppercase tracking-widest font-bold text-crema/70">
          Mobile Number
        </label>
        <div className="flex items-center gap-2 bg-white/5 border border-white/15 rounded-2xl px-4 py-3 focus-within:border-crema/40 focus-within:bg-crema/5 transition-all duration-200">
          <span className="text-warm-beige/50 text-sm font-medium select-none shrink-0">🇮🇳 +91</span>
          <div className="w-px h-4 bg-white/15 shrink-0" />
          <input
            id="otp-phone-input"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value.replace(/[^0-9+ ]/g, ""))}
            onKeyDown={handleKey}
            disabled={loading}
            maxLength={15}
            className="flex-1 bg-transparent text-cream-light placeholder-warm-beige/25 text-sm font-medium focus:outline-none min-w-0"
          />
        </div>
      </div>

      {/* Error */}
      <ErrorBanner message={error} />

      {/* Submit */}
      <button
        id="otp-send-button"
        type="button"
        onClick={onSubmit}
        disabled={loading || phone.trim().length < 10}
        className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-crema hover:bg-crema-light text-matte-black shadow-lg shadow-crema/20"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Sending Code…</>
        ) : (
          <>Send OTP</>
        )}
      </button>

      <p className="text-center text-[10px] text-warm-beige/30 leading-relaxed">
        Protected by Firebase &amp; Google reCAPTCHA.
      </p>
    </div>
  );
}

// ─── Step: OTP ────────────────────────────────────────────────────────────────

function OtpStep({
  phone,
  otpCode,
  onOtpChange,
  onVerify,
  onResend,
  onBack,
  loading,
  error,
  resendCooldown,
}: {
  phone: string;
  otpCode: string;
  onOtpChange: (v: string) => void;
  onVerify: () => void;
  onResend: () => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
  resendCooldown: number;
}) {
  // Auto-submit when all 6 digits filled
  const prevLen = useRef(0);
  useEffect(() => {
    if (otpCode.length === OTP_LENGTH && prevLen.current < OTP_LENGTH && !loading) {
      onVerify();
    }
    prevLen.current = otpCode.length;
  }, [otpCode, loading, onVerify]);

  const displayPhone = phone.replace(/[^0-9]/g, "").slice(-10);
  const masked = displayPhone.length === 10
    ? `+91 ${displayPhone.slice(0, 5)} ${"•".repeat(5)}`
    : phone;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        type="button"
        id="otp-back-button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-warm-beige/50 hover:text-crema text-xs font-medium transition-colors duration-200"
      >
        <ArrowLeft size={13} />
        Change number
      </button>

      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-crema/10 border border-crema/25 flex items-center justify-center">
            <Shield size={24} className="text-crema" />
          </div>
        </div>
        <h2 className="font-serif text-xl font-bold text-crema">Enter OTP</h2>
        <p className="text-sm text-warm-beige/60 leading-relaxed">
          Code sent to <span className="text-crema font-semibold">{masked}</span>
        </p>
      </div>

      {/* OTP boxes */}
      <OtpBoxes value={otpCode} onChange={onOtpChange} disabled={loading} />

      {/* Error */}
      <ErrorBanner message={error} />

      {/* Verify button */}
      <button
        id="otp-verify-button"
        type="button"
        onClick={onVerify}
        disabled={loading || otpCode.length !== OTP_LENGTH}
        className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-crema hover:bg-crema-light text-matte-black shadow-lg shadow-crema/20"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Verifying…</>
        ) : (
          <>Verify OTP</>
        )}
      </button>

      {/* Resend */}
      <div className="text-center">
        <button
          id="otp-resend-button"
          type="button"
          onClick={onResend}
          disabled={resendCooldown > 0 || loading}
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-crema/70 hover:text-crema"
        >
          <RefreshCw size={11} />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}

// ─── Step: Success ────────────────────────────────────────────────────────────

function SuccessStep({ phone }: { phone: string }) {
  const displayPhone = phone.replace(/[^0-9]/g, "").slice(-10);
  const formatted = displayPhone.length === 10
    ? `+91 ${displayPhone.slice(0, 5)} ${displayPhone.slice(5)}`
    : phone;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 22, stiffness: 200 }}
      className="text-center py-4 space-y-5"
    >
      {/* Animated check */}
      <div className="flex justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 260, delay: 0.05 }}
          className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-400/50 flex items-center justify-center shadow-lg shadow-emerald-500/10"
        >
          <CheckCircle size={38} className="text-emerald-400" strokeWidth={1.5} />
        </motion.div>
      </div>

      <div className="space-y-1.5">
        <h2 className="font-serif text-xl font-bold text-crema">Verified!</h2>
        <p className="text-sm text-warm-beige/60">
          <span className="text-crema font-medium">{formatted}</span> confirmed.
        </p>
      </div>

      {/* Subtle progress bar */}
      <div className="h-0.5 rounded-full bg-white/5 overflow-hidden mx-4">
        <motion.div
          className="h-full bg-crema/60 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.6, ease: "linear", delay: 0.1 }}
        />
      </div>
      <p className="text-[10px] text-warm-beige/30">Closing automatically…</p>
    </motion.div>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          role="alert"
          aria-live="assertive"
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 rounded-xl px-3.5 py-3 text-red-300 text-xs leading-relaxed overflow-hidden"
        >
          <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-400" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
