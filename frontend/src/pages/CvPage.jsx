import { ProfileSummary } from "../components/common/DataViews";
import { ui } from "../styles/ui";

export default function CvPage({
  createCv,
  cvForm,
  cvs,
  isBusy,
  selectedCvId,
  setCvForm,
  setSelectedCvId,
}) {
  return (
    <div className={ui.splitPage}>
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Profile builder</p>
            <h2 className="text-2xl font-black">Create a CV skill profile</h2>
          </div>
        </div>
        <form className={ui.formStack} onSubmit={createCv}>
          <label className={ui.label}>
            CV title
            <input
              className={ui.input}
              value={cvForm.title}
              onChange={(event) =>
                setCvForm({ ...cvForm, title: event.target.value })
              }
            />
          </label>
          <label className={ui.label}>
            Skills
            <input
              className={ui.input}
              value={cvForm.skills}
              onChange={(event) =>
                setCvForm({ ...cvForm, skills: event.target.value })
              }
            />
          </label>
          <button className={ui.button} disabled={isBusy} type="submit">
            {isBusy ? "Saving..." : "Save CV"}
          </button>
        </form>
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <h2 className="text-2xl font-black">CV Library</h2>
          <span className={ui.count}>{cvs.length}</span>
        </div>
        <div className={ui.profileList}>
          {cvs.map((cv) => (
            <button
              className={`${ui.profileButton} ${selectedCvId === cv._id ? ui.profileButtonActive : ""}`}
              key={cv._id}
              onClick={() => setSelectedCvId(cv._id)}
              type="button"
            >
              <ProfileSummary cv={cv} />
            </button>
          ))}
          {cvs.length === 0 && <p className={ui.muted}>No CV profiles yet.</p>}
        </div>
      </section>
    </div>
  );
}
