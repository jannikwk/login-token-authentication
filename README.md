# 🔒 login-token-authentication
> A simple login app, made while practicing jwt token authentication. The app is meant to simulate a user creating an account and login and afterward, then the site displays the users username and id proving that, the token auth was succesful. Featuring a secure backend API & responsive client.

## Tech Stack

- **Frontend:** React 19, React Router 8, TypeScript, Vite, Tailwind CSS, and TanStack Query
- **Backend:** Node.js 22, Express 5, and TypeScript
- **Authentication:** JWT tokens, HTTP cookies, bcrypt password hashing, and Zod validation
- **HTTP and logging:** Axios on the client, CORS on the server, and Pino logging

## Preview (Home + Succesful login)
![homepage](assets/homepage.png)

## Class Diagram
```mermaid
classDiagram-v2
    direction TB

    %% ==========================================
    %% Client
    %% ==========================================
    class authService {
        <<Frontend>>
        - baseURL: string
        - api: AxiosInstance
        + login(credentials: Credentials) Promise~User~
        + register(credentials: Credentials) Promise~User~
        + getCurrentUser() Promise~User~
        + logout() Promise~void~
    }

    authService --> authController

    class useLogin {
        <<Hook>>
        + mutate(credentials: Credentials) Promise~User~
    }

    class useRegister {
        <<Hook>>
        + mutate(credentials: Credentials) Promise~User~
    }

    class useUser {
        <<Hook>>
        + query() Promise~User~
    }

    %% Hooks call the auth service and work with the shared types
    useLogin ..> authService
    useRegister ..> authService
    useUser ..> authService

    useLogin ..> Credentials : Uses
    useRegister ..> Credentials : Uses
    useUser ..> User : Uses

    class Credentials {
        <<Type>>
        + username: string
        + password: string
    }

    class User {
        <<Type>>
        + id: string
        + username: string
    }

    class ProtectedRoute {
        <<Component>>
    }

    class LogoutDialog {
        <<Component>>
        + LOGOUT_DIALOG_ID: string
        + onConfirm: () => void
    }

    class Home {
        <<Route>>
    }

    class Login {
        <<Route>>
        - handleSubmit(e: SubmitEvent~HTMLFormElement~) void
    }

    class Register {
        <<Route>>
        - MIN_PASSWORD_LENGTH: number$
        - passwordError: string
        - confirmPasswordError: string
        - clearErrors() void
        - handleSubmit(e: SubmitEvent~HTMLFormElement~) void
    }

    class Dashboard {
        <<Route>>
        - handleLogout() Promise~void~
    }

    %% Routes use the hooks (and the data they return)
    Login ..> useLogin : Uses
    Register ..> useRegister : Uses
    Dashboard ..> useUser : Uses
    ProtectedRoute ..> useUser : Uses
    Dashboard ..> authService : Uses

    %% Composition: the whole creates and owns the part
    Dashboard *-- LogoutDialog : renders

    %% ==========================================
    %% Server
    %% ==========================================
    class authController {
        <<Server-Controller>>
        + register(req: Request, res: Response) Promise~User~
        + login(req: Request, res: Response) Promise~User~
    }

```
