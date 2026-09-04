"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  Shield,
  Trash2,
  CheckCircle2,
  XCircle,
  Mail,
  Copy,
  Check,
  Bot,
  Users,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/ui/pagination-bar";

export default function ClientsManagementPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    email: "",
    mobile: "",
    location: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Delete Modal State
  const [clientToDelete, setClientToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/v1/clients?page=${page}&pageSize=10&search=${encodeURIComponent(search)}`
      );
      if (res.ok) {
        const json = await res.json();
        setClients(json.data.items || []);
        setTotal(json.data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [page, search]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error?.message || "Failed to create client");
        return;
      }

      setCreatedResult(json.data);
      fetchClients();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/clients/${clientToDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setClientToDelete(null);
        fetchClients();
      } else {
        alert(json.error?.message || "Failed to delete client organization");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyOnboardingLink = () => {
    if (!createdResult?.onboardingToken) return;
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/onboarding?token=${createdResult.onboardingToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredClients = clients.filter((c) => {
    if (statusFilter === "ALL") return true;
    return c.status === statusFilter;
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
                Multi-Tenant Directory
              </span>
              <Badge variant="glow" className="text-[10px] font-semibold">
                {total} Registered Organizations
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Client Tenants & Workspaces
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-normal leading-relaxed">
              Manage tenant isolations, active agents, assigned permissions, and onboard new organizations.
            </p>
          </div>

          <Button
            onClick={() => {
              setFormData({ fullName: "", companyName: "", email: "", mobile: "", location: "" });
              setCreatedResult(null);
              setShowCreateModal(true);
            }}
            size="lg"
            className="font-semibold shadow-md shadow-primary/20 shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Onboard New Client
          </Button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
            <Input
              placeholder="Search clients by company name, slug, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex bg-muted/60 border border-border/80 rounded-xl p-1 text-xs">
              {(["ALL", "ACTIVE", "SUSPENDED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    statusFilter === s
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <Button
              onClick={fetchClients}
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Organization Tenant</th>
                  <th className="px-6 py-4">Admin Contact</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">AI Agents</th>
                  <th className="px-6 py-4">Team Members</th>
                  <th className="px-6 py-4">Onboarded Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        <span>Loading client organizations from PostgreSQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-muted-foreground">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div className="font-bold text-foreground text-sm">No Client Organizations Found</div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {search ? "No clients match your search query." : "Onboard your first client organization to start provisioning AI agent workspaces."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                            {client.companyName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                              <span>{client.companyName}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">{client.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{client.email}</div>
                        {client.mobile && (
                          <div className="text-[11px] text-muted-foreground">{client.mobile}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={client.status === "ACTIVE" ? "success" : "destructive"}
                          className="text-[10px] font-semibold"
                        >
                          {client.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                          <span>{client._count?.agents || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <Users className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{client._count?.userRoles || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/clients/${client.id}`}>
                            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold shadow-xs">
                              Manage <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setClientToDelete(client)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-lg"
                            title="Delete or Suspend Client"
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

      {/* Onboard Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            {!createdResult ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-foreground">Onboard New Client Organization</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                  Creates a dedicated tenant workspace, assigns a CLIENT_ADMIN role, and generates an onboarding invitation link.
                </p>

                <form onSubmit={handleCreateClient} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Primary Contact Full Name</label>
                      <Input
                        required
                        placeholder="John Smith"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Company / Organization Name</label>
                      <Input
                        required
                        placeholder="Acme Global Inc"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Client Admin Email</label>
                    <Input
                      type="email"
                      required
                      placeholder="admin@acme.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Mobile Phone (Optional)</label>
                      <Input
                        placeholder="+1 (555) 000-0000"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Location / Region (Optional)</label>
                      <Input
                        placeholder="San Francisco, CA"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="text-xs font-semibold">
                      {isSubmitting ? "Provisioning Workspace..." : "Create & Send Welcome Invitation"}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-foreground">Client Workspace Created!</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Organization <strong>{createdResult.tenant.companyName}</strong> has been provisioned.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-muted/60 border border-border space-y-2">
                  <span className="text-xs font-semibold text-foreground">
                    Client Onboarding Link (Valid 48 Hours):
                  </span>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/onboarding?token=${createdResult.onboardingToken}`}
                      className="text-xs font-mono bg-background"
                    />
                    <Button size="sm" onClick={copyOnboardingLink} className="shrink-0 text-xs">
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    A welcome email has also been sent to <strong>{createdResult.user.email}</strong>.
                  </p>
                </div>

                <Button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreatedResult(null);
                  }}
                  className="w-full text-xs font-semibold"
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-foreground">Delete Client Organization?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to suspend/delete <strong>{clientToDelete.companyName}</strong>? All associated agents and knowledge vectors will be decommissioned.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClientToDelete(null)}
                disabled={isDeleting}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteClient}
                disabled={isDeleting}
                className="text-xs font-semibold"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete Organization"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
