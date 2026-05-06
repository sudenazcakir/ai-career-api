import FieldError from "../components/common/FieldError";
import PhoneField from "../components/forms/PhoneField";
import { FiAlertCircle } from "react-icons/fi";
import { ui } from "../styles/ui";
import { normalizePhoneNumber } from "../utils/validation";

export default function AuthPage({
  authForm,
  authErrors,
  authMode,
  isBusy,
  setAuthForm,
  setAuthErrors,
  setAuthMode,
  submitAuth,
  status,
}) {
  const isRegister = authMode === "register";
  const nameFormatError = isRegister
    ? [authErrors.firstName, authErrors.lastName].find((message) =>
        String(message || "").startsWith("Use letters")
      )
    : "";
  const hasInlineError = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "password",
    "confirmPassword",
  ].some((field) => {
    const message = authErrors[field];
    if (!message) return false;
    return !["firstName", "lastName"].includes(field) || message !== nameFormatError;
  });
  const visibleStatus = status && status !== "System ready" && !hasInlineError && !nameFormatError;

  return (
    <main className="flex min-h-screen min-w-0 overflow-hidden" style={{ background: "var(--c-bone)" }}>

      {/* ── Left panel: editorial / dotted grid ─────────────────────── */}
      <section
        className="lat-dot-grid relative hidden min-h-screen w-[52%] shrink-0 flex-col overflow-hidden px-14 py-12 lg:flex"
        style={{ borderRight: "1px solid var(--c-hairline)" }}
      >
        {/* Brand mark */}
        <div className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="8" height="8" fill="#0E0E10"/>
            <rect x="11" y="1" width="8" height="8" fill="none" stroke="#E8E3D7" strokeWidth="1.2"/>
            <rect x="1" y="11" width="8" height="8" fill="none" stroke="#E8E3D7" strokeWidth="1.2"/>
            <rect x="11" y="11" width="8" height="8" fill="#0E0E10"/>
          </svg>
          <strong style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--c-ink)" }}>
            Lattice
          </strong>
        </div>

        {/* Headline */}
        <div className="mt-16 mb-12 max-w-[480px]">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#6B6B72]"
             style={{ fontFamily: "var(--font-mono)" }}>
            Career Operating System
          </p>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(44px,5vw,72px)",
            fontWeight: 400,
            lineHeight: 0.97,
            letterSpacing: "-0.02em",
            color: "var(--c-ink)",
            margin: 0,
          }}>
            <em style={{ fontStyle: "italic" }}>A career,</em>
            <br />cell by cell.
          </h1>
          <p className="mt-5 max-w-[420px] text-[15px] leading-relaxed text-[#3A3A40]">
            Build a Career Passport once. Match it against live roles, surface
            skill gaps, and walk a roadmap that opens more doors with each milestone.
          </p>
        </div>

        {/* Feature trio */}
        <div className="grid max-w-[420px] grid-cols-3 gap-3">
          {[["01", "Profile"], ["02", "Matches"], ["03", "Roadmap"]].map(([n, l]) => (
            <div
              key={n}
              className="rounded-[8px] border border-[#E8E3D7] bg-[#FBFAF6] p-3.5"
            >
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B6B72]"
                 style={{ fontFamily: "var(--font-mono)" }}>
                {n}
              </p>
              <strong className="text-[14px] font-semibold text-[#0E0E10]">{l}</strong>
            </div>
          ))}
        </div>

        {/* Decorative numeral */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 28,
            bottom: -100,
            fontFamily: "var(--font-display)",
            fontSize: 320,
            lineHeight: 1,
            color: "var(--c-mist)",
            opacity: 0.28,
            letterSpacing: "-0.02em",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          86
        </span>
      </section>

      {/* ── Right panel: form ────────────────────────────────────────── */}
      <section
        className="flex flex-1 items-center justify-center px-8 py-12 max-sm:px-5"
        style={{ background: "var(--c-paper)" }}
      >
        <div className="w-full max-w-[400px]">

          {/* Mobile brand */}
          <p className="mb-5 flex items-center gap-2 text-[13px] font-semibold text-[#0E0E10] lg:hidden">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="8" height="8" fill="#0E0E10"/>
              <rect x="11" y="1" width="8" height="8" fill="none" stroke="#E8E3D7" strokeWidth="1.5"/>
              <rect x="1" y="11" width="8" height="8" fill="none" stroke="#E8E3D7" strokeWidth="1.5"/>
              <rect x="11" y="11" width="8" height="8" fill="#0E0E10"/>
            </svg>
            Lattice
          </p>

          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: 42,
            fontWeight: 400,
            letterSpacing: "-0.02em",
            color: "var(--c-ink)",
            lineHeight: 1,
            marginBottom: 6,
          }}>
            {isRegister ? "Create account." : "Welcome back."}
          </h2>
          <p className="mb-6 text-[13px] text-[#6B6B72]">
            {isRegister
              ? "Set up your profile in under a minute."
              : "Sign in to continue your career match."}
          </p>

          {/* Toggle */}
          <div
            className="mb-5 grid grid-cols-2 rounded-[8px] p-[3px]"
            style={{ background: "var(--c-bone)", border: "1px solid var(--c-hairline)" }}
          >
            {[
              { label: "Sign up", mode: "register" },
              { label: "Sign in", mode: "login" },
            ].map(({ label, mode }) => (
              <button
                key={mode}
                type="button"
                className="h-8 rounded-[6px] text-[12px] font-medium transition-colors"
                style={(() => {
                  const isActive = isRegister ? mode === "register" : mode === "login";
                  return isActive
                    ? { background: "var(--c-paper)", color: "var(--c-ink)", boxShadow: "var(--shadow-sm)" }
                    : { background: "transparent", color: "var(--c-slate)" };
                })()}
                onClick={() => { setAuthMode(mode); setAuthErrors({}); }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form className="grid gap-3.5" noValidate onSubmit={submitAuth}>
            {isRegister && (
              <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <label className={ui.label}>
                  First name
                  <input
                    className={ui.input}
                    placeholder="Ada"
                    value={authForm.firstName}
                    onChange={(e) => setAuthForm({ ...authForm, firstName: e.target.value })}
                  />
                  <FieldError message={authErrors.firstName === nameFormatError ? "" : authErrors.firstName} />
                </label>
                <label className={ui.label}>
                  Last name
                  <input
                    className={ui.input}
                    placeholder="Tunç"
                    value={authForm.lastName}
                    onChange={(e) => setAuthForm({ ...authForm, lastName: e.target.value })}
                  />
                  <FieldError message={authErrors.lastName === nameFormatError ? "" : authErrors.lastName} />
                </label>
              </div>
            )}

            <label className={ui.label}>
              Email
              <input
                className={ui.input}
                inputMode="email"
                placeholder="name@example.com"
                type="text"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              />
              <FieldError message={authErrors.email} />
            </label>

            {isRegister && (
              <PhoneField
                countryCode={authForm.countryCode}
                phoneNumber={authForm.phoneNumber}
                setCountryCode={(countryCode) => setAuthForm({ ...authForm, countryCode })}
                setPhoneNumber={(phoneNumber) =>
                  setAuthForm({ ...authForm, phoneNumber: normalizePhoneNumber(phoneNumber) })
                }
                error={authErrors.phone}
                variant="default"
              />
            )}

            <label className={ui.label}>
              Password
              <input
                className={ui.input}
                placeholder="Password"
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              />
              <FieldError message={authErrors.password} />
            </label>

            {isRegister && (
              <label className={ui.label}>
                Confirm password
                <input
                  className={ui.input}
                  placeholder="Repeat password"
                  type="password"
                  value={authForm.confirmPassword}
                  onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                />
                <FieldError message={authErrors.confirmPassword} />
              </label>
            )}

            <button
              className="mt-2 h-10 w-full rounded-[8px] text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "var(--c-ink)", color: "var(--c-bone)" }}
              disabled={isBusy}
              formNoValidate
              type="submit"
            >
              {isBusy ? "Please wait…" : isRegister ? "Create account" : "Sign in" /* eslint-disable-line no-nested-ternary */}
            </button>

            {nameFormatError && (
              <p className="flex min-w-0 items-start gap-2 break-words rounded-[8px] border border-[#F0C5BE] bg-[#FBEDEA] px-3 py-2 text-[12px] font-medium text-[#A6261A]">
                <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{nameFormatError}</span>
              </p>
            )}
          </form>

          {visibleStatus && (
            <p className="mt-4 flex min-w-0 items-center gap-2 break-words text-[13px] text-[#A6261A]">
              <FiAlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {status}
            </p>
          )}

          <p className="mt-5 text-[12px] text-[#A4A4AC]">
            By continuing you agree to Lattice's Terms and Privacy.
          </p>
        </div>
      </section>
    </main>
  );
}
