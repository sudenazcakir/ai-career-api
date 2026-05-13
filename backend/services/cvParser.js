const SECTION_PATTERNS = {
  summary:        /^(summary|profile|objective|about me?)\s*:?\s*$/i,
  skills:         /^(skills?|technical skills?|core competencies|technologies)\s*:?\s*$/i,
  experience:     /^(experience|work experience|employment|professional experience)\s*:?\s*$/i,
  projects:       /^(projects?|personal projects?|side projects?|portfolio)\s*:?\s*$/i,
  education:      /^(education|academic background|qualifications?)\s*:?\s*$/i,
  certifications: /^(certifications?|certificates?|licenses?|credentials?)\s*:?\s*$/i,
};

function detectSection(line) {
  for (const [key, pattern] of Object.entries(SECTION_PATTERNS)) {
    if (pattern.test(line.trim())) return key;
  }
  return null;
}

function cleanLine(line) {
  return line.replace(/^[\s\-•·*▪▸►]+/, "").trim();
}

function extractTitle(lines) {
  for (const line of lines.slice(0, 5)) {
    const clean = line.trim();
    if (clean.length >= 3 && clean.length <= 120 && !/^(http|www\.|email|phone|\d{3})/i.test(clean)) {
      return clean;
    }
  }
  return "Imported CV";
}

function splitSkillLine(line) {
  return line
    .split(/[,|•·\t]+/)
    .map((s) => s.replace(/^[\s\-▪▸►*]+/, "").trim())
    .filter((s) => s.length > 0 && s.length < 60);
}

function parseCvText(text) {
  const rawLines = text.split(/\r?\n/);
  const lines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0);

  const result = {
    title: extractTitle(lines),
    summary: "",
    skills: [],
    projects: [],
    experience: [],
    education: [],
    certifications: [],
  };

  let currentSection = null;
  const sectionBuffers = {
    summary: [],
    skills: [],
    projects: [],
    experience: [],
    education: [],
    certifications: [],
  };

  for (const line of lines) {
    const detected = detectSection(line);
    if (detected) {
      currentSection = detected;
      continue;
    }

    if (currentSection && sectionBuffers[currentSection] !== undefined) {
      const clean = cleanLine(line);
      if (clean.length > 1) {
        sectionBuffers[currentSection].push(clean);
      }
    }
  }

  result.summary = sectionBuffers.summary.join(" ").trim();

  for (const line of sectionBuffers.skills) {
    const parts = splitSkillLine(line);
    if (parts.length > 1) {
      result.skills.push(...parts);
    } else if (parts[0]) {
      result.skills.push(parts[0]);
    }
  }
  result.skills = [...new Set(result.skills.filter((s) => s.length > 0 && s.length < 60))];

  result.projects = sectionBuffers.projects.filter((l) => l.length > 2).slice(0, 20);
  result.experience = sectionBuffers.experience.filter((l) => l.length > 2).slice(0, 20);
  result.education = sectionBuffers.education.filter((l) => l.length > 2).slice(0, 10);
  result.certifications = sectionBuffers.certifications.filter((l) => l.length > 2).slice(0, 10);

  return result;
}

module.exports = { parseCvText };
