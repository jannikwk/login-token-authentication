import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { Route } from "./+types/dashboard";
import { useUser } from "~/hooks/auth/useUser";
import { logout } from "~/services/authService";
import LogoutDialog, { LOGOUT_DIALOG_ID } from "~/components/LogoutDialog";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Login Auth App" },
        { name: "description", content: "Dashboard page for the Login Auth App" },
    ];
}

export default function Dashboard() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: user } = useUser();

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            queryClient.removeQueries({ queryKey: ["user"] });
            navigate("/", { replace: true });
        }
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <h1 className="text-3xl font-bold mb-5">Dashboard</h1>
            <section className="flex flex-col">
                <h2 className="text-xl font-bold">
                    Hello, {user?.username ?? "there"}!
                </h2>
                <p>Your userID: {user?.id ?? "unknown"}</p>
                <button
                    type="button"
                    command="show-modal"
                    commandfor={LOGOUT_DIALOG_ID}
                    className="cursor-pointer self-center mt-6 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-red-600 hover:text-white"
                >
                    Logout
                </button>
            </section>

            <LogoutDialog onConfirm={handleLogout} />
        </main>
    );
}