"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Terminal,
  Bot,
  Globe,
  Copy,
  Check,
  Shield,
  Layers,
  Sparkles,
  Key,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Smartphone,
  Cpu,
  Database,
  Headphones,
  CheckCircle2,
  FileCode,
  Layout,
  Menu,
  X,
  ChevronRight,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand-logo";

type DocSection =
  | "getting-started"
  | "widget-overview"
  | "widget-html"
  | "widget-react"
  | "widget-vue"
  | "widget-cms"
  | "widget-security"
  | "api-chat"
  | "api-documents"
  | "api-tickets"
  | "api-me";

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState<DocSection>("widget-overview");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeCodeLang, setActiveCodeLang] = useState<"html" | "typescript" | "curl" | "python">("html");

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const navItems = [
    {
      group: "1. Overview & Setup",
      items: [
        { id: "getting-started", label: "Getting Started & Auth", icon: Key },
      ],
    },
    {
      group: "2. Web Widget Integration",
      items: [
        { id: "widget-overview", label: "Widget Architecture", icon: Bot },
        { id: "widget-html", label: "Single-Script HTML Embed", icon: Code2 },
        { id: "widget-react", label: "React / Next.js Integration", icon: FileCode },
        { id: "widget-vue", label: "Vue / Nuxt Integration", icon: Layers },
        { id: "widget-cms", label: "WordPress & Shopify", icon: Globe },
        { id: "widget-security", label: "Domain Security & Allowlist", icon: Shield },
      ],
    },
    {
      group: "3. Backend REST & SSE APIs",
      items: [
        { id: "api-chat", label: "POST /api/v1/chat (SSE Stream)", icon: Terminal },
        { id: "api-documents", label: "POST /api/v1/agents/{id}/docs", icon: Database },
        { id: "api-tickets", label: "POST /api/v1/tickets (CR)", icon: Headphones },
        { id: "api-me", label: "GET /api/v1/me (User Context)", icon: Cpu },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-purple-500/20 selection:text-purple-600">
      {/* Top Navigation Header */}
      <header className="h-16 border-b border-purple-100 dark:border-purple-900/40 bg-card/70 backdrop-blur-xl px-3 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl border border-purple-200 dark:border-purple-900/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-foreground"
            aria-label="Toggle Navigation"
          >
            {isMobileSidebarOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          <BrandLogo size="md" tagline="AI Agent Infra" href="/" />
          <Badge variant="outline" className="hidden sm:inline-flex text-[10px] ml-2 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/60">
            Developer Hub v1.0
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-semibold">
              Home
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm" className="h-8 sm:h-9 px-3 sm:px-4 text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
              <span>Launch<span className="hidden sm:inline"> Platform</span></span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 hidden sm:inline" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Documentation Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar Navigation (Desktop Sticky + Mobile Drawer) */}
        <aside
          className={`fixed inset-y-16 left-0 z-30 w-72 bg-card/95 backdrop-blur-xl border-r border-purple-100 dark:border-purple-900/40 p-4 overflow-y-auto transition-transform lg:translate-x-0 lg:static lg:h-[calc(100vh-4rem)] shrink-0 ${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="space-y-6">
            {navItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  {group.group}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id as DocSection);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                        isActive
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-purple-50 dark:hover:bg-purple-950/40"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-purple-600 dark:text-purple-400"}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 mt-6 text-xs">
            <div className="font-bold text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Need Help?</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Create an automated support ticket in your client workspace under Customer Relations.
            </p>
          </div>
        </aside>

        {/* Backdrop for Mobile Sidebar */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 lg:hidden"
          />
        )}

        {/* Right Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10 max-w-4xl">
          {/* ------------------------------------------------------------- */}
          {/* SECTION: GETTING STARTED                                      */}
          {/* ------------------------------------------------------------- */}
          {activeSection === "getting-started" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <Badge variant="outline" className="text-purple-600 border-purple-200 dark:border-purple-800 text-[10px] mb-2">
                  Authentication & Setup
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Getting Started with Brain Plug API
                </h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Brain Plug provides developer-friendly REST and SSE streaming endpoints along with an embeddable chat widget script. All backend API requests require authentication.
                </p>
              </div>

              {/* Authentication Guide Card */}
              <div className="p-6 rounded-2xl bg-card border border-purple-100 dark:border-purple-900/40 shadow-sm space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-600" /> API Key Authentication
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To authenticate server-to-server API calls or custom frontend integrations, pass your generated API Key in the <code className="text-purple-600 dark:text-purple-400 font-mono">Authorization</code> HTTP header:
                </p>

                <div className="relative rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto">
                  <code>Authorization: Bearer bp_live_9f83a7c41b802e96d01a3c</code>
                  <button
                    onClick={() => handleCopy("auth-header", "Authorization: Bearer bp_live_9f83a7c41b802e96d01a3c")}
                    className="absolute right-3 top-3 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  >
                    {copiedId === "auth-header" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="text-xs text-muted-foreground">
                  <strong>Generating API Keys:</strong> In your Client Workspace, navigate to <code className="text-purple-600 font-mono">/client/agents/[id]/api-keys</code> and click <em>Create API Key</em>.
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SECTION: WIDGET ARCHITECTURE OVERVIEW                         */}
          {/* ------------------------------------------------------------- */}
          {activeSection === "widget-overview" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <Badge variant="outline" className="text-purple-600 border-purple-200 dark:border-purple-800 text-[10px] mb-2">
                  Chatbot Widget
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  One-Script Web Chat Widget Architecture
                </h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Brain Plug features a standalone, zero-dependency floating chat widget that can be embedded on any external website, Shopify store, WordPress site, or Single Page App (React, Vue, Angular) with a single line of JavaScript.
                </p>
              </div>

              {/* Key Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-card border border-purple-100 dark:border-purple-900/40">
                  <Shield className="w-5 h-5 text-purple-600 mb-2" />
                  <h4 className="font-bold text-sm mb-1">Shadow DOM Isolation</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The widget CSS and DOM structure are rendered inside an isolated Shadow Root, guaranteeing zero style conflicts with host stylesheets.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-purple-100 dark:border-purple-900/40">
                  <Smartphone className="w-5 h-5 text-purple-600 mb-2" />
                  <h4 className="font-bold text-sm mb-1">Mobile Responsive Bottom-Sheet</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    On smartphones, the widget automatically transforms into an intuitive, touch-friendly bottom sheet covering the screen gracefully.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-purple-100 dark:border-purple-900/40">
                  <Globe className="w-5 h-5 text-purple-600 mb-2" />
                  <h4 className="font-bold text-sm mb-1">Domain Allowlisting Security</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Restricts embedding exclusively to approved host domains (e.g. <code>acme.com</code>, <code>shop.acme.com</code>) to prevent unauthorized usage.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-purple-100 dark:border-purple-900/40">
                  <Sparkles className="w-5 h-5 text-purple-600 mb-2" />
                  <h4 className="font-bold text-sm mb-1">Real-Time Server-Sent Streaming</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Streams grounded answers token-by-token with low latencies and displays citations for verified RAG facts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SECTION: WIDGET SINGLE-SCRIPT HTML EMBED                     */}
          {/* ------------------------------------------------------------- */}
          {activeSection === "widget-html" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <Badge variant="outline" className="text-purple-600 border-purple-200 dark:border-purple-800 text-[10px] mb-2">
                  HTML / Vanilla JS
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Embedding on Static & Third-Party HTML Websites
                </h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Copy and paste the embed snippet below directly into your website's HTML template, right before the closing <code className="font-mono text-purple-600">&lt;/body&gt;</code> tag.
                </p>
              </div>

              {/* Code Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
                  <span>HTML Embed Code</span>
                  <button
                    onClick={() =>
                      handleCopy(
                        "html-embed",
                        `<!-- Brain Plug AI Chatbot Widget -->\n<script\n  src="https://api.brainplug.ai/widget.js"\n  data-agent-id="00000000-0000-0000-0000-000000000001"\n  data-api-key="bp_live_your_api_key_here"\n  async\n></script>`
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {copiedId === "html-embed" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied snippet!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#0d1117] p-4 text-xs font-mono text-slate-200 leading-relaxed overflow-x-auto">
                  <pre>
                    <code>{`<!-- Brain Plug AI Chatbot Widget -->
<script
  src="https://api.brainplug.ai/widget.js"
  data-agent-id="00000000-0000-0000-0000-000000000001"
  data-api-key="bp_live_your_api_key_here"
  async
></script>`}</code>
                  </pre>
                </div>
              </div>

              {/* HTML Attributes Table */}
              <div className="p-6 rounded-2xl bg-card border border-purple-100 dark:border-purple-900/40 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Script Tag Attributes
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-purple-100 dark:border-purple-900/40 text-muted-foreground font-semibold">
                      <tr>
                        <th className="pb-2">Attribute</th>
                        <th className="pb-2">Required</th>
                        <th className="pb-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100/60 dark:divide-purple-900/30">
                      <tr>
                        <td className="py-2.5 font-mono text-purple-600 dark:text-purple-400 font-bold">src</td>
                        <td className="py-2.5"><Badge variant="destructive" className="text-[9px]">Yes</Badge></td>
                        <td className="py-2.5 text-muted-foreground">URL to <code>widget.js</code> hosted on Brain Plug.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-mono text-purple-600 dark:text-purple-400 font-bold">data-agent-id</td>
                        <td className="py-2.5"><Badge variant="destructive" className="text-[9px]">Yes</Badge></td>
                        <td className="py-2.5 text-muted-foreground">The unique UUID of your published AI Agent.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-mono text-purple-600 dark:text-purple-400 font-bold">data-api-key</td>
                        <td className="py-2.5"><Badge variant="secondary" className="text-[9px]">Optional</Badge></td>
                        <td className="py-2.5 text-muted-foreground">API key generated for this agent (or allowlist host domain).</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-mono text-purple-600 dark:text-purple-400 font-bold">data-base-url</td>
                        <td className="py-2.5"><Badge variant="secondary" className="text-[9px]">Optional</Badge></td>
                        <td className="py-2.5 text-muted-foreground">Custom enterprise self-hosted Brain Plug domain URL.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SECTION: WIDGET REACT & NEXT.JS                              */}
          {/* ------------------------------------------------------------- */}
          {activeSection === "widget-react" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <Badge variant="outline" className="text-purple-600 border-purple-200 dark:border-purple-800 text-[10px] mb-2">
                  React / Next.js
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Embedding in React & Next.js Applications
                </h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  In React or Next.js (App Router or Pages Router), create a simple reusable component that mounts the widget script dynamically on the client side.
                </p>
              </div>

              {/* Code Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
                  <span>components/chat-widget.tsx</span>
                  <button
                    onClick={() =>
                      handleCopy(
                        "react-embed",
                        `"use client";\n\nimport { useEffect } from "react";\n\nexport function BrainPlugWidget({\n  agentId,\n  apiKey,\n}: {\n  agentId: string;\n  apiKey?: string;\n}) {\n  useEffect(() => {\n    const script = document.createElement("script");\n    script.src = "https://api.brainplug.ai/widget.js";\n    script.setAttribute("data-agent-id", agentId);\n    if (apiKey) script.setAttribute("data-api-key", apiKey);\n    script.async = true;\n    document.body.appendChild(script);\n\n    return () => {\n      // Cleanup script on unmount\n      const existing = document.querySelector(\`script[data-agent-id="\${agentId}"]\`);\n      if (existing) document.body.removeChild(existing);\n    };\n  }, [agentId, apiKey]);\n\n  return null;\n}`
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {copiedId === "react-embed" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#0d1117] p-4 text-xs font-mono text-slate-200 leading-relaxed overflow-x-auto">
                  <pre>
                    <code>{`"use client";

import { useEffect } from "react";

export function BrainPlugWidget({
  agentId,
  apiKey,
}: {
  agentId: string;
  apiKey?: string;
}) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://api.brainplug.ai/widget.js";
    script.setAttribute("data-agent-id", agentId);
    if (apiKey) script.setAttribute("data-api-key", apiKey);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existing = document.querySelector(\`script[data-agent-id="\${agentId}"]\`);
      if (existing) document.body.removeChild(existing);
    };
  }, [agentId, apiKey]);

  return null;
}`}</code>
                  </pre>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-purple-100 dark:border-purple-900/40 text-xs">
                <strong>Usage in root layout (app/layout.tsx):</strong>
                <pre className="mt-2 p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto">
                  <code>{`import { BrainPlugWidget } from "@/components/chat-widget";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <BrainPlugWidget agentId="00000000-0000-0000-0000-000000000001" />
      </body>
    </html>
  );
}`}</code>
                </pre>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SECTION: WIDGET VUE & NUXT                                   */}
          {/* ------------------------------------------------------------- */}
          {activeSection === "widget-vue" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <Badge variant="outline" className="text-purple-600 border-purple-200 dark:border-purple-800 text-[10px] mb-2">
                  Vue / Nuxt
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Embedding in Vue 3 & Nuxt Applications
                </h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Mount the script inside a Vue 3 <code>onMounted</code> hook or in Nuxt using <code>useHead()</code>.
                </p>
              </div>

              {/* Code Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
                  <span>BrainPlugWidget.vue</span>
                  <button
                    onClick={() =>
                      handleCopy(
                        "vue-embed",
                        `<script setup>\nimport { onMounted } from 'vue';\n\nconst props = defineProps({\n  agentId: { type: String, required: true },\n  apiKey: { type: String, default: '' }\n});\n\nonMounted(() => {\n  const script = document.createElement('script');\n  script.src = 'https://api.brainplug.ai/widget.js';\n  script.setAttribute('data-agent-id', props.agentId);\n  if (props.apiKey) script.setAttribute('data-api-key', props.apiKey);\n  script.async = true;\n  document.body.appendChild(script);\n});\n</script>\n\n<template>\n  <!-- Invisible Widget Mount Point -->\n</template>`
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {copiedId === "vue-embed" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#0d1117] p-4 text-xs font-mono text-slate-200 leading-relaxed overflow-x-auto">
                  <pre>
                    <code>{`<script setup>
import { onMounted } from 'vue';

const props = defineProps({
  agentId: { type: String, required: true },
  apiKey: { type: String, default: '' }
});

onMounted(() => {
  const script = document.createElement('script');
  script.src = 'https://api.brainplug.ai/widget.js';
  script.setAttribute('data-agent-id', props.agentId);
  if (props.apiKey) script.setAttribute('data-api-key', props.apiKey);
  script.async = true;
  document.body.appendChild(script);
});
</script>

<template>
  <!-- Invisible Widget Mount Point -->
</template>`}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SECTION: WIDGET WORDPRESS & SHOPIFY                          */}
          {/* ------------------------------------------------------------- */}
          {activeSection === "widget-cms" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <Badge variant="outline" className="text-purple-600 border-purple-200 dark:border-purple-800 text-[10px] mb-2">
                  E-Commerce & CMS
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Embedding on Shopify, WordPress & Webflow
                </h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Integrate your customized customer support agent onto e-commerce storefronts and content management platforms.
                </p>
              </div>

              <div className="space-y-6">
                {/* Shopify */}
                <div className="p-6 rounded-2xl bg-card border border-purple-100 dark:border-purple-900/40 space-y-3">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-600" /> Shopify Store Integration
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground leading-relaxed">
                    <li>Go to your Shopify Admin &rarr; <strong>Online Store</strong> &rarr; <strong>Themes</strong>.</li>
                    <li>Click <strong>Actions</strong> &rarr; <strong>Edit Code</strong>.</li>
                    <li>Open <code>layout/theme.liquid</code>.</li>
                    <li>Scroll to the bottom and paste the Brain Plug script tag before <code>&lt;/body&gt;</code>.</li>
                    <li>Click <strong>Save</strong>. Your AI agent will float immediately on all store pages!</li>
                  </ol>
                </div>

                {/* WordPress */}
                <div className="p-6 rounded-2xl bg-card border border-purple-100 dark:border-purple-900/40 space-y-3">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-600" /> WordPress Integration
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground leading-relaxed">
                    <li>Install a header/footer injection plugin (e.g. <em>WPCode</em> or <em>Insert Headers and Footers</em>).</li>
                    <li>Navigate to <strong>Code Snippets</strong> &rarr; <strong>Footer</strong>.</li>
                    <li>Paste the Brain Plug <code>&lt;script&gt;</code> snippet and click <strong>Activate</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SECTION: WIDGET DOMAIN SECURITY & ALLOWLIST                  */}
          {/* ------------------------------------------------------------- */}
          {activeSection === "widget-security" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <Badge variant="outline" className="text-purple-600 border-purple-200 dark:border-purple-800 text-[10px] mb-2">
                  Cross-Origin Security
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Domain Security & Origin Allowlisting
                </h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Prevent unauthorized third parties from embedding your AI agents and consuming your Google Gemini token quotas by enforcing strict Domain Allowlisting.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-purple-100 dark:border-purple-900/40 space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" /> How Domain Allowlisting Works
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When a user sends a message through the floating widget, the Brain Plug server checks the HTTP <code>Origin</code> and <code>Referer</code> headers against your agent's registered allowed domains.
                </p>

                <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 text-xs space-y-2">
                  <div className="font-semibold text-foreground">How to configure allowed domains:</div>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Navigate to your Agent's <strong>Widget Customizer</strong> (<code>/client/agents/[id]/widget</code>).</li>
                    <li>Scroll down to the <strong>Domain Security & Allowlist</strong> section.</li>
                    <li>Add your production domains (e.g. <code>acme.com</code>, <code>shop.acme.com</code>, <code>localhost:3000</code>).</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SECTION: BACKEND CHAT API                                     */}
          {/* ------------------------------------------------------------- */}
          {activeSection === "api-chat" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-[10px] font-bold">
                    POST
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    /api/v1/chat
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Real-Time SSE Chat Streaming API
                </h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Interact with published AI agents using Server-Sent Events (SSE) for low-latency streaming and grounded RAG vector citations.
                </p>
              </div>

              {/* cURL & Code Example */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
                  <span>cURL Command</span>
                  <button
                    onClick={() =>
                      handleCopy(
                        "curl-chat",
                        `curl -X POST https://api.brainplug.ai/api/v1/chat \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer bp_live_your_api_key" \\\n  -d '{\n    "agentId": "00000000-0000-0000-0000-000000000001",\n    "message": "What is our enterprise SLA policy?"\n  }'`
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {copiedId === "curl-chat" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#0d1117] p-4 text-xs font-mono text-slate-200 leading-relaxed overflow-x-auto">
                  <pre>
                    <code>{`curl -X POST https://api.brainplug.ai/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer bp_live_your_api_key" \\
  -d '{
    "agentId": "00000000-0000-0000-0000-000000000001",
    "message": "What is our enterprise SLA policy?"
  }'`}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SECTION: BACKEND DOCUMENTS API                                */}
          {/* ------------------------------------------------------------- */}
          {activeSection === "api-documents" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-[10px] font-bold">
                    POST
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    /api/v1/agents/{`{id}`}/documents
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Knowledge Document Ingestion API (RAG)
                </h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Upload PDF, DOCX, XLSX, and CSV documents into Cloudinary and generate pgvector embeddings for RAG contextual retrieval.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0d1117] p-4 text-xs font-mono text-slate-200 leading-relaxed overflow-x-auto">
                <pre>
                  <code>{`curl -X POST https://api.brainplug.ai/api/v1/agents/00000000-0000-0000-0000-000000000001/documents \\
  -H "Authorization: Bearer bp_live_your_api_key" \\
  -F "file=@/path/to/product_catalog.pdf"`}</code>
                </pre>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SECTION: BACKEND TICKETS API                                  */}
          {/* ------------------------------------------------------------- */}
          {activeSection === "api-tickets" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-[10px] font-bold">
                    POST
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    /api/v1/tickets
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Customer Relations (CR) Support Ticketing API
                </h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Programmatically raise support tickets and trigger automated email dispatch via Nodemailer to assigned administrators.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0d1117] p-4 text-xs font-mono text-slate-200 leading-relaxed overflow-x-auto">
                <pre>
                  <code>{`curl -X POST https://api.brainplug.ai/api/v1/tickets \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer bp_live_your_api_key" \\
  -d '{
    "title": "Need custom fine-tuned Gemini quota",
    "description": "We are expanding our agent deployment to 50k daily queries.",
    "priority": "HIGH",
    "category": "AGENT_CONFIG"
  }'`}</code>
                </pre>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SECTION: USER CONTEXT API                                     */}
          {/* ------------------------------------------------------------- */}
          {activeSection === "api-me" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono text-[10px] font-bold">
                    GET
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    /api/v1/me
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  User Session & RBAC Context API
                </h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Returns the active user profile, tenant association, and RBAC permissions. Returns null gracefully for unauthenticated visitors.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0d1117] p-4 text-xs font-mono text-slate-200 leading-relaxed overflow-x-auto">
                <pre>
                  <code>{`curl -X GET https://api.brainplug.ai/api/v1/me \\
  -H "Authorization: Bearer bp_jwt_access_token_here"`}</code>
                </pre>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-purple-100 dark:border-purple-900/40 py-6 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground bg-card/40">
        <BrandLogo size="sm" tagline="AI Agent Infra" href="/" />
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <Link href="/docs" className="hover:text-foreground">API Docs</Link>
          <Link href="/login" className="hover:text-foreground">Sign In</Link>
        </div>
      </footer>
    </div>
  );
}
