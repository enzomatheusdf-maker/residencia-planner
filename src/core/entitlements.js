// Centralized entitlement seams for future monetization.
// Launch atual: tudo liberado.
export function isPremium() {
  return true;
}

// FUTURO PREMIUM: múltiplos cronogramas.
export function canUseMultipleSchedules() {
  return isPremium();
}

// FUTURO PREMIUM: exportações.
export function canExportData() {
  return isPremium();
}

// FUTURO PREMIUM: cartão compartilhável.
export function canShareCard() {
  return isPremium();
}

// FUTURO PREMIUM: notificações avançadas.
export function canUseAdvancedNotifications() {
  return isPremium();
}
