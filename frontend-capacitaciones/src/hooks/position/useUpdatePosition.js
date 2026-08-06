import { useMutation, useQueryClient } from "@tanstack/react-query";
import { positionApi } from "../../api/position.api";

export const useUpdatePosition = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => {
            return positionApi.update(id, data);
        },

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["positions"],
            });
        },
    });
};