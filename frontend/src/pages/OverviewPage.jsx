import { Empty, JobList, Metric, ProfileSummary } from "../components/common/DataViews";
import { heroBg, ui } from "../styles/ui";

export default function OverviewPage({
  cvs,
  fetchJobs,
  isBusy,
  jobs,
  loadRecommendations,
  recommendations,
  selectedCv,
  setActivePage,
  topScore,
}) {
  return (
    <div className={ui.pageGrid}>
      <section className={`${ui.heroPanel} ${heroBg}`}>
        <div className="min-w-0">
          <p className="mb-2 text-xs font-black uppercase text-[#d9eeea]">
            AI-assisted job matching
          </p>
          <h2 className="max-w-2xl break-words text-[clamp(34px,6vw,58px)] font-black leading-[0.96] tracking-[-0.04em]">
            Turn CV skills into ranked career options.
          </h2>
          <p className="mt-3 max-w-2xl text-[#d9eeea]">
            Import roles, select a CV, rank matches, and generate a learning
            path from missing skills.
          </p>
        </div>
        <div className={ui.heroActions}>
          <button className={ui.button} disabled={isBusy} type="button" onClick={fetchJobs}>
            Import Jobs
          </button>
          <button
            type="button"
            className={ui.buttonSecondary}
            disabled={isBusy}
            onClick={loadRecommendations}
          >
            Rank Now
          </button>
        </div>
      </section>

      <section className={ui.metrics}>
        <Metric label="CV profiles" value={cvs.length} />
        <Metric label="Filtered jobs" value={jobs.length} />
        <Metric label="Recommendations" value={recommendations.length} />
        <Metric label="Top score" value={`${topScore}%`} />
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <h2 className="text-2xl font-black">Selected CV</h2>
          <button type="button" className={ui.buttonGhost} onClick={() => setActivePage("cv")}>
            Manage
          </button>
        </div>
        {selectedCv ? <ProfileSummary cv={selectedCv} /> : <Empty />}
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <h2 className="text-2xl font-black">Top Recommendations</h2>
          <button
            type="button"
            className={ui.buttonGhost}
            onClick={() => setActivePage("jobs")}
          >
            Explore
          </button>
        </div>
        <JobList items={recommendations.slice(0, 4)} />
      </section>
    </div>
  );
}
