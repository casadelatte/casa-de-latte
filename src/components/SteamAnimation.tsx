"use client";

import React from "react";

export default function SteamAnimation({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex justify-center items-center w-12 h-16 ${className}`}>
      {/* Steam trails */}
      <svg
        className="absolute bottom-2 overflow-visible"
        width="30"
        height="50"
        viewBox="0 0 30 50"
        fill="none"
      >
        <defs>
          <linearGradient id="steamGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#c7a17a" stopOpacity="0" />
            <stop offset="30%" stopColor="#e6dfd5" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#faf8f5" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Path 1 */}
        <path
          className="animate-steam"
          style={{ animationDelay: "0s", animationDuration: "3.5s" }}
          d="M 15,45 C 10,35 20,25 15,15 C 10,5 20,-5 15,-15"
          stroke="url(#steamGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Path 2 */}
        <path
          className="animate-steam"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
          d="M 8,45 C 13,35 3,25 8,15 C 13,5 3,-5 8,-15"
          stroke="url(#steamGrad)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Path 3 */}
        <path
          className="animate-steam"
          style={{ animationDelay: "2s", animationDuration: "3s" }}
          d="M 22,45 C 17,35 27,25 22,15 C 17,5 27,-5 22,-15"
          stroke="url(#steamGrad)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
