import { useState } from "react";
import { Form, Link, useNavigate } from "react-router";
import type { Route } from "./+types/register";
import { useRegister } from "~/hooks/auth/useRegister";

const MIN_PASSWORD_LENGTH = 10;

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
    const [passwordError, setPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");

    const clearErrors = () => {
        setPasswordError("");
        setConfirmPasswordError("");
    };

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        const username = formData.get("username");
        const password = formData.get("password");
        const confirmPassword = formData.get("confirmPassword");

        if (typeof username !== "string" || typeof password !== "string" || typeof confirmPassword !== "string") {
            return;
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
            return;
        }

        if (password !== confirmPassword) {
            setConfirmPasswordError("Passwords do not match");
            return;
        }

        clearErrors();
        registerMutation.mutate(
            { username, password },
            { onSuccess: () => navigate("/login") }
        );
    }

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <article className="flex flex-col items-center gap-5 rounded-2xl border border-white bg-gray-800 p-10 shadow-lg">
                <Link to="/" className="self-start text-sm text-gray-400 transition-colors hover:text-white">
                    ← Back
                </Link>
                <h1 className="font-bold text-2xl text-center">Register</h1>
                <Form onSubmit={handleSubmit} method="post" className="flex flex-col gap-5 w-80">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="username">Username:</label>
                        <input type="text" id="username" name="username" className="bg-white rounded-sm text-black px-2 py-1" required />
                    </div>


                    <div className="flex flex-col gap-2">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="bg-white rounded-sm text-black px-2 py-1"
                            aria-invalid={!!passwordError}
                            aria-describedby={passwordError ? "password-error" : undefined}
                            onChange={clearErrors} required />
                        {passwordError && <p id="password-error" className="text-red-400 text-sm">{passwordError}</p>}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="confirmPassword">Confirm Password:</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className="bg-white rounded-sm text-black px-2 py-1"
                            aria-invalid={!!confirmPasswordError}
                            aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
                            onChange={clearErrors} required />
                        {confirmPasswordError && <p id="confirm-password-error" className="text-red-400 text-sm">{confirmPasswordError}</p>}
                    </div>


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