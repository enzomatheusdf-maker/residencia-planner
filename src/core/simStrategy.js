// src/core/simStrategy.js

/**
 * Calcula a diferença em dias entre duas datas (formato AAAA-MM-DD).
 */
export function diffDays(d1, d2) {
  const t1 = new Date(d1).getTime();
  const t2 = new Date(d2).getTime();
  if (isNaN(t1) || isNaN(t2)) return 0;
  return Math.ceil((t2 - t1) / (1000 * 60 * 60 * 24));
}

/**
 * Retorna a data de hoje no formato local AAAA-MM-DD.
 */
export function todayStr() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split("T")[0];
}

/**
 * Recomenda a estratégia de simulados com base na data da prova, cobertura e histórico.
 * Gated por cobertura × calendário (não só calendário).
 */
export function getSimRecommendation(dataProva, simulados = [], temas = [], plat = "res") {
  if (!dataProva) {
    return {
      tipo: "Configuração Pendente",
      titulo: "Defina sua data da prova",
      descricao: "Vá em Ajustes e informe a data da sua prova para calcular a estratégia ideal.",
      justificativa: "O Mentor precisa saber quanto tempo resta até seu exame para agendar simulados de forma inteligente.",
      frequenciaRecomendada: "—",
      focoEspecialidades: [],
      diasRestantes: 0,
      cobertura: 0,
    };
  }

  const hoje = todayStr();
  const diasRestantes = diffDays(hoje, dataProva);
  const nSim = simulados.length;

  // Cobertura = % de temas iniciados
  const totalTemas = temas.length;
  const iniciados = temas.filter(t => !t.unstarted).length;
  const cobertura = totalTemas > 0 ? Math.round((iniciados / totalTemas) * 100) : 0;

  let tipo, titulo, descricao, justificativa, freq;

  if (nSim === 0) {
    tipo = "Baseline";
    titulo = "Simulado Diagnóstico (Baseline)";
    descricao = "Estabeleça seu ponto de partida. A nota não importa — o objetivo é mapear fraquezas.";
    justificativa = "Sem um simulado de nivelamento, o algoritmo não possui dados históricos para calibrar sua prioridade de temas e prever seu viés metacognitivo.";
    freq = "1 agora (diagnóstico)";
  } else if (diasRestantes <= 0) {
    tipo = "Reta final";
    titulo = "Revisão Geral Final";
    descricao = "A prova é hoje ou já passou! Foco em revisões leves e controle de ansiedade.";
    justificativa = "Não realize novos simulados densos. Preserve sua energia cognitiva.";
    freq = "Concluído";
  } else if (diasRestantes <= 15) {
    tipo = "Lapidação";
    titulo = "Fase de Lapidação";
    descricao = "Pare simulados densos. Revise a planilha de erros + FSRS. Preserve energia.";
    justificativa = "A <15 dias o custo de energia supera o ganho de novos simulados. Foque nas revisões ativas pendentes.";
    freq = "Sem novos simulados";
  } else if (diasRestantes <= 30) {
    tipo = "Confirmação";
    titulo = "Simulado de Confirmação";
    descricao = "Semanal, no mesmo horário/duração da prova real. Foco em pacing e ansiedade.";
    justificativa = "Faltando menos de 30 dias, os simulados simulam condições exatas do dia do exame (ambiente, horários, alimentação).";
    freq = "Semanal";
  } else if (diasRestantes <= 60) {
    tipo = "Stamina+";
    titulo = "Simulado Stamina+";
    descricao = "Quinzenal, prova inteira, para construir resistência e ritmo (tempo/questão).";
    justificativa = "A 30–60 dias, simulados completos a cada 2 semanas treinam resistência e calibram o tempo por questão.";
    freq = "A cada 14 dias";
  } else if (diasRestantes <= 120 && cobertura >= 40) {
    tipo = "Stamina";
    titulo = "Simulado Stamina";
    descricao = "Simulado completo, cronometrado e misto a cada 3 semanas. Calibração espaçada.";
    justificativa = "Com cobertura ≥40% e 60–120 dias até a prova, simulados espaçados calibram seu desempenho sem drenar energia de cobertura.";
    freq = "A cada 21 dias";
  } else {
    tipo = "Construção";
    titulo = "Fase de Construção";
    descricao = "Cedo demais para simulados frequentes. Construa cobertura + questões diárias intercaladas.";
    justificativa = `Cobertura atual ${cobertura}% — abaixo de 40% ou mais de 120 dias até a prova. Simulados completos têm pouco sinal agora e desmotivam. Foco em construir base.`;
    freq = "1 baseline opcional (já feito)";
  }

  // Identificar especialidades prioritárias com base nas fraquezas de simulados
  const espErrors = {};
  simulados.forEach(s => {
    (s.questoesErradas || []).forEach(q => {
      if (q.esp) espErrors[q.esp] = (espErrors[q.esp] || 0) + 1;
    });
  });

  const focoEspecialidades = Object.entries(espErrors)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])
    .slice(0, 3);

  return {
    tipo,
    titulo,
    descricao,
    justificativa,
    frequenciaRecomendada: freq,
    focoEspecialidades,
    diasRestantes,
    cobertura,
  };
}

