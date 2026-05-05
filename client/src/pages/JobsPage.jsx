import { JobList, Empty, ScoreBadge } from "../components/shared";

export default function JobsPage({
  filterForm,
  setFilterForm,
  selectedCv,
  jobs,
  fetchJobs,
  filterJobs,
  generateCvForJob,
  jobCvRankings,
  jobCvRankingStatus,
  loadRecommendations,
  openJobDetail,
  selectedJobDetail,
  setSelectedJobDetail,
  trackApplication,
}) {
  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-2xl border border-teal-200/25 bg-[radial-gradient(circle_at_18%_20%,rgba(20,184,166,0.22),transparent_28%),linear-gradient(135deg,#0f172a,#12343b_52%,#111827)] p-6 text-white shadow-2xl shadow-slate-900/10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-300">
              Intelligent Job Explorer
            </p>
            <h2 className="max-w-3xl text-[clamp(32px,5vw,58px)] font-black leading-none">
              Find roles, compare fit, and create tailored CVs.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Filter saved jobs against {selectedCv?.title || "a selected CV"}, open
              AI-assisted details, apply now, or save roles for later.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="!bg-white !text-slate-950 hover:!bg-teal-100"
              onClick={fetchJobs}
            >
              Import Jobs
            </button>
            <button
              type="button"
              className="!bg-teal-400 !text-slate-950 hover:!bg-teal-300"
              onClick={loadRecommendations}
            >
              Recommend
            </button>
          </div>
        </div>

        <form
          className="mt-6 grid gap-3 rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur md:grid-cols-[repeat(4,minmax(0,1fr))_max-content]"
          onSubmit={filterJobs}
        >
          <label>
            Keyword
            <input
              className="!border-white/20 !bg-white/95"
              value={filterForm.keyword}
              onChange={(e) => setFilterForm({ ...filterForm, keyword: e.target.value })}
            />
          </label>
          <label>
            Skill
            <input
              className="!border-white/20 !bg-white/95"
              value={filterForm.skill}
              onChange={(e) => setFilterForm({ ...filterForm, skill: e.target.value })}
            />
          </label>
          <label>
            Min match
            <input
              className="!border-white/20 !bg-white/95"
              type="number"
              value={filterForm.minMatch}
              onChange={(e) => setFilterForm({ ...filterForm, minMatch: e.target.value })}
            />
          </label>
          <label>
            Sort
            <select
              className="!border-white/20 !bg-white/95"
              value={filterForm.sort}
              onChange={(e) => setFilterForm({ ...filterForm, sort: e.target.value })}
            >
              <option value="score">Score</option>
              <option value="newest">Newest</option>
            </select>
          </label>
          <button
            type="submit"
            className="self-end !bg-teal-400 !text-slate-950 hover:!bg-teal-300"
          >
            Search
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-slate-950">Job Results</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-600">
            {jobs.length}
          </span>
        </div>
        <JobList items={jobs} onDetails={openJobDetail} onTrack={trackApplication} />
      </section>

      {selectedJobDetail && (
        <JobDetailPanel
          generateCvForJob={generateCvForJob}
          job={selectedJobDetail}
          rankings={jobCvRankings}
          rankingStatus={jobCvRankingStatus}
          setSelectedJobDetail={setSelectedJobDetail}
        />
      )}
    </div>
  );
}

function JobDetailPanel({ generateCvForJob, job, rankings, rankingStatus, setSelectedJobDetail }) {
  return (
    <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-700">
            AI Job Detail
          </p>
          <h2 className="text-3xl font-black text-slate-950">{job.title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {job.company || job.location || "Unknown company"}
          </p>
        </div>
        <button type="button" className="ghost" onClick={() => setSelectedJobDetail(null)}>
          Close
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
        <article className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-lg font-black text-slate-950">Requirements</h3>
          <p className="text-sm leading-relaxed text-slate-600">
            {job.description || "No description available."}
          </p>
          <div className="chips">
            {(job.skills || []).map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </article>

        <article className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <h3 className="text-lg font-black text-slate-950">Best saved CVs</h3>
            <p className="text-sm text-slate-500">
              {rankingStatus || "Select a job to rank CVs."}
            </p>
          </div>
          {rankings.length ? (
            <div className="grid gap-3">
              {rankings.slice(0, 5).map((ranking) => (
                <div
                  key={ranking.cv._id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-start md:justify-between"
                >
                  <div>
                    <h4 className="mb-1 font-black text-slate-950">{ranking.cv.title}</h4>
                    <p className="mb-3 text-sm leading-relaxed text-slate-500">{ranking.reason}</p>
                    <div className="chips">
                      {(ranking.matchedSkills || []).map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </div>
                  </div>
                  <strong className="w-max rounded-full bg-teal-100 px-3 py-2 text-sm font-black text-teal-800">
                    {ranking.matchScore}% match
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </article>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={() => generateCvForJob(job)}>
          Generate Tailored CV for This Job
        </button>
      </div>
    </section>
  );
}
