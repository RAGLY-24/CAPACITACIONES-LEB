import { httpClient } from "./http.client";

export const userApi = {
    getAll: async () => {
        const { data } = await httpClient.get('/usuarios');
        return data
    },
    getById: async (id) => {
        const { data } = await httpClient.get(`/usuarios/${id}`);
        return data;
    },

    // Create
    create: async (newData) => {
        const { data } = await httpClient.post("/usuarios", newData);
        return data;
    },

    // Update
    update: async (id, newData) => {
        const { data } = await httpClient.put(`/usuarios/${id}`, newData);
        return data;
    },

    // Delete (Borrado lógico)
    delete: async (id) => {
        const { data } = await httpClient.delete(`/usuarios/${id}`);
        return data;
    },
}