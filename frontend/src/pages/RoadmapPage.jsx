import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiTarget, FiZap } from "react-icons/fi";
import { ui } from "../styles/ui";
import { buildSkillGaps } from "./SkillGapPage";
import TimelineRow from "../components/roadmap/TimelineRow";

const STAGE_STEPS = {
  docker:      ["Complete a Docker basics course", "Dockerize an existing project", "Push an image to Docker Hub", "Write multi-stage builds"],
  kubernetes:  ["Learn Kubernetes fundamentals", "Deploy a containerised app to a cluster", "Configure ingress and services", "Set up health checks and monitoring"],
  aws:         ["Cover EC2, S3 and IAM basics", "Deploy a project on the free tier", "Study for AWS Cloud Practitioner", "Use CloudWatch for observability"],
  postgresql:  ["Study indexes and query plans", "Run migrations with a migration tool", "Practice backup and restore", "Tune a slow-running query"],
  redis:       ["Understand caching patterns", "Integrate Redis into an existing project", "Handle cache invalidation logic", "Use pub/sub for event-driven messaging"],
  graphql:     ["Learn GraphQL schema design", "Build a resolver and query", "Add authentication to a schema", "Write integration tests"],
  typescript:  ["Enable strict mode in an existing project", "Type all props and return values", "Write utility and mapped types", "Migrate a JS module to TS"],
  python:      ["Complete a Python fundamentals course", "Build a focused CLI tool", "Write unit tests with pytest", "Deploy or publish a small project"],
  react:       ["Build a small CRUD app", "Add state management with Context or Zustand", "Write component tests with Vitest", "Deploy to Vercel or Netlify"],
  node:        ["Build a REST API with Express", "Add JWT authentication", "Write integration tests", "Deploy to a cloud provider"],
  java:        ["Review OOP concepts and collections", "Build a Spring Boot service", "Add persistence with JPA", "Write unit tests with JUnit"],
  spring:      ["Set up a Spring Boot project", "Implement REST endpoints", "Add database integration", "Write integration tests"],
  kafka:       ["Understand topics, producers and consumers", "Run Kafka locally with Docker", "Implement a producer/consumer app", "Handle offset management"],
  terraform:   ["Learn HCL syntax and providers", "Provision cloud resources with a plan", "Use modules for reusable infra", "Set up remote state"],
  linux:       ["Learn file system navigation", "Write basic shell scripts", "Configure systemd services", "Harden a server with basic security"],
  git:         ["Master branching strategies", "Learn interactive rebase", "Set up pre-commit hooks", "Contribute to an open source project"],
  default:     ["Learn core concepts", "Build a focused practice project", "Integrate into an existing codebase", "Add to CV and portfolio"],
};

const STAGE_TIMELINE = ["Week 1–2", "Week 3–5", "Week 6–8", "Week 9–10"];

const ALIASES = {
  "react.js":   "react",
  "reactjs":    "react",
  "vue.js":     "vue",
  "node.js":    "node",
  "nodejs":     "node",
  "express.js": "node",
  "postgres":   "postgresql",
  "pg":         "postgresql",
  "k8s":        "kubernetes",
  "ci/cd":      "ci",
  "cicd":       "ci",
  "ts":         "typescript",
};

function getSteps(skillName) {
  const lower = skillName.toLowerCase().trim();

  // 1. Exact match
  if (STAGE_STEPS[lower]) return STAGE_STEPS[lower];

  // 2. Alias match on full name
  const resolved = ALIASES[lower];
  if (resolved && STAGE_STEPS[resolved]) return STAGE_STEPS[resolved];

  // 3. Word-split match (handles "Node.js GraphQL" → word "node" hits)
  const words = lower.split(/[\s./\-+]+/).filter(Boolean);
  for (const word of words) {
    if (STAGE_STEPS[word]) return STAGE_STEPS[word];
    const wordAlias = ALIASES[word];
    if (wordAlias && STAGE_STEPS[wordAlias]) return STAGE_STEPS[wordAlias];
  }

  // 4. Partial match fallback
  const partialKey = Object.keys(STAGE_STEPS).find((k) => lower.includes(k));
  return STAGE_STEPS[partialKey] || STAGE_STEPS.default;
}

