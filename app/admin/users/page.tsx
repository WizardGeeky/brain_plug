"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Mail,
  Shield,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Trash2,
  AlertTriangle,
  UserCheck,
  UserX,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/ui/pagination-bar";

export default function UsersDirectoryPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Delete User State
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", "10");
      if (search) params.set("search", search);
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/v1/users?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data?.items) {
          setUsers(json.data.items);
          setTotal(json.data.total || 0);
        } else {
          setUsers(json.data || []);
          setTotal(json.data?.length || 0);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, search, roleFilter, statusFilter]);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/v1/users/${userToDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setUserToDelete(null);
        loadUsers();
      } else {
        alert(json.error?.message || "Failed to delete user");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/v1/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadUsers();
      }
    } catch (err) {
      console.error(err);
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
                Identity & Access Governance
              </span>
              <Badge variant="glow" className="text-[10px] font-semibold">
                {total} Platform Users
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Platform Users Directory
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-normal leading-relaxed">
              Complete listing of all registered Super Admins, Client Administrators, and Tenant Users across workspaces.
            </p>
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={loadUsers}
            className="text-xs font-semibold shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh Users
          </Button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-border/80 p-2 bg-background text-xs text-foreground font-medium shadow-xs"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="CLIENT_ADMIN">Client Admin</option>
              <option value="CLIENT_USER">Client User</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-border/80 p-2 bg-background text-xs text-foreground font-medium shadow-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Primary Role</th>
                  <th className="px-6 py-4">Tenant Organization</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Active</th>
                  <th className="px-6 py-4">Registered</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        <span>Loading platform users from PostgreSQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-muted-foreground">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                          <Users className="w-6 h-6" />
                        </div>
                        <div className="font-bold text-foreground text-sm">No Users Found</div>
                        <p className="text-xs text-muted-foreground">
                          No users match the selected search or filter criteria.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const primaryRole = u.tenantRoles?.[0]?.role?.name || "CLIENT_USER";
                    const tenantName = u.tenantRoles?.[0]?.tenant?.companyName || "Global Platform";
                    return (
                      <tr key={u.id} className="hover:bg-muted/40 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                              {u.fullName?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div>
                              <div className="font-bold text-foreground text-sm">{u.fullName}</div>
                              <div className="text-[11px] text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={primaryRole === "SUPER_ADMIN" ? "primary" : "secondary"}
                            className="text-[10px] font-semibold"
                          >
                            {primaryRole}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-semibold text-foreground">{tenantName}</td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={u.status === "ACTIVE" ? "success" : "destructive"}
                            className="text-[10px] font-semibold"
                          >
                            {u.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(u)}
                              className="h-8 text-xs font-semibold"
                              title={u.status === "ACTIVE" ? "Suspend user" : "Activate user"}
                            >
                              {u.status === "ACTIVE" ? (
                                <UserX className="w-3.5 h-3.5 text-amber-600" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setUserToDelete(u)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-lg"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-foreground">Decommission User Account?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to delete user <strong>{userToDelete.fullName}</strong> ({userToDelete.email})?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="text-xs font-semibold"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete User"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
