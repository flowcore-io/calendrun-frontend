# CalendRun Frontend

Next.js 16 frontend application for CalendRun, deployed to Vercel.

## Architecture

- **Framework**: Next.js 16 with React 19
- **Deployment**: Vercel
- **Authentication**: NextAuth with Keycloak
- **Event Ingestion**: Emits events to Flowcore ingestion endpoint for write operations
- **Data Reading**: Calls backend API (`calendrun-backend`) for read operations

## Prerequisites

- Node.js >= 22.16.0
- Yarn package manager
- Flowcore API key
- Keycloak realm access
- Backend API URL (for read operations)

## Getting Started

### Installation

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Set up environment variables:**
   - Copy `env.example` to `.env.local`
   - Fill in all required values (see Environment Variables section below)

3. **Start development server:**
   ```bash
   yarn dev
   ```
   
   The application will be available at `http://localhost:3000`

## Environment Variables

See `env.example` for all required environment variables:

- **NextAuth**: `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (optional on Vercel)
- **Keycloak**: `KEYCLOAK_ISSUER`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`
- **Flowcore**: `FLOWCORE_INGESTION_BASE_URL`, `FLOWCORE_TENANT`, `FLOWCORE_DATA_CORE_ID`, `FLOWCORE_API_KEY`
- **Backend API**: `NEXT_PUBLIC_BACKEND_API_URL`, `BACKEND_API_KEY` (optional)

## Scripts

- `yarn dev` - Start development server with Turbo
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn format` - Format code with Biome
- `yarn format:check` - Check code formatting
- `yarn typecheck` - Run TypeScript type checking
- `yarn test:e2e` - Run Playwright E2E tests
- `yarn test:e2e:ui` - Run Playwright tests with UI
- `yarn test:e2e:report` - Show Playwright test report

## Deployment

### Vercel

The frontend is deployed to Vercel. Configuration is in `vercel.json`:

- **Framework**: Next.js (auto-detected)
- **Root Directory**: Not needed (repository root is the frontend)
- **Build Command**: `yarn build` (default)
- **Output Directory**: `.next` (default)

### Environment Variables

Ensure all environment variables from `env.example` are set in the Vercel project settings.

### Backend Integration

The frontend communicates with the backend API via `NEXT_PUBLIC_BACKEND_API_URL`. Ensure this is set correctly in your Vercel environment variables.

## Project Structure

```
calendrun-frontend/
├── src/
│   ├── app/              # Next.js app router pages and API routes
│   ├── components/       # React components
│   ├── lib/              # Utility functions and services
│   ├── i18n/            # Internationalization
│   └── theme/           # Theme configuration
├── public/              # Static assets
├── tests/               # E2E tests (Playwright)
└── vercel.json          # Vercel configuration
```

## Development Status

✅ **Completed:**
- Next.js 16 application setup
- Authentication with NextAuth and Keycloak
- Flowcore event emission infrastructure
- Backend API client for read operations
- Internationalization (i18n) support
- PWA support
- E2E testing setup

## Related Repositories

- **Backend**: [`flowcore-io/calendrun-backend`](https://github.com/flowcore-io/calendrun-backend) - Bun.js backend service

