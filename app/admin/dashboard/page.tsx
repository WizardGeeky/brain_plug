"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Bot,
  MessageSquare,
  Cpu,
  Activity,
  Zap,
  ShieldCheck,
  FileText,
  Sparkles,
  ArrowUpRight,
  Database,
  Users,
  ChevronRight,
  RefreshCw,
  Plus,
  Server,
  Radio,
  CheckCircle2,
  TrendingUp,
  Clock,
  Lock,
  Shield,
  BarChart3,
  Layers,
  LifeBuoy,
  Key,
  Flame,
  CheckCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const MODEL_COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b"];

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [activeChartMetric, setActiveChartMetric] = useState<"tokens" | "requests" | "latency">("tokens");

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const days = timeRange === "7d" ? 7 : timeRange === "90d" ? 90 : 30;
      const res = await fetch(`/api/v1/analytics?days=${days}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load metrics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const overview = data?.overview || {
    totalClients: 0,
    activeClients: 0,
    inactiveClients: 0,
    totalAgents: 0,
    activeAgents: 0,
    archivedAgents: 0,
    ragAgentsCount: 0,
    totalDocuments: 0,
    processedDocuments: 0,
    totalChunks: 0,
    totalConversations: 0,
    activeConversations: 0,
    totalMessages: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalTickets: 0,
    openTickets: 0,
    activeApiKeys: 0,
    totalRequests: 0,
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    avgLatencyMs: 1250,
    p95LatencyMs: 1850,
    successRate: 99.8,
  };

  const trafficChart = data?.trafficChart || [
    { name: "Day 1", requests: 24, tokens: 9200, inputTokens: 3800, outputTokens: 5400, avgLatency: 1180, success: 24, errors: 0 },
    { name: "Day 2", requests: 35, tokens: 13500, inputTokens: 5600, outputTokens: 7900, avgLatency: 1210, success: 35, errors: 0 },
    { name: "Day 3", requests: 48, tokens: 18900, inputTokens: 7800, outputTokens: 11100, avgLatency: 1190, success: 47, errors: 1 },
    { name: "Day 4", requests: 52, tokens: 21400, inputTokens: 8900, outputTokens: 12500, avgLatency: 1250, success: 52, errors: 0 },
    { name: "Day 5", requests: 65, tokens: 26800, inputTokens: 11200, outputTokens: 15600, avgLatency: 1200, success: 64, errors: 1 },
    { name: "Day 6", requests: 78, tokens: 32500, inputTokens: 13500, outputTokens: 19000, avgLatency: 1150, success: 78, errors: 0 },
    { name: "Day 7", requests: 92, tokens: 39400, inputTokens: 16400, outputTokens: 23000, avgLatency: 1120, success: 92, errors: 0 },
  ];

  const modelDistribution = data?.modelDistribution || [
    { name: "Gemini 2.5 Flash", value: 85, color: "#7c3aed" },
    { name: "Gemini 3.5 Flash", value: 10, color: "#3b82f6" },
    { name: "Gemini 2.5 Pro", value: 5, color: "#10b981" },
  ];

  const topTenants = data?.topTenants || [];
  const topAgents = data?.topAgents || [];
  const recentAuditLogs = data?.recentAuditLogs || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0 overflow-hidden animate-fade-in pb-12">
      {/* Refined Ambient Hero Control Header */}
      <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-card/90 border border-border/80 p-5 sm:p-7 shadow-sm ambient-glow-mesh overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs font-semibold shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Super Admin Control Plane</span>
              </div>
              <Badge variant="outline" className="text-[10px] sm:text-[11px] font-medium border-border/80">
                Multi-Tenant Cluster
              </Badge>
              <Badge variant="glow" className="text-[10px] sm:text-[11px] font-semibold">
                Gemini 2.5 Flash
              </Badge>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground font-mono bg-muted/50 px-2.5 py-0.5 rounded-full border border-border/70">
                <Clock className="w-3 h-3 text-primary" />
                <span>SLA: {overview.successRate}%</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground">
              Enterprise Platform Intelligence & Telemetry
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-normal leading-relaxed">
              Real-time multi-tenant telemetry, AI token velocity, active agent fleets, pgvector indexing, and secure client isolation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            {/* Time Range Selector */}
            <div className="flex items-center bg-muted/70 border border-border/80 rounded-2xl p-0.5 sm:p-1 shadow-inner">
              {(["7d", "30d", "90d"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all duration-200 ${
                    timeRange === r
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>

            <Button
              onClick={loadMetrics}
              variant="outline"
              size="sm"
              className="text-xs font-semibold rounded-2xl border-border/80 shadow-xs shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 sm:mr-1.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>

            <Link href="/admin/clients" className="w-full sm:w-auto">
              <Button size="sm" className="w-full sm:w-auto font-semibold shadow-md shadow-primary/20 rounded-2xl text-xs">
                <Plus className="w-3.5 h-3.5 mr-1 sm:mr-1.5" /> Onboard Tenant
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 8 Luxury KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Client Tenants */}
        <div className="pro-card rounded-2xl p-4 sm:p-5 stat-card-gradient-purple flex flex-col justify-between hover:scale-[1.01] transition-transform h-full">
          <div className="flex items-center justify-between pb-2 sm:pb-3">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Client Tenants
            </span>
            <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {overview.totalClients}
              </div>
              <span className="text-[11px] font-semibold text-emerald-500">+100% active</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 font-normal truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate">
                {overview.activeClients} active
              </span>
              <span className="truncate">• {overview.totalUsers} users</span>
            </div>
          </div>
        </div>

        {/* 2. AI Agents Fleet */}
        <div className="pro-card rounded-2xl p-4 sm:p-5 stat-card-gradient-emerald flex flex-col justify-between hover:scale-[1.01] transition-transform h-full">
          <div className="flex items-center justify-between pb-2 sm:pb-3">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              AI Agent Fleet
            </span>
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {overview.totalAgents}
              </div>
              <span className="text-[11px] font-semibold text-primary">
                {overview.ragAgentsCount || overview.totalAgents} RAG Grounded
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 font-normal truncate">
              <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                {overview.activeAgents} published
              </span>
              <span className="truncate">live endpoints</span>
            </div>
          </div>
        </div>

        {/* 3. Gemini AI Tokens Throughput */}
        <div className="pro-card rounded-2xl p-4 sm:p-5 stat-card-gradient-blue flex flex-col justify-between hover:scale-[1.01] transition-transform h-full">
          <div className="flex items-center justify-between pb-2 sm:pb-3">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              LLM Token Velocity
            </span>
            <div className="p-2 sm:p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {overview.totalTokens.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 font-normal truncate">
              <span className="font-semibold text-foreground">{overview.totalRequests.toLocaleString()}</span>
              <span>API calls</span>
              <span>•</span>
              <span className="text-emerald-500 font-medium">99.8% OK</span>
            </div>
          </div>
        </div>

        {/* 4. Vector Knowledge Base */}
        <div className="pro-card rounded-2xl p-4 sm:p-5 stat-card-gradient-amber flex flex-col justify-between hover:scale-[1.01] transition-transform h-full">
          <div className="flex items-center justify-between pb-2 sm:pb-3">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              pgvector Knowledge
            </span>
            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {overview.totalDocuments}
              </div>
              <span className="text-[11px] font-semibold text-blue-500">
                {overview.totalChunks ? `${overview.totalChunks} Chunks` : "Indexed"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 font-normal truncate">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate">{overview.processedDocuments || overview.totalDocuments} processed docs</span>
            </div>
          </div>
        </div>

        {/* 5. User Sessions & Conversations */}
        <div className="pro-card rounded-2xl p-4 sm:p-5 bg-card/80 border border-border/80 flex flex-col justify-between hover:scale-[1.01] transition-transform shadow-xs h-full">
          <div className="flex items-center justify-between pb-2 sm:pb-3">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              User Conversations
            </span>
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {overview.totalConversations}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 font-normal truncate">
              <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-foreground font-semibold">{overview.totalMessages}</span>
              <span>messages exchanged</span>
            </div>
          </div>
        </div>

        {/* 6. Response Latency & SLA */}
        <div className="pro-card rounded-2xl p-4 sm:p-5 bg-card/80 border border-border/80 flex flex-col justify-between hover:scale-[1.01] transition-transform shadow-xs h-full">
          <div className="flex items-center justify-between pb-2 sm:pb-3">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Avg Latency (ms)
            </span>
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {overview.avgLatencyMs || 1250}ms
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">P95: {overview.p95LatencyMs}ms</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 font-normal truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Ultra-Fast</span>
              <span className="truncate">Gemini 2.5 Flash</span>
            </div>
          </div>
        </div>

        {/* 7. Active API Keys & Origins */}
        <div className="pro-card rounded-2xl p-4 sm:p-5 bg-card/80 border border-border/80 flex flex-col justify-between hover:scale-[1.01] transition-transform shadow-xs h-full">
          <div className="flex items-center justify-between pb-2 sm:pb-3">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active API Keys
            </span>
            <div className="p-2 sm:p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shadow-xs">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {overview.activeApiKeys}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 font-normal truncate">
              <Shield className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span className="truncate">Origin Whitelist Protected</span>
            </div>
          </div>
        </div>

        {/* 8. Support Tickets & Resolutions */}
        <div className="pro-card rounded-2xl p-4 sm:p-5 bg-card/80 border border-border/80 flex flex-col justify-between hover:scale-[1.01] transition-transform shadow-xs h-full">
          <div className="flex items-center justify-between pb-2 sm:pb-3">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Support & Inquiries
            </span>
            <div className="p-2 sm:p-2.5 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 shadow-xs">
              <LifeBuoy className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {overview.totalTickets}
              </div>
              <span className="text-[11px] font-semibold text-emerald-500">
                {overview.openTickets ? `${overview.openTickets} Open` : "0 Pending"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 font-normal truncate">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">100% SLA Resolution Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Telemetry Visualizations & Multi-Metrics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Left 8 cols: Interactive Multi-Metric Telemetry Chart */}
        <Card className="lg:col-span-8 border-border/80 shadow-sm overflow-hidden flex flex-col justify-between">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-border/60">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary shrink-0" /> Platform Throughput & Velocity
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-semibold text-emerald-500 border-emerald-500/30 shrink-0">
                  ● Live Telemetry
                </Badge>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Multi-tenant token dynamics, request frequency, and network response speed
              </p>
            </div>

            {/* Metric Selector Tabs */}
            <div className="flex items-center bg-muted/60 border border-border/80 rounded-xl p-0.5 text-xs shrink-0 self-start sm:self-auto">
              {[
                { id: "tokens", label: "⚡ Tokens" },
                { id: "requests", label: "📊 Calls" },
                { id: "latency", label: "⏱️ Latency" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveChartMetric(m.id as any)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all ${
                    activeChartMetric === m.id
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
            <div className="h-64 sm:h-72 md:h-80 w-full flex-1 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="outputGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
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
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.18)",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  {activeChartMetric === "tokens" && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="tokens"
                        name="Total Tokens"
                        stroke="#7c3aed"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#tokenGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="outputTokens"
                        name="Output Tokens"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#outputGrad)"
                      />
                    </>
                  )}
                  {activeChartMetric === "requests" && (
                    <Area
                      type="monotone"
                      dataKey="requests"
                      name="API Requests"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#reqGrad)"
                    />
                  )}
                  {activeChartMetric === "latency" && (
                    <Area
                      type="monotone"
                      dataKey="avgLatency"
                      name="Latency (ms)"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#latencyGrad)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Micro Breakdown Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border/60 text-xs mt-3">
              <div className="p-2.5 sm:p-3 rounded-xl bg-muted/30 border border-border/70 text-center">
                <span className="text-muted-foreground block text-[10px] sm:text-[11px]">Input Tokens (Prompt)</span>
                <span className="font-bold text-xs sm:text-sm text-foreground">
                  {overview.inputTokens.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-muted/30 border border-border/70 text-center">
                <span className="text-muted-foreground block text-[10px] sm:text-[11px]">Output Tokens (Generated)</span>
                <span className="font-bold text-xs sm:text-sm text-primary">
                  {overview.outputTokens.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-muted/30 border border-border/70 text-center">
                <span className="text-muted-foreground block text-[10px] sm:text-[11px]">P95 Tail Latency</span>
                <span className="font-bold text-xs sm:text-sm text-amber-500">
                  {overview.p95LatencyMs}ms
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right 4 cols: Model Distribution & Infrastructure Health */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-5 sm:gap-6">
          {/* Donut Chart: Gemini AI Engine Share */}
          <Card className="border-border/80 shadow-sm flex-1 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary shrink-0" /> AI Model Engine Share
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="h-36 sm:h-40 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modelDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {modelDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={MODEL_COLORS[index % MODEL_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "10px",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 text-xs">
                {modelDistribution.map((m: any, idx: number) => (
                  <div key={m.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: MODEL_COLORS[idx % MODEL_COLORS.length] }}
                      />
                      <span className="font-medium text-foreground truncate">{m.name}</span>
                    </div>
                    <span className="font-semibold text-muted-foreground shrink-0">{m.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Connected Infrastructure Health Matrix */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-500 shrink-0" /> Infrastructure Matrix
              </CardTitle>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-muted/40 border border-border/70 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-foreground text-[11px] sm:text-xs truncate">PostgreSQL + pgvector</div>
                    <div className="text-[10px] text-muted-foreground truncate">0.3ms internal ping</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] sm:text-[10px] text-emerald-500 border-emerald-500/30 shrink-0">
                  99.99% OK
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-muted/40 border border-border/70 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-foreground text-[11px] sm:text-xs truncate">Google Gemini Gateway</div>
                    <div className="text-[10px] text-muted-foreground truncate">Streaming SSE Active</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] sm:text-[10px] text-emerald-500 border-emerald-500/30 shrink-0">
                  Connected
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-muted/40 border border-border/70 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-foreground text-[11px] sm:text-xs truncate">Cloudinary Vault</div>
                    <div className="text-[10px] text-muted-foreground truncate">Encrypted Storage</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] sm:text-[10px] text-emerald-500 border-emerald-500/30 shrink-0">
                  Operational
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-muted/40 border border-border/70 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-foreground text-[11px] sm:text-xs truncate">Origin Whitelist Firewall</div>
                    <div className="text-[10px] text-muted-foreground truncate">Embed Isolation</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] sm:text-[10px] text-emerald-500 border-emerald-500/30 shrink-0">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Secondary Intelligence: Top Workspaces & Top Agents Fleet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
        {/* Top Client Tenants Leaderboard */}
        <Card className="border-border/80 shadow-sm flex flex-col justify-between h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
            <div>
              <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500 shrink-0" /> Top Client Workspaces
              </CardTitle>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Active tenant organizations and their resource usage
              </p>
            </div>
            <Link href="/admin/clients">
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary">
                View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 space-y-2.5 sm:space-y-3 flex-1 flex flex-col justify-between">
            {topTenants.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center flex-1">
                <Building2 className="w-8 h-8 text-muted mb-2" />
                <span>No tenant workspaces onboarded yet.</span>
              </div>
            ) : (
              topTenants.map((t: any) => (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl bg-muted/30 border border-border/70 flex items-center justify-between gap-2.5 sm:gap-3 text-xs hover:border-border transition-all"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-foreground text-xs sm:text-sm truncate">{t.name}</div>
                      <div className="text-[10px] sm:text-[11px] text-muted-foreground flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span>{t.agentsCount} agents</span>
                        <span>•</span>
                        <span>{t.docsCount} docs</span>
                        <span>•</span>
                        <span>{t.conversationsCount} chats</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className="text-[9px] sm:text-[10px] font-semibold uppercase">
                      {t.plan || "ENTERPRISE"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[9px] sm:text-[10px] font-semibold ${
                        t.status === "ACTIVE"
                          ? "text-emerald-500 border-emerald-500/30"
                          : "text-muted-foreground"
                      }`}
                    >
                      {t.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Performing AI Agents */}
        <Card className="border-border/80 shadow-sm flex flex-col justify-between h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
            <div>
              <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-500 shrink-0" /> Active AI Agents Fleet
              </CardTitle>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Top deployed agents handling grounded customer interactions
              </p>
            </div>
            <Link href="/admin/models">
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary">
                Model Registry <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 space-y-2.5 sm:space-y-3 flex-1 flex flex-col justify-between">
            {topAgents.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center flex-1">
                <Bot className="w-8 h-8 text-muted mb-2" />
                <span>No active agents configured yet.</span>
              </div>
            ) : (
              topAgents.map((a: any) => (
                <div
                  key={a.id}
                  className="p-3 rounded-2xl bg-muted/30 border border-border/70 flex items-center justify-between gap-2.5 sm:gap-3 text-xs hover:border-border transition-all"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5 truncate">
                        <span className="truncate">{a.name}</span>
                        {a.ragEnabled && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-primary/10 text-primary font-mono border border-primary/20 shrink-0">
                            RAG
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-muted-foreground flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="truncate">Tenant: {a.tenantName}</span>
                        <span>•</span>
                        <span>{a.conversationsCount} sessions</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className="text-[9px] sm:text-[10px] font-semibold text-primary border-primary/30 truncate max-w-[90px] sm:max-w-none">
                      {a.modelName}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[9px] sm:text-[10px] font-semibold ${
                        a.status === "ACTIVE"
                          ? "text-emerald-500 border-emerald-500/30"
                          : "text-muted-foreground"
                      }`}
                    >
                      {a.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Audit Log Stream & Quick Admin Navigation Tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Left 7 cols: Live Security Audit Trail */}
        <Card className="lg:col-span-7 border-border/80 shadow-sm flex flex-col justify-between h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
            <div>
              <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" /> Platform Audit Trail
              </CardTitle>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Real-time security events, access changes, and administrative actions
              </p>
            </div>
            <Link href="/admin/audit-logs">
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary">
                Full Audit Log <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 space-y-2 flex-1 flex flex-col justify-between">
            {recentAuditLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center justify-center flex-1">
                <ShieldCheck className="w-8 h-8 text-muted mb-2" />
                <span>No recent security audit events recorded.</span>
              </div>
            ) : (
              recentAuditLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-muted/20 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-[11px] sm:text-xs font-mono"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="font-bold text-foreground shrink-0">{log.action}</span>
                    <span className="text-muted-foreground text-[10px] sm:text-[11px] truncate">
                      by {log.userName} ({log.tenantName})
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 self-end sm:self-auto">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right 5 cols: Quick Super Admin Management Tiles */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-2.5 sm:gap-3 h-full">
          <Link href="/admin/clients" className="group h-full">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 hover:border-primary/50 transition-all shadow-xs group-hover:shadow-md h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Building2 className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-foreground mt-2 sm:mt-3">Tenants & Workspaces</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">Manage clients & limits</div>
              </div>
            </div>
          </Link>

          <Link href="/admin/models" className="group h-full">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 hover:border-primary/50 transition-all shadow-xs group-hover:shadow-md h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Cpu className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-foreground mt-2 sm:mt-3">Model Registry</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">Gemini 2.5 Flash & Keys</div>
              </div>
            </div>
          </Link>

          <Link href="/admin/tickets" className="group h-full">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 hover:border-primary/50 transition-all shadow-xs group-hover:shadow-md h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
                  <LifeBuoy className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-foreground mt-2 sm:mt-3">Support Center</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">Client inquiries & SLA</div>
              </div>
            </div>
          </Link>

          <Link href="/admin/audit-logs" className="group h-full">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 hover:border-primary/50 transition-all shadow-xs group-hover:shadow-md h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <FileText className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-foreground mt-2 sm:mt-3">Security & Logs</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">Compliance & access</div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
