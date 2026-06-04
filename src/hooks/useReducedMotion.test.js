import { renderHook } from "@testing-library/react";
import useReducedMotion from "./useReducedMotion";

describe("useReducedMotion", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  test("returns false without a matching preference", () => {
    window.matchMedia = jest.fn(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  test("returns true when reduced motion is requested", () => {
    window.matchMedia = jest.fn(() => ({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});
