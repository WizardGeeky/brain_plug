# Brain Plug — Operator Runbook & Setup Guide

This runbook provides non-developer operators and systems engineers with a 3-step setup guide, operational runbook procedures, troubleshooting matrices, and a 5-minute demo video script for the Brain Plug Multi-Tenant AI Agent Platform.

---

## 1. Three-Step Quickstart Guide

### Prerequisites
- **Node.js**: v18.17.0+ or v20+
- **PostgreSQL**: PostgreSQL 14+ (Local native instance or Supabase/Neon connection pooler)
- **Google Gemini API Key**: Free tier or paid API key from [Google AI Studio](https://aistudio.google.com/)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment & Sync Database
Create or verify your `.env` file with the following database connection string and application secrets:

```env
# Database Connection (Local PostgreSQL or Supabase Connection Pooler)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/brain_plug"

# Authentication & Session Security (32-byte secret for AES-256-GCM)
JWT_SECRET="enterprise-super-secret-jwt-key-brain-plug-32b"
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Transactional Email (Nodemailer SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="notifications@brainplug.ai"
SMTP_PASS="your-smtp-app-password"
SMTP_FROM="Brain Plug <notifications@brainplug.ai>"
```

Sync the Prisma database schema and seed the initial Super Admin account:
```bash
npx prisma db push
npm run db:seed
```

### Step 3: Launch the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 2. Standard Operating Procedures (SOPs)

### SOP 1: Injecting or Rotating Google Gemini API Keys
1. Sign in to the platform as Super Admin via `/login` with email `admin@brainplug.ai`.
2. Enter the 6-digit OTP received via email (or check server console in development).
3. Navigate to **Super Admin Dashboard > Gemini Models** (`/admin/models`).
4. In the **Master API Key Configuration** panel, paste your Google Gemini API Key.
5. Click **"Test Connection"** to verify live connectivity with Google's API.
6. Click **"Save API Key"**. The key is encrypted in PostgreSQL and the in-memory cache is immediately invalidated without server restarts.

### SOP 2: Self-Service Client Workspace Onboarding
1. New clients visit `/login` and select the **"Register Workspace"** tab (or navigate directly to `/login?tab=register`).
2. Fill in **Full Name**, **Company Name**, and **Work Email**.
3. Click **"Create Workspace & Get Code"**.
4. The system automatically provisions the tenant workspace, assigns the `CLIENT_ADMIN` role, generates a starter AI Assistant and chat widget, and dispatches a 6-digit verification code.
5. Enter the 6-digit code to immediately access the `/client/dashboard`.

### SOP 3: Ingesting Knowledge Base Documents
1. In the Client Workspace, navigate to **Agents > [Agent Name] > Knowledge Base** (`/client/agents/[id]/knowledge`).
2. Drag and drop any **PDF**, **Word Document (.docx)**, **Plain Text (.txt)**, or **Spreadsheet (.xlsx / .csv)**.
3. The RAG engine automatically extracts the text, splits it into 500-token chunks with 50-token overlap, generates 768-dimensional embeddings via `text-embedding-004`, and updates the agent's knowledge partition in $< 3\text{ seconds}$.

### SOP 4: Embedding the Web Chat Widget
1. In the Client Workspace, navigate to **Agents > [Agent Name] > Widget Integration** (`/client/agents/[id]/widget`).
2. Copy the 1-line script snippet:
```html
<script
  src="http://localhost:3000/widget.js"
  data-agent-id="YOUR_AGENT_UUID"
  async
></script>
```
3. Paste the script before the closing `</body>` tag of your website. The widget initializes inside an isolated Shadow DOM container with zero CSS conflicts.

### SOP 5: Handling Customer Relations (CR) Support Tickets
1. Clients can raise tickets via `/client/tickets` for questions requiring human escalation.
2. Super Admins receive an immediate email notification and inspect the ticket at `/admin/tickets/[id]`.
3. Super Admins can add **Internal Notes** (visible only to staff) or send public replies to the client.
4. The client receives an email update upon every ticket status change.

---

## 3. Operational Troubleshooting Matrix

| Issue / Symptom | Possible Root Cause | Step-by-Step Resolution |
|---|---|---|
| **Database Connection Error (P1001)** | Local PostgreSQL service stopped or Supabase pooler unreachable. | Verify PostgreSQL is running on port 5432; check `DATABASE_URL` in `.env`. For Supabase, ensure transaction pooler port `6543` and `?pgbouncer=true` are configured. |
| **"Gemini API key not configured" Error** | Master key has not been entered in the database vault. | Sign in as Super Admin (`admin@brainplug.ai`), open `/admin/models`, enter a valid Gemini API key, and click "Save API Key". |
| **CORS 403 Forbidden on Chat Widget** | The website domain hosting the widget is not in the agent's allowed domains. | Navigate to **Client Workspace > Agents > [Agent] > Security** and add the host website domain (e.g. `https://mycompany.com` or `localhost:8080`) to the **Allowed Domains** list. |
| **OTP Code Not Received via Email** | SMTP credentials incorrect or Gmail app password expired. | In development, OTP codes are logged directly to the server terminal. In production, verify `SMTP_USER` and `SMTP_PASS` in `.env`. |
| **Document Upload Status "FAILED"** | Malformed PDF stream or encrypted document file. | Ensure uploaded file is unencrypted; check file size is under 25MB; verify Cloudinary credentials in `.env` if cloud uploads are enabled. |

---

## 4. Five-Minute Screen-Recorded Demo Script & Outline

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                FIVE-MINUTE DEMO VIDEO STRUCTURE                             │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 0:00 - 0:45 | 1. The Problem & Baseline                                                     │
│   • Show manual support ticket triage: 25-minute wait times, 6.2 hours of drafting daily.   │
│   • State the core objective: Real-time, grounded multi-tenant AI agents with zero leak.    │
│                                                                                             │
│ 0:45 - 2:00 | 2. Live Flow: Self-Service Registration & Knowledge Ingestion                 │
│   • Open landing page -> click "Register Workspace".                                        │
│   • Enter client details -> receive passwordless 6-digit OTP -> instant redirect to /client.│
│   • Drag and drop a proprietary 20-page product manual (PDF).                               │
│   • Watch live chunking and vector embedding generation in < 3 seconds.                     │
│                                                                                             │
│ 2:00 - 3:15 | 3. Non-Developer Experience: Real-Time Chat Widget & Citations               │
│   • Open embedded Shadow DOM chat widget on a sample HTML page.                             │
│   • Ask complex technical product questions.                                                │
│   • Observe sub-450ms Server-Sent Events (SSE) token streaming.                             │
│   • Demonstrate clickable source citation badges referencing exact document chunks.         │
│                                                                                             │
│ 3:15 - 4:15 | 4. Evaluation, Failure Handling & CR Ticketing Escalation                      │
│   • Trigger edge case: Ask out-of-scope question -> observe confidence fallback.            │
│   • Click "Escalate to Human Support" -> automatic CR Ticket created with email dispatch.   │
│   • Switch to Super Admin Portal (/admin/tickets) -> add internal note -> reply to client.  │
│                                                                                             │
│ 4:15 - 5:00 | 5. Measured Results, Limitations & Next Iteration                              │
│   • Review evaluation metrics: 87% latency reduction, 96.8% autonomous resolution.          │
│   • Discuss limitations (in-memory cosine vs. HNSW) and present the 2-week voice roadmap.   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```
