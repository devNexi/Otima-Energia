# Ótima Energia

## Overview
Ótima Energia is a tech-driven energy brokerage platform for the Brazilian free electricity market. It functions as both a marketing website and a CRM-lite system, managing client leads, bill uploads, and quote requests. The platform supports inbound and outbound client acquisition through a unique portal link system for document uploads. Key capabilities include the ECOS™ system for AI-driven contract analysis and optimization, and Deal OS for revenue control and deal execution.

## User Preferences
Preferred communication style: Simple, everyday language.
Language: English only (the website is in Portuguese, but communicate with user in English).

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS v4 with shadcn/ui (New York style)
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **File Uploads**: Uppy with AWS S3 integration

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Build**: esbuild (server), Vite (client)
- **API Pattern**: RESTful endpoints (`/api/*`)

### SEO & Prerendering
- **Static HTML Generation**: Puppeteer-based prerendering at build time
- **Script Location**: `script/prerender.ts`
- **Public Routes**: All marketing pages are prerendered to static HTML for crawlers and AI tools
- **Skip Prerendering**: Set `SKIP_PRERENDER=true` to skip during development builds
- **System Dependencies**: Requires glib, nss, X11 libs, gtk3, mesa, libxkbcommon for Puppeteer

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit (`npm run db:push`)

### Key Features
- **Portal System**: Token-based access for clients to upload energy bills, with optional access codes for added security.
- **Data Models**: Leads, Clients, Upload Sessions, Consumption Profiles, Quote Requests, Supplier Quotes, RFO Requests, RFO Supplier Tracking, Supplier Contacts.
- **ECOS™ System**: Proprietary AI for contract analysis and optimization, including lead snapshots, renewal tracking, benchmark review, audit trails, and client energy profiles.
- **Deal OS**: Revenue-control and deal-execution system with an explicit state machine for deal progression, full auditability, commission tracking, immutable quote records, and detailed party structure tracking.

