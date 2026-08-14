const API_BASE_URL = "http://127.0.0.1:8000/api";

interface ApiClientOptions extends RequestInit {
  body?: any;
}

export async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { headers, ...customConfig } = options;

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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || "Something went wrong");
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return await response.json();
}
