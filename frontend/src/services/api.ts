
const API_BASE = import.meta.env.VITE_API_URL || "";

function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
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

// Keep track of refresh promise to handle concurrent requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: Response | PromiseLike<Response>) => void;
  reject: (reason?: any) => void;
  endpoint: string;
  options: RequestInit;
}> = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      // Retry request with new token
      apiRequest(prom.endpoint, prom.options)
        .then(prom.resolve)
        .catch(prom.reject);
    }
  });

  failedQueue = [];
};

async function handleUnauthorized(endpoint: string, response: Response, options: RequestInit): Promise<Response> {
  // Don't try to refresh if we are already doing login/refresh or if no refresh token
  if (endpoint.includes("/auth/login") || endpoint.includes("/auth/refresh")) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    throw new Error("Błąd autoryzacji (401).");
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    // No refresh token available, logout user
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || "Błąd autoryzacji (401).");
  }

  if (isRefreshing) {
    // If already refreshing, queue this request
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject, endpoint, options });
    });
  }

  isRefreshing = true;

  try {
    const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!refreshResponse.ok) {
        throw new Error("Refresh failed");
    }

    const data = await refreshResponse.json();
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);

    processQueue(null);
    
    // Retry original request
    return apiRequest(endpoint, options);
  } catch (error) {
    processQueue(error);
    // Refresh failed - logout
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    if (window.location.pathname !== "/login") {
       window.location.href = "/login";
    }
    throw error;
  } finally {
    isRefreshing = false;
  }
}

export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
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
    return handleUnauthorized(endpoint, response, options);
  }

  return response;
}
