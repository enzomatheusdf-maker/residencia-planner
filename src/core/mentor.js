// src/core/mentor.js
// Pure functional engine for Mentor feedback and diagnosis logic

import { calcTrend, calcProjecao } from "../hooks/useMetrics";

const PHRASES = {
  sessao_concluida_high: [
    { id: "sc_high_1", text: "{userName}, {tema} está consolidado. Acerto {acerto}% — acima da meta. O FSRS agendou o próximo passo para {data}. No ritmo atual você domina esse tema antes da prova." },
    { id: "sc_high_2", text: "{userName}, {acerto}% em {tema} é um resultado excelente. A curva FSRS foi empurrada para {data}. Mantenha esse padrão e a aprovação é consequência." },
    { id: "sc_high_3", text: "Excelente performance, {userName}. {tema} foi agendado para {data} com acerto de {acerto}%. O planejamento está funcionando." },
    { id: "sc_high_4", text: "Domínio total em {tema}, {userName}. {acerto}% de acerto. Próxima parada: {data}. Continue assim!" }
  ],
  sessao_concluida_mid: [
    { id: "sc_mid_1", text: "{tema} está progredindo. {acerto}% é sólido, mas a meta é 80%. O que mais te pegou? Revise os erros por raciocínio antes de {data} — não deixa pra depois." },
    { id: "sc_mid_2", text: "{userName}, acerto de {acerto}% em {tema}. É bom, mas podemos subir. Foco em tapar os furos antes de {data}." },
    { id: "sc_mid_3", text: "Progresso consistente em {tema}: {acerto}%. A revisão está agendada para {data}. Ajuste os detalhes dos seus erros hoje." },
    { id: "sc_mid_4", text: "{tema} revisado com {acerto}%. Está na média, mas seu potencial é acima de 80%. Analise os distractors antes da revisão de {data}." }
  ],
  sessao_concluida_low: [
    { id: "sc_low_1", text: "{tema} está sangrando. {acerto}% é abaixo do threshold crítico. Eu bloqueei a progressão — você refaz o D0 antes de avançar. Esse é exatamente o tema que reprova." },
    { id: "sc_low_2", text: "Alerta vermelho em {tema}, {userName}. {acerto}% de acerto. Esse rendimento é crítico. Precisamos reestudar o D0 antes de tentar avançar." },
    { id: "sc_low_3", text: "Rendimento de {acerto}% em {tema} não é suficiente para aprovação. Bloqueado para revisão imediata. Vamos corrigir essa base agora." },
    { id: "sc_low_4", text: "{userName}, {tema} precisa de atenção urgente. {acerto}% está abaixo do limite de segurança. Volte ao D0 e sane as dúvidas." }
  ],
  atrasado: [
    { id: "atr_1", text: "{tema} está {diasAtraso} dias atrasado. A curva de esquecimento já reduziu a retrievabilidade. Quanto mais espera, mais precisa revisar. Hoje. Agora." },
    { id: "atr_2", text: "Atenção, {userName}. {tema} está acumulando há {diasAtraso} dias. O esforço para recuperar a memória dobra a cada dia de atraso. Resolva isso hoje." },
    { id: "atr_3", text: "Sua retenção de {tema} está caindo. Já são {diasAtraso} dias de atraso. Não deixe a bola cair. Vá para a fila agora." },
    { id: "atr_4", text: "O FSRS precisa de constância. {tema} está atrasado há {diasAtraso} dias. Menos de 15 minutos e você mata essa pendência." }
  ],
  streak: [
    { id: "str_1", text: "{streak} dias seguidos. Isso não é motivação — é sistema. Você já internalizou o ritmo. A partir daqui o estudo fica mais fácil, não mais difícil." },
    { id: "str_2", text: "Sensacional, {userName}! {streak} dias seguidos de foco. Você está construindo o hábito dos aprovados." },
    { id: "str_3", text: "{streak} dias de consistência inabalável. O cérebro adora rotina. Mantenha o foco!" },
    { id: "str_4", text: "Impressionante. {streak} dias no MedRev. A concorrência não acompanha quem estuda todo santo dia." }
  ],
  vies: [
    { id: "vies_1", text: "Você declarou confiança {confiancaMedia}/5 em {especialidade}, mas está acertando {acerto}%. Delta de {delta} pontos por {sessoes} sessões. Isso é excesso de confiança — o maior inimigo da aprovação." },
    { id: "vies_2", text: "{userName}, cuidado: sua percepção em {especialidade} ({confiancaMedia}/5) está desconectada do acerto real de {acerto}%. Ajuste a autocrítica para não ser surpreendido na prova." },
    { id: "vies_3", text: "Viés detectado em {especialidade}. Confiança {confiancaMedia}/5 vs {acerto}% de acerto. Estudar com a falsa sensação de domínio é perigoso. Revise com mais atenção." }
  ],
  primeiro_acesso: [
    { id: "pa_1", text: "Começou! O primeiro passo é o mais difícil. Você tem {totalFila} itens na fila. Isso vai levar aprox. {tempoEstimado} minutos." },
    { id: "pa_2", text: "Bom te ver focado, {userName}. Temos {totalFila} revisões agendadas hoje. Estudo ativo nelas, previsão de {tempoEstimado} minutos." },
    { id: "pa_3", text: "Dia de estudo iniciado. {totalFila} temas aguardando sua revisão ativa. Em cerca de {tempoEstimado} minutos você zera a fila de hoje." }
  ],
  meta_diaria: [
    { id: "md_1", text: "Fila zerada. Você fez {totalQuestoes} questões hoje. Cada questão hoje é uma questão que você vai acertar na prova." },
    { id: "md_2", text: "Meta cumprida! {totalQuestoes} questões resolvidas. O Mentor está orgulhoso. Aproveite o descanso, amanhã tem mais." },
    { id: "md_3", text: "Fila limpa com sucesso, {userName}. {totalQuestoes} questões feitas. Consistência é o segredo. Até amanhã!" }
  ],
  // ─── VESTIBULAR-SPECIFIC ────────────────────────────────────────────────────
  vest_acerto_alto: [
    { id: "va_high_1", text: "{userName}, {acerto}% em {tema} é top. Com esse acerto, essa área não vai te derrubar na {prova}. O FSRS agendou o reforço para {data}." },
    { id: "va_high_2", text: "Domínio sólido em {tema}: {acerto}%. O algoritmo empurrou a próxima revisão para {data}. Continue nesse ritmo e a nota de corte vira formalidade." },
    { id: "va_high_3", text: "{acerto}% em {tema} — resultado de elite, {userName}. Próximo reforço em {data}. Mantenha isso e as outras áreas serão o diferencial." }
  ],
  vest_acerto_baixo: [
    { id: "va_low_1", text: "{tema} está te custando pontos na {prova}. {acerto}% não é suficiente. Revise o conteúdo-base antes de avançar — a curva de esquecimento não perdoa lacunas." },
    { id: "va_low_2", text: "Alerta em {tema}: {acerto}%. Identifique se é lacuna de conteúdo ou armadilha de distrator — eles têm soluções diferentes. Não empurre com a barriga." },
    { id: "va_low_3", text: "{userName}, {acerto}% em {tema} indica ponto fraco real. Bloqueei a progressão até a base estar sólida. Isso é exatamente o que separa aprovados de reprovados." }
  ],
  vest_segunda_tentativa: [
    { id: "vst_1", text: "Segunda tentativa, {userName}. Você já sabe o que não funcionou. Agora é hora de atacar com precisão — não quantidade. Foco no que a {prova} mais cobra." },
    { id: "vst_2", text: "Quem chega na segunda tentativa com método vence. Você tem vantagem sobre quem tenta pela primeira vez: você conhece o exame. Use isso a seu favor." },
    { id: "vst_3", text: "O ciclo FSRS foi desenhado para exatamente isso: identificar onde você sangra e eliminar a hemorragia antes da prova. Confie no processo." }
  ],
  vest_ansiedade: [
    { id: "vans_1", text: "Nota de corte parece distante? Normal nessa fase. O que importa é a inclinação da curva — e a sua está subindo. Siga o algoritmo, não o pânico." },
    { id: "vans_2", text: "{userName}, a ansiedade é sinal de que você se importa. Mas ela não estuda por você. Mais 30 minutos de foco agora valem mais que 3 horas de preocupação." },
    { id: "vans_3", text: "Cada sessão concluída hoje é menos lacuna na prova. O processo não para de funcionar. Você precisa aparecer — o algoritmo faz o resto." }
  ],
  vest_semana_prova: [
    { id: "vsp_1", text: "Semana da prova, {userName}. Nada de conteúdo novo. Só revisão das pendências da fila. O cérebro precisa consolidar, não de mais informação." },
    { id: "vsp_2", text: "Últimos dias. Priorize: 1) dormir bem, 2) comer direito, 3) revisar a fila. Nessa ordem. Rendimento cognitivo na prova depende dos 3." },
    { id: "vsp_3", text: "O que você sabe, você sabe. Agora é sobre execução, não aprendizado. Foco, respiração e confiança no processo." }
  ]
};

