import {
  normalizeUid,
  getAnonymousStorageKey,
  getOrCreateAnonymousSessionId,
  getUserScopedStorageKey,
} from "./userScope";

const AUTH_STATUS = {
  LOADING: "loading",
  AUTHENTICATED: "authenticated",
  ANONYMOUS: "anonymous",
  SIGNED_OUT: "signed_out",
};

export function getAuthStatusConstants() {
  return AUTH_STATUS;
}

export function getInitialAuthSession() {
  return {
    uid: null,
    email: null,
    status: AUTH_STATUS.LOADING,
    hydrated: false,
    scopeKey: getAnonymousStorageKey(getOrCreateAnonymousSessionId()),
    lastHydratedAt: null,
    lastSyncAt: null,
  };
}

export function resolveAuthStatus(user) {
  if (!user) return AUTH_STATUS.SIGNED_OUT;
  return AUTH_STATUS.AUTHENTICATED;
}

export function buildAuthSession({ user, hydrated = false, scopeKey = null, lastHydratedAt = null, lastSyncAt = null }) {
  const uid = normalizeUid(user?.uid);
  const status = resolveAuthStatus(user);
  const resolvedScopeKey = scopeKey || (uid ? getUserScopedStorageKey(uid) : getAnonymousStorageKey(getOrCreateAnonymousSessionId()));
  return {
    uid: uid || null,
    email: user?.email || null,
    status,
    hydrated: Boolean(hydrated),
    scopeKey: resolvedScopeKey,
    lastHydratedAt,
    lastSyncAt,
  };
}

export function assertActiveUserScope(activeUid, currentUid) {
  const active = normalizeUid(activeUid);
  const current = normalizeUid(currentUid);

  if (!active || !current) {
    throw new Error("Missing user scope while synchronizing state");
  }

  if (active !== current) {
    throw new Error(`User scope mismatch: active=${active} current=${current}`);
  }

  return active;
}
