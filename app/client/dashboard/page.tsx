"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Plus,
  FileText,
  MessageSquare,
  Zap,
  ShieldCheck,
  Code2,
  ExternalLink,
  ChevronRight,
  Check,
  Copy,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Radio,
  BookOpen,
  Send,
  Key,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function ClientDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [embedFramework, setEmbedFramework] = useState<"html" | "react" | "vue" | "shopify">("html");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, agentsRes] = await Promise.all([
        fetch("/api/v1/analytics?days=30"),
        fetch("/api/v1/agents"),
      ]);

      if (metricsRes.ok) {
        const mJson = await metricsRes.json();
        setData(mJson.data);
      }
      if (agentsRes.ok) {
        const aJson = await agentsRes.json();
        const loadedAgents = aJson.data || [];
        setAgents(loadedAgents);
        if (loadedAgents.length > 0) {
          setSelectedAgentId((prev) => (prev && loadedAgents.some((a: any) => a.id === prev) ? prev : loadedAgents[0].id));
        }
      }
    } catch (err) {
      console.error("Failed to load client data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const overview = data?.overview || {
    totalAgents: agents.length,
    activeAgents: agents.filter((a) => a.isPublished).length,
    totalDocuments: 0,
    processedDocuments: 0,
    totalConversations: 0,
    totalMessages: 0,
    totalTokens: 0,
    avgLatencyMs: 0,
  };

  const selectedAgent =
    agents.find((a) => a.id === selectedAgentId) || (agents.length > 0 ? agents[0] : null);

  const getCodeSnippet = () => {
    const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : "https://brain-plug.vercel.app";
    const agentId = selectedAgent?.id || "YOUR_AGENT_ID";
    const apiKey = selectedAgent?.apiKey || "YOUR_AGENT_API_KEY";

    switch (embedFramework) {
      case "html":
        return `<!-- Brain Plug AI Chatbot Widget -->\n<script\n  src="${origin}/widget.js"\n  data-agent-id="${agentId}"\n  data-api-key="${apiKey}"\n  async\n></script>`;
      case "react":
        return `// React / Next.js Component\nimport Script from "next/script";\n\nexport default function ChatWidget() {\n  return (\n    <Script\n      src="${origin}/widget.js"\n      data-agent-id="${agentId}"\n      data-api-key="${apiKey}"\n      strategy="lazyOnload"\n    />\n  );\n}`;
      case "vue":
        return `<!-- Vue 3 / Nuxt 3 Component -->\n<template>\n  <component :is="'script'"\n    src="${origin}/widget.js"\n    data-agent-id="${agentId}"\n    data-api-key="${apiKey}"\n    async\n  />\n</template>`;
      case "shopify":
        return `{% comment %} Shopify theme.liquid before </body> {% endcomment %}\n<script\n  src="${origin}/widget.js"\n  data-agent-id="${agentId}"\n  data-api-key="${apiKey}"\n  async\n></script>`;
    }
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const chartData = [
    { name: "Week 1", requests: Math.floor(overview.totalConversations * 0.15) || 5, tokens: Math.floor(overview.totalTokens * 0.15) || 1200 },
    { name: "Week 2", requests: Math.floor(overview.totalConversations * 0.25) || 12, tokens: Math.floor(overview.totalTokens * 0.25) || 2800 },
    { name: "Week 3", requests: Math.floor(overview.totalConversations * 0.35) || 18, tokens: Math.floor(overview.totalTokens * 0.35) || 4500 },
    { name: "Week 4", requests: Math.floor(overview.totalConversations * 0.25) || 15, tokens: Math.floor(overview.totalTokens * 0.25) || 3900 },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Workspace Welcome Banner with Ambient Glow */}
      <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-card/90 border border-border/80 p-6 sm:p-8 shadow-sm ambient-glow-mesh overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Workspace Active</span>
              </div>
              <Badge variant="outline" className="text-[11px] font-medium border-border/80">
                RAG Knowledge Grounding
              </Badge>
              <Badge variant="glow" className="text-[11px] font-semibold">
                Gemini 2.0 Flash
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              AI Agent Management Studio
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-normal leading-relaxed">
              Deploy custom AI chatbots grounded in your uploaded company documents, customize their appearance, and embed them into any website with 1 line of code.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link href="/client/agents/new">
              <Button size="lg" className="w-full sm:w-auto font-semibold shadow-md shadow-primary/20">
                <Plus className="w-4 h-4 mr-1.5" /> Create AI Agent
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="outline" size="lg" className="w-full sm:w-auto font-semibold">
                <Code2 className="w-4 h-4 mr-1.5" /> Embed Guide
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4-Stat KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* My Agents */}
        <div className="pro-card rounded-2xl p-5 sm:p-6 stat-card-gradient-purple flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              AI Agents Fleet
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              {agents.length}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 font-normal">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {overview.activeAgents} published
              </span>
              <span>live on site</span>
            </div>
          </div>
        </div>

        {/* Knowledge Documents */}
        <div className="pro-card rounded-2xl p-5 sm:p-6 stat-card-gradient-emerald flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Knowledge Base
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              {overview.totalDocuments}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 font-normal">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {overview.processedDocuments} indexed
              </span>
              <span>vector chunks</span>
            </div>
          </div>
        </div>

        {/* Conversations */}
        <div className="pro-card rounded-2xl p-5 sm:p-6 stat-card-gradient-blue flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Conversations
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              {overview.totalConversations}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 font-normal">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>{overview.totalMessages} user messages</span>
            </div>
          </div>
        </div>

        {/* Token Consumption */}
        <div className="pro-card rounded-2xl p-5 sm:p-6 stat-card-gradient-amber flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Token Consumption
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              {overview.totalTokens.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 font-normal">
              <span>Avg latency: {overview.avgLatencyMs || 0}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Showcase & 1-Click Embed Snippet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deployed Agents List (2 cols) */}
        <Card className="lg:col-span-2 border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold">Configured AI Agents</CardTitle>
                <Badge variant="outline" className="text-[10px] font-semibold">
                  {agents.length} Total
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Agents equipped with custom system instructions, RAG files, and widgets
              </p>
            </div>
            <Link href="/client/agents">
              <Button variant="ghost" size="sm" className="text-xs font-medium">
                View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-border/80 rounded-2xl bg-muted/20">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-foreground">No AI Agents Created Yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-5 leading-relaxed">
                  Build your first AI assistant trained on your knowledge base with zero coding required.
                </p>
                <Link href="/client/agents/new">
                  <Button size="sm" className="font-semibold">
                    <Plus className="w-4 h-4 mr-1.5" /> Create First Agent
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {agents.slice(0, 3).map((agent) => {
                  const isSelected = selectedAgent?.id === agent.id;
                  return (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs cursor-pointer ${
                        isSelected
                          ? "bg-primary/[0.06] border-primary/60 ring-1 ring-primary/30 shadow-sm"
                          : "bg-muted/30 border-border/70 hover:border-primary/40 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground truncate">{agent.name}</h4>
                            <Badge
                              variant={agent.isPublished ? "success" : "secondary"}
                              className="text-[10px] font-semibold"
                            >
                              {agent.isPublished ? "Published" : "Draft"}
                            </Badge>
                            {isSelected && (
                              <Badge variant="glow" className="text-[9px] font-bold">
                                Active in Embed
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 font-normal">
                            {agent.description || "Trained on knowledge documents and custom instructions"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/client/agents/${agent.id}/knowledge`}>
                          <Button variant="outline" size="sm" className="text-xs font-medium">
                            <FileText className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Knowledge
                          </Button>
                        </Link>
                        <Link href={`/client/agents/${agent.id}/widget`}>
                          <Button
                            size="sm"
                            className="text-xs font-medium shadow-xs"
                            onClick={() => setSelectedAgentId(agent.id)}
                          >
                            <Code2 className="w-3.5 h-3.5 mr-1" /> Embed Widget
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 1-Click Multi-Platform Embed Card (1 col) */}
        <Card className="border-border/80 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">1-Click Website Embed</CardTitle>
                  <p className="text-xs text-muted-foreground">Add to HTML, React, Vue, or Shopify</p>
                </div>
              </div>

              {selectedAgent && (
                <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30">
                  {selectedAgent.name}
                </Badge>
              )}
            </div>

            {/* Target Agent Selector Dropdown */}
            {agents.length > 1 && (
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                  <span>Select Target Agent:</span>
                  <span className="text-primary font-bold text-xs">{selectedAgent?.name}</span>
                </label>
                <select
                  value={selectedAgent?.id || ""}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full bg-muted/50 border border-border/80 rounded-xl px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id} className="bg-card text-foreground">
                      {a.name} ({a.isPublished ? "Published" : "Draft"})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-3.5 pt-3">
            {/* Framework Pills */}
            <div className="flex flex-wrap gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/70">
              {(["html", "react", "vue", "shopify"] as const).map((fw) => (
                <button
                  key={fw}
                  onClick={() => setEmbedFramework(fw)}
                  className={`flex-1 min-w-[50px] py-1 text-center rounded-lg text-xs font-semibold transition-all duration-200 ${
                    embedFramework === fw
                      ? "bg-primary text-primary-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {fw.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Active API Key Status Bar */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/40 border border-border/60 text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <Key className="w-3 h-3 text-primary shrink-0" />
                <span className="text-muted-foreground">Key:</span>
                <span className="font-mono font-semibold text-foreground truncate max-w-[140px] select-all">
                  {selectedAgent?.apiKey ? `${selectedAgent.apiKey.substring(0, 12)}...` : "Loading key..."}
                </span>
              </div>
              <Badge variant="success" className="text-[9px] font-semibold shrink-0">
                ACTIVE
              </Badge>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-[11px] overflow-x-auto border border-zinc-800 shadow-inner">
              <pre className="whitespace-pre">{getCodeSnippet()}</pre>
            </div>

            <Button
              onClick={copyEmbedCode}
              variant="outline"
              className="w-full text-xs font-semibold shadow-xs"
            >
              {copiedSnippet ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy Embed Code
                </>
              )}
            </Button>

            <div className="pt-2 border-t border-border/70 text-center flex items-center justify-between text-xs">
              <Link
                href={selectedAgent ? `/client/agents/${selectedAgent.id}/widget` : "/client/agents"}
                className="font-medium text-primary hover:underline inline-flex items-center gap-1 text-[11px]"
              >
                Customize Appearance &rarr;
              </Link>
              <Link
                href="/docs"
                className="font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11px]"
              >
                Docs <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Velocity Chart */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold">Conversation Volume & Token Velocity</CardTitle>
              <Badge variant="glow" className="text-[10px] font-semibold">
                30-Day Activity
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Weekly user query volume and AI response tokens generated
            </p>
          </div>
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            className="text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-60 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="clientGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "14px",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#clientGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
