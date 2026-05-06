/* ── Lattice Career OS — design tokens as Tailwind utilities ───────────── */

export const ui = {
  /* layout */
  shell:
    "min-h-screen overflow-x-hidden bg-[#F6F3EC] text-[#0E0E10] lg:pl-[232px]",
  sidebar:
    "fixed inset-y-0 left-0 z-10 flex w-[232px] flex-col gap-0 border-r border-[#E8E3D7] bg-[#FBFAF6] p-0 max-lg:static max-lg:h-auto max-lg:w-auto",
  brand:
    "flex items-center gap-2.5 px-4 py-[18px] border-b border-[#E8E3D7]",
  brandMark:
    "grid h-[22px] w-[22px] shrink-0 place-items-center",
  nav:
    "flex-1 overflow-y-auto px-3.5 pt-3 max-lg:flex max-lg:flex-row max-lg:flex-wrap max-lg:gap-1 max-lg:px-2 max-lg:py-2",
  navButton:
    "flex h-[34px] w-full items-center gap-2.5 rounded-[8px] px-3 text-left text-[13px] font-medium text-[#3A3A40] no-underline transition-colors hover:bg-[#F6F3EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF] focus-visible:ring-offset-1",
  navButtonActive:
    "font-semibold",
  docLink:
    "mt-auto inline-flex items-center gap-1.5 px-4 py-3.5 border-t border-[#E8E3D7] text-[11px] font-[500] text-[#6B6B72] no-underline font-mono max-lg:mt-0",
  workspace:
    "mx-auto min-w-0 w-[min(1200px,calc(100%-56px))] py-6 pb-12 max-sm:w-[calc(100%-24px)] max-sm:py-4",
  header:
    "mb-5 flex min-w-0 items-end justify-between gap-4 max-lg:flex-col max-lg:items-start border-b border-[#E8E3D7] pb-5",
  headerActions:
    "flex min-w-0 flex-wrap items-center gap-2",
  eyebrow:
    "mb-1 text-[11px] font-[500] uppercase tracking-[0.08em] text-[#6B6B72] font-mono",
  pageTitle:
    "max-w-full break-words text-[28px] font-[600] leading-[1.15] tracking-[-0.015em] text-[#0E0E10]",
  pulse:
    "inline-flex min-h-[34px] max-w-[min(420px,100%)] min-w-0 items-center gap-2 rounded-[8px] border border-[#E8E3D7] bg-[#FBFAF6] px-3 text-[11px] font-[500] text-[#6B6B72] font-mono uppercase tracking-[0.04em]",
  pulseDot:
    "h-[6px] w-[6px] shrink-0 rounded-full bg-[#0E7C4A]",
  accountButton:
    "grid h-8 min-h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[#0E0E10] p-0 text-[12px] font-[600] text-[#F6F3EC] transition hover:bg-[#3A3A40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF] focus-visible:ring-offset-2",

  /* grid layouts */
  pageGrid:
    "grid grid-cols-[repeat(2,minmax(0,1fr))] gap-[18px] max-lg:grid-cols-1",
  splitPage:
    "grid grid-cols-[repeat(2,minmax(0,1fr))] items-start gap-[18px] max-lg:grid-cols-1",
  full: "col-span-full",

  /* card / panel */
  panel:
    "min-w-0 overflow-hidden rounded-[12px] border border-[#E8E3D7] bg-[#FBFAF6] p-5 max-sm:p-4",
  sectionHead:
    "mb-4 flex min-w-0 items-center justify-between gap-3 max-lg:flex-col max-lg:items-start",
  buttonRow:
    "flex flex-wrap gap-2",

  /* buttons */
  button:
    "inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-[8px] bg-[#0E0E10] px-3.5 text-[13px] font-[500] text-[#F6F3EC] transition-colors hover:bg-[#3A3A40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  buttonCobalt:
    "inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-[8px] bg-[#1E3FFF] px-3.5 text-[13px] font-[500] text-white transition-colors hover:bg-[#1A37E0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  buttonSecondary:
    "inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-[8px] border border-[#0E0E10] bg-transparent px-3.5 text-[13px] font-[500] text-[#0E0E10] transition-colors hover:bg-[#0E0E10] hover:text-[#F6F3EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E0E10] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  buttonGhost:
    "inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-[8px] border border-[#E8E3D7] bg-transparent px-3 text-[13px] font-[500] text-[#3A3A40] transition-colors hover:border-[#A4A4AC] hover:text-[#0E0E10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",

  /* form */
  input:
    "h-9 w-full min-w-0 rounded-[8px] border border-[#A4A4AC] bg-[#FBFAF6] px-3 py-0 text-[13px] text-[#0E0E10] placeholder:text-[#A4A4AC] transition focus:border-[#0E0E10] focus:outline-none focus:ring-0 focus:shadow-[0_0_0_3px_rgba(14,14,16,0.1)]",
  label:
    "grid min-w-0 gap-1.5 text-[10px] font-[500] uppercase tracking-[0.05em] text-[#6B6B72] font-mono",
  formStack:
    "grid gap-3.5",
  twoFields:
    "grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 max-lg:grid-cols-1",

  /* chips */
  chips:
    "flex min-w-0 flex-wrap gap-1",
  chip:
    "inline-flex items-center rounded-[4px] bg-[#F6F3EC] px-2 py-0.5 text-[11px] font-[400] text-[#3A3A40] border border-[#E8E3D7] font-mono",
  chipMatched:
    "inline-flex items-center rounded-[4px] bg-[#E5F4EC] px-2 py-0.5 text-[11px] font-[400] text-[#0E7C4A] font-mono",
  chipMissing:
    "inline-flex items-center rounded-[4px] bg-[#EFE5F8] px-2 py-0.5 text-[11px] font-[400] text-[#5B2A86] font-mono",
  chipPartial:
    "inline-flex items-center rounded-[4px] bg-[rgba(229,184,11,0.16)] px-2 py-0.5 text-[11px] font-[400] text-[#6b5a07] font-mono",

  /* score pill — use getScoreClass(value) helper below */
  score:
    "inline-flex min-w-[52px] items-center justify-center rounded-[4px] px-2.5 py-1 text-[13px] font-[600]",
  scoreHigh:
    "bg-[#D7E25C] text-[#0E0E10]",
  scoreMid:
    "bg-[#E6EBFF] text-[#1E3FFF]",
  scoreLow:
    "bg-[#F6F3EC] text-[#6B6B72] border border-[#E8E3D7]",

  /* status pills */
  statusPill:
    "inline-flex h-[22px] items-center rounded-full px-2.5 text-[11px] font-[500]",
  statusSaved:
    "bg-[#F6F3EC] text-[#3A3A40] border border-[#E8E3D7]",
  statusReview:
    "bg-[#E6EBFF] text-[#1E3FFF]",
  statusAccepted:
    "bg-[#E5F4EC] text-[#0E7C4A]",
  statusRejected:
    "bg-[#EFE5F8] text-[#5B2A86]",

  /* metrics */
  metric:
    "grid min-w-0 gap-2 border-r border-[#E8E3D7] bg-[#FBFAF6] px-5 py-4 last:border-r-0",
  metricLabel:
    "text-[10px] font-[500] uppercase tracking-[0.08em] text-[#6B6B72] font-mono",
  metricValue:
    "text-[32px] font-[600] leading-none tracking-[-0.015em] text-[#0E0E10]",
  metrics:
    "grid grid-cols-[repeat(4,1fr)] overflow-hidden rounded-[12px] border border-[#E8E3D7] bg-[#FBFAF6] max-sm:grid-cols-2",

  /* hero */
  heroPanel:
    "col-span-full relative overflow-hidden rounded-[20px] border border-[#E8E3D7] bg-[#F6F3EC] p-10 max-sm:p-6",

  /* account */
  accountHero:
    "grid min-w-0 grid-cols-[auto_minmax(0,1fr)_max-content] items-center gap-4 overflow-hidden rounded-[12px] border border-[#E8E3D7] bg-[#FBFAF6] p-5 max-lg:grid-cols-1 max-sm:p-4",
  avatarEditor:
    "relative inline-grid w-max cursor-pointer place-items-center [&>input]:hidden [&>span]:absolute [&>span]:-right-1.5 [&>span]:bottom-1 [&>span]:grid [&>span]:h-[24px] [&>span]:w-[24px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[#F6F3EC] [&>span]:text-xs [&>span]:font-[600] [&>span]:text-[#0E0E10] [&>span]:border [&>span]:border-[#E8E3D7]",
  accountAvatar:
    "grid h-[60px] w-[60px] shrink-0 place-items-center overflow-hidden rounded-full border-2 border-[#E8E3D7] bg-[#0E0E10] object-cover text-2xl font-[600] text-[#F6F3EC]",
  cardGrid:
    "grid grid-cols-[repeat(3,minmax(0,1fr))] gap-3 max-lg:grid-cols-1",
  accountCard:
    "grid min-w-0 gap-2 rounded-[12px] border border-[#E8E3D7] bg-[#FBFAF6] p-4 [&>span]:text-[10px] [&>span]:font-[500] [&>span]:uppercase [&>span]:tracking-[0.08em] [&>span]:text-[#6B6B72] [&>span]:font-mono [&>strong]:min-w-0 [&>strong]:break-words [&>strong]:text-[15px] [&>strong]:font-[600] [&>strong]:text-[#0E0E10]",

  /* passport preview */
  passportPreview:
    "grid grid-cols-[repeat(4,minmax(0,1fr))] gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1 [&>article]:grid [&>article]:min-w-0 [&>article]:gap-1.5 [&>article]:rounded-[12px] [&>article]:border [&>article]:border-[#E8E3D7] [&>article]:bg-[#FBFAF6] [&>article]:p-3 [&>article>span]:text-[10px] [&>article>span]:font-[500] [&>article>span]:uppercase [&>article>span]:tracking-[0.08em] [&>article>span]:text-[#6B6B72] [&>article>span]:font-mono [&>article>strong]:break-words [&>article>strong]:text-[#0E0E10]",

  /* modal */
  modalBackdrop:
    "fixed inset-0 z-20 grid place-items-center bg-[rgba(14,14,16,0.45)] p-5 backdrop-blur-[8px]",
  modalWindow:
    "max-h-[90vh] w-[min(980px,100%)] min-w-0 overflow-auto rounded-[20px] border border-[#E8E3D7] bg-[#FBFAF6] p-5 shadow-[0_24px_48px_-12px_rgba(14,14,16,0.18)] max-sm:p-4",
  modalHead:
    "mb-4 flex min-w-0 items-start justify-between gap-3",

  /* misc */
  muted:
    "min-w-0 break-words text-[#6B6B72] text-[13px]",
  count:
    "shrink-0 text-[12px] font-[500] text-[#6B6B72] font-mono",
  fieldError:
    "text-[12px] font-[500] text-[#A6261A]",
  passportForm:
    "grid gap-4",
  passportSection:
    "grid min-w-0 grid-cols-[200px_minmax(0,1fr)] gap-4 rounded-[12px] border border-[#E8E3D7] bg-[#FBFAF6] p-4 max-lg:grid-cols-1 max-sm:p-3.5",
  passportSectionHead:
    "min-w-0 [&>h3]:mb-1 [&>h3]:break-words [&>h3]:text-[17px] [&>h3]:font-[600] [&>h3]:tracking-[-0.01em] [&>h3]:text-[#0E0E10] [&>p]:break-words [&>p]:text-[13px] [&>p]:font-[400] [&>p]:text-[#6B6B72]",
  passportFields:
    "grid min-w-0 grid-cols-[repeat(2,minmax(0,1fr))] gap-3 max-lg:grid-cols-1",

  /* insights / roadmap */
  roadmap:
    "grid gap-2 [&>p]:min-w-0 [&>p]:break-words [&>p]:rounded-[8px] [&>p]:border-l-2 [&>p]:border-[#1E3FFF] [&>p]:bg-[#FBFAF6] [&>p]:p-3 [&>p]:text-[13px]",
  insightStack:
    "grid min-w-0 gap-3",
  insightMetrics:
    "grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3",
  miniLabel:
    "mb-2 text-[10px] font-[500] uppercase tracking-[0.08em] text-[#6B6B72] font-mono",
  explanation:
    "min-w-0 whitespace-pre-wrap break-words rounded-[8px] border border-[#E8E3D7] bg-[#FBFAF6] p-3 text-[13px] font-[400] text-[#3A3A40] leading-relaxed",
  chartBox:
    "h-[260px] min-w-0 overflow-hidden rounded-[8px] border border-[#E8E3D7] bg-[#FBFAF6] p-3 max-sm:h-[220px]",
  chartBoxShort:
    "h-[250px] min-w-0 overflow-hidden rounded-[8px] border border-[#E8E3D7] bg-[#FBFAF6] p-3 max-sm:h-[220px]",

  /* jobs */
  jobList:
    "grid gap-2.5",
  jobRow:
    "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-4 rounded-[12px] border border-[#E8E3D7] bg-[#FBFAF6] p-4 transition-shadow hover:border-[#A4A4AC] hover:shadow-[0_1px_2px_rgba(14,14,16,0.04)] max-sm:grid-cols-1",

  /* filter form */
  gridForm:
    "grid grid-cols-[1.4fr_1fr_0.8fr_1fr_auto] items-end gap-3 max-xl:grid-cols-[repeat(3,minmax(0,1fr))] max-lg:grid-cols-2 max-sm:grid-cols-1",
  matchGrid:
    "grid grid-cols-[repeat(4,minmax(0,1fr))] items-end gap-3 max-xl:grid-cols-2 max-sm:grid-cols-1",

  /* match bars */
  profileList:
    "grid gap-2",
  profileButton:
    "w-full min-w-0 rounded-[12px] border border-[#E8E3D7] bg-[#FBFAF6] p-3 text-left text-[#0E0E10] transition hover:bg-[#F6F3EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF] focus-visible:ring-offset-1",
  profileButtonActive:
    "border-[#0E0E10] bg-[#F6F3EC]",
  profileSummary:
    "grid min-w-0 gap-2 text-left",
};

/* ── Removed Unsplash background exports — replaced with CSS class ──────── */
/* Auth page left panel uses `.lat-dot-grid` from styles.css               */
export const heroBg = "";   /* OverviewPage hero uses inline dotted-grid style */
export const authBg = "";   /* AuthPage uses lat-dot-grid class                */
export const accountBg = ""; /* AccountPage no longer uses a photo background  */
export const onboardingBg = ""; /* PassportOnboarding uses lat-dot-grid        */

/* ── Score pill helper ─────────────────────────────────────────────────── */
export function getScoreClass(value) {
  if (value >= 75) return `${ui.score} ${ui.scoreHigh}`;
  if (value >= 50) return `${ui.score} ${ui.scoreMid}`;
  return `${ui.score} ${ui.scoreLow}`;
}

/* ── Status pill helper ────────────────────────────────────────────────── */
export function getStatusClass(status) {
  const map = {
    "Saved for Later": ui.statusSaved,
    "Under Review":    ui.statusReview,
    "Accepted":        ui.statusAccepted,
    "Rejected":        ui.statusRejected,
  };
  return `${ui.statusPill} ${map[status] || ui.statusSaved}`;
}