/**
 * Interpolates a string template with variables.
 */
export function interpolate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (m, key) => {
    return vars[key] !== undefined ? vars[key] : m;
  });
}

/**
 * Pures selects a randomized phrase for a situation, avoiding recent ones.
 * Updates local storage history when called (if browser context is available).
 */
export function getMentorPhrase(situation, vars, recentPhrases = []) {
  const options = PHRASES[situation];
  if (!options || options.length === 0) return { text: "", id: "" };

  let available = options.filter(o => !recentPhrases.includes(o.id));
  if (available.length === 0) {
    available = options; // fallback if all were recently used
  }

  const selected = available[Math.floor(Math.random() * available.length)];
  return {
    text: interpolate(selected.text, vars),
    id: selected.id
  };
}

/**
 * Saves a phrase ID to the local storage recent list to avoid 7-day repetition.
 */
export function trackRecentPhrase(phraseId) {
  if (typeof window === "undefined" || !phraseId) return;
  try {
    const raw = localStorage.getItem("medrev_recent_mentor_phrases");
    let list = raw ? JSON.parse(raw) : [];
    
    // Keep last 15 phrase IDs
    list = [phraseId, ...list.filter(id => id !== phraseId)].slice(0, 15);
    localStorage.setItem("medrev_recent_mentor_phrases", JSON.stringify(list));
  } catch (e) {
    console.error("Erro ao rastrear frase recente do Mentor:", e);
  }
}

