"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Bot,
  Layers,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ClientApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalKeys: 0,
    activeKeys: 0,
    revokedKeys: 0,
    connectedAgents: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [keyName, setKeyName] = useState("Website Live Chatbot");
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Revoke state
  const [keyToRevoke, setKeyToRevoke] = useState<any | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchKeysAndAgents = async () => {
    setIsLoading(true);
    try {
      const [keysRes, agentsRes] = await Promise.all([
        fetch("/api/v1/api-keys"),
        fetch("/api/v1/agents"),
      ]);

      if (keysRes.ok) {
        const json = await keysRes.json();
        setKeys(json.data.keys || []);
        setStats(
          json.data.stats || {
            totalKeys: 0,
            activeKeys: 0,
            revokedKeys: 0,
            connectedAgents: 0,
          }
        );
      }

      if (agentsRes.ok) {
        const aJson = await agentsRes.json();
        const activeAgents = aJson.data || [];
        setAgents(activeAgents);
        if (activeAgents.length > 0 && !selectedAgentId) {
          setSelectedAgentId(activeAgents[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeysAndAgents();
  }, []);

  const handleCopy = async (text: string, keyId: string) => {
    if (!text) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId || !keyName.trim()) return;
    setIsCreating(true);

    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgentId,
          name: keyName.trim(),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setCreatedSecret(json.data.rawKey);
        fetchKeysAndAgents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async () => {
    if (!keyToRevoke) return;
    setIsRevoking(true);
    try {
      const res = await fetch(`/api/v1/api-keys/${keyToRevoke.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setKeyToRevoke(null);
        fetchKeysAndAgents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Ambient Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-card/90 border border-border/80 p-6 sm:p-8 shadow-sm ambient-glow-mesh overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <Badge variant="glow" className="text-[10px] font-semibold">
                Organization Credentials
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              API Keys
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-normal">
              Manage live secret keys used to embed AI agents and authenticate REST API interactions.
            </p>
          </div>

          <Button
            onClick={() => {
              setKeyName("Website Live Chatbot");
              setCreatedSecret(null);
              setShowModal(true);
            }}
            className="font-semibold text-xs shadow-md shadow-primary/20 shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Generate New API Key
          </Button>
        </div>
      </div>

      {/* Organization Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/80 shadow-xs p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total API Keys</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-foreground">{stats.totalKeys}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Created in your organization</p>
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
          <p className="text-[11px] text-muted-foreground mt-0.5">Live authorizing widget requests</p>
        </Card>

        <Card className="border-border/80 shadow-xs p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Connected AI Agents</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-foreground">{stats.connectedAgents}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Agents with active integrations</p>
        </Card>
      </div>

      {/* Main Keys List */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="p-5 border-b border-border/70 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" /> Active Organization API Keys
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchKeysAndAgents}
            disabled={isLoading}
            className="text-xs text-muted-foreground hover:text-foreground h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Key Name</th>
                  <th className="px-6 py-4">Associated Agent</th>
                  <th className="px-6 py-4">Key Identifier</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-muted-foreground">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary mb-2" />
                      Loading organization API keys...
                    </td>
                  </tr>
                ) : keys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-muted-foreground space-y-3">
                      <Key className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="font-semibold text-foreground">No API keys created yet.</p>
                      <p className="text-xs text-muted-foreground">
                        Generate a key to embed your AI agent on your website or connect via REST API.
                      </p>
                      <Button
                        onClick={() => setShowModal(true)}
                        size="sm"
                        className="text-xs font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Generate First Key
                      </Button>
                    </td>
                  </tr>
                ) : (
                  keys.map((k) => {
                    const isRevealed = Boolean(revealedKeys[k.id]);
                    const displayKey =
                      isRevealed && k.rawKey ? k.rawKey : `${k.keyPrefix}••••••••••••••••••••••••`;

                    return (
                      <tr key={k.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-foreground">{k.name}</td>

                        <td className="px-6 py-4">
                          {k.agent ? (
                            <Link
                              href={`/client/agents/${k.agent.id}`}
                              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                            >
                              <Bot className="w-3.5 h-3.5" />
                              <span>{k.agent.name}</span>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/70 select-all font-medium">
                              {displayKey}
                            </span>
                            {/* Eye Toggle */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setRevealedKeys((prev) => ({ ...prev, [k.id]: !prev[k.id] }))
                              }
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                              title={isRevealed ? "Hide API Key" : "View API Key"}
                            >
                              {isRevealed ? (
                                <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 text-primary" />
                              )}
                            </Button>
                            {/* Copy Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(k.rawKey || k.keyPrefix, k.id)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                              title="Copy API Key"
                            >
                              {copiedKeyId === k.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
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
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 px-2 text-xs"
                              title="Revoke Key"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Revoke
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Key Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">Generate New API Key</h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setCreatedSecret(null);
                }}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            {createdSecret ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>API Key generated successfully!</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Copy this key now. You can also view or copy it from your credentials list at any time.
                </p>
                <div className="p-3 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs break-all flex items-center justify-between gap-2 border border-zinc-800">
                  <span>{createdSecret}</span>
                  <Button
                    size="sm"
                    onClick={() => handleCopy(createdSecret, "modal-key")}
                    className="h-7 shrink-0 text-xs"
                  >
                    {copiedKeyId === "modal-key" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      setShowModal(false);
                      setCreatedSecret(null);
                    }}
                    className="w-full text-xs font-semibold"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Select AI Agent</label>
                  {agents.length > 0 ? (
                    <div className="space-y-2">
                      {agents.map((a) => {
                        const isSelected = selectedAgentId === a.id;
                        return (
                          <div
                            key={a.id}
                            onClick={() => setSelectedAgentId(a.id)}
                            className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                              isSelected
                                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                : "border-border/80 bg-card hover:border-primary/40"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Bot className="w-4 h-4 text-primary" />
                              <span className="font-bold text-foreground text-xs">{a.name}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700 text-xs">
                      No AI agents found. Please create an AI agent first.
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Key Friendly Name</label>
                  <Input
                    required
                    placeholder="e.g. Website Live Chatbot"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating || !selectedAgentId}
                    className="text-xs font-semibold shadow-xs"
                  >
                    {isCreating ? "Generating..." : "Generate Key"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
                onClick={handleRevokeKey}
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
