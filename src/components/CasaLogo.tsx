"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { LOGO_PATH } from "@/lib/menuAnimation";

interface CasaLogoProps {
  /** Intrinsic size for Next/Image (use with sizeClassName for responsive display). */
  size?: number;
  /** Tailwind classes on wrapper, e.g. w-[72px] h-[72px] md:w-24 md:h-24 */
  sizeClassName?: string;
  className?: string;
  glow?: boolean;
  priority?: boolean;
}

export default function CasaLogo({
  size = 48,
  sizeClassName,
  className = "",
  glow = false,
  priority = false,
}: CasaLogoProps) {
  const dimensionStyle = sizeClassName ? undefined : { width: size, height: size };

  return (
    <motion.div
      className={`relative inline-flex shrink-0 items-center justify-center ${sizeClassName ?? ""} ${className}`}
      style={dimensionStyle}
      whileHover={glow ? { scale: 1.04 } : undefined}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {glow && (
        <span
          className="absolute inset-0 rounded-full blur-xl opacity-40 bg-[#aaecef]/30 pointer-events-none"
          aria-hidden
        />
      )}
      <Image
        src={LOGO_PATH}
        alt="Casa De Latte"
        width={size}
        height={size}
        priority={priority}
        className="relative h-full w-full object-contain drop-shadow-lg"
        unoptimized
      />
    </motion.div>
  );
}
