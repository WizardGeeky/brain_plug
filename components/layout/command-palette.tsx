"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  Search,
  Bot,
  Users,
  Database,
  Key,
  Shield,
  FileText,
  BarChart3,
  Sliders,
  Sparkles,
  X,
  Building2,
  Headphones,
  Cpu,
  Zap,
  ArrowRight,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const adminNav = [
    { title: "Dashboard Overview", href: "/admin/dashboard", icon: BarChart3, category: "Navigation", desc: "View global telemetry & stats" },
    { title: "Clients & Tenants", href: "/admin/clients", icon: Building2, category: "Management", desc: "Onboard and manage organizations" },
    { title: "Gemini Models Registry", href: "/admin/models", icon: Cpu, category: "AI Engine", desc: "Configure quotas & token pricing" },
    { title: "Support & CR Tickets", href: "/admin/tickets", icon: Headphones, category: "Support", desc: "Resolve client support tickets" },
    { title: "Roles & Permissions", href: "/admin/roles", icon: Shield, category: "Security", desc: "Manage RBAC access policies" },
    { title: "Platform Users", href: "/admin/users", icon: Users, category: "Management", desc: "Directory of all workspace users" },
    { title: "Platform Telemetry", href: "/admin/analytics", icon: Zap, category: "Metrics", desc: "Detailed API latency and volume" },
    { title: "Audit Trail", href: "/admin/audit-logs", icon: FileText, category: "Security", desc: "Cryptographic security audit logs" },
    { title: "Platform Settings", href: "/admin/settings", icon: Sliders, category: "System", desc: "API keys & system configuration" },
  ];

  const clientNav = [
    { title: "Dashboard Overview", href: "/client/dashboard", icon: BarChart3, category: "Navigation", desc: "Tenant workspace metrics" },
    { title: "My AI Agents", href: "/client/agents", icon: Bot, category: "Agents", desc: "Manage and configure chatbots" },
    { title: "Create New AI Agent", href: "/client/agents/new", icon: Sparkles, category: "Agents", desc: "Deploy new customized agent" },
    { title: "Live Conversations", href: "/client/conversations", icon: MessageSquareIcon, category: "Chat", desc: "Real-time user conversation logs" },
    { title: "Support & Tickets", href: "/client/tickets", icon: Headphones, category: "Support", desc: "Raise and track support requests" },
    { title: "Team Members", href: "/client/users", icon: Users, category: "Team", desc: "Invite colleagues to workspace" },
    { title: "Developer Docs", href: "/docs", icon: FileText, category: "Integration", desc: "API & widget integration guides" },
    { title: "Workspace Settings", href: "/client/settings", icon: Sliders, category: "Settings", desc: "Tenant branding & preferences" },
  ];

  function MessageSquareIcon(props: any) {
    return <FileText {...props} />;
  }

  const items = user?.role === "SUPER_ADMIN" ? adminNav : clientNav;

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase()) ||
    item.desc.toLowerCase().includes(query.toLowerCase())
  );

  const navigate = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-border bg-muted/20">
          <Search className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search pages... (Esc to exit)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none font-medium"
          />
          <button
            onClick={() => setOpen(false)}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              No matching pages or tools found.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/70 text-left transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate font-normal">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-md bg-muted border border-border">
                      {item.category}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-muted/40 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground font-medium">
          <span>Search & Navigation Hub</span>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-semibold">
              Ctrl K
            </kbd>
            <span>to open</span>
          </div>
        </div>
      </div>
    </div>
  );
}
