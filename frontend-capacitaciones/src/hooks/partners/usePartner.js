import { useQuery } from "@tanstack/react-query";
import { partnerApi } from "../../api/partner.api";

export const usePartner = (id) => {
    return useQuery({
        queryKey: ["partner", id],
        queryFn: () => partnerApi.getById(id),
        enabled: Boolean(id),
    });
};