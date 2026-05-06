import { FiArrowRight } from "react-icons/fi";
import PassportForm from "../components/forms/PassportForm";
import { ui } from "../styles/ui";

export default function PassportOnboarding({
  isBusy,
  passport,
  savePassport,
  setPassport,
  skipPassport,
  user,
}) {
  function submit(event) {
    event.preventDefault();
    savePassport(passport).catch((error) => console.error(error));
  }

  return (
    <main className="mx-auto min-w-0 w-[min(1180px,calc(100%-32px))] py-8 pb-12 max-sm:w-[calc(100%-24px)]">

      {/* ── Hero header ───────────────────────────────────────────────── */}
      <header
        className="lat-dot-grid mb-5 flex min-w-0 items-start justify-between gap-5 overflow-hidden rounded-[20px] border border-[#E8E3D7] p-8 max-lg:flex-col max-sm:p-5"
        style={{ position: "relative" }}
      >
        {/* Decorative numeral */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute", right: 24, bottom: -48,
            fontFamily: "var(--font-display)",
            fontSize: 200, lineHeight: 1,
            color: "var(--c-mist)", opacity: 0.28,
            letterSpacing: "-0.02em", pointerEvents: "none", userSelect: "none",
          }}
        >
          01
        </span>

        <div className="relative min-w-0">
          <p className={ui.eyebrow}>Career Passport</p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px,4.5vw,52px)",
              fontWeight: 400,
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
              color: "var(--c-ink)",
              maxWidth: 720,
              marginTop: 8,
            }}
          >
            Welcome, <em style={{ fontStyle: "italic" }}>{user.firstName}.</em>
            <br />Let&apos;s build your professional profile.
          </h1>
          <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-[#3A3A40]">
            Add your education, skills, experience, goals, and portfolio details.
            You can edit everything later from My Account.
          </p>
        </div>

        <button className={ui.buttonSecondary} disabled={isBusy} type="button" onClick={skipPassport}>
          Skip now
          <FiArrowRight size={14} strokeWidth={1.5} />
        </button>
      </header>

      <PassportForm
        isBusy={isBusy}
        passport={passport}
        setPassport={setPassport}
        submit={submit}
        submitLabel={isBusy ? "Saving…" : "Save Career Passport"}
      />
    </main>
  );
}
