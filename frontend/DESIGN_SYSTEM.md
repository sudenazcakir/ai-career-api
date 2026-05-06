# Lattice — Career OS Design System

This document is the single source of truth for the frontend visual language of this project.
Every new page, component, or UI change should follow these rules.

The implementation files are:
- [`src/styles.css`](src/styles.css) — CSS custom properties, font imports, global reset, utility classes
- [`src/styles/ui.js`](src/styles/ui.js) — Tailwind utility string tokens, score/status helpers

---

## Table of contents

1. [Design philosophy](#1-design-philosophy)
2. [Color system](#2-color-system)
3. [Typography](#3-typography)
4. [Layout rules](#4-layout-rules)
5. [Component patterns](#5-component-patterns)
6. [Page-specific guidelines](#6-page-specific-guidelines)
7. [Do / Don't rules](#7-do--dont-rules)
8. [How to add a new page or component](#8-how-to-add-a-new-page-or-component)
9. [Code examples](#9-code-examples)

---

## 1. Design philosophy

**Lattice.** A career is built one cell at a time — small skills that cross into bigger structures.

The visual language is calm, editorial, and data-focused. It is designed to feel like a well-made
software tool, not a marketing landing page. The key words are:

- **Editorial** — clear typographic hierarchy, generous whitespace, information presented with care
- **Calm** — warm-neutral surfaces, a single accent colour, no visual noise
- **Data-first** — numbers, scores, and skill names are the heroes; decoration is secondary
- **Professional but not cold** — Instrument Serif headlines add character without being playful

### What the Lattice look is not

- No teal-to-slate gradients (the old design)
- No stock photography backgrounds
- No `bg-teal-700` or `text-teal-*` classes anywhere in new code
- No purple-blue AI aesthetics (sparkles, glows, "AI shimmer" animations)
- No over-rounded cards (`rounded-3xl`, `rounded-full` on cards)
- No heavy drop shadows on static cards

### Concept summary

```
Ink + Bone surfaces   →  calm, warm, readable
Cobalt (one per view) →  clear primary action
Citron               →  only for wins / high scores
Plum                 →  only for gaps / growth areas
Hairline borders     →  structure without weight
```

---

## 2. Color system

All tokens are defined as CSS custom properties in `src/styles.css` and referenced inline as
hex values inside `src/styles/ui.js`.

### 2.1 Base palette

| Token | Hex | Role |
|---|---|---|
| `--c-ink` | `#0E0E10` | Primary text, headlines, primary button background |
| `--c-graphite` | `#3A3A40` | Body text, secondary nav items, ghost button text |
| `--c-slate` | `#6B6B72` | Metadata, muted labels, eyebrow/mono text |
| `--c-mist` | `#A4A4AC` | Disabled states, input borders, decorative numerals |
| `--c-bone` | `#F6F3EC` | Page background, hero section background |
| `--c-paper` | `#FBFAF6` | Card/panel background, sidebar background, inputs |
| `--c-chalk` | `#FFFFFF` | Modal sheets; use sparingly |
| `--c-hairline` | `#E8E3D7` | All borders — cards, dividers, inputs, nav separators |

**Bone vs Paper:** Bone is the page background. Paper sits on top of Bone (cards, sidebar, inputs).
This one-level elevation is all the depth the system needs.

### 2.2 Accent palette

| Token | Hex | Use |
|---|---|---|
| `--c-cobalt` | `#1E3FFF` | Primary CTA (`buttonCobalt`), active nav item, focus rings, Cobalt bar fill |
| `--c-cobalt-h` | `#1A37E0` | Cobalt hover state |
| `--c-cobalt-50` | `#E6EBFF` | Active nav background, mid-score pill background, Cobalt chip background |
| `--c-citron` | `#D7E25C` | High match scores (≥ 75%), "Accepted" application highlight |
| `--c-citron-50` | `#F4F7D6` | Citron surface (rarely needed) |
| `--c-plum` | `#5B2A86` | Missing skill chips, "Rejected" status, skill-gap tags |
| `--c-plum-50` | `#EFE5F8` | Plum surface — chip backgrounds, rejected status background |

**Critical usage rules:**

- **Cobalt is precious.** Use it for at most one primary element per visible viewport:
  the primary CTA button, the active nav item, or a focus ring. Never all three at once.
- **Citron means win.** Score ≥ 75 only. Never used decoratively.
- **Plum means gap.** Missing skills, rejected outcomes, growth areas only.
- **Never add a new accent colour.** Cobalt, Citron, and Plum are the only chromatic moves.

### 2.3 Semantic palette

| Token | Text hex | Surface hex | Use |
|---|---|---|---|
| `--c-success` | `#0E7C4A` | `--c-success-50` `#E5F4EC` | Accepted, completed, matched skills |
| `--c-warning` | `#9A6712` | `--c-warning-50` `#FBF1DA` | Pending, under review, partial matches |
| `--c-danger` | `#A6261A` | `--c-danger-50` `#FBE8E5` | Errors, rejected, field validation errors |

### 2.4 Where to use each color — quick reference

```
Page background           → Bone   (#F6F3EC)
Card / panel background   → Paper  (#FBFAF6)
All borders               → Hairline (#E8E3D7)
Primary text / headlines  → Ink    (#0E0E10)
Body / secondary text     → Graphite (#3A3A40)
Labels / metadata         → Slate  (#6B6B72)
Disabled / decorative     → Mist   (#A4A4AC)
Primary action button     → Ink bg  (ui.button) or Cobalt bg (ui.buttonCobalt)
Active nav, focus ring    → Cobalt (#1E3FFF)
High score ≥ 75%          → Citron (#D7E25C)
Missing skill / gap tag   → Plum   (#5B2A86)
Matched skill chip        → Success-50 bg / Success text
Partial skill chip        → Amber-16 bg / amber text
Field errors              → Danger (#A6261A)
```

---

## 3. Typography

Fonts are loaded from Google Fonts CDN in `src/styles.css`. The three families together cover
every surface in the product.

### 3.1 Font families

| Family | CSS token | Use |
|---|---|---|
| **Geist** | `--font-sans` | All UI text — navigation, buttons, body, forms, labels |
| **Instrument Serif** | `--font-display` | Editorial display headlines on hero sections and page openers |
| **Geist Mono** | `--font-mono` | Eyebrows, data labels, chips, score numbers, API count badges |

**Fallbacks:** Geist → `ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif`.
Instrument Serif → `Source Serif 4, Georgia, serif`. Geist Mono → `ui-monospace, JetBrains Mono, Menlo`.

### 3.2 Scale and usage

| Name | Family | Size | Weight | Usage |
|---|---|---|---|---|
| Display (hero) | Instrument Serif | `clamp(28px, 3.5vw, 46px)` | 400 italic ok | Hero section H1/H2 — one per page |
| Page title (topbar) | Geist Sans | `28px` | 600 | Topbar `h1` driven by page label |
| Card heading | Geist Sans | `18px` | 600, tracking `-0.005em` | Section H2 inside cards |
| Sub-heading | Geist Sans | `17px` | 600, tracking `-0.01em` | Milestone titles, sub-sections |
| Body | Geist Sans | `15px` | 400, line-height `1.55` | All running text |
| Secondary / muted | Geist Sans | `13px` | 400 | Metadata, descriptions — `ui.muted` |
| Small label | Geist Sans | `13px` | 400 | Form content labels |
| Form field label | Geist Mono | `10px` | 500, UPPERCASE, tracking `0.05em` | Above every `<input>` — `ui.label` |
| Eyebrow | Geist Mono | `11px` | 500, UPPERCASE, tracking `0.08em` | Section kickers above headings — `ui.eyebrow` |
| Metric label | Geist Mono | `10px` | 500, UPPERCASE, tracking `0.08em` | Above metric values — `ui.metricLabel` |
| Metric value | Geist Sans | `32px` | 600, tracking `-0.015em` | Large number display — `ui.metricValue` |
| Chip / tag | Geist Mono | `11px` | 400 | All skill chips and status tags |
| Count badge | Geist Mono | `12px` | 500 | Item counts — `ui.count` |

### 3.3 Casing rules

| Surface | Rule | Example |
|---|---|---|
| Page titles, H1/H2/H3 | Sentence case | `Top recommendations` |
| Eyebrows / kickers | UPPERCASE | `GROWTH · SKILL MAP` |
| Buttons | Sentence case | `Import jobs`, not `Import Jobs` |
| Form field labels | UPPERCASE (via `ui.label` Mono class) | `EMAIL ADDRESS` |
| Chips/tags | lowercase | `docker`, `kubernetes` |
| Status pills | Title Case | `Under Review`, `Saved for Later` |

### 3.4 Applying Instrument Serif in JSX

Use inline `style` for display headlines — it is not in Tailwind:

```jsx
<h2 style={{
  fontFamily: "var(--font-display)",
  fontSize: "clamp(28px, 3.5vw, 46px)",
  fontWeight: 400,
  lineHeight: 1.02,
  letterSpacing: "-0.02em",
  color: "var(--c-ink)",
  marginTop: 8,
}}>
  Your learning <em style={{ fontStyle: "italic" }}>roadmap.</em>
</h2>
```

Italic via `<em style={{ fontStyle: "italic" }}>` is encouraged for editorial accent.

---

## 4. Layout rules

### 4.1 App shell

```
┌─────────────────────────────────────────────────────────┐
│  Sidebar  │              Main workspace                  │
│  232 px   │  max-width 1200px, 28px gutters              │
│  Paper bg │  Bone bg                                     │
│  fixed    │  scrollable                                  │
└─────────────────────────────────────────────────────────┘
```

- Sidebar: `232px` fixed left, `bg-[#FBFAF6]`, `border-r border-[#E8E3D7]`
- Workspace: `w-[min(1200px,calc(100%-56px))]` centered, `py-6 pb-12`
- On `max-lg` (< 1024px): sidebar becomes a horizontal tab strip at the top
- On `max-sm` (< 640px): workspace width `calc(100%-24px)`, reduced padding

### 4.2 Page grid

Always start a page with one of these grid wrappers:

| Class | Columns | Use |
|---|---|---|
| `ui.pageGrid` | 2-col (1-col on `max-lg`) | Most pages — mixed card sizes |
| `ui.splitPage` | 2-col, items align top | Equal-weight two-panel layouts |
| Plain `grid gap-[18px]` | 1-col (explicit) | Simple stacked pages (Skill Map, Growth Plan) |

**Standard gap between all sections:** `18px` (`gap-[18px]`).

### 4.3 Full-width cards

Add `ui.full` (`col-span-full`) to any card that should span both columns:

```jsx
<section className={`${ui.panel} ${ui.full}`}>
```

Use full-width for:
- Hero sections
- Filter / search forms
- Results lists when the content is wide
- Summary / explanatory cards at the top of a page

### 4.4 Spacing scale

From `--space-*` in `styles.css`:

| Token | px | Tailwind approx |
|---|---|---|
| `--space-1` | 4 | `p-1` |
| `--space-2` | 8 | `p-2` |
| `--space-3` | 12 | `p-3` |
| `--space-4` | 16 | `p-4` |
| `--space-5` | 20 | `p-5` |
| `--space-6` | 24 | `p-6` |
| `--space-8` | 32 | `p-8` |
| `--space-10` | 40 | `p-10` |
| `--space-12` | 48 | `p-12` |

### 4.5 Radius scale

| Token | px | Use |
|---|---|---|
| `--radius-sm` | 4 | Chips, score pills, skill tags |
| `--radius-md` | 8 | Buttons, inputs, small cards, step items |
| `--radius-lg` | 12 | Standard cards/panels (`ui.panel`) |
| `--radius-xl` | 20 | Hero sections, modals, auth split screen |
| `--radius-full` | 999 | Avatars, status indicator dots |

Never use `rounded-3xl`, `rounded-full` on cards.

### 4.6 Responsive breakpoints

| Breakpoint | Tailwind prefix | Behavior |
|---|---|---|
| < 640px | `max-sm:` | Mobile — reduce padding, collapse multi-col to 1 |
| < 1024px | `max-lg:` | Tablet — sidebar becomes top bar, 2-col → 1-col |
| < 1280px | `max-xl:` | Wide tablet — 5-col filter grid becomes 3-col |

All `ui.pageGrid`, `ui.splitPage`, `ui.gridForm`, and `ui.twoFields` already include these breakpoints.
New layouts should follow the same pattern.

---

## 5. Component patterns

### 5.1 Buttons

Four variants, all in `ui.js`. Height is `36px` (`h-9`), radius `8px`, font Geist 13px 500.

| Class | Background | Text | Use |
|---|---|---|---|
| `ui.button` | Ink `#0E0E10` | Bone `#F6F3EC` | Default primary action (save, submit) |
| `ui.buttonCobalt` | Cobalt `#1E3FFF` | White | Main page CTA ("Import jobs", "Analyse now") |
| `ui.buttonSecondary` | Transparent | Ink, Ink border | Secondary / alternative action |
| `ui.buttonGhost` | Transparent | Graphite | Low-priority actions ("Manage", "Explore") |

Rules:
- Use `ui.buttonCobalt` for the single most important CTA on a page. One Cobalt per view.
- Use `ui.button` (Ink) for confirmations and form submits.
- Use `ui.buttonSecondary` for optional / alternative paths.
- Never invent a 5th button style — use one of the above.
- Always pass `disabled={isBusy}` to all buttons that trigger async actions.

### 5.2 Cards / panels

The standard surface is `ui.panel`:

```
rounded-[12px]  border border-[#E8E3D7]  bg-[#FBFAF6]  p-5
```

Always start a new card section with `ui.sectionHead` (flexbox row with title left, action right):

```jsx
<section className={ui.panel}>
  <div className={ui.sectionHead}>
    <div>
      <p className={ui.eyebrow}>Section label</p>
      <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
        Card heading
      </h2>
    </div>
    <button className={ui.buttonGhost}>Action</button>
  </div>
  {/* content */}
</section>
```

Never add `box-shadow` to static cards. Shadow appears only on hover (`hover:shadow-[0_1px_2px...]`).

### 5.3 Hero sections

Hero panels use `ui.heroPanel` — full-width (`col-span-full`), `rounded-[20px]`, Bone bg, `p-10`.
Always add `lat-dot-grid` CSS class and a decorative large numeral:

```jsx
<section className={`${ui.heroPanel} lat-dot-grid`}>
  <span aria-hidden="true" style={{
    position: "absolute", right: 24, bottom: -48,
    fontFamily: "var(--font-display)", fontSize: 200, lineHeight: 1,
    color: "var(--c-mist)", opacity: 0.28,
    letterSpacing: "-0.02em", pointerEvents: "none", userSelect: "none",
  }}>
    {someNumber}
  </span>
  <div className="relative min-w-0">
    <p className={ui.eyebrow}>Section · Page name</p>
    <h2 style={{ fontFamily: "var(--font-display)", /* ... */ }}>
      Headline with <em style={{ fontStyle: "italic" }}>emphasis.</em>
    </h2>
    <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#3A3A40]">
      Supporting sentence.
    </p>
    <div className="mt-5 flex flex-wrap gap-2.5">
      <button className={ui.buttonCobalt}>Primary CTA</button>
      <button className={ui.buttonSecondary}>Secondary CTA</button>
    </div>
  </div>
</section>
```

### 5.4 Metrics strip

A horizontal row of 4 counters, sharing borders (no gaps — borders act as dividers):

```jsx
<div className={`${ui.metrics} col-span-full`}>
  <div className={ui.metric}>
    <span className={ui.metricLabel}>CV profiles</span>
    <strong className={ui.metricValue}>{cvs.length}</strong>
    <span className="text-[12px] text-[#6B6B72]">optional hint</span>
  </div>
  {/* × 4 */}
</div>
```

`ui.metrics` = `grid grid-cols-[repeat(4,1fr)] overflow-hidden rounded-[12px] border border-[#E8E3D7]`
`ui.metric` = `grid min-w-0 gap-2 border-r border-[#E8E3D7] bg-[#FBFAF6] px-5 py-4 last:border-r-0`

On `max-sm`: drops to 2 columns via `max-sm:grid-cols-2`.

### 5.5 Forms and inputs

```jsx
<label className={ui.label}>
  Email address
  <input
    className={ui.input}
    type="text"
    placeholder="name@example.com"
  />
  <FieldError message={errors.email} />
</label>
```

- `ui.label` → Geist Mono, 10px, UPPERCASE, Slate, gap `1.5`
- `ui.input` → height `36px`, Paper bg, Mist border, focus `border-Ink + shadow-ring`
- `ui.formStack` → `grid gap-3.5` for vertical stacks
- `ui.twoFields` → 2-col grid that collapses to 1-col on `max-lg`
- `ui.gridForm` → 5-col filter row (collapses progressively)

Never use bare `border-teal-*` or `focus:ring-teal-*` on inputs.

### 5.6 Chips and skill tags

Four semantic variants — always use the correct one:

| Class | Background | Text | Use |
|---|---|---|---|
| `ui.chip` | Bone + Hairline border | Graphite | Neutral skill, general tag |
| `ui.chipMatched` | Success-50 `#E5F4EC` | Success `#0E7C4A` | Skill matched between CV and job |
| `ui.chipMissing` | Plum-50 `#EFE5F8` | Plum `#5B2A86` | Missing skill / gap area |
| `ui.chipPartial` | Amber-16 | Amber `#6b5a07` | Partially matching skill |

All chips: `rounded-[4px]`, Geist Mono 11px, `px-2 py-0.5`. Wrap with `ui.chips` (`flex flex-wrap gap-1`).

### 5.7 Score badges

Always use the `getScoreClass(value)` helper from `ui.js`:

```jsx
import { getScoreClass } from "../styles/ui";

<strong className={getScoreClass(job.matchScore)}>
  {job.matchScore}%
</strong>
```

| Score | Background | Text |
|---|---|---|
| ≥ 75 | Citron `#D7E25C` | Ink |
| 50–74 | Cobalt-50 `#E6EBFF` | Cobalt |
| < 50 | Bone + Hairline border | Slate |

### 5.8 Status pills (applications)

Use `getStatusClass(status)` from `ui.js` for application pipeline items:

```jsx
import { getStatusClass } from "../styles/ui";

<span className={getStatusClass(application.status)}>
  {application.status}
</span>
```

| Status | Background | Text |
|---|---|---|
| Saved for Later | Bone + border | Graphite |
| Under Review | Cobalt-50 | Cobalt |
| Accepted | Success-50 | Success |
| Rejected | Plum-50 | Plum |

### 5.9 Empty states

The `Empty` component from `DataViews.jsx` renders a dashed-border centered message:

```jsx
import { Empty } from "../components/common/DataViews";

// Default message:
<Empty />

// Custom message:
<Empty msg="No skill gaps found — your CV covers all job requirements." />
```

Rules for empty states:
- Always explain what is missing AND what the user should do next.
- Never leave a section blank — always render `<Empty msg="..." />`.
- For page-level empty states (nothing loaded at all), add a CTA button below the message.

### 5.10 Job cards

Rendered by `DataViews.jsx → JobCard`. Layout: 2-col grid (content left, score pill right).

Structure:
- Title + company (Graphite) on one line
- Explanation sentence in Graphite 13px if present
- Skill chips row: matched (green) → partial (amber) → missing (Plum)
- Match bars: 3 slim 4px tracks — Ink for Skill, Cobalt for Experience, Slate for Role
- Score pill top-right via `getScoreClass()`

Wrap the list in `<JobList items={...} />` from `DataViews.jsx` — it handles the empty state automatically.

### 5.11 Navigation sidebar

```jsx
// Active state — add ui.navButtonActive to the existing ui.navButton class:
<NavLink
  className={({ isActive }) =>
    `${ui.navButton} ${isActive ? ui.navButtonActive : ""}`
  }
  to={page.path}
>
  {({ isActive }) => (
    <>
      {isActive && (
        <span style={{
          position: "absolute", left: -14, top: 6, bottom: 6,
          width: 2, background: "var(--c-ink)", borderRadius: 1,
        }} />
      )}
      {page.label}
    </>
  )}
</NavLink>
```

- Active: `bg-[#E6EBFF] text-[#1E3FFF]` + 2px Ink left bar (inline style — not in Tailwind)
- Hover: `bg-[#F6F3EC]` (Bone)
- Section labels: Geist Mono 10px UPPERCASE Slate, `mb-1.5` below

### 5.12 Modals

```jsx
<div className={ui.modalBackdrop} role="presentation">
  <section aria-modal="true" className={ui.modalWindow} role="dialog">
    <div className={ui.modalHead}>
      <div>
        <p className={ui.eyebrow}>Context label</p>
        <h2 className="text-[18px] font-semibold ...">Modal title</h2>
      </div>
      <button className={ui.buttonGhost} onClick={onClose}>Close</button>
    </div>
    {/* content */}
  </section>
</div>
```

Backdrop: `bg-[rgba(14,14,16,0.45)] backdrop-blur-[8px]`.
Window: `rounded-[20px]`, Paper bg, `--shadow-lg`.

---

## 6. Page-specific guidelines

### AuthPage
- Split layout: dotted-grid Bone left panel (55%) + Paper right panel (45%)
- Left: brand mark, Instrument Serif headline (italic emphasis), 01/02/03 trio cards, big Mist numeral watermark
- Right: `rounded-[20px]` form area, Ink/Bone toggle pair (Sign in / Sign up), Lattice inputs
- No dark backgrounds, no gradients, no photos
- On `max-lg`: left panel hidden, right panel full-width

### OverviewPage (Dashboard)
- Starts with `ui.heroPanel` + `lat-dot-grid` — dotted Bone background, Instrument Serif headline
- Followed immediately by `ui.metrics` strip (4 counters)
- Then 2-col `ui.pageGrid` — Selected CV card left, Top Recommendations right
- Decorative numeral = current `topScore` value

### JobsPage
- Full-width filter card at top (`ui.panel + ui.full`) with `ui.gridForm`
- Full-width results card below with `<JobList />`
- CTA pair: `ui.buttonSecondary` for Import, `ui.buttonCobalt` for Recommend

### CvPage
- `ui.splitPage` — form left, CV library right
- Active CV in library: `ui.profileButtonActive` (2px Ink border)
- Versioning section spans full width below

### InsightsPage
- Starts with full-width lab form card
- Followed by 2-col grid: match explanation left, roadmap right
- Success score section spans full width
- Analytics cards in 2-col split below

### AccountPage
- `ui.accountHero` card at top: avatar (Ink circle, Bone initials) + name/email + Sign out
- 3-col `ui.cardGrid` summary below (Phone, Target role, Skills)
- CareerMatrixPanel below that
- Personal details form card
- Career Passport preview card (4-col `ui.passportPreview`) with modal editor

### PassportOnboarding
- Full-page layout (no sidebar — displayed before the authenticated shell)
- Bone + `lat-dot-grid` hero header, Instrument Serif welcome headline, decorative `01` numeral
- `PassportForm` below — multi-section grid form

### Skill Map (`/skill-gaps`)
- `ui.heroPanel + lat-dot-grid` header with gap count as decorative numeral
- `ui.metrics` strip: jobs analysed / gaps found / top gap / top category
- Frequency bars: Geist Mono rank, category-colored fill (Cobalt/Plum/Success), count right-aligned
- 3-col category breakdown: Technical (Cobalt chip), Tools (Plum chip), Domain (Success chip)
- Directed empty states (no CV / no jobs / both missing)

### Growth Plan (`/roadmap`)
- `ui.heroPanel + lat-dot-grid` header, Instrument Serif headline
- Milestone cards: Cobalt step circle, Geist Mono timeline badge (e.g. `WEEK 1–2`), Plum frequency badge
- Learning steps: Bone bg, Hairline border, Geist Mono step number
- AI roadmap section: Cobalt left-border items with zero-padded step numbers (`01`, `02`, …)
- Empty state: two directed CTAs (back to Skill Map + Analyse gaps)

### Application Tracker (`/applications`)
- `ui.panel` header with eyebrow + sentence-case headline + `ui.buttonCobalt` CTA
- `ui.metrics` strip: Total / Under Review / Accepted / Saved
- Kanban: 4 columns (collapses to 2 on `max-xl`, 1 on `max-sm`), each Paper bg + Hairline border
- Column header: colored dot + Geist Mono status label + item count
- Application card: Bone bg, skill chips, `ui.input` Move-to select
- Similar roles section below the board

### Market Signals (`/trends`)
- `ui.heroPanel + lat-dot-grid` header, Instrument Serif headline, `ui.buttonCobalt` Analyse CTA
- `ui.metrics` strip: Applications / Jobs in DB / Recommendations / Accepted
- `ui.splitPage` below: missing skill frequency (left) + application pipeline (right)
- Frequency bars: Cobalt fill, Geist Mono rank numbers
- Pipeline bars: Cobalt (review) / Success (accepted) / Plum (rejected) / Slate (saved)
- 3-col market signal cards at bottom — dashed Hairline border, guided empty state when no data

---

## 7. Do / Don't rules

### Do

- **Do use `ui.js` tokens first.** Before writing any Tailwind class, check if a token already
  exists in `ui.js`. If it fits, use it. If you need a minor variation, add a new key to `ui.js`
  rather than writing a one-off inline class.

- **Do use `getScoreClass(value)` for all match scores.**
  It handles the Citron/Cobalt-50/Bone threshold logic consistently.

- **Do use `getStatusClass(status)` for all application statuses.**
  It maps the four strings to the correct Plum/Cobalt/Success/Slate surfaces.

- **Do use `<Empty msg="..." />` for every empty state.**
  Never leave a section blank. Always tell the user what to do next.

- **Do keep all text in `min-w-0` containers with `break-words` or `truncate`.**
  Job titles and skill names can be very long.

- **Do add `lat-dot-grid` CSS class to all hero/header sections.**
  It makes them visually consistent across pages.

- **Do always test with `npm run build` before declaring a page done.**
  The Vite build catches import errors and will fail if something is broken.

- **Do use Instrument Serif for hero headlines via inline `style`.**
  The font is available as `var(--font-display)`.

- **Do keep Cobalt to one element per viewport.**
  If you have a Cobalt button, the active nav item should not also be Cobalt on that view.

- **Do make every new page responsive.**
  Add `max-lg:` and `max-sm:` breakpoints for grids and padding.

### Don't

- **Don't use any `teal-*` Tailwind classes.** `bg-teal-700`, `text-teal-600`, `border-teal-200` —
  all of these are the old design and must not appear in new code.

- **Don't use Unsplash or any photographic backgrounds.**
  Replace with `lat-dot-grid` + Bone background.

- **Don't add a new accent colour.**
  Cobalt, Citron, and Plum are the complete chromatic set. If you think you need something else,
  use a semantic token (Success / Warning / Danger) or ask.

- **Don't use heavy shadows on static cards.**
  `box-shadow` appears only on hover (`hover:shadow-[...]`) or on floating elements (modals, dropdowns).

- **Don't hardcode one-off hex values in page components.**
  If you need a color not already in `ui.js`, add it to `styles.css` as a CSS variable and reference
  it with `var(--c-name)` inline.

- **Don't install new packages for styling.**
  Tailwind + the three Google Fonts cover everything needed. No CSS-in-JS, no icon packs beyond
  the existing `react-icons/fi`.

- **Don't use `rounded-3xl`, `rounded-full` on card shapes.**
  Cards are `rounded-[12px]` (12px). Hero panels are `rounded-[20px]`. Pills/avatars are `rounded-full`.

- **Don't write headings as `text-2xl font-black`.**
  The old weight was `font-black` (900). The Lattice weight is `font-semibold` (600). Use:
  ```
  text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]
  ```

- **Don't skip the eyebrow on new sections.**
  Every card heading should be preceded by a Geist Mono eyebrow (`ui.eyebrow`) that gives context.

- **Don't add emoji to any UI text.**
  Not in buttons, not in empty states, not in tooltips. The design uses typography for expression.

- **Don't use exclamation marks in copy.**
  The voice is calm and direct. `"CV saved."` — not `"CV saved! 🎉"`.

---

## 8. How to add a new page or component

### New page checklist

1. **Create the file** in `frontend/src/pages/NewPage.jsx`.

2. **Add the route** in `frontend/src/constants/appData.js`:
   ```js
   { id: "newpage", label: "Page Name", section: "workspace", path: "/new-path" },
   ```
   Then add the `<Route>` in `App.jsx`.

3. **Start with the hero header.** Use `ui.heroPanel + lat-dot-grid` with
   an Instrument Serif headline and a decorative numeral.

4. **Add a metrics strip** if the page has countable data. Use `ui.metrics` with 4 `ui.metric` cells.

5. **Choose a grid layout.** Use `ui.pageGrid` (2-col) or `grid gap-[18px]` (1-col stacked).

6. **Use `ui.panel` for every section card.** Start each with `ui.sectionHead` (eyebrow + h2 + optional action).

7. **Handle empty states.** Every data section must render `<Empty msg="..." />` when there is no data.

8. **Check responsiveness.** Resize to < 1024px and < 640px. Fix any overflow or layout breaks.

9. **Run the build:**
   ```bash
   npm run build
   ```

10. **Start the dev server and visually inspect:**
    ```bash
    npm run client
    ```

### New component checklist

1. Place shared components in `frontend/src/components/common/`.
2. Import `{ ui }` from `../../styles/ui` and use existing tokens.
3. If a new token is needed, add it to `ui.js` — not inline in the component.
4. Never import Tailwind classes as strings inside component logic. Keep styling in `ui.js`.
5. Export the component as a named export, not default.

### Extending `ui.js`

When a new pattern is needed that doesn't fit an existing token:

```js
// In ui.js — add to the relevant group:
timelineBadge:
  "inline-flex items-center rounded-[4px] bg-[#E6EBFF] px-2 py-0.5 text-[10px] font-medium text-[#1E3FFF]",
```

Keep naming consistent: `nounVariant` (e.g. `chipMissing`, `scoreHigh`, `statusReview`).

---

## 9. Code examples

### Page header (hero)

```jsx
import { ui } from "../styles/ui";

<section className={`${ui.heroPanel} lat-dot-grid`}>
  {/* Decorative numeral — replace 42 with a live data point */}
  <span aria-hidden="true" style={{
    position: "absolute", right: 24, bottom: -48,
    fontFamily: "var(--font-display)", fontSize: 200, lineHeight: 1,
    color: "var(--c-mist)", opacity: 0.28,
    letterSpacing: "-0.02em", pointerEvents: "none", userSelect: "none",
  }}>
    42
  </span>

  <div className="relative min-w-0">
    <p className={ui.eyebrow}>Section · Page name</p>
    <h2 style={{
      fontFamily: "var(--font-display)",
      fontSize: "clamp(28px, 3.5vw, 46px)",
      fontWeight: 400, lineHeight: 1.02,
      letterSpacing: "-0.02em", color: "var(--c-ink)",
      maxWidth: 560, marginTop: 8,
    }}>
      Headline with <em style={{ fontStyle: "italic" }}>editorial accent.</em>
    </h2>
    <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#3A3A40]">
      One or two supporting sentences. Direct. No exclamation marks.
    </p>
    <div className="mt-5 flex flex-wrap gap-2.5">
      <button className={ui.buttonCobalt}>Primary CTA</button>
      <button className={ui.buttonSecondary}>Secondary CTA</button>
    </div>
  </div>
</section>
```

### Standard card

```jsx
<section className={ui.panel}>
  <div className={ui.sectionHead}>
    <div>
      <p className={ui.eyebrow}>Category · Context</p>
      <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
        Card heading
      </h2>
    </div>
    <button className={ui.buttonGhost}>Action</button>
  </div>

  {/* card body */}
  <p className={ui.muted}>Supporting description text.</p>
</section>
```

### Metric card (inside metrics strip)

```jsx
<div className={`${ui.metrics} col-span-full`}>
  {[
    { label: "CV profiles",   value: cvs.length,           hint: "active" },
    { label: "Jobs loaded",   value: jobs.length,           hint: "from Adzuna" },
    { label: "Matches",       value: recommendations.length, hint: "score ≥ 60%" },
    { label: "Top score",     value: `${topScore}%`,        hint: "best match" },
  ].map(({ label, value, hint }) => (
    <div key={label} className={ui.metric}>
      <span className={ui.metricLabel}>{label}</span>
      <strong className={ui.metricValue}>{value}</strong>
      {hint && <span className="text-[12px] text-[#6B6B72]">{hint}</span>}
    </div>
  ))}
</div>
```

### Primary button

```jsx
// Ink (default primary):
<button className={ui.button} disabled={isBusy} type="submit">
  Save CV
</button>

// Cobalt (page CTA — one per view):
<button className={ui.buttonCobalt} disabled={isBusy} type="button" onClick={fetchJobs}>
  Import jobs
</button>
```

### Empty state

```jsx
import { Empty } from "../components/common/DataViews";

// Simple:
<Empty msg="No jobs yet. Import or filter to populate this list." />

// With CTA:
<section className={ui.panel}>
  <Empty msg="No CV profiles yet. Create one to start matching." />
  <div className="mt-4 flex justify-center">
    <button className={ui.buttonCobalt} type="button" onClick={() => setActivePage("cv")}>
      Create CV
    </button>
  </div>
</section>
```

### Chip / score badge

```jsx
import { getScoreClass, ui } from "../styles/ui";

// Skill chips:
<div className={ui.chips}>
  <span className={ui.chipMatched}>java</span>
  <span className={ui.chipPartial}>spring</span>
  <span className={ui.chipMissing}>kubernetes</span>
  <span className={ui.chip}>git</span>
</div>

// Score badge (threshold-aware):
<strong className={getScoreClass(job.matchScore)}>
  {job.matchScore}%
</strong>
```

### Form field

```jsx
import { ui } from "../styles/ui";
import FieldError from "../components/common/FieldError";

<label className={ui.label}>
  Email address
  <input
    className={ui.input}
    inputMode="email"
    placeholder="name@example.com"
    type="text"
    value={form.email}
    onChange={(e) => setForm({ ...form, email: e.target.value })}
  />
  <FieldError message={errors.email} />
</label>
```

---

*Generated from the implemented source — `styles.css`, `styles/ui.js`, and all page components.*
*Last updated: 2026-05-06.*
