"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Building2,
  Bot,
  Users,
  FileText,
  Key,
  ArrowLeft,
  ShieldCheck,
  Power,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadClient() {
      try {
        const res = await fetch(`/api/v1/clients/${id}`);
        if (res.ok) {
          const json = await res.json();
          setClient(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadClient();
  }, [id]);

  const toggleStatus = async () => {
    if (!client) return;
    const newStatus = client.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/v1/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const json = await res.json();
        setClient({ ...client, status: json.data.status });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading client details...</div>;
  }

  if (!client) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Client organization not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Clients Directory
      </Link>

      {/* Organization Header */}
      <div className="p-6 rounded-3xl bg-card border border-purple-100 dark:border-purple-900/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-purple-500/20">
            {client.companyName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground">{client.companyName}</h1>
              <Badge variant={client.status === "ACTIVE" ? "success" : "destructive"}>
                {client.status}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 font-mono">
              Tenant ID: {client.id} • Slug: {client.slug}
            </div>
          </div>
        </div>

        <Button
          variant={client.status === "ACTIVE" ? "destructive" : "default"}
          size="sm"
          onClick={toggleStatus}
          className="text-xs font-semibold"
        >
          <Power className="w-3.5 h-3.5 mr-1.5" />
          {client.status === "ACTIVE" ? "Suspend Workspace" : "Activate Workspace"}
        </Button>
      </div>

      {/* Agents & Users Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agents belonging to this tenant */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-600" />
              Tenant AI Agents ({client.agents?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.agents?.length === 0 ? (
              <div className="text-xs text-muted-foreground py-6 text-center">
                No AI agents created yet in this workspace.
              </div>
            ) : (
              client.agents?.map((agent: any) => (
                <div
                  key={agent.id}
                  className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-sm text-foreground">{agent.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Model: {agent.geminiModel?.displayName || "Gemini"} • {agent.status}
                    </div>
                  </div>
                  <Badge variant={agent.status === "ACTIVE" ? "success" : "outline"} className="text-[10px]">
                    {agent.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Assigned Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Workspace Users ({client.userRoles?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.userRoles?.map((ur: any) => (
              <div
                key={ur.id}
                className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-foreground">{ur.user?.fullName}</div>
                  <div className="text-[11px] text-muted-foreground">{ur.user?.email}</div>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {ur.role?.name}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
