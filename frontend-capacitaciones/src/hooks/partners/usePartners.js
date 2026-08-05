import { useQuery } from "@tanstack/react-query";
import { partnerApi } from "../../api/partner.api";

export const usePartners = () => {
    return useQuery({
        queryKey: ["partners"],
        queryFn: partnerApi.getAll,
        staleTime: 1000 * 60 * 5,
    });
};
