"use client";

export default function FooterCredit() {
  return (
    <div className="w-full border-t border-white/5 pt-6 mt-8 text-center">
      <p
        className="text-[10px] md:text-[11px] tracking-[0.22em] uppercase text-warm-beige/35 font-light transition-all duration-500 hover:text-crema/55 hover:drop-shadow-[0_0_12px_rgba(199,161,122,0.25)] cursor-default select-none"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        Designed &amp; Developed by{" "}
        <span className="text-crema/45 hover:text-crema/70 transition-colors duration-500">
          Arbab Ansar Ali
        </span>
      </p>
    </div>
  );
}
