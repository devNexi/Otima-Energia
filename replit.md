# Ótima Energia

## Overview
Ótima Energia is a technology-driven energy brokerage platform for the Brazilian free electricity market. It combines a marketing website with a CRM-lite system, managing client leads, bill uploads, and quote requests. The platform facilitates client acquisition through a unique portal for document uploads and features the ECOS™ system for AI-driven contract analysis and optimization. Deal OS, a revenue control and deal execution system, ensures transparent deal progression and commission tracking.

## User Preferences
Preferred communication style: Simple, everyday language.
Language: English only (the website is in Portuguese, but communicate with user in English).

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS v4 with shadcn/ui (New York style)
- **Forms**: React Hook Form with Zod validation
- **File Uploads**: Uppy with AWS S3 integration

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints (`/api/*`)

### SEO & Prerendering
- **Static HTML Generation**: Puppeteer-based prerendering for marketing pages.

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit

### Key Features
- **Portal System**: Token-based access for client document uploads. Enhanced with Client Intake App.
- **Client Intake App**: Mobile-first PWA stepper at `/portal/upload/:token` and `/client/intake/:token`. Steps: Upload Bills → LGPD Consent → LOA Signing → Review & Submit. Track-aware with dealId/trackId linking. LOA PDF generation with pdf-lib. Consent records with full audit trail (IP, user agent, signer details). Backwards compatible with legacy upload sessions. Admin "Generate Intake Link" in Deal Tracks UI with configurable expectedBillsCount/requireLGPD/requireLOA. Intake readiness indicators (bills X/Y, LGPD ✓, LOA ✓) in track detail. Tables: `consent_records`. Extended: `upload_sessions` (dealId, trackId, intakeType, expectedBillsCount, requireLOA, requireLGPD, usedAt, verifiedAt), `deal_track_documents` (uploadedByClient, uploadSessionId, source). Job types: `INTAKE_COMPLETED_NOTIFICATION`, `INTAKE_REMINDER`.
- **Data Models**: Comprehensive models for leads, clients, upload sessions, consumption profiles, and various quote/RFO processes.
- **ECOS™ System**: AI for contract analysis, lead snapshots, renewal tracking, and client energy profiles.
- **Deal OS**: Revenue-control and deal-execution system with an explicit state machine, auditability, commission tracking, and immutable records.
- **Deal Tracks**: Multi-track deal management (GDL, ACL, ACR, OTHER) allowing parallel sales motions per deal with independent status workflows, event audit trail, document linking, and GDL eligibility checklist. Tables: `deal_tracks`, `deal_track_events`, `deal_track_documents`.
- **Client Dossier**: Canonical energy profile for each client, serving as the foundational data for RFQ workflows, with status gates and immutability after RFQ.
- **RFQ Adapter Layer**: Multi-channel RFQ automation with templated messages and token replacement for various communication channels.
- **Commission OS**: Milestone-based commission tracking with 50/50 payment model:
  - **Milestone 1 (50%)**: Triggered at CONTRACT_SIGNED
  - **Milestone 2 (50%)**: Triggered at SUPPLY_LIVE (CCEE Activation)
  - **Adjustments-only reconciliation**: No monthly/quarterly recurring events
  - **One-click invoice generation**: POST /api/commission-events/:id/generate-invoice
  - Supplier Playbooks define milestone terms per supplier
- **Notification System**: Email notification infrastructure for operational alerts (e.g., `DEAL_BLOCKED`, `SLA_BREACH`), utilizing a queue-based approach.
- **Lost Deal Intelligence**: Structured taxonomy for tracking reasons for lost deals, including client, supplier, competitive, and process categories, with analytics API.
- **PRC Upload Center**: Bulk upload and auto-parse pipeline for supplier Price Reference Circulars (PRCs), with multi-file drag-drop, metadata fields (supplier, reference month, submarket hint, source, notes), and document status tracking through the parse/verify/publish workflow.
- **Supplier Intelligence Module**: Analytics layer over existing tables (rfq_dispatches, deal_quotes, deals). KPIs derived via SQL joins — no separate interaction log table. Supplier detail page at `/admin/suppliers/:id` with 3 tabs (Overview+KPIs, Interaction History, Performance). Main supplier list enhanced with KPI badges and Ações Pendentes dashboard. Win rate formula: `wins / totalRfqs` per supplier. Response time: `AVG(dealQuotes.received_at - rfqDispatches.sent_at)`. QA test: `suppliers.intelligence_kpis`.

### Authentication & Authorization
- **Role-Based Access Control**: `admin`, `ops`, `sales` roles.
- **Auth Flow**: Session-based authentication.

### Zoho CRM Integration Architecture
**System of Record Rules:**
- **Zoho CRM**: System of record for **Leads only**
- **Ótima Portal**: System of record for **Deals, Dossiers, RFQs, Quotes, Compliance, and Commission**
- After Lead → Deal conversion, Zoho is treated as read-only context; all operational state changes happen only in Portal

