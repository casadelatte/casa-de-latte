/**
 * Server-side Zod validation schemas for all API input.
 *
 * All schemas use .strict() to reject any unexpected fields,
 * preventing mass-assignment / parameter-pollution attacks.
 *
 * Compatible with Zod v4 (required_error → error param).
 */

import { z } from "zod";

// ─── Primitives ───────────────────────────────────────────────────────────────

/** Customer name: non-empty, max 80 chars, no leading/trailing whitespace. */
const customerNameSchema = z
  .string({ error: "Customer name is required." })
  .min(1, "Customer name cannot be empty.")
  .max(80, "Customer name must be 80 characters or fewer.")
  .transform((v) => v.trim());

/**
 * Indian mobile number.
 * Accepts digits, spaces, dashes, and an optional leading +.
 * After stripping non-digits it must be exactly 10 digits (or 12 with 91 country code).
 */
const mobileNumberSchema = z
  .string({ error: "Mobile number is required." })
  .max(20, "Mobile number is too long.")
  .transform((v) => v.replace(/\D/g, ""))
  .refine(
    (v) => v.length === 10 || (v.length === 12 && v.startsWith("91")),
    "Please enter a valid 10-digit mobile number."
  );

/**
 * Car plate number: non-empty, max 20 chars, uppercase.
 * Allows letters, digits, and spaces (covers all Indian plate formats).
 */
const carPlateSchema = z
  .string({ error: "Car plate number is required." })
  .min(1, "Car plate number cannot be empty.")
  .max(20, "Car plate number must be 20 characters or fewer.")
  .regex(/^[A-Za-z0-9 ]+$/, "Car plate may only contain letters, numbers, and spaces.")
  .transform((v) => v.trim().toUpperCase());

/** Car colour: optional, must be one of the known values shown in the UI. */
const carColorSchema = z
  .enum(["White", "Black", "Silver", "Red", "Blue", "Grey", "Gold", "Other", ""])
  .optional()
  .transform((v) => v ?? "");

/** Free-text notes / customizations: optional, max 400 chars. */
const customizationsSchema = z
  .string()
  .max(400, "Customization text must be 400 characters or fewer.")
  .optional()
  .default("");

// ─── Order item ───────────────────────────────────────────────────────────────

const orderItemSchema = z
  .object({
    name: z
      .string({ error: "Item name is required." })
      .min(1, "Item name cannot be empty.")
      .max(120, "Item name must be 120 characters or fewer."),
    price: z
      .number({ error: "Item price must be a number." })
      .nonnegative("Item price cannot be negative.")
      .max(10_000, "Item price is unrealistically high."),
    quantity: z
      .number({ error: "Item quantity must be a number." })
      .int("Item quantity must be a whole number.")
      .min(1, "Item quantity must be at least 1.")
      .max(50, "Item quantity cannot exceed 50."),
    customizations: customizationsSchema,
    /** Category ID is informational only — not written to DB as-is. */
    categoryId: z.string().max(100).optional(),
  })
  .strict();

// ─── Create order (POST /api/orders) ─────────────────────────────────────────

/**
 * Full body schema for creating an order.
 * .strict() ensures any extra keys are rejected with a validation error.
 */
export const CreateOrderSchema = z
  .object({
    customerName: customerNameSchema,
    mobileNumber: mobileNumberSchema,
    carPlate: carPlateSchema,
    carColor: carColorSchema,
    items: z
      .array(orderItemSchema)
      .min(1, "At least one item is required.")
      .max(30, "Cannot order more than 30 distinct items at once."),
    totalAmount: z
      .number({ error: "Total amount must be a number." })
      .nonnegative("Total amount cannot be negative.")
      .max(100_000, "Total amount is unrealistically high."),
    paymentMode: z
      .enum(["DEMO", "CASH", "UPI"], {
        error: "Invalid payment mode.",
      })
      .optional()
      .default("DEMO"),
  })
  .strict();

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

// ─── Update order status (PATCH /api/orders/[id]) ────────────────────────────

/** Allowlisted statuses that staff may set. */
export const ALLOWED_STATUSES = ["PENDING", "PREPARING", "COMPLETED", "REJECTED"] as const;

export const PatchOrderSchema = z
  .object({
    status: z.enum(ALLOWED_STATUSES, {
      error: `Status must be one of: ${ALLOWED_STATUSES.join(", ")}.`,
    }),
  })
  .strict();

export type PatchOrderInput = z.infer<typeof PatchOrderSchema>;
