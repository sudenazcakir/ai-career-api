import "@testing-library/jest-dom";

// ── Browser APIs missing from jsdom ──────────────────────────────────────────
// AuthPage canvas animation uses matchMedia, ResizeObserver, rAF, and canvas
// getContext — none exist in jsdom. Plain stubs (no vi.fn() needed here).

Object.defineProperty(globalThis, "matchMedia", {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    addEventListener: () => { /* stub */ },
    removeEventListener: () => { /* stub */ },
  }),
});

globalThis.ResizeObserver = class ResizeObserver {
  observe() { /* stub */ }
  unobserve() { /* stub */ }
  disconnect() { /* stub */ }
};

// No-op rAF: prevents the draw loop from running during tests
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => { /* stub */ };

// Canvas 2D context stub — only setTransform is called before the first rAF
HTMLCanvasElement.prototype.getContext = () => ({
  clearRect() {},
  beginPath() {},
  moveTo() {},
  arc() {},
  fill() {},
  setTransform() {},
  fillStyle: "",
  globalAlpha: 1,
});
