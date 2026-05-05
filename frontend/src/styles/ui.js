export const ui = {
  shell: "min-h-screen overflow-x-hidden bg-[#eef2f3] text-slate-950 lg:pl-[260px]",
  sidebar:
    "fixed inset-y-0 left-0 z-10 flex w-[260px] flex-col gap-[22px] border-r border-[#d6dee2] bg-[#f9fbfb] p-[22px] max-lg:static max-lg:h-auto max-lg:w-auto max-sm:p-4",
  brand: "flex min-w-0 items-center gap-3",
  brandMark:
    "grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-teal-700 text-white font-black",
  nav: "grid gap-2 max-lg:grid-cols-3 max-sm:grid-cols-2",
  navButton:
    "flex min-h-10 w-full items-center rounded-lg bg-transparent px-3.5 text-left font-bold text-slate-700 no-underline transition hover:bg-[#dcefed] hover:text-[#0f4f49] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2",
  navButtonActive: "bg-[#dcefed] text-[#0f4f49] shadow-sm",
  docLink:
    "mt-auto inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-3.5 text-center font-bold text-white no-underline transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 max-lg:mt-0",
  workspace: "mx-auto min-w-0 w-[min(1240px,calc(100%-36px))] py-7 pb-10 max-sm:w-[calc(100%-24px)] max-sm:py-5",
  header:
    "mb-5 flex min-w-0 items-center justify-between gap-4 max-lg:flex-col max-lg:items-start",
  headerActions: "flex min-w-0 flex-wrap items-center gap-2.5",
  eyebrow: "mb-2 text-xs font-black uppercase text-slate-500",
  pageTitle:
    "max-w-full break-words text-[clamp(34px,6vw,56px)] font-black leading-[0.95] tracking-[-0.04em]",
  pulse:
    "inline-flex min-h-10 max-w-[min(420px,100%)] min-w-0 items-center gap-2 rounded-full border border-[#d6dee2] bg-white px-3.5 text-sm font-bold text-slate-700 shadow-sm",
  pulseDot: "h-[9px] w-[9px] shrink-0 rounded-full bg-teal-700",
  accountButton:
    "grid h-[42px] min-h-[42px] w-[42px] shrink-0 place-items-center overflow-hidden rounded-full bg-slate-950 p-0 font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2",
  pageGrid: "grid grid-cols-[repeat(2,minmax(0,1fr))] gap-4 max-lg:grid-cols-1",
  splitPage:
    "grid grid-cols-[repeat(2,minmax(0,1fr))] items-start gap-4 max-lg:grid-cols-1",
  full: "col-span-full",
  panel:
    "min-w-0 overflow-hidden rounded-xl border border-[#d6dee2] bg-white p-4 shadow-sm max-sm:p-3.5",
  sectionHead:
    "mb-4 flex min-w-0 items-center justify-between gap-3.5 max-lg:flex-col max-lg:items-start",
  buttonRow: "flex flex-wrap gap-2.5",
  button:
    "min-h-10 min-w-0 rounded-lg bg-teal-700 px-3.5 text-center font-bold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
  buttonSecondary:
    "min-h-10 min-w-0 rounded-lg bg-slate-700 px-3.5 text-center font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
  buttonGhost:
    "min-h-[34px] min-w-0 rounded-lg bg-[#e8eef0] px-3.5 text-center font-bold text-slate-700 transition hover:bg-[#d6dee2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
  input:
    "min-h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-[#fbfcfc] px-2.5 py-2 text-slate-950 transition placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20",
  label: "grid min-w-0 gap-1.5 text-sm font-bold text-slate-600",
  formStack: "grid gap-3",
  twoFields: "grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 max-lg:grid-cols-1",
  chips: "flex min-w-0 flex-wrap gap-1.5",
  chip:
    "max-w-full rounded-full bg-[#edf4f5] px-2.5 py-1 text-xs font-bold text-[#31515b] break-words",
  muted: "min-w-0 break-words text-slate-500",
  count: "shrink-0 text-sm font-bold text-slate-500",
  score:
    "inline-block min-w-[58px] shrink-0 self-start rounded-full bg-[#dff3ef] px-2.5 py-1.5 text-center text-sm font-black text-teal-700",
  metric: "grid min-w-0 gap-2.5 rounded-xl border border-[#d6dee2] bg-white p-4 shadow-sm",
  metricLabel: "min-w-0 break-words text-sm font-bold text-slate-500",
  metricValue:
    "min-w-0 break-words text-[clamp(26px,4vw,34px)] font-black leading-none",
  accountHero:
    "grid min-w-0 grid-cols-[auto_minmax(0,1fr)_max-content] items-center gap-4 overflow-hidden rounded-xl border border-[#cad7db] p-5 text-white shadow-sm max-lg:grid-cols-1 max-sm:p-4",
  avatarEditor:
    "relative inline-grid w-max cursor-pointer place-items-center [&>input]:hidden [&>span]:absolute [&>span]:-right-1.5 [&>span]:bottom-1 [&>span]:grid [&>span]:h-[26px] [&>span]:w-[26px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-white [&>span]:text-xs [&>span]:font-black [&>span]:text-teal-700",
  accountAvatar:
    "grid h-[72px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/60 bg-white/15 object-cover text-3xl font-black text-white",
  cardGrid: "grid grid-cols-[repeat(3,minmax(0,1fr))] gap-3 max-lg:grid-cols-1",
  accountCard:
    "grid min-w-0 gap-2.5 rounded-xl border border-[#d6dee2] bg-white p-4 shadow-sm [&>span]:text-xs [&>span]:font-black [&>span]:uppercase [&>span]:text-slate-500 [&>strong]:min-w-0 [&>strong]:break-words [&>strong]:text-base",
  passportPreview:
    "grid grid-cols-[repeat(4,minmax(0,1fr))] gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1 [&>article]:grid [&>article]:min-w-0 [&>article]:gap-2 [&>article]:rounded-xl [&>article]:border [&>article]:border-[#d6dee2] [&>article]:bg-[#fbfcfc] [&>article]:p-3 [&>article>span]:text-xs [&>article>span]:font-black [&>article>span]:text-slate-500 [&>article>strong]:break-words",
  modalBackdrop: "fixed inset-0 z-20 grid place-items-center bg-slate-950/45 p-5 backdrop-blur-sm",
  modalWindow:
    "max-h-[90vh] w-[min(980px,100%)] min-w-0 overflow-auto rounded-xl border border-[#d6dee2] bg-white p-5 shadow-2xl max-sm:p-4",
  modalHead: "mb-4 flex min-w-0 items-start justify-between gap-3",
  fieldError: "text-xs font-bold text-red-700",
  passportForm: "grid gap-4",
  passportSection:
    "grid min-w-0 grid-cols-[220px_minmax(0,1fr)] gap-4 rounded-xl border border-[#d6dee2] bg-white p-4 shadow-sm max-lg:grid-cols-1 max-sm:p-3.5",
  passportSectionHead:
    "min-w-0 [&>h3]:mb-1 [&>h3]:break-words [&>h3]:text-lg [&>h3]:font-black [&>p]:break-words [&>p]:text-sm [&>p]:font-medium [&>p]:text-slate-500",
  passportFields:
    "grid min-w-0 grid-cols-[repeat(2,minmax(0,1fr))] gap-3 max-lg:grid-cols-1",
  heroPanel:
    "col-span-full grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-5 overflow-hidden rounded-xl p-6 text-white shadow-sm max-lg:grid-cols-1 max-sm:p-4",
  heroActions: "flex flex-wrap items-end gap-2.5",
  metrics: "grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3",
  profileList: "grid gap-2.5",
  profileButton:
    "w-full min-w-0 rounded-xl border border-[#d6dee2] bg-[#fbfcfc] p-3 text-left text-slate-950 transition hover:bg-[#eef7f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2",
  profileButtonActive: "border-teal-700 bg-[#e3f4f1]",
  gridForm:
    "grid grid-cols-[repeat(5,minmax(0,1fr))] items-end gap-3 max-xl:grid-cols-[repeat(3,minmax(0,1fr))] max-lg:grid-cols-2 max-sm:grid-cols-1",
  matchGrid:
    "grid grid-cols-[repeat(4,minmax(0,1fr))] items-end gap-3 max-xl:grid-cols-2 max-sm:grid-cols-1",
  roadmap:
    "grid gap-2.5 [&>p]:min-w-0 [&>p]:break-words [&>p]:rounded-lg [&>p]:border-l-4 [&>p]:border-teal-700 [&>p]:bg-[#f1f7f6] [&>p]:p-3",
  insightStack: "grid min-w-0 gap-3",
  insightMetrics: "grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3",
  miniLabel: "mb-2 text-xs font-black uppercase text-slate-500",
  explanation:
    "min-w-0 whitespace-pre-wrap break-words rounded-lg border border-[#d6dee2] bg-[#f8fafc] p-3 text-sm font-semibold text-slate-700",
  chartBox:
    "h-[260px] min-w-0 overflow-hidden rounded-lg border border-[#d6dee2] bg-white p-3 max-sm:h-[220px]",
  chartBoxShort:
    "h-[250px] min-w-0 overflow-hidden rounded-lg border border-[#d6dee2] bg-white p-3 max-sm:h-[220px]",
  profileSummary: "grid min-w-0 gap-2 text-left",
  jobList: "grid gap-3",
  jobRow:
    "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-xl border border-[#d6dee2] bg-[#fbfcfc] p-3 shadow-sm max-sm:grid-cols-1",
};

export const heroBg =
  "bg-[linear-gradient(120deg,rgba(15,118,110,0.94),rgba(17,24,39,0.9)),url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center";
export const authBg =
  "bg-[linear-gradient(120deg,rgba(15,118,110,0.88),rgba(17,24,39,0.9)),url('https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center";
export const accountBg =
  "bg-[linear-gradient(120deg,rgba(15,118,110,0.94),rgba(17,24,39,0.9)),url('https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center";
export const onboardingBg =
  "bg-[linear-gradient(120deg,rgba(17,24,39,0.94),rgba(15,118,110,0.84)),url('https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center";
