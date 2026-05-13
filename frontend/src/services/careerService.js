import { apiRequest } from "./api";

export function listCvs() {
  return apiRequest("/api/cvs");
}

export function createCvProfile(payload) {
  return apiRequest("/api/cvs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createCvVersion(cvId, payload = {}) {
  return apiRequest(`/api/cvs/${cvId}/version`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function generateAiVersion(cvId, payload) {
  return apiRequest(`/api/cvs/${cvId}/ai-version`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function compareCvProfiles(leftCvId, rightCvId) {
  return apiRequest("/api/cvs/compare", {
    method: "POST",
    body: JSON.stringify({ leftCvId, rightCvId }),
  });
}

export function fetchJobsFromAdzuna() {
  return apiRequest("/api/jobs/fetch");
}

export function filterJobsByQuery(params) {
  return apiRequest(`/api/jobs/filter?${params.toString()}`);
}

export function getBestCv(jobId) {
  return apiRequest(`/api/best-cv/${jobId}`);
}

export function calculateFullMatch({ cvId, jobId }) {
  return apiRequest("/api/match/full", {
    method: "POST",
    body: JSON.stringify({ cvId, jobId }),
  });
}

export function getSuccessScore({ cvId, jobId }) {
  return apiRequest("/api/success-score", {
    method: "POST",
    body: JSON.stringify({ cvId, jobId }),
  });
}

export function buildRoadmap(payload) {
  return apiRequest("/api/analysis", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSkillAnalytics() {
  return apiRequest("/api/analytics/skills");
}

export function getTrendAnalytics() {
  return apiRequest("/api/analytics/trends");
}

export function getCareerMatrix(passport) {
  return apiRequest("/api/career-matrix", {
    method: "POST",
    body: JSON.stringify({ passport }),
  });
}

export function listApplications() {
  return apiRequest("/api/applications");
}

export function trackApplication(payload) {
  return apiRequest("/api/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateApplicationStatus(id, status) {
  return apiRequest(`/api/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteApplication(id) {
  return apiRequest(`/api/applications/${id}`, { method: "DELETE" });
}

export function getSimilarApplications() {
  return apiRequest("/api/applications/similar-roles");
}

export async function extractCertificate(file) {
  const token = localStorage.getItem("authToken");
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/certificates/extract", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Extraction failed");
  return data;
}

export function deleteCv(cvId) {
  return apiRequest(`/api/cvs/${cvId}`, { method: "DELETE" });
}

export function updateCv(cvId, payload) {
  return apiRequest(`/api/cvs/${cvId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function generateCv(payload) {
  return apiRequest("/api/cvs/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
