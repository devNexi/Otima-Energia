# Ótima Energia

## Overview

Ótima Energia is a tech-driven energy brokerage platform for the Brazilian free electricity market. The application serves as both a marketing website and a CRM-lite system for managing client leads, bill uploads, and quote requests. The platform enables both inbound (website visitors) and outbound (sales team) client acquisition workflows with a unique portal link system for document uploads.

## User Preferences

Preferred communication style: Simple, everyday language.
Language: English only (the website is in Portuguese, but communicate with user in English).

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Forms**: React Hook Form with Zod validation
- **File Uploads**: Uppy with AWS S3 integration for bill uploads

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Build**: esbuild for server bundling, Vite for client
- **API Pattern**: RESTful endpoints under `/api/*` prefix

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with push strategy (`npm run db:push`)

### Key Data Models
- **Leads**: Website contact form submissions and manual entries
- **Clients**: Qualified leads with full business data
- **Upload Sessions**: Token-based portal access for bill uploads
- **Consumption Profiles**: Energy usage data extracted from bills
- **Quote Requests (RFQs)**: Client requests for supplier quotes
- **Supplier Quotes**: Responses from energy suppliers
- **RFO Requests**: Automated quote requests sent to multiple suppliers
- **RFO Supplier Tracking**: Per-supplier tracking for RFO responses
- **Supplier Contacts**: Multiple contacts per supplier for RFO distribution

### Portal System
The application implements a unique token-based portal system where:
1. Leads receive auto-generated portal links via email
2. Sales team can manually create clients and generate portal links
3. Clients upload energy bills through secure, token-authenticated pages
4. Optional access codes provide additional security layer

