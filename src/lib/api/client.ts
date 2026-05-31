/* Cliente fetch tipado para el frontend. Desempaqueta ApiResponse y lanza
   ApiClientError en caso de error, para que las pantallas usen try/catch. */
import type { ApiResponse } from "@/lib/api-response";

export class ApiClientError extends Error {
  constructor(public code: string, message: string, public details?: unknown) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = (await res.json()) as ApiResponse<T>;
  if (body.error) throw new ApiClientError(body.error.code, body.error.message, body.error.details);
  return body.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) => request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
};
