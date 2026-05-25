"use client";

import React, { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import FloatingBeans from "@/components/FloatingBeans";
import GlowEffect from "@/components/GlowEffect";
import CasaLogo from "@/components/CasaLogo";
import LoadingScreen from "@/components/LoadingScreen";
import FooterCredit from "@/components/FooterCredit";
import FooterContact from "@/components/FooterContact";
import CreatorsSection from "@/components/CreatorsSection";
import {
  isOrderingOpen,
  isCategoryUnavailableLateNight,
  isLateNightRestricted,
  cartHasRestrictedItems,
  CLOSED_MESSAGE,
  LATE_NIGHT_LABEL,
} from "@/lib/businessHours";
import ItemDetailModal from "@/components/ItemDetailModal";
import CartDrawer, { CartItem } from "@/components/CartDrawer";
import type { MenuItem, MenuCategory } from "@/types/menu";
import {
  ShoppingBag,
  Coffee,
  Sparkles,
  CupSoda,
  Leaf,
  Clock,
  Flame,
  Flower2,
  Cookie,
  Croissant,
  Cake,
  Sun,
  Plus,
  ArrowDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { debounce } from "@/lib/debounce";

// Helper to map string to Lucide icon components
const IconMap: { [key: string]: any } = {
  Sun,
  Coffee,
  CupSoda,
  Sparkles,
  Leaf,
  Clock,
  Flame,
  Flower2,
  Cookie,
  Croissant,
  Cake,
};

function CustomerPortal() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(false);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orderingOpen, setOrderingOpen] = useState(true);
  const [lateNight, setLateNight] = useState(false);

  useEffect(() => {
    const tick = () => {
      setOrderingOpen(isOrderingOpen());
      setLateNight(isLateNightRestricted());
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const fetchMenu = useCallback(async () => {
    const res = await fetch("/api/menu");
    if (!res.ok) throw new Error("Failed to load menu.");
    const data = await res.json();

    const categories: MenuCategory[] = (data.categories ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      iconName: c.icon_name,
    }));

    const items: MenuItem[] = (data.items ?? [])
      .filter((i: { is_available?: boolean }) => i.is_available !== false)
      .map((i: any) => ({
        id: i.id,
        name: i.name,
        price: Number(i.price),
        description: i.description,
        ingredients: Array.isArray(i.ingredients) ? i.ingredients : [],
        category: i.category_id,
        isHotAvailable: i.is_hot_available,
        isColdAvailable: i.is_cold_available,
        requiresMilkCustomization: i.requires_milk_customization,
        requiresRoastProfile: i.requires_roast_profile,
        isAvailable: i.is_available,
      }));

    setMenuCategories(categories);
    setMenuItems(items);

    if (categories.length > 0) {
      setSelectedCategory((prev) =>
        prev && categories.some((c) => c.id === prev) ? prev : categories[0].id
      );
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;
    let cancelled = false;

    const scheduleMenuRefresh = debounce(() => void fetchMenu(), 700);

    (async () => {
      try {
        await fetchMenu();
        if (cancelled) return;
        const supabase = createSupabaseBrowserClient();
        channel = supabase
          .channel("cdl-menu-v2")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "menu_items" },
            scheduleMenuRefresh
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "menu_categories" },
            scheduleMenuRefresh
          )
          .subscribe();
      } catch (e) {
        console.warn("Menu load failed:", e);
      }
    })();

    return () => {
      cancelled = true;
      scheduleMenuRefresh.cancel();
      if (channel) {
        const supabase = createSupabaseBrowserClient();
        supabase.removeChannel(channel);
      }
    };
  }, [fetchMenu]);

  // Load Cart from localStorage on mount
  useEffect(() => {
    const cachedCart = localStorage.getItem("casa_cart");
    if (cachedCart) {
      try {
        setCartItems(JSON.parse(cachedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, [searchParams]);



  // Scroll detection to fade navbar in/out
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight * 0.7) {
        setShowNavbar(true);
      } else {
        setShowNavbar(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAddToCart = (
    item: MenuItem,
    quantity: number,
    customizations: string,
    extraPrice: number
  ) => {
    const newItem: CartItem = {
      item,
      quantity,
      customizations,
      extraPrice,
    };
    const updated = [...cartItems, newItem];
    setCartItems(updated);
    localStorage.setItem("casa_cart", JSON.stringify(updated));
  };

  const scrollToMenu = useCallback(() => {
    const menuSec = document.getElementById("menu-section");
    if (menuSec) {
      menuSec.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const filteredItems = useMemo(
    () => menuItems.filter((item) => item.category === selectedCategory),
    [menuItems, selectedCategory]
  );

  const totalCartCount = useMemo(
    () => cartItems.reduce((acc, curr) => acc + curr.quantity, 0),
    [cartItems]
  );

  return (
    <div className="relative min-h-screen selection:bg-crema selection:text-matte-black bg-matte-black text-cream-light overflow-x-hidden">
      {/* Background Visual elements */}
      <FloatingBeans />
      <GlowEffect />

      {/* Floating Cart Button (Scroll persistent) */}
      <motion.button
        onClick={() => orderingOpen && setIsCartOpen(true)}
        disabled={!orderingOpen}
        className="fixed bottom-6 right-6 z-40 bg-crema hover:bg-crema-light text-matte-black font-bold p-4 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all duration-300 gap-2 border border-crema-gold/20 disabled:opacity-40 disabled:pointer-events-none"
        whileHover={orderingOpen ? { scale: 1.05 } : undefined}
      >
        <ShoppingBag size={20} />
        {totalCartCount > 0 && (
          <span className="bg-matte-black text-crema text-xs px-2 py-0.5 rounded-full font-bold">
            {totalCartCount}
          </span>
        )}
      </motion.button>

      {/* Premium Navbar (reveals after hero scroll) */}
      <AnimatePresence>
        {showNavbar && (
          <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-30 glass border-b border-white/5 px-6 py-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <CasaLogo size={40} glow sizeClassName="w-10 h-10 shrink-0" />
              <div className="flex flex-col min-w-0 justify-center">
                <span className="font-brand-title text-lg font-bold tracking-[0.12em] text-crema leading-normal">
                  CASA DE LATTE
                </span>
                <span className="text-[10px] tracking-widest text-crema-light/50 font-bold uppercase">
                  Specialty Coffee
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative bg-white/5 border border-white/10 hover:border-crema/40 text-cream-light font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-xs transition duration-300"
              >
                <ShoppingBag size={14} className="text-crema" />
                <span>My Cup</span>
                {totalCartCount > 0 && (
                  <span className="bg-crema text-matte-black px-1.5 py-0.5 rounded-full font-bold text-[9px]">
                    {totalCartCount}
                  </span>
                )}
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* 1. CINEMATIC HERO SECTION */}
      <section className="relative h-screen flex flex-col justify-between items-center text-center overflow-hidden z-10">
        {/* Parallax Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="aqua-ray left-[18%] top-0 rotate-12 opacity-30" aria-hidden />
          <div className="aqua-ray right-[22%] top-0 -rotate-6 opacity-25" aria-hidden />
          <Image
            src="/images/hero/hero-pourover.png"
            alt="Artisanal pourover coffee"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-[0.55] brightness-[0.92] contrast-[1.06] saturate-[1.08] scale-105 select-none pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-matte-black/80 via-matte-black/20 to-matte-black/45" />
          <div className="absolute inset-0 bg-[#aaecef]/[0.06] mix-blend-soft-light pointer-events-none" />
        </div>

        {/* Hero Header — logo only on md+; mobile uses single centered hero logo below */}
        <div className="w-full max-w-7xl px-6 pt-5 pb-6 md:pt-7 md:pb-8 flex justify-between items-center z-10 mt-2">
          <div className="flex items-center gap-3 min-w-0">
            <CasaLogo size={56} glow sizeClassName="hidden md:inline-flex w-14 h-14 shrink-0" />
            <div className="flex flex-col items-start justify-center min-w-0 py-0.5">
              <span className="font-brand-title text-xl md:text-2xl font-bold tracking-[0.14em] md:tracking-[0.18em] text-crema select-none leading-[1.2]">
                CASA DE LATTE
              </span>
              <span className="text-[10px] md:text-xs tracking-[0.18em] text-warm-beige/50 font-bold uppercase mt-0.5">
                Specialty Coffee
              </span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
            <span className="text-xs font-bold tracking-widest text-crema uppercase flex items-center gap-1.5">
              <span>🚗</span> Drive-In
            </span>
          </div>
        </div>

        {/* Hero Core Content */}
        <div className="max-w-4xl px-6 z-10 my-auto flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="mb-4 flex justify-center"
            >
              <CasaLogo
                size={160}
                glow
                priority
                sizeClassName="w-[7rem] h-[7rem] sm:w-[8.5rem] sm:h-[8.5rem] md:w-[10rem] md:h-[10rem]"
              />
            </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="font-hero-display text-center mb-6 select-none space-y-1"
          >
            <p className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-[0.12em] text-crema uppercase">
              Specialty Coffee
            </p>
            <p className="text-2xl sm:text-3xl md:text-5xl font-normal tracking-[0.18em] text-cream-light uppercase">
              Artisanal Brews
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1.2 }}
            className="font-hero-tagline text-base md:text-xl font-light text-warm-beige/85 tracking-wide max-w-2xl mb-10"
          >
            Brewing happiness with love and passion
          </motion.p>

          {/* Magnetic-styled Button */}
          <motion.button
            type="button"
            onClick={scrollToMenu}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="bg-crema hover:bg-crema-light text-matte-black font-bold text-sm uppercase tracking-[0.2em] px-8 py-4 rounded-xl shadow-2xl shadow-crema/20 flex items-center gap-2 border border-crema-gold/10 transition-colors duration-300"
          >
            <span>Order From Your Car</span>
            <ArrowDown size={14} className="animate-bounce" />
          </motion.button>
        </div>

        {/* Hero Footer */}
        <div className="pb-12 z-10 select-none">
          <span className="text-xs uppercase tracking-[0.3em] text-warm-beige/30 block mb-2">
            Scroll to explore
          </span>
          <div className="w-1 h-12 rounded bg-gradient-to-b from-crema to-transparent mx-auto opacity-50" />
        </div>
      </section>

      {!orderingOpen && (
        <div className="max-w-3xl mx-auto px-6 mb-8 z-10 relative">
          <div className="glass-premium border border-crema/25 rounded-2xl px-6 py-4 text-center">
            <p className="text-sm text-crema font-bold uppercase tracking-widest mb-1">We&apos;re Closed</p>
            <p className="text-xs text-warm-beige/70 leading-relaxed">{CLOSED_MESSAGE}</p>
          </div>
        </div>
      )}

      {/* 2. INTERACTIVE ANIMATED MENU */}
      <section
        id="menu-section"
        className="relative isolate py-24 px-4 sm:px-6 max-w-7xl mx-auto z-10 scroll-mt-24 md:scroll-mt-28"
      >
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-[0.3em] text-crema font-bold block mb-3">
            Handcrafted Selection
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight">
            Explore the <span className="italic font-normal text-crema">Menu</span>
          </h2>
          <div className="w-24 h-0.5 bg-crema/30 mx-auto mt-4 rounded" />
        </div>

        {/* Category tabs — padded scroll area so left edge is never clipped */}
        <div className="-mx-4 sm:-mx-6 overflow-x-auto overflow-y-visible pb-4 mb-10 no-scrollbar scroll-smooth scroll-pl-4 sm:scroll-pl-6 scroll-pr-4 sm:scroll-pr-6">
          <div className="flex flex-nowrap gap-2 px-4 sm:px-6 min-w-min">
          {menuCategories.map((cat) => {
            const IconComponent = IconMap[cat.iconName] || Coffee;
            const isSelected = selectedCategory === cat.id;
            const catLate = lateNight && isCategoryUnavailableLateNight(cat.id);

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-start gap-0.5 px-5 py-3 rounded-xl border text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                  isSelected
                    ? "bg-crema border-crema text-matte-black shadow-lg shadow-crema/10 scale-102"
                    : "bg-white/5 border-white/5 hover:border-crema/40 text-warm-beige"
                }`}
              >
                <span className="flex items-center gap-2">
                  <IconComponent size={14} />
                  <span>{cat.name}</span>
                </span>
                {catLate && (
                  <span className="text-[8px] font-bold uppercase tracking-wide text-amber-400/90">
                    {LATE_NIGHT_LABEL}
                  </span>
                )}
              </button>
            );
          })}
          </div>
        </div>

        {/* Category Subtitle */}
        <div className="text-center md:text-left mb-8 max-w-xl mx-auto md:mx-0">
          <p className="text-sm text-warm-beige/60 italic leading-relaxed">
            {menuCategories.find((c) => c.id === selectedCategory)?.description}
          </p>
        </div>

        {/* Grid of Menu Items */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.length === 0 && menuCategories.length > 0 && (
              <motion.p
                key="empty-menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center text-sm text-warm-beige/50 italic py-12"
              >
                No items in this category right now.
              </motion.p>
            )}
            {filteredItems.map((item) => {
              const itemLate = isCategoryUnavailableLateNight(item.category);
              return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                whileHover={itemLate ? undefined : { y: -6 }}
                onClick={() => !itemLate && setActiveItem(item)}
                className={`group relative glass rounded-2xl p-5 border flex flex-col justify-between h-48 select-none transition-all duration-300 ${
                  itemLate
                    ? "opacity-50 cursor-not-allowed border-white/5"
                    : "cursor-pointer border-white/5 hover:border-crema/30"
                }`}
              >
                {/* Highlight Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-crema/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition duration-500 pointer-events-none" />

                <div>
                  {/* Category badge & temp tag */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] tracking-wider uppercase bg-white/5 text-warm-beige/60 border border-white/10 px-2 py-0.5 rounded-full font-bold">
                      {item.category.replace("-", " ")}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.isHotAvailable && (
                        <Flame size={10} className="text-orange-400/70" />
                      )}
                      {item.isColdAvailable && (
                        <CupSoda size={10} className="text-sky-400/70" />
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-serif text-lg font-bold group-hover:text-crema tracking-wide transition duration-300">
                    {item.name}
                  </h3>
                  <p className="text-xs text-warm-beige/60 leading-relaxed mt-1.5 line-clamp-2">
                    {item.description}
                  </p>
                  {itemLate && lateNight && orderingOpen && (
                    <p className="text-[9px] text-amber-400/90 font-bold uppercase mt-2 tracking-wide">
                      {LATE_NIGHT_LABEL}
                    </p>
                  )}
                </div>

                {/* Pricing & Add Quick Button */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 z-10">
                  <span className="font-bold text-crema text-sm">
                    ₹{item.price}
                  </span>
                  
                  {/* Glass indicator button */}
                  <span className="bg-white/5 border border-white/10 group-hover:bg-crema group-hover:text-matte-black group-hover:border-crema text-warm-beige rounded-xl p-2 flex items-center justify-center transition-all duration-300">
                    <Plus size={14} />
                  </span>
                </div>
              </motion.div>
            );
            })}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* 3. ITEM DETAIL MODAL */}
      <ItemDetailModal
        item={activeItem}
        onClose={() => setActiveItem(null)}
        onAddToCart={handleAddToCart}
      />

      {/* 4. CART & ORDER DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        setCartItems={setCartItems}
        orderingOpen={orderingOpen}
      />

      <CreatorsSection />

      {/* 5. FOOTER */}
      <footer className="relative border-t border-white/5 py-12 px-6 bg-black/40 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <CasaLogo size={40} glow />
            <div className="flex flex-col">
              <span className="font-brand-title text-lg font-bold tracking-widest text-crema">
                CASA DE LATTE
              </span>
              <span className="text-[10px] tracking-[0.2em] text-warm-beige/40 font-bold uppercase mt-0.5">
                Specialty Coffee
              </span>
            </div>
          </div>

          <p className="text-xs text-warm-beige/40 max-w-md leading-normal">
            &copy; 2026 Casa De Latte. Premium drive-in specialty coffee — order from your car, pay at delivery.
          </p>
        </div>
        <FooterContact />
        <FooterCredit />
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen message="Grinding beans..." />}>
      <CustomerPortal />
    </Suspense>
  );
}