### Path Aliases
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets` → `./attached_assets/`

### Authentication & Authorization
- **Role-Based Access Control**: `admin`, `ops`, `sales` roles.
- **Auth Flow**: Session-based authentication via localStorage for `/admin` routes.
- **API Endpoints**: Login, logout, register, current user info, setup check.

## External Dependencies

### Cloud Services
- **Google Cloud Storage**: For file uploads via `@google-cloud/storage`.
- **Replit Object Storage**: Alternative storage with custom ACL.

### Database
- **PostgreSQL**: Primary database.
- **connect-pg-simple**: For session storage in PostgreSQL.

### Key npm Packages
- **UI Components**: Radix UI.
- **Email**: Nodemailer for sending portal links.
- **Authentication**: Passport.js with passport-local strategy.
- **Payments**: Stripe integration (future use).
- **Data Processing**: xlsx, nanoid/uuid.

### Environment Variables
- `DATABASE_URL`
- `PUBLIC_OBJECT_SEARCH_PATHS`
- `PRIVATE_OBJECT_DIR`

## Deal OS (Revenue Control System)

Deal OS is the authoritative source of financial truth for Ótima Energia - separate from CRM.

### Design Principles
1. **Explicit State Machine**: 10 states with validated transitions
2. **Full Auditability**: Every state change recorded with timestamp, actor, reason
3. **Commission Tracking**: FUTURE → PENDING → INVOICED → PAID with explicit state machine
4. **Immutable Records**: Quote SHA-256 hashes, commission snapshots locked at CONTRACT_SIGNED
5. **Party Structure**: Legal entities, brands, intermediaries, commission payers
6. **Accrual Basis**: contracted_volume | actual_consumption | hybrid

### Deal States
DRAFT → RFQ_SENT → QUOTES_RECEIVED → OFFER_SELECTED → ONBOARDING_PENDING → CONTRACT_SIGNED → SUPPLY_LIVE → CONTRACT_ENDED → CLOSED
(LOST is terminal, reachable from pre-signature states)

### New API Endpoints (Commission OS Ready)
**Commission Terms Snapshots:**
- `GET/POST /api/deals/:id/commission-snapshots`
- `GET /api/deals/:id/commission-snapshots/active`
- `POST /api/deals/:dealId/commission-snapshots/:snapshotId/supersede`

**Deal Disputes:**
- `GET /api/disputes` (filter by ?status=)
- `GET/POST /api/deals/:id/disputes`
- `PATCH /api/disputes/:id`
- `POST /api/disputes/:id/resolve`

**Checklist Requirements:**
- `GET/POST /api/deal-checklist-requirements`
- `PATCH/DELETE /api/deal-checklist-requirements/:id`

**Supplier SLA Tracking:**
- `GET /api/supplier-sla/breaches`
- `GET /api/deals/:id/sla-tracking`
- `GET /api/suppliers/:id/sla-tracking`
- `POST /api/supplier-sla`
- `POST /api/supplier-sla/:id/response`

## Commission OS (Phase 1)

Commission OS is the usage tracking, reconciliation, and case management system built on top of Deal OS.

### Database Tables
- `client_usage_periods`: Monthly energy consumption tracking per client/deal
- `supplier_playbooks`: Supplier configuration with versioning (payment cadence, SLA targets, rules)
- `supplier_report_imports`: Batch import tracking for supplier commission reports
- `commission_reconciliation_runs`: Monthly/ad-hoc reconciliation runs
- `commission_reconciliation_lines`: Line-by-line expected vs reported vs paid tracking
- `deal_cases`: Issue/blocker tracking with SLA and convert-to-lost capability

### Key Enums
- `usage_source_type`: BILL_OCR, CLIENT_CSV, SUPPLIER_REPORT, MANUAL
- `usage_status`: DRAFT, VERIFIED, INVALID
- `payment_cadence`: UPFRONT, MONTHLY, QUARTERLY, MIXED
- `reconciliation_run_type`: MONTHLY_CLOSE, ADHOC
- `reconciliation_run_status`: OPEN, FINALIZED
- `reconciliation_line_status`: OPEN, MATCHED, DISPUTED, RECONCILED
- `case_type`: RETURNED, STUCK, CREDIT_REJECTED, METERING_DELAY, DOCS_PENDING, etc.
- `case_severity`: LOW, MED, HIGH
- `case_status`: OPEN, IN_PROGRESS, ESCALATED, RESOLVED, CONVERTED_TO_LOST

### API Endpoints
**Usage Tracking:**
- `GET/POST /api/usage` (filter by clientId, dealId)
- `GET/PATCH/DELETE /api/usage/:id`
- `POST /api/usage/:id/verify`

**Supplier Playbooks:**
- `GET /api/supplier-playbooks`
- `GET/POST /api/suppliers/:id/playbook`
- `GET /api/suppliers/:id/playbook/versions`

**Report Imports:**
- `GET/POST /api/supplier-report-imports`
- `GET/PATCH /api/supplier-report-imports/:id`

**Reconciliation:**
- `GET/POST /api/reconciliation-runs`
- `GET /api/reconciliation-runs/:id` (includes lines)
- `POST /api/reconciliation-runs/:id/finalize`
- `POST /api/reconciliation-runs/:runId/generate-lines`
- `GET/POST /api/reconciliation-lines`
- `GET/PATCH /api/reconciliation-lines/:id`
- `POST /api/reconciliation-lines/:id/raise-dispute`

**Deal Cases:**
- `GET /api/cases` (filter by dealId, status, severity)
- `GET/POST /api/deals/:id/cases`
- `GET/PATCH /api/cases/:id`
- `POST /api/cases/:id/convert-to-lost`

### Frontend Components
- `UsageTab`: Energy consumption tracking with verify workflow
- `PlaybooksTab`: Supplier configuration with version history
- `ReconciliationTab`: Monthly/ad-hoc runs with variance dashboard
- `DealCasesTab`: Per-deal case management with convert-to-lost

### Design Principles
1. **Verification Workflow**: Usage periods start as DRAFT, require manual VERIFIED status
2. **Automatic Versioning**: Creating new playbook auto-retires previous active version
3. **Reconciliation Lines**: One line per deal per period, tracks expected/reported/paid/variance
4. **Case → LOST**: Cases can trigger deal state machine transition to LOST terminal state
5. **No Automation Logic**: All tables are clean CRUD - ready for future orchestration layer

## Notification System

### Overview
Email notification infrastructure for operational alerts. Queues notifications for delivery via SendGrid or Resend when configured.

### Notification Types
- `DEAL_BLOCKED`: Deals blocked by incomplete compliance requirements
- `SLA_BREACH`: Cases that have exceeded their SLA deadline
- `COMMISSION_OVERDUE`: Commission events past their expected date

### Database Table
- `notification_queue`: Stores pending, sent, and failed notifications with full audit trail

### API Endpoints
- `POST /api/notifications/check` (Admin only): Triggers notification generation and processing
- `GET /api/notifications/pending` (Admin/Ops): View pending notification queue

### Environment Variables
- `OPS_NOTIFICATION_EMAIL` or `ADMIN_EMAIL`: Recipient for notification emails
- `SENDGRID_API_KEY` or `RESEND_API_KEY`: Email service credentials (when configured)

### Design Principles
1. **Queue-Based**: Notifications are queued first, processed separately
2. **Configurable Recipients**: Uses environment variable for notification email
3. **Graceful Degradation**: Without email service configured, logs notification intent
4. **Role-Guarded**: Endpoints protected by appropriate role checks

## Lost Deal Intelligence

### Structured Reason Taxonomy (20+ categories)
**Client Reasons**: CLIENT_NO_RESPONSE, CLIENT_PRICE_SENSITIVE, CLIENT_INTERNAL_CHANGE, CLIENT_RELOCATED, CLIENT_CLOSED
**Supplier Reasons**: SUPPLIER_REJECTED_CREDIT, SUPPLIER_VOLUME_MINIMUM, SUPPLIER_NO_QUOTE, SUPPLIER_CONTRACT_TERMS
**Competitive Reasons**: LOST_TO_COMPETITOR, INCUMBENT_RETENTION, PRICE_NOT_COMPETITIVE
**Process Reasons**: PROCESS_TIMEOUT, DOCS_NOT_PROVIDED, MIGRATION_FAILED, REGULATORY_BLOCK
**Other**: OTHER (requires notes)

### Tracking Fields
- `lost_reason_category`: Structured category from taxonomy
- `lost_supplier_id`: If lost to specific supplier
- `lost_stage`: Deal state when lost
- `lost_by_user_id`: User who marked deal as LOST
- `lost_at`: Timestamp of LOST transition
- `lost_notes`: Mandatory if reason is OTHER

### Analytics API
- `GET /api/analytics/lost-deals`: Aggregated views by reason, supplier, stage, user