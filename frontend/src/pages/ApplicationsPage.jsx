import { FiBriefcase, FiSearch } from "react-icons/fi";
import { Empty, JobList } from "../components/shared";
import { ui } from "../styles/ui";

export default function ApplicationsPage({
  applications,
  applicationStatuses = ["Saved for Later", "Under Review", "Accepted", "Rejected"],
  setActivePage,
  updateApplicationStatus,
  similarApplications = [],
  loadSimilarApplications = null,
}) {
  const columns = applicationStatuses.map((status) => ({
    status,
    items: applications.filter((a) => a.status === status),
  }));

  return (
    <div className="grid gap-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-700">
              Application Tracker
            </p>
            <h2 className="text-3xl font-black text-slate-950">
              Move opportunities through your pipeline.
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Save roles for later, track submitted applications, and update outcomes.
            </p>
          </div>
          <button
            type="button"
            className={`${ui.button} inline-flex items-center justify-center gap-2`}
            onClick={() => setActivePage("jobs")}
          >
            <FiBriefcase className="h-4 w-4 shrink-0" />
            Add or Save Job
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => (
          <div
            className="grid min-h-[360px] content-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            key={column.status}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <h2 className="text-lg font-black text-slate-900">{column.status}</h2>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-teal-700 shadow-sm">
                {column.items.length}
              </span>
            </div>

            {column.items.length ? (
              <div className="grid gap-3">
                {column.items.map((application) => (
                  <ApplicationCard
                    application={application}
                    applicationStatuses={applicationStatuses}
                    key={application._id}
                    updateApplicationStatus={updateApplicationStatus}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm font-semibold text-slate-500">
                No applications in this stage.
              </p>
            )}
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className={ui.sectionHead}>
          <div>
            <p className="mb-1 text-xs font-black uppercase tracking-normal text-teal-700">
              Similar roles
            </p>
            <h2 className="text-2xl font-black text-slate-950">
              Based on your application history
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Roles similar to what you've applied for before.
            </p>
          </div>
          <button
            type="button"
            className={`${ui.buttonGhost} inline-flex items-center justify-center gap-2`}
            onClick={loadSimilarApplications ?? undefined}
            disabled={!loadSimilarApplications}
          >
            <FiSearch className="h-4 w-4 shrink-0" />
            Find Similar Roles
          </button>
        </div>
        {similarApplications.length > 0 ? (
          <JobList items={similarApplications} />
        ) : (
          <Empty />
        )}
      </section>
    </div>
  );
}

function ApplicationCard({ application, applicationStatuses, updateApplicationStatus }) {
  return (
    <article className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="mb-1 text-base font-black text-slate-950">
          {application.job?.title || "Unknown role"}
        </h3>
        <p className="mb-3 text-sm text-slate-500">
          {application.job?.company || "Unknown company"} · CV:{" "}
          {application.cv?.title || "Unknown CV"}
        </p>
        <div className="chips">
          {(application.job?.skills || []).slice(0, 5).map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      </div>
      <label>
        Move to
        <select
          value={application.status}
          onChange={(e) => updateApplicationStatus(application._id, e.target.value)}
        >
          {applicationStatuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </label>
    </article>
  );
}
