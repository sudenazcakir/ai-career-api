import { FiRefreshCw, FiSearch, FiX, FiZap } from "react-icons/fi";
import { JobList } from "../components/common/DataViews";
import { ui } from "../styles/ui";

function formatSyncTime(date) {
  if (!date) return null;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 15) return "Synced just now";
  if (seconds < 60) return `Synced ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Synced ${minutes}m ago`;
  return `Synced ${Math.floor(minutes / 60)}h ago`;
}

export default function JobsPage({
  cvs,
  fetchJobs,
  filterForm,
  filterJobs,
  isBusy,
  jobs,
  jobsSyncedAt,
  loadRecommendations,
  resetJobFilters,
  selectedCv,
  selectedCvId,
  setFilterForm,
  setSelectedCvId,
  trackApplication,
}) {
  const syncLabel = formatSyncTime(jobsSyncedAt);

  function update(field, value) {
    setFilterForm({ ...filterForm, [field]: value });
  }

  return (
    <div className={ui.pageGrid}>

      {/* ── Filter card ──────────────────────────────────────────────── */}
      <section className={`${ui.panel} ${ui.full}`}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Intelligent search</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              Filter jobs
              {selectedCv && (
                <span className="ml-2 font-normal text-[#6B6B72]">
                  · matching against {selectedCv.title}
                </span>
              )}
            </h2>
            {syncLabel && (
              <p
                className="mt-0.5 text-[11px] text-[#A4A4AC]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {syncLabel} · {jobs.length} jobs
              </p>
            )}
          </div>
          <div className={ui.buttonRow}>
            <button
              type="button"
              className={ui.buttonGhost}
              disabled={isBusy}
              onClick={fetchJobs}
              title="Re-import jobs from Adzuna"
            >
              <FiRefreshCw size={13} strokeWidth={1.5} />
              Sync
            </button>
            <button
              type="button"
              className={ui.buttonCobalt}
              disabled={isBusy || !selectedCvId}
              onClick={loadRecommendations}
              title={!selectedCvId ? "Select a CV to get recommendations" : "Rank all jobs by weighted match score for your CV"}
            >
              <FiZap size={14} strokeWidth={1.5} />
              Get Recommendations
            </button>
          </div>
        </div>

        {/* ── CV selector ──────────────────────────────────────────── */}
        {cvs.length > 0 && (
          <div className="mb-4 rounded-[8px] border border-[#E8E3D7] bg-[#F6F3EC] p-3">
            <p
              className="mb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6B72]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
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
                    style={
                      isActive
                        ? { background: "var(--c-cobalt)", color: "#fff", borderColor: "var(--c-cobalt)" }
                        : { background: "#FBFAF6", color: "#3A3A40", borderColor: "#E8E3D7" }
                    }
                  >
                    {isActive && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {cv.title}
                    <span
                      className="opacity-60"
                      style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}
                    >
                      {cv.version || "v1"}
                    </span>
                  </button>
                );
              })}
            </div>
            {!selectedCvId && (
              <p className="mt-2 text-[12px] text-[#A4A4AC]">
                Select a CV to enable match scoring, compatibility sort, and smart filters.
              </p>
            )}
          </div>
        )}

        {cvs.length === 0 && (
          <div className="mb-4 rounded-[8px] border border-dashed border-[#A4A4AC] p-3 text-[12px] text-[#A4A4AC]">
            No CV profiles yet. Go to My CVs to create one and unlock match scoring.
          </div>
        )}

        {/* ── Filter form ───────────────────────────────────────────── */}
        <form className="grid gap-3" onSubmit={filterJobs}>

          {/* Row 1 — Position + company + location + search */}
          <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_auto_auto] items-end gap-3 max-xl:grid-cols-[repeat(2,minmax(0,1fr))] max-sm:grid-cols-1">
            <label className={ui.label}>
              Position / keyword
              <input
                className={ui.input}
                placeholder="e.g. React Developer"
                value={filterForm.keyword}
                onChange={(e) => update("keyword", e.target.value)}
              />
            </label>
            <label className={ui.label}>
              Company
              <input
                className={ui.input}
                placeholder="e.g. Google"
                value={filterForm.company}
                onChange={(e) => update("company", e.target.value)}
              />
            </label>
            <label className={ui.label}>
              Location
              <input
                className={ui.input}
                placeholder="e.g. London"
                value={filterForm.location}
                onChange={(e) => update("location", e.target.value)}
              />
            </label>
            <button className={`${ui.button} w-[118px]`} disabled={isBusy} type="submit">
              <FiSearch size={14} strokeWidth={1.5} />
              {isBusy ? "Searching…" : "Search"}
            </button>
            <button
              className={`${ui.buttonGhost} w-[92px]`}
              disabled={isBusy}
              onClick={resetJobFilters}
              type="button"
            >
              <FiX size={14} strokeWidth={1.5} />
              Reset
            </button>
          </div>

          {/* Row 2 — Skill + work type + seniority + sort */}
          <div className="grid grid-cols-4 items-end gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <label className={ui.label}>
              Skill
              <input
                className={ui.input}
                placeholder="e.g. React"
                value={filterForm.skill}
                onChange={(e) => update("skill", e.target.value)}
              />
            </label>
            <label className={ui.label}>
              Work type
              <select
                className={ui.input}
                value={filterForm.remoteType}
                onChange={(e) => update("remoteType", e.target.value)}
              >
                <option value="">Any</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </label>
            <label className={ui.label}>
              Seniority
              <select
                className={ui.input}
                value={filterForm.seniority}
                onChange={(e) => update("seniority", e.target.value)}
              >
                <option value="">Any level</option>
                <option value="Intern">Intern</option>
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
              </select>
            </label>
            <label className={ui.label}>
              Sort by
              <select
                className={ui.input}
                value={filterForm.sort}
                onChange={(e) => update("sort", e.target.value)}
              >
                <option value="newest">Newest jobs</option>
                <option value="score">Highest compatibility</option>
                <option value="gaps">Least skill gaps</option>
                <option value="potential">Highest interview potential</option>
              </select>
            </label>
          </div>

          {/* Row 3 — CV-specific match filters (only when CV is selected) */}
          {selectedCvId && (
            <div className="rounded-[8px] border border-[#E8E3D7] bg-[#F6F3EC] p-3">
              <p
                className="mb-3 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6B72]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Match filters · require CV
              </p>
              <div className="grid grid-cols-4 items-end gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
                <label className={ui.label}>
                  Min match %
                  <input
                    className={ui.input}
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 60"
                    value={filterForm.minMatch}
                    onChange={(e) => update("minMatch", e.target.value)}
                  />
                </label>
                <label className={ui.label}>
                  Max skill gaps
                  <input
                    className={ui.input}
                    type="number"
                    min="0"
                    placeholder="e.g. 3"
                    value={filterForm.maxSkillGap}
                    onChange={(e) => update("maxSkillGap", e.target.value)}
                  />
                </label>
                <label className={ui.label}>
                  Fit level
                  <select
                    className={ui.input}
                    value={filterForm.level}
                    onChange={(e) => update("level", e.target.value)}
                  >
                    <option value="">Any fit</option>
                    <option value="High">High fit (≥75%)</option>
                    <option value="Medium">Medium fit (50–74%)</option>
                    <option value="Low">Low fit (&lt;50%)</option>
                  </select>
                </label>
                <label className={ui.label}>
                  Min salary
                  <input
                    className={ui.input}
                    type="number"
                    min="0"
                    placeholder="e.g. 30000"
                    value={filterForm.salaryMin}
                    onChange={(e) => update("salaryMin", e.target.value)}
                  />
                </label>
              </div>
            </div>
          )}
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
