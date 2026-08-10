import { httpClient } from "./http.client";

export const capacitacionesApi = {
    // ─── Módulos / examen (vista empleado) ──────────────────────────────────
    getExamen: async (moduloId) => {
        const { data } = await httpClient.get(`/modulos/${moduloId}/examen`);
        return data;
    },

    getRetroalimentacionModulo: async (moduloId) => {
        const { data } = await httpClient.get(`/modulos/${moduloId}/examen/retroalimentacion`);
        return data;
    },

    enviarExamen: async (moduloId, respuestas) => {
        const { data } = await httpClient.post(`/modulos/${moduloId}/examen`, { respuestas });
        return data;
    },

    iniciarModulo: async (moduloId) => {
        const { data } = await httpClient.post(`/modulos/${moduloId}/iniciar`);
        return data;
    },

    marcarContenidoVisto: async (moduloId) => {
        const { data } = await httpClient.post(`/modulos/${moduloId}/contenido-visto`);
        return data;
    },

    // ─── Progreso ────────────────────────────────────────────────────────────
    getProgresoMio: async () => {
        const { data } = await httpClient.get("/progreso/mio");
        return data;
    },

    getProgresoAdmin: async () => {
        const { data } = await httpClient.get("/progreso/admin");
        return data;
    },

    getProgresoPorSeccion: async () => {
        const { data } = await httpClient.get("/progreso/por-seccion");
        return data;
    },

    getProgresoUsuario: async (usuarioId) => {
        const { data } = await httpClient.get(`/progreso/usuario/${usuarioId}`);
        return data;
    },

    getRetroalimentacionProgreso: async (progresoId) => {
        const { data } = await httpClient.get(`/progreso/${progresoId}/retroalimentacion`);
        return data;
    },
};
