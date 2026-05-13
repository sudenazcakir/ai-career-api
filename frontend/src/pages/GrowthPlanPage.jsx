import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FiTarget, FiX, FiZap } from "react-icons/fi";
import { ui } from "../styles/ui";
import { getMilestoneData } from "../data/skillRoadmaps";
import { getGapsForSource } from "../utils/gapSourceUtils";
import TimelineRow from "../components/roadmap/TimelineRow";

const STAGE_TIMELINE = ["Week 1-2", "Week 3-5", "Week 6-8", "Week 9-10"];
const ROADMAP_STORAGE_PREFIX = "lattice:growth-plan";

const SOURCE_OPTIONS = [
  { id: "cv_gaps",       label: "CV Gaps",        desc: "Skills your CV is missing from loaded jobs" },
  { id: "market_trends", label: "Market Signals",  desc: "Portfolio-wide missing skills across all your CVs" },
  { id: "target_job",    label: "Target Job",      desc: "Gap between your CV and a specific job" },
  { id: "similar_roles", label: "Similar Roles",   desc: "Skills missing from your recommended jobs" },
];


function buildHeroText(canGenerate, jobCount, gapCount, hasCv, hasJobs) {
  if (canGenerate) {
    const gapWord = gapCount === 1 ? "gap" : "gaps";
    const jobWord = jobCount === 1 ? "job" : "jobs";
    return jobCount > 0
      ? `${gapCount} skill ${gapWord} selected from ${jobCount} ${jobWord}. Generate your personalised growth plan.`
      : `${gapCount} skill ${gapWord} selected. Generate your personalised growth plan.`;
  }
  if (!hasJobs) return "Load jobs and select a CV to generate your personalised growth plan.";
  if (!hasCv)  return "Select a CV to compare against your loaded jobs.";
  return "No skill gaps found - your CV covers all job requirements.";
}

function buildStorageKey(userId, selectedCvId) {
  if (!selectedCvId) return "";
  const safeUserId = encodeURIComponent(String(userId || "local"));
  return `${ROADMAP_STORAGE_PREFIX}:${safeUserId}:${selectedCvId}`;
}

function normalizeCompletion(stages, previous = []) {
  return stages.map((stage, index) =>
    Array.isArray(previous[index]) && previous[index].length === stage.steps.length
      ? previous[index].map(Boolean)
      : new Array(stage.steps.length).fill(false)
  );
}

function readStoredPlan(storageKey) {
  if (!storageKey) return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.stages) || !parsed.stages.length) return null;
    return {
      completion: Array.isArray(parsed.completion) ? parsed.completion : [],
      label: typeof parsed.label === "string" ? parsed.label : "",
      selectedSkills: Array.isArray(parsed.selectedSkills) ? parsed.selectedSkills : [],
      source: typeof parsed.source === "string" ? parsed.source : "roadmap",
      stages: parsed.stages,
    };
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
}

function normalizeSkillName(skill) {
  return String(skill || "").trim();
}

function skillKey(skill) {
  return normalizeSkillName(skill).toLowerCase();
}

function toSkillItem(item) {
  if (typeof item === "string") {
    return { skill: normalizeSkillName(item), count: 0, cat: "technical" };
  }
  return {
    skill: normalizeSkillName(item?.skill),
    count: Number(item?.count || 0),
    cat: item?.cat || "technical",
  };
}

function uniqueSkillItems(...groups) {
  const map = new Map();
  groups.flat().forEach((item) => {
    const normalized = toSkillItem(item);
    const key = skillKey(normalized.skill);
    if (key && !map.has(key)) map.set(key, normalized);
  });
  return [...map.values()];
}