/**
 * Reads the list of recent phrase IDs from localStorage.
 */
export function getRecentPhrases() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("medrev_recent_mentor_phrases");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Runs analytics on study logs and returns diagnostic insights.
 * @param {string} userName
 * @param {Array} temas
 * @param {Array} doneReviews - Flattened list of completed review steps
 * @param {string} plat - Platform: "res" or "vest"
 * @param {Object} meta - Store meta (provasAlvo, isSegundaTentativa, areaPuxouBaixo, notaCorteAlvo)
 */
export function getMentorDiagnosis(userName, temas, doneReviews, temaStats = {}, plat = "res", meta = {}) {
  const totalSessions = doneReviews.length;

  // 1. Calibração (Dias 1-7 ou menos de 7 sessões concluídas)
  if (totalSessions < 7) {
    const rem = 7 - totalSessions;
    return {
      status: "calibracao",
      message: `Ainda estou aprendendo seu perfil. Complete mais ${rem} ${rem === 1 ? "sessão" : "sessões"} para eu gerar seu primeiro diagnóstico.`
    };
  }

  const insights = [];

  // Insight A: Horário ótimo de estudo
  const statsList = Object.values(temaStats).flat();
  if (statsList.length >= 6) {
    const morningAcc = [];
    const afternoonAcc = [];
    const nightAcc = [];

    statsList.forEach(s => {
      if (s.acerto == null || !s.completedAt) return;
      const hour = new Date(s.completedAt).getHours();
      if (hour < 12) morningAcc.push(s.acerto);
      else if (hour < 18) afternoonAcc.push(s.acerto);
      else nightAcc.push(s.acerto);
    });

    const avgMorning = morningAcc.length >= 3 ? (morningAcc.reduce((a,b)=>a+b, 0)/morningAcc.length) * 100 : null;
    const avgAfternoon = afternoonAcc.length >= 3 ? (afternoonAcc.reduce((a,b)=>a+b, 0)/afternoonAcc.length) * 100 : null;
    const avgNight = nightAcc.length >= 3 ? (nightAcc.reduce((a,b)=>a+b, 0)/nightAcc.length) * 100 : null;

    // Check which is best and compare
    if (avgMorning !== null && avgNight !== null && Math.abs(avgMorning - avgNight) >= 6) {
      if (avgMorning > avgNight) {
        insights.push({
          type: "horario",
          text: `Notei que você rende muito melhor pela manhã: ${Math.round(avgMorning)}% de acerto vs ${Math.round(avgNight)}% à noite.`
        });
      } else {
        insights.push({
          type: "horario",
          text: `Notei que você rende muito melhor no período da noite: ${Math.round(avgNight)}% de acerto vs ${Math.round(avgMorning)}% pela manhã.`
        });
      }
    } else if (avgAfternoon !== null && avgNight !== null && Math.abs(avgAfternoon - avgNight) >= 6) {
      if (avgAfternoon > avgNight) {
        insights.push({
          type: "horario",
          text: `Notei que você rende muito melhor no período da tarde: ${Math.round(avgAfternoon)}% de acerto vs ${Math.round(avgNight)}% à noite.`
        });
      } else {
        insights.push({
          type: "horario",
          text: `Notei que você rende muito melhor à noite: ${Math.round(avgNight)}% de acerto vs ${Math.round(avgAfternoon)}% pela tarde.`
        });
      }
    }
  }

  // Insight B: Especialidade mais fraca (Bleeding threshold)
  const espAcc = {};
  doneReviews.forEach(r => {
    if (r.acerto == null || !r.esp) return;
    if (!espAcc[r.esp]) espAcc[r.esp] = [];
    espAcc[r.esp].push(r.acerto);
  });
  const espAvgs = Object.entries(espAcc).map(([esp, vals]) => ({
    esp,
    avg: (vals.reduce((a,b)=>a+b, 0)/vals.length) * 100,
    count: vals.length
  }));
  const weakestEsp = espAvgs.filter(x => x.count >= 2).sort((a,b) => a.avg - b.avg)[0];
  if (weakestEsp && weakestEsp.avg < 75) {
    insights.push({
      type: "alerta",
      text: `Atenção com ${weakestEsp.esp}: sua média de acerto está em ${Math.round(weakestEsp.avg)}%. Bloqueie temas novos nela e priorize revisar as pendências.`
    });
  }

  // Insight C: Tendência de acerto
  const recentAcc = doneReviews.filter(r => r.acerto != null).map(r => r.acerto * 100);
  if (recentAcc.length >= 6) {
    const trendVals = recentAcc.slice(-8);
    const trend = calcTrend(trendVals);
    if (trend !== null) {
      if (trend > 0.4) {
        insights.push({
          type: "tendencia_alta",
          text: `Tendência de alta: sua precisão nas revisões subiu cerca de ${Math.round(trend * 3)}% nos últimos ciclos. Mantenha a consistência.`
        });
      } else if (trend < -0.4) {
        insights.push({
          type: "tendencia_baixa",
          text: `Cuidado: tendência de queda de ${Math.round(Math.abs(trend) * 3)}% nos acertos recentes. Estude os erros por raciocínio.`
        });
      }
    }
  }

  // Insight D: Viés metacognitivo
  const withConf = doneReviews.filter(r => r.confianca != null && r.acerto != null);
  if (withConf.length >= 4) {
    const avgConf = withConf.reduce((a,b) => a + b.confianca, 0) / withConf.length; // 1-5 scale
    const avgAcc = (withConf.reduce((a,b) => a + b.acerto, 0) / withConf.length) * 100;
    const confPercent = avgConf * 20; // convert 1-5 to 0-100%
    const delta = confPercent - avgAcc;

    if (delta > 15) {
      insights.push({
        type: "vies_excesso",
        text: `Viés de excesso de confiança detectado: percepção de domínio em ${Math.round(confPercent)}% vs acerto real de ${Math.round(avgAcc)}%. Seja mais autocrítico.`
      });
    } else if (delta < -15) {
      insights.push({
        type: "vies_inseguranca",
        text: `Insegurança produtiva: você está acertando mais do que estima (percepção de ${Math.round(confPercent)}% vs acerto real de ${Math.round(avgAcc)}%). Confie no seu progresso.`
      });
    }
  }

  // Insight E: Vestibular-specific insights
  if (plat === "vest") {
    const provaAlvo = (meta?.provasAlvo || [])[0] || "ENEM";

    // E1: Segunda tentativa encouragement (early stage)
    if (meta?.isSegundaTentativa && totalSessions < 15) {
      insights.push({
        type: "horario",
        text: `Segunda tentativa com método, ${userName}. Você conhece o ${provaAlvo} — agora o FSRS vai eliminar as lacunas com precisão cirúrgica.`
      });
    }

    // E2: Declared weak area still low
    if (meta?.areaPuxouBaixo) {
      const areaData = espAvgs.find(e => e.esp === meta.areaPuxouBaixo);
      if (areaData && areaData.avg < 70) {
        insights.push({
          type: "alerta",
          text: `${meta.areaPuxouBaixo} continua sendo seu ponto crítico: ${Math.round(areaData.avg)}% de acerto. A fila inteligente está priorizando ela — siga as sugestões.`
        });
      }
    }

    // E3: Nota de corte gap warning
    if (meta?.notaCorteAlvo > 0 && weakestEsp && weakestEsp.avg < 60) {
      insights.push({
        type: "tendencia_baixa",
        text: `Com ${weakestEsp.esp} em ${Math.round(weakestEsp.avg)}%, você está em risco de não atingir a nota de corte de ${meta.notaCorteAlvo}%. Priorize essa área hoje.`
      });
    }
  }

  // Fallback se não disparar nenhum insight específico
  if (insights.length === 0) {
    insights.push({
      type: "geral",
      text: "Seu ritmo de estudos está equilibrado. Continue alimentando o FSRS diariamente para calibrarmos ainda mais os alertas."
    });
  }

  // 2. Diagnóstico Completo (Dias 30+ ou 30 sessões concluídas)
  let projInfo = null;
  if (totalSessions >= 30) {
    const allAccs = doneReviews.filter(r => r.acerto != null).map(r => r.acerto * 100);
    const projScore = calcProjecao(allAccs, 5);
    projInfo = {
      score: projScore,
      text: projScore >= 80 
        ? `Projeção de aprovação de ${projScore}% — acima da meta crítica. Mantenha a blindagem de estudos.`
        : `Projeção atual em ${projScore}%. Precisamos elevar as revisões ativas de pontos fracos para cruzar a meta de 80%.`
    };
  }

  return {
    status: totalSessions >= 30 ? "completo" : "ativo",
    insights: insights.slice(0, 3), // limit to top 3 insights
    projection: projInfo
  };
}
