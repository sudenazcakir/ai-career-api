import { FiBriefcase, FiSearch, FiX } from "react-icons/fi";
import { Empty, JobList } from "../components/common/DataViews";
import { getStatusClass, ui } from "../styles/ui";

function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ApplicationsPage({
  applications,
  applicationStatuses = ["Saved for Later", "Under Review", "Accepted", "Rejected"],
  deleteApplication,
  setActivePage,
  updateApplicationStatus,
  similarApplications = [],
  loadSimilarApplications = null,
}) {
  const columns = applicationStatuses.map((status) => ({
    status,
    items: applications.filter((a) => a.status === status),
  }));

  const accepted = applications.filter((a) => a.status === "Accepted").length;
  const pending  = applications.filter((a) => a.status === "Under Review").length;

  return (
    <div className="grid gap-[18px]">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <section className={ui.panel}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className={ui.eyebrow}>Apply · Application Tracker</p>
            <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.01em] text-[#0E0E10]">
              Move opportunities through your pipeline.
            </h2>
            <p className="mt-1.5 text-[13px] text-[#6B6B72]">
              Save roles for later, track submitted applications, and update outcomes.
            </p>
          </div>
          <button
            type="button"
            className={ui.buttonCobalt}
            style={{ flexShrink: 0 }}
            onClick={() => setActivePage("jobs")}
          >
            <FiBriefcase size={14} strokeWidth={1.5} />
            Browse jobs
          </button>
        </div>
      </section>

      {/* ── Metrics strip ─────────────────────────────────────────────── */}
      <div className={`${ui.metrics} col-span-full`}>
        {[
          { label: "Total",        value: applications.length },
          { label: "Under review", value: pending },
          { label: "Accepted",     value: accepted },
          { label: "Saved",        value: applications.filter((a) => a.status === "Saved for Later").length },
        ].map(({ label, value }) => (
          <div key={label} className={ui.metric}>
            <span className={ui.metricLabel}>{label}</span>
            <strong className={ui.metricValue}>{value}</strong>
          </div>
        ))}
      </div>

      {/* ── Kanban ───────────────────────────────────────────────────── */}
      {applications.length === 0 ? (
        <section className={ui.panel}>
          <Empty msg="No applications yet. Save a job from the Jobs page to start tracking." />
          <div className="mt-4 flex justify-center">
            <button type="button" className={ui.buttonCobalt} onClick={() => setActivePage("jobs")}>
              Browse jobs
            </button>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-4 gap-3.5 max-xl:grid-cols-2 max-sm:grid-cols-1">
          {columns.map((column) => (
            <div
              key={column.status}
              className="flex min-h-[320px] flex-col overflow-hidden rounded-[12px] border border-[#E8E3D7] bg-[#FBFAF6]"
            >
              {/* Column header */}
              <div className="flex items-center justify-between border-b border-[#E8E3D7] px-3 py-2.5">
                <span className={getStatusClass(column.status)}>
                  {column.status}
                </span>
                <span className={ui.count}>
                  {column.items.length}
                </span>
              </div>

              {/* Column body — scrollable, max 3 cards visible */}
              <div
                className="flex flex-col gap-2.5 overflow-y-auto p-3"
                style={{ maxHeight: 460 }}
              >
                {column.items.length === 0 ? (
                  <p className="pt-4 text-center text-[12px] text-[#A4A4AC]">
                    No applications in this stage.
                  </p>
                ) : (
                  column.items.map((application) => (
                    <ApplicationCard
                      key={application._id}
                      application={application}
                      applicationStatuses={applicationStatuses}
                      updateApplicationStatus={updateApplicationStatus}
                      deleteApplication={deleteApplication}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── Similar roles ─────────────────────────────────────────────── */}
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Similar roles</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              Based on your application history
            </h2>
            <p className="mt-1 text-[13px] text-[#6B6B72]">
              Roles similar to what you&apos;ve applied for before.
            </p>
          </div>
          <button
            type="button"
            className={ui.buttonSecondary}
            onClick={loadSimilarApplications ?? undefined}
            disabled={!loadSimilarApplications}
          >
            <FiSearch size={14} strokeWidth={1.5} />
            Find similar roles
          </button>
        </div>
        {similarApplications.length > 0 ? (
          <JobList items={similarApplications} />
        ) : (
          <Empty msg="No similar roles yet. Apply to more jobs to surface recommendations." />
        )}
      </section>
    </div>
  );
}

function ApplicationCard({ application, applicationStatuses, updateApplicationStatus, deleteApplication }) {
  const skills = (application.job?.skills || []).slice(0, 5);

  return (
    <article className="relative grid gap-3 rounded-[8px] border border-[#E8E3D7] bg-[#F6F3EC] p-3">
      {/* X button */}
      <button
        type="button"
        aria-label="Remove application"
        className="absolute right-2 top-2 grid h-[18px] w-[18px] place-items-center rounded text-[#A4A4AC] transition-colors hover:text-[#0E0E10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF]"
        onClick={() => deleteApplication(application._id)}
      >
        <FiX size={12} strokeWidth={2} />
      </button>

      <div className="min-w-0 pr-5">
        <h3 className="text-[13px] font-semibold text-[#0E0E10]">
          {application.job?.title || "Unknown role"}
        </h3>
        <p className="mt-0.5 text-[12px] text-[#6B6B72]">
          {application.job?.company || "Unknown company"}
          {application.cv?.title && ` · ${application.cv.title}`}
        </p>
        {(application.updatedAt || application.appliedAt) && (
          <p className="mt-0.5 text-[11px] text-[#A4A4AC]" style={{ fontFamily: "var(--font-mono)" }}>
            {formatDate(application.updatedAt || application.appliedAt)}
          </p>
        )}
        {skills.length > 0 && (
          <div className={`${ui.chips} mt-2`}>
            {skills.map((skill) => (
              <span key={skill} className={ui.chip}>{skill}</span>
            ))}
          </div>
        )}
      </div>

      <label className="grid gap-1">
        <span
          className="text-[9px] font-medium uppercase tracking-[0.06em] text-[#A4A4AC]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Move to
        </span>
        <select
          className={ui.input}
          style={{ height: 30, fontSize: 12, paddingLeft: 8 }}
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
