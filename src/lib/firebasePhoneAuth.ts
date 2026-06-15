/**
 * Firebase Phone Authentication Utilities
 *
 * Wraps Firebase phone auth APIs with typed error handling.
 * Does NOT touch Supabase, ordering logic, or any DB.
 */

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type Auth,
} from "firebase/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OtpError =
  | "invalid-phone"
  | "send-failed"
  | "wrong-otp"
  | "expired-otp"
  | "too-many-requests"
  | "unknown";

export interface OtpErrorResult {
  code: OtpError;
  message: string;
}

// ─── reCAPTCHA ────────────────────────────────────────────────────────────────

let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initialises (or re-uses) an invisible reCAPTCHA verifier attached to
 * `containerId`. Call this once before `sendOtp`.
 */
export function getRecaptchaVerifier(
  auth: Auth,
  containerId: string
): RecaptchaVerifier {
  // Always create a fresh verifier when called — avoids stale widget errors.
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // ignore if already cleared
    }
    recaptchaVerifier = null;
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved automatically (invisible mode)
    },
    "expired-callback": () => {
      recaptchaVerifier = null;
    },
  });

  return recaptchaVerifier;
}

/**
 * Clears the reCAPTCHA verifier. Call on modal close / error recovery.
 */
export function clearRecaptchaVerifier(): void {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // ignore
    }
    recaptchaVerifier = null;
  }
}

// ─── Send OTP ─────────────────────────────────────────────────────────────────

/**
 * Validates and formats a phone number to E.164.
 * Accepts formats like: 9876543210 | +919876543210 | 09876543210
 * Default country: India (+91)
 */
export function formatPhoneE164(raw: string): string | null {
  const cleaned = raw.replace(/\s+/g, "").replace(/-/g, "");

  // Already in E.164
  if (/^\+\d{7,15}$/.test(cleaned)) return cleaned;

  // 10-digit Indian number
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;

  // 11-digit starting with 0 (Indian format)
  if (/^0\d{10}$/.test(cleaned)) return `+91${cleaned.slice(1)}`;

  return null;
}

/**
 * Sends an OTP to the given phone number.
 * Returns a `ConfirmationResult` on success, or an `OtpErrorResult` on failure.
 */
export async function sendOtp(
  auth: Auth,
  rawPhone: string,
  containerId: string
): Promise<ConfirmationResult | OtpErrorResult> {
  const e164 = formatPhoneE164(rawPhone);
  if (!e164) {
    return { code: "invalid-phone", message: "Please enter a valid 10-digit phone number." };
  }

  try {
    const verifier = getRecaptchaVerifier(auth, containerId);
    const confirmation = await signInWithPhoneNumber(auth, e164, verifier);
    return confirmation;
  } catch (err: unknown) {
    return mapFirebaseError(err);
  }
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────

/**
 * Confirms the OTP code.
 * Returns `true` on success, `OtpErrorResult` on failure.
 */
export async function verifyOtp(
  confirmation: ConfirmationResult,
  code: string
): Promise<true | OtpErrorResult> {
  try {
    await confirmation.confirm(code);
    return true;
  } catch (err: unknown) {
    return mapFirebaseError(err);
  }
}

// ─── Error mapping ────────────────────────────────────────────────────────────

function mapFirebaseError(err: unknown): OtpErrorResult {
  const code = (err as { code?: string })?.code ?? "";

  if (
    code === "auth/invalid-phone-number" ||
    code === "auth/missing-phone-number"
  ) {
    return { code: "invalid-phone", message: "The phone number is invalid. Please check and try again." };
  }
  if (code === "auth/invalid-verification-code" || code === "auth/wrong-code") {
    return { code: "wrong-otp", message: "The OTP you entered is incorrect. Please try again." };
  }
  if (
    code === "auth/code-expired" ||
    code === "auth/invalid-verification-code"
  ) {
    return { code: "expired-otp", message: "The OTP has expired. Please request a new one." };
  }
  if (code === "auth/too-many-requests") {
    return { code: "too-many-requests", message: "Too many attempts. Please wait a few minutes and try again." };
  }
  if (
    code === "auth/network-request-failed" ||
    code === "auth/internal-error"
  ) {
    return { code: "send-failed", message: "Network error. Please check your connection and try again." };
  }

  const msg = (err as { message?: string })?.message ?? "An unexpected error occurred.";
  return { code: "unknown", message: msg };
}
