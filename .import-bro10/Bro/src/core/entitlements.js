// FUTURO PREMIUM: centralizar capacidades para evitar retrabalho quando houver plano freemium.
export function isPremium() {
  return true;
}

export function canUseMultipleCronogramas() {
  // FUTURO PREMIUM
  return isPremium();
}

export function canExportAssets() {
  // FUTURO PREMIUM
  return isPremium();
}

export function canUseAdvancedNotifications() {
  // FUTURO PREMIUM
  return isPremium();
}
