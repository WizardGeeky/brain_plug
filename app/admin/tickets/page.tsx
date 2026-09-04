"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Headphones,
  Search,
  Filter,
  ExternalLink,
  Clock,
  AlertCircle,
  CheckCircle2,
  Building2,
  User,
  MessageSquare,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/ui/pagination-bar";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Delete State
  const [ticketToDelete, setTicketToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus) params.set("status", selectedStatus);
      if (selectedPriority) params.set("priority", selectedPriority);
      if (search) params.set("search", search);
      params.set("page", page.toString());
      params.set("pageSize", "10");

      const res = await fetch(`/api/v1/tickets?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setTickets(json.data.items || []);
        setTotal(json.data.total || 0);
        if (json.data.statusCounts) {
          setStatusCounts(json.data.statusCounts);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [selectedStatus, selectedPriority, search, page]);

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/tickets/${ticketToDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTicketToDelete(null);
        fetchTickets();
      } else {
        alert(json.error?.message || "Failed to delete ticket");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "URGENT":
        return <Badge variant="destructive" className="text-[10px] font-bold animate-pulse">URGENT</Badge>;
      case "HIGH":
        return <Badge variant="destructive" className="text-[10px] font-semibold">HIGH</Badge>;
      case "MEDIUM":
        return <Badge variant="warning" className="text-[10px] font-semibold">MEDIUM</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] font-semibold">LOW</Badge>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "OPEN":
        return <Badge variant="destructive" className="text-[10px] font-semibold">OPEN</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="default" className="text-[10px] font-semibold">IN PROGRESS</Badge>;
      case "WAITING_FOR_CLIENT":
        return <Badge variant="warning" className="text-[10px] font-semibold">WAITING CLIENT</Badge>;
      case "RESOLVED":
        return <Badge variant="success" className="text-[10px] font-semibold">RESOLVED</Badge>;
      case "CLOSED":
        return <Badge variant="secondary" className="text-[10px] font-semibold">CLOSED</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] font-semibold">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Ambient Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-card/90 border border-border/80 p-6 sm:p-8 shadow-sm ambient-glow-mesh overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Customer Relations Management
              </span>
              <Badge variant="glow" className="text-[10px] font-semibold">
                {total} Total Tickets
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Support & Helpdesk Queue
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-normal leading-relaxed">
              Centrally triage, respond to, and resolve client organization support inquiries with real-time email dispatch.
            </p>
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={fetchTickets}
            className="text-xs font-semibold shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh Queue
          </Button>
        </div>
      </div>

      {/* KPI Status Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "All Tickets", value: "", count: total, color: "text-foreground" },
          { label: "Open", value: "OPEN", count: statusCounts["OPEN"] || 0, color: "text-red-500" },
          { label: "In Progress", value: "IN_PROGRESS", count: statusCounts["IN_PROGRESS"] || 0, color: "text-primary" },
          { label: "Resolved", value: "RESOLVED", count: statusCounts["RESOLVED"] || 0, color: "text-emerald-500" },
          { label: "Closed", value: "CLOSED", count: statusCounts["CLOSED"] || 0, color: "text-muted-foreground" },
        ].map((tab) => (
          <div
            key={tab.label}
            onClick={() => {
              setSelectedStatus(tab.value);
              setPage(1);
            }}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedStatus === tab.value
                ? "bg-card border-primary ring-2 ring-primary/20 shadow-xs"
                : "bg-card border-border/80 hover:border-primary/40"
            }`}
          >
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              {tab.label}
            </div>
            <div className={`text-2xl font-extrabold mt-1 tracking-tight ${tab.color}`}>
              {tab.count}
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
            <Input
              placeholder="Search by ticket #, subject, or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-border/80 p-2.5 bg-background text-xs text-foreground font-medium shadow-xs"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Queue Table */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Ticket #</th>
                  <th className="px-6 py-4">Organization</th>
                  <th className="px-6 py-4">Subject & Category</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Replies</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        <span>Loading support queue from PostgreSQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-muted-foreground">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                          <Headphones className="w-6 h-6" />
                        </div>
                        <div className="font-bold text-foreground text-sm">No Support Tickets Found</div>
                        <p className="text-xs text-muted-foreground">
                          No customer relations tickets match the specified filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-primary">
                        {t.ticketNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{t.tenant?.companyName || "Global Workspace"}</div>
                        <div className="text-[11px] text-muted-foreground">{t.creator?.fullName}</div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-bold text-foreground truncate">{t.title}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {t.category.replace(/_/g, " ")} {t.agent ? `• Agent: ${t.agent.name}` : ""}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getPriorityBadge(t.priority)}</td>
                      <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-primary" />
                          <span>{t._count?.messages || 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/tickets/${t.id}`}>
                            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold shadow-xs">
                              Respond <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTicketToDelete(t)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-lg"
                            title="Delete Support Ticket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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

      {/* Delete Confirmation Modal */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-foreground">Delete Support Ticket?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to permanently delete ticket <strong>{ticketToDelete.ticketNumber}</strong> ({ticketToDelete.title}) and all its conversation thread messages?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTicketToDelete(null)}
                disabled={isDeleting}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteTicket}
                disabled={isDeleting}
                className="text-xs font-semibold"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete Ticket"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
