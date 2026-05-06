/* global React, Icon */
const { useState: useState_p } = React;

const ScorePill = ({ value }) => {
  const cls = value >= 75 ? "high" : value >= 50 ? "mid" : "low";
  return <span className={`lat-score lat-score-${cls}`}>{value}%</span>;
};

const StatusPill = ({ value }) => {
  const map = {
    "Saved for Later": "saved",
    "Under Review": "review",
    "Accepted": "accepted",
    "Rejected": "rejected",
  };
  return <span className={`lat-status-pill lat-s-${map[value] || "saved"}`}>{value}</span>;
};

const SkillChip = ({ kind = "neutral", children }) => (
  <span className={`lat-chip lat-chip-${kind}`}>{children}</span>
);

const Bar = ({ label, value, color = "ink" }) => (
  <div className="lat-bar">
    <span className="lat-bar-label">{label}</span>
    <div className="lat-bar-track">
      <div className={`lat-bar-fill lat-bar-${color}`} style={{ width: `${value}%` }}/>
    </div>
    <span className="lat-bar-value">{value}</span>
  </div>
);

const Empty = ({ msg = "Nothing here yet." }) => (
  <div className="lat-empty">{msg}</div>
);

const Card = ({ eyebrow, title, action, children, className = "" }) => (
  <section className={`lat-card ${className}`}>
    {(eyebrow || title || action) && (
      <header className="lat-card-head">
        <div>
          {eyebrow && <span className="lat-eyebrow">{eyebrow}</span>}
          {title && <h2 className="lat-h2" style={{ marginTop: eyebrow ? 4 : 0 }}>{title}</h2>}
        </div>
        {action}
      </header>
    )}
    {children}
  </section>
);

const Metric = ({ label, value, hint }) => (
  <div className="lat-metric">
    <span className="lat-metric-label">{label}</span>
    <strong className="lat-metric-value">{value}</strong>
    {hint && <span className="lat-metric-hint">{hint}</span>}
  </div>
);

const Btn = ({ kind = "primary", children, icon, ...rest }) => (
  <button className={`lat-btn lat-btn-${kind}`} {...rest}>
    {icon && <Icon name={icon} size={16}/>}
    {children}
  </button>
);

window.ScorePill = ScorePill;
window.StatusPill = StatusPill;
window.SkillChip = SkillChip;
window.Bar = Bar;
window.Empty = Empty;
window.Card = Card;
window.Metric = Metric;
window.Btn = Btn;
