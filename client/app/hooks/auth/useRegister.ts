import type { Credentials } from "@app/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { register } from "~/services/authService";

export const useRegister = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["register"],
        mutationFn: (credentials: Credentials) => register(credentials),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user"] });
        }
    });
}