
const API_BASE = import.meta.env.VITE_API_URL || "";

function getHeaders(customHeaders: Record<string, string> = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const config = {
    ...options,
    headers: getHeaders(options.headers as Record<string, string>),
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    if (!endpoint.includes("/auth/login")) {
        
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
    }
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || "Błąd autoryzacji (401).");
  }

  return response;
}