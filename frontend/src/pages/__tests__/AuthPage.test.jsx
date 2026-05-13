import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AuthPage from "../AuthPage";

const baseProps = {
  authForm: {
    firstName: "", lastName: "", email: "",
    phoneNumber: "", countryCode: "+90",
    password: "", confirmPassword: "",
  },
  authErrors: {},
  authMode: "login",
  isBusy: false,
  setAuthForm: vi.fn(),
  setAuthErrors: vi.fn(),
  setAuthMode: vi.fn(),
  submitAuth: vi.fn((e) => e.preventDefault()),
  status: "",
};

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

// ── Render ────────────────────────────────────────────────────────────────────

describe("AuthPage — sign-in mode (default)", () => {
  it("renders welcome heading and email + password inputs", () => {
    render(<AuthPage {...baseProps} />);
    expect(screen.getByText("Welcome back.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  it("does not show first-name field in sign-in mode", () => {
    render(<AuthPage {...baseProps} />);
    expect(screen.queryByPlaceholderText("Ada")).not.toBeInTheDocument();
  });
});

describe("AuthPage — sign-up mode", () => {
  it("shows registration heading and extra fields when authMode is register", () => {
    render(<AuthPage {...baseProps} authMode="register" />);
    expect(screen.getByText("Create account.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ada")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Repeat password")).toBeInTheDocument();
  });
});

// ── Form submission ───────────────────────────────────────────────────────────

describe("AuthPage — form submission", () => {
  it("calls submitAuth when the form is submitted", () => {
    const submitAuth = vi.fn((e) => e.preventDefault());
    const { container } = render(<AuthPage {...baseProps} submitAuth={submitAuth} />);
    fireEvent.submit(container.querySelector("form"));
    expect(submitAuth).toHaveBeenCalledTimes(1);
  });
});

// ── Content ───────────────────────────────────────────────────────────────────

describe("AuthPage — editorial content", () => {
  it("shows 'Career Passport' feature card title", () => {
    render(<AuthPage {...baseProps} />);
    expect(screen.getByText("Career Passport")).toBeInTheDocument();
  });

  it("shows 'Live role matches' feature card title", () => {
    render(<AuthPage {...baseProps} />);
    expect(screen.getByText("Live role matches")).toBeInTheDocument();
  });

  it("shows 'Skill gap roadmap' feature card title", () => {
    render(<AuthPage {...baseProps} />);
    expect(screen.getByText("Skill gap roadmap")).toBeInTheDocument();
  });

  it("shows updated subtitle copy", () => {
    render(<AuthPage {...baseProps} />);
    expect(
      screen.getByText(/One place to manage your CV, match live roles/)
    ).toBeInTheDocument();
  });
});

// ── Form-switch transition ────────────────────────────────────────────────────

describe("AuthPage — form-switch crossfade", () => {
  it("adds is-switching class on toggle click and removes it after 250 ms", () => {
    vi.useFakeTimers();
    const { container } = render(<AuthPage {...baseProps} />);
    const signUpBtn = screen.getByRole("button", { name: "Sign up" });

    act(() => { fireEvent.click(signUpBtn); });
    expect(container.querySelector(".lat-auth-fields.is-switching")).not.toBeNull();

    act(() => { vi.advanceTimersByTime(260); });
    expect(container.querySelector(".lat-auth-fields.is-switching")).toBeNull();
  });
});

// ── prefers-reduced-motion CSS guard ─────────────────────────────────────────

describe("AuthPage — accessibility / reduced motion", () => {
  it("styles.css contains a prefers-reduced-motion block that disables lat-auth-brand animation", () => {
    const css = readFileSync(
      resolve(__dirname, "../../styles.css"),
      "utf-8"
    );
    const brandDef   = css.indexOf(".lat-auth-brand");
    const motionIdx  = css.lastIndexOf("prefers-reduced-motion");
    expect(brandDef).toBeGreaterThan(-1);
    expect(motionIdx).toBeGreaterThan(brandDef);
    // The reduced-motion block must reference .lat-auth-brand
    expect(css.slice(motionIdx)).toContain(".lat-auth-brand");
  });
});
