import { httpClient } from "./http.client";

export const contenidoApi = {
    // ─── Secciones ───────────────────────────────────────────────────────────
    getSecciones: async () => {
        const { data } = await httpClient.get("/secciones");
        return data;
    },

    getSeccion: async (id) => {
        const { data } = await httpClient.get(`/secciones/${id}`);
        return data;
    },

    crearSeccion: async (payload) => {
        const { data } = await httpClient.post("/secciones", payload);
        return data;
    },

    actualizarSeccion: async (id, payload) => {
        const { data } = await httpClient.put(`/secciones/${id}`, payload);
        return data;
    },

    eliminarSeccion: async (id) => {
        const { data } = await httpClient.delete(`/secciones/${id}`);
        return data;
    },

    // ─── Módulos ─────────────────────────────────────────────────────────────
    crearModulo: async (formData) => {
        const { data } = await httpClient.post("/modulos", formData);
        return data;
    },

    actualizarModulo: async (id, formData) => {
        const { data } = await httpClient.post(`/modulos/${id}/update`, formData);
        return data;
    },

    eliminarModulo: async (id) => {
        const { data } = await httpClient.delete(`/modulos/${id}`);
        return data;
    },

    // ─── Preguntas / examen ──────────────────────────────────────────────────
    getPreguntas: async (moduloId) => {
        const { data } = await httpClient.get(`/modulos/${moduloId}/preguntas`);
        return data;
    },

    crearPregunta: async (moduloId, payload) => {
        const { data } = await httpClient.post(`/modulos/${moduloId}/preguntas`, payload);
        return data;
    },

    actualizarPregunta: async (id, payload) => {
        const { data } = await httpClient.put(`/preguntas/${id}`, payload);
        return data;
    },

    eliminarPregunta: async (id) => {
        const { data } = await httpClient.delete(`/preguntas/${id}`);
        return data;
    },
};
