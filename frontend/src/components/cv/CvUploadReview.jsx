import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiUpload, FiX } from "react-icons/fi";
import { ui } from "../../styles/ui";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function uploadCvFile(file) {
  const form = new FormData();
  form.append("file", file);
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${API_BASE}/cvs/upload`, {
    method: "POST",
    body: form,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Upload failed");
  return json.data;
}

export function CvUploadReview({ onSave, isBusy }) {
  const inputRef = useRef(null);
  const [state, setState] = useState("idle");
  const [error, setError] = useState(null);
  const [form, setForm] = useState(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setState("uploading");
    setError(null);
    try {
      const data = await uploadCvFile(file);
      setForm({
        title: data.title || "",
        summary: data.summary || "",
        skills: (data.skills || []).join(", "),
        experience: (data.experience || []).join("\n"),
        projects: (data.projects || []).join("\n"),
        education: (data.education || []).join("\n"),
        certifications: (data.certifications || []).join("\n"),
      });
      setState("reviewing");
    } catch (err) {
      setError(err.message);
      setState("idle");
    }
  }

  function handleSave() {
    setState("saving");
    const payload = {
      title: form.title.trim() || "Imported CV",
      type: "Imported",
      version: "v1",
      summary: form.summary.trim(),
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      experience: form.experience.split("\n").map((s) => s.trim()).filter(Boolean),
      projects: form.projects.split("\n").map((s) => s.trim()).filter(Boolean),
      education: form.education.split("\n").map((s) => s.trim()).filter(Boolean),
      certifications: form.certifications.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    onSave(payload);
    setState("idle");
    setForm(null);
  }

  function handleClose() {
    setState("idle");
    setForm(null);
    setError(null);
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        className="sr-only"
        aria-label="Upload CV file"
        onChange={handleFileChange}
      />
      <button
        type="button"
        className={ui.buttonSecondary}
        disabled={isBusy || state === "uploading"}
        onClick={() => inputRef.current?.click()}
        aria-busy={state === "uploading"}
      >
        <FiUpload size={14} strokeWidth={1.5} />
        {state === "uploading" ? "Parsing..." : "Upload CV"}
      </button>

      {error && (
        <p className={`${ui.fieldError} mt-1`} role="alert">{error}</p>
      )}

      {state === "reviewing" && form && typeof document !== "undefined" && createPortal(
        <div
          className={ui.modalBackdrop}
          role="presentation"
          onMouseDown={handleClose}
        >
          <section
            aria-label="Review extracted CV"
            aria-modal="true"
            className={`${ui.modalWindow} max-w-[640px]`}
            role="dialog"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={ui.modalHead}>
              <div>
                <p className={ui.eyebrow}>CV Upload · Review</p>
                <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
                  Review extracted fields
                </h2>
                <p className={`${ui.muted} mt-1`}>
                  Confirm or edit the extracted content before saving.
                </p>
              </div>
              <button
                type="button"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-[#6B6B72] transition-colors hover:bg-[#F6F3EC] hover:text-[#0E0E10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF]"
                onClick={handleClose}
                aria-label="Close review"
              >
                <FiX size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div className={`${ui.formStack} overflow-y-auto max-h-[60vh] pr-1`}>
              <label className={ui.label}>
                CV title
                <input className={ui.input} value={form.title} onChange={(e) => updateField("title", e.target.value)} />
              </label>
              <label className={`${ui.label} flex flex-col`}>
                Summary
                <textarea className={`${ui.input} !h-auto min-h-[72px] resize-none py-2 leading-relaxed`} rows={3} value={form.summary} onChange={(e) => updateField("summary", e.target.value)} />
              </label>
              <label className={ui.label}>
                Skills (comma-separated)
                <input className={ui.input} value={form.skills} onChange={(e) => updateField("skills", e.target.value)} />
              </label>
              {[
                ["experience", "Experience (one per line)"],
                ["projects", "Projects (one per line)"],
                ["education", "Education (one per line)"],
                ["certifications", "Certifications (one per line)"],
              ].map(([field, label]) => (
                <label key={field} className={`${ui.label} flex flex-col`}>
                  {label}
                  <textarea className={`${ui.input} !h-auto min-h-[60px] resize-none py-2 leading-relaxed`} rows={3} value={form[field]} onChange={(e) => updateField(field, e.target.value)} />
                </label>
              ))}
            </div>

            <div className="mt-4 flex gap-2 border-t border-[#E8E3D7] pt-4">
              <button type="button" className={ui.button} onClick={handleSave} disabled={state === "saving" || !form.title.trim()}>
                {state === "saving" ? "Saving..." : "Save as new CV"}
              </button>
              <button type="button" className={ui.buttonGhost} onClick={handleClose}>Cancel</button>
            </div>
          </section>
        </div>,
        document.body
      )}
    </>
  );
}
