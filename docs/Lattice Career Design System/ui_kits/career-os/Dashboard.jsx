/* global React, Card, Btn, Metric, Bar, ScorePill, StatusPill, SkillChip, Empty, Icon */
const { useState } = React;

// ─── Dashboard ───────────────────────────────────────────────────────────
const Dashboard = ({ goto }) => (
  <div className="lat-page">
    <section className="lat-hero lat-dot-grid-on-bone">
      <span className="lat-eyebrow">AI-assisted matching</span>
      <h2 className="lat-display-md" style={{ maxWidth: 620, marginTop: 8 }}>
        Turn CV skills into <em className="lat-italic-serif">ranked</em> career options.
      </h2>
      <p className="lat-body" style={{ maxWidth: 540, marginTop: 12, color: "var(--c-graphite)" }}>
        Import roles, select a CV, rank matches, and generate a learning path from missing skills.
      </p>
      <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
        <Btn kind="cobalt" icon="download" onClick={() => goto("jobs")}>Import jobs</Btn>
        <Btn kind="secondary" icon="zap" onClick={() => goto("insights")}>Rank now</Btn>
      </div>
      <span className="lat-hero-numeral">86</span>
    </section>

    <section className="lat-metrics">
      <Metric label="CV profiles"     value="4"   hint="3 backend · 1 frontend"/>
      <Metric label="Filtered jobs"   value="31"  hint="Adzuna · last 7 days"/>
      <Metric label="Recommendations" value="12"  hint="match ≥ 60%"/>
      <Metric label="Top score"       value="86%" hint="Backend Eng · Hexa"/>
    </section>

    <div className="lat-row-2">
      <Card eyebrow="Top recommendation" title="Backend Engineer · Hexa Labs"
            action={<Btn kind="ghost" icon="arrow-right" onClick={() => goto("jobs")}>Explore</Btn>}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <p className="lat-body-sm" style={{ marginBottom: 10 }}>İstanbul · Mid level · Posted 2 days ago</p>
            <div className="lat-chips">
              <SkillChip kind="matched">java</SkillChip>
              <SkillChip kind="matched">sql</SkillChip>
              <SkillChip kind="matched">docker</SkillChip>
              <SkillChip kind="missing">kubernetes</SkillChip>
              <SkillChip kind="missing">terraform</SkillChip>
            </div>
            <div style={{ display: "grid", gap: 4, marginTop: 14 }}>
              <Bar label="Skill" value={84} color="ink"/>
              <Bar label="Role"  value={72} color="cobalt"/>
              <Bar label="Exp"   value={65} color="slate"/>
            </div>
          </div>
          <ScorePill value={86}/>
        </div>
      </Card>

      <Card eyebrow="Selected CV" title="Backend CV · v2"
            action={<Btn kind="ghost" icon="arrow-right" onClick={() => goto("cvs")}>Manage</Btn>}>
        <p className="lat-body-sm" style={{ marginBottom: 12 }}>
          Mid-level backend profile · 4 projects · last edited 5 days ago.
        </p>
        <div className="lat-chips">
          {["java","spring","postgres","docker","redis","git","aws"].map(s =>
            <SkillChip key={s} kind="neutral">{s}</SkillChip>)}
        </div>
      </Card>
    </div>
  </div>
);

window.Dashboard = Dashboard;
