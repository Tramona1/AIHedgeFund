# AI Hedge Fund

A personalized stock update service that provides users with insights about hedge fund activities, investor mentions, and market shifts.

## Features

- Weekly personalized email updates based on user preferences
- Real-time alerts for critical market events (Phase 2)
- User preference customization (Phase 2)
- Internal dashboard for monitoring stock updates (Phase 3)

## Tech Stack

### Backend
- Hono (API routing)
- Drizzle (Database ORM)
- Supabase (PostgreSQL)
- SendGrid (Email delivery)

### Frontend
- Next.js 15 (React framework)
- Shadcn/ui (UI components)
- Tailwind CSS (Styling)
- TanStack Query (Data fetching)

### Infrastructure
- pnpm (Package manager)
- Bun (Runtime)
- Vercel/Netlify (Hosting)

## Project Structure

```
ai-hedge-fund/
├── apps/
│   ├── api/            # Backend API (Hono, Drizzle)
│   └── web/            # Frontend Web (Next.js, Shadcn/ui)
├── packages/
│   ├── db/             # Database schema and utilities
│   ├── logger/         # Shared logging utilities
│   ├── id/             # ID generation utilities
│   └── ui/             # Shared UI components (future)
```

## Getting Started

1. Clone the repository
2. Install dependencies with `pnpm install`
3. Create a `.env` file in both `apps/api` and `apps/web` (see `.env.example`)
4. Start the development server with `pnpm dev`

## Development Phases

- Phase 1: Landing page and weekly email updates
- Phase 2: Real-time alerts, option flows, and user preferences
- Phase 3: Custom triggers, internal dashboard, and scalability

For more details on each phase, see the Project Phases and Deliverables document.

## License

[Your License Here] 