import { getToneToken, toneNames, uiTokens } from "./uiTokens";

describe("uiTokens", () => {
  test("exposes the core premium token groups", () => {
    expect(uiTokens.colors.blue).toBe("#3b82f6");
    expect(uiTokens.surfaces.borderSubtle).toBe("rgba(255,255,255,.08)");
    expect(uiTokens.radius.lg).toBe(22);
    expect(uiTokens.shadows.card).toContain("rgba(0,0,0,.22)");
    expect(uiTokens.zIndex.modal).toBeGreaterThan(uiTokens.zIndex.overlay);
    expect(uiTokens.motion.durationSlow).toBe(260);
  });

  test("keeps tone lookup stable and falls back to neutral", () => {
    expect(toneNames).toEqual(["blue", "cyan", "green", "amber", "red", "purple", "neutral"]);
    expect(getToneToken("green")).toMatchObject({ color: "#10b981" });
    expect(getToneToken("missing")).toBe(getToneToken("neutral"));
  });
});
