# Brain Plug — Enterprise Security Architecture & Compliance

This document outlines the cryptographic standards, access controls, network boundaries, and compliance mechanisms implemented in the Brain Plug platform.

---

## 1. Cryptographic Standards (AES-256-GCM)

In strict accordance with enterprise security specifications, **bcrypt is completely excluded** from the platform. All sensitive secrets, user passwords, and tokens are protected using **Authenticated Symmetric AES-256-GCM (Galois/Counter Mode)**.

### Cipher Specifications:
- **Algorithm**: `AES-256-GCM`
- **Key Length**: 256 bits (derived from `ENCRYPTION_SECRET`)
- **Initialization Vector (IV)**: 16 bytes cryptographically secure random bytes generated uniquely per encryption operation
- **Authentication Tag**: 16-byte authentication tag ensuring ciphertext integrity and preventing tampering
- **Storage Format**: `iv_hex:auth_tag_hex:ciphertext_hex`

### Password Verification Flow:
```
Plaintext Password ──> Decrypt Stored Hash via AES-256-GCM ──> Timing-Safe Equality Comparison
```

---

## 2. API Key Management & Cryptographic Hashing

1. **Prefix Format**: All API keys follow the standard `bp_live_{random_32_bytes}` format for easy secret scanning detection.
2. **One-Time Secret Reveal**: When a key is created in `/client/agents/[id]/api-keys`, the raw secret is presented to the user **exactly once** in a secure modal.
3. **Database Storage**: The raw key is never stored. Only the **SHA-256 cryptographic hash** (`keyHash`) is persisted and indexed in the `api_keys` table.
4. **Revocation & Expiry**: Keys can be revoked instantly by administrators or configured with automatic time-based expirations.

---

## 3. Dual-Mode Authentication & OTP Security

Brain Plug implements multi-modal authentication for both corporate password policies and passwordless flows:

1. **Primary Password Sign-In**: Protected by AES-256-GCM authentication.
2. **6-Digit OTP Sign-In**: Delivered via **Nodemailer** for passwordless login and verification.
3. **OTP Security Measures**:
   - **Lifespan**: Strictly limited to 5 minutes (`expires_at`).
   - **Rate Limiting**: Maximum 5 attempts per OTP before the code is permanently invalidated.
   - **Cryptographic Hash**: OTP codes are stored as SHA-256 hashes in `otp_verifications`.

---

## 4. Role-Based Access Control (RBAC)

The platform enforces fine-grained permissions attached to roles:

| Role | Scope | Key Permissions |
|---|---|---|
| `SUPER_ADMIN` | Global Platform | `platform:manage`, `tenants:write`, `models:manage`, `analytics:platform`, `audit:view` |
| `CLIENT_ADMIN` | Tenant Workspace | `agents:write`, `documents:upload`, `documents:delete`, `api_keys:manage`, `widget:configure`, `conversations:read`, `users:manage` |
| `CLIENT_USER` | Tenant Workspace | `agents:read`, `conversations:read`, `chat:test` |

---

## 5. Domain Whitelisting & Origin Guard

For embedded web chat widgets:
- The `POST /api/v1/chat` endpoint inspects the incoming `Origin` and `Referer` HTTP headers.
- If the agent has configured `Allowed Domains` (e.g. `https://app.acme.com`), requests from non-whitelisted domains receive `403 Forbidden`.

---

## 6. Rate Limiting & Denial-of-Service Defense

- **In-Memory Token Bucket Algorithm**: Implemented in `server/rate-limit/rate-limiter.ts`.
- **Sliding Window**: Protects `/api/v1/chat` (60 req/min per IP/Agent) and `/api/v1/auth/*` (10 req/min per IP).
- **Graceful Rejection**: Rejections return standard `429 Too Many Requests` with `Retry-After` headers.

---

## 7. Audit Logging & Non-Repudiation

All critical lifecycle actions are recorded immutably in the `audit_logs` table:
- **Captured Data**: `actorUserId`, `tenantId`, `action` (e.g., `TICKET_CREATED`, `AGENT_UPDATED`, `API_KEY_CREATED`), `entityType`, `entityId`, `ipAddress`, `userAgent`, and change metadata.
- **CSV Export**: Super Admins can export the full audit trail at `/admin/audit-logs` for compliance verification.
