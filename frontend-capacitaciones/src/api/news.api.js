import { httpClient } from "./http.client";

export const newsApi = {
    getAll: async () => {
        const { data } = await httpClient.get('/noticias');
        return data
    },
    getById: async (id) => {
        const { data } = await httpClient.get(`/noticias/${id}`);
        return data;
    },


    // Create
    create: async (newsData) => {
        const { data } = await httpClient.post("/noticias", newsData);
        return data;
    },

    // Update
    update: async (id, newsData) => {
        const { data } = await httpClient.post(`/noticias/${id}`, newsData);
        return data;
    },

    // Delete (Borrado lógico)
    delete: async (id) => {
        const { data } = await httpClient.delete(`/noticias/${id}`);
        return data;
    },
}