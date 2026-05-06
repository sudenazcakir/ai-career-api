import { FiDownload, FiSearch, FiZap } from "react-icons/fi";
import { JobList } from "../components/common/DataViews";
import { ui } from "../styles/ui";

export default function JobsPage({
  cvs,
  fetchJobs,
  filterForm,
  filterJobs,
  isBusy,
  jobs,
  loadRecommendations,
  selectedCv,
  selectedCvId,
  setFilterForm,
  setSelectedCvId,
  trackApplication,
}) {
  return (
    <div className={ui.pageGrid}>

      {/* ── Filter card ──────────────────────────────────────────────── */}
      <section className={`${ui.panel} ${ui.full}`}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Database search</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              Filter jobs
              {selectedCv && (
                <span className="ml-2 text-[#6B6B72] font-normal">
                  against {selectedCv.title}
                </span>
              )}
            </h2>
          </div>
          <div className={ui.buttonRow}>
            <button type="button" className={ui.buttonSecondary} disabled={isBusy} onClick={fetchJobs}>
              <FiDownload size={14} strokeWidth={1.5} />
              Import jobs
            </button>
            <button type="button" className={ui.buttonCobalt} disabled={isBusy} onClick={loadRecommendations}>
              <FiZap size={14} strokeWidth={1.5} />
              Recommend
            </button>
          </div>
        </div>

        {/* ── CV selector ──────────────────────────────────────────── */}
        {cvs.length > 0 && (
          <div className="mb-4 rounded-[8px] border border-[#E8E3D7] bg-[#F6F3EC] p-3">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6B72]"
               style={{ fontFamily: "var(--font-mono)" }}>
              Match against CV
            </p>
            <div className="flex flex-wrap gap-2">
              {cvs.map((cv) => {
                const isActive = cv._id === selectedCvId;
                return (
                  <button
                    key={cv._id}
                    type="button"
                    onClick={() => setSelectedCvId(cv._id)}
                    className="inline-flex items-center gap-1.5 rounded-[8px] border px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF] focus-visible:ring-offset-1"
                    style={isActive ? {
                      background: "var(--c-cobalt)",
                      color: "#fff",
                      borderColor: "var(--c-cobalt)",
                    } : {
                      background: "var(--c-paper)",
                      color: "var(--c-graphite)",
                      borderColor: "var(--c-hairline)",
                    }}
                  >
                    {isActive && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {cv.title}
                    <span className="opacity-60" style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
                      {cv.version || "v1"}
                    </span>
                  </button>
                );
              })}
            </div>
            {!selectedCvId && (
              <p className="mt-2 text-[12px] text-[#A4A4AC]">
                Select a CV to enable match score filtering and recommendations.
              </p>
            )}
          </div>
        )}

        {cvs.length === 0 && (
          <div className="mb-4 rounded-[8px] border border-dashed border-[#A4A4AC] p-3 text-[12px] text-[#A4A4AC]">
            No CV profiles yet. Go to My CVs to create one and enable match scoring.
          </div>
        )}

        {/* ── Filter form ───────────────────────────────────────────── */}
        <form className={ui.gridForm} onSubmit={filterJobs}>
          <label className={ui.label}>
            Keyword
            <input
              className={ui.input}
              value={filterForm.keyword}
              onChange={(e) => setFilterForm({ ...filterForm, keyword: e.target.value })}
            />
          </label>
          <label className={ui.label}>
            Skill
            <input
              className={ui.input}
              value={filterForm.skill}
              onChange={(e) => setFilterForm({ ...filterForm, skill: e.target.value })}
            />
          </label>
          <label className={ui.label}>
            Min match %
            <input
              className={ui.input}
              type="number"
              placeholder="—"
              value={filterForm.minMatch}
              onChange={(e) => setFilterForm({ ...filterForm, minMatch: e.target.value })}
            />
          </label>
          <label className={ui.label}>
            Sort
            <select
              className={ui.input}
              value={filterForm.sort}
              onChange={(e) => setFilterForm({ ...filterForm, sort: e.target.value })}
            >
              <option value="score">Match score</option>
              <option value="newest">Newest</option>
            </select>
          </label>
          <button className={ui.button} disabled={isBusy} type="submit">
            <FiSearch size={14} strokeWidth={1.5} />
            {isBusy ? "Searching…" : "Search"}
          </button>
        </form>
      </section>

      {/* ── Results ──────────────────────────────────────────────────── */}
      <section className={`${ui.panel} ${ui.full}`}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Job results</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              {jobs.length > 0 ? `${jobs.length} results` : "No results yet"}
            </h2>
          </div>
          <span className={ui.count} style={{ fontFamily: "var(--font-mono)" }}>
            {jobs.length} jobs
          </span>
        </div>
        <JobList items={jobs} onSave={trackApplication} />
      </section>
    </div>
  );
}
