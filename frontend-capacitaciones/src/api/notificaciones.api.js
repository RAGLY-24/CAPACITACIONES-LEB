import { httpClient } from "./http.client";

export const notificacionesApi = {
    getAll: async () => {
        const { data } = await httpClient.get("/notificaciones");
        return data;
    },

    getUnreadCount: async () => {
        const { data } = await httpClient.get("/notificaciones/no-leidas/count");
        return data;
    },

    markRead: async (id) => {
        const { data } = await httpClient.put(`/notificaciones/${id}/leer`);
        return data;
    },

    markAllRead: async () => {
        const { data } = await httpClient.put("/notificaciones/leer-todas");
        return data;
    },
}
