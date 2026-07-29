// src/features/auth/hooks/useLogin.js
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../api/auth.api";

export const useLogout = () => {
    const { logout } = useAuth()

    return useMutation({
        mutationFn: async () => {
            return authApi.logout();
        },

        onSuccess: () => {
            logout()
        },
    });

};