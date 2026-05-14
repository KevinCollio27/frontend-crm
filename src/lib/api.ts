"use client";

import axios, { AxiosError } from "axios";
import { useSessionStore } from "@/store/session.store";

const api = axios.create({ baseURL: "/api/proxy/" });

const AUTH_ENDPOINTS = new Set(["auth/login", "auth/register", "auth/recovery-password", "auth/verify-recovery-password", "auth/reset-password", "auth/verify-email", "auth/resend-verification-email", "auth/logout"]);

api.interceptors.response.use(
  (res) => res.data,
  async (error: AxiosError<{ success: boolean; message?: string; extraMessage?: string }>) => {
    const status = error.response?.status;
    const url = (error.config?.url ?? "").replace(/^\//, "");
    const isAuthEndpoint = AUTH_ENDPOINTS.has(url);

    // Solo redirigir si es un 401 en endpoint protegido (sesión expirada), no en auth
    if (status === 401 && !isAuthEndpoint && typeof window !== "undefined") {
      useSessionStore.getState().clear();
      window.location.replace("/login");
    }

    return Promise.reject(
      error.response?.data ?? { success: false, message: "Error de red" }
    );
  }
);

export default api;
