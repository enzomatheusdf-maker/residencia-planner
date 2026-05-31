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
      diasRestantes: 0
    };
  }

  const hoje = todayStr();
  const diasRestantes = diffDays(hoje, dataProva);
  const nSim = simulados.length;

  // Classificação do tipo de simulado
  let tipo = "Stamina";
  let titulo = "Simulado Stamina";
  let descricao = "Foco em resistência física e mental, controle do ritmo (tempo por questão) e cobertura de lacunas.";
  let justificativa = "Estamos na fase intermediária dos estudos. O objetivo principal é acostumar o cérebro ao volume de questões sob pressão de tempo.";

  if (nSim === 0) {
    tipo = "Baseline";
    titulo = "Simulado Baseline";
    descricao = "Estabelecer seu ponto de partida para mapear suas forças e fraquezas iniciais.";
    justificativa = "Sem um simulado de nivelamento, o algoritmo não possui dados históricos para calibrar sua prioridade de temas e prever seu viés metacognitivo.";
  } else if (diasRestantes <= 0) {
    tipo = "Foco Revisão";
    titulo = "Revisão Geral Final";
    descricao = "A prova é hoje ou já passou! Foco em revisões leves e controle de ansiedade.";
    justificativa = "Não realize novos simulados densos. Preserve sua energia cognitiva.";
  } else if (diasRestantes <= 30) {
    tipo = "Confirmação";
    titulo = "Simulado de Confirmação";
    descricao = "Simulado de reta final. Ajustes milimétricos de controle de ansiedade e consolidação da nota de aprovação.";
    justificativa = "Faltando menos de 30 dias para a prova, os simulados servem para simular as condições exatas do dia do exame (ambiente, horários, alimentação).";
  }

  // Recomendação de frequência
  let freq = "A cada 30 dias";
  if (diasRestantes <= 0) {
    freq = "Concluído";
  } else if (diasRestantes <= 15) {
    freq = "Sem novos simulados (Foco em erros)";
    descricao = "Fase de lapidação final. Foque estritamente em revisar a planilha de erros e fazer cards do Anki.";
  } else if (diasRestantes <= 60) {
    freq = "A cada 7 dias";
  } else if (diasRestantes <= 120) {
    freq = "A cada 15 dias";
  }

  // Identificar especialidades prioritárias com base nas fraquezas de simulados
  const espErrors = {};
  simulados.forEach(s => {
    (s.questoesErradas || []).forEach(q => {
      if (q.esp) {
        espErrors[q.esp] = (espErrors[q.esp] || 0) + 1;
      }
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
    diasRestantes
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
