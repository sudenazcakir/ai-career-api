import { FiFileText, FiBriefcase, FiTrendingUp, FiActivity } from "react-icons/fi";
import { Metric, ProfileSummary, JobList } from "../components/shared";

export default function OverviewPage({
  applications,
  cvs,
  jobs,
  recommendations,
  selectedCv,
  setActivePage,
  fetchJobs,
  loadRecommendations,
}) {
  return (
    <div className="page-grid">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">AI-assisted job matching</p>
          <h2>Turn CV skills into ranked career options.</h2>
          <p>
            Import roles, select a CV, rank matches, and generate a learning
            path from missing skills.
          </p>
        </div>
        <div className="hero-actions">
          <button type="button" onClick={fetchJobs}>
            Import Jobs
          </button>
          <button type="button" className="secondary" onClick={loadRecommendations}>
            Rank Now
          </button>
        </div>
      </section>

      <section className="metrics">
        <Metric label="CV profiles"      value={cvs.length}             icon={FiFileText} />
        <Metric label="Filtered jobs"    value={jobs.length}            icon={FiBriefcase} />
        <Metric label="Recommendations"  value={recommendations.length} icon={FiTrendingUp} />
        <Metric label="Applications"     value={applications.length}    icon={FiActivity} />
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Selected CV</h2>
          <button type="button" className="ghost" onClick={() => setActivePage("cv")}>
            Manage
          </button>
        </div>
        {selectedCv ? (
          <ProfileSummary cv={selectedCv} />
        ) : (
          <p className="muted">Create a CV profile to start matching.</p>
        )}
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Top Recommendations</h2>
          <button type="button" className="ghost" onClick={() => setActivePage("jobs")}>
            Explore
          </button>
        </div>
        <JobList items={recommendations.slice(0, 4)} />
      </section>
    </div>
  );
}
