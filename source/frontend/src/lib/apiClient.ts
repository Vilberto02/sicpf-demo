import { getToken, getRefreshToken, setToken, clearToken } from "@/features/auth/token";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
const DEFAULT_TIMEOUT_MS = 30000;

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

interface ApiClientOptions extends Omit<RequestInit, "signal"> {
  body?: BodyInit;
  params?: Record<string, string | number | boolean | undefined | null>;
  timeout?: number;
  signal?: AbortSignal | null;
  _retry?: boolean;
}

function buildQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      qs.append(key, String(value));
    }
  }
  return qs.toString();
}

export async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { headers, params, timeout, signal: externalSignal, _retry, ...customConfig } = options;

  // Centralized auth token
  const token = getToken();

  const config: RequestInit = {
    method: customConfig.method || "GET",
    ...customConfig,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  const url = params
    ? `${API_BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}${buildQueryString(params)}`
    : `${API_BASE_URL}${endpoint}`;

  const controller = new AbortController();
  const timeoutMs = timeout ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  config.signal = controller.signal;

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  // Handle 401 Unauthorized with Silent Refresh
  if (response.status === 401 && !_retry && !endpoint.includes("/auth/token/")) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearToken();
      throw new Error("Su sesión ha expirado. Por favor, vuelva a iniciar sesión.");
    }

    if (isRefreshing) {
      try {
        const newToken = await new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
        return apiClient<T>(endpoint, {
          ...options,
          _retry: true,
          headers: {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      } catch (err) {
        throw err;
      }
    }

    isRefreshing = true;

    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!refreshResponse.ok) {
        throw new Error("Token refresh failed");
      }

      const refreshData = await refreshResponse.json();
      const newAccessToken = refreshData.access as string;
      setToken(newAccessToken);

      processQueue(null, newAccessToken);
      isRefreshing = false;

      return apiClient<T>(endpoint, {
        ...options,
        _retry: true,
        headers: {
          ...headers,
          Authorization: `Bearer ${newAccessToken}`,
        },
      });
    } catch (refreshError) {
      isRefreshing = false;
      processQueue(refreshError, null);
      clearToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:session-expired"));
      }
      throw new Error("Su sesión ha expirado. Por favor, vuelva a iniciar sesión.");
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = errorData.detail || errorData.message;
    if (!errorMessage && Array.isArray(errorData)) errorMessage = errorData[0];
    if (!errorMessage && Array.isArray(errorData.non_field_errors)) errorMessage = errorData.non_field_errors[0];
    if (!errorMessage && typeof errorData === 'object' && Object.keys(errorData).length > 0) {
       const firstVal = Object.values(errorData)[0];
       if (Array.isArray(firstVal)) errorMessage = firstVal[0];
       else errorMessage = String(firstVal);
    }
    throw new Error(errorMessage || "Something went wrong");
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return await response.json();
}
