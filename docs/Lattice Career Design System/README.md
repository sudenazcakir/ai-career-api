# Lattice — Career OS Design System

Lattice is a redesign of the **AI Career API** project — an AI-assisted career-matching platform for students and early-career engineers. The original project ships with a teal-and-slate Tailwind aesthetic that reads as "generic SaaS template." Lattice replaces it with a calmer, more editorial system: warm-neutral surfaces, a single signal-cobalt accent, dotted-grid backgrounds, and a typographic voice borrowed from modern publishing (Instrument Serif headlines + Geist Sans UI + Geist Mono data).

The product itself — Career Passport, CV Library, Job Matching, Skill Gaps, Roadmap, Applications Kanban, Analytics, AI Insights — is preserved unchanged. Only the *visual layer* is rebuilt.

---

## Index

| File | What's in it |
| --- | --- |
| `README.md` | This file. Concept, content fundamentals, visual foundations, iconography. |
| `colors_and_type.css` | Design tokens — colors, typography scale, spacing, radii, shadows. Drop-in CSS variables. |
| `SKILL.md` | Agent-skill front-matter for using this system in Claude Code or other agents. |
| `assets/` | Logos, brand marks, icons, illustration placeholders. |
| `fonts/` | Webfont references (Google Fonts CDN — see "Font substitutions" below). |
| `preview/` | Design-system cards rendered to the project's Design System tab. |
| `ui_kits/career-os/` | The product UI kit: components + a clickable `index.html` recreation. |

---

## Source materials this system was built from

This is a redesign — code was the source of truth, not screenshots.

- **Codebase (mounted):** `ai-career-api/`
  - Frontend: `ai-career-api/frontend/src/` — React + Vite + Tailwind v4
  - Backend: `ai-career-api/backend/` — Express + MongoDB + Adzuna jobs API + JWT auth
  - Original styling: `frontend/src/styles/ui.js`, `frontend/src/styles.css`
  - Page set: Dashboard, Jobs, CVs, Skill Gaps, Roadmap, Applications, Trends, AI Insights, Profile, Auth (login/register), Passport Onboarding
- **GitHub:** `sudenazcakir/ai-career-api` (matches the mounted copy)
- **Reference docs:** `ai-career-api/docs/AI-Career-Matching-Project-Summary.docx`, `API_Spec_ve_TechStack.pdf`, `Backend.pdf` — Turkish project-brief PDFs documenting the academic project context. Not yet parsed; values inferred from English copy in the live UI.

The original product's visual DNA: teal `#0F766E` + slate `#0F172A`, Inter font, Tailwind utilities, hero panels with Unsplash photos, rounded-xl cards with light shadows, `react-icons/fi` (Feather) iconography. We kept the **information density** and the **page taxonomy** but redrew everything else.

---

## Brand concept

**Lattice.** A career is built one cell at a time — small skills crossing into bigger structures. The visual metaphor is a quiet grid: dotted backgrounds, hairline rules, tabular data treated with the same care as headlines. Confident, never loud. Editorial, not corporate.

Think *Linear's calm* meets *the FT's typography* meets *a software-as-tool aesthetic.* No purple-blue gradients, no glow effects, no "AI sparkle" iconography.

---

## Content fundamentals

### Voice

Direct, calm, second-person, lowercase-where-natural. The product helps a real person navigate a real career — copy should sound like a thoughtful peer, not a hype merchant.

- **You-voice, not we-voice.** "Your top three gaps" — not "We've identified your top three gaps."
- **Sentence-case** for every UI element including buttons and section headings. *"Import jobs"* not *"Import Jobs"*. The only exceptions: brand name (Lattice), proper nouns, the all-caps eyebrows used as labels.
- **No exclamation points.** No "Awesome!" or "🎉 Great!" The interface respects the user.
- **No emoji.** Anywhere. Not in copy, not in iconography, not as bullets.
- **Numbers are facts, not bragging.** *"31 jobs ranked"* not *"🚀 Crushing it — 31 matches!"*
- **Active verbs for primary actions.** *Import jobs · Rank now · Build roadmap · Track application.* Never *"Click here to..."* or *"Get started"*.
- **Empty states are direct.** *"No CV profiles yet. Create one to start matching."* — say what's missing, say what to do.

### Tone examples (lifted or adapted from the codebase)

