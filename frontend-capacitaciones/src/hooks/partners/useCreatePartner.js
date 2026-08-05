import { useMutation, useQueryClient } from "@tanstack/react-query";
import { partnerApi } from "../../api/partner.api";

export const useCreatePartner = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: partnerApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["partners"],
            });
        },
    });
};