**Zoho → Portal (Intake):**
- Zoho may create a Deal via `POST /api/intake/zoho/deal` endpoint
- Passes canonical Brazil fields: `BR_Market`, `BR_Group`, `BR_Outcome`, DM info, callback, quick notes
- Zoho must NOT update deal stage after creation or overwrite dossier/RFQ/quote/compliance data
- Authentication via `x-zoho-intake-key` header
- Idempotency: Duplicate `zohoLeadId` returns existing deal (HTTP 200, status: EXISTING)
- On new deal creation, non-blocking jobs are enqueued: `ZOHO_SYNC_SNAPSHOT` and `ZOHO_CREATE_CALLBACK_TASK`

**Sales Activity Mirror:**
- Read-only mirror of Zoho CRM activity (calls, tasks, notes) displayed in Deal detail "Sales" tab
- Cached snapshot stored in `deal_sales_snapshots` for fast rendering and resilience
- Activity items stored in `deal_sales_activity_items` with unique constraint on (provider, externalId)
- CRM link mapping in `deal_crm_links` (dealId → zohoDealId, zohoContactId, zohoOwnerId)
- Refresh button triggers server-side Zoho sync via job queue
- No-activity warning shown when lastContactAt > 10 days
- Zoho deep links for "Open in Zoho" button
- Internal notes (portal-only, no Zoho sync) via `deal_internal_notes` table

**Auto-Callback Task Creation:**
- On new Zoho intake deal, automatically creates a Zoho Task via job queue
- Business hours scheduling: Mon-Fri 09:00-18:00 America/Sao_Paulo
- 30-minute delay during business hours; rolls to next business day outside hours/weekends
- Idempotent: uses `idempotencyKey` in job payload to prevent duplicate tasks
- Zoho API client stubbed (`server/zohoClient.ts`) - awaiting ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN

**Job Runner:**
- Lightweight polling job runner (`server/jobs.ts`) with exponential backoff + jitter (±20%)
- Jobs table: type, payload, status (PENDING/RUNNING/SUCCESS/FAILED), attempts, maxAttempts
- Polls every 30s, processes up to 3 concurrent jobs
- Concurrency lock: `SELECT FOR UPDATE SKIP LOCKED` prevents duplicate processing across server instances
- Stuck job recovery: jobs RUNNING > 10 minutes auto-reset to PENDING each poll cycle
- Task-level idempotency: `deal_zoho_task_links` table (dealId + purpose unique) prevents duplicate Zoho tasks even on job retry after network timeout
- Health endpoint: `GET /api/integrations/zoho/status` → `{connected, missing[], region}`
- Sync status endpoint: `GET /api/deals/:dealId/sales-snapshot/sync-status` → last job status
- Manual Zoho task creation: `POST /api/deals/:dealId/zoho-tasks` (subject, dueDate, description)
- Fail-open: if Zoho unavailable, deal creation still succeeds

**Portal → Zoho (Future - Not Implemented):**
- Light sync only: Deal Created timestamp + Portal Deal ID, Final Outcome (Closed Won/Lost)
- No mid-pipeline syncing required
- Sync logic kept modular for future: RFQ_SENT, CONTRACT_SIGNED status pushback

**Data Model Safeguards:**
- `zohoLeadId` stored on Portal deals (unique constraint)
- All Zoho-originated events logged in audit trail with `source = zoho_intake`
- UI displays read-only banner: "Originated from Zoho • Operational control lives in Ótima"

**Deal Ownership Assignment:**
- Default: Callum
- Group B: Always Callum
- Hotkey outcome (non-Group B): Renan

**Zoho Config Environment Variables:**
- `ENABLE_ZOHO_SNAPSHOT_SYNC` (true/false)
- `ENABLE_ZOHO_AUTO_CALLBACK_TASK` (true/false)
- `DEFAULT_CALLBACK_DELAY_MINUTES` (default 30)
- `BUSINESS_HOURS_START` / `BUSINESS_HOURS_END` (09:00 / 18:00)
- `NO_ACTIVITY_WARNING_DAYS` (default 10)
- `TIMEZONE` (America/Sao_Paulo)
- `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN` (not yet configured)
- `ZOHO_REGION` (default: com)

**Google Calendar:**
- NOT directly integrated by portal
- Achieved via Zoho's native Google Calendar sync
- Portal ensures Zoho Task exists with correct schedule

## External Dependencies

### Cloud Services
- **Google Cloud Storage**: For file uploads.
- **Replit Object Storage**: Alternative storage.

### Database
- **PostgreSQL**: Primary database.
- **connect-pg-simple**: For session storage.

### Key npm Packages
- **UI Components**: Radix UI.
- **Email**: Nodemailer.
- **Authentication**: Passport.js with passport-local strategy.
- **Payments**: Stripe (future use).
- **Data Processing**: xlsx.
```