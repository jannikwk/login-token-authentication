import { useMutation, useQueryClient } from "@tanstack/react-query"
import { login } from "../../services/authService"
import type { Credentials, PublicUser } from "@app/shared";
import type { AxiosError } from "axios";

export const useLogin = () => {
    const queryClient = useQueryClient();

    return useMutation<PublicUser, AxiosError<{ message: string }>, Credentials>({
        mutationKey: ["login"],
        mutationFn: (credentials: Credentials) => login(credentials),
        onSuccess: (user) => queryClient.setQueryData(["user"], user),
    });
}