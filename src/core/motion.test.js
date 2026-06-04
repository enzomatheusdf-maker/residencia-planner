import { getStaggerStyle, prefersReducedMotion, withViewTransition } from "./motion";

describe("motion helpers", () => {
  const originalMatchMedia = window.matchMedia;
  const originalStartViewTransition = document.startViewTransition;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    document.startViewTransition = originalStartViewTransition;
    jest.restoreAllMocks();
  });

  test("detects reduced motion", () => {
    window.matchMedia = jest.fn(() => ({ matches: true }));
    expect(prefersReducedMotion()).toBe(true);
  });

  test("runs callback without ViewTransition when reduced motion is enabled", () => {
    window.matchMedia = jest.fn(() => ({ matches: true }));
    const fn = jest.fn(() => "ok");
    document.startViewTransition = jest.fn();
    expect(withViewTransition(fn)).toBe("ok");
    expect(document.startViewTransition).not.toHaveBeenCalled();
  });

  test("uses ViewTransition when available", () => {
    window.matchMedia = jest.fn(() => ({ matches: false }));
    const fn = jest.fn();
    document.startViewTransition = jest.fn((callback) => {
      callback();
      return "transition";
    });
    expect(withViewTransition(fn)).toBe("transition");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("returns stable stagger styles", () => {
    expect(getStaggerStyle(0)).toEqual({});
    expect(getStaggerStyle(3, 25)).toEqual({ animationDelay: "75ms" });
    expect(getStaggerStyle(-1)).toEqual({});
  });
});
