# Ótima Energia

## Overview
Ótima Energia is a technology-driven energy brokerage platform designed for the Brazilian free electricity market. It integrates a marketing website with a CRM-lite system to manage client leads, facilitate bill uploads, and process quote requests. The platform's core capabilities include a client portal for document submission, the ECOS™ system for AI-driven contract analysis, and Deal OS for revenue control and transparent deal progression with commission tracking.

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

### Parser Service
- **Purpose**: Offloads heavy PDF/OCR parsing using Python FastAPI.
- **Functionality**: Extracts data from various document types (PRC, BILL) using `pdfplumber` and Tesseract OCR. Features two-pass validation with confidence scoring.
- **Integration**: Supports both VPS and local parsing with fallback mechanisms and detailed diagnostics.
- **PRC Extraction Strategy**: Three-tier extraction: (1) Columnar detection for side-by-side product tables (e.g., Light PRC with CONVENCIONAL + INCENTIVADA columns), (2) Section-based extraction for vertical product sections, (3) Fallback line scan. Handles named periods (Anual→12, Trianual→36, Quinquenal→60) with word-boundary matching to avoid substring collisions.

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Management**: Drizzle Kit for migrations

### Key Features
- **Portal System**: Token-based access for client document uploads, enhanced by a mobile-first PWA Client Intake App for guided workflows (Upload Bills, LGPD Consent, LOA Signing).
- **Bill-First Architecture**: Enforces a structured deal journey: Bill → ECOS → Dossier → RFQ. Bills are the foundational input for all subsequent processes. Treats all bill-adjacent documents (consumption history, NF3e, demonstrativos) as RFQ data sources.
  - **Extended RFQ Fields**: `bills_extracted` stores canonical RFQ fields (ucCode, grupo/subgrupo, modalidade, consumoPonta/ForaPonta, demandaContratada/Medida) with `fieldConfidence` and `fieldReasons` JSON for per-field audit.
  - **Manual Override**: `PATCH /api/deals/:dealId/bills/:billId/override` allows ops/admin to correct extracted fields with validation (UC numeric, CNPJ 14-digit). Overrides tagged as `source=MANUAL_OVERRIDE` in fieldReasons.
  - **RFQ Readiness UX**: DealAssemblyTab shows expandable RFQ field tables grouped by Identity/Tariff/Consumption/Demand/Payment. Missing/low-confidence fields highlighted. "Needs Review" banner for missing critical fields.
  - **Debug Panel**: Ops/admin-only expandable panel showing parser URL, latency, doc kind, pages, text source, fieldReasons, and raw JSON download.
  - **Doc Kind Detection**: Auto-classifies uploaded docs as STANDARD_BILL, CONSUMPTION_HISTORY, NF3E, or DEMONSTRATIVO based on filename and extracted text.
  - **ECOS PRC Integration**: ECOS generation accepts PUBLISHED, PARSED, and VERIFIED PRC pricing rows (3-stage resolver with product normalization). PRC readiness endpoint: `GET /api/deals/:dealId/prc-readiness`. Ops Debug panel in DealAssemblyTab shows submarket, product/term coverage, and per-doc summaries.
  - **Structured Blockers**: Standardized error handling with actionable CTAs and deep links.
- **ECOS™ System**: AI for contract analysis, lead snapshots, renewal tracking, and client energy profiles.
- **Deal OS**: Revenue-control and deal-execution system with a state machine, auditability, and commission tracking.
- **Deal Tracks**: Multi-track deal management for parallel sales motions with independent workflows and audit trails.
- **Human-Controlled Document Chase System**: Manual trigger for intake link delivery with chase state tracking and automated reminders.
- **Client Dossier**: Canonical energy profile for each client, central to RFQ workflows.
- **RFQ Adapter Layer**: Multi-channel RFQ automation with templated messages.
- **Commission OS**: Milestone-based commission tracking (50/50 payment model) with invoice generation.
- **Notification System**: Queue-based email notifications for operational alerts.
- **Lost Deal Intelligence**: Structured taxonomy for analyzing reasons for lost deals.
- **PRC Upload Center**: Bulk upload and auto-parse pipeline for supplier Price Reference Circulars (PRCs) with status tracking and debug tools. Canonical submarkets: `SE_CO`, `S`, `NE`, `N`. Canonical product types: `CONVENCIONAL`, `INC_I50`, `INC_I100` (and `INC_I0`). Smart region detection handles Portuguese names (Sudeste, Sul, Nordeste, Norte). Product normalization maps bare "Incentivada" to `AMBIGUOUS_PRODUCT` (rejected). Parse status: PARSED (>=12 rows), NEEDS_REVIEW (1-11 rows or outliers), FAILED (0 rows). Debug JSON includes `countsByProduct`, `countsBySubmarket`, `rowsRejectedByReason`. Portal product normalization maps: `INCENTIVADA_50`→`INC_I50`, `INCENTIVADA_100`→`INC_I100`, `CONVENTIONAL`→`CONVENCIONAL`, underscore/space/percent variants all accepted.
- **Supplier Intelligence Module**: Analytics layer providing KPIs (win rate, response time) for supplier performance.

### Authentication & Authorization
- **Role-Based Access Control**: `admin`, `ops`, `sales` roles.
- **Auth Flow**: Session-based authentication.

### Zoho CRM Integration
- **System of Record**: Zoho CRM for Leads only; Ótima Portal for Deals, Dossiers, RFQs, Quotes, Compliance, and Commission.
- **Zoho → Portal Intake**: Zoho creates Deals in the Portal via a dedicated API endpoint.
- **Sales Activity Mirror**: Read-only mirror of Zoho CRM activity (calls, tasks, notes) displayed in the Deal detail.
- **Auto-Callback Task Creation**: Automatic creation of Zoho tasks for new intake deals, scheduled within business hours.
- **Job Runner**: Lightweight polling job runner for background tasks with idempotency and stuck job recovery.

## External Dependencies

### Cloud Services
- **Google Cloud Storage**: For file uploads.

### Database
- **PostgreSQL**: Primary database.

### Key npm Packages
- **UI Components**: Radix UI.
- **Email**: Nodemailer.
- **Authentication**: Passport.js.