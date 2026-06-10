export function isDevOnlyEnabled() {
  return process.env.NODE_ENV !== "production";
}

// Sombra FSRS canonico: ativa so em dev para nao computar overhead em producao.
// O DataSafetyPanel ja tem guard adicional com isDevOnlyEnabled().
export const FSRS_CANONICAL_SHADOW_ENABLED = process.env.NODE_ENV !== "production";

// P3 experimental: simulador what-if de carga/prova.
// Deve ser opt-in e nunca alterar agenda, FSRS ou ActionInbox padrao.
export const P3_WHAT_IF_ENABLED = process.env.REACT_APP_MEDREV_P3_WHAT_IF === "true";
