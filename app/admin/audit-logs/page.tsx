"use client";

import React, { useEffect, useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Shield,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Globe,
  User,
  Activity,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/ui/pagination-bar";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Purge Modal State
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeOlderThan, setPurgeOlderThan] = useState("30");
  const [isPurging, setIsPurging] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/audit?page=${page}&pageSize=10&action=${encodeURIComponent(actionFilter)}`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data.items || []);
        setTotal(json.data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const handleExportCsv = () => {
    window.location.href = `/api/v1/audit?export=csv`;
  };

  const handlePurgeLogs = async () => {
    setIsPurging(true);
    try {
      const url = purgeOlderThan === "ALL" ? `/api/v1/audit` : `/api/v1/audit?olderThanDays=${purgeOlderThan}`;
      const res = await fetch(url, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowPurgeModal(false);
        fetchLogs();
      } else {
        alert(json.error?.message || "Failed to purge audit logs");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPurging(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.entityType?.toLowerCase().includes(term) ||
      log.actor?.fullName?.toLowerCase().includes(term) ||
      log.actor?.email?.toLowerCase().includes(term) ||
      log.ipAddress?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Ambient Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-card/90 border border-border/80 p-6 sm:p-8 shadow-sm ambient-glow-mesh overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Security & Compliance
              </span>
              <Badge variant="glow" className="text-[10px] font-semibold">
                {total} Audit Records
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Security & Audit Trail
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-normal leading-relaxed">
              Immutable system audit logs tracking actor events, entity mutations, client IP addresses, and timestamps.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              onClick={handleExportCsv}
              variant="outline"
              size="lg"
              className="font-semibold text-xs shadow-xs"
            >
              <Download className="w-4 h-4 mr-1.5" /> Export CSV
            </Button>
            <Button
              onClick={() => setShowPurgeModal(true)}
              variant="destructive"
              size="lg"
              className="font-semibold text-xs shadow-xs"
            >
              <Trash2 className="w-4 h-4 mr-1.5" /> Purge Logs
            </Button>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
            <Input
              placeholder="Search audit trail by actor, IP, action, entity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex bg-muted/60 border border-border/80 rounded-xl p-1 text-xs">
              {[
                { label: "All Events", value: "" },
                { label: "Client Events", value: "CLIENT" },
                { label: "Model Events", value: "MODEL" },
                { label: "Ticket Events", value: "TICKET" },
                { label: "User Events", value: "USER" },
              ].map((filter) => (
                <button
                  key={filter.label}
                  onClick={() => {
                    setActionFilter(filter.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    actionFilter === filter.value
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <Button
              onClick={fetchLogs}
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target Entity</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Workspace / Tenant</th>
                  <th className="px-6 py-4">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        <span>Loading audit trail from PostgreSQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-muted-foreground">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                          <Shield className="w-6 h-6" />
                        </div>
                        <div className="font-bold text-foreground text-sm">No Audit Events Found</div>
                        <p className="text-xs text-muted-foreground">
                          No audit entries match the current filter or search criteria.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      <td className="px-6 py-4 font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 font-mono text-[10px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {log.entityType} {log.entityId ? <span className="text-[11px] font-mono text-muted-foreground font-normal">({log.entityId.substring(0, 8)}...)</span> : ""}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{log.actor?.fullName || "System / Auto"}</div>
                        <div className="text-[11px] text-muted-foreground">{log.actor?.email || "internal@brainplug.ai"}</div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {log.tenant?.companyName || "Global Platform"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-foreground font-semibold">
                          <Globe className="w-3.5 h-3.5 text-primary" />
                          <span>{log.ipAddress || "127.0.0.1"}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PaginationBar
            currentPage={page}
            totalItems={total}
            pageSize={10}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Purge Audit Logs Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-foreground">Purge Audit Log History?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Select the retention window to purge historical security audit entries.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Retention Threshold</label>
              <select
                value={purgeOlderThan}
                onChange={(e) => setPurgeOlderThan(e.target.value)}
                className="w-full rounded-xl border border-border/80 p-2.5 bg-background text-xs text-foreground font-semibold shadow-xs"
              >
                <option value="90">Purge records older than 90 days</option>
                <option value="30">Purge records older than 30 days</option>
                <option value="7">Purge records older than 7 days</option>
                <option value="ALL">Purge all audit logs completely</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPurgeModal(false)}
                disabled={isPurging}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handlePurgeLogs}
                disabled={isPurging}
                className="text-xs font-semibold"
              >
                {isPurging ? "Purging..." : "Confirm Purge"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
