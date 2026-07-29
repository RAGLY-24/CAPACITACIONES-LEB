// src/features/auth/hooks/useLogin.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../api/auth.api";

export const useLogin = () => {
    const queryClient = useQueryClient();
    const { setToken } = useAuth();

    return useMutation({
        mutationFn: async (data) => {
            return authApi.login(data.username, data.password);
        },

        onSuccess: (data) => {
            // 1. guardar token
            setToken(data.token);

            // 2. forzar refetch de /me
            queryClient.invalidateQueries({ queryKey: ["me"] });
        },
    });
    
};