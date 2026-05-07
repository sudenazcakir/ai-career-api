const SKILL_PATTERNS = [
  ["React", [/\breact(?:\.js|js)?\b/i]],
  ["Vue.js", [/\bvue(?:\.js|js)?\b/i]],
  ["Angular", [/\bangular\b/i]],
  ["Next.js", [/\bnext(?:\.js|js)?\b/i]],
  ["TypeScript", [/\btypescript\b/i, /(?:^|[^.\w])ts(?:$|[^\w])/i]],
  ["JavaScript", [/\bjavascript\b/i, /(?:^|[^.\w])js(?:$|[^\w])/i]],
  ["HTML", [/\bhtml5?\b/i]],
  ["CSS", [/\bcss3?\b/i, /\bscss\b/i, /\bsass\b/i]],
  ["Tailwind CSS", [/\btailwind(?:\s+css)?\b/i]],

  ["Node.js", [/\bnode(?:\.js|js)?\b/i]],
  ["Express", [/\bexpress(?:\.js|js)?\b/i]],
  ["NestJS", [/\bnest(?:\.js|js)?\b/i]],
  ["Java", [/\bjava\b/i]],
  ["Spring Boot", [/\bspring\s+boot\b/i]],
  ["Python", [/\bpython\b/i]],
  ["FastAPI", [/\bfastapi\b/i, /\bfast\s+api\b/i]],
  ["Django", [/\bdjango\b/i]],
  ["Ruby on Rails", [/\bruby\s+on\s+rails\b/i, /\brails\b/i]],
  ["PHP", [/\bphp\b/i]],
  ["Laravel", [/\blaravel\b/i]],
  ["C#", [/\bc#\b/i, /\bcsharp\b/i]],
  [".NET", [/\b\.net\b/i, /\bdotnet\b/i, /\bnet\s+core\b/i]],
  ["Go", [/\bgolang\b/i, /\bgo\s+(?:developer|engineer|backend|microservices|services|api)\b/i]],

  ["SQL", [/\bsql\b/i]],
  ["PostgreSQL", [/\bpostgres(?:ql)?\b/i]],
  ["MySQL", [/\bmysql\b/i]],
  ["MongoDB", [/\bmongodb\b/i, /\bmongo\s+db\b/i]],
  ["Redis", [/\bredis\b/i]],
  ["Pandas", [/\bpandas\b/i]],
  ["NumPy", [/\bnumpy\b/i]],
  ["Machine Learning", [/\bmachine\s+learning\b/i, /\bml\b/i]],

  ["Docker", [/\bdocker\b/i, /\bcontaineri[sz]ation\b/i]],
  ["Kubernetes", [/\bkubernetes\b/i, /\bk8s\b/i]],
  ["AWS", [/\baws\b/i, /\bamazon\s+web\s+services\b/i]],
  ["Azure", [/\bazure\b/i]],
  ["GCP", [/\bgcp\b/i, /\bgoogle\s+cloud\b/i]],
  ["Terraform", [/\bterraform\b/i]],
  ["CI/CD", [/\bci\/cd\b/i, /\bcontinuous\s+integration\b/i, /\bcontinuous\s+delivery\b/i]],
  ["GitHub Actions", [/\bgithub\s+actions\b/i]],
  ["Linux", [/\blinux\b/i]],
  ["Nginx", [/\bnginx\b/i]],

  ["REST APIs", [/\brest(?:ful)?\s+apis?\b/i, /\bapis?\b/i]],
  ["GraphQL", [/\bgraphql\b/i]],
  ["Microservices", [/\bmicroservices?\b/i]],
  ["Git", [/\bgit\b/i]],
  ["Playwright", [/\bplaywright\b/i]],
  ["Jest", [/\bjest\b/i]],
];

function extractSkills(description = "") {
  const text = String(description || "");
  const skills = [];
  const seen = new Set();

  SKILL_PATTERNS.forEach(([canonical, patterns]) => {
    if (seen.has(canonical)) return;
    if (patterns.some((pattern) => pattern.test(text))) {
      seen.add(canonical);
      skills.push(canonical);
    }
  });

  return skills;
}

module.exports = extractSkills;
