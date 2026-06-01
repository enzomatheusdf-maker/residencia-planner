function buildAction(partial = {}) {
  const type = partial.type || "manutencao";
  const target = partial.target || {};
  const explain = Array.isArray(partial.explain) && partial.explain.length > 0
    ? partial.explain
    : ["Sem justificativa estruturada disponível."];
  return {
    id: partial.id || `mentor_${type}_${target.temaId || target.area || target.casoId || "root"}`,
    type,
    priority: Number.isFinite(partial.priority) ? partial.priority : 10,
    title: partial.title || "Manter consistência leve",
    subtitle: partial.subtitle || "",
    reason: partial.reason || "Sem urgência crítica detectada.",
    explain,
    cta: partial.cta || "Executar ação",
    ctaView: partial.ctaView || target.view || "dash",
    estimatedMinutes: Number.isFinite(partial.estimatedMinutes) ? partial.estimatedMinutes : 15,
    confidence: Number.isFinite(partial.confidence) ? partial.confidence : 0.7,
    safety: partial.safety || "ok",
    source: partial.source || "mentor-v2",
    target: {
      ...target,
      view: target.view || partial.ctaView || "dash",
    },
  };
}

function canSuggestNewTopic(context = {}) {
  const scheduler = context.scheduler || {};
  const available = Number(context.userAvailableMinutes || 0);
  if (scheduler.overloadLevelToday === "high") return false;
  if (Number(scheduler.overloadDays || 0) >= 2) return false;
  if (Number(scheduler.relearningCount || 0) > 0) return false;
  if (Number(scheduler.overdueCount || 0) > 0) return false;
  if (available > 0 && Number(scheduler.todayMinutes || 0) > available * 1.2) return false;
  if (available <= 0 && Number(scheduler.todayMinutes || 0) > 120) return false;
  return true;
}

function collectingSuffix(context = {}) {
  return context?.scheduler?.trueRetentionCollecting
    ? "Retenção longa ainda coletando; priorizo carga, atrasos e desempenho recente."
    : null;
}

