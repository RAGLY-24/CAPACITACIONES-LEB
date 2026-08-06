import { useMutation, useQueryClient } from "@tanstack/react-query";
import { partnerApi } from "../../api/partner.api";

export const useUpdatePartner = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => {
            return partnerApi.update(id, data);
        },

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["partners"],
            });
        },
    });
};