- ✅ *"Turn CV skills into ranked career options."* — clear product promise, no hype.
- ✅ *"Move opportunities through your pipeline."* — verb-led, descriptive.
- ✅ *"Generated from your top skill gaps. Each milestone unlocks more jobs."* — explains the *why* in plain language.
- ❌ *"🎯 Unlock your dream career with AI-powered matching!"* — never.

### Casing rules

| Surface | Rule | Example |
| --- | --- | --- |
| Page titles (H1) | Sentence case, period optional | *Application tracker* / *Turn CV skills into ranked career options.* |
| Section headings (H2/H3) | Sentence case | *Top recommendations* |
| Eyebrows / kickers | ALL CAPS, tracked +0.08em, weight 700 | *EXPLAINABILITY LAB* |
| Buttons | Sentence case | *Import jobs*, not *Import Jobs* |
| Status pills / chips | Title Case (these are tags, not sentences) | *Under Review*, *Saved for Later* |
| Data labels (small caps) | UPPERCASE for table headers and metric labels | *MATCH SCORE*, *SKILL GAPS* |
| Body | Sentence case, no Oxford comma when natural | — |

### Microcopy patterns

- **Loading:** present-progressive verbs — *"Ranking recommendations…"*, *"Importing jobs…"*. End with `…` ellipsis (single character `…`, not three dots).
- **Errors:** lead with what happened, then what to do. *"Couldn't reach jobs database. Try again, or check your connection."*
- **Confirmations:** past tense, terse. *"CV saved."* / *"Application moved to Under Review."*
- **Empty states:** noun + action. *"No applications yet. Save a job from the Jobs page."*

---

## Visual foundations

### Color

Three groups: **base**, **accent**, **semantic**.

#### Base (foreground / background)
- **Ink** `#0E0E10` — primary text, headlines.
- **Graphite** `#3A3A40` — secondary text, body.
- **Slate** `#6B6B72` — tertiary text, metadata.
- **Mist** `#A4A4AC` — disabled, hairline icons.
- **Bone** `#F6F3EC` — primary background. Warm cream, not cold gray.
- **Paper** `#FBFAF6` — elevated surfaces (cards on Bone).
- **Chalk** `#FFFFFF` — pure white, used sparingly for inputs and modal sheets.
- **Hairline** `#E8E3D7` — borders. 1px, used everywhere instead of shadows.

#### Accent
- **Cobalt** `#1E3FFF` — primary action, focus rings, links. Saturated, deep blue-with-no-cyan. *Used sparingly* — one Cobalt element per visible region maximum.
- **Cobalt-50** `#E6EBFF` — accent surface (selected nav, focused chip background).
- **Citron** `#D7E25C` — positive highlight, high match-score pills, "now playing" indicator. Yellow-green. Use *only* for celebration / spotlight.
- **Plum** `#5B2A86` — used for skill-gap metadata. Purple-warm. Reserved for "growth area" semantics.

#### Semantic
- **Success** `#0E7C4A` (text) / `#E5F4EC` (surface) — accepted, completed.
- **Warning** `#9A6712` (text) / `#FBF1DA` (surface) — under review, pending.
- **Danger**  `#A6261A` (text) / `#FBE8E5` (surface) — rejected, errors.
- **Info**    `#1E3FFF` (text) / `#E6EBFF` (surface) — saved-for-later, neutral notifications.

#### Color usage rules
- **Cobalt is precious.** One per visible viewport, max. Primary CTA, or active nav, or focus ring — pick one.
- **Citron means *win*.** Match score ≥ 75 = Citron pill. Application status "Accepted" = Citron dot. Don't decorate with it.
- **No gradients on chrome.** No teal→slate hero panels. The optional editorial hero uses a flat Bone background with a dotted-grid overlay.
- **Borders before shadows.** A 1px Hairline border establishes a card; shadows only show on hover or for floating elements (menus, modals).

### Typography

Three families:

- **Geist Sans** — UI, body, all running text.
- **Instrument Serif** — display headlines on hero/section openers. Italic styling allowed for editorial accent.
- **Geist Mono** — chip labels, data tables, code, technical metadata.

