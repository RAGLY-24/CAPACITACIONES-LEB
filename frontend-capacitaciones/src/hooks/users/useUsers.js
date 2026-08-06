import { useQuery } from "@tanstack/react-query";
import { userApi } from "../../api/user.api";

export const useUsers = () => {
    return useQuery({
        queryKey: ["users"],
        queryFn: userApi.getAll,
        staleTime: 1000 * 60 * 5,
    });
};
