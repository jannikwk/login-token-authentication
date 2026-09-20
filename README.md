# 🔒 login-token-authentication
> A simple login app, made while practicing jwt token authentication. The app is meant to simulate a user creating an account and login and afterward, then the site displays the users username and id proving that the token auth was succesful.

A fullstack authentication demo featuring a secure backend API, a responsive frontend client..

## Tech Stack

- **Frontend:** React 19, React Router 8, TypeScript, Vite, Tailwind CSS, and TanStack Query
- **Backend:** Node.js 22, Express 5, and TypeScript
- **Authentication:** JWT tokens, HTTP cookies, bcrypt password hashing, and Zod validation
- **HTTP and logging:** Axios on the client, CORS on the server, and Pino logging

## Preview (Home + Succesful login)
![homepage](assets/homepage.png)

## Sequence Diagrams

### Login Flow

```mermaid
sequenceDiagram
    actor User
    participant LoginPage as Login Page
    participant UseLogin as useLogin Hook
    participant AuthService as AuthService
    participant API as Express API
    participant ValidateBody as validateBody
    participant AuthController as authController
    participant UserService as userService
    participant Password as password util
    participant JWT as jwt util
    participant Cookies as cookies config

    User->>LoginPage: enters username and password
    User->>LoginPage: clicks Login
    LoginPage->>UseLogin: mutate({username, password})
    UseLogin->>AuthService: login(credentials)
    AuthService->>API: POST /api/auth/login
    API->>ValidateBody: validateBody(authSchema)
    ValidateBody->>ValidateBody: schema.safeParse(req.body)
    alt invalid input
        ValidateBody-->>API: throw ValidationError (400)
        API-->>AuthService: 400 {message}
        AuthService-->>UseLogin: error
        UseLogin-->>LoginPage: mutation error
        LoginPage-->>User: show error
    end
    ValidateBody-->>AuthController: next()
    AuthController->>UserService: authenticateUser(username, password, log)
    UserService->>UserService: findByUsername(username)
    alt user not found
        UserService-->>AuthController: throw AuthenticationError
        AuthController-->>API: error
        API-->>AuthService: 401 {message}
        AuthService-->>UseLogin: error
        UseLogin-->>LoginPage: mutation error
        LoginPage-->>User: show error
    end
    UserService->>Password: comparePassword(password, passwordHash)
    Password-->>UserService: false
    alt invalid password
        UserService-->>AuthController: throw AuthenticationError
        AuthController-->>API: error
        API-->>AuthService: 401 {message}
        AuthService-->>UseLogin: error
        UseLogin-->>LoginPage: mutation error
        LoginPage-->>User: show error
    end
    Password-->>UserService: true
    UserService-->>AuthController: User {id, username}
    AuthController->>JWT: signToken(user)
    JWT-->>AuthController: token string
    AuthController->>Cookies: setTokenCookie(res, token)
    AuthController-->>API: 200 {id, username}
    API-->>AuthService: 200 User
    AuthService-->>UseLogin: User
    UseLogin->>UseLogin: invalidateQueries(["user"])
    UseLogin-->>LoginPage: onSuccess
    LoginPage->>LoginPage: navigate("/dashboard")
    LoginPage-->>User: redirect to dashboard
```

### Register Flow

```mermaid
sequenceDiagram
    actor User
    participant RegisterPage as Register Page
    participant UseRegister as useRegister Hook
    participant AuthService as AuthService
    participant API as Express API
    participant ValidateBody as validateBody
    participant AuthController as authController
    participant UserService as userService
    participant Password as password util

    User->>RegisterPage: enters username, password, confirmPassword
    Note over RegisterPage: client-side: password >= 10 chars?
    Note over RegisterPage: client-side: passwords match?
    alt client validation fails
        RegisterPage-->>User: show inline error
    end
    User->>RegisterPage: clicks Register
    RegisterPage->>UseRegister: mutate({username, password})
    UseRegister->>AuthService: register(credentials)
    AuthService->>API: POST /api/auth/register
    API->>ValidateBody: validateBody(authSchema)
    ValidateBody->>ValidateBody: schema.safeParse(req.body)
    alt invalid input
        ValidateBody-->>API: throw ValidationError (400)
        API-->>AuthService: 400 {message}
        AuthService-->>UseRegister: error
        UseRegister-->>RegisterPage: mutation error
        RegisterPage-->>User: show error
    end
    ValidateBody-->>AuthController: next()
    AuthController->>UserService: createUser(username, password, log)
    alt empty username or password
        UserService-->>AuthController: throw Error
        AuthController-->>API: error
        API-->>AuthService: 500 {message}
        AuthService-->>UseRegister: error
        UseRegister-->>RegisterPage: mutation error
        RegisterPage-->>User: show error
    end
    UserService->>UserService: pendingUsernames.has(username) or findByUsername(username)
    alt username already taken
        UserService-->>AuthController: throw ConflictError (409)
        AuthController-->>API: error
        API-->>AuthService: 409 {message}
        AuthService-->>UseRegister: error
        UseRegister-->>RegisterPage: mutation error
        RegisterPage-->>User: show error
    end
    UserService->>Password: hashPassword(password)
    Password-->>UserService: encryptedPassword
    UserService->>UserService: users.push({id, username, passwordHash})
    UserService-->>AuthController: User {id, username}
    AuthController-->>API: 201 {id, username}
    API-->>AuthService: 201 User
    AuthService-->>UseRegister: User
    UseRegister->>UseRegister: invalidateQueries(["user"])
    UseRegister-->>RegisterPage: onSuccess
    RegisterPage->>RegisterPage: navigate("/login")
    RegisterPage-->>User: redirect to login
```

