# Auth Page Design — Phase 7

**Date:** 2026-05-13  
**Status:** Approved  
**Scope:** `frontend/src/pages/AuthPage.jsx` + `frontend/src/styles.css`

---

## Goal

Add polished entrance animations and richer editorial copy to the auth page so that new users immediately understand what Lattice does, and returning users get a professional, welcoming experience.

---

## Decisions Made

### Animation package: Option B — Polished

Medium-speed, elegant animations. Fits the "calm, editorial, data-focused" Lattice voice. Not flashy.

All animations use `cubic-bezier(0.22, 1, 0.36, 1)` (spring-like ease-out). Every animation has a `prefers-reduced-motion` guard — set `animation: none` for the full block.

**Entrance sequence (left panel):**

| Element | Property | Duration | Delay | From |
|---|---|---|---|---|
| Dot grid | translate (continuous drift) | 10s loop | — | `translate(0,0)` → `(3px, 2px)` → `(0,0)` |
| Brand mark | opacity + translateY | 320ms | 80ms | Y: −6px, opacity: 0 |
| Headline area | opacity + translateY | 400ms | 180ms | Y: +16px, opacity: 0 |
| Feature card 01 | opacity + translateY | 360ms | 320ms | Y: +12px, opacity: 0 |
| Feature card 02 | opacity + translateY | 360ms | 420ms | Y: +12px, opacity: 0 |
| Feature card 03 | opacity + translateY | 360ms | 520ms | Y: +12px, opacity: 0 |
| Decorative numeral | opacity + translateY | 500ms | 420ms | Y: +24px, opacity: 0 (→ 0.28) |

**Entrance sequence (right panel):**

| Element | Property | Duration | Delay | From |
|---|---|---|---|---|
| Right panel (form) | opacity + translateX | 380ms | 200ms | X: +12px, opacity: 0 |

**Form mode switch (sign in ↔ sign up):**
- Outgoing fields: `opacity: 0` + `translateY(+6px)` over 250ms ease
- New fields render at frame 250ms, then snap in
- Implementation: `transition: opacity 0.25s ease, transform 0.25s ease` on a wrapper div; add/remove a `.switching` class that sets `opacity: 0; transform: translateY(6px)`

**Button micro-interactions (submit button):**
- Hover: `translateY(-1px)`, `opacity: 0.92`, transition 150ms ease
- Active/press: `translateY(0) scale(0.98)`, transition 80ms ease

---

### Content: Proposed copy approved

**Subtitle (replaces long run-on sentence):**
> "One place to manage your CV, match live roles, and close skill gaps — step by step."

**Feature cards (3 stacked, each with icon box + title + one-sentence description):**

| # | Title | Description |
|---|---|---|
| 01 | Career Passport | Upload your CV once. Your skills, projects, and experience power every match. |
| 02 | Live role matches | Real jobs scored against your profile. See your exact fit — and what's holding you back. |
| 03 | Skill gap roadmap | Turn your gaps into a step-by-step plan. Learn what employers actually ask for. |

**Layout change:** The current 3-column minimal grid (`grid-cols-3`) becomes a single-column stacked list (`grid-cols-1`). Each card is a horizontal flex row: numbered icon box on the left, title + description on the right.

**All other copy unchanged:** headline ("*A career,* cell by cell."), eyebrow ("Career Operating System"), decorative numeral ("86"), form titles, toggle labels.

---

## Files to Change

| File | Change |
|---|---|
| `frontend/src/pages/AuthPage.jsx` | Content update (subtitle, feature cards layout/copy) + JS-driven form-switch transition + button micro-interaction classes |
| `frontend/src/styles.css` | Add `@keyframes` for all entrance animations + `.lat-auth-*` CSS classes + `prefers-reduced-motion` block |

**No new npm packages. No new React components. Single-file CSS approach — keyframes in `styles.css`, class toggling in `AuthPage.jsx`.**

---

## Accessibility Checklist

- All form inputs already have visible `<label>` wrappers via `ui.label` — no change needed.
- Form submittable via keyboard (Enter) — already works via `<form onSubmit>`.
- Focus order correct: email → password → submit → mode-switch toggle buttons.
- Error messages already use `FiAlertCircle` inline — add `role="alert"` to the status paragraph to ensure screen-reader announcement.
- All new CSS animations wrapped in `@media (prefers-reduced-motion: reduce) { animation: none }`.
- No animation flashes > 3Hz.

---

## Tests

| Test | Type | Tool |
|---|---|---|
| AuthPage renders sign-in form by default | Render | Vitest + @testing-library/react |
| Switching to sign-up shows registration fields (name, phone, confirm password) | Interaction | Vitest + @testing-library/react |
| Form submission calls `submitAuth` with correct payload | Interaction | Vitest + @testing-library/react |
| `prefers-reduced-motion` mock → `.lat-auth-panel` has `animation: none` | Style check | Vitest (mock `window.matchMedia`) |

Test file: `frontend/src/pages/__tests__/AuthPage.test.jsx`

---

## Out of Scope

- No changes to the right-side form fields, validation logic, or API calls.
- No changes to mobile layout (left panel already hidden on `max-lg`).
- No dark mode variant.
- No new pages or routes.
