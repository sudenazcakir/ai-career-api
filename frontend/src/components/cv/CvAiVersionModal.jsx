import { useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiZap } from "react-icons/fi";
import { ui } from "../../styles/ui";
import { generateAiVersion } from "../../services/careerService";
import { CvDiffPanel } from "./CvDiffPanel";

const MODES = [
  {
    id: "ats_optimize",
    label: "ATS Optimise",
    description: "Move matching skills to front, add job title keyword to summary.",
  },
  {
    id: "role_tailor",
    label: "Role Tailor",
    description: "Prioritise content most relevant to the target job.",
  },
  {
    id: "concise",
    label: "Concise",
    description: "Shorten bullets to 100 chars, cap experience and projects at 4 items.",
  },
  {
    id: "seniority_boost",
    label: "Seniority Boost",
    description: "Add strong action verbs (Led, Delivered, Scaled) to experience bullets.",
  },
];

export function CvAiVersionModal({ sourceCv, jobs = [], onSave, onClose }) {
  const [mode, setMode] = useState("ats_optimize");
  const [targetJobId, setTargetJobId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [state, setState] = useState("configure");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleGenerate() {
    setState("generating");
    setError(null);
    try {
      const data = await generateAiVersion(sourceCv._id, {
        mode,
        targetJobId: targetJobId || undefined,
        instructions: instructions.trim() || undefined,
      });
      setResult(data.data);
      setState("review");
    } catch (err) {
      setError(err.message || "Generation failed");
      setState("configure");
    }
  }

  function handleSave() {
    if (!result?.proposedCv) return;
    const { proposedCv } = result;
    onSave(sourceCv._id, {
      title: proposedCv.title,
      summary: proposedCv.summary,
      skills: proposedCv.skills,
      projects: proposedCv.projects,
      experience: proposedCv.experience,
      education: proposedCv.education,
      certifications: proposedCv.certifications,
    });
    onClose();
  }

  function handleBack() {
    setState("configure");
    setResult(null);
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={ui.modalBackdrop}
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        aria-label="Create AI-assisted CV version"
        aria-modal="true"
        className={`${ui.modalWindow} max-w-[600px]`}
        role="dialog"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        <div className={ui.modalHead}>
          <div>
            <p className={ui.eyebrow}>CV Versioning · AI</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              {state === "review" ? "Review AI version" : "Create AI version"}
            </h2>
            <p className={`${ui.muted} mt-1`}>
              {state === "review"
                ? "AI rewrote your CV based on the selected mode. Review changes before saving."
                : `Source: ${sourceCv.title} (${sourceCv.version || "v1"})`}
            </p>
          </div>
          <button
            type="button"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-[#6B6B72] transition-colors hover:bg-[#F6F3EC] hover:text-[#0E0E10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF]"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX size={16} strokeWidth={1.5} />
          </button>
        </div>

        {state !== "review" && (
          <div className={`${ui.formStack} overflow-y-auto max-h-[55vh] pr-1`}>
            <fieldset>
              <legend className={ui.label} style={{ display: "block" }}>
                Optimisation mode
              </legend>
              <div className="mt-2 grid gap-2">
                {MODES.map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-[10px] border p-3 transition-colors ${
                      mode === m.id
                        ? "border-[#0E0E10] bg-[#F6F3EC]"
                        : "border-[#E8E3D7] bg-[#FBFAF6] hover:border-[#A4A4AC]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="ai-mode"
                      value={m.id}
                      checked={mode === m.id}
                      onChange={() => setMode(m.id)}
                      className="mt-0.5 shrink-0 accent-[#0E0E10]"
                    />
                    <div>
                      <p className="text-[13px] font-semibold text-[#0E0E10]">{m.label}</p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-[#6B6B72]">{m.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className={ui.label}>
              Target job (optional)
              <select
                className={ui.input}
                value={targetJobId}
                onChange={(e) => setTargetJobId(e.target.value)}
              >
                <option value="">No specific job</option>
                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title} — {job.company}
                  </option>
                ))}
              </select>
            </label>

            <label className={`${ui.label} flex flex-col`}>
              Additional instructions (optional)
              <textarea
                className={`${ui.input} !h-auto min-h-[60px] resize-none py-2 leading-relaxed`}
                rows={3}
                maxLength={500}
                placeholder="e.g. Focus on team leadership experience. Remove certifications."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </label>

            {error && (
              <p className={ui.fieldError} role="alert">{error}</p>
            )}
          </div>
        )}

        {state === "review" && result && (
          <div className="overflow-y-auto max-h-[55vh] pr-1">
            <div className="mb-3 rounded-[10px] border border-[#E8E3D7] bg-[#F6F3EC] p-4">
              <p className={ui.eyebrow}>Proposed title</p>
              <p className="text-[15px] font-semibold text-[#0E0E10]">{result.proposedCv.title}</p>
            </div>
            <CvDiffPanel
              changes={result.changes}
              warnings={result.warnings}
              modelInfo={result.modelInfo}
            />
          </div>
        )}

        <div className="mt-4 flex gap-2 border-t border-[#E8E3D7] pt-4">
          {state === "configure" && (
            <>
              <button
                type="button"
                className={ui.button}
                disabled={state === "generating"}
                onClick={handleGenerate}
              >
                <FiZap size={14} strokeWidth={1.5} />
                Generate
              </button>
              <button type="button" className={ui.buttonGhost} onClick={onClose}>
                Cancel
              </button>
            </>
          )}
          {state === "generating" && (
            <button type="button" className={ui.button} disabled>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-[#F6F3EC] border-t-transparent"
                aria-label="Generating"
              />
              Generating…
            </button>
          )}
          {state === "review" && (
            <>
              <button type="button" className={ui.button} onClick={handleSave}>
                Save as new version
              </button>
              <button type="button" className={ui.buttonSecondary} onClick={handleBack}>
                Back
              </button>
              <button type="button" className={ui.buttonGhost} onClick={onClose}>
                Discard
              </button>
            </>
          )}
        </div>
      </section>
    </div>,
    document.body
  );
}