/**
 * Retorna as ações recomendadas com base nas causas de erros registradas em simulados.
 */
export function getResultActions(questoesErradas = []) {
  if (!questoesErradas || questoesErradas.length === 0) {
    return [];
  }

  const errorCounts = { lacuna: 0, raciocinio: 0, distractor: 0, descuido: 0, nao_visto: 0, interpretacao: 0 };
  questoesErradas.forEach(q => {
    if (q.tipoErro && errorCounts[q.tipoErro] !== undefined) {
      errorCounts[q.tipoErro]++;
    }
  });

  const totalErrors = questoesErradas.length;
  const actions = [];

  // Ação para Lacunas de Conteúdo
  if (errorCounts.lacuna > 0) {
    const pct = Math.round((errorCounts.lacuna / totalErrors) * 100);
    actions.push({
      tipoErro: "lacuna",
      label: "Lapidar Lacunas de Conteúdo",
      pct,
      text: `Representa ${pct}% dos seus erros. Recomendação: Fazer ciclo teórico focado de 20 minutos ou assistir a um resumo rápido do tema no D0 para reconstruir a fundação de conhecimento.`
    });
  }

  // Ação para Raciocínio
  if (errorCounts.raciocinio > 0) {
    const pct = Math.round((errorCounts.raciocinio / totalErrors) * 100);
    actions.push({
      tipoErro: "raciocinio",
      label: "Ajustar Conexões Lógicas",
      pct,
      text: `Representa ${pct}% dos seus erros. Recomendação: Com o material de consulta FECHADO, refaça o Esqueleto Mental do tema. Force-se a reestruturar a relação de causa, efeito e diagnóstico.`
    });
  }

  // Ação para Distratores
  if (errorCounts.distractor > 0) {
    const pct = Math.round((errorCounts.distractor / totalErrors) * 100);
    actions.push({
      tipoErro: "distractor",
      label: "Prever Pegadinhas de Prova",
      pct,
      text: `Representa ${pct}% dos seus erros. Recomendação: Crie flashcards específicos com omissão de termos (cloze) focando estritamente no distrator que te confundiu. Use o formato: FRENTE: Enunciado típico + pegadinha. VERSO: Por que está errado.`
    });
  }

  // Ação para Descuido
  if (errorCounts.descuido > 0) {
    const pct = Math.round((errorCounts.descuido / totalErrors) * 100);
    actions.push({
      tipoErro: "descuido",
      label: "Combater Distrações & Descuido",
      pct,
      text: `Representa ${pct}% dos seus erros. Recomendação: Adote a regra de ouro pré-questão: ler o comando final da questão 2 vezes e grifar a palavra-chave (ex: 'exceto', 'correto', 'imediato') antes de selecionar a alternativa.`
    });
  }

  // Ação para Não Visto
  if (errorCounts.nao_visto > 0) {
    const pct = Math.round((errorCounts.nao_visto / totalErrors) * 100);
    actions.push({
      tipoErro: "nao_visto",
      label: "Mapear Novos Tópicos",
      pct,
      text: `Representa ${pct}% dos seus erros. Recomendação: Cadastre este tema como um novo tópico de estudo em seu cronograma e execute o passo a passo completo da curva de fixação (do Pré-teste ao Anki).`
    });
  }

  // Ação para Interpretação
  if (errorCounts.interpretacao > 0) {
    const pct = Math.round((errorCounts.interpretacao / totalErrors) * 100);
    actions.push({
      tipoErro: "interpretacao",
      label: "Aprimorar Leitura de Enunciados",
      pct,
      text: `Representa ${pct}% dos seus erros. Recomendação: Faça uma bateria leve de questões focada apenas em grifar a tese e a âncora factual do enunciado antes de olhar as alternativas.`
    });
  }

  // Ordenar ações pela frequência do erro (decrescente)
  return actions.sort((a, b) => b.pct - a.pct);
}

