"use client";

import React, { useId } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  tagline?: string;
  taglineClassName?: string;
  href?: string;
  className?: string;
  isLink?: boolean;
  variant?: "default" | "light" | "dark";
}

export function BrandLogo({
  size = "md",
  showTagline = true,
  tagline = "AI Agent Infra",
  taglineClassName,
  href = "/",
  className,
  isLink = true,
  variant = "default",
}: BrandLogoProps) {
  const gradientId = useId();

  // Responsive Standalone Icon Dimensions
  const iconDimensions = {
    sm: "w-6 h-6 sm:w-7 sm:h-7",
    md: "w-7 h-7 sm:w-9 sm:h-9",
    lg: "w-9 h-9 sm:w-11 sm:h-11",
    xl: "w-12 h-12 sm:w-14 sm:h-14",
  }[size];

  const brandTextSize = {
    sm: "text-xs sm:text-sm",
    md: "text-sm sm:text-base",
    lg: "text-lg sm:text-xl",
    xl: "text-xl sm:text-2xl",
  }[size];

  const taglineSize = {
    sm: "text-[8px] sm:text-[9px] tracking-wide",
    md: "text-[8.5px] sm:text-[10px] tracking-wide",
    lg: "text-[10px] sm:text-xs tracking-wider",
    xl: "text-xs tracking-widest",
  }[size];

  // Text color classes based on variant
  const brainTextColor =
    variant === "light"
      ? "text-[#1E1B4B]"
      : variant === "dark"
      ? "text-white"
      : "text-foreground";

  const plugTextColor =
    variant === "light"
      ? "text-purple-600 font-extrabold"
      : variant === "dark"
      ? "text-purple-400 font-extrabold"
      : "text-purple-600 dark:text-purple-400 font-extrabold";

  const taglineTextColor =
    variant === "light"
      ? "text-slate-500 font-medium"
      : variant === "dark"
      ? "text-slate-400 font-medium"
      : "text-muted-foreground font-medium";

  const content = (
    <div className={cn("inline-flex items-center gap-2 sm:gap-2.5 group select-none shrink-0", className)}>
      {/* Standalone "Brain with AI" Vector Icon */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          "shrink-0 transition-transform duration-200 group-hover:scale-105",
          iconDimensions
        )}
      >
        <defs>
          <linearGradient id={`${gradientId}-grad`} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        {/* Left Brain Lobe */}
        <path
          d="M9.5 4.5a3.2 3.2 0 0 0-3.2 3.2c0 .4.1.8.2 1.2A3.2 3.2 0 0 0 4.5 12a3.2 3.2 0 0 0 2 3c-.1.3-.1.7-.1 1a3.2 3.2 0 0 0 3.1 3.2c.8 0 1.5-.3 2.1-.8"
          stroke={`url(#${gradientId}-grad)`}
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Right Brain Lobe */}
        <path
          d="M14.5 4.5a3.2 3.2 0 0 1 3.2 3.2c0 .4-.1.8-.2 1.2a3.2 3.2 0 0 1 2 3.1 3.2 3.2 0 0 1-2 3c.1.3.1.7.1 1a3.2 3.2 0 0 1-3.1 3.2c-.8 0-1.5-.3-2.1-.8"
          stroke={`url(#${gradientId}-grad)`}
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* AI Neural Circuit Pathways */}
        <path d="M9.5 8.5h5" stroke={`url(#${gradientId}-grad)`} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7.5 12h9" stroke={`url(#${gradientId}-grad)`} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9.5 15.5h5" stroke={`url(#${gradientId}-grad)`} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 6v12" stroke={`url(#${gradientId}-grad)`} strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />

        {/* AI Synapse Nodes */}
        <circle cx="9.5" cy="8.5" r="1.1" fill="#9333ea" />
        <circle cx="14.5" cy="8.5" r="1.1" fill="#6366f1" />
        <circle cx="7.5" cy="12" r="1.1" fill="#9333ea" />
        <circle cx="16.5" cy="12" r="1.1" fill="#6366f1" />
        <circle cx="9.5" cy="15.5" r="1.1" fill="#9333ea" />
        <circle cx="14.5" cy="15.5" r="1.1" fill="#6366f1" />

        {/* Glowing Center AI Core Node */}
        <circle cx="12" cy="12" r="1.6" fill={`url(#${gradientId}-grad)`} />
      </svg>

      {/* Clean, Refined Brand Typography Stack */}
      <div className="flex flex-col justify-center text-left leading-none">
        <div className={cn("font-bold tracking-tight flex items-center gap-1 leading-none", brainTextColor, brandTextSize)}>
          <span>Brain</span>
          <span className={plugTextColor}>Plug</span>
        </div>

        {showTagline && (
          <span
            className={cn(
              "whitespace-nowrap mt-0.5 sm:mt-1 leading-none",
              taglineTextColor,
              taglineSize,
              taglineClassName || "hidden sm:inline-block"
            )}
          >
            {tagline}
          </span>
        )}
      </div>
    </div>
  );

  if (isLink) {
    return (
      <Link href={href} className="inline-block outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
