
const API_BASE = import.meta.env.VITE_API_URL || "";

function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

function buildHeaders(
  customHeaders: Record<string, string> = {},
  {
    includeJsonContentType = true,
  }: { includeJsonContentType?: boolean } = {},
): Record<string, string> {
  const headers: Record<string, string> = {
    ...(includeJsonContentType ? { "Content-Type": "application/json" } : {}),
    ...customHeaders,
  };

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

async function handleUnauthorized(endpoint: string, response: Response): Promise<never> {
  if (!endpoint.includes("/auth/login")) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }
  const errorBody = await response.json().catch(() => ({}));
  throw new Error(errorBody.detail || "Błąd autoryzacji (401).");
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  const isFormData = options.body instanceof FormData;

  const config: RequestInit = {
    ...options,
    headers: buildHeaders(options.headers as Record<string, string>, {
      includeJsonContentType: !isFormData,
    }),
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    return handleUnauthorized(endpoint, response);
  }

  return response;
}