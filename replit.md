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