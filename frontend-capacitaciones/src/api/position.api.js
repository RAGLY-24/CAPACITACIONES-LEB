import { httpClient } from "./http.client";

export const positionApi = {
    getAll: async () => {
        const { data } = await httpClient.get('/puestos');
        return data
    },
    getById: async (id) => {
        const { data } = await httpClient.get(`/puestos/${id}`);
        return data;
    },

    // Create
    create: async (newData) => {
        const { data } = await httpClient.post("/puestos", newData);
        return data;
    },

    // Update
    update: async (id, newData) => {
        const { data } = await httpClient.put(`/puestos/${id}`, newData);
        return data;
    },

    // Delete (Borrado lógico)
    delete: async (id) => {
        const { data } = await httpClient.delete(`/puestos/${id}`);
        return data;
    },
}