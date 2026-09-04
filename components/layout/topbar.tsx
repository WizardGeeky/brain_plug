"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/auth-provider";
import {
  Search,
  Sun,
  Moon,
  Menu,
  Sparkles,
  Activity,
  Bell,
  CheckCircle2,
  Code2,
  ShieldCheck,
  Building2,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Settings,
  Key,
  HelpCircle,
  Zap,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export interface TopbarProps {
  title?: string;
  onMenuClick?: () => void;
  tagline?: string;
}

export function Topbar({ title, onMenuClick, tagline = "AI Agent Infra" }: TopbarProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const currentTheme = mounted ? resolvedTheme || theme : "light";

  const triggerSearch = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  const getUserInitials = () => {
    if (!user?.fullName) return "BP";
    const parts = user.fullName.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getRoleBadge = () => {
    const role = user?.role || "CLIENT_USER";
    if (role === "SUPER_ADMIN") {
      return {
        label: "Super Admin",
        color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25",
        icon: ShieldCheck,
      };
    }
    if (role === "CLIENT_ADMIN") {
      return {
        label: "Client Admin",
        color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
        icon: Building2,
      };
    }
    return {
      label: "Client User",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
      icon: UserIcon,
    };
  };

  const roleInfo = getRoleBadge();
  const RoleIcon = roleInfo.icon;

  return (
    <header className="h-16 sm:h-18 border-b border-border/80 bg-background/95 sm:bg-card/85 backdrop-blur-2xl px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-all select-none">
      {/* ------------------------------------------------------------------ */}
      {/* LEFT: Menu Toggle & Prominent Brand Logo & Breadcrumbs             */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-muted/70 active:scale-95 transition-all shrink-0 cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </button>
        )}

        {/* Mobile Brand Display - Big, Bold & Beautiful */}
        <div className="lg:hidden flex items-center min-w-0">
          <BrandLogo size="md" tagline={tagline} taglineClassName="hidden sm:inline-block" />
        </div>

        {/* Desktop Breadcrumbs & Live Status */}
        <div className="hidden lg:flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Brain Plug</span>
            <span className="text-muted-foreground/40 text-xs">/</span>
            <h1 className="text-sm font-bold text-foreground tracking-tight truncate">
              {title || "Dashboard"}
            </h1>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${roleInfo.color}`}
          >
            <RoleIcon className="w-3.5 h-3.5" />
            <span>{roleInfo.label}</span>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Gemini 2.0 • Online</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT: Streamlined Actions, Notifications, Theme & Avatar          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Desktop Quick Search Pill (Ctrl+K) */}
        <button
          type="button"
          onClick={triggerSearch}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/80 bg-background/80 hover:bg-accent text-xs text-muted-foreground hover:text-foreground transition-all shadow-xs active:scale-95 group cursor-pointer"
          title="Quick Search (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 transition-transform group-hover:scale-110" />
          <span className="font-medium text-xs">Search tools...</span>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-muted-foreground border border-border/80">
            Ctrl K
          </kbd>
        </button>

        {/* Mobile Search Icon (Clean Ghost Button) */}
        <button
          type="button"
          onClick={triggerSearch}
          className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-muted/70 transition-colors active:scale-95 cursor-pointer"
          title="Search (Ctrl+K)"
          aria-label="Search"
        >
          <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </button>

        {/* Developer API Docs Link (Desktop) */}
        <Link
          href="/docs"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-background/80 hover:bg-accent text-xs font-semibold text-foreground transition-all shadow-xs active:scale-95"
          title="API Documentation"
        >
          <Code2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span className="hidden lg:inline">API Docs</span>
        </Link>

        {/* Interactive Notifications Bell (Clean Ghost Button) */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-muted/70 transition-colors active:scale-95 cursor-pointer"
            aria-label="Notifications"
            title="System Alerts"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-600 ring-2 ring-background animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl bg-card border border-border shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-foreground">System Alerts</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                    {unreadCount} Active
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setUnreadCount(0)}
                    className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-semibold cursor-pointer"
                  >
                    Mark as read
                  </button>
                )}
              </div>

              <div className="py-2 space-y-2 max-h-72 overflow-y-auto custom-scrollbar text-xs">
                <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-600" /> Gemini 2.0 Flash Connected
                    </span>
                    <span className="text-[10px] text-muted-foreground">Live</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Primary inference model operating with sub-second streaming latency.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> pgvector Knowledge Sync
                    </span>
                    <span className="text-[10px] text-muted-foreground">Ready</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Vector RAG storage is synchronized across tenant partitions.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> AES-256 Vault Active
                    </span>
                    <span className="text-[10px] text-muted-foreground">Secure</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Tenant credentials and API tokens are encrypted in PostgreSQL.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle (Clean Ghost Button) */}
        <button
          type="button"
          onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-muted/70 transition-colors active:scale-95 cursor-pointer"
          aria-label="Toggle Theme Mode"
          title={currentTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {mounted ? (
            currentTheme === "dark" ? (
              <Sun className="w-5 h-5 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-5 h-5 text-purple-600 transition-transform hover:-rotate-12" />
            )
          ) : (
            <div className="w-5 h-5" />
          )}
        </button>

        {/* ------------------------------------------------------------------ */}
        {/* User Profile Avatar Trigger (Clean Glowing Circle)                 */}
        {/* ------------------------------------------------------------------ */}
        <div className="relative ml-0.5 sm:ml-1" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-0.5 sm:px-2.5 sm:py-1 rounded-full sm:rounded-xl sm:border sm:border-border/80 sm:bg-background/80 hover:bg-accent transition-all cursor-pointer group active:scale-95"
            aria-label="User profile menu"
          >
            {/* Standalone Circular Gradient Avatar */}
            <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-purple-600/25 ring-2 ring-purple-500/25 group-hover:ring-purple-500/50 transition-all shrink-0">
              {getUserInitials()}
            </div>

            {/* Desktop Name and Role */}
            <div className="hidden sm:flex flex-col text-left min-w-0 pr-1">
              <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
                {user?.fullName || "User"}
              </span>
              <span className="text-[10px] text-muted-foreground truncate capitalize">
                {roleInfo.label}
              </span>
            </div>

            <ChevronDown
              className={`hidden sm:inline w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Profile Dropdown Popover */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 sm:w-72 rounded-2xl bg-card border border-border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Profile Card Header */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 mb-2">
                <div className="font-bold text-xs sm:text-sm text-foreground truncate">
                  {user?.fullName || "User Account"}
                </div>
                <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {user?.email || "user@example.com"}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleInfo.color}`}
                  >
                    <RoleIcon className="w-3 h-3" />
                    <span>{roleInfo.label}</span>
                  </span>
                </div>
              </div>

              {/* Menu Links */}
              <div className="space-y-0.5 text-xs font-medium text-foreground">
                <Link
                  href={user?.role === "SUPER_ADMIN" ? "/admin/settings" : "/client/settings"}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-accent transition-colors"
                >
                  <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Account & Workspace Settings</span>
                </Link>

                <Link
                  href={user?.role === "SUPER_ADMIN" ? "/admin/api-keys" : "/client/api-keys"}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-accent transition-colors"
                >
                  <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>API Keys & Credentials</span>
                </Link>

                <Link
                  href={user?.role === "SUPER_ADMIN" ? "/admin/tickets" : "/client/tickets"}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-accent transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Support & Change Requests</span>
                </Link>

                <Link
                  href="/docs"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-accent transition-colors"
                >
                  <Code2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Developer API Docs</span>
                </Link>
              </div>

              {/* Log Out Divider & Button */}
              <div className="pt-2 mt-2 border-t border-border/80">
                <button
                  type="button"
                  onClick={async () => {
                    setProfileOpen(false);
                    await logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
