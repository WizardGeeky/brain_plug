# Brain Plug — Production Enterprise Use Cases

This document outlines key enterprise use cases supported by the Brain Plug Multi-Tenant AI Agent Platform.

---

## 1. 24/7 Automated Customer Support & Helpdesk

### Scenario
An enterprise SaaS provider receives hundreds of recurring technical, billing, and account support questions daily. Response times slow down during off-peak hours and weekends.

### Brain Plug Solution
- **Knowledge Base Ingestion**: The company uploads product manuals, API documentation, FAQ sheets, and service level agreements (PDF, DOCX, TXT) via the `/client/agents/[id]/knowledge` interface.
- **RAG Grounding**: The agent extracts vector embeddings using Gemini and retrieves relevant paragraphs on user queries (`topK=5`, `similarityThreshold=0.40`).
- **Autonomous Resolution**: The agent provides exact answers with source citations.
- **Human Escalation via CR Tickets**: If an issue requires human attention, the user/client can raise a Support Ticket (`/client/tickets`), notifying the support engineering team via Nodemailer with full ticket tracking.

---

## 2. White-Label Multi-Tenant Agency / Reseller Model

### Scenario
A digital marketing or software agency manages AI agents for 50 distinct corporate clients. Each corporate client needs their own branded portal, isolated document storage, and independent analytics.

### Brain Plug Solution
- **Super Admin Governance**: The agency administrator uses `/admin/clients` to onboard individual client companies.
- **Complete Tenant Isolation**: Each client accesses `/client/dashboard` with strict tenant-scoped data isolation (`tenant_id`).
- **Custom Widget Branding**: Each tenant customizes launcher icons, primary/secondary colors, welcome messages, widget dimensions, and placement (`/client/agents/[id]/widget`).
- **Domain Whitelisting**: Widgets only execute on authorized corporate domains, preventing unauthorized API usage.

---

## 3. Internal Corporate Knowledge & Policy Assistant

### Scenario
A company with 1,000+ employees across HR, Legal, and IT struggles with internal questions regarding benefits, security protocols, PTO policies, and employee onboarding.

### Brain Plug Solution
- **Private Internal Agent**: An AI agent is created with `isPublic = false` and scoped strictly to internal authenticated team members.
- **Role-Based Access**: Employees log in using dual-mode authentication (Password or 6-digit OTP delivered via Nodemailer).
- **Audit Logging**: Every document upload, agent modification, and query is immutably recorded in `audit_logs` for compliance review.

---

## 4. High-Traffic E-Commerce Sales & Product Recommender

### Scenario
An e-commerce retailer wants a shopping assistant embedded across product catalog pages to answer inventory, sizing, and shipping policy questions in real time with zero perceived latency.

### Brain Plug Solution
- **Lightweight Script Integration**: A single script tag `<script src="https://api.brainplug.ai/widget.js" data-agent-id="..." data-api-key="..."></script>` is pasted into the store template.
- **Real-Time Streaming**: Responses are streamed via Server-Sent Events (SSE) token-by-token using Gemini Flash for sub-500ms initial response time.
- **Dynamic Model Selection**: Super Admin can switch the underlying model to `gemini-2.0-flash` from the dashboard without touching client frontend code.

---

## 5. Bidirectional Customer Relations (CR) & Escalation Service

### Scenario
Client organizations encounter technical blockers, model misconfigurations, or billing inquiries that require direct intervention from platform engineers.

### Brain Plug Solution
- **Client Ticket Creation**: Client administrators submit tickets categorized as *Technical Issue, Agent Configuration, RAG Knowledge, Billing, or Feature Request* with optional agent linkage.
- **Instant Email Alerts**: Nodemailer dispatches notification emails to Super Admins with direct links to the ticket thread.
- **Super Admin Resolution**: Support staff reply directly, add private internal staff notes, update status (`IN_PROGRESS` -> `RESOLVED`), and clients receive instant notifications with full status history.
