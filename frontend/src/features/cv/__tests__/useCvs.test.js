import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCvs } from "../useCvs";

vi.mock("../../../services/careerService", () => ({
  listCvs: vi.fn(),
  createCvProfile: vi.fn(),
  updateCv: vi.fn(),
  deleteCv: vi.fn(),
  createCvVersion: vi.fn(),
  compareCvProfiles: vi.fn(),
  generateCv: vi.fn(),
}));

import { listCvs, createCvProfile, deleteCv } from "../../../services/careerService";

// runAction that mirrors the real hook: directly awaits the fn
const runAction = async (_label, fn) => {
  await fn();
};
const setStatus = vi.fn();
const mockUser = { _id: "user1" };
const mockPassport = { skills: ["JS"] };

beforeEach(() => {
  vi.clearAllMocks();
  listCvs.mockResolvedValue({ data: [] });
});

describe("useCvs — initial state", () => {
  it("starts with empty cvs array when user is null", () => {
    const { result } = renderHook(() =>
      useCvs({ user: null, passport: mockPassport, runAction, setStatus })
    );
    expect(result.current.cvs).toEqual([]);
    expect(result.current.selectedCvId).toBe("");
  });

  it("starts with null editingCvId", () => {
    const { result } = renderHook(() =>
      useCvs({ user: null, passport: mockPassport, runAction, setStatus })
    );
    expect(result.current.editingCvId).toBeNull();
  });

  it("starts with null cvComparison", () => {
    const { result } = renderHook(() =>
      useCvs({ user: null, passport: mockPassport, runAction, setStatus })
    );
    expect(result.current.cvComparison).toBeNull();
  });
});

describe("useCvs — loadCvs", () => {
  it("sets cvs from API response", async () => {
    const mockCvs = [{ _id: "cv1", title: "Test CV" }];
    listCvs.mockResolvedValue({ data: mockCvs });

    const { result } = renderHook(() =>
      useCvs({ user: null, passport: mockPassport, runAction, setStatus })
    );

    await act(async () => {
      await result.current.loadCvs();
    });

    expect(result.current.cvs).toEqual(mockCvs);
  });

  it("auto-selects first CV when none selected", async () => {
    const mockCvs = [{ _id: "cv1" }, { _id: "cv2" }];
    listCvs.mockResolvedValue({ data: mockCvs });

    const { result } = renderHook(() =>
      useCvs({ user: null, passport: mockPassport, runAction, setStatus })
    );

    await act(async () => {
      await result.current.loadCvs();
    });

    expect(result.current.selectedCvId).toBe("cv1");
  });

  it("sets cvs to empty array when API returns empty data", async () => {
    listCvs.mockResolvedValue({ data: [] });

    const { result } = renderHook(() =>
      useCvs({ user: null, passport: mockPassport, runAction, setStatus })
    );

    await act(async () => {
      await result.current.loadCvs();
    });

    expect(result.current.cvs).toEqual([]);
    expect(result.current.selectedCvId).toBe("");
  });

  it("auto-loads CVs when user becomes truthy", async () => {
    const mockCvs = [{ _id: "cv1" }];
    listCvs.mockResolvedValue({ data: mockCvs });

    const { result } = renderHook(() =>
      useCvs({ user: mockUser, passport: mockPassport, runAction, setStatus })
    );

    // Wait for useEffect auto-load
    await act(async () => {});

    expect(listCvs).toHaveBeenCalled();
  });
});

describe("useCvs — selectedCv derived value", () => {
  it("returns the CV object matching selectedCvId", async () => {
    const mockCvs = [{ _id: "cv1", title: "First CV" }, { _id: "cv2", title: "Second CV" }];
    listCvs.mockResolvedValue({ data: mockCvs });

    const { result } = renderHook(() =>
      useCvs({ user: null, passport: mockPassport, runAction, setStatus })
    );

    await act(async () => {
      await result.current.loadCvs();
    });

    // selectedCvId is auto-set to cv1
    expect(result.current.selectedCv).toEqual({ _id: "cv1", title: "First CV" });
  });
});

describe("useCvs — loadCvIntoForm", () => {
  it("sets editingCvId when loading a CV into form", async () => {
    const mockCvs = [{ _id: "cv1", title: "My CV", skills: ["JS"], projects: [], experience: [], education: [], certifications: [] }];
    listCvs.mockResolvedValue({ data: mockCvs });

    const { result } = renderHook(() =>
      useCvs({ user: null, passport: mockPassport, runAction, setStatus })
    );

    await act(async () => {
      await result.current.loadCvs();
    });

    act(() => {
      result.current.loadCvIntoForm(mockCvs[0]);
    });

    expect(result.current.editingCvId).toBe("cv1");
  });
});

describe("useCvs — clearEditMode", () => {
  it("clears editingCvId", async () => {
    const mockCvs = [{ _id: "cv1", title: "My CV", skills: [], projects: [], experience: [], education: [], certifications: [] }];
    listCvs.mockResolvedValue({ data: mockCvs });

    const { result } = renderHook(() =>
      useCvs({ user: null, passport: mockPassport, runAction, setStatus })
    );

    await act(async () => {
      await result.current.loadCvs();
    });

    act(() => {
      result.current.loadCvIntoForm(mockCvs[0]);
    });

    expect(result.current.editingCvId).toBe("cv1");

    act(() => {
      result.current.clearEditMode();
    });

    expect(result.current.editingCvId).toBeNull();
  });
});
