const SKILLS = ["Java", "SQL", "React", "Node", "Docker", "Python"];

function extractSkills(description = "") {
  return SKILLS.filter((skill) =>
    description.toLowerCase().includes(skill.toLowerCase())
  );
}

module.exports = extractSkills;
