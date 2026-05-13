import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  fetchJobsFromAdzuna,
  filterJobsByQuery,
} from "../../services/careerService";

const DEFAULT_FILTER_FORM = {
  keyword: "",
  skill: "",
  minMatch: "",
  sort: "newest",
  company: "",
  location: "",
  remoteType: "",
  seniority: "",
  salaryMin: "",
  maxSkillGap: "",
  level: "",
};

export function useJobs({ user, selectedCvId, runAction, setStatus }) {
  const location = useLocation();
  const [jobs, setJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [filterForm, setFilterForm] = useState(DEFAULT_FILTER_FORM);
  const [jobsSyncedAt, setJobsSyncedAt] = useState(null);
  const jobsAutoSyncDoneRef = useRef(false);

  // Hydrate jobs from the database once per signed-in session so dependent pages
  // keep working after refresh without forcing an Adzuna sync.
  useEffect(() => {
    if (!user || jobs.length > 0 || jobsAutoSyncDoneRef.current) return;
    jobsAutoSyncDoneRef.current = true;

    const params = new URLSearchParams({ sort: "newest" });
    filterJobsByQuery(params)
      .then((data) => {
        const dbJobs = data.data || [];
        setJobs(dbJobs);
        if (dbJobs.length > 0) {
          setJobsSyncedAt(new Date());
          if (location.pathname === "/jobs") setStatus(`${dbJobs.length} jobs loaded`);
        } else if (location.pathname === "/jobs") {
          setStatus("No jobs loaded. Use Sync to import jobs.");
        }
      })
      .catch((e) => {
        if (e?.status !== 401) setStatus(`Could not load jobs: ${e.message}`);
      });
  }, [jobs.length, location.pathname, user]);

  function fetchJobs() {
    runAction("Fetching jobs from Adzuna", async () => {
      const data = await fetchJobsFromAdzuna();
      const params = new URLSearchParams({ sort: "newest" });
      const loadedJobs = await filterJobsByQuery(params);
      setJobs(loadedJobs.data || []);
      setJobsSyncedAt(new Date());
      setStatus(
        `Jobs imported: ${data.imported || 0} new, ${data.updated || 0} updated. ${loadedJobs.data?.length || 0} jobs loaded.`
      );
    });
  }

  function filterJobs(event) {
    event?.preventDefault();
    runAction("Filtering jobs from database", async () => {
      const needsCvContext =
        Boolean(filterForm.minMatch) ||
        Boolean(filterForm.maxSkillGap) ||
        Boolean(filterForm.level) ||
        filterForm.sort === "score" ||
        filterForm.sort === "gaps" ||
        filterForm.sort === "potential";

      if (needsCvContext && !selectedCvId) {
        setStatus("Select or create a CV before using match score filters.");
        return;
      }

      const params = new URLSearchParams();
      Object.entries(filterForm).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      if (selectedCvId) params.set("cvId", selectedCvId);

      const data = await filterJobsByQuery(params);
      setJobs(data.data || []);
      setStatus(`${data.data?.length || 0} jobs loaded`);
    });
  }

  function loadRecommendations() {
    if (!selectedCvId) {
      setStatus("Create or select a CV first");
      return;
    }
    runAction("Ranking recommendations", async () => {
      const params = new URLSearchParams({ cvId: selectedCvId, sort: "score" });
      const data = await filterJobsByQuery(params);
      const rankedJobs = data.data || [];
      setJobs(rankedJobs);
      setRecommendations(rankedJobs.slice(0, 10));
      setFilterForm((current) => ({ ...current, sort: "score" }));
      setStatus(`${rankedJobs.length} jobs ranked`);
    });
  }

  function resetJobFilters() {
    const nextFilterForm = { ...DEFAULT_FILTER_FORM };
    setFilterForm(nextFilterForm);
    runAction("Resetting job filters", async () => {
      const params = new URLSearchParams({ sort: nextFilterForm.sort });
      if (selectedCvId) params.set("cvId", selectedCvId);
      const data = await filterJobsByQuery(params);
      setJobs(data.data || []);
      setStatus(`${data.data?.length || 0} jobs loaded`);
    });
  }

  return {
    jobs,
    setJobs,
    recommendations,
    setRecommendations,
    filterForm,
    setFilterForm,
    jobsSyncedAt,
    fetchJobs,
    filterJobs,
    loadRecommendations,
    resetJobFilters,
  };
}
