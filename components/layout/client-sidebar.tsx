"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  Headphones,
  Users,
  Settings,
  LogOut,
  X,
  Code2,
  Sparkles,
  Key,
} from "lucide-react";

export interface ClientSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function ClientSidebar({ isMobileOpen, onMobileClose }: ClientSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navLinks = [
    { label: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
    { label: "AI Agents", href: "/client/agents", icon: Bot },
    { label: "API Keys", href: "/client/api-keys", icon: Key },
    { label: "Live Conversations", href: "/client/conversations", icon: MessageSquare },
    { label: "Support & Tickets", href: "/client/tickets", icon: Headphones },
    { label: "Team Members", href: "/client/users", icon: Users },
    { label: "Developer Hub & Docs", href: "/docs", icon: Code2 },
    { label: "Settings", href: "/client/settings", icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full bg-card">
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        {/* Logo & Brand Header */}
        <div className="h-16 sm:h-18 flex items-center justify-between px-5 sm:px-6 border-b border-border/80 shrink-0">
          <BrandLogo size="md" tagline="Client Portal" href="/client/dashboard" />
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Section Label */}
        <div className="px-5 pt-6 pb-2.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Agent Workspace
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Live
          </span>
        </div>

        {/* Navigation Items */}
        <div className="px-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/client/dashboard"
                ? pathname === "/client/dashboard"
                : pathname.startsWith(link.href);

            return (
              <a
                key={link.href}
                href={link.href}
                onClick={onMobileClose}
                className={cn(
                  "relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-md shadow-indigo-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70 hover:translate-x-0.5"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform duration-200 group-hover:scale-110 shrink-0",
                    isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"
                  )}
                />
                <span className="truncate">{link.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </a>
            );
          })}
        </div>
      </div>

      {/* User Profile & Logout */}
      <div className="p-3.5 sm:p-4 border-t border-border/80 bg-muted/20 shrink-0">
        <a
          href="/client/profile"
          onClick={onMobileClose}
          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-all mb-2 group border border-transparent hover:border-border/60"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            {user?.fullName?.charAt(0) || "C"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {user?.fullName || "Client Admin"}
            </div>
            <div className="text-[11px] text-muted-foreground truncate font-normal">
              {user?.email || "user@workspace.com"}
            </div>
          </div>
        </a>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-all active:scale-[0.98] border border-transparent hover:border-red-500/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-border/80 bg-card flex-col shrink-0 h-screen sticky top-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card border-r border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
