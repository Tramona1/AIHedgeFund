# AI Hedge Fund - Frontend Web Application

This is the frontend web application for the AI Hedge Fund platform. It provides a user interface for interacting with the platform's features including stock updates, alerts, and user preferences.

## Features

- User authentication with Supabase
- Dashboard with stock updates and alerts
- User preferences management
- Responsive design for mobile and desktop

## Setup

### Prerequisites

- Node.js 18+ and pnpm installed
- Backend API running (typically on http://localhost:3000)
- Supabase account and project set up

### Environment Variables

1. Copy the example environment file:

```bash
cp .env.local.example .env.local
```

2. Update the variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Installation

From the root of the monorepo:

```bash
pnpm install
```

## Development

To run the development server:

```bash
# From the root of the monorepo
pnpm dev

# Or specifically for the web app
pnpm --filter web dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Building for Production

To build the application for production:

```bash
# From the root of the monorepo
pnpm build

# Or specifically for the web app
pnpm --filter web build
```

## Folder Structure

- `/src/app` - Next.js app router pages
- `/src/components` - React components
  - `/ui` - UI components (Button, Card, etc.)
  - `/layout` - Layout components (Header, Footer, etc.)
- `/src/lib` - Utility functions and API services
- `/src/context` - React context providers

## Architecture

The frontend follows these architectural principles:

1. **Component-Based Design**: Reusable UI components for consistent design
2. **App Router**: Leveraging Next.js App Router for routing and layouts
3. **Client-Server Pattern**: Data fetching with React Server Components where possible
4. **TypeScript**: Type safety throughout the application
5. **Authentication**: Supabase for user authentication and session management
6. **API Integration**: Custom API client for interacting with the backend 