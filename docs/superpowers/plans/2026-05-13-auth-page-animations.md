# Auth Page Animations & Content — Phase 7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Option-B polished entrance animations, a continuous dot-grid drift, a smooth sign-in/sign-up crossfade transition, button micro-interactions, and richer editorial copy to `AuthPage.jsx`.

**Architecture:** All animation keyframes and utility classes live in `styles.css` (CSS-only, no JS animation library). `AuthPage.jsx` gains a single `isSwitching` local state to drive the form-mode crossfade; everything else is driven by CSS classes applied to static elements. No new npm packages.

**Tech Stack:** React 18 (useState), Tailwind CSS, existing Vitest + @testing-library/react, jsdom

---

## Files

| File | Change |
|---|---|
| `frontend/src/styles.css` | Add 6 `@keyframes` + 10 CSS classes + prefers-reduced-motion block |
| `frontend/src/pages/AuthPage.jsx` | Import useState; update subtitle copy; replace feature trio with stacked descriptive cards; add CSS class hooks; add isSwitching state for mode-switch crossfade; add `role="alert"` on status paragraph |
| `frontend/src/pages/__tests__/AuthPage.test.jsx` | New file — 8 tests covering render, content, form submission, form-switch transition, and prefers-reduced-motion CSS guard |

---

## Task 1 — CSS keyframes and animation classes

**Files:**
- Modify: `frontend/src/styles.css` (append after the toast block near line 229)

- [ ] **Step 1: Locate the insertion point**

Open `frontend/src/styles.css`. Find the line:
```css
@media (prefers-reduced-motion: reduce) {
  .lat-toast, .lat-toast.is-leaving { animation: none; }
}
```
Everything in this task is appended **after** that block.

- [ ] **Step 2: Add the auth animation block**

Append to `frontend/src/styles.css`:

```css
/* ── Auth page entrance animations ───────────────────────────────────────── */
@keyframes lat-auth-from-top {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes lat-auth-from-below {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes lat-auth-headline-in {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes lat-auth-numeral-in {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 0.28; transform: translateY(0); }
}

@keyframes lat-auth-from-right {
  from { opacity: 0; transform: translateX(12px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes lat-dot-drift {
  0%, 100% { transform: translate(0, 0); }
  50%       { transform: translate(3px, 2px); }
}

/* Entrance classes — apply once on mount; animation runs automatically */
.lat-dot-anim      { animation: lat-dot-drift       10s  ease-in-out             infinite; }
.lat-auth-brand    { animation: lat-auth-from-top   320ms cubic-bezier(0.22,1,0.36,1)  80ms both; will-change: opacity, transform; }
.lat-auth-headline { animation: lat-auth-headline-in 400ms cubic-bezier(0.22,1,0.36,1) 180ms both; will-change: opacity, transform; }
.lat-auth-feat-1   { animation: lat-auth-from-below 360ms cubic-bezier(0.22,1,0.36,1) 320ms both; will-change: opacity, transform; }
.lat-auth-feat-2   { animation: lat-auth-from-below 360ms cubic-bezier(0.22,1,0.36,1) 420ms both; will-change: opacity, transform; }
.lat-auth-feat-3   { animation: lat-auth-from-below 360ms cubic-bezier(0.22,1,0.36,1) 520ms both; will-change: opacity, transform; }
.lat-auth-numeral  { animation: lat-auth-numeral-in 500ms cubic-bezier(0.22,1,0.36,1) 420ms both; will-change: opacity, transform; }
.lat-auth-right    { animation: lat-auth-from-right 380ms cubic-bezier(0.22,1,0.36,1) 200ms both; will-change: opacity, transform; }

/* Form-mode crossfade */
.lat-auth-fields {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.lat-auth-fields.is-switching {
  opacity: 0;
  transform: translateY(6px);
  pointer-events: none;
}

/* Submit button micro-interactions */
.lat-auth-submit {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.lat-auth-submit:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
}
.lat-auth-submit:active:not(:disabled) {
  opacity: 1;
  transform: translateY(0) scale(0.98);
  transition-duration: 0.08s;
}

@media (prefers-reduced-motion: reduce) {
  .lat-dot-anim,
  .lat-auth-brand,
  .lat-auth-headline,
  .lat-auth-feat-1,
  .lat-auth-feat-2,
  .lat-auth-feat-3,
  .lat-auth-numeral,
  .lat-auth-right    { animation: none; }
  .lat-auth-fields   { transition: none; }
  .lat-auth-submit   { transition: none; }
}
```

- [ ] **Step 3: Commit CSS**

