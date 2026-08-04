// src/api/httpClient.ts
import axios from "axios";

export const httpClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1/",
});

httpClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});