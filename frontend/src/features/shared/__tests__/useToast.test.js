import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToast } from "../useToast";

describe("useToast — initial state", () => {
  it("starts with empty toasts array", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });
});

describe("useToast — addToast", () => {
  it("adds a toast with correct message and type", () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.addToast("Saved successfully", "success");
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe("Saved successfully");
    expect(result.current.toasts[0].type).toBe("success");
  });

  it("ignores empty message", () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.addToast("", "info");
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it("defaults type to info when not specified", () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.addToast("Hello");
    });
    expect(result.current.toasts[0].type).toBe("info");
  });
});

describe("useToast — removeToast", () => {
  it("removes toast by id", () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.addToast("Test message", "info");
    });
    const id = result.current.toasts[0].id;
    act(() => {
      result.current.removeToast(id);
    });
    expect(result.current.toasts).toHaveLength(0);
  });
});
