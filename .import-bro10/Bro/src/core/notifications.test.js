// src/core/notifications.test.js
import { isNotificationSupported, solicitarPermissao, dispararNotificacaoImediata, calcularDelayAteHorario } from "./notifications";

describe("notifications - calcularDelayAteHorario", () => {
  test("calculates a positive delay for future time", () => {
    const delay = calcularDelayAteHorario("23:59");
    expect(delay).toBeGreaterThan(0);
  });
});

describe("notifications - Notification API wrapping", () => {
  let originalNotification;

  beforeAll(() => {
    originalNotification = global.Notification;
  });

  afterAll(() => {
    global.Notification = originalNotification;
  });

  test("isNotificationSupported returns true if Notification is in global", () => {
    global.Notification = jest.fn();
    expect(isNotificationSupported()).toBe(true);
  });

  test("solicitarPermissao triggers Notification.requestPermission", async () => {
    const mockRequest = jest.fn().mockResolvedValue("granted");
    global.Notification = {
      requestPermission: mockRequest
    };

    const res = await solicitarPermissao();
    expect(mockRequest).toHaveBeenCalled();
    expect(res).toBe("granted");
  });

  test("dispararNotificacaoImediata creates a new Notification when granted", () => {
    const mockConstructor = jest.fn();
    global.Notification = mockConstructor;
    global.Notification.permission = "granted";

    dispararNotificacaoImediata("Teste", "Corpo");
    expect(mockConstructor).toHaveBeenCalledWith("Teste", {
      body: "Corpo",
      icon: "/logo192.png"
    });
  });
});
