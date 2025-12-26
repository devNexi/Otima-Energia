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
- **Portal System**: Token-based access for client document uploads.
- **Data Models**: Comprehensive models for leads, clients, upload sessions, consumption profiles, and various quote/RFO processes.
- **ECOS™ System**: AI for contract analysis, lead snapshots, renewal tracking, and client energy profiles.
- **Deal OS**: Revenue-control and deal-execution system with an explicit state machine, auditability, commission tracking, and immutable records.
- **Client Dossier**: Canonical energy profile for each client, serving as the foundational data for RFQ workflows, with status gates and immutability after RFQ.
- **RFQ Adapter Layer**: Multi-channel RFQ automation with templated messages and token replacement for various communication channels.
- **Commission OS**: Usage tracking, reconciliation, and case management built on Deal OS, with detailed database tables and API endpoints for financial operations.
- **Notification System**: Email notification infrastructure for operational alerts (e.g., `DEAL_BLOCKED`, `SLA_BREACH`), utilizing a queue-based approach.
- **Lost Deal Intelligence**: Structured taxonomy for tracking reasons for lost deals, including client, supplier, competitive, and process categories, with analytics API.

### Authentication & Authorization
- **Role-Based Access Control**: `admin`, `ops`, `sales` roles.
- **Auth Flow**: Session-based authentication.

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