import { isOnboardingComplete } from "./onboarding";
import { isVestibularStartComplete } from "./vestibularOnboarding";

export function shouldShowGlobalOnboarding(state = {}) {
  if (state.tourStep) return false;
  if (state.onboardingDone) return false;
  return !isOnboardingComplete(state.meta || {});
}

export function shouldShowVestibularStartTrail(state = {}) {
  if ((state.plat || "res") !== "vest") return false;
  if (shouldShowGlobalOnboarding(state)) return false;
  return !isVestibularStartComplete(state.meta || {});
}

export function shouldShowDailyBriefing(state = {}) {
  if (state.tourStep) return false;
  if (shouldShowGlobalOnboarding(state)) return false;
  if (shouldShowVestibularStartTrail(state)) return false;
  return true;
}

// ─── Onboarding v2 gates ──────────────────────────────────────────────────────

/**
 * Retorna true quando o planSetup foi concluído (version 2).
 * Veteranos (v1, sem planSetup) retornam false sem reabrir o wizard.
 */
export function isPlanSetupComplete(state = {}) {
  return !!state.meta?.planSetup?.completedAt;
}

/**
 * O wizard v2 deve aparecer somente quando:
 * - O onboarding global (v1) ainda não foi concluído, OU
 * - O onboarding v1 foi concluído mas a versão é < 2 e o usuário não é veterano
 *   com flag "skipV2" (opt-out).
 *
 * Veteranos (completed===true, sem planSetup e sem version:2) NÃO são
 * forçados ao wizard — recebem o banner opcional de migração.
 */
export function shouldShowOnboardingV2(state = {}) {
  if (state.tourStep) return false;

  const onboarding = state.meta?.onboarding || {};

  // Nunca mostramos v2 se o planSetup já existe
  if (isPlanSetupComplete(state)) return false;

  // Usuário já concluiu OU pulou o onboarding (v1 veterano ou v2 dispensado):
  // não forçar. Banner opcional de migração cuida do caso veterano.
  if (onboarding.completed === true) return false;
  if (onboarding.dismissedAt) return false;

  // Novo usuário (onboarding ainda não concluído nem pulado)
  return true;
}
