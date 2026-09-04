"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Plus,
  Sparkles,
  FileText,
  Key,
  Layout,
  MessageSquare,
  Search,
  ExternalLink,
  Power,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AgentsListPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Delete State
  const [agentToDelete, setAgentToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/agents");
      if (res.ok) {
        const json = await res.json();
        setAgents(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const togglePublish = async (agentId: string, isPublished: boolean) => {
    const endpoint = isPublished ? "unpublish" : "publish";
    try {
      const res = await fetch(`/api/v1/agents/${agentId}/${endpoint}`, {
        method: "POST",
      });
      if (res.ok) {
        fetchAgents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAgent = async () => {
    if (!agentToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/agents/${agentToDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setAgentToDelete(null);
        fetchAgents();
      } else {
        alert(json.error?.message || "Failed to delete agent");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Ambient Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-card/90 border border-border/80 p-6 sm:p-8 shadow-sm ambient-glow-mesh overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Conversational Assistants Fleet
              </span>
              <Badge variant="glow" className="text-[10px] font-semibold">
                {agents.length} Configured Agents
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              AI Agent Management Studio
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-normal leading-relaxed">
              Design, test, connect RAG documents, and generate embeddable widgets for your conversational chatbots.
            </p>
          </div>

          <Link href="/client/agents/new">
            <Button size="lg" className="font-semibold shadow-md shadow-primary/20 shrink-0">
              <Plus className="w-4 h-4 mr-1.5" /> Create AI Agent
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Toolbar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
            <Input
              placeholder="Search agents by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 text-xs"
            />
          </div>

          <Button
            onClick={fetchAgents}
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardContent>
      </Card>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary mb-2" />
            Loading your AI agents from PostgreSQL...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            <div className="max-w-sm mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Bot className="w-6 h-6" />
              </div>
              <div className="font-bold text-foreground text-sm">No Agents Found</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {search ? "No agents match your search term." : "Create your first AI agent to start answering customer queries automatically."}
              </p>
              {!search && (
                <Link href="/client/agents/new">
                  <Button size="sm" className="font-semibold mt-2">
                    <Plus className="w-4 h-4 mr-1.5" /> Create First Agent
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          filtered.map((agent) => (
            <div
              key={agent.id}
              className="pro-card rounded-2xl p-6 border border-border/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-base shadow-xs">
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <Badge variant={agent.status === "ACTIVE" ? "success" : "secondary"} className="text-[10px] font-semibold">
                    {agent.status}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-foreground mt-1">{agent.name}</h3>
                <div className="text-[11px] font-mono text-primary font-semibold mt-0.5">
                  {agent.geminiModel?.displayName || "Google Gemini 2.0 Flash"}
                </div>

                <p className="text-xs text-muted-foreground mt-3 min-h-[36px] line-clamp-2 leading-relaxed">
                  {agent.description || "Conversational AI assistant with grounded RAG document retrieval."}
                </p>

                {/* Sub-features bar */}
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-medium mt-4">
                  <Link
                    href={`/client/agents/${agent.id}/knowledge`}
                    className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted border border-border/70 transition-colors flex flex-col items-center gap-1 text-foreground"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{agent._count?.documents || 0} Docs</span>
                  </Link>

                  <Link
                    href={`/client/agents/${agent.id}/api-keys`}
                    className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted border border-border/70 transition-colors flex flex-col items-center gap-1 text-foreground"
                  >
                    <Key className="w-3.5 h-3.5 text-primary" />
                    <span>{agent._count?.apiKeys || 0} Keys</span>
                  </Link>

                  <Link
                    href={`/client/agents/${agent.id}/widget`}
                    className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted border border-border/70 transition-colors flex flex-col items-center gap-1 text-foreground"
                  >
                    <Layout className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Widget</span>
                  </Link>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-border/70">
                <Link href={`/client/agents/${agent.id}`} className="flex-1">
                  <Button variant="default" size="sm" className="w-full text-xs font-semibold shadow-xs">
                    <MessageSquare className="w-3.5 h-3.5 mr-1" /> Test & Edit Agent
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePublish(agent.id, agent.status === "ACTIVE")}
                  title={agent.status === "ACTIVE" ? "Deactivate agent" : "Activate agent"}
                  className="h-8 w-8 p-0"
                >
                  <Power className={`w-3.5 h-3.5 ${agent.status === "ACTIVE" ? "text-emerald-500" : "text-muted-foreground"}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAgentToDelete(agent)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-lg"
                  title="Delete Agent"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {agentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-foreground">Delete AI Agent?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to delete agent <strong>{agentToDelete.name}</strong>? Its configured widget and conversational history will be decommissioned.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAgentToDelete(null)}
                disabled={isDeleting}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAgent}
                disabled={isDeleting}
                className="text-xs font-semibold"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete Agent"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
