# 📚 Brain Plug Technical Documentation — Master Index

Welcome to the technical documentation repository for **Brain Plug**, an enterprise Multi-Tenant AI Agent & Customer Operations OS Mini built on Next.js 15, PostgreSQL `pgvector`, Google Gemini 2.0 Flash, AES-256-GCM encryption, Cloudinary storage, and Nodemailer.

---

## 📑 Complete Documentation Directory

| Document | Description | Format / Audience |
| :--- | :--- | :--- |
| [**1. Production Case Study**](./CASE_STUDY.md) | Business context, operational bottleneck, architecture trade-offs, human judgment retained, limitations, and two-week roadmap. | Markdown / CTOs, Product Leads |
| [**2. Evaluation Package**](./EVALUATION_PACKAGE.md) | 10–12 rigorous end-to-end test cases, baseline comparisons, failure analyses, speed/cost/quality benchmarks. | Markdown / QA, System Evaluators |
| [**3. AI Collaboration Note**](./AI_COLLABORATION_NOTE.md) | AI tools utilized, work delegated to AI, human verification methods, rejected proposals, and core decisions owned. | Markdown / Engineering Leadership |
| [**4. System Architecture**](./ARCHITECTURE.md) | Complete topology, multi-tenancy model, pgvector RAG pipeline, database ERDs, and SSE streaming architecture. | Markdown / Architects, Engineers |
| [**5. API Integration & Widget Guide**](./API_INTEGRATION.md) | Complete developer manual with code snippets (cURL, TypeScript, Python, HTML/React/Vue/Shopify widget embed). | Markdown / Developers, Partners |
| [**6. Security Architecture**](./SECURITY.md) | AES-256-GCM encryption standards, Real Client IP normalization (`lib/ip.ts`), RBAC roles, and audit trail purge. | Markdown / Security, Compliance |
| [**7. Enterprise Use Cases**](./USE_CASES.md) | Production scenarios: 24/7 Support Desk, Internal Knowledge Ops, Tabular Data Lookup, and CR Ticketing. | Markdown / Operations, Support Leads |
| [**8. Privacy & Data Governance**](./PRIVACY_POLICY.md) | Multi-tenant data isolation, GDPR/CCPA compliance, vector chunk purge, and zero AI training on proprietary files. | Markdown / Legal, Compliance |

---

## 🏗️ High-Level System Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BRAIN PLUG PLATFORM ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ FRONTEND - Next.js 15 App Router + TailwindCSS + Pure White & Lavender ] │
│  ├── / (Landing Page: Interactive Simulator, Mobile Drawer, Feature Tabs)  │
│  ├── /admin/* (Super Admin: Client Tenants, Models Registry, Audit Logs)    │
│  ├── /client/* (Client Workspace: Agent Studio, Knowledge RAG, Tickets)     │
│  └── public/widget.js (Vanilla JS Shadow DOM Embedded Chatbot)              │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ EDGE MIDDLEWARE & SECURITY VAULT ]                                       │
│  ├── middleware.ts (Edge JWT Session Guard & Role-Based Dashboard Routing) │
│  ├── lib/encryption (AES-256-GCM Cipher for Tokens & Database Secrets)      │
│  └── lib/ip.ts (Real Public Client IP Extraction across Proxies & CDNs)     │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ BACKEND CORE APIS & ORCHESTRATION ]                                      │
│  ├── /api/v1/auth/* (Passwordless 6-digit OTP verification via Nodemailer)  │
│  ├── /api/v1/agents/* (Agent Persona, Prompt Prefixing & Model Binding)     │
│  ├── /api/v1/knowledge/* (Multi-format Parser & Vector Embeddings)          │
│  ├── /api/v1/chat (SSE Streaming with Gemini 2.0 & RAG Grounding)           │
│  └── /api/v1/tickets/* (Support Ticketing & Human-in-the-Loop Escalation)   │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ DATA & CLOUD STORAGE LAYER ]                                             │
│  ├── PostgreSQL (Prisma ORM with Multi-Tenant Foreign-Key Isolation)        │
│  ├── PostgreSQL pgvector (High-dimensional Semantic Document Embeddings)    │
│  └── Cloudinary CDN (Production Object Storage for Documents & Avatars)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Key Architectural Guarantees

1. **Zero Static Key Dependency**: Gemini API keys and active models are configured dynamically through the Super Admin Dashboard and stored securely in PostgreSQL.
2. **Strict Multi-Tenancy**: All database queries are scoped by `tenant_id` at the service layer, preventing cross-tenant data leakage.
3. **No Bcrypt / AES-256-GCM Only**: Passwords and sensitive tokens are encrypted using symmetric authenticated AES-256-GCM with randomized initialization vectors.
4. **Real-time Nodemailer Alerts**: Dual-mode OTPs, workspace onboarding invitations, and bidirectional CR support tickets trigger instant transactional emails.
5. **Real Data Persistence**: No mock data or in-memory arrays; all usage metrics, audit logs, vector embeddings, and conversation histories reside in PostgreSQL.
6. **Real Public Client IP Extraction**: IPv6 loopbacks (`::1`) are stripped to log authentic client public IPs in all audit trails.
