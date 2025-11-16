# SPI Tool

Spotify Popularity Intelligence (SPI) Tool - A Next.js 14 application for tracking and analyzing Spotify artist and track popularity metrics.

## Features

- **Artist & Track Search**: Search by artist name, track name, or Spotify links
- **SPI Tracking**: Monitor Spotify Popularity Index (SPI) over time with historical charts
- **Event Logging**: Track user interactions and API usage
- **Admin Dashboard**: View events, metrics, and analytics with filtering capabilities
- **Automatic Snapshots**: Cron job support for capturing popularity snapshots

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Prisma)
- **Charts**: Chart.js + react-chartjs-2
- **Validation**: Zod
- **HTTP Client**: Axios
- **Date Handling**: Day.js

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (e.g., Supabase)
- Spotify API credentials

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables. Create a `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Spotify API
SPOTIFY_CLIENT_ID="your_spotify_client_id"
SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"

# Admin Authentication
# Console uses DB-backed session auth. Seed the initial owner via env:
ADMIN_OWNER_EMAIL="owner@example.com"
ADMIN_OWNER_PASSWORD="strong_password_here"
# Session secret for signing cookies
SESSION_SECRET="your_session_secret"

# Cron Secret (for protecting snapshot endpoint)
CRON_SECRET="your_secret_key"

# Brand Information (optional, displayed on homepage)
NEXT_PUBLIC_BRAND_TITLE="SPI Tool"
NEXT_PUBLIC_BRAND_DESC="Spotify Popularity Intelligence"
NEXT_PUBLIC_BRAND_EMAIL="contact@example.com"
NEXT_PUBLIC_BRAND_WECHAT="your_wechat_id"
NEXT_PUBLIC_BRAND_LINKS="Instagram:https://instagram.com/...,Website:https://example.com"
```

3. Set up the database:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Environment Variables

### Required

- `DATABASE_URL`: PostgreSQL connection string
- `SPOTIFY_CLIENT_ID`: Spotify API client ID
- `SPOTIFY_CLIENT_SECRET`: Spotify API client secret

### Optional

- `API_REQUEST_KEY`: If set, `x-api-key` header is required for public APIs (search/event)
- `CRON_SECRET`: Secret key for protecting `/api/cron/snapshot` endpoint
- `NEXT_PUBLIC_BRAND_*`: Brand information displayed on the homepage
- `SESSION_SECRET`: Secret used to sign admin session cookies
- `ADMIN_OWNER_EMAIL`, `ADMIN_OWNER_PASSWORD`, `ADMIN_OWNER_NAME`: Seed the initial owner account for the admin console

## Setting Up CRON Jobs

### Vercel Cron

If deploying to Vercel, add a `vercel.json` file:

```json
{
  "crons": [
    {
      "path": "/api/cron/snapshot",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Then set the `CRON_SECRET` environment variable in Vercel and configure the cron job to include the header:

```
x-cron-key: your_cron_secret
```

### Manual Setup

You can also call the endpoint manually or set up a cron job on your server:

```bash
curl -X POST https://your-domain.com/api/cron/snapshot \
  -H "x-cron-key: your_cron_secret"
```

The snapshot endpoint will:
1. Prioritize queued ingest requests from first-time artist views
2. Fetch remaining artists from the database
3. Refresh their popularity and ingest full track lists
4. Create snapshots and update the database

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   │   ├── search/    # Search endpoint
│   │   ├── artist/     # Artist data endpoint
│   │   ├── track/      # Track data endpoint
│   │   ├── event/      # Event logging endpoint
│   │   └── cron/       # Snapshot cron endpoint
│   ├── artist/         # Artist detail page
│   ├── track/          # Track detail page
│   ├── admin/          # Admin dashboard
│   └── page.tsx        # Homepage
├── components/         # React components
│   ├── admin/          # Admin components
│   ├── brand/          # Brand card
│   ├── charts/         # Chart components
│   ├── search/         # Search form
│   └── tables/         # Data tables
└── lib/
    ├── services/       # Business logic
    ├── spotify.ts      # Spotify API client
    └── prisma.ts       # Prisma client
```

## API Endpoints

- `GET /api/search?q=<query>` - Search for artists or tracks
- `GET /api/artist/[id]` - Get artist details and tracks
- `GET /api/track/[id]` - Get track details
- `POST /api/event` - Log an event
- `GET /api/event` - Get events with filters
- `POST /api/cron/snapshot` - Run snapshot cron (protected)
- `POST /api/admin/seed` - Seed artists/tracks and optionally snapshot now (protected)
- `POST /api/admin/auth/login` - Admin login (sets session cookie)
- `POST /api/admin/auth/logout` - Admin logout (clears session cookie)
- `GET/POST /api/admin/users` - List/create admin users (owner only)
- `PATCH /api/admin/users/[id]` - Update admin user (enable/disable/reset password, owner only)

## Building for Production

```bash
npm run build
npm start
```

## License

MIT
