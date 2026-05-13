# Status Feedback — Toast Notification System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the persistent header status pill (to the left of the avatar) with a professional bottom-right auto-dismiss toast notification system.

**Architecture:** A `ToastList` component renders up to 4 stacked toasts at `position: fixed; bottom-right`. All `setStatus(msg)` calls in App.jsx are re-routed through a local shim that calls `addToast(msg, type)` with auto-detected type — this means **zero changes to existing call sites**. Three explicit exceptions are handled: loading-start labels (removed), form auth validation errors (suppressed since form shows them inline), and async catch blocks (converted to explicit `"error"` type). The top loading bar stays untouched; button disabled/loading-label states stay untouched.

**Tech Stack:** React 19, CSS custom properties (Lattice design tokens in `styles.css`), no external toast library.

---

## Why toasts over alternatives

| Option | Problem |
|--------|---------|
| **In-button morph** (label → ✓ → revert) | Each of ~30 buttons in separate page components needs individual state wired from the central `runAction` — very invasive for a cosmetic change |
| **Section-right inline** | Works for primary CTAs but breaks for validation errors and feedback that crosses pages (e.g. "Session expired") |
| **Toast (chosen)** | Single implementation; all pages benefit; professional pattern used by Vercel, Linear, Stripe, Figma; non-intrusive; auto-dismisses |

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `frontend/src/components/common/Toast.jsx` | `Toast` item + `ToastList` container |
| Modify | `frontend/src/styles.css` | Toast entrance/exit keyframes |
| Modify | `frontend/src/styles/ui.js` | Toast design tokens |
| Modify | `frontend/src/App.jsx` | Toast state, `addToast`, `setStatus` shim, header pill removal |

---

## Task 1: Toast component + CSS animations

**Files:**
- Create: `frontend/src/components/common/Toast.jsx`
- Modify: `frontend/src/styles.css` (append at end)
- Modify: `frontend/src/styles/ui.js` (add token entries)

- [ ] **Step 1: Append toast keyframes to `frontend/src/styles.css`**

Add at the very end of the file:

```css
/* ── Toast notifications ───────────────────────────────────────────────── */
@keyframes lat-toast-in {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}
@keyframes lat-toast-out {
  from { opacity: 1; transform: translateY(0)   scale(1); }
  to   { opacity: 0; transform: translateY(4px) scale(0.96); }
}
.lat-toast {
  animation: lat-toast-in 220ms var(--ease-out) both;
}
.lat-toast.is-leaving {
  animation: lat-toast-out 180ms var(--ease-std) both;
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .lat-toast, .lat-toast.is-leaving { animation: none; }
}
```

- [ ] **Step 2: Add toast tokens to `frontend/src/styles/ui.js`**

Inside the `ui` object, add after the `/* misc */` block (before the closing `};`):

```js
  /* toasts */
  toastList:
    "fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-2 max-sm:right-3 max-sm:bottom-3",
  toastBase:
    "lat-toast flex min-w-0 w-[min(320px,calc(100vw-24px))] items-start gap-3 rounded-[8px] border border-[#E8E3D7] bg-[#FBFAF6] px-3.5 py-3 shadow-[0_8px_24px_rgba(14,14,16,0.10)]",
  toastSuccess:
    "border-l-[3px] border-l-[#0E7C4A]",
  toastError:
    "border-l-[3px] border-l-[#A6261A]",
  toastInfo:
    "border-l-[3px] border-l-[#1E3FFF]",
  toastDismiss:
    "ml-auto shrink-0 grid h-5 w-5 place-items-center rounded text-[#A4A4AC] transition-colors hover:text-[#0E0E10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF]",
```

- [ ] **Step 3: Create `frontend/src/components/common/Toast.jsx`**

