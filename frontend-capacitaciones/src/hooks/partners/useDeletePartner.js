import { useMutation, useQueryClient } from "@tanstack/react-query";
import { partnerApi } from "../../api/partner.api";

export const useDeletePartner = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => partnerApi.delete(id),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["partners"],
            });
        },
    });
};