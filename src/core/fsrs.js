// src/core/fsrs.js
// FSRS-Lite core rules, date math, and database constants

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + Math.round(n));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const diffDays = (a, b) => Math.round((new Date(b) - new Date(a)) / 86_400_000);

export function getWorkloadProjection(temas, numDays = 14) {
  const projection = {};
  const today = todayStr();
  
  // Initialize projection keys for the next N days
  for (let i = 0; i < numDays; i++) {
    const dateStr = addDays(today, i);
    projection[dateStr] = 0;
  }
  
  // Count pending reviews scheduled on each date
  temas.forEach(t => {
    if (t.unstarted) return;
    Object.keys(t.rev).forEach(stepKey => {
      const r = t.rev[stepKey];
      if (r && !r.done && r.date) {
        // If it is overdue, it counts towards today's workload
        if (r.date < today) {
          projection[today]++;
        } else if (projection.hasOwnProperty(r.date)) {
          projection[r.date]++;
        }
      }
    });
  });
  
  return projection;
}

export const fmtDate = (d) => {
  if (!d) return "—";
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
};

export const fmtFull = (d) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

export function fmtRelativo(dateStr) {
  if (!dateStr) return "—";
  const diff = diffDays(todayStr(), dateStr);
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  if (diff > 1) return `em ${diff} dias`;
  return `há ${Math.abs(diff)} dias`;
}