### Path Aliases
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets` → `./attached_assets/`

## External Dependencies

### Cloud Services
- **Google Cloud Storage**: Object storage via `@google-cloud/storage` for file uploads
- **Replit Object Storage**: Alternative storage with custom ACL policy system

### Database
- **PostgreSQL**: Primary database (connection via `DATABASE_URL` environment variable)
- **connect-pg-simple**: Session storage in PostgreSQL

### Key npm Packages
- **UI Components**: Full Radix UI primitive suite for accessible components
- **Email**: Nodemailer for sending portal links
- **Authentication**: Passport.js with passport-local strategy
- **Payments**: Stripe integration (prepared for future billing features)
- **Data Processing**: xlsx for spreadsheet handling, nanoid/uuid for ID generation

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `PUBLIC_OBJECT_SEARCH_PATHS`: Comma-separated paths for public object storage directories
- `PRIVATE_OBJECT_DIR`: Directory path for private file uploads

## Routes

### Public Routes
- `/` - Corporate website with hero video, process steps, and lead capture form
- `/sobre` - About page with company mission, approach, and differentiators
- `/equipe` - Team page with founders and brief bios
- `/parceiros` - Partners page with supplier grid and partnership form
- `/solucoes` - Detailed services breakdown (Economia, Soluções Financeiras, Sustentabilidade, Gestão Energética, Monitoramento)
- `/lei-mercado-livre` - Law 15.269/2025 explanation page with migration timeline
- `/faq` - 9 frequently asked questions about free energy market
- `/insights` - Blog/articles section with educational content
- `/seja-cliente` - Onboarding page with diagnosis form (submits to /api/leads)
- `/privacidade` - LGPD-compliant privacy policy
- `/termos` - Terms of use with free service and commission model explanation
- `/portal-cliente` - Client portal login page (UI ready, auth pending)
- `/portal/upload/:token` - Client portal for bill uploads (token-based access)

### Admin Routes
- `/admin` - Admin dashboard with:
  - Leads inbox (convert leads to clients)
  - Client management (create, view, generate upload links)
  - Quote requests management
  - Zoho sync button (placeholder for future integration)
  - **Language toggle**: English/Portuguese with localStorage persistence (default: Portuguese)

### API Endpoints
- `POST /api/leads` - Submit lead from contact form
- `GET /api/leads` - List all leads
- `POST /api/leads/:id/convert` - Convert lead to client
- `POST /api/leads/:id/portal-link` - Generate upload link for lead
- `POST /api/clients` - Create new client
- `GET /api/clients` - List all clients
- `POST /api/clients/:id/upload-link` - Generate upload link for client
- `GET /api/portal/upload/validate/:token` - Validate upload session token
- `POST /api/portal/upload/verify/:token` - Verify access code
- `POST /api/objects/upload` - Get presigned upload URL
- `POST /api/consumption-profiles` - Register uploaded file
- `POST /api/clients/:id/generate-portal` - Generate upload link for client (alias)
- `POST /api/webhooks/bill-uploaded` - Webhook for bill upload notifications
- `POST /api/webhooks/zoho-sync` - Zoho webhook (placeholder)
- `POST /api/admin/sync-to-zoho` - Manual Zoho sync (placeholder)

### RFO API Endpoints
- `POST /api/clients/:id/rfo` - Create new RFO for client
- `GET /api/clients/:id/rfo` - Get RFOs for specific client
- `GET /api/rfo` - List all RFOs
- `GET /api/rfo/:id` - Get RFO details with tracking
- `POST /api/rfo/:id/send` - Send RFO to selected suppliers
- `POST /api/rfo/:id/remind` - Send reminders to non-responsive suppliers
- `POST /api/rfo/:id/respond/:trackingId` - Record supplier response

### Supplier Contacts API
- `GET /api/suppliers/:id/contacts` - Get contacts for supplier
- `POST /api/suppliers/:id/contacts` - Add contact to supplier
- `PATCH /api/suppliers/:id/contacts/:contactId` - Update supplier contact
- `GET /api/supplier-contacts/active` - Get all active contacts

## ECOS™ System (MVP Complete)

ECOS™ (Energy Contract Optimization System) is the proprietary AI-driven platform for contract analysis and optimization.

### ECOS Features
1. **Lead ECOS Snapshots**: Pre-conversion analysis with market benchmarking
   - Risk flags: volatilityExposure, contractRigidity, timingRisk
   - Preview mode with watermarks for non-converted leads
   - Band analysis (within_band, above_band, at_risk)

2. **Contract Renewal Tracker**: Proactive contract management
   - Alert thresholds: 180 days (info), 120 days (warning), 90 days (urgent)
   - Dashboard widget showing contracts requiring action
   - renewalStatus, alertStatus, nextActionDate tracking

3. **Benchmark Review Engine**: Market rate validation
   - Status classification: Active, Needs Review, Archived
   - 90-day review cycle with overdue detection
   - Dashboard widget showing benchmarks needing attention

4. **Audit Trail**: Decision history with benchmark references
   - Tracks benchmark ID, reference range, confidence score
   - Links decisions to benchmark data for transparency
   - ECOS History tab in Client Energy Profile

5. **Client Energy Profile**: Comprehensive client analytics
   - Quarterly reports with health scores
   - ECOS decisions with recommendations
   - Contract and consumption analytics

### ECOS API Endpoints
- `GET /api/ecos/contract-alerts` - Get contracts requiring attention
- `GET /api/ecos/benchmark-review-status` - Get benchmarks needing review
- `GET /api/ecos/clients/:id/audit-trail` - Get audit trail for client
- `GET /api/clients/:id/energy-profile` - Get ECOS energy profile

## Authentication & Authorization

### Role-Based Access Control
Users have roles that determine feature access:
- **admin**: Full access to all features including admin settings
- **ops**: Access to ECOS, clients, leads, RFO, benchmarks (no admin settings)
- **sales**: Access to clients, leads, RFO only

### Auth Flow
- Session-based authentication stored in localStorage
- Login required for /admin routes
- User info displayed in header with role badge
- AuthContext provides: login, logout, hasRole(), canAccess()

### Auth API Endpoints
- `POST /api/auth/register` - Create new user (with optional role)
- `POST /api/auth/login` - Authenticate and create session
- `POST /api/auth/logout` - End current session
- `GET /api/auth/me` - Get current user and session info
- `GET /api/auth/setup-required` - Check if initial setup needed

## Zoho CRM Integration (Future)

All client-facing tables include `zoho_id` fields for future bidirectional sync:
- `leads.zoho_id` - Maps to Zoho Leads module
- `clients.zoho_id` - Maps to Zoho Contacts module
- `quote_requests.zoho_id` - Maps to Zoho Deals module

Webhook endpoint `/api/webhooks/zoho-sync` is ready to receive Zoho notifications.
Manual sync endpoint `/api/admin/sync-to-zoho` is ready for push operations.