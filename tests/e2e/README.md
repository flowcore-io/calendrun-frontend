# E2E Testing with Playwright

This project uses Playwright for end-to-end testing with **real Keycloak authentication** instead of auth bypass.

## Setup

1. **Install dependencies:**
   ```bash
   yarn install
   yarn playwright install chromium
   ```

2. **Configure test credentials** in one of these files (loaded in priority order):
   - `.env.development.local` (highest priority, gitignored)
   - `.env.local` (gitignored)
   - `.env.development` (can be committed)
   
   ```bash
   KEYCLOAK_TEST_USER=your-test-username
   KEYCLOAK_TEST_USER_PASSWORD=your-test-password
   ```

   These credentials should be valid Keycloak users in your `calendrun` realm at `https://auth.flowcore.io`.

## Running Tests

```bash
# Run all tests
yarn test:e2e

# Run tests with UI
yarn test:e2e:ui

# View test report
yarn test:e2e:report
```

## How It Works

1. **Authentication Setup** (`auth.setup.ts`):
   - Runs once before all tests
   - Logs in to Keycloak using `KEYCLOAK_TEST_USER` credentials
   - Saves the authenticated session to `.auth/user.json`

2. **Test Execution** (`keycloak-auth.spec.ts`):
   - Authenticated tests use the saved session state
   - Public page tests don't require authentication

3. **Session Reuse**:
   - The authenticated session is reused across all tests
   - No need to log in for each test
   - Faster test execution

## Test Structure

- **`auth.setup.ts`** - Authenticates once before all tests
- **`keycloak-auth.spec.ts`** - Main test suite with authenticated and public tests

## CI/CD

For CI environments, ensure these environment variables are set:
- `KEYCLOAK_TEST_USER`
- `KEYCLOAK_TEST_USER_PASSWORD`
- All other required `.env` variables (database, Keycloak config, etc.)

## Debugging

If authentication fails:
1. Check that `KEYCLOAK_TEST_USER` and `KEYCLOAK_TEST_USER_PASSWORD` are set
2. Verify the test user exists in your Keycloak realm
3. Run with `--debug` flag to see browser interactions:
   ```bash
   yarn playwright test --debug
   ```
4. Check that the Keycloak URL is correct in the setup file
