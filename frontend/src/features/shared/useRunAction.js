import { useEffect, useRef, useState } from "react";

export function useRunAction({ addToast }) {
  const [pendingAction, setPendingAction] = useState("");
  const [showLoadingBar, setShowLoadingBar] = useState(false);
  const loadingBarTimerRef = useRef(null);

  async function runAction(label, action) {
    try {
      setPendingAction(label);
      const result = await action();
      return result ?? true;
    } catch (error) {
      if (error.status === 401) return false; // unauthorized handler already fired
      addToast(error.message, "error");
      return false;
    } finally {
      setPendingAction("");
    }
  }

  useEffect(() => {
    if (pendingAction) {
      loadingBarTimerRef.current = setTimeout(() => setShowLoadingBar(true), 2000);
    } else {
      clearTimeout(loadingBarTimerRef.current);
      setShowLoadingBar(false);
    }
    return () => clearTimeout(loadingBarTimerRef.current);
  }, [pendingAction]);

  return { pendingAction, runAction, showLoadingBar };
}
