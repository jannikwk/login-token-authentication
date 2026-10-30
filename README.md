# 🔒 login-token-authentication
> A simple login app, made while practicing jwt token authentication. The app is meant to simulate a user creating an account and login and afterward, then the site displays the users username and id proving that, the token auth was succesful. Featuring a secure backend API & responsive client.

## Tech Stack

- **Frontend:** React 19, React Router 8, TypeScript, Vite, Tailwind CSS, and TanStack Query
- **Backend:** Node.js 22, Express 5, and TypeScript
- **Authentication:** JWT tokens, HTTP cookies, bcrypt password hashing, and Zod validation
- **HTTP and logging:** Axios on the client, CORS on the server, and Pino logging

## Preview (Home + Succesful login)
![homepage](assets/homepage.png)

## Server tests

Run the server test suite from the `server` directory:

```powershell
npm test
npx tsc --noEmit -p test
```

The suite includes API integration tests that start the Express app on an ephemeral
local port and use Node.js 22's built-in `fetch`. They exercise registration, login,
JWT cookie authentication, protected user lookup, logout, validation errors, duplicate
users, invalid credentials, and invalid or expired tokens without requiring Docker,
a database, or an additional HTTP test dependency.

## Backend Component Architecture & Request Pipeline
```mermaid
%%{init: {'flowchart': {'wrappingWidth': 600}}}%%
graph TD
    Client["Client / Frontend"]
    Server
    App

    Client -->|Http-request| Server
    Server -->|Initializes| App

    Routes["authRoutes <br> (/api/auth)"]

    App --> Routes

    subgraph Endpoints
        Login["POST /login"]
        Register["POST /register"]
        Logout["POST /logout"]
        Me["GET /me"]
    end

    Routes --> Login
    Routes --> Register
    Routes --> Logout
    Routes --> Me

    subgraph Middleware
        ValidateBody["validateBody <br> (Zod Schema)"]
        RequireAuth["requireAuth <br> (Verify JWT Cookie)"]
    end

    Login --> ValidateBody
    Register --> ValidateBody
    Me --> RequireAuth

    AuthController["authController <br> (Request / Response Handling)"]

    ValidateBody --> AuthController
    Logout --> AuthController
    RequireAuth --> AuthController

    subgraph Configurations ["Application Configuration"]
        Cookies["cookies.ts <br> (Cookie & Environment Options)"]
    end

    AuthController -.->|Sets & clears cookies| Cookies

    subgraph Business_Logic["Business Logic & Utilities"]
        UserService["userService <br> (createUser, authenticateUser...)"]

        subgraph Utils
            Password["password <br> (hashPassword, comparePassword)"]
            JWT["jwt <br> (signToken, verifyToken)"]
        end
    end

    AuthController --> UserService
    UserService -.-> Password
    AuthController -.->|Signs token| JWT
    RequireAuth -.->|Verifies token| JWT

    subgraph Shared
        User["user <br> (Credentials, StoredUser, PublicUser)"]
    end

    ValidateBody -.->|Validates body| User
    UserService -.->|Infers TS types| User
```