## Architecture

```mermaid
classDiagram
    direction TB

    %% ── Server: Error Hierarchy ──────────────────────────────────
    class AppError {
        +statusCode: number
        +message: string
    }
    class ValidationError {
        +message: string = "Invalid input data"
    }
    class ConflictError {
        +message: string = "Resource conflict"
    }
    class AuthenticationError {
        +message: string = "Invalid credentials"
    }
    AppError <|-- ValidationError
    AppError <|-- ConflictError
    AppError <|-- AuthenticationError

    %% ── Server: Types ────────────────────────────────────────────
    class NewUser {
        +id: string
        +username: string
        +passwordHash: string
    }
    class User {
        +id: string
        +username: string
    }
    class JWTPayload {
        +sub: string
        +username: string
    }
    class AuthRequest {
        +username: string
        +password: string
    }
    class ZodSchema {
        +safeParse(data) Result
    }
    class authSchema {
        +username: z.string min 3, max 30
        +password: z.string min 10, max 72
    }
    authSchema --> ZodSchema : is instance of
    NewUser ..> User : Omit passwordHash

    %% ── Server: UserService ──────────────────────────────────────
    class UserService {
        +createUser(username, password, log) User
        +authenticateUser(username, password, log) User
        +getUserById(id, log) User | undefined
    }
    UserService --> NewUser : stores
    UserService --> User : returns
    UserService ..> ConflictError : throws
    UserService ..> AuthenticationError : throws
    UserService ..> Error : throws for empty input

    %% ── Server: AuthController ───────────────────────────────────
    class AuthController {
        +register(req, res) void
        +login(req, res) void
        +logout(req, res) void
        +me(req, res) void
    }
    AuthController --> UserService : calls createUser, authenticateUser, getUserById
    AuthController --> JWT : calls signToken
    AuthController --> Cookies : calls setTokenCookie, clearTokenCookie
    AuthController ..> AuthenticationError : throws

    %% ── Server: Middleware ────────────────────────────────────────
    class RequireAuth {
        +requireAuth(req, res, next) void
    }
    class ValidateBody {
        +validateBody(schema) (req, res, next) => void
    }
    class ErrorHandler {
        +errorHandler(error, req, res, next) void
    }
    RequireAuth --> JWT : verifyToken()
    RequireAuth ..> AuthenticationError : throws
    ValidateBody --> ZodSchema : validates req.body against
    ValidateBody ..> ValidationError : throws
    ErrorHandler ..> AppError : handles

    %% ── Server: JWT & Password ───────────────────────────────────
    class JWT {
        +signToken(user) string
        +verifyToken(token) JWTPayload
    }
    class Password {
        +hashPassword(password) string
        +comparePassword(password, hash) boolean
    }
    JWT --> User : reads id and username
    JWT --> JWTPayload : produces
    JWT ..> AuthenticationError : throws

    %% ── Server: Config ───────────────────────────────────────────
    class EnvConfig {
        +nodeEnv: string
        +port: number
        +jwtSecret: string
        +jwtExpiresIn: number
        +saltRounds: number
        +clientUrl: string
        +isProduction: boolean
    }
    class Cookies {
        +TOKEN_COOKIE: string
        +TOKEN_COOKIE_OPTIONS: object
        +setTokenCookie(res, token) void
        +clearTokenCookie(res) void
    }
    Cookies --> EnvConfig : reads isProduction, jwtExpiresIn

    %% ── Server: Routes ───────────────────────────────────────────
    class AuthRoutes {
        +POST /api/auth/login
        +POST /api/auth/register
        +GET  /api/auth/me
        +POST /api/auth/logout
    }
    AuthRoutes --> AuthController : uses register, login, me, logout
    AuthRoutes --> ValidateBody : uses on login and register
    AuthRoutes --> RequireAuth : uses on /me

    %% ── Server: App ──────────────────────────────────────────────
    class App {
        +createApp() Express
    }
    App --> AuthRoutes : mounts at /api/auth
    App --> ErrorHandler : uses as global handler
    App ..> EnvConfig : reads clientUrl

    %% ── Client: Types ────────────────────────────────────────────
    class ClientUser {
        +id: string
        +username: string
    }
    class Credentials {
        +username: string
        +password: string
    }

    %% ── Client: AuthService ──────────────────────────────────────
    class AuthService {
        +login(credentials) User
        +register(credentials) User
        +getCurrentUser() User
        +logout() void
    }
    AuthService --> Credentials : uses
    AuthService --> ClientUser : returns

    %% ── Client: Hooks ────────────────────────────────────────────
    class UseLogin {
        +useLogin() MutationResult
    }
    class UseRegister {
        +useRegister() MutationResult
    }
    class UseUser {
        +useUser() QueryResult
    }
    UseLogin --> AuthService : calls login
    UseRegister --> AuthService : calls register
    UseUser --> AuthService : calls getCurrentUser

    %% ── Client: Components ───────────────────────────────────────
    class ProtectedRoute {
        +ProtectedRoute() JSX.Element
    }
    ProtectedRoute --> UseUser : calls
    ProtectedRoute ..> ClientUser : checks auth status

    %% ── Client: Pages ────────────────────────────────────────────
    class HomePage
    class LoginPage
    class RegisterPage
    class DashboardPage
    LoginPage --> UseLogin
    RegisterPage --> UseRegister
    DashboardPage --> UseUser
    DashboardPage --> AuthService : calls logout
    HomePage ..> LoginPage : links to
    HomePage ..> RegisterPage : links to
```