export function decideMentorAction(context = {}) {
  const plat = context.plat || "res";
  const scheduler = context.scheduler || {};
  const areaCritica = context.enamed?.resumo?.areaCritica || null;
  const weakSubject = context.weakSubject || null;
  const providerId = context.calendarProvider?.activeId || "medcof";
  const collectingNote = collectingSuffix(context);

  if (Number(scheduler.missingRatingWarnings || 0) > 0 || Number(scheduler.missingReviewedAtCount || 0) > 0) {
    return buildAction({
      type: "scheduler_warning",
      priority: 100,
      title: "Corrigir inconsistências de revisão antes de avançar",
      subtitle: "Há revisões concluídas com dados faltando.",
      reason: "Dados incompletos podem distorcer fila, retenção e recomendações do Mentor.",
      explain: [
        `Alertas de avaliação ausente: ${scheduler.missingRatingWarnings || 0}.`,
        `Revisões sem reviewedAt: ${scheduler.missingReviewedAtCount || 0}.`,
        "Regularize o histórico para recuperar previsibilidade do plano.",
      ],
      cta: "Auditar revisões",
      ctaView: "stats",
      estimatedMinutes: 15,
      confidence: 0.95,
      safety: "critical",
      target: { area: "scheduler", action: "audit_review_data" },
    });
  }

  if (scheduler.overloadLevelToday === "high" || Number(scheduler.overloadDays || 0) >= 2) {
    return buildAction({
      type: "workload_relief",
      priority: 95,
      title: "Reduzir sobrecarga antes de tema novo",
      subtitle: `Carga hoje: ${scheduler.todayMinutes || 0} min.`,
      reason: "Sobrecarga elevada aumenta risco de atraso em cadeia nas revisões.",
      explain: [
        `Dias sobrecarregados no horizonte: ${scheduler.overloadDays || 0}.`,
        "Tema novo fica bloqueado até estabilizar a fila.",
        collectingNote || "Priorize revisões críticas para recuperar controle.",
      ].filter(Boolean),
      cta: "Rebalancear hoje",
      ctaView: "dash",
      estimatedMinutes: 25,
      confidence: 0.9,
      safety: "caution",
      target: { action: "rebalance_workload", overloadLevel: scheduler.overloadLevelToday },
    });
  }

  if (Number(scheduler.relearningCount || 0) > 0) {
    const item = scheduler.relearningItems?.[0] || {};
    return buildAction({
      type: "relearning",
      priority: 94,
      title: item.temaNome ? `Recuperar ${item.temaNome}` : "Recuperar tema em reaprendizado",
      subtitle: "Tema instável detectado; recuperação vem antes de expansão.",
      reason: "Reaprendizado ativo deve ser tratado antes de abrir conteúdo novo.",
      explain: [
        "Houve queda recente em revisão espaçada.",
        "Recuperar em 24-48h reduz custo cognitivo futuro.",
        collectingNote || "Abrir tema novo agora aumenta risco de sobrecarga.",
      ].filter(Boolean),
      cta: "Recuperar agora",
      ctaView: "focus",
      estimatedMinutes: 20,
      confidence: 0.9,
      safety: "caution",
      target: {
        temaId: item.temaId || null,
        stepKey: item.targetStep || "d4",
        phase: "relearning",
        temaNome: item.temaNome || null,
      },
    });
  }

  if (Number(scheduler.overdueCount || 0) > 0) {
    const due = scheduler.nextDueItem || {};
    return buildAction({
      type: "revisao_vencida",
      priority: 92,
      title: due.temaNome ? `Resolver vencida: ${due.temaNome}` : "Resolver revisões vencidas",
      subtitle: `Atraso máximo atual: ${scheduler.maxDelayDays || 0} dias.`,
      reason: "Revisão vencida tem prioridade sobre gargalo de conteúdo.",
      explain: [
        "Preservar retenção vem antes de abrir frente nova.",
        areaCritica ? `Gargalo ENAMED (${areaCritica}) entra depois da fila.` : "Depois da fila, volte aos gargalos.",
        collectingNote || "Eliminar atrasos estabiliza o algoritmo.",
      ].filter(Boolean),
      cta: "Começar revisão",
      ctaView: "dash",
      estimatedMinutes: 30,
      confidence: 0.9,
      safety: "caution",
      target: {
        temaId: due.temaId || null,
        stepKey: due.stepKey || null,
        temaNome: due.temaNome || null,
      },
    });
  }

  if (Number(scheduler.dueTodayCount || 0) > 0) {
    return buildAction({
      type: "fila_do_dia",
      priority: 88,
      title: "Fechar fila de hoje",
      subtitle: `${scheduler.dueTodayCount} revisão(ões) para hoje.`,
      reason: "Fechar a fila diária mantém ritmo e evita acúmulo amanhã.",
      explain: [
        `Carga estimada hoje: ${scheduler.todayMinutes || 0} minutos.`,
        collectingNote || "Constância diária mantém o plano previsível.",
      ].filter(Boolean),
      cta: "Executar fila de hoje",
      ctaView: "dash",
      estimatedMinutes: Math.max(20, scheduler.todayMinutes || 20),
      confidence: 0.85,
      safety: "ok",
      target: { action: "close_today_queue" },
    });
  }

  if (context.pendingExamAnalysis && canSuggestNewTopic(context)) {
    return buildAction({
      type: "exam_analysis",
      priority: 80,
      title: "Analisar simulado pendente",
      subtitle: "Fila segura; transformar resultado em plano tático.",
      reason: "Sem análise, você perde sinais de gargalo e alocação ótima de tempo.",
      explain: [
        "A fila de revisão está sob controle.",
        "A análise do simulado define o próximo alvo com maior retorno.",
      ],
      cta: "Abrir análise",
      ctaView: "sims",
      estimatedMinutes: 20,
      confidence: 0.8,
      safety: "ok",
      target: { action: "analyze_exam" },
    });
  }

  if (plat === "res" && areaCritica) {
    return buildAction({
      type: "enamed_critico",
      priority: 76,
      title: `Atacar lacuna em ${areaCritica}`,
      subtitle: "Gargalo ENAMED identificado na última análise.",
      reason: "Com fila segura, vale converter energia em ganho de nota no gargalo crítico.",
      explain: [
        "Sem revisões vencidas e sem relearning ativo.",
        collectingNote || "Prioridade orientada por incidência e desempenho recente.",
      ].filter(Boolean),
      cta: "Focar área crítica",
      ctaView: "stats",
      estimatedMinutes: 35,
      confidence: 0.8,
      safety: "ok",
      target: { area: areaCritica },
    });
  }

  if (plat === "vest" && weakSubject) {
    return buildAction({
      type: "vestibular_materia_fraca",
      priority: 76,
      title: `Reforçar ${weakSubject}`,
      subtitle: "Matéria fraca detectada por simulado.",
      reason: "Com fila segura, o maior ganho marginal vem da matéria mais fraca.",
      explain: [
        "Revisões críticas estão controladas.",
        "Treino dirigido aumenta eficiência da próxima bateria.",
      ],
      cta: "Treinar matéria",
      ctaView: "sims",
      estimatedMinutes: 40,
      confidence: 0.8,
      safety: "ok",
      target: { area: weakSubject },
    });
  }

  if (plat === "res" && Number(context.clinical?.dueCount || 0) > 0) {
    const dueCase = context.clinical?.dueItems?.[0] || {};
    return buildAction({
      type: "clinical_case",
      priority: 72,
      title: "Treinar caso clínico pendente",
      subtitle: "Reencontro clínico venceu o prazo sugerido.",
      reason: "Raciocínio clínico vence após revisar base para evitar esquecimento aplicado.",
      explain: [
        "Fila FSRS está controlada para abrir espaço de treino aplicado.",
        "Casos vencidos ajudam a consolidar decisão diagnóstica.",
      ],
      cta: "Abrir caso",
      ctaView: "raciocinio",
      estimatedMinutes: 25,
      confidence: 0.75,
      safety: "ok",
      target: { casoId: dueCase.casoId || null },
    });
  }

  if (canSuggestNewTopic(context)) {
    const area = plat === "res"
      ? (areaCritica || context.readinessData?.priorityList?.[0]?.area || null)
      : (weakSubject || null);
    const providerName = providerId ? ` (${providerId})` : "";
    return buildAction({
      type: "new_topic",
      priority: 66,
      title: area ? `Abrir tema novo em ${area}` : "Abrir tema novo estratégico",
      subtitle: `Carga sob controle; calendário ativo${providerName}.`,
      reason: "Sem sobrecarga e sem atrasos, expansão de cobertura tem melhor retorno.",
      explain: [
        "Bloqueios de segurança para tema novo estão liberados.",
        providerId ? `Use o calendário ativo ${providerId} para manter consistência.` : "Use o cronograma ativo.",
      ],
      cta: "Abrir cronograma",
      ctaView: "crono",
      estimatedMinutes: 45,
      confidence: 0.72,
      safety: "ok",
      target: { area, providerId, action: "start_new_topic" },
    });
  }

  if (plat === "res") {
    return buildAction({
      type: "anki_check",
      priority: 40,
      title: "Rodar bloco rápido de Anki",
      subtitle: "Sem urgências críticas no momento.",
      reason: "Bloco curto mantém trilha ativa com baixo custo.",
      explain: [
        "Fila principal está estável.",
        "Reforço leve evita perda de ritmo.",
      ],
      cta: "Abrir Anki Audit",
      ctaView: "anki",
      estimatedMinutes: 12,
      confidence: 0.68,
      safety: "ok",
      target: { action: "anki_quick_block" },
    });
  }

  return buildAction({
    type: "rest",
    priority: 30,
    title: "Bloco leve ou descanso ativo",
    subtitle: "Sem urgências; priorize recuperação.",
    reason: "Descanso intencional preserva consistência de longo prazo.",
    explain: [
      "Sem atrasos críticos e sem sobrecarga imediata.",
      "Recuperação agora reduz risco de fadiga cumulativa.",
    ],
    cta: "Ver estatísticas",
    ctaView: "stats",
    estimatedMinutes: 20,
    confidence: 0.65,
    safety: "ok",
    target: { action: "light_block_or_rest" },
  });
}

export function buildMentorTodayPlan(context = {}) {
  const action = decideMentorAction(context);
  const explain = Array.isArray(action.explain) ? action.explain : [];
  const plan = [action.title];
  if (explain[0]) plan.push(explain[0]);
  if (explain[1]) plan.push(explain[1]);
  return plan;
}

export { buildAction as buildMentorAction };
