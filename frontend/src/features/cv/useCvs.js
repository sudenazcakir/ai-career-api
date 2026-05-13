import { useEffect, useMemo, useState } from "react";
import {
  compareCvProfiles,
  createCvProfile,
  createCvVersion,
  deleteCv,
  generateCv,
  listCvs,
  updateCv,
} from "../../services/careerService";
import { normalizePassportForAI, splitLines, splitSkills } from "../../utils/validation";

const DEFAULT_CV_FORM = {
  title: "Backend CV",
  type: "Backend",
  version: "v1",
  summary: "",
  skills: "Java, SQL",
  projects: "",
  experience: "",
  education: "",
  certifications: "",
};

export function useCvs({ user, passport, runAction, setStatus }) {
  const [cvs, setCvs] = useState([]);
  const [selectedCvId, setSelectedCvId] = useState("");
  const [compareCvId, setCompareCvId] = useState("");
  const [editingCvId, setEditingCvId] = useState(null);
  const [cvComparison, setCvComparison] = useState(null);
  const [cvForm, setCvForm] = useState(DEFAULT_CV_FORM);

  const selectedCv = useMemo(
    () => cvs.find((cv) => cv._id === selectedCvId),
    [cvs, selectedCvId]
  );

  async function loadCvs() {
    const data = await listCvs();
    const nextCvs = data.data || [];
    setCvs(nextCvs);
    if (!selectedCvId && nextCvs[0]?._id) setSelectedCvId(nextCvs[0]._id);
    if (!compareCvId && nextCvs[1]?._id) setCompareCvId(nextCvs[1]._id);
  }

  // Auto-load CVs when the user signs in
  useEffect(() => {
    if (user) {
      loadCvs().catch((e) => setStatus(e.message));
    }
  }, [user]);

  function loadCvIntoForm(cv) {
    setCvForm({
      title: cv.title || "",
      type: cv.type || "",
      version: cv.version || "",
      summary: cv.summary || "",
      skills: (cv.skills || []).join(", "),
      projects: (cv.projects || []).join("\n"),
      experience: (cv.experience || []).join("\n"),
      education: (cv.education || []).join("\n"),
      certifications: (cv.certifications || []).join("\n"),
    });
    setEditingCvId(cv._id);
    setSelectedCvId(cv._id);
  }

  function clearEditMode() {
    setEditingCvId(null);
    setCvForm(DEFAULT_CV_FORM);
  }

  function saveCv(event) {
    event.preventDefault();
    const payload = {
      title: cvForm.title,
      type: cvForm.type,
      version: cvForm.version,
      summary: cvForm.summary,
      skills: splitSkills(cvForm.skills),
      projects: splitLines(cvForm.projects),
      experience: splitLines(cvForm.experience),
      education: splitLines(cvForm.education),
      certifications: splitLines(cvForm.certifications),
    };

    if (editingCvId) {
      runAction("Updating CV", async () => {
        await updateCv(editingCvId, payload);
        await loadCvs();
        setEditingCvId(null);
        setStatus("CV updated");
      });
    } else {
      runAction("Creating CV profile", async () => {
        const data = await createCvProfile(payload);
        setSelectedCvId(data.data._id);
        await loadCvs();
        setStatus("CV profile created");
      });
    }
  }

  function createSelectedCvVersion() {
    if (!selectedCvId) {
      setStatus("Select a CV first");
      return;
    }
    runAction("Creating CV version", async () => {
      const data = await createCvVersion(selectedCvId);
      setSelectedCvId(data.data._id);
      await loadCvs();
      setStatus("CV version created");
    });
  }

  function compareSelectedCvs() {
    if (!selectedCvId || !compareCvId) {
      setStatus("Select two CVs to compare");
      return;
    }
    if (selectedCvId === compareCvId) {
      setStatus("Choose a different CV to compare");
      return;
    }
    runAction("Comparing CV versions", async () => {
      const data = await compareCvProfiles(selectedCvId, compareCvId);
      setCvComparison(data.data);
      setStatus("CV comparison ready");
    });
  }

  function handleDeleteCv(cvId) {
    runAction("Deleting CV", async () => {
      await deleteCv(cvId);
      if (editingCvId === cvId) setEditingCvId(null);
      if (compareCvId === cvId) setCompareCvId("");
      const data = await listCvs();
      const nextCvs = data.data || [];
      setCvs(nextCvs);
      if (selectedCvId === cvId) {
        const next = nextCvs.find((cv) => cv._id !== cvId);
        setSelectedCvId(next?._id || "");
      }
      setStatus("CV deleted");
    });
  }

  function generateCvFromPassport() {
    if (!passport?.skills && !passport?.targetTitle && !passport?.experience) {
      setStatus("Fill in your Career Passport first (at least Skills or Target role)");
      return;
    }
    runAction("Generating CV draft from passport", async () => {
      const normalizedPassport = normalizePassportForAI(passport);
      const data = await generateCv({
        passport: normalizedPassport,
        targetField: passport.targetTitle ? "Auto" : "Backend",
      });
      const draft = data.data;
      setCvForm({
        title: draft.title || "",
        type: draft.type || "General",
        version: draft.version || "v1",
        summary: draft.summary || "",
        skills: (draft.skills || []).join(", "),
        projects: (draft.projects || []).join("\n"),
        experience: (draft.experience || []).join("\n"),
        education: (draft.education || []).join("\n"),
        certifications: (draft.certifications || []).join("\n"),
      });
      setEditingCvId(null);
      setStatus("CV draft ready");
    });
  }

  return {
    cvs,
    setCvs,
    selectedCvId,
    setSelectedCvId,
    compareCvId,
    setCompareCvId,
    editingCvId,
    cvForm,
    setCvForm,
    cvComparison,
    selectedCv,
    loadCvs,
    saveCv,
    handleDeleteCv,
    generateCvFromPassport,
    loadCvIntoForm,
    clearEditMode,
    compareSelectedCvs,
    createSelectedCvVersion,
  };
}
