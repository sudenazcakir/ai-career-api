import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiBookmark,
  FiCheck,
  FiChevronRight,
  FiInfo,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiZap,
} from "react-icons/fi";
import { ScoreBadge } from "../components/common/DataViews";
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

function jobKey(job, index = 0) {
  return job._id || `${job.title || "job"}-${job.company || "company"}-${index}`;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function formatSalary(job) {
  if (job.salaryMin == null && job.salaryMax == null) return null;
  const min = job.salaryMin ? Math.round(job.salaryMin / 1000) : null;
  const max = job.salaryMax ? Math.round(job.salaryMax / 1000) : null;
  if (min && max) return `${min}k-${max}k`;
  if (min) return `from ${min}k`;
  return `up to ${max}k`;
}

function hasActiveFilters(filterForm) {
  return Object.entries(filterForm).some(([key, value]) => {
    if (!value) return false;
    if (key === "sort") return value !== "newest";
    return true;
  });
}

function getRequiredSkillRows(job, selectedCv) {
  const matched = job.matchedSkills || [];
  const missing = job.missingSkills || [];
  const partial = job.partialSkills || [];
  const cvSkillSet = new Set((selectedCv?.skills || []).map(normalize));
  const rows = new Map();

  function add(skill, state) {
    const key = normalize(skill);
    if (!key || rows.has(key)) return;
    rows.set(key, { skill, state });
  }

  matched.forEach((skill) => add(skill, "have"));
  partial.forEach((skill) => add(skill, "partial"));
  missing.forEach((skill) => add(skill, "gap"));
  (job.skills || []).forEach((skill) => {
    if (cvSkillSet.size) {
      add(skill, cvSkillSet.has(normalize(skill)) ? "have" : "gap");
    } else {
      add(skill, "neutral");
    }
  });

  return [...rows.values()];
}

function getFitHint(job) {
  const score = job.matchScore ?? 0;
  if (job.level) return `${job.level} fit`;
  if (score >= 75) return "High fit";
  if (score >= 50) return "Medium fit";
  return "Low fit";
}

function getFitTone(job) {
  const level = normalize(job.level);
  const score = job.matchScore ?? 0;
  if (level === "high" || score >= 75) return "high";
  if (level === "medium" || score >= 50) return "medium";
  return "low";
}

function FitPill({ job }) {
  const tone = getFitTone(job);
  const className =
    tone === "high"
      ? "border-[#E6EBFF] bg-[#E6EBFF] text-[#1E3FFF]"
      : tone === "medium"
        ? "border-[var(--c-warning-50)] bg-[var(--c-warning-50)] text-[var(--c-warning)]"
        : "border-[#EFE5F8] bg-[#EFE5F8] text-[#5B2A86]";

  return (
    <span className={`inline-flex h-[24px] items-center rounded-[6px] border px-2 text-[12px] font-medium ${className}`}>
      {getFitHint(job)}
    </span>
  );
}

function MetaPill({ children }) {
  return (
    <span className="inline-flex h-[24px] items-center rounded-[6px] border border-[#E8E3D7] bg-[#F6F3EC] px-2 text-[12px] font-medium text-[#3A3A40]">
      {children}
    </span>
  );
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
  const [selectedJobId, setSelectedJobId] = useState("");
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  const [jobListMaxHeight, setJobListMaxHeight] = useState(null);
  const closeTimerRef = useRef(null);
  const jobListRef = useRef(null);
  const selectedJob = useMemo(
    () => jobs.find((job, index) => jobKey(job, index) === selectedJobId) || null,
    [jobs, selectedJobId]
  );
  const showReset = hasActiveFilters(filterForm);

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  useEffect(() => {
    if (!selectedJobId) return;
    const stillExists = jobs.some((job, index) => jobKey(job, index) === selectedJobId);
    if (!stillExists) {
      clearCloseTimer();
      setIsDetailClosing(false);
      setSelectedJobId("");
    }
  }, [jobs, selectedJobId]);

  useEffect(() => () => clearCloseTimer(), []);

  useEffect(() => {
    const list = jobListRef.current;
    if (!list || jobs.length <= 6) {
      setJobListMaxHeight(null);
      return undefined;
    }

    function updateJobListHeight() {
      const children = Array.from(list.children).slice(0, 6);
      const styles = window.getComputedStyle(list);
      const gap = parseFloat(styles.rowGap || styles.gap) || 0;
      const height = children.reduce(
        (total, child) => total + child.getBoundingClientRect().height,
        0
      ) + gap * Math.max(children.length - 1, 0);

      setJobListMaxHeight(Math.ceil(height));
    }

    updateJobListHeight();
    window.addEventListener("resize", updateJobListHeight);
    return () => window.removeEventListener("resize", updateJobListHeight);
  }, [jobs, selectedJobId]);

  function update(field, value) {
    setFilterForm({ ...filterForm, [field]: value });
  }

  function selectJob(job, index) {
    clearCloseTimer();
    setIsDetailClosing(false);
    setSelectedJobId(jobKey(job, index));
  }

  function finishDetailClose() {
    clearCloseTimer();
    setIsDetailClosing(false);
    setSelectedJobId("");
  }

  function closeJobDetail() {
    if (!selectedJobId || isDetailClosing) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (prefersReducedMotion) {
      finishDetailClose();
      return;
    }

    setIsDetailClosing(true);
    closeTimerRef.current = window.setTimeout(finishDetailClose, 280);
  }

  function handleDetailAnimationEnd() {
    if (isDetailClosing) finishDetailClose();
  }

  return (
    <div className="grid gap-[18px]">
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Intelligent search</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              Filter jobs
              {selectedCv && (
                <span className="ml-2 font-normal text-[#6B6B72]">
                  - matching against {selectedCv.title}
                </span>
              )}
            </h2>
            {syncLabel && (
              <p className="mt-1 text-[11px] text-[#A4A4AC] font-mono" data-testid="sync-status">
                {syncLabel} - {jobs.length} jobs
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

        {cvs.length > 0 ? (
          <div className="mb-4 rounded-[10px] border border-[#E8E3D7] bg-[#F6F3EC] p-3">
            <p className={ui.miniLabel}>Match against CV</p>
            <div className="flex flex-wrap gap-2">
              {cvs.map((cv) => {
                const isActive = cv._id === selectedCvId;
                return (
                  <button
                    key={cv._id}
                    type="button"
                    onClick={() => setSelectedCvId(cv._id)}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-[8px] border px-3 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF] focus-visible:ring-offset-1 ${
                      isActive
                        ? "border-[#1E3FFF] bg-[#1E3FFF] text-white"
                        : "border-[#E8E3D7] bg-[#FBFAF6] text-[#3A3A40] hover:border-[#A4A4AC]"
                    }`}
                  >
                    {isActive && <FiCheck size={12} strokeWidth={1.5} />}
                    {cv.title}
                    <span className="text-[10px] opacity-65 font-mono">{cv.version || "v1"}</span>
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
        ) : (
          <div className="mb-4 rounded-[8px] border border-dashed border-[#A4A4AC] p-3 text-[12px] text-[#A4A4AC]">
            No CV profiles yet. Go to My CVs to create one and unlock match scoring.
          </div>
        )}

        <form className="grid gap-3" onSubmit={filterJobs}>
          <div className="rounded-[10px] border border-[#E8E3D7] bg-[#FBFAF6] p-3">
            <p className={ui.miniLabel}>Search fields</p>
            <div className="grid grid-cols-[1.2fr_1fr_1fr_auto_auto] items-end gap-3 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
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
              <button className={`${ui.button} min-w-[112px]`} disabled={isBusy} type="submit">
                <FiSearch size={14} strokeWidth={1.5} />
                {isBusy ? "Searching..." : "Search"}
              </button>
              {showReset && (
                <button
                  className={`${ui.buttonGhost} min-w-[92px]`}
                  disabled={isBusy}
                  onClick={resetJobFilters}
                  type="button"
                >
                  <FiX size={14} strokeWidth={1.5} />
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-3 rounded-[10px] border border-[#E8E3D7] bg-[#F6F3EC] p-3">
            <p className={ui.miniLabel}>Role filters</p>
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
          </div>

          {selectedCvId && (
            <div className="grid gap-3 rounded-[10px] border border-[#E8E3D7] bg-[#F6F3EC] p-3">
              <p className={ui.miniLabel}>Match filters - require CV</p>
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
                    <option value="High">High fit (75%+)</option>
                    <option value="Medium">Medium fit (50-74%)</option>
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

      <section
        className={`jobs-detail-layout ${selectedJob ? "has-detail" : ""} ${
          isDetailClosing ? "is-closing" : ""
        }`}
      >
        <div className={ui.panel}>
          <div className={ui.sectionHead}>
            <div>
              <p className={ui.eyebrow}>Job results</p>
              <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
                {jobs.length > 0 ? `${jobs.length} results` : "No results yet"}
              </h2>
              <p className="mt-1 max-w-[680px] text-[12px] leading-relaxed text-[#6B6B72]">
                Match % shows how closely the selected CV fits each role. Fit labels summarize the score band, and skill chips show detected requirements: green means covered, purple means a gap.
              </p>
            </div>
            <span className={ui.count}>{jobs.length} jobs</span>
          </div>

          {jobs.length ? (
            <div
              className={`grid gap-2.5 ${jobs.length > 6 ? "overflow-y-auto pr-1" : ""}`}
              data-testid="jobs-list"
              ref={jobListRef}
              style={jobListMaxHeight ? { maxHeight: jobListMaxHeight } : undefined}
            >
              {jobs.map((job, index) => (
                <SelectableJobCard
                  isSelected={jobKey(job, index) === selectedJobId}
                  job={job}
                  key={jobKey(job, index)}
                  onSave={trackApplication}
                  onSelect={() => selectJob(job, index)}
                  selectedCv={selectedCv}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-[8px] border border-dashed border-[#A4A4AC] p-4 text-center text-[13px] text-[#6B6B72]">
              No jobs yet. Import or filter to populate this list.
            </p>
          )}
        </div>

        {selectedJob && (
          <div className="job-detail-column">
            <JobDetailPanel
              isClosing={isDetailClosing}
              job={selectedJob}
              onAnimationEnd={handleDetailAnimationEnd}
              onClose={closeJobDetail}
              onSave={trackApplication}
              selectedCv={selectedCv}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function SelectableJobCard({ isSelected, job, onSave, onSelect, selectedCv }) {
  const requiredRows = getRequiredSkillRows(job, selectedCv);
  const gapCount = (job.missingSkills || []).length;

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  }

  return (
    <article
      className={`grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] gap-4 rounded-[12px] border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF] focus-visible:ring-offset-1 max-sm:grid-cols-1 ${
        isSelected
          ? "border-[#0E0E10] bg-[#F6F3EC]"
          : "border-[#E8E3D7] bg-[#FBFAF6] hover:border-[#A4A4AC]"
      }`}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="min-w-0">
        <div className="min-w-0">
          <div className="min-w-0">
            <h3 className="truncate text-[17px] font-semibold tracking-[-0.01em] text-[#0E0E10]">
              {job.title}
            </h3>
            <p className="mt-1 truncate text-[12px] uppercase tracking-[0.1em] text-[#6B6B72] font-mono">
              {[job.company, job.location, job.remoteType].filter(Boolean).join(" - ") || "Role details"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <FitPill job={job} />
          {gapCount > 0 && <MetaPill>{gapCount} gap{gapCount === 1 ? "" : "s"}</MetaPill>}
          {formatSalary(job) && <MetaPill>{formatSalary(job)}</MetaPill>}
        </div>

        <div className={`${ui.chips} mt-3`}>
          {requiredRows.slice(0, 6).map(({ skill, state }) => (
            <SkillStateChip key={`${skill}-${state}`} skill={skill} state={state} />
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-3">
        <FiChevronRight
          className={`h-4 w-4 transition-transform ${isSelected ? "translate-x-0 text-[#0E0E10]" : "text-[#A4A4AC]"}`}
          aria-hidden="true"
        />
        <div className="flex flex-col items-end gap-2">
          <ScoreBadge value={job.matchScore} />
          <SaveJobButton job={job} onSave={onSave} />
        </div>
      </div>
    </article>
  );
}

function JobDetailPanel({ isClosing, job, onAnimationEnd, onClose, onSave, selectedCv }) {
  const requiredRows = getRequiredSkillRows(job, selectedCv);
  const matchedCount = requiredRows.filter((row) => row.state === "have").length;
  const gapCount = requiredRows.filter((row) => row.state === "gap").length;
  const partialCount = requiredRows.filter((row) => row.state === "partial").length;

  return (
    <aside
      className={`job-detail-panel sticky top-5 h-max min-w-0 overflow-hidden rounded-[12px] border border-[#E8E3D7] bg-[#FBFAF6] lg:max-h-[calc(100vh-40px)] lg:overflow-y-auto ${
        isClosing ? "is-closing" : ""
      }`}
      onAnimationEnd={onAnimationEnd}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#E8E3D7] p-5">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B72] font-mono">
            {[job.company, job.location, job.remoteType].filter(Boolean).join(" - ") || "Selected role"}
          </p>
          <h3
            className="mt-3 break-words"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px,4vw,46px)",
              fontWeight: 400,
              lineHeight: 0.98,
              letterSpacing: "-0.02em",
              color: "var(--c-ink)",
            }}
          >
            {job.title}
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <FitPill job={job} />
            {job.seniority && <MetaPill>{job.seniority}</MetaPill>}
            {formatSalary(job) && <MetaPill>{formatSalary(job)}</MetaPill>}
          </div>
        </div>
        <button
          aria-label="Close job detail"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-[#6B6B72] transition-colors hover:bg-[#F6F3EC] hover:text-[#0E0E10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF]"
          onClick={onClose}
          type="button"
        >
          <FiX size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="grid gap-5 p-5">
        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-5 max-sm:grid-cols-1">
          <ScoreRing value={job.matchScore} />
          <div className="min-w-0">
            <p className={ui.eyebrow}>About the role</p>
            <p className="mt-2 text-[14px] leading-relaxed text-[#3A3A40]">
              {job.description || job.explanation || "No role description is available for this job yet."}
            </p>
          </div>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className={ui.eyebrow}>Required skills</p>
              <p className="text-[13px] text-[#6B6B72]">
                {matchedCount} have - {gapCount} gap{partialCount ? ` - ${partialCount} partial` : ""}
              </p>
            </div>
          </div>
          {requiredRows.length ? (
            <div className="grid gap-2">
              {requiredRows.map(({ skill, state }) => (
                <SkillRequirementRow key={`${skill}-${state}`} skill={skill} state={state} />
              ))}
            </div>
          ) : (
            <p className="rounded-[8px] border border-dashed border-[#A4A4AC] p-3 text-[13px] text-[#6B6B72]">
              No required skills were detected for this role.
            </p>
          )}
        </section>

        <MatchExplanation job={job} />

        <SaveJobButton job={job} onSave={onSave} size="large" />
      </div>
    </aside>
  );
}

function MatchExplanation({ job }) {
  const breakdown = job.breakdown;
  const matched = job.matchedSkills || [];
  const missing = job.missingSkills || [];

  return (
    <section className="rounded-[10px] border border-[#E8E3D7] bg-[#FBFAF6] p-4">
      <div className="mb-3 flex items-center gap-2">
        <FiInfo className="h-4 w-4 text-[#6B6B72]" aria-hidden="true" />
        <p className={ui.eyebrow}>Why this score?</p>
      </div>
      {job.explanation ? (
        <p className="text-[13px] leading-relaxed text-[#3A3A40]">{job.explanation}</p>
      ) : (
        <p className="text-[13px] leading-relaxed text-[#3A3A40]">
          Match summary is based on available skills and score data for this job.
        </p>
      )}
      {matched.length > 0 && (
        <p className="mt-2 text-[13px] text-[#6B6B72]">
          Strong overlap: {matched.slice(0, 4).join(", ")}.
        </p>
      )}
      {missing.length > 0 && (
        <p className="mt-1 text-[13px] text-[#6B6B72]">
          Missing skills: {missing.slice(0, 4).join(", ")}{missing.length > 4 ? `, +${missing.length - 4} more` : ""}.
        </p>
      )}
      {breakdown && (
        <div className="mt-4 grid gap-2">
          <BreakdownBar label="Skill" value={breakdown.skillScore} />
          <BreakdownBar label="Experience" value={breakdown.experienceScore} />
          <BreakdownBar label="Role" value={breakdown.roleScore} />
        </div>
      )}
    </section>
  );
}

function ScoreRing({ value = 0 }) {
  const score = Math.max(0, Math.min(Number(value) || 0, 100));
  const fillColor = score >= 75 ? "#D7E25C" : score >= 50 ? "#1E3FFF" : "#A4A4AC";
  const textColor = score >= 75 ? "#0E0E10" : score >= 50 ? "#1E3FFF" : "#6B6B72";

  return (
    <div
      className="grid aspect-square place-items-center rounded-full p-[10px]"
      style={{
        background: `conic-gradient(${fillColor} ${score}%, #E8E3D7 0)`,
      }}
      aria-label={`Match score ${score}%`}
    >
      <div className="grid h-full w-full place-items-center rounded-full bg-[#FBFAF6]">
        <strong
          className="text-[26px] font-semibold tracking-[-0.02em]"
          style={{ color: textColor }}
        >
          {score}%
        </strong>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value = 0 }) {
  return (
    <div className="grid items-center gap-2" style={{ gridTemplateColumns: "76px 1fr 34px" }}>
      <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6B72] font-mono">
        {label}
      </span>
      <div className="h-[5px] overflow-hidden rounded-[3px] bg-[#E8E3D7]">
        <div
          className="h-full rounded-[3px] bg-[#0E0E10]"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="text-right text-[10px] font-medium text-[#6B6B72] font-mono">{value}</span>
    </div>
  );
}

function SkillStateChip({ skill, state }) {
  const className =
    state === "have" ? ui.chipMatched :
    state === "gap" ? ui.chipMissing :
    state === "partial" ? ui.chipPartial :
    ui.chip;

  return <span className={className}>{skill}</span>;
}

function SkillRequirementRow({ skill, state }) {
  const label =
    state === "have" ? "have" :
    state === "gap" ? "gap" :
    state === "partial" ? "partial" :
    "required";
  const rowClass =
    state === "have" ? "bg-[#E5F4EC] text-[#0E7C4A]" :
    state === "gap" ? "bg-[#EFE5F8] text-[#5B2A86]" :
    state === "partial" ? "bg-[rgba(229,184,11,0.16)] text-[#6b5a07]" :
    "bg-[#F6F3EC] text-[#3A3A40]";

  return (
    <div className={`flex items-center justify-between gap-3 rounded-[8px] px-3 py-2 ${rowClass}`}>
      <span className="min-w-0 truncate text-[13px] font-medium">{skill}</span>
      <span className="shrink-0 text-[10px] uppercase tracking-[0.08em] font-mono">{label}</span>
    </div>
  );
}

function SaveJobButton({ job, onSave, size = "default" }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  async function handleSave(event) {
    event.stopPropagation();
    if (!onSave || isSaving) return;
    setIsSaving(true);
    setIsSaved(false);
    let didSave;
    try {
      didSave = await onSave(job, "Saved for Later");
    } finally {
      setIsSaving(false);
    }
    if (didSave === false) return;
    setIsSaved(true);
    window.setTimeout(() => setIsSaved(false), 1800);
  }

  return (
    <button
      type="button"
      className={`${size === "large" ? ui.button : ui.buttonGhost} ${size === "large" ? "w-full" : "h-8"}`}
      disabled={isSaving}
      onClick={handleSave}
    >
      {isSaved ? <FiCheck size={14} strokeWidth={1.5} /> : <FiBookmark size={14} strokeWidth={1.5} />}
      {isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
    </button>
  );
}
