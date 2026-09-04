"use client";

import React, { useEffect, useState } from "react";
import { Users, Mail, Shield, Plus, Search, RefreshCw, UserCheck, UserX } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/ui/pagination-bar";

export default function TenantUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", "10");
      if (search) params.set("search", search);

      const res = await fetch(`/api/v1/users?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data?.items) {
          setUsers(json.data.items);
          setTotal(json.data.total || 0);
        } else {
          const arr = Array.isArray(json.data) ? json.data : [];
          setUsers(arr);
          setTotal(arr.length);
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
  }, [page, search]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Ambient Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-card/90 border border-border/80 p-6 sm:p-8 shadow-sm ambient-glow-mesh overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Organization Directory
              </span>
              <Badge variant="glow" className="text-[10px] font-semibold">
                {total} Team Members
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Workspace Team Members
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-normal leading-relaxed">
              Users authorized to manage agents, upload knowledge documents, and test chatbot completions within your workspace.
            </p>
          </div>

          <Button
            onClick={loadUsers}
            variant="outline"
            size="lg"
            className="text-xs font-semibold shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh Members
          </Button>
        </div>
      </div>

      {/* Search Toolbar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
            <Input
              placeholder="Search members by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 text-xs"
            />
          </div>

          <Button
            onClick={loadUsers}
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardContent>
      </Card>

      {/* Team Members Table */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Member Name</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">Workspace Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        <span>Loading team members from PostgreSQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-muted-foreground">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                          <Users className="w-6 h-6" />
                        </div>
                        <div className="font-bold text-foreground text-sm">No Team Members Found</div>
                        <p className="text-xs text-muted-foreground">
                          No users match your search criteria in this workspace.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const roleName = u.tenantRoles?.[0]?.role?.name || "CLIENT_USER";
                    return (
                      <tr key={u.id} className="hover:bg-muted/40 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                              {u.fullName?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div className="font-bold text-foreground text-sm">{u.fullName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">{u.email}</td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={roleName === "CLIENT_ADMIN" ? "primary" : "secondary"}
                            className="text-[10px] font-semibold"
                          >
                            {roleName}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={u.status === "ACTIVE" ? "success" : "destructive"}
                            className="text-[10px] font-semibold"
                          >
                            {u.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString()}
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
    </div>
  );
}
