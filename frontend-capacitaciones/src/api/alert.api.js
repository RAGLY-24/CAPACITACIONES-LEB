import { httpClient } from "./http.client";

export const alertApi = {
    get: async () => {
        const { data } = await httpClient.get("/aviso-emergencia");
        return data;
    },
    update: async (mensaje) => {
        const { data } = await httpClient.put(`/aviso-emergencia`, { mensaje });
        return data;
    },
};