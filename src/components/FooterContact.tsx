"use client";

import { AtSign, MapPin, Phone } from "lucide-react";

const PHONES = ["9100741010", "9177394254", "9000003406"];
const INSTAGRAM = "casa_de_latte";
const MAPS_QUERY = encodeURIComponent(
  "Parking lot 2, KBR Park, Road no 2, Banjara Hills, Hyderabad 500034"
);
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`;

export default function FooterContact() {
  return (
    <div className="max-w-7xl mx-auto w-full grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left border-t border-white/5 pt-8 mt-6">
      <div className="space-y-2">
        <div className="flex items-center justify-center sm:justify-start gap-2 text-crema">
          <Phone size={14} />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Call Us</span>
        </div>
        <ul className="space-y-1">
          {PHONES.map((num) => (
            <li key={num}>
              <a
                href={`tel:+91${num}`}
                className="text-sm text-warm-beige/70 hover:text-crema transition"
              >
                +91 {num}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-center sm:justify-start gap-2 text-crema">
          <AtSign size={14} />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Instagram</span>
        </div>
        <a
          href={`https://instagram.com/${INSTAGRAM}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-warm-beige/70 hover:text-crema transition"
        >
          @{INSTAGRAM}
        </a>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-center sm:justify-start gap-2 text-crema">
          <MapPin size={14} />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Visit</span>
        </div>
        <a
          href={MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-warm-beige/70 hover:text-crema transition leading-relaxed block"
        >
          Parking lot 2, KBR Park,
          <br />
          Road no 2, Banjara Hills,
          <br />
          Hyderabad 500034
        </a>
      </div>
    </div>
  );
}
