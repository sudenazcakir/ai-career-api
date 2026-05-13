import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRunAction } from "../useRunAction";

describe("useRunAction — initial state", () => {
  it("starts with falsy pendingAction", () => {
    const addToast = vi.fn();
    const { result } = renderHook(() => useRunAction({ addToast }));
    // pendingAction initialises as "" (empty string) which is falsy
    expect(result.current.pendingAction).toBeFalsy();
  });

  it("exposes runAction function", () => {
    const addToast = vi.fn();
    const { result } = renderHook(() => useRunAction({ addToast }));
    expect(typeof result.current.runAction).toBe("function");
  });
});

describe("useRunAction — successful action", () => {
  it("clears pendingAction after action resolves", async () => {
    const addToast = vi.fn();
    const { result } = renderHook(() => useRunAction({ addToast }));

    await act(async () => {
      await result.current.runAction("Loading", async () => {});
    });

    expect(result.current.pendingAction).toBeFalsy();
  });

  it("returns true when action returns no value", async () => {
    const addToast = vi.fn();
    const { result } = renderHook(() => useRunAction({ addToast }));

    let returnValue;
    await act(async () => {
      returnValue = await result.current.runAction("Loading", async () => {});
    });

    expect(returnValue).toBe(true);
  });

  it("returns action result when action returns a value", async () => {
    const addToast = vi.fn();
    const { result } = renderHook(() => useRunAction({ addToast }));

    let returnValue;
    await act(async () => {
      returnValue = await result.current.runAction("Loading", async () => "done");
    });

    expect(returnValue).toBe("done");
  });

  it("does not call addToast on success", async () => {
    const addToast = vi.fn();
    const { result } = renderHook(() => useRunAction({ addToast }));

    await act(async () => {
      await result.current.runAction("Loading", async () => {});
    });

    expect(addToast).not.toHaveBeenCalled();
  });
});

describe("useRunAction — error handling", () => {
  it("calls addToast with error type when action throws", async () => {
    const addToast = vi.fn();
    const { result } = renderHook(() => useRunAction({ addToast }));

    await act(async () => {
      await result.current.runAction("Failing", async () => {
        throw new Error("Something broke");
      });
    });

    expect(addToast).toHaveBeenCalledWith(
      expect.stringContaining("Something broke"),
      "error"
    );
  });

  it("clears pendingAction after action throws", async () => {
    const addToast = vi.fn();
    const { result } = renderHook(() => useRunAction({ addToast }));

    await act(async () => {
      await result.current.runAction("Failing", async () => {
        throw new Error("Boom");
      });
    });

    expect(result.current.pendingAction).toBeFalsy();
  });

  it("returns false when action throws", async () => {
    const addToast = vi.fn();
    const { result } = renderHook(() => useRunAction({ addToast }));

    let returnValue;
    await act(async () => {
      returnValue = await result.current.runAction("Failing", async () => {
        throw new Error("Boom");
      });
    });

    expect(returnValue).toBe(false);
  });

  it("silently returns false for 401 errors without calling addToast", async () => {
    const addToast = vi.fn();
    const { result } = renderHook(() => useRunAction({ addToast }));

    let returnValue;
    await act(async () => {
      const err = new Error("Unauthorized");
      err.status = 401;
      returnValue = await result.current.runAction("Protected", async () => {
        throw err;
      });
    });

    expect(returnValue).toBe(false);
    expect(addToast).not.toHaveBeenCalled();
  });
});