function buildHeroText(canGenerate, jobCount, gapCount, hasCv, hasJobs) {
  if (canGenerate) {
    const gapWord = gapCount === 1 ? "gap" : "gaps";
    const jobWord = jobCount === 1 ? "job" : "jobs";
    return `${gapCount} skill ${gapWord} identified across ${jobCount} ${jobWord}. Generate your personalised growth plan.`;
  }
  if (!hasJobs) return "Load jobs and select a CV to generate your personalised growth plan.";
  if (!hasCv)  return "Select a CV to compare against your loaded jobs.";
  return "No skill gaps found — your CV covers all job requirements.";
}

export default function RoadmapPage({
  jobs,
  recommendations,
  selectedCv,
  analyzeGaps,
}) {

  const navigate   = useNavigate();
  const allJobs    = [...jobs, ...recommendations].filter((j) => j?._id);
  const uniqueJobs = [...new Map(allJobs.map((j) => [j._id, j])).values()];
  const gaps       = buildSkillGaps(uniqueJobs, selectedCv?.skills);
  const topGaps    = gaps.slice(0, 3);

  const stages = topGaps.map((g, i) => ({
    id:    `s${i}`,
    label: STAGE_TIMELINE[i] || `Phase ${i + 1}`,
    skill: g.skill,
    steps: getSteps(g.skill),
    freq:  g.count,
  }));

  const hasJobs     = uniqueJobs.length > 0;
  const hasCv       = Boolean(selectedCv);
  const canGenerate = hasJobs && hasCv && topGaps.length > 0;
  const hasStages   = stages.length > 0;

  const heroText = buildHeroText(canGenerate, uniqueJobs.length, topGaps.length, hasCv, hasJobs);

  const [showRoadmap, setShowRoadmap] = useState(false);
  const [generating, setGenerating]   = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setShowRoadmap(false);
    setGenerating(false);
    clearTimeout(timerRef.current);
  }, [selectedCv?._id]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const [completion, setCompletion] = useState([]);

  useEffect(() => {
    setCompletion((prev) =>
      stages.map((s, i) =>
        prev[i] && prev[i].length === s.steps.length
          ? prev[i]
          : new Array(s.steps.length).fill(false)
      )
    );
  }, [stages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeIndex = useMemo(() => {
    for (let i = 0; i < stages.length; i++) {
      if (!completion[i]?.every(Boolean)) return i;
    }
    return Math.max(stages.length - 1, 0);
  }, [completion, stages.length]);

  function handleGenerate() {
    if (!canGenerate || generating) return;
    setCompletion(stages.map((s) => new Array(s.steps.length).fill(false)));
    setGenerating(true);
    timerRef.current = setTimeout(() => {
      setGenerating(false);
      setShowRoadmap(true);
      if (typeof analyzeGaps === "function") analyzeGaps();
    }, 900);
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
          {stages.length || "—"}
        </span>
        <div className="relative min-w-0">
          <p className={ui.eyebrow}>Growth · Growth Plan</p>
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
                onClick={() => setShowRoadmap(false)}
              >
                Reset plan
              </button>
            ) : (
              <button
                className={ui.buttonCobalt}
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate || generating}
                title={canGenerate ? "" : "Load jobs and select a CV first"}
              >
                <FiZap size={14} strokeWidth={1.5} />
                {generating ? "Generating…" : "Generate growth plan"}
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
      {!showRoadmap && !generating && (
        <section className={ui.panel}>
          {canGenerate ? (
            <div className="flex flex-col items-center py-3 text-center">
              <p className="text-[13px] font-medium text-[#0E0E10]">Ready to generate</p>
              <p className="mt-1 max-w-sm text-[13px] text-[#6B6B72]">
                Each skill gap becomes a milestone with actionable learning steps.
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {topGaps.map((g) => (
                  <span key={g.skill} className={ui.chipMissing}>{g.skill}</span>
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
    </div>
  );
}
