# ST Eventos - Portal de Inscrições

## Overview

ST Eventos is a Brazilian sports event registration platform focused on running events (marathons, trail runs, and road races). The application enables athletes to browse upcoming events, register for races, manage their registrations, and maintain their athlete profiles. The platform emphasizes mobile-first design with an athletic aesthetic inspired by platforms like Strava and Nike Run Club, adapted for the Brazilian market.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing

**UI Component System**
- shadcn/ui component library (New York style variant) built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Custom color palette: Navy Blue (#032c6b) primary, Yellow (#e8b73d) accent, White backgrounds
- Inter font family from Google Fonts for clean athletic readability
- Mobile-first responsive design with breakpoint-based layouts

**State Management**
- TanStack Query (React Query) for server state management and API data caching
- React Hook Form with Zod validation for form state and validation
- Local component state with React hooks for UI interactions

**Design System**
- Custom CSS variables for theming (light mode defined)
- Elevation system using opacity-based overlays for hover/active states
- Consistent spacing primitives based on Tailwind's spacing scale
- Shadow system for depth and card elevation

### Backend Architecture

**Server Framework**
- Express.js for HTTP server and API routing
- Node.js runtime with ES modules
- Middleware for JSON parsing, logging, and request tracking

**Data Layer**
- Drizzle ORM for type-safe database operations
- PostgreSQL database (configured for Neon serverless)
- Schema-first approach with Drizzle-Zod integration for runtime validation

**Database Schema (Supabase PostgreSQL)**

*Authentication & Authorization Tables:*
- `admin_users` table: Administrative users (superadmin, admin, organizer) with email/password authentication, role-based permissions, status (ativo, inativo, bloqueado), and optional link to organizer
- `permissions` table: System permissions by module (eventos.criar, inscricoes.exportar, etc.)
- `role_permissions` table: Links roles to their allowed permissions

*Business Entity Tables:*
- `organizers` table: Event organizers (companies or individuals) with CPF/CNPJ, contact info
- `events` table: Running events with mandatory total capacity limit (`limiteVagasTotal`), status (rascunho, publicado, cancelado, finalizado), inscription dates, shirt delivery options
- `modalities` table: Race modalities (5km, 10km, 21km, Kids, PCD) with distance, schedule, optional per-modality capacity limit (`limiteVagas`), access type (free, paid, voucher, PCD, manual approval)
- `shirt_sizes` table: T-shirt inventory - global per event OR per modality (rare case)
- `registration_batches` table: Pricing lots with automatic switching based on date or quantity limits
- `prices` table: Price per Modality + Batch combination
- `attachments` table: Event documents (regulations, terms) with mandatory acceptance flags
- `athletes` table: User profiles with CPF, personal data, contact info
- `orders` table: Groups multiple registrations into a single purchase order with payment info, voucher codes, and status (pendente, pago, cancelado, reembolsado, expirado)
- `registrations` table: Individual registrations linked to order, event, modality, batch, athlete with unit price
- `document_acceptances` table: Tracks which documents each athlete accepted and when

**User Roles & Permissions**
- `superadmin`: Full system access, can manage all admins and users
- `admin`: Can create/edit organizers and events, but cannot manage other admins
- `organizador`: Read-only access to their own event data (dashboard, registrations, exports)

**Entity Relationships**
- 1 Organizer -> many Events
- 1 Event -> many Modalities
- 1 Event -> 1 global Shirt Grid OR many per-modality Grids (rare)
- 1 Event -> many Registration Batches
- 1 Modality + 1 Batch -> 1 Price
- 1 Event -> many Attachments
- 1 Event -> many Orders
- 1 Order -> many Registrations (same or different athletes)
- 1 Athlete -> many Orders (as buyer)
- 1 Athlete -> many Registrations (as participant)
- 1 Registration -> many Document Acceptances

**Business Rules**
- **Event capacity (Priority 1)**: Every event MUST have a total capacity limit (`limiteVagasTotal`) - no unlimited option
- **Modality capacity (Priority 2)**: Per-modality limits (`limiteVagas`) are optional; if set, sum cannot exceed event total capacity
- Order-based checkout: Multiple registrations can be grouped in a single order for unified payment
- Order can include registrations for different athletes (e.g., parent registering children)
- Order can include same athlete in different modalities
- Payment is processed at order level, not individual registration
- When order is paid, all associated registrations are confirmed
- Batch auto-switching: When a batch reaches its quantity limit or end date, the next batch becomes active
- Shirt inventory: Decremented atomically during registration, throws error if exhausted
- Price lookup: Determined by active batch + selected modality combination

**Development Infrastructure**
- In-memory storage fallback for development (`MemStorage` class)
- Hot module replacement via Vite middleware in development
- Separate build outputs for client (static assets) and server (bundled ESM)

### Route Structure

**Admin API Routes (Implemented)**

*Authentication*
- `POST /api/admin/auth/setup` - Initial superadmin setup (only works when no users exist)
- `POST /api/admin/auth/login` - Admin login with email/password
- `POST /api/admin/auth/logout` - Admin logout
- `GET /api/admin/auth/me` - Get current admin user

*Organizers CRUD*
- `GET /api/admin/organizers` - List all organizers
- `GET /api/admin/organizers/:id` - Get organizer by ID
- `POST /api/admin/organizers` - Create organizer
- `PATCH /api/admin/organizers/:id` - Update organizer
- `DELETE /api/admin/organizers/:id` - Delete organizer

*Events CRUD*
- `GET /api/admin/events` - List events (filtered by organizer for organizador role)
- `GET /api/admin/events/:id` - Get event by ID
- `GET /api/admin/events/:id/full` - Get event with all related data
- `POST /api/admin/events` - Create event
- `PATCH /api/admin/events/:id` - Update event
- `PATCH /api/admin/events/:id/status` - Change event status (with validation)
- `DELETE /api/admin/events/:id` - Delete event (only draft without registrations)

*Modalities CRUD*
- `GET /api/admin/events/:eventId/modalities` - List modalities
- `POST /api/admin/events/:eventId/modalities` - Create modality
- `PATCH /api/admin/events/:eventId/modalities/:id` - Update modality
- `PATCH /api/admin/events/:eventId/modalities/reorder` - Reorder modalities
- `DELETE /api/admin/events/:eventId/modalities/:id` - Delete modality

*Batches (Lotes) CRUD*
- `GET /api/admin/events/:eventId/batches` - List batches
- `POST /api/admin/events/:eventId/batches` - Create batch
- `PATCH /api/admin/events/:eventId/batches/:id` - Update batch
- `DELETE /api/admin/events/:eventId/batches/:id` - Delete batch

*Prices CRUD*
- `GET /api/admin/events/:eventId/prices` - List prices
- `POST /api/admin/events/:eventId/prices` - Create price
- `PATCH /api/admin/events/:eventId/prices/:id` - Update price
- `PUT /api/admin/events/:eventId/prices/bulk` - Bulk create/update prices
- `DELETE /api/admin/events/:eventId/prices/:id` - Delete price

*Shirt Sizes CRUD*
- `GET /api/admin/events/:eventId/shirts` - List shirt sizes
- `POST /api/admin/events/:eventId/shirts` - Create shirt size
- `PATCH /api/admin/events/:eventId/shirts/:id` - Update shirt size
- `DELETE /api/admin/events/:eventId/shirts/:id` - Delete shirt size

*Attachments CRUD*
- `GET /api/admin/events/:eventId/attachments` - List attachments
- `POST /api/admin/events/:eventId/attachments` - Create attachment
- `PATCH /api/admin/events/:eventId/attachments/:id` - Update attachment
- `DELETE /api/admin/events/:eventId/attachments/:id` - Delete attachment

**Public API Routes**
- `GET /api/events` - List published events
- `GET /api/events/:slug` - Get published event with modalities, active batch, and prices

**Public Frontend Routes**
- `/` - Event listing page with search functionality
- `/login` - Authentication via CPF and birth date
- `/cadastro` - New athlete registration
- `/evento/:slug` - Event detail page

**Registration Flow**
- `/evento/:slug/inscricao/participante` - Select registration type (self/other)
- `/evento/:slug/inscricao/modalidade` - Choose race distance, shirt size, and handle special category verification
- `/evento/:slug/inscricao/resumo` - Review registration details and add team
- `/evento/:slug/inscricao/pagamento` - Payment with discount code support

**Special Category Verification System**
- Support for race categories requiring verification (e.g., public servants, PCD)
- Two verification types configurable per category:
  - **Confirmation Code**: Participant must enter a verification code provided by organizers
  - **Pre-approval**: Registration marked for manual review, participant notified via email
- Admin can configure per category: verification requirement, type, and custom message
- Verification codes stored in `inscricoes.codigoComprovacao` field

**Authenticated Routes**
- `/minhas-inscricoes` - User's orders and registrations grouped by pedido (upcoming and completed)
- `/inscricao/:id` - Individual registration detail page with QR code, event info, participant data, and payment summary
- `/minha-conta` - Athlete profile management with navigation to registrations and participants
- `/participantes` - Participant management page (prepared for multi-participant feature)

### Key Architectural Decisions

**Path Aliasing**
- `@/*` maps to `client/src/*` for component imports
- `@shared/*` maps to `shared/*` for shared types and schemas
- `@assets/*` maps to `attached_assets/*` for images and media

**Type Safety**
- Shared schema definitions between client and server using Drizzle-Zod
- TypeScript strict mode enabled across the codebase
- Runtime validation with Zod schemas derived from database schema

**Session Management**
- Express sessions with PostgreSQL session store (`connect-pg-simple`)
- Cookie-based authentication (implementation currently using mocks)

**Build Process**
- Client: Vite builds React app to `dist/public`
- Server: esbuild bundles Express server to `dist/index.js`
- Production mode serves static files from build output

## External Dependencies

### Core Libraries
- **@neondatabase/serverless** - Neon PostgreSQL serverless driver
- **drizzle-orm** - Type-safe ORM with PostgreSQL dialect
- **drizzle-kit** - Database migrations and schema management

### UI Components
- **@radix-ui/* packages** - Accessible component primitives (dialogs, dropdowns, forms, etc.)
- **@tanstack/react-query** - Server state management
- **react-hook-form** with **@hookform/resolvers** - Form management
- **zod** - Schema validation
- **date-fns** - Date formatting and manipulation

### Styling
- **tailwindcss** - Utility-first CSS framework
- **class-variance-authority** - Component variant styling
- **tailwind-merge** with **clsx** - Conditional class merging

### Development Tools
- **@replit/vite-plugin-*** - Replit-specific development enhancements
- **tsx** - TypeScript execution for development server
- **esbuild** - Production server bundling

### Design Assets
- Google Fonts (Inter) - Typography
- Generated running/marathon images stored in `attached_assets/generated_images/`

### Browser APIs
- Fetch API for HTTP requests with credentials (session cookies)
- Local state for multi-step registration wizard
- URL search parameters for passing registration data between steps