export default function GrowthPlanPage({
  analyzeGaps,
  jobs,
  onRoadmapIntentConsumed,
  recommendations,
  roadmapIntent,
  roadmapStorageUserId,
  selectedCv,
  setStatus,
  skillAnalytics,
}) {

  const navigate   = useNavigate();

  const [source, setSource]               = useState("cv_gaps");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [savedPlan, setSavedPlan]     = useState(null);
  const [selectedSkillNames, setSelectedSkillNames] = useState([]);
  const [completion, setCompletion]   = useState([]);
  const timerRef = useRef(null);

  const allJobs    = [...jobs, ...recommendations].filter((j) => j?._id);
  const uniqueJobs = [...new Map(allJobs.map((j) => [j._id, j])).values()];

  const intentSelectedSkills = Array.isArray(roadmapIntent?.selectedSkills)
    ? roadmapIntent.selectedSkills.map(normalizeSkillName).filter(Boolean).slice(0, 4)
    : [];

  const targetJob = uniqueJobs.find((j) => j._id === selectedJobId) || null;
  const sourceGaps = getGapsForSource(source, { jobs, uniqueJobs, recommendations, selectedCv, targetJob, skillAnalytics });
  const recommendedGaps = uniqueSkillItems(sourceGaps.slice(0, 8));
  const defaultSelectedSkills = (
    intentSelectedSkills.length
      ? intentSelectedSkills
      : recommendedGaps.slice(0, 3).map((gap) => gap.skill)
  ).slice(0, 4);

  const storageKey = useMemo(
    () => buildStorageKey(roadmapStorageUserId, selectedCv?._id),
    [roadmapStorageUserId, selectedCv?._id]
  );

  const hasJobs = uniqueJobs.length > 0;
  const hasCv   = Boolean(selectedCv);

  const selectedSkillItems = selectedSkillNames.map((skill) => {
    const key = skillKey(skill);
    return recommendedGaps.find((item) => skillKey(item.skill) === key)
      || sourceGaps.find((item) => skillKey(item.skill) === key)
      || { skill, count: 0, cat: "technical" };
  });
  const computedStages = selectedSkillItems.map((g, i) => {
    const milestone = getMilestoneData(g.skill);
    return {
      id:             `s${i}`,
      label:          STAGE_TIMELINE[i] || `Phase ${i + 1}`,
      skill:          g.skill,
      steps:          milestone.steps,
      freq:           g.count,
      category:       milestone.category,
      difficulty:     milestone.difficulty,
      estimatedWeeks: milestone.estimatedWeeks,
      prerequisites:  milestone.prerequisites,
      projectIdea:    milestone.projectIdea,
      proofOfWork:    milestone.proofOfWork,
    };
  });
  const canGenerate = hasCv && selectedSkillNames.length > 0;
  const heroText = buildHeroText(canGenerate, uniqueJobs.length, selectedSkillNames.length || recommendedGaps.length, hasCv, hasJobs);
  const stages = savedPlan?.stages?.length ? savedPlan.stages : computedStages;
  const hasStages = stages.length > 0;
  const defaultSelectedSignature = defaultSelectedSkills.join("|");
  const stageSignature = useMemo(
    () => stages.map((stage) => `${stage.skill}:${stage.steps.length}`).join("|"),
    [stages]
  );

  useEffect(() => {
    setGenerating(false);
    clearTimeout(timerRef.current);

    const hasIncomingIntent =
      Boolean(roadmapIntent) &&
      (
        roadmapIntent.source === "skill-map" ||
        roadmapIntent.source === "insights" ||
        intentSelectedSkills.length > 0
      );

    if (hasIncomingIntent) {
      if (storageKey) localStorage.removeItem(storageKey);
      if (roadmapIntent.source === "skill-map") setSource("cv_gaps");
      else if (roadmapIntent.source === "insights") setSource("target_job");
      else if (roadmapIntent.source === "market") setSource("market_trends");
      else setSource("cv_gaps");
      setSavedPlan(null);
      setSelectedSkillNames(defaultSelectedSkills);
      setCompletion([]);
      setShowRoadmap(false);
      if (typeof onRoadmapIntentConsumed === "function") onRoadmapIntentConsumed();
      return;
    }

    const storedPlan = readStoredPlan(storageKey);
    if (storedPlan) {
      const storedSkills = storedPlan.selectedSkills.length
        ? storedPlan.selectedSkills.map(normalizeSkillName).filter(Boolean).slice(0, 4)
        : storedPlan.stages.map((stage) => stage.skill).filter(Boolean).slice(0, 4);
      setSavedPlan({
        label: storedPlan.label,
        selectedSkills: storedSkills,
        source: storedPlan.source,
        stages: storedPlan.stages,
      });
      setSelectedSkillNames(storedSkills);
      setCompletion(normalizeCompletion(storedPlan.stages, storedPlan.completion));
      setShowRoadmap(true);
      return;
    }

    setSavedPlan(null);
    setSelectedSkillNames(defaultSelectedSkills);
    setCompletion([]);
    setShowRoadmap(false);
  }, [defaultSelectedSignature, roadmapIntent, storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    setCompletion((prev) => normalizeCompletion(stages, prev));
  }, [stageSignature]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!storageKey || !showRoadmap || !hasStages) return;
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        completion: normalizeCompletion(stages, completion),
        label: savedPlan?.label || roadmapIntent?.label || "",
        selectedSkills: selectedSkillNames,
        source: savedPlan?.source || roadmapIntent?.source || "roadmap",
        stages,
        updatedAt: new Date().toISOString(),
      })
    );
  }, [completion, hasStages, showRoadmap, stageSignature, storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeIndex = useMemo(() => {
    for (let i = 0; i < stages.length; i++) {
      if (!completion[i]?.every(Boolean)) return i;
    }
    return Math.max(stages.length - 1, 0);
  }, [completion, stages.length]);

  function toggleSkillSelection(skill) {
    const normalizedSkill = normalizeSkillName(skill);
    if (!normalizedSkill) return;

    const currentKeys = new Set(selectedSkillNames.map(skillKey));
    const isSelected = currentKeys.has(skillKey(normalizedSkill));
    if (!isSelected && selectedSkillNames.length >= 4) return;

    const nextSkills = isSelected
      ? selectedSkillNames.filter((item) => skillKey(item) !== skillKey(normalizedSkill))
      : [...selectedSkillNames, normalizedSkill];

    if (storageKey) localStorage.removeItem(storageKey);
    setGenerating(false);
    setSavedPlan(null);
    setCompletion([]);
    setShowRoadmap(false);
    setSelectedSkillNames(nextSkills);
  }

  function handleSourceChange(newSource) {
    if (newSource === source) return;
    if (storageKey) localStorage.removeItem(storageKey);
    setSource(newSource);
    setSelectedJobId("");
    setSavedPlan(null);
    setSelectedSkillNames([]);
    setCompletion([]);
    setShowRoadmap(false);

    if (newSource === "similar_roles" && recommendations.filter((r) => r?._id).length === 0) {
      setStatus("No recommended jobs loaded. Go to Jobs and load recommendations first.");
    }
    if (newSource === "target_job" && uniqueJobs.length === 0) {
      setStatus("No jobs loaded. Fetch jobs from the Jobs page first.");
    }
    if (newSource === "market_trends" && !skillAnalytics?.data?.length) {
      setStatus("Market Signals not loaded yet. Visit the Market Signals page and click Refresh analytics.");
    }
  }

  function handleGenerate() {
    if (!canGenerate || generating) return;
    const nextStages = computedStages;
    setSavedPlan({
      label: roadmapIntent?.label || "",
      selectedSkills: selectedSkillNames,
      source: roadmapIntent?.source || "roadmap",
      stages: nextStages,
    });
    setCompletion(normalizeCompletion(nextStages));
    setGenerating(true);
    timerRef.current = setTimeout(() => {
      setGenerating(false);
      setShowRoadmap(true);
      if (typeof analyzeGaps === "function") analyzeGaps(selectedSkillNames);
    }, 900);
  }

  function requestResetPlan() {
    setShowResetConfirm(true);
  }

  function cancelResetPlan() {
    setShowResetConfirm(false);
  }

  function confirmResetPlan() {
    clearTimeout(timerRef.current);
    if (storageKey) localStorage.removeItem(storageKey);
    setGenerating(false);
    setShowResetConfirm(false);
    setSavedPlan(null);
    setSelectedSkillNames(defaultSelectedSkills);
    setCompletion([]);
    setShowRoadmap(false);
  }

  function toggleStep(stageIdx, stepIdx) {
    setCompletion((prev) => {
      const copy = prev.map((row) => [...row]);
      if (copy[stageIdx]) copy[stageIdx][stepIdx] = !copy[stageIdx][stepIdx];
      return copy;
    });
  }

  return (
    <div className="grid gap-[18px]">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className={`${ui.heroPanel} lat-dot-grid`}>
        <span
          aria-hidden="true"
          style={{
            position: "absolute", right: 24, bottom: -48,
            fontFamily: "var(--font-display)", fontSize: 200, lineHeight: 1,
            color: "var(--c-mist)", opacity: 0.28,
            letterSpacing: "-0.02em", pointerEvents: "none", userSelect: "none",
          }}
        >
          {stages.length || "-"}
        </span>
        <div className="relative min-w-0">
          <p className={ui.eyebrow}>Growth / Growth Plan</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px,3.5vw,46px)",
            fontWeight: 400, lineHeight: 1.02,
            letterSpacing: "-0.02em", color: "var(--c-ink)",
            maxWidth: 560, marginTop: 8,
          }}>
            Your learning <em style={{ fontStyle: "italic" }}>roadmap.</em>
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#3A3A40]">
            {heroText}
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {showRoadmap ? (
              <button
                className={ui.buttonGhost}
                type="button"
                onClick={requestResetPlan}
              >
                Reset plan
              </button>
            ) : (
              <button
                className={ui.buttonCobalt}
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate || generating}
                title={canGenerate ? "" : hasCv ? "Select at least one skill first" : "Select a CV first"}
              >
                <FiZap size={14} strokeWidth={1.5} />
                {generating ? "Generating..." : "Generate growth plan"}
              </button>
            )}
            <button
              className={ui.buttonSecondary}
              type="button"
              onClick={() => navigate("/skill-gaps")}
            >
              <FiTarget size={14} strokeWidth={1.5} />
              View skill map
            </button>
          </div>
        </div>
      </section>

      {/* ── Progress bar ──────────────────────────────────────────────── */}
      {generating && (
        <div aria-hidden="true" className="h-[3px] overflow-hidden rounded-full bg-[#E8E3D7]">
          <div className="roadmap-progress-fill" />
        </div>
      )}

      {/* ── Instruction / empty state (before generate) ───────────────── */}
      {hasCv && (
        <section className={ui.panel}>
          <div className={ui.sectionHead}>
            <div>
              <p className={ui.eyebrow}>Recommended skill gaps</p>
              <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
                Choose what this roadmap should focus on
              </h2>
              <p className="mt-1 max-w-[720px] text-[13px] leading-relaxed text-[#6B6B72]">
                {roadmapIntent?.label || SOURCE_OPTIONS.find((o) => o.id === source)?.desc || "Select up to 4 skills for a focused growth plan."}
              </p>
            </div>
            <span className={ui.count}>{selectedSkillNames.length}/4 selected</span>
          </div>
          {/* Source selector — always visible when user has a CV */}
          <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Roadmap source">
            {SOURCE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`inline-flex h-8 items-center rounded-[8px] border px-3 text-[12px] font-medium transition-colors ${
                  source === opt.id
                    ? "border-[#0E0E10] bg-[#0E0E10] text-[#F6F3EC]"
                    : "border-[#E8E3D7] bg-[#FBFAF6] text-[#3A3A40] hover:border-[#A4A4AC]"
                }`}
                aria-pressed={source === opt.id}
                title={opt.desc}
                onClick={() => handleSourceChange(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Job picker — only shown when source = "target_job" */}
          {source === "target_job" && (
            <div className="mb-4">
              <label className={ui.label}>
                Select target job
                <select
                  className={ui.input}
                  value={selectedJobId}
                  onChange={(e) => {
                    setSelectedJobId(e.target.value);
                    setSavedPlan(null);
                    setSelectedSkillNames([]);
                    setShowRoadmap(false);
                  }}
                >
                  <option value="">Choose a job…</option>
                  {uniqueJobs.map((job) => (
                    <option key={job._id} value={job._id}>
                      {job.title} — {job.company}
                    </option>
                  ))}
                </select>
              </label>
              {!selectedJobId && (
                <p className="mt-1 text-[12px] text-[#6B6B72]">
                  Select a job to see which skills you need to add.
                </p>
              )}
            </div>
          )}

          {/* Skill chips — only shown when source has gaps */}
          {recommendedGaps.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recommendedGaps.map((gap) => {
                const selected = selectedSkillNames.some((skill) => skillKey(skill) === skillKey(gap.skill));
                const disabled = !selected && selectedSkillNames.length >= 4;
                return (
                  <button
                    key={gap.skill}
                    className={`inline-flex h-[30px] items-center gap-1 rounded-[6px] border px-2.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                      selected
                        ? "border-[#1E3FFF] bg-[#E6EBFF] text-[#1E3FFF]"
                        : "border-[#E8E3D7] bg-[#FBFAF6] text-[#3A3A40] hover:border-[#A4A4AC]"
                    }`}
                    disabled={disabled}
                    onClick={() => toggleSkillSelection(gap.skill)}
                    type="button"
                  >
                    {selected && <span aria-hidden="true">✓</span>}
                    {gap.skill}
                    {gap.count > 0 && <span className="font-mono text-[10px] opacity-60">{gap.count}x</span>}
                  </button>
                );
              })}
            </div>
          )}
          {recommendedGaps.length === 0 && (source !== "target_job" || Boolean(selectedJobId)) && (
            <p className="text-[13px] text-[#6B6B72]">
              No skill gaps found for this source.
              {source === "similar_roles" && " Try loading job recommendations from the Jobs page."}
            </p>
          )}
          {recommendedGaps.length > 0 && selectedSkillNames.length === 0 && (
            <p className="mt-3 text-[12px] font-medium text-[#A6261A]">
              Select at least one skill to generate a roadmap.
            </p>
          )}
        </section>
      )}

      {!showRoadmap && !generating && (
        <section className={ui.panel}>
          {canGenerate ? (
            <div className="flex flex-col items-center py-3 text-center">
              <p className="text-[13px] font-medium text-[#0E0E10]">Ready to generate</p>
              <p className="mt-1 max-w-sm text-[13px] text-[#6B6B72]">
                Each selected skill gap becomes a milestone with actionable learning steps.
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {selectedSkillNames.map((skill) => (
                  <span key={skill} className={ui.chipMissing}>{skill}</span>
                ))}
              </div>
              <button
                className={`${ui.buttonCobalt} mt-4`}
                type="button"
                onClick={handleGenerate}
              >
                <FiZap size={14} strokeWidth={1.5} />
                Generate growth plan
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-3 text-center">
              <p className="text-[13px] text-[#6B6B72]">{heroText}</p>
              <button
                className={`${ui.buttonSecondary} mt-4`}
                type="button"
                onClick={() => navigate("/skill-gaps")}
              >
                <FiTarget size={14} strokeWidth={1.5} />
                View skill map
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Timeline milestones ───────────────────────────────────────── */}
      {showRoadmap && hasStages && (
        <div>
          <div className="grid gap-[18px]">
            {stages.map((stage, idx) => (
              <section key={stage.id} className={ui.panel}>
                <TimelineRow
                  index={idx}
                  isActive={idx === activeIndex}
                  isCompleted={!!(completion[idx]?.every(Boolean))}
                  onToggleStep={(si) => toggleStep(idx, si)}
                  stage={stage}
                  stepsCompleted={completion[idx] || new Array(stage.steps.length).fill(false)}
                  weekLabel={stage.label}
                />
              </section>
            ))}
          </div>
        </div>
      )}

      {showResetConfirm && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-[rgba(14,14,16,0.38)] p-5"
          role="presentation"
          onMouseDown={cancelResetPlan}
        >
          <section
            aria-label="Reset growth plan confirmation"
            aria-modal="true"
            className="w-[min(520px,100%)] rounded-[18px] border border-[#E8E3D7] bg-[#FBFAF6] p-5 shadow-[0_24px_48px_-12px_rgba(14,14,16,0.18)]"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={ui.modalHead}>
              <div>
                <p className={ui.eyebrow}>Reset growth plan</p>
                <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-[#0E0E10]">
                  Reset this plan?
                </h2>
              </div>
              <button
                aria-label="Close reset confirmation"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-[#6B6B72] transition-colors hover:bg-[#F6F3EC] hover:text-[#0E0E10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF]"
                onClick={cancelResetPlan}
                type="button"
              >
                <FiX size={16} strokeWidth={1.5} />
              </button>
            </div>

            <p className="text-[14px] leading-relaxed text-[#3A3A40]">
              This will remove the saved roadmap for this CV and clear every completed step. You can generate a new plan again afterwards.
            </p>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button className={ui.buttonSecondary} onClick={cancelResetPlan} type="button">
                Keep plan
              </button>
              <button className={ui.button} onClick={confirmResetPlan} type="button">
                Reset plan
              </button>
            </div>
          </section>
        </div>,
        document.body
      )}
    </div>
  );
}