/**
 * Protocolo de execução do simulado, dependente da fase.
 */
export function getSimuladoProtocolo(tipo) {
  const base = [
    { t: "Cronometre e simule a prova", d: "Primeira tentativa, tempo real, sem pausar. Treina pacing e stamina como no dia D." },
    { t: "Misture as áreas (intercalado)", d: "Não faça por matéria isolada. Misturar força você a escolher a abordagem certa — ganho de transferência (interleaving)." },
    { t: "Não persiga o número", d: "Primeiras provas pontuam 40–55% e isso é normal. O que vale é a tendência da média móvel, não um simulado isolado." },
    { t: "Triagem de erro obrigatória", d: "Para cada erro, classifique a causa (lacuna / raciocínio / distrator / descuido / interpretação / não visto). Sem isso o simulado vira só uma nota." },
    { t: "Revise o racional de TODAS as erradas", d: "Leia o comentário inteiro, inclusive de acertos por chute. Re-leitura passiva engana; explicar o porquê consolida." },
    { t: "Refaça só as erradas em 48–72h", d: "Relearning sucessivo: reencontrar o que você errou alguns dias depois é o que fixa de verdade. Lacunas viram tema no FSRS + card atômico (cloze)." },
    { t: "Use provas NOVAS para prever desempenho", d: "Refazer prova já vista infla a nota por reconhecimento. Reaproveite provas antigas só como treino de erro, nunca como previsão." },
  ];
  if (tipo === "Confirmação") {
    return [
      { t: "Condições idênticas à prova", d: "Mesmo horário, mesma duração, mesmo intervalo, sem celular. Está treinando o protocolo do dia, não só conteúdo." },
      ...base.slice(0, 5),
    ];
  }
  if (tipo === "Lapidação" || tipo === "Reta final") {
    return [
      { t: "Sem simulados novos", d: "A <15 dias o custo de energia supera o ganho. Foque a planilha de erros e as revisões ativas pendentes." },
    ];
  }
  if (tipo === "Construção") {
    return [
      { t: "Questões diárias intercaladas", d: "Nessa fase, questões diárias do FSRS têm mais retorno que simulados completos. Construa cobertura primeiro." },
      { t: "1 simulado diagnóstico (baseline)", d: "Se ainda não fez nenhum, faça 1 para mapear fraquezas — mas sem pressão de nota." },
    ];
  }
  return base;
}

export function getSimuladoGuidance({ dataProva, simulados = [], cobertura = 0, score = 0 }) {
  const base = getSimRecommendation(dataProva, simulados);
  const nSim = simulados.length;
  const autonomia = nSim < 3 ? "prescritivo" : "consultivo";
  const fase = (base.tipo || "").toLowerCase().includes("baseline")
    ? "baseline"
    : (base.tipo || "").toLowerCase().includes("confirma")
      ? "confirmacao"
      : "stamina";

  const recomendacao =
    autonomia === "prescritivo"
      ? `Faça 1 simulado ${fase === "baseline" ? "de nivelamento" : "completo"} ${base.frequenciaRecomendada.toLowerCase()}.`
      : `Mantenha simulados ${base.frequenciaRecomendada.toLowerCase()} e ajuste conforme seu cansaço e consistência.`;

  const porque = `Cobertura atual ${Math.round(cobertura)}% e prontidão ${Math.round(score)} indicam fase ${fase}.`;

  return {
    fase,
    autonomia,
    recomendacao,
    porque,
    titulo: base.titulo,
  };
}
