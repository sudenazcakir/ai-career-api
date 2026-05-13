import { useEffect, useRef, useState } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const toastTimersRef = useRef({});

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

  function setStatus(message) {
    if (!message || message === "System ready") return;
    const lower = message.toLowerCase();
    const isBlank = lower.startsWith("no ") || lower.includes("no jobs");
    const isError =
      !isBlank &&
      /select|choose|couldn't|could not|failed|invalid|not found|expired|cannot|rejected|load jobs|fill in|error/i.test(
        lower
      );
    const isSuccess =
      !isError &&
      !isBlank &&
      /ready|created|updated|deleted|saved|tracked|loaded|imported|ranked|signed|calculated|complete|found/i.test(
        lower
      );
    addToast(message, isError ? "error" : isSuccess ? "success" : "info");
  }

  useEffect(() => {
    return () => {
      Object.values(toastTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  return { toasts, addToast, removeToast, setStatus };
}
