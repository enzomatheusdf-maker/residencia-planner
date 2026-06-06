export function isDevOnlyEnabled() {
  return process.env.NODE_ENV !== "production";
}

// Sombra FSRS canonico: ativa so em dev para nao computar overhead em producao.
// O DataSafetyPanel ja tem guard adicional com isDevOnlyEnabled().
export const FSRS_CANONICAL_SHADOW_ENABLED = process.env.NODE_ENV !== "production";
