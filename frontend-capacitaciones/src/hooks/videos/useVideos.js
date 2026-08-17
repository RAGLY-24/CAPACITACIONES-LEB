import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { videosApi } from "../../api/videos.api";

export const useVideos = () => {
    const queryClient = useQueryClient();

    const Get = () => {
        return useQuery({
            queryKey: ["videos"],
            queryFn: () => videosApi.getAll(),
            placeholderData: keepPreviousData,
        });
    };

    const Create = useMutation({
        mutationFn: (data) => videosApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["videos"] });
        },
    });

    const Update = useMutation({
        mutationFn: ({ id, data }) => videosApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["videos"] });
        },
    });

    const Delete = useMutation({
        mutationFn: (id) => videosApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["videos"] });
        },
    });

    return {
        Get,
        Create,
        Update,
        Delete,
    };
};
