"use client";

import React, { useEffect, useState, use } from "react";
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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AgentApiKeysPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: agentId } = use(params);
  const [keys, setKeys] = useState<any[]>([]);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/agents/${agentId}/api-keys`);
      if (res.ok) {
        const json = await res.json();
        setKeys(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [agentId]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    try {
      const res = await fetch(`/api/v1/agents/${agentId}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName.trim() }),
      });

      if (res.ok) {
        const json = await res.json();
        setCreatedSecret(json.data.rawKey);
        fetchKeys();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeKey = async () => {
    if (!keyToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/api-keys/${keyToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setKeyToDelete(null);
        fetchKeys();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const copySecretToClipboard = () => {
    if (!createdSecret) return;
    navigator.clipboard.writeText(createdSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto animate-fade-in">
      {/* Ambient Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-card/90 border border-border/80 p-6 sm:p-8 shadow-sm ambient-glow-mesh overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/client/agents/${agentId}`}
              className="p-2.5 rounded-2xl border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <Badge variant="glow" className="text-[10px] font-semibold">
                  API Key Management
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Agent API Credentials
              </h1>
              <p className="text-xs text-muted-foreground font-normal">
                Generate and revoke scoped cryptographic API keys to connect your website chat widget.
              </p>
            </div>
          </div>

          <Button
            onClick={() => {
              setKeyName("");
              setCreatedSecret(null);
              setShowModal(true);
            }}
            className="font-semibold text-xs shadow-md shadow-primary/20 shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Generate New API Key
          </Button>
        </div>
      </div>

      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Key Identifier</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Scopes</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto text-primary mb-2" />
                      Loading API keys...
                    </td>
                  </tr>
                ) : keys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-muted-foreground">
                      No API keys created yet. Generate a key to integrate your agent on your website.
                    </td>
                  </tr>
                ) : (
                  keys.map((k) => {
                    const isRevealed = Boolean(revealedKeys[k.id]);
                    const displayKey = isRevealed && k.rawKey ? k.rawKey : `${k.keyPrefix}••••••••`;

                    return (
                      <tr key={k.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-foreground">{k.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/70 select-all font-medium">
                              {displayKey}
                            </span>
                            {/* Eye button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setRevealedKeys((prev) => ({ ...prev, [k.id]: !prev[k.id] }))
                              }
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                              title={isRevealed ? "Hide Key" : "View Key"}
                            >
                              {isRevealed ? (
                                <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 text-primary" />
                              )}
                            </Button>
                            {/* Copy button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(k.rawKey || k.keyPrefix);
                                setCopiedKeyId(k.id);
                                setTimeout(() => setCopiedKeyId(null), 2000);
                              }}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                              title="Copy Key"
                            >
                              {copiedKeyId === k.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={k.revokedAt ? "destructive" : "success"} className="text-[10px] font-semibold">
                            {k.revokedAt ? "REVOKED" : "ACTIVE"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px] text-muted-foreground">
                          {typeof k.scopes === "object" && k.scopes?.list
                            ? k.scopes.list.join(", ")
                            : Array.isArray(k.scopes)
                            ? k.scopes.join(", ")
                            : "chat:write"}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(k.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!k.revokedAt && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setKeyToDelete(k)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 rounded-lg"
                              title="Revoke Key"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            {!createdSecret ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-foreground">Generate New API Key</h3>
                  <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
                </div>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  Name your key to identify its purpose (e.g. "Production Website Chatbot").
                </p>

                <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Key Name</label>
                    <Input
                      required
                      placeholder="e.g. Website Chat Widget"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      className="text-xs"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="text-xs">
                      Cancel
                    </Button>
                    <Button type="submit" className="text-xs font-semibold">
                      Generate Secret Key
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-base font-bold text-foreground">Key Generated Successfully</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Make sure to copy your API key now. You won't be able to see it again!
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950 text-zinc-100 font-mono text-xs break-all border border-zinc-800 flex items-center justify-between gap-2">
                  <span>{createdSecret}</span>
                  <Button size="sm" variant="outline" onClick={copySecretToClipboard} className="shrink-0 h-8 text-xs border-zinc-700 bg-zinc-900 text-zinc-200">
                    {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                  ⚠️ Store this secret in your secure backend or widget data attribute.
                </div>

                <Button onClick={() => setShowModal(false)} className="w-full text-xs font-semibold">
                  Done & Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revoke Key Modal */}
      {keyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-foreground">Revoke API Key?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to revoke key <strong>{keyToDelete.name}</strong> ({keyToDelete.keyPrefix}••••)? Applications using this key will immediately lose access.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setKeyToDelete(null)}
                disabled={isDeleting}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevokeKey}
                disabled={isDeleting}
                className="text-xs font-semibold"
              >
                {isDeleting ? "Revoking..." : "Yes, Revoke Key"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
