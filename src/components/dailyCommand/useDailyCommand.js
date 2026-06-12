import { useCallback, useEffect, useMemo, useRef } from "react";
import { useStore } from "../../core/store";
import { DECISION_CORE_ENGINE_VERSION } from "../../core/decisionCore";
import { buildPendingClosureCommand, legacyActionToDailyCommand } from "../../core/dailyCommandEngine";
import { executeDailyCommandTarget } from "../../core/dailyCommandTargetExecutor";
import { getEstimatedMinutesForStep, todayStr } from "../../core/fsrs";
import { safeTrackEvent } from "../../core/telemetry";

function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
}

function getCommandBadge(command = {}) {
  const type = command.type || command.legacyAction?.type || "";
  if (type.includes("clinical")) return "Caso";
  if (type.includes("simulation")) return "Simulado";
  if (type.includes("anki")) return "Anki";
  if (type.includes("adjust")) return "Plano";
  if (type.includes("overdue")) return "Vencida";
  if (type.includes("review")) return "Revisão";
  return "Agora";
}

function getInboxBadge(action = {}) {
  const type = action.type || "";
  if (type.includes("clinical")) return "Caso";
  if (type.includes("exam") || type.includes("simulation")) return "Simulado";
  if (type.includes("anki")) return "Anki";
  if (type.includes("rest")) return "Pausa";
  if (type.includes("review") || type.includes("revisao") || type.includes("fila")) return "Revisão";
  return "Ação";
}

function getAgendaTaskTitle(item = {}) {
  const temaNome = item.temaNome || item.title || item.nome || "tarefa";
  if (item.type === "simulation") return `Registrar ${temaNome}`;
  if (item.type === "new_topic" || item.type === "d0_critical") return `Estudar ${temaNome}`;
  if (item.type === "relearning") return `Reaprender ${temaNome}`;
  return `Revisar ${temaNome}`;
}

function normalizeTaskKey(task = {}) {
  return [
    task.kind || "",
    task.targetId || "",
    task.title || "",
    task.badge || "",
  ].join("|").toLowerCase();
}

function buildOrderedDailyTasks({ command, queueItems = [], actionInbox = [], agendaItems = [] } = {}) {
  const tasks = [];
  const pushTask = (task) => {
    if (!task?.title) return;
    const key = normalizeTaskKey(task);
    if (tasks.some((item) => normalizeTaskKey(item) === key)) return;
    tasks.push({ ...task, id: task.id || key });
  };

  if (command?.title) {
    pushTask({
      kind: "command",
      title: command.title,
      detail: command.subtitle || command.reason || "Próxima ação recomendada pelo Mentor.",
      badge: getCommandBadge(command),
      minutes: command.estimatedMinutes || null,
      targetId: command.id || command.type || "command",
      tone: command.tone || "blue",
    });
  }

  queueItems.forEach((item) => {
    const stepKey = item.step?.key || item.stepKey || "";
    pushTask({
      kind: "review",
      title: `Revisar ${item.temaNome || "tema"}`,
      detail: item.overdue ? "Revisão vencida" : "Revisão programada para hoje",
      badge: stepKey ? stepKey.toUpperCase() : "Revisão",
      minutes: item.estimatedMinutes || null,
      targetId: `${item.temaId || ""}:${stepKey}`,
      tone: item.overdue ? "amber" : "blue",
    });
  });

  actionInbox
    .filter((action) => action.status !== "done" && action.status !== "dismissed")
    .forEach((action) => {
      pushTask({
        kind: "inbox",
        title: action.title,
        detail: action.reason || action.subtitle || "Ação aberta do plano.",
        badge: getInboxBadge(action),
        minutes: action.estimatedMinutes || null,
        targetId: action.id || action.legacyId || action.title,
        tone: action.priority >= 95 ? "amber" : "blue",
      });
    });

  agendaItems.forEach((item) => {
    const stepKey = item.stepKey || "";
    pushTask({
      kind: "agenda",
      title: getAgendaTaskTitle(item),
      detail: item.overdue ? "Atrasada na agenda" : item.area || "Agenda de hoje",
      badge: stepKey ? stepKey.toUpperCase() : item.type === "simulation" ? "Simulado" : "Agenda",
      minutes: item.estimatedMinutes || null,
      targetId: item.id || `${item.temaId || ""}:${stepKey}`,
      tone: item.overdue ? "amber" : "blue",
    });
  });

  return tasks.slice(0, 8);
}

