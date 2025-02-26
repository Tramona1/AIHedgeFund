# AI Hedge Fund - Backend API

This is the backend API for the AI Hedge Fund platform. It provides the server-side functionality for handling stock updates, user preferences, AI triggers, and notifications.

## Features

- RESTful API endpoints for:
  - Stock updates and alerts
  - User preferences management
  - AI triggers processing
  - Notifications handling
- Database integration with Supabase/PostgreSQL
- Email notifications via SendGrid

## Setup

### Prerequisites

- Node.js 18+ and pnpm installed
- Supabase project set up for database
- SendGrid account (for email notifications)

### Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Update the variables in `.env`:

```
# Database
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/[database]

# API
PORT=3000
API_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# SendGrid (Email)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@example.com
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

# Or specifically for the API
pnpm --filter api dev
```

The API will be available at [http://localhost:3000](http://localhost:3000).

## Building for Production

To build the API for production:

```bash
# From the root of the monorepo
pnpm build

# Or specifically for the API
pnpm --filter api build
```

## API Endpoints

### Stock Updates

- `GET /api/updates` - Get all stock updates
- `GET /api/updates/:ticker` - Get updates for a specific ticker
- `POST /api/updates` - Create a new stock update

### User Preferences

- `GET /api/users/:userId/preferences` - Get user preferences
- `PUT /api/users/:userId/preferences` - Update user preferences

### AI Triggers

- `POST /api/triggers` - Receive AI trigger
- `GET /api/triggers/:ticker` - Get AI triggers for specific ticker
- `POST /api/triggers/test-notification` - Send test notification

## Architecture

The API follows these architectural principles:

1. **Modular Architecture**: Separate routes and services for each feature
2. **Type Safety**: TypeScript throughout the application
3. **ORM**: Drizzle ORM for database operations
4. **Middleware**: Application-wide middleware for logging, CORS, etc.
5. **Validation**: Input validation using Zod
6. **Error Handling**: Consistent error handling across the API 