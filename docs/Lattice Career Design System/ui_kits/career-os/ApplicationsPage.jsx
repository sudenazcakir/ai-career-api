/* global React, Card, Btn, StatusPill, SkillChip, Empty */

const initialApps = [
  { id: "a1", title: "Backend Engineer", company: "Hexa Labs", cv: "Backend CV v2", status: "Under Review" },
  { id: "a2", title: "Platform Engineer", company: "Trendyol",  cv: "Backend CV v2", status: "Under Review" },
  { id: "a3", title: "Junior Backend Dev", company: "Getir",    cv: "Backend CV v1", status: "Saved for Later" },
  { id: "a4", title: "Data Engineer", company: "Yemeksepeti",   cv: "Backend CV v2", status: "Rejected" },
  { id: "a5", title: "Cloud Engineer", company: "Migros Cloud", cv: "Backend CV v2", status: "Accepted" },
];

const STATUSES = ["Saved for Later", "Under Review", "Accepted", "Rejected"];

const ApplicationsPage = () => {
  const [apps, setApps] = React.useState(initialApps);
  const move = (id, status) => setApps(a => a.map(x => x.id === id ? { ...x, status } : x));

  return (
    <div className="lat-page">
      <Card eyebrow="Application tracker"
            title="Move opportunities through your pipeline."
            action={<Btn kind="cobalt" icon="plus">Add or save job</Btn>}>
        <p className="lat-body-sm">
          Save roles for later, track submitted applications, and update outcomes.
        </p>
      </Card>

      <div className="lat-kanban">
        {STATUSES.map(s => {
          const items = apps.filter(a => a.status === s);
          return (
            <div key={s} className="lat-col">
              <div className="lat-col-head">
                <StatusPill value={s}/>
                <span className="lat-mono" style={{color:"var(--c-slate)"}}>{items.length}</span>
              </div>
              <div className="lat-col-body">
                {items.length === 0 && (
                  <p className="lat-col-empty">No applications in this stage.</p>
                )}
                {items.map(a => (
                  <article key={a.id} className="lat-app">
                    <h4 className="lat-h3">{a.title}</h4>
                    <p className="lat-body-sm" style={{ marginTop: 2 }}>
                      {a.company} · {a.cv}
                    </p>
                    <select className="lat-input lat-input-sm" value={a.status}
                            onChange={e => move(a.id, e.target.value)}>
                      {STATUSES.map(o => <option key={o} value={o}>Move to · {o}</option>)}
                    </select>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

window.ApplicationsPage = ApplicationsPage;