```bash
git add frontend/src/styles.css
git commit -m "style: add auth page entrance animation keyframes and classes"
```

---

## Task 2 — Write failing tests (TDD)

**Files:**
- Create: `frontend/src/pages/__tests__/AuthPage.test.jsx`

- [ ] **Step 1: Create the test file**

Create `frontend/src/pages/__tests__/AuthPage.test.jsx`:

```jsx
import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AuthPage from "../AuthPage";

const baseProps = {
  authForm: {
    firstName: "", lastName: "", email: "",
    phoneNumber: "", countryCode: "+90",
    password: "", confirmPassword: "",
  },
  authErrors: {},
  authMode: "login",
  isBusy: false,
  setAuthForm: vi.fn(),
  setAuthErrors: vi.fn(),
  setAuthMode: vi.fn(),
  submitAuth: vi.fn((e) => e.preventDefault()),
  status: "",
};

afterEach(() => { vi.clearAllMocks(); });

// ── Render ────────────────────────────────────────────────────────────────────

describe("AuthPage — sign-in mode (default)", () => {
  it("renders welcome heading and email + password inputs", () => {
    render(<AuthPage {...baseProps} />);
    expect(screen.getByText("Welcome back.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  it("does not show first-name field in sign-in mode", () => {
    render(<AuthPage {...baseProps} />);
    expect(screen.queryByPlaceholderText("Ada")).not.toBeInTheDocument();
  });
});

describe("AuthPage — sign-up mode", () => {
  it("shows registration heading and extra fields when authMode is register", () => {
    render(<AuthPage {...baseProps} authMode="register" />);
    expect(screen.getByText("Create account.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ada")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Repeat password")).toBeInTheDocument();
  });
});

// ── Form submission ───────────────────────────────────────────────────────────

describe("AuthPage — form submission", () => {
  it("calls submitAuth when the form is submitted", () => {
    const submitAuth = vi.fn((e) => e.preventDefault());
    const { container } = render(<AuthPage {...baseProps} submitAuth={submitAuth} />);
    fireEvent.submit(container.querySelector("form"));
    expect(submitAuth).toHaveBeenCalledTimes(1);
  });
});

// ── Content ───────────────────────────────────────────────────────────────────

describe("AuthPage — editorial content", () => {
  it("shows 'Career Passport' feature card title", () => {
    render(<AuthPage {...baseProps} />);
    expect(screen.getByText("Career Passport")).toBeInTheDocument();
  });

  it("shows 'Live role matches' feature card title", () => {
    render(<AuthPage {...baseProps} />);
    expect(screen.getByText("Live role matches")).toBeInTheDocument();
  });

  it("shows 'Skill gap roadmap' feature card title", () => {
    render(<AuthPage {...baseProps} />);
    expect(screen.getByText("Skill gap roadmap")).toBeInTheDocument();
  });

  it("shows updated subtitle copy", () => {
    render(<AuthPage {...baseProps} />);
    expect(
      screen.getByText(/One place to manage your CV, match live roles/)
    ).toBeInTheDocument();
  });
});

// ── Form-switch transition ────────────────────────────────────────────────────

describe("AuthPage — form-switch crossfade", () => {
  it("adds is-switching class on toggle click and removes it after 250 ms", () => {
    vi.useFakeTimers();
    const { container } = render(<AuthPage {...baseProps} />);
    const signUpBtn = screen.getByRole("button", { name: "Sign up" });

    act(() => { fireEvent.click(signUpBtn); });
    expect(container.querySelector(".lat-auth-fields.is-switching")).not.toBeNull();

    act(() => { vi.advanceTimersByTime(260); });
    expect(container.querySelector(".lat-auth-fields.is-switching")).toBeNull();

    vi.useRealTimers();
  });
});

// ── prefers-reduced-motion CSS guard ─────────────────────────────────────────

describe("AuthPage — accessibility / reduced motion", () => {
  it("styles.css contains a prefers-reduced-motion block that disables lat-auth-brand animation", () => {
    const css = readFileSync(
      resolve(__dirname, "../../../styles.css"),
      "utf-8"
    );
    const brandDef   = css.indexOf(".lat-auth-brand");
    const motionIdx  = css.lastIndexOf("prefers-reduced-motion");
    expect(brandDef).toBeGreaterThan(-1);
    expect(motionIdx).toBeGreaterThan(brandDef);
    // The reduced-motion block must reference .lat-auth-brand
    expect(css.slice(motionIdx)).toContain(".lat-auth-brand");
  });
});
```

