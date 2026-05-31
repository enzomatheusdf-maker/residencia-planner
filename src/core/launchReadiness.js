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
        ? "Onboarding concluido."
        : "Onboarding ainda nao concluido; o Mentor pode ter pouco contexto.",
    },
    {
      id: "calendar-provider",
      label: "Calendario-base selecionado",
      status: (calendarProvider.activeId || onboarding.calendarProvider) ? "ok" : "fail",
      reason: (calendarProvider.activeId || onboarding.calendarProvider)
        ? "Provider de calendario definido."
        : "Nenhum calendario-base selecionado.",
    },
    {
      id: "mentor-action",
      label: "Mentor gera acao principal",
      status: hasOpenMentorAction(actionInbox) ? "ok" : "warn",
      reason: hasOpenMentorAction(actionInbox)
        ? "Ha acao principal para hoje."
        : "Ainda sem acao principal disponivel no Mentor.",
    },
    {
      id: "enamed",
      label: "ENAMED Intel disponivel",
      status: modules.enamed === false ? "warn" : enamedAnalises.length > 0 ? "ok" : "warn",
      reason: modules.enamed === false
        ? "Modulo ENAMED desativado."
        : enamedAnalises.length > 0
        ? "Analise ENAMED registrada."
        : "ENAMED ativo, mas sem prova analisada.",
    },
    {
      id: "raciocinio",
      label: "Raciocinio Clinico acessivel",
      status: modules.raciocinioClinico === true ? "ok" : "warn",
      reason: modules.raciocinioClinico === true
        ? "Modulo de raciocinio habilitado."
        : "Modulo de raciocinio ainda desativado.",
    },
    {
      id: "backup",
      label: "Backup/exportacao disponivel",
      status: context.backupAvailable === false ? "fail" : "ok",
      reason: context.backupAvailable === false
        ? "Backup indisponivel neste ambiente."
        : "Exportacao de backup disponivel.",
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
