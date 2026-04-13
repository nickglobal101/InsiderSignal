# InsiderSignal - Institutional Trading Intelligence Platform

## Overview

InsiderSignal is a financial intelligence web application that tracks Fortune 500 CEO, Congressional, and Institutional stock trades. The platform provides AI-powered pattern detection to identify potentially significant trading activity before market movements. Users can monitor insider trades from SEC Form 4 filings, congressional trades from STOCK Act disclosures, institutional 13F filings from major funds like Softbank, BlackRock and Berkshire Hathaway, and receive AI-generated alerts about unusual trading patterns.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state and data fetching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming (light/dark mode support)
- **Design System**: Carbon Design System-inspired approach optimized for data-intensive displays
- **Charts**: Recharts library for data visualization (timeline charts, volume charts)

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful JSON API with endpoints under `/api/*`
- **Build Process**: Custom build script using esbuild for server bundling, Vite for client

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all database table definitions
- **Current Implementation**: `DatabaseStorage` class extends `MemStorage` and persists critical data to PostgreSQL:
  - **Users**: Fully database-backed (create, read, update subscription)
  - **IPOs**: Database-backed with PostgreSQL
  - **Institutional Funds & Trades**: Database-backed with PostgreSQL
  - **Trade AI Insights**: Database-backed for caching
  - Other data (insider trades, congressional trades, alerts) uses in-memory storage with API fetching
- **Database Config**: Drizzle Kit configured for PostgreSQL migrations

### Key Data Models
- **Insider Trades**: SEC Form 4 filings with executive, company, trade type, value, shares
- **Congressional Trades**: STOCK Act disclosures with member info, party, chamber, amounts
- **Alerts**: AI-generated pattern detection alerts with severity levels
- **Companies & Executives**: Reference data for tracking
- **Social Buzz**: Reddit trending stocks from ApeWisdom API with mentions, upvotes, and sentiment
- **Institutional Funds**: Major institutional investors (SoftBank, BlackRock, Berkshire Hathaway, Vanguard, ARK, Renaissance Technologies, Bridgewater, Citadel)
- **Institutional Trades**: 13F filings tracking fund position changes with significance levels (high/medium/low)
- **Data Source Status**: Connection health tracking for each API (SEC, Congressional, Reddit)
- **IPOs**: Full lifecycle IPO tracking with three stages:
  - **Rumored**: Pre-filing stage - companies expected to go public based on analyst reports/news
  - **Filed**: SEC S-1 submitted - in regulatory review process
  - **Priced**: IPO priced and ready to trade or trading
  - Includes source attribution (sourceUrl, sourceName) for data provenance on every IPO
- **Alert Preferences**: User notification settings (email alerts, frequency, severity filters)
- **Email Notifications**: History of sent email alerts for premium users

### Freemium Tier Structure
- **Free Tier**: 7-day data history, view-only alerts, limited features
- **Premium Tier**: Full historical data, IPO tracking & alerts, email notifications, custom watchlists, AI pattern analysis, data exports, priority refresh

### Background Services
- **Scheduler** (`server/scheduler.ts`): Runs IPO checks every 4 hours, sends daily digest emails at 8 AM
- **Email Service** (`server/email-service.ts`): Abstracted email provider using Resend (easily swappable)
- **IPO Fetcher** (`server/ipo-fetcher.ts`): Fetches from FMP IPO endpoints (requires premium FMP API key)

### Authentication
- **Type**: Email/password authentication with Passport.js local strategy
- **Password Security**: Node.js scrypt with per-user salt and constant-time comparison
- **Sessions**: Stored in PostgreSQL using connect-pg-simple
- **Key Files**: `server/auth.ts` (auth logic), `client/src/hooks/useAuth.ts` (auth hook)

### AI Integration
- **Provider**: OpenAI GPT-4o for pattern analysis and trade insights
- **Pattern Detection**: Analyzes trading data to detect unusual patterns (cluster selling, coordinated activity)
- **AI Trade Insights** (Premium Feature):
  - Deep analysis of individual trades with motivations and context
  - Context aggregation: includes recent trades for same ticker/executive/fund
  - Generates 2-3 paragraph analysis, 3-5 key points, and confidence score
  - Cached in database to minimize API costs
  - Includes required educational disclaimer (not financial advice)
- **Implementation**: Lazy-loaded client to gracefully handle missing API keys
- **Key Files**: `server/trade-insights.ts` (insight generation), `client/src/components/AIInsightPanel.tsx` (UI component)

### Application Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    pages/        # Route-level page components
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  routes.ts       # API endpoint definitions
  storage.ts      # Data access layer
  ai-analysis.ts  # OpenAI integration
  sec-api.ts      # SEC data fetching utilities
shared/           # Shared code between client/server
  schema.ts       # Drizzle schema and Zod types
```

## External Dependencies

### APIs and Services
- **OpenAI API**: Used for AI-powered pattern analysis of trading data (optional - gracefully degrades if not configured)
- **SEC EDGAR**: Data source for insider trading filings (rate-limited to 10 requests/second per SEC requirements)
- **ApeWisdom API**: Reddit stock sentiment data from r/wallstreetbets, r/stocks, etc. (free, no auth required)
- **House/Senate Stock Watcher**: Congressional trade data sources

### Database
- **PostgreSQL**: Primary database (configured via `DATABASE_URL` environment variable)
- **Drizzle Kit**: Database migration tooling (`npm run db:push`)

### Key NPM Packages
- **@tanstack/react-query**: Server state management
- **drizzle-orm / drizzle-zod**: Database ORM and schema validation
- **recharts**: Chart library for data visualization
- **wouter**: Lightweight client-side routing
- **openai**: OpenAI API client
- **express**: Web server framework
- **zod**: Runtime type validation

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session encryption
- `FMP_API_KEY`: Financial Modeling Prep API key (for congressional trading data)
- `OPENAI_API_KEY`: OpenAI API key (optional - enables AI pattern analysis)