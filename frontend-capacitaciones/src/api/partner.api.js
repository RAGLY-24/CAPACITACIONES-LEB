import { httpClient } from "./http.client";

export const partnerApi = {
    getAll: async () => {
        console.log("GET ALL PARTNERS");
        const { data } = await httpClient.get('/socios');
        return data
    },
    getById: async (id) => {
        const { data } = await httpClient.get(`/socios/${id}`);
        return data;
    },

    // Create
    create: async (newData) => {
        const { data } = await httpClient.post("/socios", newData);
        return data;
    },

    // Update
    update: async (id, newData) => {
        const { data } = await httpClient.put(`/socios/${id}`, newData);
        return data;
    },

    // Delete (Borrado lógico)
    delete: async (id) => {
        const { data } = await httpClient.delete(`/socios/${id}`);
        return data;
    },
}