export const fmtMonth = (d) => {
  const [, m, y] = d.split("-");
  const M = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${M[+m - 1]} ${y}`;
};

export const isOverdue = (s) => !!s && s < todayStr();
export const isDueToday = (s) => s === todayStr();
export const isDueSoon = (s) => {
  if (!s) return false;
  const d = diffDays(todayStr(), s);
  return d > 0 && d <= 2;
};

// ─── FSRS-LITE ENGINE ────────────────────────────────────────────────────────
export const FSRS_DECAY = -0.5;
export const FSRS_FACTOR = 0.9 ** (1 / FSRS_DECAY) - 1;
export const DESIRED_RETENTION = 0.90;

export const S_BASE = { d0: 1, d1: 1, d4: 4, d7: 7, d21: 21 };

export const DEMO_TEMA_ID = (plat) => plat === "vest" ? "demo-funcoes" : "demo-apendicite";

export function getRetrievability(tema, stepKey) {
  if (stepKey === "d0") return 1.0;
  const stepIdx = STEPS.findIndex((s) => s.key === stepKey);
  if (stepIdx <= 0) return 1.0;
  const prevKey = STEPS[stepIdx - 1].key;
  const lastDate = tema.rev[prevKey]?.date || tema.d0 || todayStr();
  const t = Math.max(0, diffDays(lastDate, todayStr()));
  const S = tema.rev[stepKey]?.S || S_BASE[stepKey] || 1;
  return (1 + FSRS_FACTOR * t / S) ** FSRS_DECAY;
}

export function toRating(acerto) {
  if (acerto == null) return "good";
  if (acerto < 0.55) return "again";
  if (acerto < 0.75) return "hard";
  if (acerto < 0.90) return "good";
  return "easy";
}

export function updateStability(S_prev, acerto) {
  const deltas = { again: -0.8, hard: 0.05, good: 0.3, easy: 0.7 };
  return Math.max(0.5, S_prev * Math.exp(deltas[toRating(acerto)]));
}

export function nextInterval(S, baseOffset, desiredRetention = 0.90, maxInterval = 180) {
  const raw = (S / FSRS_FACTOR) * (desiredRetention ** (1 / FSRS_DECAY) - 1);
  const floor = Math.max(1, Math.round(baseOffset * 0.5));
  let val = Math.round(Math.max(raw, floor));
  if (maxInterval && val > maxInterval) {
    val = maxInterval;
  }
  return val;
}

// ─── STEPS DEFINITION ────────────────────────────────────────────────────────
export const STEPS = [
  { key: "d0", label: "D0", offset: 0, desc: "Estudo + Questões", checkbox: false },
  { key: "d1", label: "D1", offset: 1, desc: "Brain Dump", checkbox: true },
  { key: "d4", label: "D4", offset: 4, desc: "Questões", checkbox: false },
  { key: "d7", label: "D7", offset: 7, desc: "Questões + Anki", checkbox: false },
  { key: "d21", label: "D21", offset: 21, desc: "Interleaved", checkbox: false },
];

export function buildRev(d0) {
  const r = {};
  STEPS.forEach((s) => {
    r[s.key] = { date: addDays(d0, s.offset), done: false, acerto: null, questoes: null, S: S_BASE[s.key], motivosErro: [] };
  });
  return r;
}

export function recalcAfterMark(rev, doneKey, acerto, desiredRetention = 0.90, maxInterval = 180) {
  const rating = toRating(acerto);
  const prevS = doneKey === "manutencao" 
    ? (rev.manutencao?.S ?? 45) 
    : (rev[doneKey]?.S ?? S_BASE[doneKey]);
  const S_new = updateStability(prevS, acerto);

  if (rating === "again") {
    if (doneKey === "manutencao") {
      return {
        ...rev,
        manutencao: {
          ...rev.manutencao,
          S: S_new,
          date: addDays(todayStr(), 1),
        }
      };
    }
    return {
      ...rev,
      [doneKey]: {
        ...rev[doneKey],
        S: S_new,
        done: false,
        date: addDays(todayStr(), 1),
        acerto: null,
        questoes: null,
      },
    };
  }

  if (doneKey === "manutencao") {
    const prevInterval = rev.manutencao?.interval || 45;
    const nextInt = nextInterval(S_new, prevInterval * 2, desiredRetention, maxInterval);
    const baseDate = rev.manutencao.date >= todayStr() ? rev.manutencao.date : todayStr();
    return {
      ...rev,
      manutencao: {
        done: false,
        date: addDays(baseDate, nextInt),
        S: S_new,
        interval: prevInterval * 2
      }
    };
  }

  if (doneKey === "d21") {
    const nextInt = nextInterval(S_new, 45, desiredRetention, maxInterval);
    const baseDate = rev.d21.date >= todayStr() ? rev.d21.date : todayStr();
    return {
      ...rev,
      d21: { ...rev.d21, S: S_new },
      manutencao: {
        done: false,
        date: addDays(baseDate, nextInt),
        S: S_new,
        interval: 45
      }
    };
  }

  const doneIdx = STEPS.findIndex((s) => s.key === doneKey);
  const nextStep = STEPS[doneIdx + 1];
  if (!nextStep) return rev;
  const interval = nextInterval(S_new, nextStep.offset, desiredRetention, maxInterval);
  const baseDate = rev[doneKey].date >= todayStr() ? rev[doneKey].date : todayStr();
  return {
    ...rev,
    [doneKey]: { ...rev[doneKey], S: S_new },
    [nextStep.key]: { ...rev[nextStep.key], date: addDays(baseDate, interval) },
  };
}

export function normalizeTema(t) {
  if (!t) return t;
  const rev = { ...t.rev };
  STEPS.forEach((s) => {
    if (!rev[s.key]) {
      rev[s.key] = {
        date: t.d0 ? addDays(t.d0, s.offset) : todayStr(),
        done: false,
        acerto: null,
        questoes: null,
        S: S_BASE[s.key],
        motivosErro: [],
      };
    }
  });
  return { ...t, rev };
}

export function getFaseItem(tema, stepKey) {
  if (stepKey === "d0" && (!tema?.rev?.d0?.done)) {
    return "aquisicao";
  }
  return "recuperacao";
}


// ─── DOMAIN CONFIGURATIONS & COLORS ──────────────────────────────────────────
export const ESP_COLORS = {
  "Cirurgia": "#fb923c",
  "Clínica Médica": "#60a5fa",
  "GO": "#f472b6",
  "Pediatria": "#34d399",
  "Preventiva": "#c084fc",
  "Outro": "#94a3b8",
  "Exatas": "#22d3ee",
  "Humanas": "#fbbf24",
  "Linguagens": "#a3e635",
  "Ciências da Natureza": "#2dd4bf",
  "Redação": "#f0abfc",
};

export const PRIO = {
  "Diamante": { c: "#38bdf8" },
  "Alta": { c: "#f87171" },
  "Média": { c: "#fbbf24" },
  "Baixa": { c: "#94a3b8" },
  "Bônus": { c: "#c084fc" },
};

export const IMPORTANCIA = {
  CRITICA: { label: "CRÍTICA", icon: "🔴", peso: 3.0, color: "#f87171" },
  ALTA: { label: "ALTA", icon: "🟠", peso: 2.0, color: "#fb923c" },
  MEDIA: { label: "MÉDIA", icon: "🟡", peso: 1.0, color: "#fbbf24" },
};

export const ESPS_RES = ["Cirurgia", "Clínica Médica", "GO", "Pediatria", "Preventiva", "Outro"];
export const ESPS_VEST = ["Exatas", "Humanas", "Linguagens", "Ciências da Natureza", "Redação"];

// ─── MEDCOF 2026 TOPIC LIST ──────────────────────────────────────────────────
export const MEDCOF = [
  {b:1,t:[["Avaliação Global do Hemograma","Clínica Médica","Alta"],["Anemias Hipoproliferativas I","Clínica Médica","Diamante"],["Anemias Hipoproliferativas II","Clínica Médica","Alta"],["Modificações do Organismo Materno","GO","Alta"],["Assistência ao Pré-Natal","GO","Diamante"],["Ultrassonografia em Obstetrícia","GO","Média"],["Aleitamento Materno","Pediatria","Diamante"],["Alimentação Infantil","Pediatria","Média"],["Desenvolvimento Infantil","Pediatria","Alta"],["Alterações no Neurodesenvolvimento - TEA e TDAH","Pediatria","Alta"],["Níveis de Prevenção","Preventiva","Alta"],["Indicadores de Saúde","Preventiva","Diamante"],["Introdução ao Trauma e Atendimento Inicial","Cirurgia","Diamante"],["Trauma: Vias Aéreas","Cirurgia","Alta"],["Choque e Ressuscitação Hemostática","Cirurgia","Alta"]]},
  {b:2,t:[["Neurovascular I: AIT e AVCi","Clínica Médica","Diamante"],["Neurovascular II: HSA e AVCh","Clínica Médica","Alta"],["Anatomia Pélvica Feminina","GO","Diamante"],["Embriologia do Sistema Genital Feminino","GO","Média"],["Malformações Mullerianas","GO","Média"],["Febre sem Sinais Localizatórios","Pediatria","Média"],["Nefrologia Pediátrica","Pediatria","Diamante"],["Doença Renal Crônica e Lesão Renal Agudo","Pediatria","Baixa"],["Miscelânea em Nefropediatria","Pediatria","Média"],["Testes Diagnósticos","Preventiva","Diamante"],["Assistência ao Pré-Natal na APS","Preventiva","Média"],["Trauma: Medidas Auxiliares e FAST","Cirurgia","Baixa"],["Trauma: Populações Especiais","Cirurgia","Bônus"],["Trauma de Tórax","Cirurgia","Diamante"]]},
  {b:3,t:[["Sífilis","Clínica Médica","Diamante"],["Dispepsia e DRGE","Clínica Médica","Alta"],["Úlcera Péptica, H. pylori e Gastrite Atrófica","Clínica Médica","Alta"],["Corrimentos Vaginais","GO","Diamante"],["Doença Inflamatória Pélvica Aguda","GO","Alta"],["Úlceras Genitais","GO","Alta"],["Alergia Alimentar, Refluxo e Constipação","Pediatria","Diamante"],["Diarreia Crônica e Doenças Funcionais","Pediatria","Média"],["Violência Contra a Criança e o Adolescente","Pediatria","Alta"],["Determinação Social do Processo Saúde-Doença","Preventiva","Diamante"],["Trauma Abdominal","Cirurgia","Diamante"],["Trauma Urológico","Cirurgia","Média"]]},
  {b:4,t:[["Artrite Reumatoide","Clínica Médica","Alta"],["Espondiloartrites","Clínica Médica","Alta"],["Artrites Microcristalinas - Gota e CPPD","Clínica Médica","Média"],["Osteoartrite","Clínica Médica","Média"],["Fibromialgia","Clínica Médica","Média"],["Assistência ao Parto","GO","Diamante"],["Sofrimento Fetal Agudo","GO","Alta"],["Crescimento e Baixa Estatura","Pediatria","Diamante"],["Obesidade e Síndrome Metabólica","Pediatria","Média"],["Puberdade","Pediatria","Alta"],["Desnutrição e Vitaminas","Pediatria","Média"],["Redes de Atenção à Saúde","Preventiva","Diamante"],["Atenção Primária à Saúde","Preventiva","Diamante"],["Trauma de Pelve","Cirurgia","Alta"],["Trauma Cranioencefálico","Cirurgia","Diamante"],["Trauma Raquimedular","Cirurgia","Média"],["Trauma Musculoesquelético","Cirurgia","Baixa"],["Trauma de Pescoço","Cirurgia","Baixa"]]},
  {b:5,t:[["Dor Torácica Coronariana","Clínica Médica","Diamante"],["Dor Torácica Não Coronariana","Clínica Médica","Média"],["Fisiologia Menstrual","GO","Alta"],["Amenorreia Primária","GO","Diamante"],["Esteroidogênese","GO","Média"],["Politrauma e Afogamento","Pediatria","Baixa"],["Queimaduras em Pediatria","Pediatria","Baixa"],["TCE e Hipertensão Intracraniana em Pediatria","Pediatria","Média"],["Diarreia Aguda em Pediatria","Pediatria","Diamante"],["Classificação dos Estudos Epidemiológicos","Preventiva","Diamante"],["Associação x Causalidade","Preventiva","Alta"],["Rastreamentos","Preventiva","Alta"],["Queimaduras","Cirurgia","Alta"],["Escroto Agudo","Cirurgia","Alta"],["Priapismo","Cirurgia","Baixa"]]},
  {b:6,t:[["Gasometria Arterial","Clínica Médica","Alta"],["Distúrbios do Sódio","Clínica Médica","Alta"],["Distúrbios do Potássio","Clínica Médica","Alta"],["Reações Alérgicas","Clínica Médica","Média"],["Amenorreia Secundária","GO","Diamante"],["Hiperprolactinemia","GO","Média"],["Síndrome dos Ovários Policísticos","GO","Alta"],["Infecções de Vias Aéreas Superiores (IVAS)","Pediatria","Alta"],["Doenças Autoinflamatórias","Pediatria","Baixa"],["Pneumonias em Pediatria","Pediatria","Diamante"],["Bronquiolite e Coqueluche","Pediatria","Diamante"],["COVID em Pediatria","Pediatria","Baixa"],["Estudos Transversais","Preventiva","Alta"],["Estudos Longitudinais: Coorte e Caso-Controle","Preventiva","Diamante"],["Abdome Agudo: Introdução","Cirurgia","Alta"],["Apendicite Aguda","Cirurgia","Diamante"],["Cicatrização e Lesões por Pressão","Cirurgia","Média"],["Fios de Sutura","Cirurgia","Bônus"],["Anestésicos Locais","Cirurgia","Bônus"]]},
  {b:7,t:[["Antibióticos","Clínica Médica","Diamante"],["Anemias Hemolíticas","Clínica Médica","Alta"],["Oncologia: Emergências e Cuidados Paliativos","Clínica Médica","Média"],["Infecções e Gravidez","GO","Diamante"],["Rotura Prematura de Membranas Ovulares","GO","Alta"],["Violência Sexual","GO","Alta"],["Interrupção Legal da Gestação","GO","Média"],["Reanimação Neonatal","Pediatria","Alta"],["Infecções Congênitas","Pediatria","Diamante"],["Icterícia e Colestase Neonatal","Pediatria","Alta"],["História e Princípios do SUS","Preventiva","Diamante"],["Urgências da Vesícula Biliar","Cirurgia","Diamante"],["Câncer de Esôfago","Cirurgia","Alta"]]},
  {b:8,t:[["Cefaleias","Clínica Médica","Alta"],["Avaliação Geriátrica Ampla","Clínica Médica","Alta"],["Grandes Síndromes Geriátricas","Clínica Médica","Média"],["Avaliação de Enzimas Hepáticas e DHEM","Clínica Médica","Baixa"],["Abortamento","GO","Diamante"],["Gestação Ectópica","GO","Diamante"],["Doença Trofoblástica Gestacional","GO","Média"],["Dermatite Atópica e Lesões Benignas do RN","Pediatria","Alta"],["Dermatoses e Infecções de Partes Moles","Pediatria","Diamante"],["Legislação do SUS I","Preventiva","Diamante"],["Pancreatite Aguda","Cirurgia","Alta"],["Diverticulite Aguda","Cirurgia","Diamante"],["Abscesso Hepático","Cirurgia","Baixa"],["Disfagia e Acalasia","Cirurgia","Média"]]},
  {b:9,t:[["Coagulação e Hemostasia","Clínica Médica","Média"],["Hemoterapia","Clínica Médica","Baixa"],["Cirrose Hepática I","Clínica Médica","Diamante"],["Cirrose Hepática II","Clínica Médica","Alta"],["PAC - Pneumonia Adquirida na Comunidade","Clínica Médica","Diamante"],["Derrame Pleural","Clínica Médica","Alta"],["Tabagismo","Clínica Médica","Alta"],["Placenta Prévia","GO","Alta"],["Descolamento Prematuro de Placenta","GO","Diamante"],["Outros Sangramentos da 2ª Metade da Gestação","GO","Média"],["Anemia Falciforme","Pediatria","Alta"],["Anemia Ferropriva e Talassemia","Pediatria","Diamante"],["Hemostasia e Distúrbios Hemorrágicos em Pediatria","Pediatria","Alta"],["Genética em Pediatria","Pediatria","Alta"],["Legislação do SUS II","Preventiva","Alta"],["Abdome Agudo Obstrutivo","Cirurgia","Diamante"],["Abdome Agudo Perfurativo, Vascular e Hemorrágico","Cirurgia","Alta"],["Câncer de Estômago","Cirurgia","Alta"]]},
  {b:10,t:[["HAS: Ambulatorial e Emergências","Clínica Médica","Diamante"],["Insuficiência Cardíaca","Clínica Médica","Alta"],["Asma","Clínica Médica","Alta"],["DPOC","Clínica Médica","Alta"],["BLS e ACLS","Clínica Médica","Alta"],["Síndromes Hipertensivas na Gestação","GO","Diamante"],["Sangramento Uterino Anormal","GO","Diamante"],["PALS - Suporte Avançado de Vida em Pediatria","Pediatria","Diamante"],["Cardiopatias Congênitas","Pediatria","Alta"],["HAS em Pediatria","Pediatria","Alta"],["Miocardite, Síncope e IC em Pediatria","Pediatria","Média"],["Medidas de Associação","Preventiva","Alta"],["Legislação do SUS III: Decreto 7508","Preventiva","Alta"],["Rede de Atenção Psicossocial (RAPS)","Preventiva","Média"],["Ensaios Clínicos","Preventiva","Diamante"],["Hérnia Inguinal e Anatomia da Parede Abdominal","Cirurgia","Diamante"],["Hernioplastia Inguinal","Cirurgia","Média"],["Retalhos","Cirurgia","Média"],["Enxertos","Cirurgia","Média"]]},
  {b:11,t:[["Diabetes: Classificação e Diagnóstico","Clínica Médica","Alta"],["Diabetes: Tratamento","Clínica Médica","Diamante"],["Emergências Hiperglicêmicas - CAD e EHH","Clínica Médica","Alta"],["Diabetes na Gestação","GO","Diamante"],["Infertilidade","GO","Alta"],["Endometriose","GO","Alta"],["Arboviroses em Pediatria","Pediatria","Alta"],["Doenças Exantemáticas","Pediatria","Diamante"],["CAD em Pediatria","Pediatria","Alta"],["Financiamento do SUS","Preventiva","Alta"],["Ética em Pesquisa Clínica","Preventiva","Média"],["Urgências Endoscópicas","Cirurgia","Diamante"],["Síndrome Compartimental Intra-Abdominal","Cirurgia","Média"],["Hérnias Incisionais e Outras Hérnias","Cirurgia","Baixa"]]},
  {b:12,t:[["Síndrome Metabólica e Obesidade","Clínica Médica","Alta"],["Dislipidemias","Clínica Médica","Diamante"],["DHEM - Doença Hepática Esteatótica Metabólica","Clínica Médica","Baixa"],["Uroginecologia e Incontinência Urinária","GO","Diamante"],["Prolapso Genital","GO","Alta"],["Triagens Neonatais","Pediatria","Alta"],["Distúrbios Metabólicos Neonatais","Pediatria","Média"],["Peçonhentos, Raiva e Tétano","Pediatria","Diamante"],["Ingestão e Aspiração de Corpo Estranho e BRUE","Pediatria","Média"],["Significância Estatística e Intervalo de Confiança","Preventiva","Alta"],["Revisão Sistemática e Metanálise","Preventiva","Diamante"],["Medicina Baseada em Evidências","Preventiva","Alta"],["Pré-Operatório","Cirurgia","Diamante"],["Cirurgia Bariátrica","Cirurgia","Alta"],["Uro-Oncologia","Cirurgia","Média"]]},
  {b:13,t:[["Vasculites","Clínica Médica","Média"],["Tuberculose: Clínica e Diagnóstico","Clínica Médica","Diamante"],["Tuberculose: Tratamento","Clínica Médica","Alta"],["Avaliação de Vitalidade Fetal","GO","Diamante"],["Restrição de Crescimento Intrauterino","GO","Alta"],["Sofrimento Fetal Crônico","GO","Média"],["Gemelaridade","GO","Média"],["Convulsão na Emergência e Convulsão Febril","Pediatria","Diamante"],["Tuberculose em Pediatria","Pediatria","Alta"],["Cardiologia na APS","Preventiva","Alta"],["Diabetes no SUS","Preventiva","Alta"],["Estratégia Saúde da Família","Preventiva","Diamante"],["REMIT e Pós-Operatório","Cirurgia","Diamante"],["Perioperatório: Complicações Gerais","Cirurgia","Alta"],["Hiperplasia Prostática Benigna","Cirurgia","Alta"]]},
  {b:14,t:[["Meningites e Encefalites","Clínica Médica","Alta"],["Taquiarritmias","Clínica Médica","Diamante"],["Bradiarritmias","Clínica Médica","Alta"],["Síncope","Clínica Médica","Alta"],["Doenças Valvares","Clínica Médica","Média"],["Anticoncepção","GO","Diamante"],["Cardiopatias na Gravidez","GO","Baixa"],["Kawasaki, Vasculite por IgA e Febre Reumática","Pediatria","Diamante"],["Artrite Idiopática Juvenil","Pediatria","Alta"],["Meningite e Encefalite em Pediatria","Pediatria","Diamante"],["Financiamento da APS","Preventiva","Diamante"],["Síndrome Depressiva","Preventiva","Alta"],["Síndrome Maníaca","Preventiva","Baixa"],["Câncer Colorretal e Síndromes Associadas","Cirurgia","Alta"],["Doenças Orificiais e CEC de Canal Anal","Cirurgia","Alta"]]},
  {b:15,t:[["Via Aérea, Intubação e VNI","Clínica Médica","Baixa"],["SDRA - Síndrome do Desconforto Respiratório","Clínica Médica","Alta"],["Ventilação Mecânica","Clínica Médica","Baixa"],["Infecções Nosocomiais","Clínica Médica","Baixa"],["Choque em UTI","Clínica Médica","Alta"],["Propedêutica Mamária","GO","Diamante"],["Principais Sintomas em Mastologia","GO","Alta"],["Lesões Benignas da Mama","GO","Média"],["Vacinação em Pediatria","Pediatria","Diamante"],["HIV em Pediatria","Pediatria","Baixa"],["Ortopedia Pediátrica","Pediatria","Diamante"],["Osteomielite e Artrite Séptica","Pediatria","Média"],["Ferramentas da APS/ESF","Preventiva","Diamante"],["Síndrome Ansiosa","Preventiva","Média"],["Fígado: Nódulos Hepáticos","Cirurgia","Diamante"]]},
  {b:16,t:[["Injúria Renal Aguda","Clínica Médica","Diamante"],["Diarreia Aguda e Colite Pseudomembranosa","Clínica Médica","Alta"],["Doença Inflamatória Intestinal (DII)","Clínica Médica","Média"],["Doenças Negligenciadas","Clínica Médica","Média"],["Trabalho de Parto Prematuro","GO","Diamante"],["Colo Curto e Incompetência Istmocervical","GO","Média"],["Hiperplasia Adrenal Congênita","Pediatria","Alta"],["Hipotireoidismo em Pediatria","Pediatria","Média"],["Diferenças no Desenvolvimento Sexual","Pediatria","Baixa"],["Nutrologia em Pediatria","Pediatria","Média"],["Método Clínico Centrado na Pessoa","Preventiva","Diamante"],["Telemedicina e Publicidade Médica","Preventiva","Diamante"],["Litíase Renal Cirúrgica","Cirurgia","Diamante"],["Aneurisma de Aorta","Cirurgia","Média"],["Carcinoma Hepatocelular","Cirurgia","Baixa"]]},
  {b:17,t:[["Lúpus Eritematoso Sistêmico","Clínica Médica","Diamante"],["Osteoporose","Clínica Médica","Média"],["Esclerose Sistêmica","Clínica Médica","Baixa"],["Doença de Sjögren","Clínica Médica","Baixa"],["Miopatias Autoimunes","Clínica Médica","Baixa"],["Glomerulopatias","Clínica Médica","Alta"],["Intoxicações Exógenas","Clínica Médica","Diamante"],["Hemorragia Pós-Parto","GO","Diamante"],["Puerpério","GO","Média"],["Asma em Pediatria","Pediatria","Diamante"],["Fibrose Cística","Pediatria","Alta"],["Imunodeficiências em Pediatria","Pediatria","Média"],["Vigilância em Saúde","Preventiva","Diamante"],["Registro de Saúde Orientado por Problemas","Preventiva","Média"],["Adenocarcinoma de Pâncreas","Cirurgia","Alta"]]},
  {b:18,t:[["HIV e Doenças Oportunistas","Clínica Médica","Alta"],["Hipotireoidismo","Clínica Médica","Diamante"],["Hipertireoidismo e Tireoidite","Clínica Médica","Alta"],["Câncer de Colo de Útero: Rastreamento","GO","Diamante"],["Câncer de Colo de Útero: Diagnóstico e Tratamento","GO","Diamante"],["Doenças da Vulva e da Vagina","GO","Baixa"],["Sepse Neonatal","Pediatria","Média"],["Desconforto Respiratório Neonatal","Pediatria","Diamante"],["Outras Doenças Neonatais","Pediatria","Baixa"],["Processo Epidêmico","Preventiva","Alta"],["Abordagem Familiar e Comunitária","Preventiva","Média"],["Síndrome de Fournier","Cirurgia","Diamante"],["Trombose Venosa Profunda","Cirurgia","Média"],["Ortopedia Geral","Cirurgia","Baixa"]]},
  {b:19,t:[["Tromboembolismo Pulmonar","Clínica Médica","Diamante"],["Adrenal","Clínica Médica","Média"],["Síndrome de Cushing","Clínica Médica","Média"],["Doença Pulmonar Intersticial","Clínica Médica","Baixa"],["Nódulo Pulmonar","Clínica Médica","Média"],["Câncer de Mama: Rastreamento","GO","Diamante"],["Câncer de Mama: Fatores de Risco e CDIS","GO","Diamante"],["Câncer de Mama: Doença Invasiva","GO","Média"],["Parasitoses Intestinais","Pediatria","Alta"],["Neoplasias Pediátricas","Pediatria","Diamante"],["Acidente de Trabalho","Preventiva","Diamante"],["Síndrome Psicótica","Preventiva","Baixa"],["Psicofarmacologia","Preventiva","Baixa"],["Isquemia de Membros Inferiores","Cirurgia","Média"],["Oncocirurgia Geral","Cirurgia","Baixa"]]},
  {b:20,t:[["Infecção do Trato Urinário (ITU)","Clínica Médica","Diamante"],["Outros Distúrbios Hidroeletrolíticos","Clínica Médica","Média"],["Doença Renal Crônica","Clínica Médica","Média"],["Síndrome Climatérica","GO","Diamante"],["Terapia Hormonal","GO","Diamante"],["Tumores Anexiais","GO","Baixa"],["Câncer de Ovário","GO","Média"],["ITU em Pediatria","Pediatria","Média"],["Sedoanalgesia e Sequência Rápida de Intubação","Pediatria","Baixa"],["Sepse Pediátrica","Pediatria","Média"],["Choque e Drogas Vasoativas em Pediatria","Pediatria","Média"],["Tuberculose e Hanseníase na APS","Preventiva","Diamante"],["Pneumoconioses","Preventiva","Média"],["Saúde Socioecológica","Preventiva","Baixa"],["Cirurgia: Encerramento","Cirurgia","Diamante"],["Pancreatite Crônica","Cirurgia","Baixa"],["Neoplasias Císticas Pancreáticas","Cirurgia","Bônus"],["Câncer de Pulmão","Cirurgia","Baixa"]]},
  {b:21,t:[["Depressão e Delirium no Idoso","Clínica Médica","Alta"],["Insuficiência Cognitiva e Demências","Clínica Médica","Diamante"],["Hiperplasia Endometrial","GO","Diamante"],["Câncer de Endométrio","GO","Média"],["Outras Intercorrências Clínicas na Gestação","GO","Média"],["Cirurgia Pediátrica no PS","Pediatria","Diamante"],["Uropediatria e Hérnias em Pediatria","Pediatria","Alta"],["Malformações Congênitas","Pediatria","Média"],["Declaração de Óbito e Atestados","Preventiva","Diamante"],["Atenção à Saúde de Populações Específicas","Preventiva","Diamante"],["Diagnósticos Diferenciais das Massas Cervicais","Cirurgia","Alta"],["Videolaparoscopia","Cirurgia","Média"],["Insuficiência Venosa Crônica","Cirurgia","Média"]]},
  {b:22,t:[["Doenças Virais e Pandêmicas","Clínica Médica","Alta"],["Arboviroses Tropicais","Clínica Médica","Diamante"],["Icterícias Febris e Febre Maculosa","Clínica Médica","Alta"],["Hepatites Virais","Clínica Médica","Diamante"],["Técnicas de Reprodução Assistida","GO","Média"],["Cuidado à Saúde LGBTQIAPN+","GO","Média"],["Ética em Pediatria","Pediatria","Diamante"],["Ética Médica","Preventiva","Diamante"],["Intoxicações, PAIRO e Burnout","Preventiva","Média"],["CEC de Cabeça e Pescoço","Cirurgia","Baixa"],["Doenças Traqueais e Bronquiectasias","Cirurgia","Baixa"]]},
  {b:23,t:[["Hiperaldosteronismo Primário","Clínica Médica","Média"],["Feocromocitoma","Clínica Médica","Baixa"],["Prolactinomas","Clínica Médica","Baixa"],["Oncohematologia","Clínica Médica","Média"],["Cirurgia Ginecológica: Princípios","GO","Baixa"],["Transtornos Psiquiátricos na Gestação e Pós-Parto","GO","Baixa"],["Emergências Psiquiátricas","Preventiva","Média"],["Violências e Vulnerabilidade","Preventiva","Diamante"],["Saúde Suplementar e Judicialização em Saúde","Preventiva","Diamante"],["Anomalias Congênitas de Cabeça e Pescoço","Cirurgia","Média"]]},
  {b:24,t:[["Medicina Fetal","GO","Baixa"],["Otites, Rinossinusites e Epistaxe","Pediatria","Baixa"],["Rinites e Afecções da Laringe e Faringe","Pediatria","Baixa"],["Transtornos Alimentares e de Personalidade","Preventiva","Bônus"],["Endoscopia Diagnóstica","Cirurgia","Bônus"],["Cabeça e Pescoço: Tireoide e Paratireoide","Cirurgia","Bônus"],["Neurocirurgia","Cirurgia","Bônus"]]},
  {b:25,t:[["Otologia","Clínica Médica","Alta"],["Oftalmologia para o Generalista","Clínica Médica","Média"],["Trombofilias na Gestação e Puerpério","GO","Média"],["Doença Hemolítica Perinatal","GO","Média"],["Oftalmopediatria","Pediatria","Baixa"],["Saúde do Trabalhador","Preventiva","Média"],["Anestesiologia","Cirurgia","Bônus"]]},
  {b:26,t:[["Rinologia","Clínica Médica","Alta"],["Bucofaringolaringologia","Clínica Médica","Média"],["Outras Urgências Ginecológicas","GO","Baixa"],["Malformações do Sistema Nervoso","Pediatria","Baixa"],["Doenças Neuromusculares na Infância","Pediatria","Baixa"],["Transtornos Relacionados a Substâncias - Álcool","Preventiva","Média"],["Preventiva: Reta Final","Preventiva","Alta"],["Cirurgia Cardíaca","Cirurgia","Bônus"]]},
];
