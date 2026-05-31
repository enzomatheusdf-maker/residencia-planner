export const MEDREV_BACKUP_VERSION = "reviewflow-v6-backup";

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

export function exportMedrevBackup(state = {}) {
  return {
    version: MEDREV_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    plat: state.plat ?? "res",
    userName: state.userName ?? "Estudante",
    userEmail: state.userEmail ?? "",
    meta: state.meta ?? {},
    res: state.res ?? { temas: [], simulados: [], ankiLog: [], cronogramas: [], casosProgresso: {} },
    vest: state.vest ?? { temas: [], simulados: [], ankiLog: [], cronogramas: [], casosProgresso: {} },
    onboardingDone: state.onboardingDone ?? false,
    focusMode: state.focusMode ?? false,
    modoSimples: state.modoSimples ?? true,
    mentorMode: state.mentorMode ?? true,
    modoProva: state.modoProva ?? false,
    enamedAnalises: state.enamedAnalises ?? [],
    actionInboxState: state.actionInboxState ?? { dismissed: {}, accepted: {}, done: {} },
    sessionReflections: state.sessionReflections ?? [],
    weeklyReviews: state.weeklyReviews ?? [],
    brainDumpD1Data: state.brainDumpD1Data ?? {},
    temaStats: state.temaStats ?? {},
    vistos: state.vistos ?? [],
    gamif: state.gamif ?? {},
    calendarProvider: state.calendarProvider ?? { activeId: "medcof", importedTopics: [], customTopics: [] },
    cronogramaSel: state.cronogramaSel ?? { res: "res-medcof-2026", vest: "vest-base" },
    sprint: state.sprint ?? { esps: [], ativa: false, semana: "" },
  };
}

export function validateMedrevBackup(backup) {
  const errors = [];
  const warnings = [];

  if (!isObject(backup)) {
    return { valid: false, errors: ["Estrutura de backup invalida."], warnings, summary: null };
  }

  if (!backup.version || typeof backup.version !== "string") {
    errors.push("Campo 'version' ausente.");
  } else if (!backup.version.startsWith("reviewflow-v6-backup")) {
    warnings.push("Versao de backup diferente da esperada.");
  }

  if (!isObject(backup.meta)) errors.push("Campo 'meta' invalido.");
  if (!isObject(backup.res)) errors.push("Campo 'res' invalido.");
  if (!isObject(backup.vest)) errors.push("Campo 'vest' invalido.");

  const resTemas = Array.isArray(backup.res?.temas) ? backup.res.temas.length : 0;
  const vestTemas = Array.isArray(backup.vest?.temas) ? backup.vest.temas.length : 0;
  const reflections = Array.isArray(backup.sessionReflections) ? backup.sessionReflections.length : 0;
  const weeklyReviews = Array.isArray(backup.weeklyReviews) ? backup.weeklyReviews.length : 0;

  const summary = {
    userName: backup.userName || "Estudante",
    temas: resTemas + vestTemas,
    sessionReflections: reflections,
    weeklyReviews,
    exportedAt: backup.exportedAt || null,
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary,
  };
}

export function importMedrevBackup(backup, options = {}) {
  const preserveLocalMeta = Boolean(options.preserveLocalMeta);
  const validated = validateMedrevBackup(backup);
  if (!validated.valid) {
    return { ok: false, errors: validated.errors, patch: null };
  }

  const patch = {
    plat: backup.plat ?? "res",
    userName: backup.userName ?? "Estudante",
    userEmail: backup.userEmail ?? "",
    meta: backup.meta ?? {},
    res: backup.res ?? { temas: [], simulados: [], ankiLog: [], cronogramas: [], casosProgresso: {} },
    vest: backup.vest ?? { temas: [], simulados: [], ankiLog: [], cronogramas: [], casosProgresso: {} },
    onboardingDone: backup.onboardingDone ?? false,
    focusMode: backup.focusMode ?? false,
    modoSimples: backup.modoSimples ?? true,
    mentorMode: backup.mentorMode ?? true,
    modoProva: backup.modoProva ?? false,
    enamedAnalises: backup.enamedAnalises ?? [],
    actionInboxState: backup.actionInboxState ?? { dismissed: {}, accepted: {}, done: {} },
    sessionReflections: backup.sessionReflections ?? [],
    weeklyReviews: backup.weeklyReviews ?? [],
    brainDumpD1Data: backup.brainDumpD1Data ?? {},
    temaStats: backup.temaStats ?? {},
    vistos: backup.vistos ?? [],
    gamif: backup.gamif ?? {},
    calendarProvider: backup.calendarProvider ?? { activeId: "medcof", importedTopics: [], customTopics: [] },
    cronogramaSel: backup.cronogramaSel ?? { res: "res-medcof-2026", vest: "vest-base" },
    sprint: backup.sprint ?? { esps: [], ativa: false, semana: "" },
  };

  if (preserveLocalMeta && isObject(options.currentMeta)) {
    patch.meta = { ...options.currentMeta, ...patch.meta };
  }

  return { ok: true, errors: [], patch };
}

