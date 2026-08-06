import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "../../api/user.api";

export const useDeleteUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => userApi.delete(id),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["users"],
            });
        },
    });
};