import { useMutation, useQueryClient } from "@tanstack/react-query";
import { positionApi } from "../../api/position.api";

export const useCreatePosition = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: positionApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["positions"],
            });
        },
    });
};