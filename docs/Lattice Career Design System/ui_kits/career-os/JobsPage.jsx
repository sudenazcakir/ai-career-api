/* global React, Card, Btn, ScorePill, SkillChip, Bar, Empty */

const sampleJobs = [
  { id: "j1", title: "Backend Engineer", company: "Hexa Labs", loc: "İstanbul", score: 86, matched: ["java","sql","docker"], missing: ["kubernetes","terraform"], bars: [["Skill",84],["Role",72],["Exp",65]] },
  { id: "j2", title: "Platform Engineer", company: "Trendyol", loc: "Remote · TR", score: 78, matched: ["java","postgres"], missing: ["kafka","grpc"], bars: [["Skill",78],["Role",80],["Exp",62]] },
  { id: "j3", title: "Junior Backend Dev", company: "Getir", loc: "İstanbul", score: 71, matched: ["java","sql"], missing: ["docker"], bars: [["Skill",65],["Role",80],["Exp",70]] },
  { id: "j4", title: "Cloud Engineer (Jr)", company: "Migros Cloud", loc: "Ankara", score: 54, matched: ["sql"], missing: ["aws","terraform","kubernetes"], bars: [["Skill",46],["Role",60],["Exp",55]] },
  { id: "j5", title: "Data Engineer", company: "Yemeksepeti", loc: "İstanbul", score: 38, matched: ["sql"], missing: ["spark","airflow","python"], bars: [["Skill",30],["Role",50],["Exp",40]] },
];

const JobsPage = () => {
  const [filter, setFilter] = React.useState({ keyword: "developer", skill: "java", min: "", sort: "score" });

  return (
    <div className="lat-page">
      <Card eyebrow="Database search"
            title="Filter jobs against Backend CV · v2"
            action={
              <div style={{ display: "flex", gap: 8 }}>
                <Btn kind="secondary" icon="download">Import jobs</Btn>
                <Btn kind="cobalt" icon="zap">Recommend</Btn>
              </div>
            }>
        <form className="lat-filter-grid" onSubmit={e => e.preventDefault()}>
          <label className="lat-field">
            <span className="lat-label">Keyword</span>
            <input className="lat-input" value={filter.keyword}
                   onChange={e => setFilter({ ...filter, keyword: e.target.value })}/>
          </label>
          <label className="lat-field">
            <span className="lat-label">Skill</span>
            <input className="lat-input" value={filter.skill}
                   onChange={e => setFilter({ ...filter, skill: e.target.value })}/>
          </label>
          <label className="lat-field">
            <span className="lat-label">Min match</span>
            <input className="lat-input" type="number" placeholder="—"
                   value={filter.min} onChange={e => setFilter({ ...filter, min: e.target.value })}/>
          </label>
          <label className="lat-field">
            <span className="lat-label">Sort</span>
            <select className="lat-input" value={filter.sort}
                    onChange={e => setFilter({ ...filter, sort: e.target.value })}>
              <option value="score">Match score</option>
              <option value="newest">Newest</option>
            </select>
          </label>
          <Btn kind="primary">Search</Btn>
        </form>
      </Card>

      <Card title="Job results"
            action={<span className="lat-mono" style={{color:"var(--c-slate)"}}>{sampleJobs.length} results</span>}>
        <div className="lat-job-list">
          {sampleJobs.map(j => (
            <article key={j.id} className="lat-job">
              <div style={{ minWidth: 0 }}>
                <h3 className="lat-h3">{j.title} <span className="lat-job-co">· {j.company}</span></h3>
                <p className="lat-body-sm" style={{ marginTop: 2 }}>{j.loc}</p>
                <div className="lat-chips" style={{ marginTop: 10 }}>
                  {j.matched.map(s => <SkillChip key={s} kind="matched">{s}</SkillChip>)}
                  {j.missing.map(s => <SkillChip key={s} kind="missing">{s}</SkillChip>)}
                </div>
                <div style={{ display: "grid", gap: 4, marginTop: 12 }}>
                  {j.bars.map(([l, v], i) => <Bar key={l} label={l} value={v} color={["ink","cobalt","slate"][i]}/>)}
                </div>
              </div>
              <div style={{ display: "grid", gap: 8, justifyItems: "end", alignContent: "start" }}>
                <ScorePill value={j.score}/>
                <Btn kind="ghost" icon="bookmark">Save</Btn>
              </div>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
};

window.JobsPage = JobsPage;
