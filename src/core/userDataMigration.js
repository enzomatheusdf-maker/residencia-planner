import { assertUid, getLegacyGlobalStoreKeys, getUserScopedStorageKey } from "./userScope";
import { validatePersistedStateShape } from "./schemas/boundarySchemas";

function resolveStorage(storage) {
  if (storage) return storage;
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  return null;
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function resolveLegacyKeys(explicitKey) {
  if (explicitKey) return [explicitKey];
  return getLegacyGlobalStoreKeys();
}

export function detectLegacyGlobalStore(options = {}) {
  const storage = resolveStorage(options.storage);
  if (!storage) return { found: false, key: null, raw: null, parsed: null };

  const keys = resolveLegacyKeys(options.key);
  for (const key of keys) {
    const raw = storage.getItem(key);
    if (!raw) continue;
    const parsed = safeParse(raw);
    return { found: true, key, raw, parsed };
  }

  return { found: false, key: null, raw: null, parsed: null };
}

export function backupLegacyGlobalStore(options = {}) {
  const legacy = detectLegacyGlobalStore(options);
  if (!legacy.found) {
    return { ok: false, error: "legacy_store_not_found", backup: null };
  }

  return {
    ok: true,
    error: null,
    backup: {
      key: legacy.key,
      capturedAt: new Date().toISOString(),
      payload: legacy.raw,
    },
  };
}

export function migrateLegacyStoreToUserScope(uid, options = {}) {
  const storage = resolveStorage(options.storage);
  if (!storage) {
    return { ok: false, error: "storage_unavailable", migrated: false };
  }

  if (!options.confirm) {
    return { ok: false, error: "confirmation_required", migrated: false };
  }

  const normalizedUid = assertUid(uid);
  const legacy = detectLegacyGlobalStore({ storage, key: options.legacyKey });
  if (!legacy.found) {
    return { ok: false, error: "legacy_store_not_found", migrated: false };
  }

  const validation = validatePersistedStateShape(legacy.parsed);
  if (!validation.valid) {
    return {
      ok: false,
      error: "invalid_legacy_store",
      migrated: false,
      details: validation.errors,
    };
  }

  const targetKey = getUserScopedStorageKey(normalizedUid, options.env);
  const alreadyScoped = storage.getItem(targetKey);
  if (alreadyScoped && !options.overwrite) {
    return {
      ok: false,
      error: "target_scope_already_has_data",
      migrated: false,
      from: legacy.key,
      to: targetKey,
    };
  }

  storage.setItem(targetKey, legacy.raw);
  return {
    ok: true,
    error: null,
    migrated: true,
    from: legacy.key,
    to: targetKey,
  };
}

export function clearLegacyGlobalStoreAfterConfirm(options = {}) {
  const storage = resolveStorage(options.storage);
  if (!storage) {
    return { ok: false, error: "storage_unavailable", clearedKeys: [] };
  }

  if (!options.confirm) {
    return { ok: false, error: "confirmation_required", clearedKeys: [] };
  }

  const keys = resolveLegacyKeys(options.key);
  const clearedKeys = [];
  keys.forEach((key) => {
    if (storage.getItem(key) != null) {
      storage.removeItem(key);
      clearedKeys.push(key);
    }
  });

  return { ok: true, error: null, clearedKeys };
}
