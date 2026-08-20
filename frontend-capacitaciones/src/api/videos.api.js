import { httpClient } from "./http.client";

export const videosApi = {
    getAll: async () => {
        const { data } = await httpClient.get("/videos");
        return data;
    },

    create: async (videoData) => {
        const { data } = await httpClient.post("/videos", videoData);
        return data;
    },

    update: async (id, videoData) => {
        const { data } = await httpClient.put(`/videos/${id}`, videoData);
        return data;
    },

    delete: async (id) => {
        const { data } = await httpClient.delete(`/videos/${id}`);
        return data;
    },
};
