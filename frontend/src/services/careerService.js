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

export function fetchJobsFromAdzuna() {
  return apiRequest("/api/jobs/fetch");
}

export function filterJobsByQuery(params) {
  return apiRequest(`/api/jobs/filter?${params.toString()}`);
}

export function getRecommendations(cvId) {
  return apiRequest(`/api/recommendations?cvId=${cvId}`);
}

export function getBestCv(jobId) {
  return apiRequest(`/api/best-cv/${jobId}`);
}

export function calculateMatch(payload) {
  return apiRequest("/api/match", {
    method: "POST",
    body: JSON.stringify(payload),
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
