import { JobList } from "../components/common/DataViews";
import { ui } from "../styles/ui";

export default function JobsPage({
  fetchJobs,
  filterForm,
  filterJobs,
  isBusy,
  jobs,
  loadRecommendations,
  selectedCv,
  setFilterForm,
}) {
  return (
    <div className={ui.pageGrid}>
      <section className={`${ui.panel} ${ui.full}`}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Database search</p>
            <h2 className="text-2xl font-black">
              Filter jobs against {selectedCv?.title || "a selected CV"}
            </h2>
          </div>
          <div className={ui.buttonRow}>
            <button type="button" className={ui.buttonSecondary} disabled={isBusy} onClick={fetchJobs}>
              Import Jobs
            </button>
            <button type="button" className={ui.button} disabled={isBusy} onClick={loadRecommendations}>
              Recommend
            </button>
          </div>
        </div>

        <form className={ui.gridForm} onSubmit={filterJobs}>
          <label className={ui.label}>
            Keyword
            <input
              className={ui.input}
              value={filterForm.keyword}
              onChange={(event) =>
                setFilterForm({ ...filterForm, keyword: event.target.value })
              }
            />
          </label>
          <label className={ui.label}>
            Skill
            <input
              className={ui.input}
              value={filterForm.skill}
              onChange={(event) =>
                setFilterForm({ ...filterForm, skill: event.target.value })
              }
            />
          </label>
          <label className={ui.label}>
            Min match
            <input
              className={ui.input}
              type="number"
              value={filterForm.minMatch}
              onChange={(event) =>
                setFilterForm({ ...filterForm, minMatch: event.target.value })
              }
            />
          </label>
          <label className={ui.label}>
            Sort
            <select
              className={ui.input}
              value={filterForm.sort}
              onChange={(event) =>
                setFilterForm({ ...filterForm, sort: event.target.value })
              }
            >
              <option value="score">Score</option>
              <option value="newest">Newest</option>
            </select>
          </label>
          <button className={ui.button} disabled={isBusy} type="submit">
            {isBusy ? "Searching..." : "Search"}
          </button>
        </form>
      </section>

      <section className={`${ui.panel} ${ui.full}`}>
        <div className={ui.sectionHead}>
          <h2 className="text-2xl font-black">Job Results</h2>
          <span className={ui.count}>{jobs.length}</span>
        </div>
        <JobList items={jobs} />
      </section>
    </div>
  );
}
