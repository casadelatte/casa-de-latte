"use client";

import CasaLogo from "@/components/CasaLogo";
import { motion } from "framer-motion";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "Preparing your experience..." }: LoadingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-matte-black text-crema flex flex-col items-center justify-center gap-4 px-6"
    >
      <motion.div
        animate={{ opacity: [0.7, 1, 0.7], scale: [0.98, 1, 0.98] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <CasaLogo size={88} glow priority />
      </motion.div>
      <span className="font-serif text-sm tracking-[0.25em] text-crema/80 uppercase text-center">{message}</span>
    </motion.div>
  );
}
