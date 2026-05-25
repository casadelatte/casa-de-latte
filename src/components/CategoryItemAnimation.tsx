"use client";

import React from "react";
import { motion } from "framer-motion";
import CoffeePourAnimation from "./CoffeePourAnimation";
import SteamAnimation from "./SteamAnimation";
import {
  getDrinkAnimationMode,
  getMenuAnimationFamily,
  type MenuAnimationFamily,
} from "@/lib/menuAnimation";

interface CategoryItemAnimationProps {
  categoryId: string;
  itemName: string;
  isHotAvailable?: boolean;
  isColdAvailable?: boolean;
  temp?: string;
  liquidColor?: string;
  className?: string;
}

function DrinkHotAnimation({ color }: { color: string }) {
  return (
    <motion.div
      className="relative flex flex-col items-center justify-center h-44 w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <CoffeePourAnimation active color={color} />
      <SteamAnimation className="absolute top-6 scale-125 opacity-80" />
    </motion.div>
  );
}

function DrinkColdAnimation({ color }: { color: string }) {
  return (
    <div className="relative flex flex-col items-center justify-center h-44 w-full overflow-hidden">
      <motion.div
        className="absolute inset-x-8 bottom-10 h-24 rounded-b-3xl border-2 border-crema/30 bg-white/5 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      />
      <motion.div
        className="absolute bottom-14 left-1/2 -translate-x-1/2 w-16 h-20 rounded-b-2xl"
        style={{ background: `linear-gradient(180deg, ${color}88 0%, ${color} 100%)` }}
        animate={{ height: ["4rem", "5rem", "4.5rem"] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="absolute w-2 h-2 rounded-full bg-sky-200/70 border border-white/40"
          style={{ left: `${38 + i * 8}%`, bottom: `${48 + (i % 2) * 8}%` }}
          animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
      <motion.div
        className="absolute top-8 left-1/2 -translate-x-1/2 w-1 h-16 rounded-full opacity-60"
        style={{ background: `linear-gradient(180deg, ${color}, transparent)` }}
        animate={{ scaleY: [0.6, 1, 0.7], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
      <span className="absolute bottom-3 text-[9px] uppercase tracking-widest text-sky-300/60 font-bold">
        Iced Pour
      </span>
    </div>
  );
}

function SandwichAnimation() {
  return (
    <motion.div
      className="relative h-44 w-full flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="relative w-36 h-24"
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 18, stiffness: 120 }}
      >
        <motion.div
          className="absolute inset-x-0 bottom-0 h-5 rounded-full bg-amber-700/80 border border-amber-900/40"
          animate={{ boxShadow: ["0 0 0 rgba(199,161,122,0)", "0 0 18px rgba(199,161,122,0.35)", "0 0 0 rgba(199,161,122,0)"] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-x-2 bottom-4 h-4 rounded-md bg-emerald-700/50"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />
        <motion.div
          className="absolute inset-x-1 bottom-8 h-5 rounded-md bg-amber-200/70 border border-amber-100/20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.45 }}
        />
        <motion.div
          className="absolute inset-x-3 bottom-12 h-3 rounded-sm bg-red-800/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        />
        <motion.div
          className="absolute inset-x-0 bottom-14 h-5 rounded-t-2xl bg-amber-600/75 border border-amber-500/30"
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55, type: "spring" }}
        />
      </motion.div>
      <motion.div
        className="absolute top-6 right-8 w-16 h-1 bg-gradient-to-r from-transparent via-crema/50 to-transparent"
        animate={{ opacity: [0.2, 0.8, 0.2], scaleX: [0.8, 1.1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1"
        animate={{ opacity: [0.15, 0.45, 0.15] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1 h-6 rounded-full bg-white/20 blur-[1px]"
            animate={{ y: [-2, -10, -2], scaleY: [1, 1.4, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.25 }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

function BakedAnimation() {
  return (
    <div className="relative h-44 w-full flex items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, rgba(199,161,122,0.35) 0%, transparent 70%)" }}
        animate={{ scale: [0.9, 1.08, 0.9], opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="relative w-28 h-20 rounded-[40%] bg-gradient-to-b from-amber-200/80 to-amber-700/70 border border-amber-100/30 shadow-lg shadow-amber-900/20"
        animate={{ rotate: [-1, 1, -1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <SteamAnimation className="absolute -top-8 left-1/2 -translate-x-1/2 scale-110 opacity-70" />
      </motion.div>
      <motion.div
        className="absolute bottom-6 text-[9px] uppercase tracking-[0.25em] text-amber-200/50 font-bold"
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        Fresh from the oven
      </motion.div>
    </div>
  );
}

function DessertAnimation() {
  return (
    <motion.div
      className="relative h-44 w-full flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-900/80 via-amber-700/60 to-amber-950/90 border border-crema/20 shadow-xl"
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "linear-gradient(120deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -top-2 left-1/2 w-1 h-16 bg-amber-950/80 origin-bottom rounded-full"
          style={{ rotate: 25, x: "-50%" }}
          animate={{ rotate: [20, 35, 20] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      </motion.div>
      {[...Array(6)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-crema/60"
          style={{ left: `${20 + i * 12}%`, top: `${25 + (i % 3) * 15}%` }}
          animate={{ y: [0, -12, 0], opacity: [0, 0.8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.35 }}
        />
      ))}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-2 rounded-full bg-amber-950/50"
        animate={{ scaleX: [0.8, 1.1, 0.8], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
}

const familyLabels: Record<MenuAnimationFamily, string> = {
  drinks: "Barista Craft",
  sandwich: "Grill & Assembly",
  baked: "Bakery Fresh",
  dessert: "Dessert Atelier",
};

export default function CategoryItemAnimation({
  categoryId,
  itemName,
  isHotAvailable,
  isColdAvailable,
  temp,
  liquidColor = "#3e2723",
  className = "",
}: CategoryItemAnimationProps) {
  const family = getMenuAnimationFamily(categoryId);
  const drinkMode = getDrinkAnimationMode(isHotAvailable, isColdAvailable, temp);

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div className="text-center mb-2">
        <span className="text-xs tracking-[0.2em] text-crema uppercase font-semibold">
          {familyLabels[family]}
        </span>
      </motion.div>

      {family === "drinks" && drinkMode === "hot" && <DrinkHotAnimation color={liquidColor} />}
      {family === "drinks" && drinkMode === "cold" && <DrinkColdAnimation color={liquidColor} />}
      {family === "sandwich" && <SandwichAnimation />}
      {family === "baked" && <BakedAnimation />}
      {family === "dessert" && <DessertAnimation />}

      <p className="mt-2 text-center font-serif text-lg text-crema/90 line-clamp-2 px-2">{itemName}</p>
    </motion.div>
  );
}
