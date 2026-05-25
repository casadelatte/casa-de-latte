"use client";

import React, { useState, useEffect } from "react";
import type { MenuItem } from "@/types/menu";
import dynamic from "next/dynamic";

const CategoryItemAnimation = dynamic(() => import("./CategoryItemAnimation"), {
  ssr: false,
  loading: () => (
    <div className="h-44 w-full flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-crema/30 border-t-crema animate-spin" />
    </div>
  ),
});
import { getLiquidColor } from "@/lib/menuAnimation";
import { X, Flame, Leaf, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ItemDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    quantity: number,
    customizations: string,
    extraPrice: number
  ) => void;
}

export default function ItemDetailModal({
  item,
  onClose,
  onAddToCart,
}: ItemDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [milk, setMilk] = useState("Whole Milk");
  const [roastProfile, setRoastProfile] = useState<"Medium" | "Dark">("Medium");
  const [temp, setTemp] = useState("Hot");
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setMilk("Whole Milk");
      setRoastProfile("Medium");
      setIsAdded(false);

      if (item.isHotAvailable) {
        setTemp("Hot");
      } else if (item.isColdAvailable) {
        setTemp("Iced");
      } else {
        setTemp("Hot");
      }
    }
  }, [item]);

  if (!item) return null;

  const getMilkExtra = () => {
    if (!item.requiresMilkCustomization) return 0;
    if (milk === "Almond Milk") return 35;
    return 0;
  };

  const extraPrice = getMilkExtra();
  const unitPrice = item.price + extraPrice;
  const totalPrice = unitPrice * quantity;

  const getCustomizationSummary = () => {
    const parts = [];
    if (item.isHotAvailable && item.isColdAvailable) {
      parts.push(temp);
    }
    if (item.requiresMilkCustomization) {
      parts.push(milk);
    }
    if (item.requiresRoastProfile) {
      parts.push(`${roastProfile} Roast`);
    }
    return parts.join(", ");
  };

  const handleAddClick = () => {
    setIsAdded(true);
    setTimeout(() => {
      onAddToCart(item, quantity, getCustomizationSummary(), extraPrice);
      onClose();
    }, 800);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.9, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 30, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl glass-premium text-cream-light p-6 md:p-8 z-10 flex flex-col md:flex-row gap-6 md:gap-8 cursor-default"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-warm-beige/60 hover:text-crema p-2 rounded-full hover:bg-white/5 transition-all duration-300 z-20"
          >
            <X size={20} />
          </button>

          <div className="flex-1 flex flex-col items-center justify-center bg-black/20 rounded-2xl p-4 border border-white/5">
            <CategoryItemAnimation
              categoryId={item.category}
              itemName={item.name}
              isHotAvailable={item.isHotAvailable}
              isColdAvailable={item.isColdAvailable}
              temp={temp}
              liquidColor={getLiquidColor(item.name, item.category)}
            />
            <div className="mt-4 text-center">
              <span className="text-crema-light font-medium tracking-wide">₹{item.price}</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] tracking-wider uppercase bg-crema/10 text-crema border border-crema/20 px-2 py-0.5 rounded-full font-bold">
                  {item.category.replace("-", " ")}
                </span>
                {item.isHotAvailable && <Flame size={12} className="text-orange-400" />}
                {item.requiresMilkCustomization && <Leaf size={12} className="text-green-400" />}
              </div>

              <h3 className="font-serif text-xl font-bold text-crema mb-2">{item.name}</h3>

              <p className="text-sm text-warm-beige leading-relaxed mb-4">{item.description}</p>

              <div className="mb-5">
                <h4 className="text-[10px] uppercase tracking-widest text-crema font-bold mb-2">
                  Key Ingredients
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {item.ingredients.map((ing, i) => (
                    <span
                      key={i}
                      className="text-xs bg-white/5 text-warm-beige border border-white/10 px-2.5 py-1 rounded-lg"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              {item.isHotAvailable && item.isColdAvailable && (
                <div className="mb-4">
                  <h4 className="text-[10px] uppercase tracking-widest text-crema font-bold mb-2">
                    Temperature
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {["Hot", "Iced"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTemp(t)}
                        className={`py-2 text-xs rounded-xl border font-bold transition-all duration-300 ${
                          temp === t
                            ? "bg-crema border-crema text-matte-black shadow-md shadow-crema/20"
                            : "bg-white/5 border-white/10 text-warm-beige hover:border-crema/40"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {item.requiresMilkCustomization && (
                <div className="mb-4">
                  <h4 className="text-[10px] uppercase tracking-widest text-crema font-bold mb-2">
                    Milk Option
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: "Whole Milk", price: "+₹0" },
                      { name: "Almond Milk", price: "+₹35" },
                    ].map((m) => (
                      <button
                        key={m.name}
                        onClick={() => setMilk(m.name)}
                        className={`py-2 text-[10px] flex flex-col items-center justify-center rounded-xl border font-bold transition-all duration-300 ${
                          milk === m.name
                            ? "bg-crema border-crema text-matte-black shadow-md shadow-crema/20"
                            : "bg-white/5 border-white/10 text-warm-beige hover:border-crema/40"
                        }`}
                      >
                        <span>{m.name}</span>
                        <span className="opacity-70 font-normal">{m.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {item.requiresRoastProfile && (
                <div className="mb-4">
                  <h4 className="text-[10px] uppercase tracking-widest text-crema font-bold mb-2">
                    Roast Profile
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(["Medium", "Dark"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRoastProfile(r)}
                        className={`py-2 text-xs rounded-xl border font-bold transition-all duration-300 ${
                          roastProfile === r
                            ? "bg-crema border-crema text-matte-black shadow-md shadow-crema/20"
                            : "bg-white/5 border-white/10 text-warm-beige hover:border-crema/40"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 pt-4 mt-4 flex items-center justify-between gap-4">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-2 py-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 text-crema flex items-center justify-center font-bold text-lg"
                >
                  -
                </button>
                <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 text-crema flex items-center justify-center font-bold text-lg"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddClick}
                disabled={isAdded}
                className={`flex-1 py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2 tracking-wide text-sm transition-all duration-500 transform ${
                  isAdded
                    ? "bg-emerald-500 text-white scale-98"
                    : "bg-crema hover:bg-crema-light active:scale-95 text-matte-black shadow-lg shadow-crema/20 font-bold"
                }`}
              >
                {isAdded ? (
                  <>
                    <Check size={16} />
                    Added to Cup!
                  </>
                ) : (
                  <>Add to Cart — ₹{totalPrice}</>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
