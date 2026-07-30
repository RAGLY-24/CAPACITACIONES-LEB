import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { alertApi } from "../../api/alert.api";

export const useAlert = () => {

    const queryClient = useQueryClient();

    // 1. Hook para obtener TODOS los usuarios (Alimenta tu tabla principal)
    const Get = () => {
        return useQuery({
            queryKey: ["alert"],
            queryFn: () => alertApi.get(),
            placeholderData: keepPreviousData,
        })
    };

    const Update = useMutation({
        mutationFn: ({ mensaje }) => {
            return alertApi.update(mensaje);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alert"] });
        },
    });


    return {
        Get,
        Update
    };
};