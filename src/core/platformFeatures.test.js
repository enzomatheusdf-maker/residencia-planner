import { featureEnabled, getPlatformFeatures, PLATFORM } from "./platformFeatures";

describe("platformFeatures", () => {
  test("res mantém ENAMED e Raciocínio", () => {
    const features = getPlatformFeatures(PLATFORM.RES);
    expect(features.enamed).toBe(true);
    expect(features.raciocinioClinico).toBe(true);
  });

  test("vest desativa ENAMED e Raciocínio", () => {
    const features = getPlatformFeatures(PLATFORM.VEST);
    expect(features.enamed).toBe(false);
    expect(features.raciocinioClinico).toBe(false);
  });

  test("ambas plataformas mantêm Mentor/FSRS/Action Inbox", () => {
    const res = getPlatformFeatures(PLATFORM.RES);
    const vest = getPlatformFeatures(PLATFORM.VEST);
    ["mentor", "fsrs", "actionInbox"].forEach((key) => {
      expect(res[key]).toBe(true);
      expect(vest[key]).toBe(true);
    });
  });

  test("featureEnabled retorna boolean esperado", () => {
    expect(featureEnabled(PLATFORM.RES, "enamed")).toBe(true);
    expect(featureEnabled(PLATFORM.VEST, "enamed")).toBe(false);
    expect(featureEnabled(PLATFORM.VEST, "mentor")).toBe(true);
  });
});
