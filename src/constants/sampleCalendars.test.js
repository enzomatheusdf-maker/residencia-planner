import { getProviderSeed } from "../core/calendarProvider";
import { MEDREV_SAMPLE_CALENDAR } from "./sampleCalendars";

describe("sampleCalendars", () => {
  it("ships a short generic MedRev sample calendar", () => {
    expect(MEDREV_SAMPLE_CALENDAR.length).toBeGreaterThanOrEqual(2);
    expect(MEDREV_SAMPLE_CALENDAR.length).toBeLessThanOrEqual(8);
  });

  it("normalizes sample calendar topics for user_import provider", () => {
    const topics = getProviderSeed("user_import");
    expect(topics[0].providerId).toBe("user_import");
    expect(topics.every((topic) => topic.sourceType === "medrev_sample")).toBe(true);
  });
});
