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
    clearTimeout(timerRef.current);
    setLeaving(true);
    timerRef.current = setTimeout(() => onRemove(id), 200);
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div
      className={`${ui.toastBase} ${TYPE_BORDER[type] || ui.toastInfo} ${leaving ? "is-leaving" : ""}`}
    >
      {ICONS[type]}
      <span className={ui.toastMessage}>{message}</span>
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
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Notifications"
      className={ui.toastList}
    >
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onRemove={onRemove} />
      ))}
    </div>
  );
}
