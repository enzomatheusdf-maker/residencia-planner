import {
  userStatePath,
  userActivityPath,
  userBackupPath,
  userCalendarImportPath,
  userTelemetryPath,
} from "./userDataPaths";

describe("userDataPaths", () => {
  test("state path inclui uid", () => {
    expect(userStatePath("u1")).toEqual(["usuarios", "u1"]);
  });

  test("activity path inclui uid", () => {
    expect(userActivityPath("u1")).toEqual(["usuarios", "u1", "activityLog"]);
  });

  test("backup path inclui uid", () => {
    expect(userBackupPath("u1")).toEqual(["usuarios", "u1", "backups"]);
  });

  test("calendar imports path inclui uid", () => {
    expect(userCalendarImportPath("u1")).toEqual(["usuarios", "u1", "calendarImports"]);
  });

  test("telemetry path inclui uid", () => {
    expect(userTelemetryPath("u1")).toEqual(["usuarios", "u1", "telemetry"]);
  });

  test("uid obrigatorio", () => {
    expect(() => userStatePath("")).toThrow("Missing authenticated user uid");
  });
});