// CC-7: detecta rollover de dia e dispara mentor_action_ignored para comandos vistos mas não iniciados
function dispatchIgnoredOnRollover(plat, telemetryMeta) {
  const { mentorEvents = [], recordMentorEvent } = useStore.getState();
  const today = todayStr();

  const priorSeenEvents = mentorEvents.filter(
    (e) => e.eventType === "seen" && e.plat === plat && e.date < today
  );

  priorSeenEvents.forEach((seenEvent) => {
    const hasStarted = mentorEvents.some(
      (e) =>
        e.eventType === "started" &&
        e.plat === seenEvent.plat &&
        e.date === seenEvent.date &&
        e.action_type === seenEvent.action_type
    );
    const alreadyIgnored = mentorEvents.some(
      (e) =>
        e.eventType === "ignored" &&
        e.plat === seenEvent.plat &&
        e.date === seenEvent.date &&
        e.action_type === seenEvent.action_type
    );
    if (hasStarted || alreadyIgnored) return;

    const hoursVisible = seenEvent.seenAt
      ? Math.min(48, Math.round((Date.now() - new Date(seenEvent.seenAt).getTime()) / 3600000))
      : 24;
    safeTrackEvent(
      "mentor_action_ignored",
      {
        plat: seenEvent.plat,
        action_type: seenEvent.action_type,
        source: seenEvent.source || "mentor",
        hours_visible: hoursVisible,
      },
      { state: { meta: telemetryMeta } }
    );
    recordMentorEvent({
      eventType: "ignored",
      date: seenEvent.date,
      plat: seenEvent.plat,
      action_type: seenEvent.action_type,
      source: seenEvent.source || "mentor",
    });
  });
}

