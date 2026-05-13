import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getSkillAnalytics, getTrendAnalytics } from "../../services/careerService";

export function useAnalytics({ user, runAction, setStatus }) {
  const location = useLocation();
  const [skillAnalytics, setSkillAnalytics] = useState(null);
  const [trendAnalytics, setTrendAnalytics] = useState(null);

  // Auto-load analytics on first visit to /trends or /insights
  useEffect(() => {
    if (!user || (skillAnalytics && trendAnalytics)) return;
    if (location.pathname !== "/trends" && location.pathname !== "/insights") return;

    Promise.all([getSkillAnalytics(), getTrendAnalytics()])
      .then(([skills, trends]) => {
        setSkillAnalytics(skills);
        setTrendAnalytics(trends);
      })
      .catch((e) => {
        if (e?.status !== 401) setStatus(`Could not load analytics: ${e.message}`);
      });
  }, [location.pathname, user, skillAnalytics, trendAnalytics]);

  function loadAnalytics() {
    runAction("Loading analytics", async () => {
      const [skills, trends] = await Promise.all([getSkillAnalytics(), getTrendAnalytics()]);
      setSkillAnalytics(skills);
      setTrendAnalytics(trends);
      setStatus("Analytics loaded");
    });
  }

  return { skillAnalytics, trendAnalytics, loadAnalytics };
}
