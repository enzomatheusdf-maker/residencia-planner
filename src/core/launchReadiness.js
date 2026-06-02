function statusRank(status) {
  if (status === "fail") return 0;
  if (status === "warn") return 1;
  return 2;
}

function hasOpenMentorAction(actions = []) {
  return actions.some((action) => action && (action.status == null || action.status === "open" || action.status === "accepted"));
}

export function checkLaunchReadiness(context = {}) {
  const meta = context.meta || {};
  const onboarding = meta.onboarding || {};
  const enamedAnalises = Array.isArray(context.enamedAnalises) ? context.enamedAnalises : [];
  const actionInbox = Array.isArray(context.actionInbox) ? context.actionInbox : [];
  const calendarProvider = context.calendarProvider || {};
  const modules = meta.modulos || {};

  const checks = [
    {
      id: "onboarding",
      label: "Onboarding configurado",
      status: onboarding.completed === true ? "ok" : "warn",
      reason: onboarding.completed === true
        ? "Onboarding conclu\u00eddo."
        : "Onboarding ainda n\u00e3o conclu\u00eddo; o Mentor pode ter pouco contexto.",
    },
    {
      id: "calendar-provider",
      label: "Calend\u00e1rio-base selecionado",
      status: (calendarProvider.activeId || onboarding.calendarProvider) ? "ok" : "fail",
      reason: (calendarProvider.activeId || onboarding.calendarProvider)
        ? "Provider de calend\u00e1rio definido."
        : "Nenhum calend\u00e1rio-base selecionado.",
    },
    {
      id: "mentor-action",
      label: "Mentor gera a\u00e7\u00e3o principal",
      status: hasOpenMentorAction(actionInbox) ? "ok" : "warn",
      reason: hasOpenMentorAction(actionInbox)
        ? "H\u00e1 a\u00e7\u00e3o principal para hoje."
        : "Ainda sem a\u00e7\u00e3o principal dispon\u00edvel no Mentor.",
    },
    {
      id: "enamed",
      label: "ENAMED Intel dispon\u00edvel",
      status: modules.enamed === false ? "warn" : enamedAnalises.length > 0 ? "ok" : "warn",
      reason: modules.enamed === false
        ? "M\u00f3dulo ENAMED desativado."
        : enamedAnalises.length > 0
        ? "An\u00e1lise ENAMED registrada."
        : "ENAMED ativo, mas sem prova analisada.",
    },
    {
      id: "raciocinio",
      label: "Racioc\u00ednio Cl\u00ednico acess\u00edvel",
      status: modules.raciocinioClinico === true ? "ok" : "warn",
      reason: modules.raciocinioClinico === true
        ? "M\u00f3dulo de racioc\u00ednio habilitado."
        : "M\u00f3dulo de racioc\u00ednio ainda desativado.",
    },
    {
      id: "backup",
      label: "Backup/exporta\u00e7\u00e3o dispon\u00edvel",
      status: context.backupAvailable === false ? "fail" : "ok",
      reason: context.backupAvailable === false
        ? "Backup indispon\u00edvel neste ambiente."
        : "Exporta\u00e7\u00e3o de backup dispon\u00edvel.",
    },
  ];

  return checks;
}

export function summarizeLaunchRisks(checks = []) {
  const summary = { ok: 0, warn: 0, fail: 0 };
  checks.forEach((check) => {
    if (!check || !summary.hasOwnProperty(check.status)) return;
    summary[check.status] += 1;
  });

  return {
    ...summary,
    total: checks.length,
    overallStatus: summary.fail > 0 ? "fail" : summary.warn > 0 ? "warn" : "ok",
  };
}

export function getLaunchChecklistItems(context = {}) {
  const checks = checkLaunchReadiness(context);
  return checks
    .slice()
    .sort((a, b) => statusRank(a.status) - statusRank(b.status))
    .map((check) => ({
      ...check,
      priority: check.status === "fail" ? 3 : check.status === "warn" ? 2 : 1,
    }));
}