export function useDailyCommand({
  plat,
  pending,
  exibidosHojeMinutes,
  exibidosHoje,
  temasFiltrados,
  pendingClosure,
  hasPendingClosure,
  resumeFocusTarget,
  topFilaItem,
  concluidosHoje,
  onStudy,
  setView,
  onOpenAjustes,
  onOpenAgenda,
  onOpenClinicalCase,
  rebalanceTodayWorkload,
  showToast,
  showToastGlobal,
  freshnessDeps = {},
}) {
  const ensureFreshDecisionSnapshot = useStore((s) => s.ensureFreshDecisionSnapshot);
  const actionInbox = useStore((s) => s.actionInbox || []);
  const decisionSnapshot = useStore((s) => s.decisionSnapshot);
  const telemetryMeta = useStore((s) => s.meta);
  const recordMentorEvent = useStore((s) => s.recordMentorEvent);
  const lastMentorSeenRef = useRef("");
  const rolledOverRef = useRef(false);

  // CC-7: detecta rollover uma única vez por mount
  useEffect(() => {
    if (rolledOverRef.current) return;
    rolledOverRef.current = true;
    dispatchIgnoredOnRollover(plat, useStore.getState().meta);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ensureFreshDecisionSnapshot) return;
    ensureFreshDecisionSnapshot("dashboard_command_mount");
  }, [
    ensureFreshDecisionSnapshot,
    plat,
    pending,
    freshnessDeps.overdueCount,
    freshnessDeps.dataProva,
    freshnessDeps.enamedAnalisesCount,
    freshnessDeps.sessionReflectionsCount,
  ]);

  const activeDecisionSnapshot = decisionSnapshot?.plat === plat ? decisionSnapshot : null;
  const isSnapshotUsable = Boolean(
    activeDecisionSnapshot
      && activeDecisionSnapshot.forDate === todayStr()
      && activeDecisionSnapshot.engineVersion === DECISION_CORE_ENGINE_VERSION
  );
  const defensiveQueueFallback = useMemo(() => {
    if (isSnapshotUsable || pending <= 0) return null;
    return {
      id: `mentor_fila_do_dia_${plat}`,
      type: "fila_do_dia",
      priority: 88,
      title: "Fechar fila de hoje",
      subtitle: `${pending} ${pluralize(pending, "revisão", "revisões")} para hoje.`,
      reason: "Fechar a fila diária mantém ritmo e evita acúmulo amanhã.",
      explain: [
        `Carga estimada hoje: ${exibidosHojeMinutes || 0} minutos.`,
        "Constância diária mantém o plano previsível.",
      ],
      cta: "Executar fila de hoje",
      ctaView: "dash",
      estimatedMinutes: Math.max(20, exibidosHojeMinutes || 20),
      confidence: 0.85,
      safety: "ok",
      source: "dashboard-defensive-fallback",
      target: { action: "close_today_queue", plat },
    };
  }, [exibidosHojeMinutes, isSnapshotUsable, pending, plat]);
  const activeMentorAction = activeDecisionSnapshot?.primaryAction || null;
  const activeDailyCommand = activeDecisionSnapshot?.dailyCommand || null;
  const mentorNextAction = isSnapshotUsable ? activeMentorAction : defensiveQueueFallback;
  const mentorTodayPlan = useMemo(
    () => (isSnapshotUsable && Array.isArray(activeDecisionSnapshot?.todayPlan) ? activeDecisionSnapshot.todayPlan : []),
    [activeDecisionSnapshot?.todayPlan, isSnapshotUsable]
  );
  const decisionContext = isSnapshotUsable ? activeDecisionSnapshot?.context || null : null;
  const agendaTodaySummary = isSnapshotUsable ? activeDecisionSnapshot?.context?.agendaTodaySummary || null : null;

  const command = useMemo(() => {
    if (hasPendingClosure) {
      const pendingCommand = buildPendingClosureCommand(pendingClosure, decisionContext || { plat });
      return {
        eyebrow: "Alerta do Mentor",
        title: pendingCommand.title,
        subtitle: pendingCommand.subtitle,
        primaryLabel: pendingCommand.primaryLabel,
        secondaryLabel: pendingCommand.secondaryLabel,
        tone: pendingCommand.tone,
        action: pendingCommand,
      };
    }
    const fallbackCommand = !isSnapshotUsable && mentorNextAction
      ? legacyActionToDailyCommand(mentorNextAction, decisionContext || { plat })
      : null;
    const resolvedSnapshotCommand = isSnapshotUsable ? activeDailyCommand : fallbackCommand;
    const shouldResumeSession =
      resumeFocusTarget &&
      resolvedSnapshotCommand?.target?.route === "focus" &&
      (resolvedSnapshotCommand?.target?.params?.mode === "queue" || resolvedSnapshotCommand?.legacyAction?.ctaView === "focus");
    const resolvedCommand = shouldResumeSession
      ? {
        ...resolvedSnapshotCommand,
        subtitle: `Retomar ${resumeFocusTarget.temaNome} na etapa ${String(resumeFocusTarget.stepKey).toUpperCase()}.`,
        primaryLabel: "Retomar sessão",
        target: {
          route: "focus",
          params: { temaId: resumeFocusTarget.temaId, stepKey: resumeFocusTarget.stepKey },
        },
      }
      : resolvedSnapshotCommand;
    return {
      eyebrow: "Comando do dia",
      title: resolvedCommand?.title || "Manter consistência leve",
      subtitle: resolvedCommand?.subtitle || resolvedCommand?.reason || mentorTodayPlan.slice(1).join(" ") || "Sem urgência crítica detectada. Siga o plano com ritmo sustentável.",
      primaryLabel: resolvedCommand?.primaryLabel || "Executar ação",
      secondaryLabel: resolvedCommand?.secondaryLabel || "Ver por quê",
      tone: resolvedCommand?.tone || "blue",
      action: resolvedCommand,
    };
  }, [activeDailyCommand, decisionContext, hasPendingClosure, isSnapshotUsable, mentorNextAction, mentorTodayPlan, pendingClosure, plat, resumeFocusTarget]);

  const execute = useCallback(() => {
    const action = command.action || {};
    const actionType = action.type || action.target?.route || "mentor";
    safeTrackEvent(
      "mentor_action_started",
      { plat, action_type: actionType, source: action.source || "mentor" },
      { state: { meta: telemetryMeta } }
    );
    // CC-7: persiste started para taxa de execução
    recordMentorEvent?.({
      eventType: "started",
      date: todayStr(),
      plat,
      action_type: actionType,
      source: action.source || "mentor",
    });
    const executionResult = executeDailyCommandTarget(action, {
      onStudy,
      setView,
      onOpenAjustes,
      onOpenAgenda,
      onOpenClinicalCase,
      openSessionClosure: freshnessDeps.openSessionClosure,
      rebalanceTodayWorkload,
      plat,
      showToast: showToast || showToastGlobal,
      queueItem: topFilaItem,
    });
    if (executionResult?.outcome !== "handled") {
      safeTrackEvent(
        "mentor_action_target_missing",
        {
          plat,
          route: executionResult?.route || action.target?.route || "unknown",
          outcome: executionResult?.outcome || "unknown_route",
          source: action.source || "mentor",
        },
        { state: { meta: telemetryMeta } }
      );
    }
    safeTrackEvent("mentor_action_completed", { plat, action_type: actionType, source: action.source || "mentor" }, { state: { meta: telemetryMeta } });
  }, [command.action, freshnessDeps.openSessionClosure, onOpenAgenda, onOpenAjustes, onOpenClinicalCase, onStudy, plat, rebalanceTodayWorkload, recordMentorEvent, setView, showToast, showToastGlobal, telemetryMeta, topFilaItem]);

  const todayLoadSignals = useMemo(() => {
    const scheduler = decisionContext?.scheduler || {};
    const minutes = exibidosHojeMinutes;
    const overloadLevelToday = minutes > 120 ? "high" : minutes > 60 ? "moderate" : "ok";
    return {
      dueTodayCount: pending,
      todayMinutes: minutes,
      overloadLevelToday,
      relearningCount: Number(scheduler.relearningCount ?? 0),
    };
  }, [decisionContext, pending, exibidosHojeMinutes]);
  const todayLoadSummary = useMemo(() => {
    const loadLabel = {
      high: "alta",
      moderate: "moderada",
      ok: "tranquila",
    }[todayLoadSignals.overloadLevelToday] || "tranquila";
    const relearningText = todayLoadSignals.relearningCount > 0
      ? ` · ${todayLoadSignals.relearningCount} reaprendendo`
      : "";
    return `${todayLoadSignals.dueTodayCount} revisões · ${todayLoadSignals.todayMinutes} min · carga ${loadLabel}${relearningText}`;
    }, [todayLoadSignals]);

  const tasks = useMemo(() => {
    const queueItems = exibidosHoje.map((item) => {
      const tema = temasFiltrados.find((t) => t.id === item.temaId);
      const review = tema?.rev?.[item.stepKey] || {};
      return {
        ...item,
        estimatedMinutes: getEstimatedMinutesForStep(item.stepKey, review),
      };
    });
    const openActions = actionInbox.filter((action) => {
      const actionPlat = action.plat || action.target?.plat || "";
      return action.status !== "done"
        && action.status !== "dismissed"
        && (!actionPlat || actionPlat === plat);
    });
    return buildOrderedDailyTasks({
      command: command.action,
      queueItems,
      actionInbox: openActions,
      agendaItems: agendaTodaySummary?.items || [],
    });
  }, [actionInbox, agendaTodaySummary?.items, command.action, exibidosHoje, plat, temasFiltrados]);
  const totalMinutes = useMemo(() => {
    const taskMinutes = tasks.reduce((sum, task) => sum + (Number(task.minutes) || 0), 0);
    return taskMinutes || agendaTodaySummary?.totalMinutes || exibidosHojeMinutes || Number(command.action?.estimatedMinutes || 0);
  }, [agendaTodaySummary?.totalMinutes, command.action?.estimatedMinutes, tasks, exibidosHojeMinutes]);
  const completedCount = Math.min(concluidosHoje, tasks.length);

  const markSeen = useCallback(() => {
    const actionType = command.action?.type;
    if (!actionType) return;
    const eventKey = `${todayStr()}:${plat}:${actionType}`;
    if (lastMentorSeenRef.current === eventKey) return;
    safeTrackEvent(
      "mentor_action_seen",
      { plat, action_type: actionType, source: command.action?.source || "mentor" },
      { state: { meta: telemetryMeta } }
    );
    // CC-7: persiste seen para rollover detection
    recordMentorEvent?.({
      eventType: "seen",
      date: todayStr(),
      plat,
      action_type: actionType,
      source: command.action?.source || "mentor",
      seenAt: new Date().toISOString(),
    });
    lastMentorSeenRef.current = eventKey;
  }, [command.action, plat, recordMentorEvent, telemetryMeta]);

  useEffect(() => {
    markSeen();
  }, [markSeen]);

  return {
    command,
    execute,
    markSeen,
    tasks,
    totalMinutes,
    completedCount,
    todayLoadSummary,
    todayLoadSignals,
    agendaTodaySummary,
  };
}

export default useDailyCommand;
