# Project Guidelines

## Architecture

- This is an npm workspace monorepo with three packages: `server`, `client`, and `shared`.
- `shared/schemas/user.ts` is the contract boundary. It defines the Zod credential, stored-user, and public-user schemas plus the inferred TypeScript types consumed by both applications.
- The backend is an Express application assembled by `server/src/app.ts`. Requests enter through `/api/auth` routes, then use Zod body validation and (for `/me`) JWT-cookie authentication before reaching controllers.
- Backend responsibilities are layered: controllers handle HTTP responses and cookies, `userService` owns authentication/business rules, `userRepository` stores users, and `utils`/`config` contain password, JWT, logging, environment, and cookie behavior.
- Authentication uses an HTTP-only `token` cookie. The client API service must use Axios with `withCredentials: true`; the client `ProtectedRoute` uses the TanStack Query `["user"]` query to gate `/dashboard`.
- The repository is currently in-memory: users are held in a process-local array in `userRepository.ts`, so restarting the server clears accounts. Do not assume persistence or add database behavior without an explicit requirement.
- The client is a React Router application. Route definitions live in `client/app/routes.ts`; authenticated pages are nested under the `ProtectedRoute` layout. Auth mutations invalidate or remove the `["user"]` query to keep navigation state consistent.

## Build and Test

Run commands from the repository root after installing dependencies with `npm ci` (or `npm install` during local dependency work):

- Backend typecheck: `npm --workspace server run typecheck`
- Backend build: `npm --workspace server run build`
- Backend unit tests: `npm --workspace server test`
- One backend test file: `npm --workspace server test -- test/unittests/services/userService.test.ts`
- One backend test by name: `npm --workspace server test -- -t "creates a user with a safe public profile"`
- Backend test typecheck: `npm --workspace server exec tsc --noEmit -p test`
- Client typecheck: `npm --workspace client run typecheck`
- Client production build: `npm --workspace client run build`
- Run the backend locally: `npm --workspace server run dev`
- Run the client locally: `npm --workspace client run dev`

Vitest uses `server/vitest.config.mts`, includes `server/test/unittests/**/*.test.ts`, and loads `server/test/setup.ts` before tests. The setup publishes test environment variables because the backend validates `process.env` during module import. Tests that need isolated module state use `vi.resetModules()` and dynamic imports.

There is no lint script configured in the workspace or package manifests. The CI workflow currently typechecks backend source and tests, then runs backend unit tests for pull requests affecting `server/**`.

## Conventions

- Validate request bodies with the shared Zod schema through `validateBody`; controllers should consume the parsed `req.body` rather than duplicate validation.
- Return `PublicUser` data from authentication flows; never expose `passwordHash`. Keep conversion centralized in `userService` via its stored-user-to-public-user mapping.
- Use the application error classes and `errorHandler` for expected API failures so error codes map to the established HTTP status codes and logging behavior.
- Keep JWT signing and verification in `server/src/utils/jwt.ts`, and cookie attributes in `server/src/config/cookies.ts`; do not duplicate token or cookie configuration in controllers or routes.
- Preserve the client/server package module conventions: the server compiles strict CommonJS with extensionless relative imports, while the client uses strict TypeScript with bundler resolution and the `~/*` alias for `client/app/*`.
- Use the existing TanStack Query keys and auth flow: `["user"]` represents the current session, login invalidates it, and logout removes it before redirecting.