#### Font substitutions ⚠️
The original product used **Inter** plus the system stack. We swapped to:
- **Inter → Geist Sans** (Google Fonts) — same general proportions, slightly more humanist, more character.
- **Display → Instrument Serif** (Google Fonts) — new addition, no original equivalent.
- **Mono → Geist Mono** (Google Fonts) — new addition.

All three are loaded via Google Fonts CDN in `colors_and_type.css`. **No `.ttf` files are bundled in `fonts/`** — let the browser cache the CDN copy. If the user wants a self-hosted version (e.g. for offline / privacy), drop the `.woff2` files into `fonts/` and update the `@font-face` rules; the variable names will keep working.

If Geist isn't available in your environment, fall back to **Inter** (sans), **Source Serif 4** (serif), **JetBrains Mono** (mono) — same metrics class, very close visually.

#### Type scale
| Token | Family | Size | Line-height | Weight | Use |
| --- | --- | --- | --- | --- | --- |
| `--type-display-xl` | Instrument Serif | 64px | 0.95 | 400 | Top-of-page editorial titles |
| `--type-display-lg` | Instrument Serif | 48px | 1.0 | 400 | Section opener |
| `--type-display-md` | Geist Sans | 36px | 1.05 | 600 | Page H1 |
| `--type-h1` | Geist Sans | 28px | 1.15 | 600 | Section H2 |
| `--type-h2` | Geist Sans | 22px | 1.25 | 600 | Card heading |
| `--type-h3` | Geist Sans | 17px | 1.35 | 600 | Sub-heading |
| `--type-body` | Geist Sans | 15px | 1.55 | 400 | Body text |
| `--type-body-sm` | Geist Sans | 13px | 1.5 | 400 | Secondary text |
| `--type-label` | Geist Sans | 12px | 1.4 | 500 | Form labels |
| `--type-eyebrow` | Geist Mono | 11px | 1.2 | 500, +0.08em tracking, UPPERCASE | Section eyebrows |
| `--type-mono-sm` | Geist Mono | 12px | 1.4 | 400 | Tags, codes, data |
| `--type-mono-xs` | Geist Mono | 10px | 1.3 | 500 | Metric kickers |

### Spacing & sizing
- Base grid: **4px**. All spacing is a multiple of 4 (4, 8, 12, 16, 20, 24, 32, 40, 48, 64).
- Tokens: `--space-1` (4px) through `--space-12` (64px).
- Touch targets: **40px** minimum.
- Form controls: 40px height, 12px horizontal padding.
- Card padding: 20px (compact) / 24px (default) / 32px (hero).

### Corner radii
- `--radius-sm`  4px — chips, score pills, inline tags
- `--radius-md`  8px — buttons, inputs (yes — buttons are 8px, not pill)
- `--radius-lg`  12px — cards, panels
- `--radius-xl`  20px — modal sheets, hero blocks
- `--radius-full` 999px — avatars, the few "pill" CTAs we permit (kanban-card status dot ring)

The system **avoids the over-rounded look** of contemporary SaaS. Cards are 12px, buttons are 8px. The only true pills are status badges and avatar circles.

### Borders
- 1px Hairline (`#E8E3D7`) is the default container border.
- 2px Ink for active selection (selected CV in library, active kanban column header).
- Focus ring: 2px Cobalt, 2px offset.

### Shadows
Used sparingly. We prefer borders.
- `--shadow-sm`  `0 1px 2px rgba(14,14,16,0.04)` — hovered card lift.
- `--shadow-md`  `0 8px 24px rgba(14,14,16,0.08)` — dropdown menu.
- `--shadow-lg`  `0 24px 48px -12px rgba(14,14,16,0.18)` — modal.
- No inset shadows. No glow.

### Backgrounds
- Page background: **Bone** `#F6F3EC`.
- Optional **dotted-grid texture** overlay: 1px Mist dots on a 16×16 grid at 30% opacity, used on hero panels and the auth split-screen.
- **No stock photography.** The original product used Unsplash backgrounds (`bg-[linear-gradient(120deg,...),url('https://images.unsplash...')]`) — those are removed. Replaced with Bone + dotted grid + a single editorial number callout.

