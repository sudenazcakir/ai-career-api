import { apiRequest } from "./api";

export function registerUser(payload) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCurrentUser() {
  return apiRequest("/api/me");
}

export function updateCurrentUser(payload) {
  return apiRequest("/api/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function updatePassport(payload) {
  return apiRequest("/api/me/passport", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
