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
   - Copy `env.development.local.example` to `.env.development.local`
   - Fill in your personal values (secrets, Keycloak credentials, etc.)
   - Team defaults are already in `.env.development` (committed)
   - **Note**: `.env.development.local` takes precedence over `.env.development`

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
- **Dev Mode**: `NEXT_PUBLIC_DEV_MODE` (optional, set to "true" for dev environment)

### Dev Mode Configuration

When running in dev mode:
- Set `NEXT_PUBLIC_DEV_MODE=true` to enable dev mode UI indicators and use dev datacore
- Set `NEXT_PUBLIC_BACKEND_API_URL=http://localhost:18765` to point to local backend
- Set `FLOWCORE_DATA_CORE_ID` to the dev datacore ID (from `bun run dev:flowcore:setup` in backend)
- **Important**: In dev mode, set `FLOWCORE_DATA_CORE_ID` to the dev datacore ID (e.g., `a19e4471-7813-4d6b-bec3-676ab8f219c6`)

**Note**: Next.js automatically loads `.env.development` when `NODE_ENV=development`, so you can use `.env.development` instead of `.env.local` for dev-specific configuration.

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

### Dev/Test Environment Scripts

- `yarn dev:frontend` - Start frontend pointing to dev backend
- `yarn test:e2e:dev` - Run E2E tests against dev environment
- `yarn dev:test:setup` - Verify dev environment is ready

See the [CalendRun Dev/Test Environment Setup Guide](https://usable.dev/fragments) in Usable for detailed documentation.

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

