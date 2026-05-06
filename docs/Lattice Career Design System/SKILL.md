---
name: Lattice — Career OS Design System
description: Editorial, calm design system for AI-assisted career-matching products. Bone + Ink neutrals, single-Cobalt accent, Instrument Serif headlines, Geist Sans UI, Geist Mono data. Use for any screen of the Career OS family — auth, dashboard, jobs, CVs, skill gaps, roadmap, applications kanban, analytics.
---

# Using the Lattice design system

This is a redesign of the AI Career API project. Read `README.md` end-to-end before producing screens — the content fundamentals (voice, casing, microcopy) are non-obvious and matter as much as the visual tokens.

## To produce a screen

1. **Tokens.** Link `colors_and_type.css` from the project root. All colors, type, spacing, radii, and shadows are CSS custom properties prefixed `--c-`, `--font-`, `--radius-`, `--shadow-`, `--space-`.
2. **Components.** The product UI kit lives at `ui_kits/career-os/`. Reuse `Layout.jsx` (Sidebar, TopBar), `Primitives.jsx` (Btn, Card, Metric, Bar, ScorePill, StatusPill, SkillChip, Empty, Icon), and the page modules (`Dashboard.jsx`, `JobsPage.jsx`, `ApplicationsPage.jsx`, `AuthPage.jsx`). Stylesheet: `career-os.css`.
3. **Iconography.** Lucide via CDN (`<script src="https://unpkg.com/lucide@latest"></script>` + `lucide.createIcons()`). 1.5px stroke, sized 16/20/24, color inherits from `currentColor`.
4. **Type.** Geist Sans for UI/body, Instrument Serif for editorial display, Geist Mono for chips/data/eyebrows. Loaded from Google Fonts in `colors_and_type.css`.

## Hard rules

- One Cobalt element per visible region — primary CTA, active nav, *or* focus ring; pick one.
- Citron only for "win" semantics: ≥75% match scores, accepted applications.
- Borders before shadows. 1px Hairline establishes a card; shadows only on hover/floating.
- No gradients on chrome. No stock photography. No emoji. No exclamation points.
- Sentence case everywhere except eyebrows (UPPERCASE, +0.08em tracking) and status pills (Title Case).
- Active verbs for buttons (*Import jobs*, *Rank now*) — never *Get started* or *Click here*.
- 4px base grid. Card radius 12px, button radius 8px (not pill).

## Reference screens

Open `ui_kits/career-os/index.html` to see Auth, Dashboard, Jobs, and Applications screens with the kit toolbar to switch between them.

## When to deviate

If a screen needs a treatment outside the kit, extend `career-os.css` with new `.lat-*` classes following the existing patterns (token-based, no hard-coded colors). Don't introduce a new accent color — Cobalt, Citron, and Plum are the only chromatic moves the system makes.
