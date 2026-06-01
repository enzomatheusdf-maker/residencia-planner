import { useMemo } from "react";
import { buildAuthSession } from "../core/authSession";
import { getAnonymousStorageKey, getOrCreateAnonymousSessionId, getUserScopedStorageKey } from "../core/userScope";

export function useAuthScope({ user, hydrated, lastHydratedAt, lastSyncAt }) {
  return useMemo(() => {
    const scopeKey = user?.uid
      ? getUserScopedStorageKey(user.uid)
      : getAnonymousStorageKey(getOrCreateAnonymousSessionId());
    return buildAuthSession({
      user: user || null,
      hydrated,
      scopeKey,
      lastHydratedAt: lastHydratedAt || null,
      lastSyncAt: lastSyncAt || null,
    });
  }, [user, hydrated, lastHydratedAt, lastSyncAt]);
}

export default useAuthScope;