- [ ] **Step 2: Run tests and confirm they fail for the right reasons**

```bash
cd c:\Users\cange\OneDrive\Masaüstü\web\web-final-project\ai-career-api
npx vitest run frontend/src/pages/__tests__/AuthPage.test.jsx --reporter=verbose 2>&1
```

Expected: content tests fail ("Career Passport" not found), transition test fails (`.is-switching` not in DOM). CSS guard test may pass already (CSS was added in Task 1). Render and submission tests should pass (existing behavior).

---

## Task 3 — Update content in AuthPage.jsx

**Files:**
- Modify: `frontend/src/pages/AuthPage.jsx`

- [ ] **Step 1: Add useState import**

At the top of `frontend/src/pages/AuthPage.jsx`, add the React import:

```jsx
import { useState } from "react";
import FieldError from "../components/common/FieldError";
import PhoneField from "../components/forms/PhoneField";
import { FiAlertCircle } from "react-icons/fi";
import { ui } from "../styles/ui";
import { normalizePhoneNumber } from "../utils/validation";
```

- [ ] **Step 2: Add isSwitching state and feature data at the top of the component**

Inside `export default function AuthPage(...)`, immediately after the existing `isRegister` declaration, add:

```jsx
const [isSwitching, setIsSwitching] = useState(false);

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
```

- [ ] **Step 3: Add handleModeSwitch helper**

After the `FEATURES` constant, add:

```jsx
function handleModeSwitch(mode) {
  if (mode === (isRegister ? "register" : "login")) return; // already active
  setIsSwitching(true);
  setTimeout(() => {
    setAuthMode(mode);
    setAuthErrors({});
    setIsSwitching(false);
  }, 250);
}
```

- [ ] **Step 4: Update the left panel — dot-grid class**

Find the dot-grid section element (the left panel) and add `lat-dot-anim` to the background overlay div. The current code is:

```jsx
<section
  className="lat-dot-grid relative hidden min-h-screen w-[52%] shrink-0 flex-col overflow-hidden px-14 py-12 lg:flex"
  style={{ borderRight: "1px solid var(--c-hairline)" }}
>
```

The dot-grid visual is the `lat-dot-grid` CSS class on the `<section>` itself (it sets `background-image`). Add `lat-dot-anim` to animate it:

```jsx
<section
  className="lat-dot-grid lat-dot-anim relative hidden min-h-screen w-[52%] shrink-0 flex-col overflow-hidden px-14 py-12 lg:flex"
  style={{ borderRight: "1px solid var(--c-hairline)" }}
>
```

- [ ] **Step 5: Add animation class to brand mark div**

Find:
```jsx
<div className="flex items-center gap-2.5">
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
```

Replace with:
```jsx
<div className="lat-auth-brand flex items-center gap-2.5">
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
```

- [ ] **Step 6: Add animation class to headline div and update subtitle copy**

Find:
```jsx
<div className="mt-16 mb-12 max-w-[480px]">
```

Replace with:
```jsx
<div className="lat-auth-headline mt-16 mb-12 max-w-[480px]">
```

Then find and replace the subtitle paragraph:
```jsx
<p className="mt-5 max-w-[420px] text-[15px] leading-relaxed text-[#3A3A40]">
  Build a Career Passport once. Match it against live roles, surface
  skill gaps, and walk a roadmap that opens more doors with each milestone.
</p>
```

Replace with:
```jsx
<p className="mt-5 max-w-[420px] text-[15px] leading-relaxed text-[#3A3A40]">
  One place to manage your CV, match live roles, and close skill gaps — step by step.
</p>
```

- [ ] **Step 7: Replace feature trio with stacked descriptive cards**

Find and replace the entire feature trio block:

```jsx
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
```

Replace with:

```jsx
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
```

- [ ] **Step 8: Add animation class to decorative numeral**

Find:
```jsx
<span
  aria-hidden="true"
  style={{
    position: "absolute",
    right: 28,
    bottom: -100,
```

Replace the opening tag with (add `lat-auth-numeral` className):
```jsx
<span
  aria-hidden="true"
  className="lat-auth-numeral"
  style={{
    position: "absolute",
    right: 28,
    bottom: -100,
```

- [ ] **Step 9: Add animation class to right panel section**

Find:
```jsx
<section
  className="flex flex-1 items-center justify-center px-8 py-12 max-sm:px-5"
  style={{ background: "var(--c-paper)" }}
>
```

Replace with:
```jsx
<section
  className="lat-auth-right flex flex-1 items-center justify-center px-8 py-12 max-sm:px-5"
  style={{ background: "var(--c-paper)" }}
>
```

