import type { Credentials, PublicUser } from "@app/shared";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { register } from "~/services/authService";

export const useRegister = () => {
    return useMutation<PublicUser, AxiosError<{ message: string }>, Credentials>({
        mutationKey: ["register"],
        mutationFn: (credentials: Credentials) => register(credentials),
    });
}