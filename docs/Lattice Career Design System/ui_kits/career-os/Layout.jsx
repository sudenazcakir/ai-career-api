/* global React */
const { useState } = React;

// Inline icon helper -- uses lucide via CDN <script>; falls back to simple SVG.
const Icon = ({ name, size = 18, stroke = 1.5, ...rest }) => (
  <i
    data-lucide={name}
    style={{ width: size, height: size, display: "inline-flex", alignItems: "center", strokeWidth: stroke }}
    {...rest}
  />
);

// ─── Layout ──────────────────────────────────────────────────────────────
const Sidebar = ({ active, onNav }) => {
  const items = [
    { section: "Workspace", links: [
      { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
      { id: "jobs",      label: "Jobs",      icon: "briefcase" },
      { id: "cvs",       label: "My CVs",    icon: "file-text" },
    ]},
    { section: "Growth", links: [
      { id: "skill-gaps", label: "Skill gaps", icon: "target" },
      { id: "roadmap",    label: "Roadmap",    icon: "route" },
    ]},
    { section: "Apply", links: [
      { id: "applications", label: "Applications", icon: "kanban" },
      { id: "trends",       label: "Trends",       icon: "bar-chart-2" },
      { id: "insights",     label: "AI insights",  icon: "sparkles" },
      { id: "profile",      label: "Profile",      icon: "user" },
    ]},
  ];
  return (
    <aside className="lat-sidebar">
      <div className="lat-brand">
        <img src="../../assets/logo-mark.svg" alt="" width={22} height={22}/>
        <strong>Lattice</strong>
      </div>
      <nav>
        {items.map(({ section, links }) => (
          <div key={section} className="lat-nav-group">
            <span className="lat-section-label">{section}</span>
            {links.map(l => (
              <button key={l.id}
                className={`lat-nav-item ${active === l.id ? "is-active" : ""}`}
                onClick={() => onNav(l.id)}>
                <Icon name={l.icon} size={16}/>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="lat-sidebar-foot">
        <a className="lat-doc-link">
          <Icon name="book-open" size={14}/> API documentation
        </a>
      </div>
    </aside>
  );
};

const TopBar = ({ title, eyebrow, status, onNav }) => (
  <header className="lat-topbar">
    <div>
      <span className="lat-eyebrow">{eyebrow}</span>
      <h1 className="lat-h1" style={{ marginTop: 4 }}>{title}</h1>
    </div>
    <div className="lat-topbar-actions">
      <span className="lat-status"><span className="lat-status-dot"/>{status}</span>
      <button className="lat-avatar" onClick={() => onNav("profile")}>AT</button>
    </div>
  </header>
);

window.Sidebar = Sidebar;
window.TopBar = TopBar;
window.Icon = Icon;
