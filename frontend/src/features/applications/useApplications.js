import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  deleteApplication,
  getSimilarApplications,
  listApplications,
  trackApplication,
  updateApplicationStatus,
} from "../../services/careerService";

const APPLICATION_STATUSES = ["Saved for Later", "Under Review", "Accepted", "Rejected"];

export function useApplications({ user, selectedCvId, runAction, setStatus }) {
  const location = useLocation();
  const [applications, setApplications] = useState([]);
  const [similarApplications, setSimilarApplications] = useState([]);
  const similarApplicationsLoadedRef = useRef(false);

  async function loadApplications() {
    const data = await listApplications();
    setApplications(data.data || []);
  }

  // Auto-load applications when user signs in
  useEffect(() => {
    if (user) {
      loadApplications().catch((e) => setStatus(e.message));
    }
  }, [user]);

  // Auto-load similar roles on first visit to /applications
  useEffect(() => {
    if (!user || location.pathname !== "/applications" || similarApplicationsLoadedRef.current) return;
    similarApplicationsLoadedRef.current = true;

    getSimilarApplications()
      .then((data) => setSimilarApplications(data.data || []))
      .catch((e) => {
        if (e?.status !== 401) setStatus(`Could not load similar roles: ${e.message}`);
      });
  }, [location.pathname, user]);

  function loadSimilarApplications() {
    runAction("Finding similar roles", async () => {
      const data = await getSimilarApplications();
      setSimilarApplications(data.data || []);
      setStatus(`${data.data?.length || 0} similar roles found`);
    });
  }

  function handleTrackApplication(jobOrJobId, cvIdOrStatus, nextStatus = "Under Review") {
    const status = APPLICATION_STATUSES.includes(cvIdOrStatus) ? cvIdOrStatus : nextStatus;
    const jobId = typeof jobOrJobId === "object" ? jobOrJobId?._id : jobOrJobId;
    const cvId = APPLICATION_STATUSES.includes(cvIdOrStatus)
      ? selectedCvId
      : cvIdOrStatus || selectedCvId;

    if (!jobId) {
      setStatus("Couldn't determine job ID for this role");
      return false;
    }
    if (!cvId) {
      setStatus("Select a CV first");
      return false;
    }

    return runAction(
      status === "Saved for Later" ? "Saving for later" : "Tracking application",
      async () => {
        await trackApplication({ jobId, cvId, status });
        await loadApplications();
        setStatus(status === "Saved for Later" ? "Saved for later" : "Application tracked");
        return true;
      }
    );
  }

  function handleUpdateApplicationStatus(id, status) {
    runAction("Updating status", async () => {
      await updateApplicationStatus(id, status);
      await loadApplications();
    });
  }

  function handleDeleteApplication(id) {
    runAction("Removing application", async () => {
      await deleteApplication(id);
      setApplications((prev) => prev.filter((a) => a._id !== id));
    });
  }

  return {
    applications,
    loadApplications,
    similarApplications,
    loadSimilarApplications,
    handleTrackApplication,
    handleUpdateApplicationStatus,
    handleDeleteApplication,
  };
}
