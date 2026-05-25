"use client";

import React, { useState } from "react";
import type { MenuItem } from "@/types/menu";
import { X, Trash2, ShoppingBag, ArrowRight, Car, User, Palette, Phone } from "lucide-react";
import {
  CLOSED_MESSAGE,
  cartHasRestrictedItems,
  isOrderingOpen,
} from "@/lib/businessHours";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export interface CartItem {
  item: MenuItem;
  quantity: number;
  customizations: string;
  extraPrice: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  orderingOpen?: boolean;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  setCartItems,
  orderingOpen = true,
}: CartDrawerProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Car & Customer Details
  const [customerName, setCustomerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [carPlate, setCarPlate] = useState("");
  const [carColor, setCarColor] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const subtotal = cartItems.reduce(
    (acc, curr) => acc + (curr.item.price + curr.extraPrice) * curr.quantity,
    0
  );
  const taxes = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + taxes;

  const handleUpdateQty = (index: number, change: number) => {
    const updated = [...cartItems];
    const newQty = updated[index].quantity + change;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    setCartItems(updated);
    localStorage.setItem("casa_cart", JSON.stringify(updated));
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...cartItems];
    updated.splice(index, 1);
    setCartItems(updated);
    localStorage.setItem("casa_cart", JSON.stringify(updated));
  };

  const handleCheckout = async () => {
    const errors: Record<string, string> = {};
    if (!orderingOpen || !isOrderingOpen()) {
      setErrorMessage(CLOSED_MESSAGE);
      return;
    }
    if (!customerName.trim()) errors.customerName = "Please enter your name.";
    const mobile = mobileNumber.replace(/\D/g, "");
    if (mobile.length < 10) errors.mobileNumber = "Enter a valid 10-digit mobile number.";
    if (!carPlate.trim()) errors.carPlate = "Car plate number is required.";
    if (cartHasRestrictedItems(cartItems)) {
      setErrorMessage("Some items are unavailable after 11:45 PM IST. Please remove them.");
      return;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage("Please complete all required fields.");
      return;
    }
    setFieldErrors({});
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          mobileNumber: mobile,
          carPlate: carPlate.trim().toUpperCase(),
          carColor: carColor.trim(),
          totalAmount: grandTotal,
          paymentMode: "DEMO",
          items: cartItems.map((c) => ({
            name: c.item.name,
            price: c.item.price + c.extraPrice,
            quantity: c.quantity,
            customizations: c.customizations,
            categoryId: c.item.category,
          })),
        }),
      });

      const order = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          (order as { error?: string }).error || "Failed to place order. Please try again."
        );
      }

      setCartItems([]);
      localStorage.removeItem("casa_cart");

      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#aaecef", "#c8f3f5", "#2a4a4e", "#e8f7f8"],
      });

      onClose();
      router.push(`/status/${order.id}`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-4">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-screen max-w-md glass-premium flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className="text-crema" />
                  <h3 className="font-serif text-lg font-bold text-crema uppercase tracking-wide">Your Order</h3>
                  <span className="bg-crema/10 text-crema text-xs px-2.5 py-0.5 rounded-full font-bold">{cartItems.length}</span>
                </div>
                <button onClick={onClose} className="text-warm-beige/60 hover:text-crema p-1 rounded-full transition">
                  <X size={20} />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-16">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-crema mb-4 border border-white/10">
                      <ShoppingBag size={24} />
                    </div>
                    <p className="font-serif text-base text-crema mb-1">Your order is empty</p>
                    <p className="text-xs text-warm-beige/60">Browse the menu to add items</p>
                  </div>
                ) : (
                  cartItems.map((c, i) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-bold text-warm-beige leading-tight">{c.item.name}</h4>
                          <span className="text-xs font-bold text-crema pl-2">₹{(c.item.price + c.extraPrice) * c.quantity}</span>
                        </div>
                        {c.customizations && (
                          <span className="text-[10px] text-crema-light/60 block mt-0.5">{c.customizations}</span>
                        )}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                          <div className="flex items-center bg-black/30 border border-white/10 rounded-lg px-1">
                            <button onClick={() => handleUpdateQty(i, -1)} className="w-6 h-6 hover:bg-white/10 text-crema rounded font-bold text-xs">-</button>
                            <span className="w-6 text-center text-xs font-bold">{c.quantity}</span>
                            <button onClick={() => handleUpdateQty(i, 1)} className="w-6 h-6 hover:bg-white/10 text-crema rounded font-bold text-xs">+</button>
                          </div>
                          <button onClick={() => handleRemoveItem(i)} className="text-white/40 hover:text-red-400 p-1 rounded transition">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Vehicle & Checkout */}
              {cartItems.length > 0 && (
                <div className="p-6 border-t border-white/5 bg-black/40 space-y-4">

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <User size={14} className="text-crema" />
                      <span className="text-[10px] uppercase tracking-widest text-crema font-bold">Your Details</span>
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-warm-beige/50 font-bold mb-1">
                        <User size={9} /> Customer Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Your full name"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          setFieldErrors((p) => ({ ...p, customerName: "" }));
                        }}
                        className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-cream-light focus:outline-none focus:border-crema focus:ring-1 focus:ring-crema font-bold transition ${
                          fieldErrors.customerName ? "border-red-400/60" : "border-white/10"
                        }`}
                      />
                      {fieldErrors.customerName && (
                        <p className="text-[10px] text-red-400 mt-1">{fieldErrors.customerName}</p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-warm-beige/50 font-bold mb-1">
                        <Phone size={9} /> Mobile Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="10-digit mobile"
                        value={mobileNumber}
                        onChange={(e) => {
                          setMobileNumber(e.target.value.replace(/[^\d+\s-]/g, ""));
                          setFieldErrors((p) => ({ ...p, mobileNumber: "" }));
                        }}
                        className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-cream-light focus:outline-none focus:border-crema focus:ring-1 focus:ring-crema font-bold transition ${
                          fieldErrors.mobileNumber ? "border-red-400/60" : "border-white/10"
                        }`}
                      />
                      {fieldErrors.mobileNumber && (
                        <p className="text-[10px] text-red-400 mt-1">{fieldErrors.mobileNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-warm-beige/50 font-bold mb-1">
                        <Car size={9} /> Car Plate Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. TS 01 AB 1234"
                        value={carPlate}
                        onChange={(e) => {
                          setCarPlate(e.target.value.toUpperCase());
                          setFieldErrors((p) => ({ ...p, carPlate: "" }));
                        }}
                        className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-cream-light focus:outline-none focus:border-crema focus:ring-1 focus:ring-crema font-bold uppercase tracking-widest transition ${
                          fieldErrors.carPlate ? "border-red-400/60" : "border-white/10"
                        }`}
                      />
                      {fieldErrors.carPlate && (
                        <p className="text-[10px] text-red-400 mt-1">{fieldErrors.carPlate}</p>
                      )}
                    </div>

                    {/* Car Color */}
                    <div>
                      <label className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-warm-beige/50 font-bold mb-1">
                        <Palette size={9} /> Car Color <span className="text-warm-beige/30">(optional)</span>
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {["White", "Black", "Silver", "Red", "Blue", "Grey", "Gold", "Other"].map((color) => (
                          <button
                            key={color}
                            onClick={() => setCarColor(color === carColor ? "" : color)}
                            className={`py-2 text-[10px] rounded-xl border font-bold transition-all duration-200 ${
                              carColor === color
                                ? "bg-crema border-crema text-matte-black"
                                : "bg-white/5 border-white/10 text-warm-beige hover:border-crema/40"
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="space-y-1.5 text-xs text-warm-beige border-t border-white/5 pt-3">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
                    <div className="flex justify-between"><span>GST (5%)</span><span>₹{taxes}</span></div>
                    <div className="flex justify-between text-sm font-bold text-crema border-t border-white/5 pt-2 mt-1">
                      <span>Total (Pay at Delivery)</span><span>₹{grandTotal}</span>
                    </div>
                  </div>

                  {errorMessage && (
                    <p className="text-xs text-red-400 text-center font-bold bg-red-400/10 border border-red-400/20 rounded-xl py-2 px-3">
                      ⚠ {errorMessage}
                    </p>
                  )}

                  {/* Submit */}
                  {!orderingOpen && (
                    <p className="text-xs text-amber-400/90 text-center font-bold bg-amber-500/10 border border-amber-500/20 rounded-xl py-2 px-3">
                      {CLOSED_MESSAGE}
                    </p>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={isSubmitting || !orderingOpen}
                    className="w-full bg-crema hover:bg-crema-light active:scale-98 text-matte-black py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition duration-300 shadow-lg shadow-crema/10 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending Order...
                      </span>
                    ) : (
                      <>
                        <Car size={16} /> Place Drive-In Order — ₹{grandTotal}
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-warm-beige/40 text-center">
                    Our team will deliver directly to your vehicle 🚗
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
