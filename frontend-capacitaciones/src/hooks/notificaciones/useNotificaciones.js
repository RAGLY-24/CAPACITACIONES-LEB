import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificacionesApi } from "../../api/notificaciones.api";

export const useNotificaciones = () => {
    const queryClient = useQueryClient();

    const Get = ({ enabled = true } = {}) => {
        return useQuery({
            queryKey: ["notificaciones"],
            queryFn: () => notificacionesApi.getAll(),
            enabled,
        });
    };

    const GetUnreadCount = () => {
        return useQuery({
            queryKey: ["notificaciones", "unread-count"],
            queryFn: () => notificacionesApi.getUnreadCount(),
            refetchInterval: 45000,
            refetchOnWindowFocus: true,
        });
    };

    const invalidar = () => {
        queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
    };

    const MarkRead = useMutation({
        mutationFn: (id) => notificacionesApi.markRead(id),
        onSuccess: invalidar,
    });

    const MarkAllRead = useMutation({
        mutationFn: () => notificacionesApi.markAllRead(),
        onSuccess: invalidar,
    });

    return {
        Get,
        GetUnreadCount,
        MarkRead,
        MarkAllRead,
    };
};
