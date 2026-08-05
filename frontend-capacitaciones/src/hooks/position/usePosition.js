import { useQuery } from "@tanstack/react-query";
import { positionApi } from "../../api/position.api";

export const usePosition = (id) => {
    return useQuery({
        queryKey: ["positions", id],
        queryFn: () => positionApi.getById(id),
        enabled: Boolean(id),
    });
};