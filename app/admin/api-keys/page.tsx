"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Key,
  Search,
  Building2,
  Bot,
  User,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Activity,
  Calendar,
  Shield,
  Layers,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function SuperAdminApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalKeys: 0,
    activeKeys: 0,
    revokedKeys: 0,
    createdThisMonth: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "REVOKED">("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const [keyToRevoke, setKeyToRevoke] = useState<any | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/api-keys");
      if (res.ok) {
        const json = await res.json();
        setKeys(json.data.keys || []);
        setStats(
          json.data.stats || {
            totalKeys: 0,
            activeKeys: 0,
            revokedKeys: 0,
            createdThisMonth: 0,
          }
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleRevoke = async () => {
    if (!keyToRevoke) return;
    setIsRevoking(true);
    try {
      const res = await fetch(`/api/v1/api-keys/${keyToRevoke.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setKeyToRevoke(null);
        fetchKeys();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRevoking(false);
    }
  };

  const filteredKeys = keys.filter((k) => {
    const matchesSearch =
      k.name?.toLowerCase().includes(search.toLowerCase()) ||
      k.keyPrefix?.toLowerCase().includes(search.toLowerCase()) ||
      k.agent?.name?.toLowerCase().includes(search.toLowerCase()) ||
      k.tenant?.name?.toLowerCase().includes(search.toLowerCase()) ||
      k.creator?.email?.toLowerCase().includes(search.toLowerCase()) ||
      k.creator?.fullName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || k.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Ambient Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-card/90 border border-border/80 p-6 sm:p-8 shadow-sm ambient-glow-mesh overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <Badge variant="glow" className="text-[10px] font-semibold">
                Platform Security & Auth
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              API Keys Management
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-normal">
              Platform-wide telemetry, client tenant credentials, and active secret authorization keys.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchKeys}
            disabled={isLoading}
            className="text-xs font-semibold shadow-xs shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/80 shadow-xs p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total API Keys</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-foreground">{stats.totalKeys}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Across all client tenants</p>
        </Card>

        <Card className="border-border/80 shadow-xs p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Active Keys</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {stats.activeKeys}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Authorizing active web widgets</p>
        </Card>

        <Card className="border-border/80 shadow-xs p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Revoked Keys</span>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-red-600 dark:text-red-400">
            {stats.revokedKeys}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Deactivated or rotated</p>
        </Card>

        <Card className="border-border/80 shadow-xs p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Created This Month</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-foreground">{stats.createdThisMonth}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">New integrations provisioned</p>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="p-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search key, client organization, agent, or creator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {(["ALL", "ACTIVE", "REVOKED"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Key Name & Prefix</th>
                  <th className="px-6 py-4">Client Organization</th>
                  <th className="px-6 py-4">Associated AI Agent</th>
                  <th className="px-6 py-4">Created By</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-muted-foreground">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary mb-2" />
                      Loading platform API credentials...
                    </td>
                  </tr>
                ) : filteredKeys.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-muted-foreground space-y-2">
                      <Key className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="font-semibold text-foreground">No API keys found.</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your search criteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredKeys.map((k) => (
                    <tr key={k.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{k.name}</div>
                        <div className="font-mono text-[11px] text-primary mt-0.5">
                          {k.keyPrefix}••••••••
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{k.tenant?.name || "Global Tenant"}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <Bot className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{k.agent?.name || "Unassigned Agent"}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{k.creator?.fullName || "Admin"}</div>
                        <div className="text-[10px] text-muted-foreground">{k.creator?.email}</div>
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4">
                        <Badge
                          variant={k.status === "ACTIVE" ? "success" : "destructive"}
                          className="text-[10px] font-semibold"
                        >
                          {k.status}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {k.status === "ACTIVE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setKeyToRevoke(k)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 px-2.5 text-xs"
                            title="Revoke Key"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      {keyToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Revoke API Key?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Are you sure you want to revoke <strong className="text-foreground">{keyToRevoke.name}</strong>?
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-2xl border border-border/60">
              Any chat widgets or API integrations using this key will immediately stop working.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setKeyToRevoke(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isRevoking}
                onClick={handleRevoke}
                className="text-xs font-semibold"
              >
                {isRevoking ? "Revoking..." : "Revoke Key"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