### Animation
Restrained.
- **Easing:** `cubic-bezier(0.2, 0.8, 0.2, 1)` for entrances ("ease out expo"), `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard) for state changes.
- **Duration:** 160ms for hover, 240ms for state, 320ms for route transitions, 480ms for the rare data-bar grow.
- **No bounces.** No spring overshoots. No "AI shimmer" gradients.
- **Route transition:** 8px upward translate + opacity fade. Reduced-motion users get instant.

### Hover & press states
- **Buttons (primary):** hover darkens by 8% (`#1A37E0`); press shrinks 1% via `transform: scale(0.99)`.
- **Buttons (ghost / secondary):** hover lightens background to `#EFEBE0`; press matches.
- **Cards (interactive):** hover gains `--shadow-sm` + 1px translate up. No color shift.
- **Nav items:** hover gets `Cobalt-50` background; active gets `Cobalt-50` + 2px Ink left-bar.
- **Chips:** static — no hover state. They're tags, not buttons.

### Transparency & blur
- Modals dim background with `rgba(14,14,16,0.45)` + `backdrop-filter: blur(8px)`.
- Dropdowns are opaque Paper — no blur.
- Skeletons use a Hairline-colored block; no shimmer animation.

### Imagery
- The system uses **no photographic imagery** in the product chrome.
- Where the original used Unsplash heroes, Lattice uses an editorial **giant numeral** callout (Instrument Serif, 280px, Mist color, 12% opacity, sitting behind a headline).
- Avatars: if no user photo, render initials on a **Bone** circle with **Ink** text. No colorful initial-avatars.

### Layout rules
- Sidebar fixed left, **240px** wide on desktop. Collapses to top tab strip below 1024px.
- Page max-width: **1240px**, centered, with 32px gutters.
- Two-column page grid uses 24px gap.
- Forms use 16px gap between fields, 4px between label and input.
- Stacked metric cards: each 1fr, 16px gap.

---

## Iconography

The original product used **react-icons/fi** (Feather). We keep that visual register — 1.5px stroke, rounded line caps, 24×24 grid — but switch to **Lucide** (the maintained successor to Feather).

- **Source:** [Lucide](https://lucide.dev) — load via CDN: `<script src="https://unpkg.com/lucide@latest"></script>` then `lucide.createIcons()`.
- **Stroke:** 1.5px (default).
- **Size:** 16px (inline with text), 20px (button icons), 24px (nav, prominent).
- **Color:** inherit from `currentColor`. Icons are never colored on their own — they take the text color of their context.
- **No emoji as icons.** None in the product.
- **No unicode glyph icons** (✓ ✗ →) used decoratively. The single exception: the keyboard-nav arrow indicators inside the kanban *Move to* dropdown.
- **No PNG icons.** Everything is SVG-from-Lucide or inline SVG drawn at 24×24 on the Lucide grid.

The original codebase also imports **react-icons/fi** directly. When porting Lattice into the live React codebase, swap `react-icons/fi` for **lucide-react** — names map 1:1 in most cases (`FiBriefcase` → `Briefcase`, `FiZap` → `Zap`, `FiAlertCircle` → `AlertCircle`).

### Logo

The Lattice logo is a 24×24 mark: four cells in a 2×2 grid, the top-left and bottom-right cells filled Ink, the others Hairline-stroked. Available as `assets/logo.svg` (mark) and `assets/logo-wordmark.svg` (mark + "Lattice" wordmark in Geist Sans 600 22px). Use Ink on light, Bone on dark.

---

## Substitution / open-question log

Things I made calls on without explicit user direction:

1. **Brand name "Lattice"** — fully invented. The original is "AI Career API" / "AI Career OS." If you want a different name, search-replace `Lattice` across the system.
2. **No real fonts bundled** in `fonts/`. Geist + Instrument Serif are loaded from Google Fonts CDN. If you want offline / privacy / latency improvements, download `.woff2` files from <https://vercel.com/font> (Geist) and <https://fonts.google.com/specimen/Instrument+Serif> and drop them in `fonts/`.
3. **Iconography** swapped Feather → Lucide. They look near-identical; this is a maintenance decision more than a visual one.
4. **No turkish copy localized.** The README files inside the original codebase are partly Turkish; the product UI is English. Lattice ships English-only — Turkish translation is a follow-up task if needed.
5. **Auth-page background** — the original used a stock photo. Lattice uses a flat Bone background with dotted grid + a 280px Instrument Serif numeral. If you'd rather have imagery, swap the `.lat-hero` background.
