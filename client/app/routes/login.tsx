import { Form, Link, useNavigate } from "react-router";
import type { Route } from "./+types/login";
import { useLogin } from "~/hooks/auth/useLogin";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Login Auth App" },
    { name: "description", content: "Welcome to the Login Auth App!" },
  ];
}

export default function Login() {
  const loginMutation = useLogin();
  const navigate = useNavigate();
  const isPending = loginMutation.isPending;

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const username = formData.get("username");
    const password = formData.get("password");

    if (typeof username !== "string" || typeof password !== "string") {
      return;
    }

    loginMutation.mutate(
      { username, password },
      { onSuccess: () => navigate("/dashboard") }
    );
  }

  return (
    <main className="flex flex-col items-center justify-center gap-6 min-h-screen bg-gray-900 text-white">
      <article className="flex flex-col items-center gap-5 rounded-2xl border border-white bg-gray-800 p-10 shadow-lg">
        <Link to="/" className="self-start text-sm text-gray-400 transition-colors hover:text-white">
          ← Back
        </Link>
        <h1 className="font-bold text-2xl text-center">Login</h1>
        <Form onSubmit={handleSubmit} method="post" className="flex flex-col gap-5 w-80">
          <div className="flex flex-col gap-2">
            <label htmlFor="username">Username:</label>
            <input type="text" id="username" name="username" className="bg-white rounded-sm text-black px-2 py-1" required />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" className="bg-white rounded-sm text-black px-2 py-1" required />
          </div>

          <button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            className="mt-4 cursor-pointer bg-white text-black rounded-sm px-4 py-2 transition-colors hover:bg-gray-300 active:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed">
            {isPending ? "Logging in..." : "Login"}
          </button>
        </Form>

        <p>Don't have an account? <Link to="/register" className="text-blue-400 underline hover:text-blue-300">Register here</Link></p>
      </article>
    </main >
  );
}
