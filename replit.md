# Ótima Energia

## Overview

Ótima Energia is a tech-driven energy brokerage platform for the Brazilian free electricity market. The application serves as both a marketing website and a CRM-lite system for managing client leads, bill uploads, and quote requests. The platform enables both inbound (website visitors) and outbound (sales team) client acquisition workflows with a unique portal link system for document uploads.

## User Preferences

Preferred communication style: Simple, everyday language.

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

## Zoho CRM Integration (Future)

All client-facing tables include `zoho_id` fields for future bidirectional sync:
- `leads.zoho_id` - Maps to Zoho Leads module
- `clients.zoho_id` - Maps to Zoho Contacts module
- `quote_requests.zoho_id` - Maps to Zoho Deals module

Webhook endpoint `/api/webhooks/zoho-sync` is ready to receive Zoho notifications.
Manual sync endpoint `/api/admin/sync-to-zoho` is ready for push operations.