import { useState, useRef, useEffect } from "react";
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
  const FEATURES = [
    {
      n: "01", cn: "lat-auth-feat-1",
      title: "Career Passport",
      desc: "Upload your CV once. Your skills, projects, and experience power every match.",
    },
    {
      n: "02", cn: "lat-auth-feat-2",
      title: "Live role matches",
      desc: "Real jobs scored against your profile. See your exact fit — and what's holding you back.",
    },
    {
      n: "03", cn: "lat-auth-feat-3",
      title: "Skill gap roadmap",
      desc: "Turn your gaps into a step-by-step plan. Learn what employers actually ask for.",
    },
  ];
  const [isSwitching, setIsSwitching] = useState(false);
  const leftPanelRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const panel = leftPanelRef.current;
    const canvas = canvasRef.current;
    if (!panel || !canvas) return;
    if (globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    let animId;
    let lastTs = 0;
    let t = 0;
    let lw = 0;
    let lh = 0;
    let panelRect = { left: 0, top: 0 };
    const mouse = { x: -9999, y: -9999 };
    const SPACING = 18;
    const INFLUENCE = 80;
    const PUSH = 14;
    const LERP = 0.09;
    let dots = [];

    function resize() {
      lw = panel.offsetWidth;
      lh = panel.offsetHeight;
      canvas.width  = lw * dpr;
      canvas.height = lh * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      panelRect = panel.getBoundingClientRect();
      dots = [];
      for (let x = SPACING / 2; x < lw; x += SPACING)
        for (let y = SPACING / 2; y < lh; y += SPACING)
          dots.push({ rx: x, ry: y, cx: x, cy: y });
    }

    function draw(ts) {
      const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 1 / 60;
      lastTs = ts;
      t += dt * 0.72;
      const lerpF = 1 - Math.pow(1 - LERP, dt * 60);
      const pushScale = dt * 60;

      ctx.clearRect(0, 0, lw, lh);
      ctx.fillStyle = "#0E0E10";
      ctx.globalAlpha = 0.13;
      ctx.beginPath();
      for (const d of dots) {
        const nx = d.rx * 0.009;
        const ny = d.ry * 0.011;
        const tx = d.rx + Math.sin(nx + t * 0.7)  * Math.cos(ny * 1.3 + t * 0.5) * 6;
        const ty = d.ry + Math.cos(nx * 1.1 + t * 0.6) * Math.sin(ny + t * 0.8) * 6;
        const dx = d.cx - mouse.x;
        const dy = d.cy - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < INFLUENCE && dist > 0) {
          const force = (1 - dist / INFLUENCE) * PUSH * pushScale;
          d.cx += (dx / dist) * force;
          d.cy += (dy / dist) * force;
        }
        d.cx += (tx - d.cx) * lerpF;
        d.cy += (ty - d.cy) * lerpF;
        ctx.moveTo(d.cx + 1.4, d.cy);
        ctx.arc(d.cx, d.cy, 1.4, 0, Math.PI * 2);
      }
      ctx.fill();
      animId = requestAnimationFrame(draw);
    }

    function onMove(e) {
      mouse.x = e.clientX - panelRect.left;
      mouse.y = e.clientY - panelRect.top;
    }
    function onLeave() { mouse.x = -9999; mouse.y = -9999; }

    resize();
    animId = requestAnimationFrame(draw);
    panel.addEventListener("mousemove", onMove);
    panel.addEventListener("mouseleave", onLeave);
    const ro = new ResizeObserver(resize);
    ro.observe(panel);

    return () => {
      cancelAnimationFrame(animId);
      panel.removeEventListener("mousemove", onMove);
      panel.removeEventListener("mouseleave", onLeave);
      ro.disconnect();
    };
  }, []);

  function handleModeSwitch(mode) {
    if (mode === (isRegister ? "register" : "login")) return;
    setIsSwitching(true);
    setTimeout(() => {
      setAuthMode(mode);
      setAuthErrors({});
      setIsSwitching(false);
    }, 250);
  }

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
        ref={leftPanelRef}
        className="relative hidden min-h-screen w-[52%] shrink-0 flex-col overflow-hidden px-14 py-12 lg:flex"
        style={{ background: "var(--c-bone)", borderRight: "1px solid var(--c-hairline)" }}
      >
        {/* Canvas dot ripple — replaces static lat-dot-grid */}
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        />
        {/* Brand mark */}
        <div className="lat-auth-brand flex items-center gap-2.5">
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
        <div className="lat-auth-headline mt-16 mb-12 max-w-[480px]">
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
            One place to manage your CV, match live roles, and close skill gaps — step by step.
          </p>
        </div>

        {/* Feature cards — stacked descriptive */}
        <div className="grid max-w-[420px] grid-cols-1 gap-2.5 mt-auto">
          {FEATURES.map(({ n, cn, title, desc }) => (
            <div
              key={n}
              className={`${cn} flex items-start gap-3 rounded-[8px] border border-[#E8E3D7] bg-[#FBFAF6] p-3`}
            >
              <span
                className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[6px] border border-[#E8E3D7] bg-[#F6F3EC] text-[10px] font-semibold text-[#0E0E10]"
                style={{ fontFamily: "var(--font-mono)" }}
                aria-hidden="true"
              >
                {n}
              </span>
              <div className="min-w-0">
                <strong className="block text-[12px] font-semibold leading-snug text-[#0E0E10]">
                  {title}
                </strong>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[#6B6B72]">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Decorative numeral */}
        <span
          aria-hidden="true"
          className="lat-auth-numeral"
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
        className="lat-auth-right flex flex-1 items-center justify-center px-8 py-12 max-sm:px-5"
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

          {/* Toggle — outside crossfade wrapper so it stays stable during transition */}
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
                onClick={() => handleModeSwitch(mode)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Crossfade wrapper — fades out/in on mode switch */}
          <div className={`lat-auth-fields${isSwitching ? " is-switching" : ""}`}>
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
                className="lat-auth-submit mt-2 h-10 w-full rounded-[8px] text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
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
          </div>

          {visibleStatus && (
            <p
              role="alert"
              className="mt-4 flex min-w-0 items-center gap-2 break-words text-[13px] text-[#A6261A]"
            >
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
