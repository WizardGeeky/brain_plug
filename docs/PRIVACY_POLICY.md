# Brain Plug — Data Privacy, Security Policy & Terms

**Effective Date**: January 1, 2026  
**Last Updated**: September 2, 2026

---

## 1. Data Ownership & Customer Rights

1. **Customer Owns All Data**: All documents, text chunks, vector embeddings, customer inquiries, and agent configurations belong exclusively to the client tenant organization.
2. **Zero Commercial Data Reselling**: Brain Plug never sells, rents, or monetizes customer data or conversation transcripts to any third parties.
3. **AI Training Exemption**: Google Gemini Enterprise API endpoints used by Brain Plug do not use customer inputs or generated outputs to train foundational models.

---

## 2. Document & Knowledge Ingestion Lifecycle

When a client uploads knowledge files (PDF, DOCX, TXT, CSV, XLSX) into the platform:
1. **Secure Ingestion**: Files are encrypted in transit via TLS 1.3 and uploaded to dedicated Cloudinary storage buckets with signed URLs.
2. **Local Text Extraction**: Text extraction is executed in-memory with zero external parsing dependencies.
3. **Vector Generation**: Text chunks are converted to embedding vectors and stored in the tenant's isolated PostgreSQL partition.
4. **Permanent Deletion (Right to be Forgotten)**: When a document is deleted from `/client/agents/[id]/knowledge`, the system executes a hard cascade delete removing the source document, Cloudinary remote assets, and all associated vector chunks immediately.

---

## 3. Communication & Email Delivery Privacy

1. **Transactional Email Only**: Nodemailer is used strictly for operational and transactional messages (One-Time Passcodes, Workspace Onboarding, and CR Support Ticket updates).
2. **No Marketing Spam**: The platform does not engage in unsolicited promotional emails or automated marketing newsletters.

---

## 4. Multi-Tenant Isolation & Encryption Standards

- **Encryption at Rest**: PostgreSQL database storage, backups, and file storage volumes are encrypted using AES-256.
- **Application-Layer Encryption**: User passwords, session tokens, and sensitive credentials are encrypted with AES-256-GCM.
- **Tenant Partitioning**: Multi-tenant boundaries are strictly enforced via `tenant_id` foreign keys and checked at the API gateway layer.

---

## 5. Compliance & Regulatory Alignment

Brain Plug is engineered in alignment with global privacy regulations:
- **GDPR (General Data Protection Regulation)**: Full support for Data Subject Access Requests (DSAR) and permanent deletion.
- **CCPA (California Consumer Privacy Act)**: Complete transparency on data storage and zero sale of personal information.
- **Auditability**: Comprehensive audit logging allows corporate compliance officers to trace data access and administrative modifications.
