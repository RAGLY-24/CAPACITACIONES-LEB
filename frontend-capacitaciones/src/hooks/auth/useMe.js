import { useQuery } from "@tanstack/react-query";
import { authApi } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";

export const useMe = () => {
    const { logout, setAuthData } = useAuth();

    return useQuery({
        queryKey: ["me"],

        queryFn: async () => {
            try {
                const data = await authApi.me();

                setAuthData(data.user, data.permissions);

                return data;
            } catch (error) {
                const status = error?.response?.status;

                if (status === 401 || status === 403) {
                    logout();
                }

                throw error;
            }
        },
    });
};