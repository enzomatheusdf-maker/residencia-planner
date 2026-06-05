export function isDevOnlyEnabled() {
  return process.env.NODE_ENV !== "production";
}

export const FSRS_CANONICAL_SHADOW_ENABLED = true;
