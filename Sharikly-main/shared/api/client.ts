/**
 * Shared API client using fetch. Works in browser and React Native.
 * Each app (Next.js / Expo) passes its own getApiBase() and getAuthToken().
 */

export type GetApiBase = () => string | undefined;
export type GetAuthToken = () => string | null | undefined;

export interface ApiClientConfig {
  getApiBase: GetApiBase;
  getAuthToken?: GetAuthToken;
  onUnauthorized?: () => void;
}

const DEFAULT_TIMEOUT_MS = 30_000;

function buildUrl(base: string | undefined, path: string): string {
  if (!base) return path;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export function createApiClient(config: ApiClientConfig) {
  const { getApiBase, getAuthToken, onUnauthorized } = config;

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: { headers?: Record<string, string>; timeout?: number; bodyIsFormData?: boolean }
  ): Promise<T> {
    const base = getApiBase();
    const url = buildUrl(base, path);
    const token = getAuthToken?.() ?? null;
    const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS;

    const headers: Record<string, string> = { ...options?.headers };
    if (!options?.bodyIsFormData) {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const fetchBody =
      body !== undefined
        ? options?.bodyIsFormData && body instanceof FormData
          ? body
          : JSON.stringify(body)
        : undefined;

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: fetchBody,
        signal: controller.signal,
        credentials: "omit",
      });
      clearTimeout(id);

      if (res.status === 401 && onUnauthorized) {
        onUnauthorized();
      }

      const text = await res.text();
      if (!res.ok) {
        let detail: string | undefined;
        try {
          const json = JSON.parse(text);
          detail = json.detail ?? json.message ?? text;
        } catch {
          detail = text || `Request failed: ${res.status}`;
        }
        throw new Error(detail);
      }

      if (!text) return undefined as T;
      return JSON.parse(text) as T;
    } catch (e) {
      clearTimeout(id);
      if (e instanceof Error) throw e;
      throw new Error(String(e));
    }
  }

  async function apiGet<T>(path: string, options?: { headers?: Record<string, string> }): Promise<T> {
    return request<T>("GET", path, undefined, options);
  }

  async function apiPost<T>(path: string, body?: unknown, options?: { headers?: Record<string, string> }): Promise<T> {
    return request<T>("POST", path, body, options);
  }

  async function apiPatch<T>(path: string, body: unknown, options?: { headers?: Record<string, string> }): Promise<T> {
    return request<T>("PATCH", path, body, options);
  }

  async function apiPut<T>(path: string, body: unknown, options?: { headers?: Record<string, string> }): Promise<T> {
    return request<T>("PUT", path, body, options);
  }

  async function apiDelete<T>(path: string, options?: { headers?: Record<string, string> }): Promise<T> {
    return request<T>("DELETE", path, undefined, options);
  }

  return {
    request,
    get: apiGet,
    post: apiPost,
    patch: apiPatch,
    put: apiPut,
    delete: apiDelete,
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
