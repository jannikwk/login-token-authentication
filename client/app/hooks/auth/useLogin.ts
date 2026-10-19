import { useMutation, useQueryClient } from "@tanstack/react-query"
import { login } from "../../services/authService"
import type { Credentials } from "@app/shared";

export const useLogin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["login"],
        mutationFn: (credentials: Credentials) => login(credentials),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user"] });
        }
    });
}