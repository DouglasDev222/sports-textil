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

**Database Schema**
- `athletes` table: User profiles with CPF, personal data, contact info, and demographics
- `events` table: Running events with details, locations, distances, pricing, and metadata
- `pedidos` table: Order records that group one or more registrations, with order number, user reference, status, total value, and discount info
- `inscricoes` table: Registration records linked to pedidos and events, containing registration number, athlete, modality, payment, status, and verification codes

**Order/Registration Hierarchy**
- A "Pedido" (order) groups one or more "Inscrições" (registrations)
- Users can register multiple participants for the same or different events in a single order
- Each registration has a unique `numeroInscricao` for identification
- Each order has a unique `numeroPedido` for tracking

**Development Infrastructure**
- In-memory storage fallback for development (`MemStorage` class)
- Hot module replacement via Vite middleware in development
- Separate build outputs for client (static assets) and server (bundled ESM)

### Route Structure

**Public Routes**
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