- [ ] **Step 10: Run the content tests and confirm they pass**

```bash
npx vitest run frontend/src/pages/__tests__/AuthPage.test.jsx --reporter=verbose 2>&1
```

Expected: all content tests now pass ("Career Passport", "Live role matches", "Skill gap roadmap", subtitle copy). Transition test still fails.

---

## Task 4 — Form-switch crossfade transition

**Files:**
- Modify: `frontend/src/pages/AuthPage.jsx`

- [ ] **Step 1: Update the mode-toggle buttons to call handleModeSwitch**

Find the toggle button `onClick` handlers:
```jsx
onClick={() => { setAuthMode(mode); setAuthErrors({}); }}
```

Replace with:
```jsx
onClick={() => handleModeSwitch(mode)}
```

- [ ] **Step 2: Wrap form fields in the transition container**

The form fields that change between modes (name fields, phone, confirm password — and the heading/subtext) need the crossfade wrapper. The wrapper goes around the heading + form.

Find (inside the right panel `<div className="w-full max-w-[400px]">`):
```jsx
<h2 style={{
  fontFamily: "var(--font-display)",
```

Wrap everything from that `<h2>` through the closing `</form>` tag in a div:

```jsx
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

  {/* Form */}
  <form className="grid gap-3.5" noValidate onSubmit={submitAuth}>
    {/* ...all existing form content unchanged... */}
  </form>
</div>
```

The full replacement for the right panel inner div (the `<div className="w-full max-w-[400px]">`) should look like:

```jsx
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

  {/* Toggle — outside the crossfade wrapper so it stays stable */}
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

  {/* Crossfade wrapper */}
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
```

Note: the `transition-colors` class was removed from the submit button (the CSS transition is now handled by `.lat-auth-submit` in `styles.css`).

- [ ] **Step 3: Run all tests and confirm they pass**

```bash
npx vitest run frontend/src/pages/__tests__/AuthPage.test.jsx --reporter=verbose 2>&1
```

Expected output:
```
✓ AuthPage — sign-in mode (default) > renders welcome heading and email + password inputs
✓ AuthPage — sign-in mode (default) > does not show first-name field in sign-in mode
✓ AuthPage — sign-up mode > shows registration heading and extra fields when authMode is register
✓ AuthPage — form submission > calls submitAuth when the form is submitted
✓ AuthPage — editorial content > shows 'Career Passport' feature card title
✓ AuthPage — editorial content > shows 'Live role matches' feature card title
✓ AuthPage — editorial content > shows 'Skill gap roadmap' feature card title
✓ AuthPage — editorial content > shows updated subtitle copy
✓ AuthPage — form-switch crossfade > adds is-switching class on toggle click and removes it after 250 ms
✓ AuthPage — accessibility / reduced motion > styles.css contains a prefers-reduced-motion block
Tests  8 passed (8)
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/AuthPage.jsx frontend/src/pages/__tests__/AuthPage.test.jsx
git commit -m "feat: auth page animations, descriptive feature cards, form crossfade"
```

---

## Task 5 — Build check and MASTER_PLAN update

**Files:**
- Run: `npm run build`
- Modify: `docs/superpowers/plans/MASTER_PLAN.md`

- [ ] **Step 1: Run the full test suite to confirm no regressions**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -20
```

Expected: all existing tests pass, 8 new tests pass.

- [ ] **Step 2: Run the production build**

```bash
npm run build 2>&1 | tail -12
```

Expected: `✓ built in ...ms` with 0 errors. Note the new gzip size for AuthPage chunk.

- [ ] **Step 3: Update MASTER_PLAN.md**

In `docs/superpowers/plans/MASTER_PLAN.md`:

Change the Phase 7 status row:
```markdown
| 7 | Auth/Pre-login design improvement | ⏳ PENDING | — |
```
to:
```markdown
| 7 | Auth/Pre-login design improvement | ✅ DONE | ✅ Clean (gzip: ___ KB) |
```
(Fill in the actual gzip size from Step 2.)

Change the Phase 7 heading:
```markdown
## Phase 7 — Auth/Pre-login Design Improvement ⏳ PENDING
```
to:
```markdown
## Phase 7 — Auth/Pre-login Design Improvement ✅ DONE
```

Mark all Phase 7 task checkboxes as done.

- [ ] **Step 4: Final commit**

```bash
git add docs/superpowers/plans/MASTER_PLAN.md
git commit -m "docs: mark Phase 7 complete in master plan"
```
