const API_BASE_URL = "http://127.0.0.1:8000/api";

interface ApiClientOptions extends RequestInit {
  body?: any;
  params?: Record<string, string | number | boolean | undefined | null>;
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
  const { headers, params, ...customConfig } = options;

  // You can extract token from localStorage if you use one
  const token = localStorage.getItem("token");

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

  const response = await fetch(url, config);

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
