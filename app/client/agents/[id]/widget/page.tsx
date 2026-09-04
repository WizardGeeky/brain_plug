"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Layout,
  Save,
  Check,
  Copy,
  Code2,
  Shield,
  Palette,
  Monitor,
  Smartphone,
  Tablet,
  MessageSquare,
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AgentWidgetCustomizerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: agentId } = use(params);
  const [config, setConfig] = useState<any>(null);
  const [agent, setAgent] = useState<any>(null);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentRes, configRes] = await Promise.all([
          fetch(`/api/v1/agents/${agentId}`),
          fetch(`/api/v1/agents/${agentId}/widget`),
        ]);

        if (agentRes.ok) {
          const aJson = await agentRes.json();
          setAgent(aJson.data);
        }

        if (configRes.ok) {
          const cJson = await configRes.json();
          if (cJson.data) {
            setConfig(cJson.data);
            setAllowedDomains(cJson.data.allowedOrigins || []);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, [agentId]);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/v1/agents/${agentId}/widget`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          allowedOrigins: allowedDomains,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    const formatted = newDomain.trim().toLowerCase();
    if (!allowedDomains.includes(formatted)) {
      setAllowedDomains([...allowedDomains, formatted]);
    }
    setNewDomain("");
  };

  const handleRemoveDomain = (domain: string) => {
    setAllowedDomains(allowedDomains.filter((d) => d !== domain));
  };

  const getEmbedCode = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://app.brainplug.ai";
    return `<!-- Brain Plug AI Chat Widget -->
<script
  src="${origin}/widget.js"
  data-agent-id="${agentId}"
  data-api-key="YOUR_AGENT_API_KEY"
  async>
</script>`;
  };

  const copyEmbedSnippet = () => {
    navigator.clipboard.writeText(getEmbedCode());
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  if (!config || !agent) {
    return (
      <div className="p-16 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
        <span>Loading widget customizer...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl animate-fade-in">
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
                  Embeddable Widget Studio
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {agent.name} — Live Widget Customizer
              </h1>
              <p className="text-xs text-muted-foreground font-normal">
                Customize colors, dimensions, and allowed origins, then copy the 1-line script tag.
              </p>
            </div>
          </div>

          <Button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="text-xs font-semibold shadow-md shadow-primary/20 shrink-0"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {isSaving ? "Saving..." : saveSuccess ? "Saved Successfully!" : "Save Styling"}
          </Button>
        </div>
      </div>

      {/* Split Screen Customizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 cols: Styling & Domain Controls */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" /> Color Palette & Styling
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              {/* Agent Logo / Avatar URL */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>Agent Logo / Avatar URL <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span></span>
                  {config.avatar ? (
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, avatar: "" })}
                      className="text-[10px] text-red-500 hover:underline"
                    >
                      Clear Logo
                    </button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Uses round chat icon if empty</span>
                  )}
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl border border-border/80 bg-muted/40 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                    {config.avatar ? (
                      <img
                        src={config.avatar}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <Input
                    placeholder="https://yourcompany.com/logo.png"
                    value={config.avatar || ""}
                    onChange={(e) => setConfig({ ...config, avatar: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-1.5 pt-1">
                <label className="font-semibold text-foreground">Color Presets</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Purple", primary: "#7c3aed", secondary: "#f3e8ff" },
                    { label: "Indigo", primary: "#4f46e5", secondary: "#e0e7ff" },
                    { label: "Blue", primary: "#2563eb", secondary: "#dbeafe" },
                    { label: "Emerald", primary: "#059669", secondary: "#d1fae5" },
                    { label: "Rose", primary: "#e11d48", secondary: "#ffe4e6" },
                    { label: "Amber", primary: "#d97706", secondary: "#fef3c7" },
                    { label: "Dark", primary: "#0f172a", secondary: "#f1f5f9" },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() =>
                        setConfig((prev: any) => ({
                          ...prev,
                          primaryColor: p.primary,
                          secondaryColor: p.secondary,
                          launcherColor: p.primary,
                        }))
                      }
                      className="px-2.5 py-1 rounded-lg border border-border/80 text-[11px] font-medium flex items-center gap-1.5 bg-card hover:bg-muted transition-all"
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: p.primary }}
                      />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Primary Brand Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.primaryColor || "#7c3aed"}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="w-9 h-9 rounded-xl border border-border cursor-pointer bg-background p-0.5"
                    />
                    <Input
                      value={config.primaryColor || "#7c3aed"}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Chat Button BG Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.launcherColor || config.primaryColor || "#7c3aed"}
                      onChange={(e) => setConfig({ ...config, launcherColor: e.target.value })}
                      className="w-9 h-9 rounded-xl border border-border cursor-pointer bg-background p-0.5"
                    />
                    <Input
                      value={config.launcherColor || config.primaryColor || "#7c3aed"}
                      onChange={(e) => setConfig({ ...config, launcherColor: e.target.value })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Assistant Bubble Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.secondaryColor || "#f3e8ff"}
                      onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                      className="w-9 h-9 rounded-xl border border-border cursor-pointer bg-background p-0.5"
                    />
                    <Input
                      value={config.secondaryColor || "#f3e8ff"}
                      onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.backgroundColor || "#ffffff"}
                      onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                      className="w-9 h-9 rounded-xl border border-border cursor-pointer bg-background p-0.5"
                    />
                    <Input
                      value={config.backgroundColor || "#ffffff"}
                      onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Launcher Button Style */}
              <div className="space-y-2 pt-1">
                <label className="font-semibold text-foreground">Launcher Button Style</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, launcherType: "BUTTON" })}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      (config.launcherType || "BUTTON") === "BUTTON"
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Pill Button with Label</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, launcherType: "ROUND" })}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      (config.launcherType || "").toUpperCase() === "ROUND"
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px] font-bold">
                      ●
                    </div>
                    <span>Round Icon Button</span>
                  </button>
                </div>
              </div>

              {/* Chat Icon Selector */}
              <div className="space-y-2 pt-1">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>Chat Icon</span>
                  <span className="text-[10px] text-muted-foreground">Used if logo is not provided</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: "MessageSquare", label: "Bubble" },
                    { id: "Bot", label: "Robot" },
                    { id: "Sparkles", label: "Sparkle" },
                    { id: "Headphones", label: "Support" },
                    { id: "MessageCircle", label: "Round" },
                    { id: "Zap", label: "Lightning" },
                  ].map((ic) => {
                    const isSelected = (config.buttonIcon || "MessageSquare") === ic.id;
                    return (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => setConfig({ ...config, buttonIcon: ic.id })}
                        className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="text-xs">
                          {ic.id === "Bot"
                            ? "🤖"
                            : ic.id === "Sparkles"
                            ? "✨"
                            : ic.id === "Headphones"
                            ? "🎧"
                            : ic.id === "MessageCircle"
                            ? "💭"
                            : ic.id === "Zap"
                            ? "⚡"
                            : "💬"}
                        </span>
                        <span className="text-[10px]">{ic.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Position selector */}
              <div className="space-y-2 pt-1">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>Widget Screen Position</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {config.position || "BOTTOM_RIGHT"}
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "BOTTOM_RIGHT", label: "↘ Bottom Right" },
                    { id: "BOTTOM_LEFT", label: "↙ Bottom Left" },
                    { id: "TOP_RIGHT", label: "↗ Top Right" },
                    { id: "TOP_LEFT", label: "↖ Top Left" },
                  ].map((pos) => {
                    const isSelected =
                      (config.position || "BOTTOM_RIGHT").toUpperCase().replace(/-/g, "_") === pos.id;
                    return (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setConfig({ ...config, position: pos.id })}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {pos.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Corner Radius ({config.borderRadius || 16}px)</label>
                  <input
                    type="range"
                    min="4"
                    max="32"
                    value={config.borderRadius || 16}
                    onChange={(e) => setConfig({ ...config, borderRadius: parseInt(e.target.value, 10) })}
                    className="w-full accent-primary mt-2"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Launcher Button Label</label>
                  <Input
                    value={config.buttonLabel || "Chat with us"}
                    onChange={(e) => setConfig({ ...config, buttonLabel: e.target.value })}
                    placeholder="e.g. Chat with us"
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Domain Allowlist Security */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" /> Origin Allowlist Security
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Restrict widget embedding exclusively to authorized domains (e.g. <code>https://yourcompany.com</code>).
              </p>

              <form onSubmit={handleAddDomain} className="flex gap-2">
                <Input
                  placeholder="https://example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="text-xs"
                />
                <Button type="submit" size="sm" className="font-semibold text-xs shrink-0">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Domain
                </Button>
              </form>

              <div className="space-y-2 pt-2">
                {allowedDomains.length === 0 ? (
                  <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border text-center text-xs text-muted-foreground">
                    No domain restrictions configured. Widget will accept requests from any origin.
                  </div>
                ) : (
                  allowedDomains.map((domain) => (
                    <div
                      key={domain}
                      className="p-2.5 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between font-mono text-xs text-foreground"
                    >
                      <span>{domain}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDomain(domain)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 6 cols: Live Widget Interactive Preview */}
        <div className="lg:col-span-6 space-y-4 sticky top-20">
          <Card className="overflow-hidden border-border/80 shadow-sm">
            <CardHeader className="py-3.5 px-6 bg-muted/40 border-b border-border/70 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Sparkles className="w-4 h-4 text-primary" /> Live Widget Preview
              </CardTitle>

              {/* Viewport Toggles */}
              <div className="flex items-center gap-1 p-1 bg-background rounded-xl border border-border">
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-1.5 rounded-lg transition-colors ${previewMode === "desktop" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
                  title="Desktop View"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewMode("tablet")}
                  className={`p-1.5 rounded-lg transition-colors ${previewMode === "tablet" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
                  title="Tablet View"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-1.5 rounded-lg transition-colors ${previewMode === "mobile" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
                  title="Mobile View"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-6 bg-muted/20 flex items-center justify-center min-h-[500px]">
              {/* Simulated Host Webpage with Embedded Widget */}
              <div
                style={{
                  width: previewMode === "mobile" ? "320px" : previewMode === "tablet" ? "420px" : "100%",
                  borderRadius: `${config.borderRadius || 16}px`,
                  boxShadow: "0 20px 48px rgba(0,0,0,0.18)",
                }}
                className="overflow-hidden border border-border/80 bg-card text-card-foreground flex flex-col h-[460px] animate-in zoom-in-95 duration-150"
              >
                {/* Header */}
                <div
                  style={{ background: `linear-gradient(135deg, ${config.primaryColor || "#7c3aed"}, #4c1d95)` }}
                  className="p-4 text-white flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    {config.avatar ? (
                      <img
                        src={config.avatar}
                        alt="logo"
                        className="w-8 h-8 rounded-full object-cover border-2 border-white/50 bg-white"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-sm leading-tight text-white">{agent.name}</div>
                      <div className="text-[10px] opacity-85 text-white/90">AI Assistant • Online</div>
                    </div>
                  </div>
                </div>

                {/* Messages Body */}
                <div
                  className="flex-1 p-4 overflow-y-auto space-y-3 text-xs"
                  style={{ backgroundColor: config.backgroundColor || undefined }}
                >
                  <div className="flex justify-start">
                    <div
                      className="p-3 rounded-2xl border border-border shadow-xs max-w-[85%] text-foreground"
                      style={{ backgroundColor: config.secondaryColor || undefined }}
                    >
                      {agent.welcomeMessage || "Hello! How can I help you today?"}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div
                      style={{ backgroundColor: config.primaryColor || "#7c3aed" }}
                      className="p-3 rounded-2xl text-white shadow-xs max-w-[85%] font-medium"
                    >
                      Can you answer questions based on our handbook?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div
                      className="p-3 rounded-2xl border border-border shadow-xs max-w-[85%] text-foreground"
                      style={{ backgroundColor: config.secondaryColor || undefined }}
                    >
                      Yes! I am strictly grounded in your uploaded documents.
                    </div>
                  </div>
                </div>

                {/* Footer Input */}
                <div className="p-3 bg-card border-t border-border flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    readOnly
                    className="flex-1 rounded-full border border-border px-3.5 py-1.5 text-xs outline-none bg-muted/40 text-foreground"
                  />
                  <div
                    style={{ backgroundColor: config.primaryColor || "#7c3aed" }}
                    className="w-8 h-8 rounded-full text-white flex items-center justify-center cursor-pointer shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configured Floating Launcher Preview */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/30 border border-border/70 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-muted-foreground font-semibold">Launcher:</span>
              <div
                className={`text-white font-bold text-xs shadow-sm flex items-center justify-center transition-all ${
                  (config.launcherType || "").toUpperCase() === "ROUND"
                    ? "w-11 h-11 rounded-full p-0"
                    : "px-3.5 py-2 rounded-full gap-2"
                }`}
                style={{
                  backgroundColor:
                    config.launcherColor || config.primaryColor || "#7c3aed",
                }}
              >
                {config.avatar ? (
                  <img
                    src={config.avatar}
                    alt="logo"
                    className={`${(config.launcherType || "").toUpperCase() === "ROUND" ? "w-8 h-8" : "w-4 h-4"} rounded-full object-cover bg-white`}
                  />
                ) : (
                  <span className="text-sm">
                    {config.buttonIcon === "Bot"
                      ? "🤖"
                      : config.buttonIcon === "Sparkles"
                      ? "✨"
                      : config.buttonIcon === "Headphones"
                      ? "🎧"
                      : config.buttonIcon === "MessageCircle"
                      ? "💭"
                      : config.buttonIcon === "Zap"
                      ? "⚡"
                      : "💬"}
                  </span>
                )}
                {(config.launcherType || "BUTTON") !== "ROUND" && (
                  <span>{config.buttonLabel || "Chat with us"}</span>
                )}
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
              {(config.position || "BOTTOM_RIGHT").toUpperCase().replace(/-/g, "_") === "BOTTOM_LEFT"
                ? "↙ Bottom Left"
                : (config.position || "BOTTOM_RIGHT").toUpperCase().replace(/-/g, "_") === "TOP_RIGHT"
                ? "↗ Top Right"
                : (config.position || "BOTTOM_RIGHT").toUpperCase().replace(/-/g, "_") === "TOP_LEFT"
                ? "↖ Top Left"
                : "↘ Bottom Right"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Embed Code Generator Snippet */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary" /> One-Script Integration Code
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Copy and paste this script tag into any HTML, Next.js, React, Vue, or Shopify application before the closing <code>&lt;/body&gt;</code> tag.
            </p>
          </div>
          <Button size="sm" onClick={copyEmbedSnippet} className="text-xs font-semibold shadow-xs">
            {copiedSnippet ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copiedSnippet ? "Copied!" : "Copy Embed Script"}
          </Button>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="p-4 rounded-2xl bg-zinc-950 text-zinc-100 font-mono text-xs border border-zinc-800 shadow-inner overflow-x-auto">
            <pre className="leading-relaxed">{getEmbedCode()}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
