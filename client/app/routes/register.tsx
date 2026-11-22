import { useState } from "react";
import { Form, Link, useNavigate } from "react-router";
import type { Route } from "./+types/register";
import { useRegister } from "~/hooks/auth/useRegister";
import { CredentialsSchema } from "@app/shared";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Login Auth App" },
        { name: "description", content: "Registration page for the Login Auth App" },
    ];
}

export default function Register() {
    const registerMutation = useRegister();
    const navigate = useNavigate();
    const isPending = registerMutation.isPending;
    const [formError, setFormError] = useState("");

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        if (formData.get("password") !== formData.get("confirmPassword")) {
            setFormError("Passwords do not match");
            return;
        }

        const parsed = CredentialsSchema.safeParse({
            username: formData.get("username"),
            password: formData.get("password"),
        });

        if (!parsed.success) {
            setFormError(parsed.error.issues[0].message);
            return;
        }

        setFormError("");
        registerMutation.mutate(parsed.data, { onSuccess: () => navigate("/login") });
    }

    const handleChange = () => {
        if (formError) setFormError("");
        if (registerMutation.isError) registerMutation.reset();
    }

    const errorMessage = formError || (registerMutation.isError ? registerMutation.error?.response?.data?.message ?? "Something went wrong. Please try again." : "");

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <article className="flex flex-col items-center gap-5 rounded-2xl border border-white bg-gray-800 p-10 shadow-lg">
                <Link to="/" className="self-start text-sm text-gray-400 transition-colors hover:text-white">
                    ← Back
                </Link>
                <h1 className="font-bold text-2xl text-center">Register</h1>
                <Form onSubmit={handleSubmit} method="post" className="flex flex-col gap-5 w-80" onChange={handleChange}>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="username">Username:</label>
                        <input type="text" id="username" name="username" autoComplete="username" className="bg-white rounded-sm text-black px-2 py-1" required />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="bg-white rounded-sm text-black px-2 py-1"
                            autoComplete="new-password"
                            required />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="confirmPassword">Confirm Password:</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className="bg-white rounded-sm text-black px-2 py-1"
                            required />
                    </div>

                    {errorMessage && (
                        <p role="alert" className="text-red-400 text-sm">
                            {errorMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        aria-busy={isPending}
                        className="mt-4 cursor-pointer bg-white text-black rounded-sm px-4 py-2 transition-colors hover:bg-gray-300 active:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isPending ? "Registering..." : "Register"}
                    </button>
                </Form>

                <p>Already have an account? <Link to="/login" className="text-blue-400 underline hover:text-blue-300">Login here</Link></p>
            </article>
        </main >
    );
}