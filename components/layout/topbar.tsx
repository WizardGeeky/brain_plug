"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/auth-provider";
import { Search, Sun, Moon, Menu, Sparkles, Activity } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";

export interface TopbarProps {
  title?: string;
  onMenuClick?: () => void;
  tagline?: string;
}

export function Topbar({ title, onMenuClick, tagline = "AI Agent Infra" }: TopbarProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (resolvedTheme || theme) : "light";

  return (
    <header className="h-16 sm:h-18 border-b border-border/80 bg-card/75 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors shadow-xs">
      {/* Left: Mobile Menu Toggle & Brand / Title */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl border border-border bg-background/80 hover:bg-accent text-foreground transition-all shrink-0 active:scale-95 shadow-xs"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-4 h-4 text-primary" />
          </button>
        )}

        {/* Mobile Brand Display */}
        <div className="lg:hidden shrink-0">
          <BrandLogo size="sm" tagline={tagline} />
        </div>

        {/* Desktop Title & Status Indicator */}
        <div className="hidden lg:flex items-center gap-3">
          <h1 className="text-base font-bold text-foreground tracking-tight">
            {title || "Dashboard"}
          </h1>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Systems Online</span>
          </div>
        </div>
      </div>

      {/* Right: Quick Search & Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Search Button triggering Ctrl+K */}
        <button
          onClick={() => {
            const event = new KeyboardEvent("keydown", {
              key: "k",
              ctrlKey: true,
              bubbles: true,
            });
            document.dispatchEvent(event);
          }}
          className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl border border-border/90 bg-background/70 hover:bg-accent text-xs text-muted-foreground hover:text-foreground transition-all shadow-xs active:scale-95 group"
          title="Quick Search (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-primary shrink-0 transition-transform group-hover:scale-110" />
          <span className="hidden sm:inline font-medium">Quick search...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-muted-foreground border border-border/80">
            Ctrl K
          </kbd>
        </button>

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
          className="p-2 sm:p-2.5 rounded-xl border border-border/90 bg-background/70 hover:bg-accent text-foreground transition-all shrink-0 active:scale-95 shadow-xs"
          aria-label="Toggle Theme Mode"
          title={currentTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {mounted ? (
            currentTheme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 transition-transform hover:-rotate-12" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
}
