export const pages = [
  { id: "overview",     label: "Dashboard",   section: "workspace", path: "/dashboard" },
  { id: "jobs",         label: "Jobs",         section: "workspace", path: "/jobs" },
  { id: "cv",           label: "My CVs",       section: "workspace", path: "/cvs" },
  { id: "skillgap",     label: "Skill Map",          section: "growth",    path: "/skill-gaps" },
  { id: "roadmap",      label: "Growth Plan",        section: "growth",    path: "/roadmap" },
  { id: "applications", label: "Application Tracker",section: "apply",     path: "/applications" },
  { id: "analytics",    label: "Market Signals",     section: "apply",     path: "/trends" },
  { id: "insights",     label: "AI Insights",  section: "apply",     path: "/insights" },
  { id: "account",      label: "Profile",      section: "apply",     path: "/profile" },
];

export const defaultMatch = {
  cvSkills: "Java, SQL",
  jobSkills: "Java, Docker, SQL",
};

export const emptyUser = {
  firstName: "",
  lastName: "",
  email: "",
  countryCode: "+90",
  phoneNumber: "",
  photo: "",
  password: "",
  confirmPassword: "",
};

export const countryCodes = [
  { code: "+90", label: "TR +90" },
  { code: "+1", label: "US +1" },
  { code: "+44", label: "UK +44" },
  { code: "+49", label: "DE +49" },
  { code: "+33", label: "FR +33" },
  { code: "+31", label: "NL +31" },
  { code: "+39", label: "IT +39" },
  { code: "+34", label: "ES +34" },
];

export const emptyPassport = {
  targetTitle: "",
  school: "",
  department: "",
  graduationYear: "",
  gpa: "",
  location: "",
  interests: "",
  skills: "",
  languages: "",
  tools: "",
  experience: "",
  projects: "",
  certificates: "",
  achievements: "",
  summary: "",
  workStyle: "",
  salaryExpectation: "",
  availability: "",
  portfolio: "",
  linkedin: "",
  github: "",
};
