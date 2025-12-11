# ST Eventos - Portal de Inscrições

## Overview
ST Eventos is a Brazilian sports event registration platform specializing in running events (marathons, trail runs, road races). It allows athletes to find events, register for races, manage registrations, and maintain athlete profiles. The platform features a mobile-first, athletic design inspired by Strava and Nike Run Club, adapted for the Brazilian market. The business vision is to become the leading registration platform for running events in Brazil, offering a seamless experience for both athletes and event organizers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework:** React 18 with TypeScript.
- **Build:** Vite.
- **Routing:** Wouter for client-side routing.
- **UI:** shadcn/ui (New York style) built on Radix UI, styled with Tailwind CSS (custom color palette: Navy Blue primary, Yellow accent, Inter font). Mobile-first responsive design.
- **State Management:** TanStack Query for server state, React Hook Form with Zod for form validation, React hooks for local component state.
- **Design System:** Custom CSS variables, elevation system, consistent spacing, shadow system for depth.

### Backend
- **Server:** Express.js on Node.js (ES modules).
- **Data Layer:** Drizzle ORM, PostgreSQL (Neon serverless), schema-first with Drizzle-Zod.
- **Database Schema:** Includes tables for `admin_users`, `organizers`, `events`, `modalities`, `registrations`, `athletes`, `orders`, and more, with defined relationships.
- **User Roles:** `superadmin`, `admin`, `organizador` with role-based permissions.
- **Business Rules:** Mandatory event capacity (`limiteVagasTotal`), optional modality capacity (`limiteVagas`), order-based checkout supporting multiple registrations, payment at order level, batch auto-switching, and atomic shirt inventory decrement.
- **Batch Status System:** Registration batches use `status` field ('active'/'closed'/'future') for business logic and `ativo` boolean for visibility. Only one batch can have status='active' per event. Status changes are enforced through dedicated routes (/activate, /close, /set-future), not the generic PATCH endpoint. See `docs/lotes-status-e-visibilidade.md` for details.
- **Batch Deletion:** Batches with registrations (quantidadeUtilizada > 0) cannot be deleted. The API returns BATCH_HAS_REGISTRATIONS error code with a user-friendly message suggesting to close or deactivate instead.
- **Event Publishing:** When activating a batch in a non-published event, the API returns eventNeedsPublish flag. The admin UI shows a dialog asking if the user wants to publish the event along with activating the batch.
- **Development Infrastructure:** In-memory storage fallback for development, HMR via Vite, separate build outputs for client and server.

### Timezone Handling
- All operations adhere to São Paulo timezone (America/Sao_Paulo, UTC-3).
- Timestamps stored in UTC in the database, converted to São Paulo local time for API input/output using `date-fns-tz`.

### Key Architectural Decisions
- **Path Aliasing:** `@/*` for client, `@shared/*` for shared types/schemas, `@assets/*` for media.
- **Type Safety:** Shared Drizzle-Zod schemas, TypeScript strict mode, runtime validation.
- **Session Management:** Express sessions with PostgreSQL store, cookie-based authentication.
- **Build Process:** Vite for client, esbuild for server.

## External Dependencies

### Core Libraries
- `@neondatabase/serverless`: Neon PostgreSQL serverless driver.
- `drizzle-orm`, `drizzle-kit`: ORM and schema management.

### UI & Utilities
- `@radix-ui/*`: Accessible UI primitives.
- `@tanstack/react-query`: Server state management.
- `react-hook-form`, `@hookform/resolvers`, `zod`: Form management and validation.
- `date-fns`, `date-fns-tz`: Date formatting and timezone handling.

### Styling
- `tailwindcss`: Utility-first CSS.
- `class-variance-authority`, `tailwind-merge`, `clsx`: Component styling and class merging.

### Development Tools
- `@replit/vite-plugin-*`: Replit-specific enhancements.
- `tsx`: TypeScript execution.
- `esbuild`: Production server bundling.

### Design Assets
- Google Fonts (Inter).
- Generated running/marathon images (`attached_assets/generated_images/`).