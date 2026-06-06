import React from "react";

interface EnyiLogoProps {
  className?: string;
  size?: number;
}

export default function EnyiLogo({ className = "", size = 32 }: EnyiLogoProps) {
  return (
    <div 
      className={`relative rounded-lg flex items-center justify-center bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#1e3a8a] shadow-inner p-1.5 shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-white"
      >

        <path
          d="M 75 25 L 53 25 C 41 25, 33 33, 33 45 L 33 55 C 33 67, 41 75, 53 75 L 75 75"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M 23 75 C 23 53, 40 46, 68 46"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
