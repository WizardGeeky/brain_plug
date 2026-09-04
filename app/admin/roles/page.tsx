"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Users,
  Shield,
  Key,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function RolesManagementPage() {
  const [data, setData] = useState<{ roles: any[]; permissions: any[] }>({
    roles: [],
    permissions: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Create Role Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Role Modal
  const [roleToDelete, setRoleToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/roles");
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/v1/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoleName.trim(),
          description: newRoleDescription.trim(),
          permissionIds: selectedPermissionIds,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error?.message || "Failed to create custom role");
        return;
      }

      setShowCreateModal(false);
      setNewRoleName("");
      setNewRoleDescription("");
      setSelectedPermissionIds([]);
      loadRoles();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/v1/roles/${roleToDelete.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setRoleToDelete(null);
        loadRoles();
      } else {
        alert(json.error?.message || "Failed to delete role");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const togglePermission = (id: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
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
                Security & Access Governance
              </span>
              <Badge variant="glow" className="text-[10px] font-semibold">
                Granular RBAC
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Roles & Access Permissions
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-normal leading-relaxed">
              Define custom roles, assign fine-grained API and platform capabilities, and govern access privileges.
            </p>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            size="lg"
            className="font-semibold shadow-md shadow-primary/20 shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Create Custom Role
          </Button>
        </div>
      </div>

      {/* Roles Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary mb-2" />
            Loading role permissions from PostgreSQL...
          </div>
        ) : (
          data.roles.map((role) => (
            <div
              key={role.id}
              className="pro-card rounded-2xl p-6 border border-border/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3">
                  <Badge
                    variant={role.isSystem ? "primary" : "secondary"}
                    className="text-[10px] font-semibold"
                  >
                    {role.isSystem ? "System Role" : "Custom Role"}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span>{role._count?.userRoles || 0} Users</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-foreground mt-1">{role.name}</h3>
                <p className="text-xs text-muted-foreground mt-2 min-h-[36px] leading-relaxed">
                  {role.description || "Platform access role configured with assigned security permissions."}
                </p>

                <div className="pt-4 mt-4 border-t border-border/70 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                    <span>Assigned Permissions ({role.permissions?.length || 0})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto custom-scrollbar p-1">
                    {role.permissions?.map((rp: any) => (
                      <span
                        key={rp.permission.id}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-muted/80 border border-border/70 font-mono text-foreground font-medium"
                      >
                        {rp.permission.code}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-border/70 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRoleToDelete(role)}
                  className="text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Role
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Custom Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-3xl bg-card border border-border shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Create Custom RBAC Role</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Role Identifier Name</label>
                <Input
                  required
                  placeholder="SUPPORT_ANALYST"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="text-xs font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Description</label>
                <Input
                  placeholder="Handles client tickets and live agent telemetry..."
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-foreground">
                  Select Granular Permissions ({selectedPermissionIds.length} selected)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto custom-scrollbar p-2 border border-border/80 rounded-2xl bg-muted/30">
                  {data.permissions.map((perm) => {
                    const isChecked = selectedPermissionIds.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2 ${
                          isChecked
                            ? "bg-card border-primary ring-1 ring-primary/30 shadow-xs"
                            : "bg-background/80 border-border/70 hover:border-border"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-primary focus:ring-primary"
                        />
                        <div className="min-w-0">
                          <div className="font-mono text-[10px] font-bold text-foreground truncate">
                            {perm.code}
                          </div>
                          <div className="text-[10px] text-muted-foreground line-clamp-1">
                            {perm.description || perm.module}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="text-xs font-semibold">
                  {isSubmitting ? "Creating Role..." : "Create Role"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-foreground">Delete Role?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to permanently delete role <strong>{roleToDelete.name}</strong>? Any assigned user permissions will be cleaned safely.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRoleToDelete(null)}
                disabled={isDeleting}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteRole}
                disabled={isDeleting}
                className="text-xs font-semibold"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete Role"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
