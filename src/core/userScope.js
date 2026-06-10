const APP_PREFIX = "medrev";
const USER_STATE_SUFFIX = "store";
const USER_COLLECTION = "usuarios";
let runtimeAnonymousSessionId = "";

function normalizeEnvironmentToken(value) {
  return String(value || "").trim().toLowerCase();
}

export function normalizeUid(uid) {
  return String(uid || "").trim();
}

export function assertUid(uid) {
  const normalized = normalizeUid(uid);
  if (!normalized) {
    throw new Error("Missing authenticated user uid");
  }
  return normalized;
}

function createAnonymousSessionId() {
  return `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getRuntimeAnonymousSessionId() {
  if (!runtimeAnonymousSessionId) {
    runtimeAnonymousSessionId = createAnonymousSessionId();
  }
  return runtimeAnonymousSessionId;
}

export function assertOwnerUidMatchesScope(ownerUid, scopedUid, context = "user state") {
  const owner = normalizeUid(ownerUid);
  const scoped = assertUid(scopedUid);

  if (!owner) return scoped;
  if (owner !== scoped) {
    throw new Error(`Owner scope mismatch in ${context}: owner=${owner} scoped=${scoped}`);
  }
  return scoped;
}

export function getAppEnvironment() {
  const explicitEnv = normalizeEnvironmentToken(
    process.env.REACT_APP_APP_ENV || process.env.REACT_APP_ENV
  );
  if (explicitEnv) return explicitEnv;

  const nodeEnv = normalizeEnvironmentToken(process.env.NODE_ENV);
  if (nodeEnv === "production") return "prod";
  if (nodeEnv === "test") return "test";

  const projectId = normalizeEnvironmentToken(process.env.REACT_APP_FIREBASE_PROJECT_ID);
  if (projectId.includes("prod")) return "prod";
  if (projectId.includes("staging")) return "staging";
  return "dev";
}

export function getUserScopedStorageKey(uid, env = getAppEnvironment()) {
  return `${APP_PREFIX}:${env}:user:${assertUid(uid)}:${USER_STATE_SUFFIX}`;
}

export function getAnonymousStorageKey(sessionId, env = getAppEnvironment()) {
  const normalized = String(sessionId || "").trim() || getRuntimeAnonymousSessionId();
  return `${APP_PREFIX}:${env}:anonymous:${normalized}:${USER_STATE_SUFFIX}`;
}

export function getOrCreateAnonymousSessionId(env = getAppEnvironment(), storage = null) {
  const store = storage || (typeof window !== "undefined" ? window.sessionStorage : null);
  if (!store) return getRuntimeAnonymousSessionId();

  const sessionKey = `${APP_PREFIX}:${env}:anonymous:session_id`;
  const existing = String(store.getItem(sessionKey) || "").trim();
  if (existing) return existing;

  const generated = createAnonymousSessionId();
  store.setItem(sessionKey, generated);
  return generated;
}

export function getUserRootPath(uid) {
  return [USER_COLLECTION, assertUid(uid)];
}

export function getUserStatePath(uid) {
  return [...getUserRootPath(uid)];
}

export function isSameUserScope(a, b) {
  return normalizeUid(a) !== "" && normalizeUid(a) === normalizeUid(b);
}

export function getLegacyGlobalStoreKeys() {
  return ["reviewflow-v6", "medrev-store", "residencia-planner", "medrev"];
}
