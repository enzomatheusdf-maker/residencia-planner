// src/core/notifications.js

/**
 * Verifica se a Notification API é suportada pelo navegador do usuário.
 */
export function isNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Solicita permissão para exibir notificações.
 */
export async function solicitarPermissao() {
  if (!isNotificationSupported()) return "unsupported";
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    return "denied";
  }
}

/**
 * Dispara uma notificação imediata caso haja permissão concedida.
 */
export function dispararNotificacaoImediata(titulo, corpo) {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === "granted") {
    try {
      new Notification(titulo, {
        body: corpo,
        icon: "/logo192.png",
      });
      return true;
    } catch (e) {
      console.warn("Erro ao disparar notificação imediata:", e);
    }
  }
  return false;
}

/**
 * Calcula os milissegundos restantes até o próximo horário especificado (HH:MM).
 */
export function calcularDelayAteHorario(horaStr) {
  if (!horaStr) return 0;
  const [horas, minutos] = horaStr.split(":").map(Number);
  
  const agora = new Date();
  const proximo = new Date();
  proximo.setHours(horas, minutos, 0, 0);

  // Se o horário já passou hoje, agenda para amanhã
  if (proximo.getTime() <= agora.getTime()) {
    proximo.setDate(proximo.getDate() + 1);
  }

  return proximo.getTime() - agora.getTime();
}

// Armazena a referência do timer ativo de agendamento local
let activeNotificationTimeout = null;

/**
 * Agenda um lembrete local recorrente para disparar todos os dias no horário desejado.
 */
export function agendarLembreteDiario(horaStr, titulo, mensagem) {
  if (!isNotificationSupported()) return null;
  if (activeNotificationTimeout) {
    clearTimeout(activeNotificationTimeout);
  }

  const delay = calcularDelayAteHorario(horaStr);
  if (delay <= 0) return null;

  activeNotificationTimeout = setTimeout(() => {
    dispararNotificacaoImediata(titulo, mensagem);
    // Re-agenda recursivamente para o dia seguinte
    agendarLembreteDiario(horaStr, titulo, mensagem);
  }, delay);

  return activeNotificationTimeout;
}

/**
 * Cancela qualquer agendamento de notificação ativo na memória local.
 */
export function cancelarLembreteAgendado() {
  if (activeNotificationTimeout) {
    clearTimeout(activeNotificationTimeout);
    activeNotificationTimeout = null;
  }
}
