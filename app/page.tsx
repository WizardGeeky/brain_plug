"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  Shield,
  Layers,
  Zap,
  Lock,
  ArrowRight,
  Code2,
  Database,
  CloudUpload,
  CheckCircle2,
  MessageSquare,
  Globe,
  Sliders,
  Terminal,
  FileSpreadsheet,
  Headphones,
  Check,
  ChevronRight,
  ChevronDown,
  Cpu,
  Smartphone,
  Play,
  Copy,
  Menu,
  X,
  FileText,
  Activity,
  Send,
  Workflow,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand-logo";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"agent" | "rag" | "widget" | "security">("agent");
  const [selectedSnippet, setSelectedSnippet] = useState<"html" | "react" | "vue" | "shopify">("html");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Interactive Live Hero Simulator State
  const [simulatorInput, setSimulatorInput] = useState("");
  const [simulatorMessages, setSimulatorMessages] = useState<
    { role: "user" | "assistant"; text: string; sources?: string[]; latency?: string }[]
  >([
    {
      role: "assistant",
      text: "Hello! I am your AI assistant grounded in Brain Plug enterprise documentation. Ask me anything about multi-tenant agent orchestration or vector RAG!",
      sources: ["overview.pdf", "api-specs.docx"],
      latency: "340ms",
    },
  ]);
  const [isSimulating, setIsSimulating] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Ensure landing page is strictly non-themed and always renders with crisp light brand styling
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const handleSimulateChat = (preset?: string) => {
    const textToSend = preset || simulatorInput;
    if (!textToSend.trim() || isSimulating) return;

    setSimulatorMessages((prev) => [...prev, { role: "user", text: textToSend }]);
    setSimulatorInput("");
    setIsSimulating(true);

    setTimeout(() => {
      let reply = "Brain Plug provides full multi-tenant isolation, automated PostgreSQL pgvector indexing, and 1-line script embedding with zero CSS pollution.";
      let sources = ["architecture-whitepaper.pdf", "rag-grounding.xlsx"];

      if (textToSend.toLowerCase().includes("gemini")) {
        reply = "We integrate directly with Google Gemini 2.0 Flash and 1.5 Pro with streaming inference, database-configured API keys, and per-tenant rate metering.";
        sources = ["gemini-models-guide.pdf"];
      } else if (textToSend.toLowerCase().includes("embed") || textToSend.toLowerCase().includes("widget")) {
        reply = "Our chat widget runs inside an isolated Shadow DOM container. It expands to a smooth bottom-sheet on mobile devices and respects domain origin allowlists.";
        sources = ["widget-integration.md"];
      }

      setSimulatorMessages((prev) => [
        ...prev,
        { role: "assistant", text: reply, sources, latency: "380ms" },
      ]);
      setIsSimulating(false);
    }, 650);
  };

  const getSnippetCode = () => {
    switch (selectedSnippet) {
      case "html":
        return `<!-- Brain Plug AI Widget -->\n<script\n  src="https://app.brainplug.ai/widget.js"\n  data-agent-id="agent_9f83a7c4"\n  async\n></script>`;
      case "react":
        return `// Next.js / React Component\nimport Script from "next/script";\n\nexport default function Chatbot() {\n  return (\n    <Script\n      src="https://app.brainplug.ai/widget.js"\n      data-agent-id="agent_9f83a7c4"\n      strategy="lazyOnload"\n    />\n  );\n}`;
      case "vue":
        return `<!-- Vue 3 / Nuxt 3 -->\n<template>\n  <component :is="'script'"\n    src="https://app.brainplug.ai/widget.js"\n    data-agent-id="agent_9f83a7c4"\n    async\n  />\n</template>`;
      case "shopify":
        return `{% comment %} Shopify theme.liquid before </body> {% endcomment %}\n<script\n  src="https://app.brainplug.ai/widget.js"\n  data-agent-id="agent_9f83a7c4"\n  async\n></script>`;
    }
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(getSnippetCode());
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const faqs = [
    {
      q: "How do new clients onboard and register an organization workspace?",
      a: "Clients can immediately self-register a new organization workspace right from the Sign In / Register page with passwordless 6-digit OTP verification, or receive a direct onboarding invitation from a platform Super Admin.",
    },
    {
      q: "How does Brain Plug isolate client data across multiple tenants?",
      a: "Each organization workspace is strictly isolated in PostgreSQL with foreign-key tenant boundaries, encrypted credentials, and dedicated vector knowledge partitions so tenant data is never commingled.",
    },
    {
      q: "Does the AI train on my uploaded proprietary documents?",
      a: "No. Brain Plug uses strict retrieval-augmented generation (RAG). Your files are indexed into vector chunks solely for contextual grounding during inference and are never used to train or fine-tune public models.",
    },
    {
      q: "How easy is it to embed the AI agent into my existing website?",
      a: "Simply paste one <script> tag before the closing </body> tag of your site. The widget operates within an isolated Shadow DOM container with zero CSS conflicts on WordPress, Shopify, Webflow, React, and Vue.",
    },
    {
      q: "Can Super Admins control which Google Gemini models are available?",
      a: "Yes. Super Admins configure the master Gemini API key in the database vault and decide exactly which models (e.g. Gemini 2.0 Flash, Gemini 1.5 Pro) are published to clients, along with token metering rates.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#1E1B4B] flex flex-col selection:bg-purple-100 selection:text-purple-700 overflow-x-hidden">
      {/* ------------------------------------------------------------------ */}
      {/* 1. MOBILE-OPTIMIZED TOP NAVBAR                                     */}
      {/* ------------------------------------------------------------------ */}
      <header className="h-16 sm:h-20 border-b border-purple-100 bg-white/95 backdrop-blur-xl px-3 sm:px-8 flex items-center justify-between sticky top-0 z-50 shadow-xs">
        {/* Brand Logo with responsive sizing */}
        <div className="flex items-center min-w-0 shrink-0">
          <BrandLogo size="md" tagline="Enterprise AI Agent Infra" taglineClassName="hidden sm:block" href="/" variant="light" />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600">
          <a href="#features" className="hover:text-purple-700 transition-colors">
            Core Features
          </a>
          <a href="#models" className="hover:text-purple-700 transition-colors">
            Gemini Models
          </a>
          <a href="#workflow" className="hover:text-purple-700 transition-colors">
            How It Works
          </a>
          <a href="#faq" className="hover:text-purple-700 transition-colors">
            FAQ
          </a>
          <Link href="/docs" prefetch={true} className="text-purple-600 hover:text-purple-800 font-bold inline-flex items-center gap-1">
            <Code2 className="w-3.5 h-3.5" /> API Docs
          </Link>
        </nav>

        {/* Action Buttons (Desktop & Mobile Adaptive) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Sign In Outline Link Button */}
          <Link
            href="/login"
            prefetch={true}
            className="inline-flex border border-purple-200 bg-white hover:bg-purple-50 text-purple-700 font-semibold text-xs h-9 px-3.5 rounded-xl shadow-xs transition-colors items-center justify-center cursor-pointer"
          >
            Sign In
          </Link>

          {/* Tablet & Desktop: Register Workspace CTA */}
          <Link
            href="/login?tab=register"
            prefetch={true}
            className="hidden sm:inline-flex bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs h-9 px-4 shadow-md shadow-purple-500/20 rounded-xl items-center cursor-pointer transition-all shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 shrink-0" />
            <span>Register Workspace</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 hidden lg:inline" />
          </Link>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition-colors focus:outline-none cursor-pointer shrink-0"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-purple-700" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu (Animated Slide Down) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 sm:top-20 bg-white/98 backdrop-blur-2xl border-b border-purple-100 p-5 space-y-4 z-40 shadow-xl animate-in slide-in-from-top-3 duration-200">
          <nav className="flex flex-col space-y-2 text-sm font-semibold">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl hover:bg-purple-50 text-[#1E1B4B] transition-colors"
            >
              Core Features
            </a>
            <a
              href="#models"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl hover:bg-purple-50 text-[#1E1B4B] transition-colors"
            >
              Gemini Models Registry
            </a>
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl hover:bg-purple-50 text-[#1E1B4B] transition-colors"
            >
              How It Works
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl hover:bg-purple-50 text-[#1E1B4B] transition-colors"
            >
              FAQ
            </a>
            <Link
              href="/docs"
              prefetch={true}
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl hover:bg-purple-50 text-purple-700 flex items-center gap-2"
            >
              <Code2 className="w-4 h-4" /> API & Widget Docs
            </Link>
          </nav>

          <div className="pt-3 border-t border-purple-100 flex flex-col gap-2">
            <Link
              href="/login"
              prefetch={true}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 font-semibold text-xs h-10 rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer"
            >
              Sign In to Workspace
            </Link>
            <Link
              href="/login?tab=register"
              prefetch={true}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs h-10 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Register Workspace (Free)</span>
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col items-center">
        {/* ------------------------------------------------------------------ */}
        {/* 2. HERO SECTION WITH ANIMATED BADGES & LIVE SIMULATOR               */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-20 pb-14 sm:pb-24 flex flex-col items-center text-center overflow-hidden">
          {/* Lavender Ambient Glow Orbs */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[300px] sm:w-[650px] h-[300px] sm:h-[450px] bg-gradient-to-tr from-purple-200/50 via-indigo-100/40 to-pink-100/30 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />

          {/* Floating Feature Pill Left (Desktop) */}
          <div className="hidden xl:flex items-center gap-2 absolute top-24 left-12 p-3 rounded-2xl bg-white/90 border border-purple-100 shadow-lg shadow-purple-900/5 text-xs font-semibold text-purple-900 animate-float pointer-events-none select-none">
            <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
              ⚡
            </div>
            <span>&lt;380ms Sub-Second Streaming</span>
          </div>

          {/* Floating Feature Pill Right (Desktop) */}
          <div className="hidden xl:flex items-center gap-2 absolute top-28 right-12 p-3 rounded-2xl bg-white/90 border border-purple-100 shadow-lg shadow-purple-900/5 text-xs font-semibold text-purple-900 animate-float-reverse pointer-events-none select-none">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              📚
            </div>
            <span>100% Vector RAG Grounded</span>
          </div>

          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 text-purple-800 text-[11px] sm:text-xs font-semibold mb-6 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="truncate">Multi-Tenant AI Agent Platform • Gemini 2.0</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0 ml-0.5" />
          </div>

          {/* Hero Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl text-[#1E1B4B] leading-[1.1] mb-5 sm:mb-6">
            Train, Ground & Embed{" "}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
              Intelligent AI Agents
            </span>{" "}
            Anywhere.
          </h1>

          <p className="text-xs sm:text-base md:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed mb-8 sm:mb-10 px-2">
            Enterprise infrastructure for Google Gemini orchestration, PostgreSQL vector RAG, passwordless multi-tenant RBAC, and one-script Shadow DOM chatbots.
          </p>

          {/* Responsive CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto mb-12 sm:mb-16 px-4">
            <Link
              href="/login?tab=register"
              prefetch={true}
              className="w-full sm:w-auto h-12 sm:h-14 px-8 text-sm sm:text-base font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xl shadow-purple-500/25 rounded-2xl inline-flex items-center justify-center cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Register Workspace Free <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              href="/login"
              prefetch={true}
              className="w-full sm:w-auto h-12 sm:h-14 px-7 text-sm sm:text-base font-semibold bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 shadow-xs rounded-2xl inline-flex items-center justify-center cursor-pointer transition-colors"
            >
              Sign In to Console
            </Link>
            <Link
              href="/docs"
              prefetch={true}
              className="w-full sm:w-auto h-12 sm:h-14 px-6 text-sm sm:text-base font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs rounded-2xl inline-flex items-center justify-center cursor-pointer transition-colors"
            >
              <Code2 className="w-4 h-4 mr-2 text-purple-600" /> Widget Docs
            </Link>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* MOBILE RESPONSIVE HERO SIMULATOR CONSOLE                         */}
          {/* ---------------------------------------------------------------- */}
          <div className="w-full max-w-4xl relative animate-float">
            <div className="rounded-3xl border border-purple-200/90 bg-white/95 backdrop-blur-2xl shadow-2xl shadow-purple-900/10 p-4 sm:p-6 text-left relative overflow-hidden">
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-purple-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-[#1E1B4B] truncate">
                        Brain Plug Live Assistant
                      </span>
                      <span className="px-2 py-0.2 rounded-full bg-purple-100 text-purple-800 text-[9px] font-bold shrink-0">
                        Gemini 2.0
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono truncate block">
                      rag_knowledge_base.vector • 100% Grounded
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-purple-700 shrink-0">
                  <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  <span>Interactive Simulator</span>
                </div>
              </div>

              {/* Chat Stream Window */}
              <div className="h-56 sm:h-64 overflow-y-auto space-y-3 p-1 custom-scrollbar text-xs">
                {simulatorMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
                  >
                    <div
                      className={`max-w-[88%] sm:max-w-[82%] p-3 sm:p-3.5 rounded-2xl shadow-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-purple-600 text-white rounded-br-xs font-medium"
                          : "bg-purple-50/90 text-[#1E1B4B] border border-purple-100 rounded-bl-xs"
                      }`}
                    >
                      <div className="text-xs">{msg.text}</div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-purple-200/60 text-[10px] space-y-1">
                          <span className="font-semibold text-purple-700">📚 Grounded Citations:</span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {msg.sources.map((s, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-white border border-purple-200 text-purple-800 font-mono text-[9px]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {msg.latency && (
                        <div className="text-[9px] opacity-60 text-right mt-1.5 font-mono">
                          Latency: {msg.latency}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isSimulating && (
                  <div className="flex justify-start">
                    <div className="p-2.5 rounded-2xl bg-purple-50 border border-purple-100 text-[#1E1B4B] text-xs flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-purple-600 animate-ping" />
                      <span className="font-mono text-[10px] text-purple-700">Streaming grounded answer...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sample Prompt Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-purple-100 text-[10px] sm:text-[11px]">
                <span className="text-slate-500 font-medium hidden sm:inline">Try prompt:</span>
                <button
                  onClick={() => handleSimulateChat("How do I embed the chat widget on my website?")}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-medium transition-colors"
                >
                  "How to embed widget?"
                </button>
                <button
                  onClick={() => handleSimulateChat("Which Gemini models are supported in the registry?")}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-medium transition-colors"
                >
                  "Gemini models?"
                </button>
              </div>

              {/* Interactive Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSimulateChat();
                }}
                className="mt-3 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Type a test query to experience instant AI streaming..."
                  value={simulatorInput}
                  onChange={(e) => setSimulatorInput(e.target.value)}
                  className="flex-1 bg-white border border-purple-200 rounded-xl px-3.5 py-2.5 text-xs text-[#1E1B4B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 min-w-0"
                />
                <Button
                  type="submit"
                  disabled={isSimulating || !simulatorInput.trim()}
                  size="sm"
                  className="h-9 px-3.5 bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 3. LAVENDER TINTED 4-STAT SLA METRICS BAR                          */}
        {/* ------------------------------------------------------------------ */}
        <section className="w-full border-y border-purple-100 bg-[#FBF9FF] py-8 sm:py-10 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="p-3 sm:p-4 rounded-2xl bg-white/70 border border-purple-100/80 shadow-xs">
              <div className="text-2xl sm:text-4xl font-black text-[#1E1B4B] tracking-tight">99.99%</div>
              <div className="text-[10px] sm:text-xs text-purple-700 font-bold uppercase tracking-wider mt-1">Uptime SLA</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-white/70 border border-purple-100/80 shadow-xs">
              <div className="text-2xl sm:text-4xl font-black text-purple-600 tracking-tight">&lt;400ms</div>
              <div className="text-[10px] sm:text-xs text-purple-700 font-bold uppercase tracking-wider mt-1">Streaming Latency</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-white/70 border border-purple-100/80 shadow-xs">
              <div className="text-2xl sm:text-4xl font-black text-[#1E1B4B] tracking-tight">100%</div>
              <div className="text-[10px] sm:text-xs text-purple-700 font-bold uppercase tracking-wider mt-1">Tenant Isolation</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-white/70 border border-purple-100/80 shadow-xs">
              <div className="text-2xl sm:text-4xl font-black text-[#1E1B4B] tracking-tight">AES-256</div>
              <div className="text-[10px] sm:text-xs text-purple-700 font-bold uppercase tracking-wider mt-1">Vault Encryption</div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 4. PURE WHITE & LAVENDER INTERACTIVE FEATURE TABS                  */}
        {/* ------------------------------------------------------------------ */}
        <section id="features" className="w-full max-w-6xl px-4 sm:px-6 py-14 sm:py-24">
          <div className="text-center space-y-3 mb-8 sm:mb-12">
            <span className="px-3.5 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold inline-block">
              Platform Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#1E1B4B] tracking-tight">
              Built for Modern Enterprise AI Operations
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed px-2">
              Explore the four foundational pillars that power Brain Plug's multi-tenant AI ecosystem.
            </p>
          </div>

          {/* Interactive Feature Tabs (Touch-Scrollable on Mobile) */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 sm:pb-0 sm:justify-center mb-6 sm:mb-8 px-1">
            {[
              { id: "agent", label: "AI Agent Studio", icon: Bot },
              { id: "rag", label: "Multi-Format RAG", icon: Database },
              { id: "widget", label: "1-Script Widget", icon: Code2 },
              { id: "security", label: "Security & RBAC", icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    activeTab === tab.id
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20 scale-[1.02]"
                      : "bg-purple-50/80 text-purple-800 hover:bg-purple-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Display */}
          <div className="rounded-3xl border border-purple-100 bg-white p-5 sm:p-10 shadow-lg shadow-purple-900/5 transition-all animate-fade-in">
            {activeTab === "agent" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center text-left">
                <div className="space-y-4">
                  <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold inline-block">
                    Persona Engineering
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#1E1B4B]">
                    Custom AI Agents with Dedicated System Prompts
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Define agent identities, response tones, guardrails, and temperature parameters. Assign each agent to specific knowledge documents and manage independent API keys.
                  </p>
                  <div className="space-y-2 text-xs font-medium">
                    <div className="flex items-center gap-2 text-[#1E1B4B]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Customizable persona instructions & prompt prefixes</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#1E1B4B]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Individual agent API keys with revocation controls</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#1E1B4B]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Real-time testing console with token metering</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-3 font-mono text-xs overflow-hidden">
                  <div className="flex justify-between text-purple-700 text-[10px] pb-2 border-b border-purple-200/60">
                    <span>AGENT_CONFIG_PREVIEW.JSON</span>
                    <span className="text-emerald-600 font-bold">LIVE</span>
                  </div>
                  <pre className="text-[#1E1B4B] leading-relaxed overflow-x-auto text-[10px] sm:text-[11px]">
{`{
  "name": "Customer Success AI",
  "model": "gemini-2.0-flash",
  "temperature": 0.4,
  "ragDocuments": 14,
  "streaming": true,
  "widgetAllowedOrigins": ["https://acme.com"]
}`}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === "rag" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center text-left">
                <div className="space-y-4">
                  <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold inline-block">
                    Anti-Hallucination Grounding
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#1E1B4B]">
                    Vector Knowledge Ingestion from PDF, Word & Excel
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Upload documents seamlessly to Cloudinary storage. Brain Plug extracts, cleans, chunks, and indexes text into high-dimensional vector embeddings in PostgreSQL.
                  </p>
                  <div className="space-y-2 text-xs font-medium">
                    <div className="flex items-center gap-2 text-[#1E1B4B]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Full support for PDF, DOCX, XLSX, and CSV</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#1E1B4B]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Source citations returned with similarity percentages</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2.5 text-xs">
                  <div className="font-bold text-[#1E1B4B] mb-1">Supported Knowledge Types:</div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-purple-100">
                    <span className="flex items-center gap-2 font-medium">📄 Product Manuals (PDF)</span>
                    <span className="text-xs text-emerald-600 font-bold">Vector Indexed</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-purple-100">
                    <span className="flex items-center gap-2 font-medium">📊 Price Sheets (Excel / CSV)</span>
                    <span className="text-xs text-emerald-600 font-bold">Vector Indexed</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-purple-100">
                    <span className="flex items-center gap-2 font-medium">📝 Internal SOPs (DOCX)</span>
                    <span className="text-xs text-emerald-600 font-bold">Vector Indexed</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "widget" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center text-left">
                <div className="space-y-4">
                  <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold inline-block">
                    Zero CSS Conflicts
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#1E1B4B]">
                    One-Script Embed on Any Web Platform
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Deploy your chatbot instantly on WordPress, Shopify, Next.js, React, or static HTML. Custom branding, avatar icons, launcher buttons, and mobile bottom-sheet behavior.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {(["html", "react", "vue", "shopify"] as const).map((fw) => (
                      <button
                        key={fw}
                        onClick={() => setSelectedSnippet(fw)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          selectedSnippet === fw
                            ? "bg-purple-600 text-white shadow-xs"
                            : "bg-purple-50 text-purple-800 hover:bg-purple-100"
                        }`}
                      >
                        {fw.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#1E1B4B] text-purple-100 font-mono text-xs border border-purple-900 space-y-3 shadow-md">
                  <pre className="overflow-x-auto text-[10px] sm:text-[11px] leading-relaxed">{getSnippetCode()}</pre>
                  <Button
                    onClick={copySnippet}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    {copiedSnippet ? "Copied to Clipboard!" : "Copy Embed Code"}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center text-left">
                <div className="space-y-4">
                  <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold inline-block">
                    Security Vault
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#1E1B4B]">
                    AES-256-GCM Encryption & Granular RBAC
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Super Admin, Client Admin, and Client User roles with fine-grained API permission checks, real client IP normalization, and immutable audit logs.
                  </p>
                  <div className="space-y-2 text-xs font-medium">
                    <div className="flex items-center gap-2 text-[#1E1B4B]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Passwordless 6-digit OTP verification via Nodemailer</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#1E1B4B]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Real client IP extraction across proxies and Cloudflare</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-white border border-purple-100 flex justify-between">
                    <span className="font-bold text-[#1E1B4B]">SUPER_ADMIN</span>
                    <span className="text-purple-600 font-bold">FULL PLATFORM</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-purple-100 flex justify-between">
                    <span className="font-bold text-[#1E1B4B]">CLIENT_ADMIN</span>
                    <span className="text-indigo-600 font-bold">TENANT WORKSPACE</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-purple-100 flex justify-between">
                    <span className="font-bold text-[#1E1B4B]">CLIENT_USER</span>
                    <span className="text-slate-500 font-bold">TEST & VIEW ONLY</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 5. PUBLISHED GEMINI MODELS REGISTRY                                */}
        {/* ------------------------------------------------------------------ */}
        <section id="models" className="w-full bg-[#FBF9FF] py-14 sm:py-24 px-4 sm:px-6 border-y border-purple-100">
          <div className="max-w-6xl mx-auto text-center space-y-3 mb-8 sm:mb-12">
            <span className="px-3.5 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold inline-block">
              Model Registry
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#1E1B4B] tracking-tight">
              Powered by Google Gemini Large Language Models
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed px-2">
              Super Admins configure Gemini provider keys in the database. Clients pick from approved models.
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 text-left">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Ultra Fast
                </span>
                <h3 className="text-lg font-bold text-[#1E1B4B] mt-3">Gemini 2.0 Flash</h3>
                <div className="text-xs font-mono text-purple-600 font-bold mt-0.5">gemini-2.0-flash</div>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  Next-generation multimodal model optimized for sub-second streaming inference and customer chatbot responsiveness.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-purple-100 text-xs font-mono text-slate-500 flex justify-between">
                <span>Output Limit</span>
                <span className="font-bold text-[#1E1B4B]">8,192 tokens</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                  Deep Reasoning
                </span>
                <h3 className="text-lg font-bold text-[#1E1B4B] mt-3">Gemini 1.5 Pro</h3>
                <div className="text-xs font-mono text-purple-600 font-bold mt-0.5">gemini-1.5-pro</div>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  Deep contextual reasoning across vast knowledge bases with extended token windows and precise instruction following.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-purple-100 text-xs font-mono text-slate-500 flex justify-between">
                <span>Output Limit</span>
                <span className="font-bold text-[#1E1B4B]">8,192 tokens</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                  Cost Efficient
                </span>
                <h3 className="text-lg font-bold text-[#1E1B4B] mt-3">Gemini 1.5 Flash</h3>
                <div className="text-xs font-mono text-purple-600 font-bold mt-0.5">gemini-1.5-flash</div>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  High-frequency production model for general inquiries, FAQs, and ticket classification.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-purple-100 text-xs font-mono text-slate-500 flex justify-between">
                <span>Output Limit</span>
                <span className="font-bold text-[#1E1B4B]">8,192 tokens</span>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 6. THREE-STEP WORKFLOW LIFECYCLE                                   */}
        {/* ------------------------------------------------------------------ */}
        <section id="workflow" className="w-full max-w-6xl px-4 sm:px-6 py-14 sm:py-24 text-center">
          <span className="px-3.5 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold mb-3 inline-block">
            Workflow Lifecycle
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#1E1B4B] tracking-tight mb-3">
            How Brain Plug Operates
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mb-10 sm:mb-14 px-2">
            From tenant provisioning to customer chat interaction in under three minutes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 text-left">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-purple-100 shadow-sm relative">
              <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 font-black flex items-center justify-center mb-4 text-base border border-purple-200">
                1
              </div>
              <h4 className="font-bold text-base text-[#1E1B4B] mb-1.5">Create & Style Agent</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose an approved Gemini model, configure persona guidelines, and customize widget branding colors.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-purple-100 shadow-sm relative">
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center mb-4 text-base border border-indigo-200">
                2
              </div>
              <h4 className="font-bold text-base text-[#1E1B4B] mb-1.5">Ingest Knowledge (RAG)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload PDFs, Word docs, Excel files, and CSVs. Text is split and stored in PostgreSQL pgvector.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-purple-100 shadow-sm relative">
              <div className="w-11 h-11 rounded-2xl bg-fuchsia-100 text-fuchsia-700 font-black flex items-center justify-center mb-4 text-base border border-fuchsia-200">
                3
              </div>
              <h4 className="font-bold text-base text-[#1E1B4B] mb-1.5">Embed & Launch</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add the 1-line widget script to your site. Users interact in real-time with grounded citations.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 7. FREQUENTLY ASKED QUESTIONS (FAQ)                                */}
        {/* ------------------------------------------------------------------ */}
        <section id="faq" className="w-full max-w-4xl px-4 sm:px-6 py-14 sm:py-20 border-t border-purple-100">
          <div className="text-center space-y-2 mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Everything you need to know about enterprise agent deployment.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-purple-100 bg-white shadow-xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-[#1E1B4B] hover:bg-purple-50/50 transition-colors"
                  >
                    <span className="pr-2">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180 text-purple-600" : "text-slate-400"}`} />
                  </button>
                  {isOpen && (
                    <div className="p-4 sm:p-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-purple-50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 8. LAVENDER GRADIENT CALL TO ACTION BANNER                          */}
        {/* ------------------------------------------------------------------ */}
        <section className="w-full max-w-6xl px-4 sm:px-6 pb-16 sm:pb-20">
          <div className="rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 p-7 sm:p-14 text-white text-center shadow-2xl shadow-purple-900/20 relative overflow-hidden">
            <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Ready to deploy your enterprise AI agent platform?
              </h3>
              <p className="text-xs sm:text-sm text-purple-100 leading-relaxed font-normal">
                Experience seamless multi-tenant RBAC, Google Gemini orchestration, and instantaneous web widget embeds.
              </p>
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/login?tab=register"
                  prefetch={true}
                  className="w-full sm:w-auto h-12 sm:h-14 px-8 bg-white text-purple-900 hover:bg-purple-50 font-bold shadow-md rounded-2xl inline-flex items-center justify-center cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 mr-1.5 text-purple-600" /> Register Free Workspace <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
                <Link
                  href="/login"
                  prefetch={true}
                  className="w-full sm:w-auto h-12 sm:h-14 px-7 border border-white/60 text-white hover:bg-white/10 font-bold rounded-2xl inline-flex items-center justify-center cursor-pointer transition-colors"
                >
                  Sign In to Console
                </Link>
                <Link
                  href="/docs"
                  prefetch={true}
                  className="w-full sm:w-auto h-12 sm:h-14 px-6 border border-white/30 text-white hover:bg-white/10 font-medium rounded-2xl inline-flex items-center justify-center cursor-pointer transition-colors"
                >
                  Explore API Docs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* 9. PURE WHITE & LAVENDER FOOTER                                    */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t border-purple-100 py-10 sm:py-12 px-4 sm:px-8 bg-[#FBF9FF]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-left text-xs">
          <div className="space-y-3">
            <BrandLogo size="md" tagline="Enterprise AI Agent Infra" href="/" variant="light" />
            <p className="text-slate-500 text-xs leading-relaxed">
              Multi-Tenant AI Agent SaaS Platform with vector RAG, Google Gemini orchestration, and embeddable chat widgets.
            </p>
          </div>

          <div className="space-y-2.5">
            <h5 className="font-bold text-[#1E1B4B] uppercase tracking-wider text-[11px]">Product</h5>
            <ul className="space-y-2 text-slate-600">
              <li><Link href="/docs" prefetch={true} className="hover:text-purple-700 transition-colors">API Documentation</Link></li>
              <li><Link href="/docs" prefetch={true} className="hover:text-purple-700 transition-colors">Widget Integration</Link></li>
              <li><Link href="/login" prefetch={true} className="hover:text-purple-700 transition-colors">Gemini Model Registry</Link></li>
              <li><Link href="/login" prefetch={true} className="hover:text-purple-700 transition-colors">Knowledge Base RAG</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h5 className="font-bold text-[#1E1B4B] uppercase tracking-wider text-[11px]">Control Center</h5>
            <ul className="space-y-2 text-slate-600">
              <li><Link href="/login?tab=register" prefetch={true} className="text-purple-700 font-bold hover:underline">Register Workspace (Open)</Link></li>
              <li><Link href="/login" prefetch={true} className="hover:text-purple-700 transition-colors">Sign In (Passwordless)</Link></li>
              <li><Link href="/login" prefetch={true} className="hover:text-purple-700 transition-colors">Super Admin Dashboard</Link></li>
              <li><Link href="/login" prefetch={true} className="hover:text-purple-700 transition-colors">Client Workspace</Link></li>
              <li><Link href="/login" prefetch={true} className="hover:text-purple-700 transition-colors">Support Ticketing</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h5 className="font-bold text-[#1E1B4B] uppercase tracking-wider text-[11px]">Security Standards</h5>
            <ul className="space-y-2 text-slate-600">
              <li><span className="text-purple-700 font-semibold">AES-256-GCM Encrypted</span></li>
              <li><span className="text-slate-500">Tenant Isolated DB</span></li>
              <li><span className="text-slate-500">Zero AI Training on Data</span></li>
              <li><span className="text-slate-500">Granular RBAC</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 border-t border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>&copy; {new Date().getFullYear()} Brain Plug Inc. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <Link href="/docs" prefetch={true} className="hover:text-purple-700">Developer Hub</Link>
            <Link href="/login" prefetch={true} className="hover:text-purple-700">Admin Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
