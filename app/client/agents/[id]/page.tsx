"use client";

import React, { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import {
  Bot,
  Sparkles,
  FileText,
  Key,
  Send,
  Trash2,
  Save,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Code2,
  Shield,
  MessageSquare,
  Mic,
  Video,
  Plus,
  Zap,
  Lock,
  Eye,
  EyeOff,
  Settings,
  Share2,
  CheckCircle,
  Palette,
  RotateCcw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const MODALITY_ICONS: Record<string, any> = {
  CHAT: MessageSquare,
  VOICE: Mic,
  CUSTOM: Video,
  ASSISTANT: Bot,
};

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [agent, setAgent] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"widget" | "embed" | "settings">("widget");
  const [embedCodeType, setEmbedCodeType] = useState<"html" | "react" | "curl">("html");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSavingWidget, setIsSavingWidget] = useState(false);
  const [widgetSaveSuccess, setWidgetSaveSuccess] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");

  // Widget Configuration State (loaded from agent creation)
  const [widgetConfig, setWidgetConfig] = useState<any>({
    avatar: "",
    primaryColor: "#7c3aed",
    secondaryColor: "#f3e8ff",
    backgroundColor: "#ffffff",
    textColor: "#1e1b4b",
    launcherColor: "#7c3aed",
    launcherType: "BUTTON",
    buttonLabel: "Chat with us",
    buttonIcon: "MessageSquare",
    position: "BOTTOM_RIGHT",
    borderRadius: 16,
  });

  // Key Visibility & Copy state
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // API Key creation modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("Website Live Widget");
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  // Live Widget Chat State
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; sources?: any[] }>
  >([]);
  const [inputMsg, setInputMsg] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchAgentAndKeys = async () => {
    try {
      const [agentRes, keysRes, widgetRes] = await Promise.all([
        fetch(`/api/v1/agents/${id}`),
        fetch(`/api/v1/agents/${id}/api-keys`),
        fetch(`/api/v1/agents/${id}/widget`),
      ]);

      if (agentRes.ok) {
        const json = await agentRes.json();
        setAgent(json.data);
        if (chatMessages.length === 0 && json.data?.welcomeMessage) {
          setChatMessages([
            { role: "assistant", content: json.data.welcomeMessage },
          ]);
        }
        if (json.data?.avatar) {
          setWidgetConfig((prev: any) => ({ ...prev, avatar: prev.avatar || json.data.avatar }));
        }
      }

      if (keysRes.ok) {
        const kJson = await keysRes.json();
        setApiKeys(kJson.data || []);
      }

      if (widgetRes.ok) {
        const wJson = await widgetRes.json();
        if (wJson.data) {
          setWidgetConfig((prev: any) => ({ ...prev, ...wJson.data }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWidgetConfig = async () => {
    setIsSavingWidget(true);
    try {
      const res = await fetch(`/api/v1/agents/${id}/widget`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatar: widgetConfig.avatar || undefined,
          primaryColor: widgetConfig.primaryColor,
          secondaryColor: widgetConfig.secondaryColor,
          backgroundColor: widgetConfig.backgroundColor,
          textColor: widgetConfig.textColor,
          launcherColor: widgetConfig.launcherColor || widgetConfig.primaryColor,
          launcherType: widgetConfig.launcherType || "BUTTON",
          buttonIcon: widgetConfig.buttonIcon || "MessageSquare",
          buttonLabel: widgetConfig.buttonLabel || "Chat with us",
          position: (widgetConfig.position || "BOTTOM_RIGHT").toUpperCase().replace(/-/g, "_"),
          borderRadius: widgetConfig.borderRadius || 16,
        }),
      });

      if (res.ok) {
        setWidgetSaveSuccess(true);
        setTimeout(() => setWidgetSaveSuccess(false), 2500);
        fetchAgentAndKeys();
      }
    } catch (e) {
      console.error("Save widget config failed:", e);
    } finally {
      setIsSavingWidget(false);
    }
  };

  useEffect(() => {
    fetchAgentAndKeys();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleCopy = async (text: string, idStr: string) => {
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
    setCopiedKey(idStr);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMsg;
    if (!textToSend.trim() || isStreaming) return;

    const userMessage = { role: "user" as const, content: textToSend.trim() };
    setChatMessages((prev) => [...prev, userMessage]);
    if (!customText) setInputMsg("");
    setIsStreaming(true);

    const assistantMessage = {
      role: "assistant" as const,
      content: "",
      sources: [] as any[],
    };
    setChatMessages((prev) => [...prev, assistantMessage]);

    try {
      const activeKey = apiKeys.find((k) => k.status === "ACTIVE")?.rawKey;
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(activeKey ? { "x-api-key": activeKey } : {}),
        },
        body: JSON.stringify({
          agentId: id,
          message: userMessage.content,
          conversationId: conversationId || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentAssistantText = "";
      let currentSources: any[] = [];

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.type === "start") {
                setConversationId(data.conversationId);
                if (data.sources) {
                  currentSources = data.sources;
                  setChatMessages((prev) => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                      updated[lastIdx] = {
                        ...updated[lastIdx],
                        sources: currentSources,
                      };
                    }
                    return updated;
                  });
                }
              } else if (data.type === "token") {
                currentAssistantText += data.content;
                setChatMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      content: currentAssistantText,
                      sources: currentSources,
                    };
                  }
                  return updated;
                });
              } else if (data.type === "done") {
                setConversationId(data.conversationId);
                if (data.sources) currentSources = data.sources;
                if (data.fullContent) currentAssistantText = data.fullContent;
                setChatMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      content: currentAssistantText,
                      sources: currentSources,
                    };
                  }
                  return updated;
                });
              }
            } catch (e) {
              console.error("Parse SSE error:", e);
            }
          }
        }
      }
    } catch (err: any) {
      setChatMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant") {
          last.content = `Error: ${err.message || "Failed to communicate with AI agent."}`;
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setIsCreatingKey(true);

    try {
      const res = await fetch(`/api/v1/agents/${id}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      if (res.ok) {
        const json = await res.json();
        setCreatedSecret(json.data.rawKey);
        fetchAgentAndKeys();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? Embedded widgets using it will stop functioning.")) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/api-keys/${keyId}`, { method: "DELETE" });
      if (res.ok) {
        fetchAgentAndKeys();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/v1/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: agent.name,
          description: agent.description,
          systemPrompt: agent.systemPrompt,
          welcomeMessage: agent.welcomeMessage,
          temperature: agent.temperature,
          topK: agent.topK,
          similarityThreshold: agent.similarityThreshold,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        fetchAgentAndKeys();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const clearChat = () => {
    setChatMessages(
      agent?.welcomeMessage
        ? [{ role: "assistant", content: agent.welcomeMessage }]
        : []
    );
    setConversationId(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-muted-foreground">
        <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm font-semibold">Loading agent configuration...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Agent Not Found</h2>
        <Link href="/client/agents">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Return to Agents
          </Button>
        </Link>
      </div>
    );
  }

  const ModalityIcon = MODALITY_ICONS[agent.type] || Bot;
  const primaryApiKey = apiKeys.find((k) => k.status === "ACTIVE");
  const hostOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const htmlSnippet = `<!-- Brain Plug Grounded AI Chat Widget -->
<script
  src="${hostOrigin}/widget.js"
  data-agent-id="${agent.id}"
  data-api-key="${primaryApiKey?.rawKey || "YOUR_API_KEY_HERE"}"
  async
></script>`;

  const reactSnippet = `import { useEffect } from "react";

export function AIAssistantWidget() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "${hostOrigin}/widget.js";
    script.setAttribute("data-agent-id", "${agent.id}");
    script.setAttribute("data-api-key", "${primaryApiKey?.rawKey || "YOUR_API_KEY_HERE"}");
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}`;

  const curlSnippet = `curl -X POST ${hostOrigin}/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${primaryApiKey?.rawKey || "YOUR_API_KEY_HERE"}" \\
  -d '{
    "agentId": "${agent.id}",
    "message": "Hello, how can you help me?"
  }'`;

  const COLOR_PRESETS = [
    { label: "Purple", primary: "#7c3aed", secondary: "#f3e8ff" },
    { label: "Indigo", primary: "#4f46e5", secondary: "#e0e7ff" },
    { label: "Blue", primary: "#2563eb", secondary: "#dbeafe" },
    { label: "Emerald", primary: "#059669", secondary: "#d1fae5" },
    { label: "Rose", primary: "#e11d48", secondary: "#ffe4e6" },
    { label: "Amber", primary: "#d97706", secondary: "#fef3c7" },
    { label: "Dark", primary: "#0f172a", secondary: "#f1f5f9" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-16">
      {/* Top Header Card */}
      <div className="relative rounded-3xl bg-card border border-border/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/client/agents"
            className="p-2 rounded-xl border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <Badge variant="outline" className="text-[10px] font-semibold text-primary">
                {agent.type} AGENT
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                {agent.geminiModel?.displayName || "Google Gemini"}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground mt-0.5">
              {agent.name}
            </h1>
          </div>
        </div>

        {/* Header Action Links */}
        <div className="flex items-center gap-2">
          <Link href={`/client/agents/${id}/knowledge`}>
            <Button variant="outline" size="sm" className="text-xs font-semibold shadow-xs">
              <FileText className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              Knowledge Base ({agent._count?.documents || 0})
            </Button>
          </Link>
          <Link href={`/client/agents/${id}/widget`}>
            <Button variant="outline" size="sm" className="text-xs font-semibold shadow-xs">
              <Palette className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Embed Studio
            </Button>
          </Link>
        </div>
      </div>

      {/* 3 Clean Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/70 pb-2.5">
        <button
          type="button"
          onClick={() => setActiveTab("widget")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "widget"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> 💬 Live Widget & Customizer
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("embed")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "embed"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" /> ⚡ Embed Code & API Keys
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "settings"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> ⚙️ Persona & Rules
        </button>
      </div>

      {/* TAB 1: SPLIT SCREEN WIDGET CUSTOMIZER & LIVE CHAT */}
      {activeTab === "widget" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          {/* LEFT 6 COLS: WIDGET STYLING & POSITION CONTROLS */}
          <div className="lg:col-span-6 space-y-5">
            <Card className="border-border/80 shadow-xs overflow-hidden">
              <CardHeader className="p-4 sm:p-5 border-b border-border/70 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <Palette className="w-4 h-4 text-primary" /> Widget Styling & Launcher
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure logo, chat button colors, icons, position, and layout.
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={handleSaveWidgetConfig}
                  disabled={isSavingWidget}
                  className="text-xs font-semibold shadow-xs"
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  {isSavingWidget
                    ? "Saving..."
                    : widgetSaveSuccess
                    ? "Saved!"
                    : "Save Styling"}
                </Button>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-5 text-xs">
                {/* Agent Logo / Avatar URL */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center justify-between">
                    <span>Agent Logo / Avatar URL <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span></span>
                    {widgetConfig.avatar ? (
                      <button
                        type="button"
                        onClick={() => setWidgetConfig((prev: any) => ({ ...prev, avatar: "" }))}
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
                      {widgetConfig.avatar ? (
                        <img
                          src={widgetConfig.avatar}
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
                      value={widgetConfig.avatar || ""}
                      onChange={(e) =>
                        setWidgetConfig((prev: any) => ({ ...prev, avatar: e.target.value }))
                      }
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Quick Preset Palette Swatches */}
                <div className="space-y-1.5 pt-1">
                  <label className="font-semibold text-foreground flex items-center justify-between">
                    <span>Preset Color Themes</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Click to apply palette</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() =>
                          setWidgetConfig((prev: any) => ({
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

                {/* Color Pickers Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Primary Color */}
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Primary Brand Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={widgetConfig.primaryColor || "#7c3aed"}
                        onChange={(e) =>
                          setWidgetConfig((prev: any) => ({ ...prev, primaryColor: e.target.value }))
                        }
                        className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-background p-0.5 shrink-0"
                      />
                      <Input
                        value={widgetConfig.primaryColor || "#7c3aed"}
                        onChange={(e) =>
                          setWidgetConfig((prev: any) => ({ ...prev, primaryColor: e.target.value }))
                        }
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Launcher Button Color */}
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Chat Button BG Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={widgetConfig.launcherColor || widgetConfig.primaryColor || "#7c3aed"}
                        onChange={(e) =>
                          setWidgetConfig((prev: any) => ({ ...prev, launcherColor: e.target.value }))
                        }
                        className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-background p-0.5 shrink-0"
                      />
                      <Input
                        value={widgetConfig.launcherColor || widgetConfig.primaryColor || "#7c3aed"}
                        onChange={(e) =>
                          setWidgetConfig((prev: any) => ({ ...prev, launcherColor: e.target.value }))
                        }
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Assistant Bubble Color */}
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Assistant Bubble Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={widgetConfig.secondaryColor || "#f3e8ff"}
                        onChange={(e) =>
                          setWidgetConfig((prev: any) => ({ ...prev, secondaryColor: e.target.value }))
                        }
                        className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-background p-0.5 shrink-0"
                      />
                      <Input
                        value={widgetConfig.secondaryColor || "#f3e8ff"}
                        onChange={(e) =>
                          setWidgetConfig((prev: any) => ({ ...prev, secondaryColor: e.target.value }))
                        }
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={widgetConfig.backgroundColor || "#ffffff"}
                        onChange={(e) =>
                          setWidgetConfig((prev: any) => ({ ...prev, backgroundColor: e.target.value }))
                        }
                        className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-background p-0.5 shrink-0"
                      />
                      <Input
                        value={widgetConfig.backgroundColor || "#ffffff"}
                        onChange={(e) =>
                          setWidgetConfig((prev: any) => ({ ...prev, backgroundColor: e.target.value }))
                        }
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
                      onClick={() =>
                        setWidgetConfig((prev: any) => ({ ...prev, launcherType: "BUTTON" }))
                      }
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        (widgetConfig.launcherType || "BUTTON") === "BUTTON"
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Pill Button with Label</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setWidgetConfig((prev: any) => ({ ...prev, launcherType: "ROUND" }))
                      }
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        (widgetConfig.launcherType || "").toUpperCase() === "ROUND"
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

                {/* Launcher Icon Picker */}
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
                      const isSelected = (widgetConfig.buttonIcon || "MessageSquare") === ic.id;
                      return (
                        <button
                          key={ic.id}
                          type="button"
                          onClick={() =>
                            setWidgetConfig((prev: any) => ({ ...prev, buttonIcon: ic.id }))
                          }
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

                {/* Screen Position */}
                <div className="space-y-2 pt-1">
                  <label className="font-semibold text-foreground flex items-center justify-between">
                    <span>Screen Position</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {widgetConfig.position || "BOTTOM_RIGHT"}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "BOTTOM_RIGHT", label: "↘ Bottom Right", note: "Standard" },
                      { id: "BOTTOM_LEFT", label: "↙ Bottom Left", note: "Left Aligned" },
                      { id: "TOP_RIGHT", label: "↗ Top Right", note: "Upper Corner" },
                      { id: "TOP_LEFT", label: "↖ Top Left", note: "Upper Corner" },
                    ].map((pos) => {
                      const isSelected =
                        (widgetConfig.position || "BOTTOM_RIGHT").toUpperCase().replace(/-/g, "_") ===
                        pos.id;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() =>
                            setWidgetConfig((prev: any) => ({ ...prev, position: pos.id }))
                          }
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-xs"
                              : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          <span>{pos.label}</span>
                          <span className={`text-[9px] ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                            {pos.note}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Corner Radius & Launcher Label */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-foreground">Corner Radius</label>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {widgetConfig.borderRadius || 16}px
                      </Badge>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="32"
                      value={widgetConfig.borderRadius || 16}
                      onChange={(e) =>
                        setWidgetConfig((prev: any) => ({
                          ...prev,
                          borderRadius: parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-full accent-primary mt-1.5 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Launcher Button Label</label>
                    <Input
                      value={widgetConfig.buttonLabel || "Chat with us"}
                      onChange={(e) =>
                        setWidgetConfig((prev: any) => ({ ...prev, buttonLabel: e.target.value }))
                      }
                      placeholder="e.g. Chat with AI"
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <div className="text-[11px] text-muted-foreground">
                    {widgetSaveSuccess && (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Styling saved successfully!
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={handleSaveWidgetConfig}
                    disabled={isSavingWidget}
                    className="text-xs font-semibold shadow-xs px-5"
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    {isSavingWidget
                      ? "Saving..."
                      : widgetSaveSuccess
                      ? "Saved!"
                      : "Save Styling Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT 6 COLS: LIVE INTERACTIVE CHAT WIDGET PREVIEW */}
          <div className="lg:col-span-6 space-y-4 sticky top-6">
            {/* Viewport Mode Switcher */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-primary" /> Live Widget Preview
              </span>
              <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/80 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewViewport("desktop")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    previewViewport === "desktop"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🖥️ Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport("mobile")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    previewViewport === "mobile"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  📱 Mobile
                </button>
              </div>
            </div>

            <div
              className={`w-full shadow-2xl border border-border/80 overflow-hidden flex flex-col bg-card transition-all mx-auto ${
                previewViewport === "mobile" ? "max-w-[360px] rounded-3xl" : "rounded-3xl"
              }`}
              style={{
                borderRadius: previewViewport === "mobile" ? "24px" : `${widgetConfig.borderRadius || 16}px`,
                height: previewViewport === "mobile" ? "520px" : "560px",
              }}
            >
              {/* Widget Top Header */}
              <div
                className="px-5 py-3.5 flex items-center justify-between text-white shrink-0 transition-colors shadow-xs"
                style={{ backgroundColor: widgetConfig.primaryColor || "#7c3aed" }}
              >
                <div className="flex items-center gap-3">
                  {widgetConfig.avatar ? (
                    <img
                      src={widgetConfig.avatar}
                      alt="logo"
                      className="w-8 h-8 rounded-full object-cover border-2 border-white/50 bg-white"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-xs shadow-xs backdrop-blur-xs">
                      <ModalityIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <div className="font-extrabold text-sm leading-tight tracking-tight">{agent.name}</div>
                    <div className="text-[10px] text-white/85 flex items-center gap-1.5 mt-0.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      <span>Live • {agent.type} Agent</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={clearChat}
                  title="Clear Chat"
                  className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 text-xs transition-all active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Widget Chat Messages Body */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3 text-xs"
                style={{ backgroundColor: widgetConfig.backgroundColor || undefined }}
              >
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                    <Bot className="w-8 h-8 text-primary mb-2 opacity-80" />
                    <p className="font-bold text-foreground text-xs">Interactive Live Preview</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Test chatting with your AI assistant.</p>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${
                        msg.role === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                          msg.role === "user"
                            ? "text-white font-medium rounded-tr-xs"
                            : "rounded-tl-xs border border-border/60"
                        }`}
                        style={{
                          backgroundColor:
                            msg.role === "user"
                              ? widgetConfig.primaryColor || "#7c3aed"
                              : widgetConfig.secondaryColor || "#f3e8ff",
                          color:
                            msg.role === "user"
                              ? "#ffffff"
                              : widgetConfig.textColor || undefined,
                        }}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Widget Chat Input Footer */}
              <div className="p-3 bg-card border-t border-border/70 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Ask your agent a question..."
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    disabled={isStreaming}
                    className="flex-1 bg-muted/40 border border-border/80 rounded-2xl px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary shadow-xs"
                  />
                  <button
                    type="submit"
                    disabled={isStreaming || !inputMsg.trim()}
                    className="p-2 rounded-2xl text-white font-bold text-xs shadow-xs hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    style={{ backgroundColor: widgetConfig.primaryColor || "#7c3aed" }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Configured Floating Launcher Preview */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/70 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-muted-foreground font-semibold">Launcher:</span>
                <div
                  className={`text-white font-bold text-xs shadow-sm flex items-center justify-center transition-all ${
                    (widgetConfig.launcherType || "").toUpperCase() === "ROUND"
                      ? "w-11 h-11 rounded-full p-0"
                      : "px-3.5 py-2 rounded-full gap-2"
                  }`}
                  style={{
                    backgroundColor:
                      widgetConfig.launcherColor || widgetConfig.primaryColor || "#7c3aed",
                  }}
                >
                  {widgetConfig.avatar ? (
                    <img
                      src={widgetConfig.avatar}
                      alt="logo"
                      className={`${(widgetConfig.launcherType || "").toUpperCase() === "ROUND" ? "w-8 h-8" : "w-4 h-4"} rounded-full object-cover bg-white`}
                    />
                  ) : (
                    <span className="text-sm">
                      {widgetConfig.buttonIcon === "Bot"
                        ? "🤖"
                        : widgetConfig.buttonIcon === "Sparkles"
                        ? "✨"
                        : widgetConfig.buttonIcon === "Headphones"
                        ? "🎧"
                        : widgetConfig.buttonIcon === "MessageCircle"
                        ? "💭"
                        : widgetConfig.buttonIcon === "Zap"
                        ? "⚡"
                        : "💬"}
                    </span>
                  )}
                  {(widgetConfig.launcherType || "BUTTON") !== "ROUND" && (
                    <span>{widgetConfig.buttonLabel || "Chat with us"}</span>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                {(widgetConfig.position || "BOTTOM_RIGHT").toUpperCase().replace(/-/g, "_") === "BOTTOM_LEFT"
                  ? "↙ Bottom Left"
                  : (widgetConfig.position || "BOTTOM_RIGHT").toUpperCase().replace(/-/g, "_") === "TOP_RIGHT"
                  ? "↗ Top Right"
                  : (widgetConfig.position || "BOTTOM_RIGHT").toUpperCase().replace(/-/g, "_") === "TOP_LEFT"
                  ? "↖ Top Left"
                  : "↘ Bottom Right"}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMBED CODE & API KEYS */}
      {activeTab === "embed" && (
        <div className="space-y-6">
          {/* Web Integration Card */}
          <Card className="border-border/80 shadow-xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-primary" /> Embed Script Tag
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Paste this snippet inside your website's <code className="text-foreground font-mono">&lt;body&gt;</code> tag.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/80 shrink-0">
                {(["html", "react", "curl"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEmbedCodeType(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                      embedCodeType === t
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              <div className="relative rounded-2xl bg-zinc-950 text-zinc-100 p-4 font-mono text-xs overflow-x-auto border border-zinc-800">
                <Button
                  size="sm"
                  onClick={() => {
                    const snippet =
                      embedCodeType === "html"
                        ? htmlSnippet
                        : embedCodeType === "react"
                        ? reactSnippet
                        : curlSnippet;
                    handleCopy(snippet, `embed-${embedCodeType}`);
                  }}
                  className="absolute right-3 top-3 h-7 text-xs font-semibold shadow-xs"
                >
                  {copiedKey === `embed-${embedCodeType}` ? (
                    <>
                      <Check className="w-3 h-3 mr-1 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" /> Copy Code
                    </>
                  )}
                </Button>
                <pre className="pr-20 leading-relaxed whitespace-pre-wrap">
                  {embedCodeType === "html" && htmlSnippet}
                  {embedCodeType === "react" && reactSnippet}
                  {embedCodeType === "curl" && curlSnippet}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* API Keys Vault */}
          <Card className="border-border/80 shadow-xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border/70 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" /> API Keys
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Secret credentials used to authorize widget completions.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setNewKeyName("Website Live Widget");
                  setCreatedSecret(null);
                  setShowKeyModal(true);
                }}
                className="text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Generate New Key
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/80 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Key Name</th>
                      <th className="px-5 py-3.5">Key Value</th>
                      <th className="px-5 py-3.5">Created</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {apiKeys.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-muted-foreground">
                          No API keys generated. Click "Generate New Key" to create one.
                        </td>
                      </tr>
                    ) : (
                      apiKeys.map((k) => {
                        const isRevealed = Boolean(revealedKeys[k.id]);
                        const displayKey =
                          isRevealed && k.rawKey
                            ? k.rawKey
                            : `${k.keyPrefix}••••••••••••••••••••••••`;

                        return (
                          <tr key={k.id} className="hover:bg-muted/40 transition-colors">
                            <td className="px-5 py-3.5 font-bold text-foreground">{k.name}</td>

                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs text-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/70 select-all font-medium">
                                  {displayKey}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setRevealedKeys((prev) => ({
                                      ...prev,
                                      [k.id]: !prev[k.id],
                                    }))
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopy(k.rawKey || k.keyPrefix, k.id)}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                                  title="Copy Key"
                                >
                                  {copiedKey === k.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                              </div>
                            </td>

                            <td className="px-5 py-3.5 text-muted-foreground">
                              {new Date(k.createdAt).toLocaleDateString()}
                            </td>

                            <td className="px-5 py-3.5">
                              <Badge
                                variant={k.status === "ACTIVE" ? "success" : "destructive"}
                                className="text-[10px] font-semibold"
                              >
                                {k.status}
                              </Badge>
                            </td>

                            <td className="px-5 py-3.5 text-right">
                              {k.status === "ACTIVE" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRevokeKey(k.id)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10 text-xs h-7 px-2"
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
        </div>
      )}

      {/* TAB 3: AGENT PERSONA & SETTINGS */}
      {activeTab === "settings" && (
        <Card className="border-border/80 shadow-xs p-5 sm:p-6">
          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" /> Persona & Guardrails
              </h3>
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Agent Name</label>
                <Input
                  required
                  value={agent.name}
                  onChange={(e) => setAgent({ ...agent, name: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Welcome Greeting Message</label>
                <Input
                  required
                  value={agent.welcomeMessage}
                  onChange={(e) => setAgent({ ...agent, welcomeMessage: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Description</label>
              <Input
                value={agent.description || ""}
                onChange={(e) => setAgent({ ...agent, description: e.target.value })}
                placeholder="Agent description..."
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">System Persona & Guardrail Instructions</label>
              <textarea
                rows={6}
                required
                value={agent.systemPrompt}
                onChange={(e) => setAgent({ ...agent, systemPrompt: e.target.value })}
                className="w-full rounded-2xl border border-border/80 p-3 bg-background text-xs text-foreground outline-none focus:border-primary font-mono leading-relaxed shadow-xs"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <Button type="submit" disabled={isSaving} className="text-xs font-semibold shadow-xs px-5">
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Generate API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">Generate API Key</h3>
              </div>
              <button
                onClick={() => {
                  setShowKeyModal(false);
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
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Key generated successfully!</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs break-all flex items-center justify-between gap-2 border border-zinc-800">
                  <span>{createdSecret}</span>
                  <Button
                    size="sm"
                    onClick={() => handleCopy(createdSecret, "modal-key")}
                    className="h-7 shrink-0 text-xs"
                  >
                    {copiedKey === "modal-key" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      setShowKeyModal(false);
                      setCreatedSecret(null);
                    }}
                    className="w-full text-xs font-semibold"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateApiKey} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Key Friendly Name</label>
                  <Input
                    required
                    placeholder="e.g. Website Live Chat Widget"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowKeyModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreatingKey}
                    className="text-xs font-semibold shadow-xs"
                  >
                    {isCreatingKey ? "Generating..." : "Generate Key"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
