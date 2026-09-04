"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  Cpu,
  MessageSquare,
  Clock,
  Zap,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Database,
  Layers,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/analytics?days=${days}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  const overview = data?.overview || {
    totalRequests: 0,
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    avgLatencyMs: 0,
    activeApiKeys: 0,
  };

  const tokenBreakdown = [
    { name: "Input Prompt Tokens", value: overview.inputTokens, fill: "hsl(var(--primary))" },
    { name: "Output Generated Tokens", value: overview.outputTokens, fill: "#06b6d4" },
  ];

  // Group events by day/hour dynamically from real DB events
  const rawEvents: any[] = data?.events || [];
  const eventTimeline = React.useMemo(() => {
    if (!rawEvents.length) {
      return [
        { name: "Day 1", requests: 0, tokens: 0 },
        { name: "Day 2", requests: 0, tokens: 0 },
        { name: "Day 3", requests: 0, tokens: 0 },
        { name: "Day 4", requests: 0, tokens: 0 },
      ];
    }
    const grouped: Record<string, { requests: number; tokens: number }> = {};
    for (const ev of rawEvents) {
      const d = new Date(ev.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!grouped[d]) grouped[d] = { requests: 0, tokens: 0 };
      grouped[d].requests += 1;
      grouped[d].tokens += (ev.inputTokens || 0) + (ev.outputTokens || 0);
    }
    return Object.entries(grouped).map(([name, val]) => ({
      name,
      requests: val.requests,
      tokens: val.tokens,
    }));
  }, [rawEvents]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Ambient Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-card/90 border border-border/80 p-6 sm:p-8 shadow-sm ambient-glow-mesh overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Telemetry & Consumption Metrics
              </span>
              <Badge variant="glow" className="text-[10px] font-semibold">
                PostgreSQL Live Telemetry
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Platform Analytics & Telemetry
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-normal leading-relaxed">
              Real-time multi-tenant token consumption, inference latency histograms, and API call velocities.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex bg-muted/60 border border-border/80 rounded-2xl p-1 shadow-inner">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    days === d
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Last {d}D
                </button>
              ))}
            </div>

            <Button
              onClick={loadAnalytics}
              variant="outline"
              size="sm"
              className="h-10 px-3 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Luxury KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="pro-card rounded-2xl p-5 stat-card-gradient-purple flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Invocations
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              {overview.totalRequests.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1.5 font-normal">
              Across all tenant workspaces
            </div>
          </div>
        </div>

        <div className="pro-card rounded-2xl p-5 stat-card-gradient-emerald flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Average Latency
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              {overview.avgLatencyMs || 0} <span className="text-base font-medium">ms</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1.5 font-normal">
              End-to-end streaming response time
            </div>
          </div>
        </div>

        <div className="pro-card rounded-2xl p-5 stat-card-gradient-blue flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total AI Tokens
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              {overview.totalTokens.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1.5 font-normal">
              Input + output Gemini tokens
            </div>
          </div>
        </div>

        <div className="pro-card rounded-2xl p-5 stat-card-gradient-amber flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active API Keys
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              {overview.activeApiKeys}
            </div>
            <div className="text-xs text-muted-foreground mt-1.5 font-normal">
              Deployed widget endpoints
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Breakdown Bar Chart */}
        <Card className="lg:col-span-2 border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Token Breakdown (Input vs Output)</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Comparison between user prompt tokens and LLM generation tokens
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold">
                Dynamic Telemetry
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tokenBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "14px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown Details Card */}
        <Card className="border-border/80 shadow-sm flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold">Token Distribution</CardTitle>
            <p className="text-xs text-muted-foreground">Granular token consumption distribution</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/70">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Input Prompt Tokens</span>
                <span className="font-bold text-foreground">{overview.inputTokens.toLocaleString()}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{
                    width: `${overview.totalTokens ? (overview.inputTokens / overview.totalTokens) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/70">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Output Response Tokens</span>
                <span className="font-bold text-foreground">{overview.outputTokens.toLocaleString()}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-cyan-500 h-2 rounded-full"
                  style={{
                    width: `${overview.totalTokens ? (overview.outputTokens / overview.totalTokens) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
              ⚡ <strong>100% PostgreSQL Telemetry</strong>: Usage events recorded directly per chat completion.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Velocity Timeline */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-bold">Daily Request Velocity</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daily volume of AI requests recorded in the last {days} days
            </p>
          </div>
          <Badge variant="glow" className="text-[10px] font-semibold">
            {eventTimeline.length} Timepoints
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="h-60 sm:h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={eventTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsEventGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
                <XAxis dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "14px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#analyticsEventGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
