// src/api/httpClient.ts
import axios from "axios";

export let URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const endpoint = localStorage.getItem('endpoint');

if (endpoint) {
    URL = endpoint
}

export const httpClient = axios.create({
    baseURL: `${URL}/api`
});

httpClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});