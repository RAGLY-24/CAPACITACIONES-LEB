import { httpClient } from "./http.client";

export const authApi = {
    login: async (username, password) => {
        const { data } = await httpClient.post("/login", {
            usuario: username,
            password,
        });

        return data;
    },
    logout: async () => {
        const { data } = await httpClient.post("/logout");
        return data;
    },

    me: async () => {
        const { data } = await httpClient.get("/user");
        return data;
    },
};