```jsx
import { useEffect, useRef, useState } from "react";
import { ui } from "../../styles/ui";

const ICONS = {
  success: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
      style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="7" cy="7" r="6.5" stroke="var(--c-success)" strokeWidth="1.2" />
      <path d="M4 7l2.2 2.2L10 4.8" stroke="var(--c-success)"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
      style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="7" cy="7" r="6.5" stroke="var(--c-danger)" strokeWidth="1.2" />
      <path d="M5 5l4 4M9 5L5 9" stroke="var(--c-danger)"
        strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
      style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="7" cy="7" r="6.5" stroke="var(--c-cobalt)" strokeWidth="1.2" />
      <path d="M7 6.5v3.5M7 4v.8" stroke="var(--c-cobalt)"
        strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
};

const TYPE_BORDER = {
  success: ui.toastSuccess,
  error:   ui.toastError,
  info:    ui.toastInfo,
};

export function Toast({ id, message, type = "info", onRemove }) {
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef(null);

  function dismiss() {
    setLeaving(true);
    timerRef.current = setTimeout(() => onRemove(id), 200);
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${ui.toastBase} ${TYPE_BORDER[type] || ui.toastInfo} ${leaving ? "is-leaving" : ""}`}
    >
      {ICONS[type]}
      <span
        className="min-w-0 break-words text-[12px] font-[500] leading-relaxed text-[#3A3A40]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {message}
      </span>
      <button
        type="button"
        aria-label="Dismiss notification"
        className={ui.toastDismiss}
        onClick={dismiss}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export function ToastList({ toasts, onRemove }) {
  if (toasts.length === 0) return null;
  return (
    <div className={ui.toastList} aria-label="Notifications">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onRemove={onRemove} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Verify build passes**

```
cd ai-career-api
npm run build
```

Expected output ends with: `✓ built in ...ms`  
If the build fails with "Cannot find module", check the import path in Toast.jsx: `../../styles/ui`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/common/Toast.jsx frontend/src/styles.css frontend/src/styles/ui.js
git commit -m "feat: add Toast/ToastList component with slide-up animation"
```

---

## Task 2: Wire toast state into App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Add ToastList import**

At the top of `frontend/src/App.jsx`, after the last local component import, add:

```js
import { ToastList } from "./components/common/Toast";
```

- [ ] **Step 2: Add toast state variables**

Find:
```js
const [showLoadingBar, setShowLoadingBar] = useState(false);
```

Add directly below it:

```js
const [toasts, setToasts] = useState([]);
const toastTimersRef = useRef({});
```

(`useRef` is already imported at the top of this file.)

- [ ] **Step 3: Add `addToast` and `removeToast` helpers**

Find the line `const applicationStatuses = [...]`. Add the two helpers directly **above** it:

```js
function addToast(message, type = "info") {
  if (!message) return;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
  const duration = type === "error" ? 5000 : 3000;
  toastTimersRef.current[id] = setTimeout(() => removeToast(id), duration);
}

function removeToast(id) {
  clearTimeout(toastTimersRef.current[id]);
  delete toastTimersRef.current[id];
  setToasts((prev) => prev.filter((t) => t.id !== id));
}
```

Note: `addToast` keeps at most 4 toasts visible at once (`.slice(-3)` keeps the last 3, then appends the new one). Error toasts auto-dismiss after 5 s; success/info after 3 s.

- [ ] **Step 4: Replace the `status` state with a `setStatus` shim**

Find and **delete** this line:

```js
const [status, setStatus] = useState("System ready");
```

In its place, add the shim function:

```js
function setStatus(message) {
  if (!message || message === "System ready") return;
  const lower = message.toLowerCase();
  const isBlank = lower.startsWith("no ") || lower.includes("no jobs");
  const isError = !isBlank &&
    /select|choose|couldn't|could not|failed|invalid|not found|expired|cannot|rejected|load jobs|fill in|error/i
      .test(lower);
  const isSuccess = !isError && !isBlank &&
    /ready|created|updated|deleted|saved|tracked|loaded|imported|ranked|signed|calculated|complete|found/i
      .test(lower);
  addToast(message, isError ? "error" : isSuccess ? "success" : "info");
}
```

Type detection logic (verify these cover all real messages):
- `"No skill gaps found"` → starts with "no " → **info** ✓
- `"Select a CV first"` → matches `select` → **error** ✓
- `"CV updated"` → matches `updated` → **success** ✓
- `"Match ready"` → matches `ready` → **success** ✓
- `"Session expired. Please sign in again."` → matches `expired` → **error** ✓
- `"Could not load jobs: ..."` → matches `could not` → **error** ✓
- `"5 jobs loaded"` → matches `loaded` → **success** ✓ (acceptable as a success-ish confirmation)

- [ ] **Step 5: Update `runAction` — remove loading label, use explicit error type**

Find the current `runAction` function:

```js
async function runAction(label, action) {
  try {
    setPendingAction(label);
    setStatus(label);
    const result = await action();
    return result ?? true;
  } catch (error) {
    if (error.status === 401) return false; // handler already fired via setUnauthorizedHandler
    setStatus(error.message);
    return false;
  } finally {
    setPendingAction("");
  }
}
```

Replace it with:

```js
async function runAction(label, action) {
  try {
    setPendingAction(label);
    const result = await action();
    return result ?? true;
  } catch (error) {
    if (error.status === 401) return false;
    addToast(error.message, "error");
    return false;
  } finally {
    setPendingAction("");
  }
}
```

Changes: `setStatus(label)` removed (the loading bar handles "something is happening"); `setStatus(error.message)` replaced with explicit `addToast(..., "error")` so API errors always show red regardless of their wording.

- [ ] **Step 6: Suppress redundant `setStatus` calls in `submitAuth`**

In the `submitAuth` function, find these three lines and **delete** them (the form already displays these errors inline via `authErrors`; toasting them too would be redundant):

```js
// Line ~388 — DELETE:
setStatus(firstError(nextErrors));

// Line ~410 — DELETE:
setStatus(firstError(error.errors));

// Line ~416 — DELETE:
setStatus(firstError(inferredErrors));
```

Also find and **delete** the loading label (line ~399):
```js
// DELETE:
setStatus(currentAuthMode === "login" ? "Signing in" : "Creating account");
```

The success confirmation stays — it already routes through the shim:
```js
setStatus(currentAuthMode === "login" ? "Signed in" : "Account created");
// → shim detects "signed" → success toast ✓
```

- [ ] **Step 7: Verify build passes**

```
npm run build
```

Expected: `✓ built in ...ms`

If you see `'status' is not defined` or `'setStatus' is not defined` — make sure Step 4 completed; the shim must be declared inside the `App()` function body (same scope as `addToast`).

- [ ] **Step 8: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: add toast state and setStatus shim in App.jsx"
```

---

## Task 3: Remove header status pill + clean up dead derived state

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/styles/ui.js`

- [ ] **Step 1: Delete `statusType` and `statusLabel` derived state**

In App.jsx, find and **delete** both `useMemo` blocks:

```js
const statusType = useMemo(() => {
  if (pendingAction) return "loading";
  if (!status || status === "System ready") return "idle";
  const lower = status.toLowerCase();
  const errorWords = ["error", "failed", "invalid", "not found", "expired", "couldn't", "cannot", "rejected", "could not", "database is not"];
  if (errorWords.some((w) => lower.includes(w))) return "error";
  return "success";
}, [status, pendingAction]);

const statusLabel = useMemo(() => {
  if (!status) return "System ready";
  if (status.includes("OPENAI_API_KEY")) {
    return status.toLowerCase().includes("cv draft") ? "CV draft ready" : "AI fallback active";
  }
  return status;
}, [status]);
```

Delete both. (`selectedCv`, `bestJobId`, `topScore`, `isBusy` use their own `useMemo`/derived expressions — do not touch those.)

- [ ] **Step 2: Remove the header status pill JSX**

In the main app shell JSX, inside `<div className={ui.headerActions}>`, find and **delete** this entire `<div>`:

```jsx
<div className={`${ui.pulse} ${
  statusType === "error"   ? "border-[var(--c-danger-50)] bg-[var(--c-danger-50)] text-[var(--c-danger)]" :
  statusType === "success" ? "border-[var(--c-success-50)] bg-[var(--c-success-50)] text-[var(--c-success)]" :
  statusType === "loading" ? "border-[var(--c-warning-50)] bg-[var(--c-warning-50)] text-[var(--c-warning)]" :
  ""
}`}>
  <span className={`${ui.pulseDot} ${
    statusType === "error"   ? "bg-[var(--c-danger)] animate-pulse" :
    statusType === "success" ? "bg-[var(--c-success)]" :
    statusType === "loading" ? "bg-[var(--c-warning)] animate-pulse" :
    "bg-[#A4A4AC]"
  }`} />
  <span className="min-w-0 truncate">{statusLabel}</span>
</div>
```

After deletion, `<div className={ui.headerActions}>` should contain only the account avatar button.

- [ ] **Step 3: Render `ToastList` in the authenticated shell**

Find the loading bar block:

```jsx
{showLoadingBar && (
  <div aria-hidden="true" className="lat-loading-bar-track">
    <div className="lat-loading-bar-fill" />
  </div>
)}
```

Add `<ToastList>` immediately after it:

```jsx
{showLoadingBar && (
  <div aria-hidden="true" className="lat-loading-bar-track">
    <div className="lat-loading-bar-fill" />
  </div>
)}

<ToastList toasts={toasts} onRemove={removeToast} />
```

- [ ] **Step 4: Remove unused `pulse` and `pulseDot` tokens from `ui.js`**

In `frontend/src/styles/ui.js`, find and **delete** these two entries from the `ui` object:

```js
pulse:
  "inline-flex min-h-[34px] max-w-[min(320px,100%)] min-w-0 overflow-hidden items-center gap-2 rounded-[8px] border border-[#E8E3D7] bg-[#FBFAF6] px-3 text-[11px] font-[500] text-[#6B6B72] font-mono uppercase tracking-[0.04em]",
pulseDot:
  "h-[6px] w-[6px] shrink-0 rounded-full bg-[#0E7C4A]",
```

- [ ] **Step 5: Final build check**

```
npm run build
```

Expected: `✓ built in ...ms` with no new errors. If you see `ui.pulse is undefined` somewhere in the codebase, grep for `ui.pulse` and remove any remaining usage.

- [ ] **Step 6: Manual browser test**

Start the dev server:
```
npm run server    # terminal 1 — backend on :5001
npm run dev       # terminal 2 — frontend on :5173
```

Open `http://localhost:5173` and verify:

- [ ] Header no longer contains the status pill — only hamburger, page title eyebrow, and the avatar button
- [ ] Sync Jobs button → loading bar appears after ~2 s → toast "X jobs loaded" appears bottom-right with green left border, dismisses after 3 s
- [ ] Run match with no selections → red error toast "Select a CV and a job first" appears, stays 5 s
- [ ] Run match with valid selections → loading bar → green toast "Match ready"
- [ ] Login with wrong password → **no toast** (error shows inline in form via `authErrors`)
- [ ] Login with correct credentials → green toast "Signed in"
- [ ] Click × on a toast → it fades out immediately
- [ ] Trigger 5 rapid actions → only the 4 most recent toasts are shown at once
- [ ] On mobile (≤640 px) → toasts appear `bottom: 12px; right: 12px` and fit within the viewport

- [ ] **Step 7: Commit**

```bash
git add frontend/src/App.jsx frontend/src/styles/ui.js
git commit -m "feat: remove header status pill, wire ToastList, clean up dead state"
```

---

## Self-Review

### 1. Spec coverage

| Requirement | Task · Step |
|-------------|-------------|
| Remove the pill to the left of the avatar | Task 3, Step 2 |
| Feedback after button click (action result) | Task 2, Steps 3–5 (addToast called on success/error) |
| Feedback auto-dismisses after timeout | Task 2, Step 3 (setTimeout in addToast, 3 s / 5 s) |
| Error feedback stays longer | Task 2, Step 3 (error: 5000 ms, others: 3000 ms) |
| Manual dismiss | Task 1, Step 3 (× button in Toast.jsx) |
| Professional industry pattern | Design decision section (toast = Vercel/Linear/Stripe/Figma) |
| Bottom-right positioning | Task 1, Step 2 (`fixed bottom-5 right-5`) |
| Mobile responsive | Task 1, Step 2 (`max-sm:right-3 max-sm:bottom-3`) |
| Entrance/exit animation | Task 1, Steps 1 & 3 (keyframes + `.is-leaving` class) |
| Reduced motion support | Task 1, Step 1 (`prefers-reduced-motion` block) |
| No redundant form toasts | Task 2, Step 6 (setStatus removed from auth inline-error paths) |

### 2. Placeholder scan

No TBD / TODO / "handle edge cases" / "similar to" patterns found. All steps contain exact code.

### 3. Type consistency

- `addToast(message: string, type: "info" | "error" | "success")` — defined Task 2 Step 3, called in Task 2 Steps 4 & 5
- `removeToast(id: string)` — defined Task 2 Step 3, used in Task 3 Step 3 as `onRemove={removeToast}`
- `Toast({ id, message, type, onRemove })` — defined Task 1 Step 3; `ToastList` passes `{...t}` (which spreads `id`, `message`, `type`) plus explicit `onRemove={onRemove}` — consistent
- `toasts` array shape `{ id: string, message: string, type: string }` — consistent across all tasks
- `ui.toastList`, `ui.toastBase`, `ui.toastSuccess`, `ui.toastError`, `ui.toastInfo`, `ui.toastDismiss` — all added in Task 1 Step 2, consumed in Task 1 Step 3
