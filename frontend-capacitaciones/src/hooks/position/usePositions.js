import { useQuery } from "@tanstack/react-query";
import { positionApi } from "../../api/position.api";

export const usePositions = () => {
    return useQuery({
        queryKey: ["positions"],
        queryFn: positionApi.getAll,
        staleTime: 1000 * 60 * 5,
    });
};
