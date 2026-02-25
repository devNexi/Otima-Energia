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

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Management**: Drizzle Kit for migrations

### Key Features
- **Portal System**: Token-based access for client document uploads, enhanced by a mobile-first PWA Client Intake App for guided workflows (Upload Bills, LGPD Consent, LOA Signing).
- **Bill-First Architecture**: Enforces a structured deal journey: Bill → ECOS → Dossier → RFQ. Bills are the foundational input for all subsequent processes.
  - **ECOS PRC Integration**: ECOS generation requires published PRC pricing rows, with robust resolver logic and idempotency.
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
- **PRC Upload Center**: Bulk upload and auto-parse pipeline for supplier Price Reference Circulars (PRCs) with status tracking and debug tools.
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