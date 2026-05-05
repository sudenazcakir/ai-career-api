export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("authToken");
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      const error = new Error(data.error || "Session expired. Please sign in again.");
      error.status = 401;
      throw error;
    }

    if (data.errors) {
      const error = new Error(data.message || "Validation failed");
      error.errors = data.errors;
      throw error;
    }

    throw new Error(data.error || data.message || "Request failed");
  }

  return data;
}

export function getBackendOrigin() {
  if (import.meta.env.VITE_BACKEND_ORIGIN) {
    return import.meta.env.VITE_BACKEND_ORIGIN;
  }

  if (typeof window === "undefined") {
    return "http://localhost:5001";
  }

  return `${window.location.protocol}//${window.location.hostname}:5001`;
}
