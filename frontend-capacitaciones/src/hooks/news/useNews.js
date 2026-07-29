import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { newsApi } from "../../api/news.api";

export const useNews = () => {
    const queryClient = useQueryClient();

    // 1. Hook para obtener TODOS los usuarios (Alimenta tu tabla principal)
    const Get = () => {
        return useQuery({
            queryKey: ["news"],
            queryFn: () => newsApi.getAll(),
            placeholderData: keepPreviousData
        })
    };

    const GetById = (id) => {
        return useQuery({
            queryKey: ["news", id],
            queryFn: () => newsApi.getById(id),
            enabled: !!id,
        });
    };

    const Create = useMutation({
        mutationFn: ({ data }) =>
            newsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["news"] });
        },
    });
    const Update = useMutation({
        mutationFn: ({ id, data }) => {
            data.append("_method", "PUT");
            return newsApi.update(id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["news"] });
        },
    });

    const Delete = useMutation({
        mutationFn: (id) => newsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["news"] });
        },
    });

    return {
        Get,
        GetById,
        Update,
        Delete,
        Create
    };
};