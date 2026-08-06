import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "../../api/user.api";

export const useCreateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: userApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["users"],
            });
        },
    });
};