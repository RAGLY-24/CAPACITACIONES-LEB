import { useQuery } from "@tanstack/react-query";
import { userApi } from "../../api/user.api";

export const useUser = (id) => {
    return useQuery({
        queryKey: ["users", id],
        queryFn: () => userApi.getById(id),
        enabled: Boolean(id),
    });
};