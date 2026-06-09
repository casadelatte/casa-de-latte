"use client";

export default function FooterCredit() {
  return (
    <div className="w-full border-t border-white/5 pt-6 mt-8 text-center pb-24 md:pb-0">
      <div
        className="flex flex-col items-center gap-1 cursor-default select-none transition-all duration-500 group"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        {/* Label */}
        <p className="text-[9px] md:text-[10px] tracking-[0.28em] uppercase text-warm-beige/30 font-light">
          Designed &amp; Developed by
        </p>

        {/* Thin divider */}
        <div className="w-10 h-px bg-crema/15 my-1" />

        {/* Name 1 */}
        <span className="text-[11px] md:text-[12px] tracking-[0.18em] uppercase text-crema/45 font-light transition-colors duration-500 group-hover:text-crema/70">
          Arbab Ansar Ali
        </span>

        {/* Decorative ampersand */}
        <span className="text-[9px] tracking-[0.2em] text-warm-beige/20 font-light italic leading-none my-0.5">
          &amp;
        </span>

        {/* Name 2 */}
        <span className="text-[11px] md:text-[12px] tracking-[0.18em] uppercase text-crema/45 font-light transition-colors duration-500 group-hover:text-crema/70">
          Mustafa Wasif Hussain
        </span>
      </div>
    </div>
  );
}
