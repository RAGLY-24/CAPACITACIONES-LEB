import { useMutation, useQueryClient } from "@tanstack/react-query";
import { positionApi } from "../../api/position.api";

export const useDeletePosition = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => positionApi.delete(id),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["positions"],
            });
        },
    });
};