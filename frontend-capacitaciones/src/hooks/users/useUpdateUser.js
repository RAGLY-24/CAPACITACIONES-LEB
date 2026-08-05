import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "../../api/user.api";

export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => {
            return userApi.update(id, data);
        },

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["users"],
            });
        },
    });
};