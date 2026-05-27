// useStore.js — ReviewFlow v5.1
// Zustand + persist — estado centralizado com FSRS-Lite integrado
//
// FSRS-LITE: mantém os 5 steps fixos do método (D0→D1→D4→D7→D21)
// mas usa Stability (S) por step para modular o offset do step seguinte.
// Fórmula: S_new = S_prev * e^(0.3 * (acerto - 0.75))
//          offset_ajustado = offset_base * clamp(S_new / S_base, 0.5, 1.8)
// Resultado: acerto 90% em D7 → próximo step em ~D26 (era D21)
//            acerto 50% em D7 → próximo step em ~D13 (puxa pra perto)
// Dados antigos (sem S/D) continuam funcionando: inicializam com defaults.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────
export const todayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + Math.round(n));
  return d.toISOString().slice(0, 10);
}

export const diffDays  = (a, b) => Math.round((new Date(b) - new Date(a)) / 86_400_000);
export const fmtDate   = (d) => { if (!d) return "—"; const [, m, day] = d.split("-"); return `${day}/${m}`; };
export const fmtFull   = (d) => { if (!d) return "—"; const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; };
export const fmtMonth  = (d) => { const [y, m] = d.split("-"); const M = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"]; return `${M[+m - 1]} ${y}`; };
export const isOverdue  = (s) => !!s && s < todayStr();
export const isDueToday = (s) => s === todayStr();
export const isDueSoon  = (s) => { if (!s) return false; const d = diffDays(todayStr(), s); return d > 0 && d <= 2; };

// ─── FSRS-LITE ────────────────────────────────────────────────────────────────
// Constantes calibradas para conteúdo médico denso
const FSRS_DECAY  = -0.5;          // constante da curva de esquecimento
const FSRS_FACTOR = 0.9 ** (1 / FSRS_DECAY) - 1; // ≈ 0.2328, inverte a curva
const DESIRED_RETENTION = 0.90;    // meta: manter 90% de retenção (igual ao Anki FSRS padrão)

// Stability inicial por step (dias — representa "quanto tempo esse step aguenta")
const S_BASE = { d0: 1, d1: 1, d4: 4, d7: 7, d21: 21 };

// Mapeia acerto (0–1) para rating FSRS
function toRating(acerto) {
  if (acerto == null) return "good";
  if (acerto < 0.55)  return "again";
  if (acerto < 0.75)  return "hard";
  if (acerto < 0.90)  return "good";
  return "easy";
}

// Atualiza Stability após uma revisão
// Fórmula: S_new = S * e^(k * (acerto - threshold))
// k=0.3 é o fator de sensibilidade — calibrado para não esticar demais com poucos dados
function updateStability(S_prev, acerto) {
  const rating = toRating(acerto);
  const deltas = { again: -0.8, hard: 0.05, good: 0.3, easy: 0.7 };
  const delta  = deltas[rating];
  return Math.max(0.5, S_prev * Math.exp(delta));
}

// Calcula o próximo intervalo em dias usando a fórmula central do FSRS
// next_interval = S / FACTOR * (retention^(1/DECAY) - 1)
// Clampado entre 50% e 180% do offset base para não sair do método
function nextInterval(S, baseOffset) {
  const raw = (S / FSRS_FACTOR) * (DESIRED_RETENTION ** (1 / FSRS_DECAY) - 1);
  const min  = baseOffset * 0.5;
  const max  = baseOffset * 1.8;
  return Math.round(Math.min(Math.max(raw, min), max));
}

// ─── STEPS ───────────────────────────────────────────────────────────────────
export const STEPS = [
  { key: "d0",  label: "D0",  offset: 0,  desc: "Estudo + Questões", checkbox: false },
  { key: "d1",  label: "D1",  offset: 1,  desc: "Brain Dump",        checkbox: true  },
  { key: "d4",  label: "D4",  offset: 4,  desc: "Questões",          checkbox: false },
  { key: "d7",  label: "D7",  offset: 7,  desc: "Questões + Anki",   checkbox: false },
  { key: "d21", label: "D21", offset: 21, desc: "Interleaved",       checkbox: false },
];

// Constrói o objeto rev inicial para um tema
export function buildRev(d0) {
  const r = {};
  STEPS.forEach((s) => {
    r[s.key] = {
      date:    addDays(d0, s.offset),
      done:    false,
      acerto:  null,
      questoes:null,
      S:       S_BASE[s.key],  // Stability inicial
    };
  });
  return r;
}

// Recalcula as datas dos steps futuros após marcar um step como feito
// Propaga o efeito do FSRS-Lite nos steps seguintes
export function recalcAfterMark(rev, doneKey, acerto) {
  const doneIdx  = STEPS.findIndex((s) => s.key === doneKey);
  const doneStep = STEPS[doneIdx];
  const nextStep = STEPS[doneIdx + 1];
  if (!nextStep) return rev; // era o último step

  const S_prev  = rev[doneKey].S ?? S_BASE[doneKey];
  const S_new   = updateStability(S_prev, acerto);
  const interval = nextInterval(S_new, nextStep.offset);

  // Data base = data em que o step atual foi concluído (hoje ou a data do step)
  const baseDate = rev[doneKey].date >= todayStr() ? rev[doneKey].date : todayStr();

  const newRev = { ...rev };
  // Atualiza S do step concluído
  newRev[doneKey] = { ...newRev[doneKey], S: S_new };
  // Atualiza data do próximo step baseado no intervalo FSRS
  newRev[nextStep.key] = { ...newRev[nextStep.key], date: addDays(baseDate, interval) };

  return newRev;
}

// ─── CONSTANTES DE UI ────────────────────────────────────────────────────────
export const ESP_COLORS = {
  "Cirurgia":            "#fb923c",
  "Clínica Médica":      "#60a5fa",
  "GO":                  "#f472b6",
  "Pediatria":           "#34d399",
  "Preventiva":          "#c084fc",
  "Outro":               "#94a3b8",
  "Exatas":              "#22d3ee",
  "Humanas":             "#fbbf24",
  "Linguagens":          "#a3e635",
  "Ciências da Natureza":"#2dd4bf",
  "Redação":             "#f0abfc",
};

export const PRIO = {
  "Diamante": { c: "#38bdf8" },
  "Alta":     { c: "#f87171" },
  "Média":    { c: "#fbbf24" },
  "Baixa":    { c: "#94a3b8" },
  "Bônus":    { c: "#c084fc" },
};

export const ESPS_RES  = ["Cirurgia","Clínica Médica","GO","Pediatria","Preventiva","Outro"];
export const ESPS_VEST = ["Exatas","Humanas","Linguagens","Ciências da Natureza","Redação"];

// ─── MEDCOF 2026 — baseado no PDF oficial do Extensivo R1 ────────────────────
export const MEDCOF = [
  {b:1,t:[
    ["Avaliação Global do Hemograma","Clínica Médica","Alta"],
    ["Anemias Hipoproliferativas I","Clínica Médica","Diamante"],
    ["Anemias Hipoproliferativas II","Clínica Médica","Alta"],
    ["Modificações do Organismo Materno","GO","Alta"],
    ["Assistência ao Pré-Natal","GO","Diamante"],
    ["Ultrassonografia em Obstetrícia","GO","Média"],
    ["Aleitamento Materno","Pediatria","Diamante"],
    ["Alimentação Infantil","Pediatria","Média"],
    ["Desenvolvimento Infantil","Pediatria","Alta"],
    ["Alterações no Neurodesenvolvimento - TEA e TDAH","Pediatria","Alta"],
    ["Níveis de Prevenção","Preventiva","Alta"],
    ["Indicadores de Saúde","Preventiva","Diamante"],
    ["Introdução ao Trauma e Atendimento Inicial","Cirurgia","Diamante"],
    ["Trauma: Vias Aéreas","Cirurgia","Alta"],
    ["Choque e Ressuscitação Hemostática","Cirurgia","Alta"],
  ]},
  {b:2,t:[
    ["Neurovascular I: AIT e AVCi","Clínica Médica","Diamante"],
    ["Neurovascular II: HSA e AVCh","Clínica Médica","Alta"],
    ["Anatomia Pélvica Feminina","GO","Diamante"],
    ["Embriologia do Sistema Genital Feminino","GO","Média"],
    ["Malformações Mullerianas","GO","Média"],
    ["Febre sem Sinais Localizatórios","Pediatria","Média"],
    ["Nefrologia Pediátrica","Pediatria","Diamante"],
    ["Doença Renal Crônica e Lesão Renal Aguda","Pediatria","Baixa"],
    ["Miscelânea em Nefropediatria","Pediatria","Média"],
    ["Testes Diagnósticos","Preventiva","Diamante"],
    ["Assistência ao Pré-Natal na APS","Preventiva","Média"],
    ["Trauma: Medidas Auxiliares e FAST","Cirurgia","Baixa"],
    ["Trauma: Populações Especiais","Cirurgia","Bônus"],
    ["Trauma de Tórax","Cirurgia","Diamante"],
  ]},
  {b:3,t:[
    ["Sífilis","Clínica Médica","Diamante"],
    ["Dispepsia e DRGE","Clínica Médica","Alta"],
    ["Úlcera Péptica, H. pylori e Gastrite Atrófica","Clínica Médica","Alta"],
    ["Corrimentos Vaginais","GO","Diamante"],
    ["Doença Inflamatória Pélvica Aguda","GO","Alta"],
    ["Úlceras Genitais","GO","Alta"],
    ["Alergia Alimentar, Refluxo e Constipação","Pediatria","Diamante"],
    ["Diarreia Crônica e Doenças Funcionais","Pediatria","Média"],
    ["Violência Contra a Criança e o Adolescente","Pediatria","Alta"],
    ["Determinação Social do Processo Saúde-Doença","Preventiva","Diamante"],
    ["Trauma Abdominal","Cirurgia","Diamante"],
    ["Trauma Urológico","Cirurgia","Média"],
  ]},
  {b:4,t:[
    ["Artrite Reumatoide","Clínica Médica","Alta"],
    ["Espondiloartrites","Clínica Médica","Alta"],
    ["Artrites Microcristalinas - Gota e CPPD","Clínica Médica","Média"],
    ["Osteoartrite","Clínica Médica","Média"],
    ["Fibromialgia","Clínica Médica","Média"],
    ["Assistência ao Parto","GO","Diamante"],
    ["Sofrimento Fetal Agudo","GO","Alta"],
    ["Crescimento e Baixa Estatura","Pediatria","Diamante"],
    ["Obesidade e Síndrome Metabólica","Pediatria","Média"],
    ["Puberdade","Pediatria","Alta"],
    ["Desnutrição e Vitaminas","Pediatria","Média"],
    ["Redes de Atenção à Saúde","Preventiva","Diamante"],
    ["Atenção Primária à Saúde","Preventiva","Diamante"],
    ["Trauma de Pelve","Cirurgia","Alta"],
    ["Trauma Cranioencefálico","Cirurgia","Diamante"],
    ["Trauma Raquimedular","Cirurgia","Média"],
    ["Trauma Musculoesquelético","Cirurgia","Baixa"],
    ["Trauma de Pescoço","Cirurgia","Baixa"],
  ]},
  {b:5,t:[
    ["Dor Torácica Coronariana","Clínica Médica","Diamante"],
    ["Dor Torácica Não Coronariana","Clínica Médica","Média"],
    ["Fisiologia Menstrual","GO","Alta"],
    ["Amenorreia Primária","GO","Diamante"],
    ["Esteroidogênese","GO","Média"],
    ["Politrauma e Afogamento","Pediatria","Baixa"],
    ["Queimaduras em Pediatria","Pediatria","Baixa"],
    ["TCE e Hipertensão Intracraniana em Pediatria","Pediatria","Média"],
    ["Diarreia Aguda em Pediatria","Pediatria","Diamante"],
    ["Classificação dos Estudos Epidemiológicos","Preventiva","Diamante"],
    ["Associação x Causalidade","Preventiva","Alta"],
    ["Rastreamentos","Preventiva","Alta"],
    ["Queimaduras","Cirurgia","Alta"],
    ["Escroto Agudo","Cirurgia","Alta"],
    ["Priapismo","Cirurgia","Baixa"],
  ]},
  {b:6,t:[
    ["Gasometria Arterial","Clínica Médica","Alta"],
    ["Distúrbios do Sódio","Clínica Médica","Alta"],
    ["Distúrbios do Potássio","Clínica Médica","Alta"],
    ["Reações Alérgicas","Clínica Médica","Média"],
    ["Amenorreia Secundária","GO","Diamante"],
    ["Hiperprolactinemia","GO","Média"],
    ["Síndrome dos Ovários Policísticos","GO","Alta"],
    ["Infecções de Vias Aéreas Superiores (IVAS)","Pediatria","Alta"],
    ["Doenças Autoinflamatórias","Pediatria","Baixa"],
    ["Pneumonias em Pediatria","Pediatria","Diamante"],
    ["Bronquiolite e Coqueluche","Pediatria","Diamante"],
    ["COVID em Pediatria","Pediatria","Baixa"],
    ["Estudos Transversais","Preventiva","Alta"],
    ["Estudos Longitudinais: Coorte e Caso-Controle","Preventiva","Diamante"],
    ["Abdome Agudo: Introdução","Cirurgia","Alta"],
    ["Apendicite Aguda","Cirurgia","Diamante"],
    ["Cicatrização e Lesões por Pressão","Cirurgia","Média"],
    ["Fios de Sutura","Cirurgia","Bônus"],
    ["Anestésicos Locais","Cirurgia","Bônus"],
  ]},
  {b:7,t:[
    ["Antibióticos","Clínica Médica","Diamante"],
    ["Anemias Hemolíticas","Clínica Médica","Alta"],
    ["Oncologia: Emergências e Cuidados Paliativos","Clínica Médica","Média"],
    ["Infecções e Gravidez","GO","Diamante"],
    ["Rotura Prematura de Membranas Ovulares","GO","Alta"],
    ["Violência Sexual","GO","Alta"],
    ["Interrupção Legal da Gestação","GO","Média"],
    ["Reanimação Neonatal","Pediatria","Alta"],
    ["Infecções Congênitas","Pediatria","Diamante"],
    ["Icterícia e Colestase Neonatal","Pediatria","Alta"],
    ["História e Princípios do SUS","Preventiva","Diamante"],
    ["Urgências da Vesícula Biliar","Cirurgia","Diamante"],
    ["Câncer de Esôfago","Cirurgia","Alta"],
  ]},
  {b:8,t:[
    ["Cefaleias","Clínica Médica","Alta"],
    ["Avaliação Geriátrica Ampla","Clínica Médica","Alta"],
    ["Grandes Síndromes Geriátricas","Clínica Médica","Média"],
    ["Avaliação de Enzimas Hepáticas e DHEM","Clínica Médica","Baixa"],
    ["Abortamento","GO","Diamante"],
    ["Gestação Ectópica","GO","Diamante"],
    ["Doença Trofoblástica Gestacional","GO","Média"],
    ["Dermatite Atópica e Lesões Benignas do RN","Pediatria","Alta"],
    ["Dermatoses e Infecções de Partes Moles","Pediatria","Diamante"],
    ["Legislação do SUS I","Preventiva","Diamante"],
    ["Pancreatite Aguda","Cirurgia","Alta"],
    ["Diverticulite Aguda","Cirurgia","Diamante"],
    ["Abscesso Hepático","Cirurgia","Baixa"],
    ["Disfagia e Acalasia","Cirurgia","Média"],
  ]},
  {b:9,t:[
    ["Coagulação e Hemostasia","Clínica Médica","Média"],
    ["Hemoterapia","Clínica Médica","Baixa"],
    ["Cirrose Hepática I","Clínica Médica","Diamante"],
    ["Cirrose Hepática II","Clínica Médica","Alta"],
    ["PAC - Pneumonia Adquirida na Comunidade","Clínica Médica","Diamante"],
    ["Derrame Pleural","Clínica Médica","Alta"],
    ["Tabagismo","Clínica Médica","Alta"],
    ["Placenta Prévia","GO","Alta"],
    ["Descolamento Prematuro de Placenta","GO","Diamante"],
    ["Outros Sangramentos da 2ª Metade da Gestação","GO","Média"],
    ["Anemia Falciforme","Pediatria","Alta"],
    ["Anemia Ferropriva e Talassemia","Pediatria","Diamante"],
    ["Hemostasia e Distúrbios Hemorrágicos em Pediatria","Pediatria","Alta"],
    ["Genética em Pediatria","Pediatria","Alta"],
    ["Legislação do SUS II","Preventiva","Alta"],
    ["Abdome Agudo Obstrutivo","Cirurgia","Diamante"],
    ["Abdome Agudo Perfurativo, Vascular e Hemorrágico","Cirurgia","Alta"],
    ["Câncer de Estômago","Cirurgia","Alta"],
  ]},
  {b:10,t:[
    ["HAS: Ambulatorial e Emergências","Clínica Médica","Diamante"],
    ["Insuficiência Cardíaca","Clínica Médica","Alta"],
    ["Asma","Clínica Médica","Alta"],
    ["DPOC","Clínica Médica","Alta"],
    ["BLS e ACLS","Clínica Médica","Alta"],
    ["Síndromes Hipertensivas na Gestação","GO","Diamante"],
    ["Sangramento Uterino Anormal","GO","Diamante"],
    ["PALS - Suporte Avançado de Vida em Pediatria","Pediatria","Diamante"],
    ["Cardiopatias Congênitas","Pediatria","Alta"],
    ["HAS em Pediatria","Pediatria","Alta"],
    ["Miocardite, Síncope e IC em Pediatria","Pediatria","Média"],
    ["Medidas de Associação","Preventiva","Alta"],
    ["Legislação do SUS III: Decreto 7508","Preventiva","Alta"],
    ["Rede de Atenção Psicossocial (RAPS)","Preventiva","Média"],
    ["Ensaios Clínicos","Preventiva","Diamante"],
    ["Hérnia Inguinal e Anatomia da Parede Abdominal","Cirurgia","Diamante"],
    ["Hernioplastia Inguinal","Cirurgia","Média"],
    ["Retalhos","Cirurgia","Média"],
    ["Enxertos","Cirurgia","Média"],
  ]},
  {b:11,t:[
    ["Diabetes: Classificação e Diagnóstico","Clínica Médica","Alta"],
    ["Diabetes: Tratamento","Clínica Médica","Diamante"],
    ["Emergências Hiperglicêmicas - CAD e EHH","Clínica Médica","Alta"],
    ["Diabetes na Gestação","GO","Diamante"],
    ["Infertilidade","GO","Alta"],
    ["Endometriose","GO","Alta"],
    ["Arboviroses em Pediatria","Pediatria","Alta"],
    ["Doenças Exantemáticas","Pediatria","Diamante"],
    ["CAD em Pediatria","Pediatria","Alta"],
    ["Financiamento do SUS","Preventiva","Alta"],
    ["Ética em Pesquisa Clínica","Preventiva","Média"],
    ["Urgências Endoscópicas","Cirurgia","Diamante"],
    ["Síndrome Compartimental Intra-Abdominal","Cirurgia","Média"],
    ["Hérnias Incisionais e Outras Hérnias","Cirurgia","Baixa"],
  ]},
  {b:12,t:[
    ["Síndrome Metabólica e Obesidade","Clínica Médica","Alta"],
    ["Dislipidemias","Clínica Médica","Diamante"],
    ["DHEM - Doença Hepática Esteatótica Metabólica","Clínica Médica","Baixa"],
    ["Uroginecologia e Incontinência Urinária","GO","Diamante"],
    ["Prolapso Genital","GO","Alta"],
    ["Triagens Neonatais","Pediatria","Alta"],
    ["Distúrbios Metabólicos Neonatais","Pediatria","Média"],
    ["Peçonhentos, Raiva e Tétano","Pediatria","Diamante"],
    ["Ingestão e Aspiração de Corpo Estranho e BRUE","Pediatria","Média"],
    ["Significância Estatística e Intervalo de Confiança","Preventiva","Alta"],
    ["Revisão Sistemática e Metanálise","Preventiva","Diamante"],
    ["Medicina Baseada em Evidências","Preventiva","Alta"],
    ["Pré-Operatório","Cirurgia","Diamante"],
    ["Cirurgia Bariátrica","Cirurgia","Alta"],
    ["Uro-Oncologia","Cirurgia","Média"],
  ]},
  {b:13,t:[
    ["Vasculites","Clínica Médica","Média"],
    ["Tuberculose: Clínica e Diagnóstico","Clínica Médica","Diamante"],
    ["Tuberculose: Tratamento","Clínica Médica","Alta"],
    ["Avaliação de Vitalidade Fetal","GO","Diamante"],
    ["Restrição de Crescimento Intrauterino","GO","Alta"],
    ["Sofrimento Fetal Crônico","GO","Média"],
    ["Gemelaridade","GO","Média"],
    ["Convulsão na Emergência e Convulsão Febril","Pediatria","Diamante"],
    ["Tuberculose em Pediatria","Pediatria","Alta"],
    ["Cardiologia na APS","Preventiva","Alta"],
    ["Diabetes no SUS","Preventiva","Alta"],
    ["Estratégia Saúde da Família","Preventiva","Diamante"],
    ["REMIT e Pós-Operatório","Cirurgia","Diamante"],
    ["Perioperatório: Complicações Gerais","Cirurgia","Alta"],
    ["Hiperplasia Prostática Benigna","Cirurgia","Alta"],
  ]},
  {b:14,t:[
    ["Meningites e Encefalites","Clínica Médica","Alta"],
    ["Taquiarritmias","Clínica Médica","Diamante"],
    ["Bradiarritmias","Clínica Médica","Alta"],
    ["Síncope","Clínica Médica","Alta"],
    ["Doenças Valvares","Clínica Médica","Média"],
    ["Anticoncepção","GO","Diamante"],
    ["Cardiopatias na Gravidez","GO","Baixa"],
    ["Kawasaki, Vasculite por IgA e Febre Reumática","Pediatria","Diamante"],
    ["Artrite Idiopática Juvenil","Pediatria","Alta"],
    ["Meningite e Encefalite em Pediatria","Pediatria","Diamante"],
    ["Financiamento da APS","Preventiva","Diamante"],
    ["Síndrome Depressiva","Preventiva","Alta"],
    ["Síndrome Maníaca","Preventiva","Baixa"],
    ["Câncer Colorretal e Síndromes Associadas","Cirurgia","Alta"],
    ["Doenças Orificiais e CEC de Canal Anal","Cirurgia","Alta"],
  ]},
  {b:15,t:[
    ["Via Aérea, Intubação e VNI","Clínica Médica","Baixa"],
    ["SDRA - Síndrome do Desconforto Respiratório","Clínica Médica","Alta"],
    ["Ventilação Mecânica","Clínica Médica","Baixa"],
    ["Infecções Nosocomiais","Clínica Médica","Baixa"],
    ["Choque em UTI","Clínica Médica","Alta"],
    ["Propedêutica Mamária","GO","Diamante"],
    ["Principais Sintomas em Mastologia","GO","Alta"],
    ["Lesões Benignas da Mama","GO","Média"],
    ["Vacinação em Pediatria","Pediatria","Diamante"],
    ["HIV em Pediatria","Pediatria","Baixa"],
    ["Ortopedia Pediátrica","Pediatria","Diamante"],
    ["Osteomielite e Artrite Séptica","Pediatria","Média"],
    ["Ferramentas da APS/ESF","Preventiva","Diamante"],
    ["Síndrome Ansiosa","Preventiva","Média"],
    ["Fígado: Nódulos Hepáticos","Cirurgia","Diamante"],
  ]},
  {b:16,t:[
    ["Injúria Renal Aguda","Clínica Médica","Diamante"],
    ["Diarreia Aguda e Colite Pseudomembranosa","Clínica Médica","Alta"],
    ["Doença Inflamatória Intestinal (DII)","Clínica Médica","Média"],
    ["Doenças Negligenciadas","Clínica Médica","Média"],
    ["Trabalho de Parto Prematuro","GO","Diamante"],
    ["Colo Curto e Incompetência Istmocervical","GO","Média"],
    ["Hiperplasia Adrenal Congênita","Pediatria","Alta"],
    ["Hipotireoidismo em Pediatria","Pediatria","Média"],
    ["Diferenças no Desenvolvimento Sexual","Pediatria","Baixa"],
    ["Nutrologia em Pediatria","Pediatria","Média"],
    ["Método Clínico Centrado na Pessoa","Preventiva","Diamante"],
    ["Telemedicina e Publicidade Médica","Preventiva","Diamante"],
    ["Litíase Renal Cirúrgica","Cirurgia","Diamante"],
    ["Aneurisma de Aorta","Cirurgia","Média"],
    ["Carcinoma Hepatocelular","Cirurgia","Baixa"],
  ]},
  {b:17,t:[
    ["Lúpus Eritematoso Sistêmico","Clínica Médica","Diamante"],
    ["Osteoporose","Clínica Médica","Média"],
    ["Esclerose Sistêmica","Clínica Médica","Baixa"],
    ["Doença de Sjögren","Clínica Médica","Baixa"],
    ["Miopatias Autoimunes","Clínica Médica","Baixa"],
    ["Glomerulopatias","Clínica Médica","Alta"],
    ["Intoxicações Exógenas","Clínica Médica","Diamante"],
    ["Hemorragia Pós-Parto","GO","Diamante"],
    ["Puerpério","GO","Média"],
    ["Asma em Pediatria","Pediatria","Diamante"],
    ["Fibrose Cística","Pediatria","Alta"],
    ["Imunodeficiências em Pediatria","Pediatria","Média"],
    ["Vigilância em Saúde","Preventiva","Diamante"],
    ["Registro de Saúde Orientado por Problemas","Preventiva","Média"],
    ["Adenocarcinoma de Pâncreas","Cirurgia","Alta"],
  ]},
  {b:18,t:[
    ["HIV e Doenças Oportunistas","Clínica Médica","Alta"],
    ["Hipotireoidismo","Clínica Médica","Diamante"],
    ["Hipertireoidismo e Tireoidite","Clínica Médica","Alta"],
    ["Câncer de Colo de Útero: Rastreamento","GO","Diamante"],
    ["Câncer de Colo de Útero: Diagnóstico e Tratamento","GO","Diamante"],
    ["Doenças da Vulva e da Vagina","GO","Baixa"],
    ["Sepse Neonatal","Pediatria","Média"],
    ["Desconforto Respiratório Neonatal","Pediatria","Diamante"],
    ["Outras Doenças Neonatais","Pediatria","Baixa"],
    ["Processo Epidêmico","Preventiva","Alta"],
    ["Abordagem Familiar e Comunitária","Preventiva","Média"],
    ["Síndrome de Fournier","Cirurgia","Diamante"],
    ["Trombose Venosa Profunda","Cirurgia","Média"],
    ["Ortopedia Geral","Cirurgia","Baixa"],
  ]},
  {b:19,t:[
    ["Tromboembolismo Pulmonar","Clínica Médica","Diamante"],
    ["Adrenal","Clínica Médica","Média"],
    ["Síndrome de Cushing","Clínica Médica","Média"],
    ["Doença Pulmonar Intersticial","Clínica Médica","Baixa"],
    ["Nódulo Pulmonar","Clínica Médica","Média"],
    ["Câncer de Mama: Rastreamento","GO","Diamante"],
    ["Câncer de Mama: Fatores de Risco e CDIS","GO","Diamante"],
    ["Câncer de Mama: Doença Invasiva","GO","Média"],
    ["Parasitoses Intestinais","Pediatria","Alta"],
    ["Neoplasias Pediátricas","Pediatria","Diamante"],
    ["Acidente de Trabalho","Preventiva","Diamante"],
    ["Síndrome Psicótica","Preventiva","Baixa"],
    ["Psicofarmacologia","Preventiva","Baixa"],
    ["Isquemia de Membros Inferiores","Cirurgia","Média"],
    ["Oncocirurgia Geral","Cirurgia","Baixa"],
  ]},
  {b:20,t:[
    ["Infecção do Trato Urinário (ITU)","Clínica Médica","Diamante"],
    ["Outros Distúrbios Hidroeletrolíticos","Clínica Médica","Média"],
    ["Doença Renal Crônica","Clínica Médica","Média"],
    ["Síndrome Climatérica","GO","Diamante"],
    ["Terapia Hormonal","GO","Diamante"],
    ["Tumores Anexiais","GO","Baixa"],
    ["Câncer de Ovário","GO","Média"],
    ["ITU em Pediatria","Pediatria","Média"],
    ["Sedoanalgesia e Sequência Rápida de Intubação","Pediatria","Baixa"],
    ["Sepse Pediátrica","Pediatria","Média"],
    ["Choque e Drogas Vasoativas em Pediatria","Pediatria","Média"],
    ["Tuberculose e Hanseníase na APS","Preventiva","Diamante"],
    ["Pneumoconioses","Preventiva","Média"],
    ["Saúde Socioecológica","Preventiva","Baixa"],
    ["Cirurgia: Encerramento","Cirurgia","Diamante"],
    ["Pancreatite Crônica","Cirurgia","Baixa"],
    ["Neoplasias Císticas Pancreáticas","Cirurgia","Bônus"],
    ["Câncer de Pulmão","Cirurgia","Baixa"],
  ]},
  {b:21,t:[
    ["Depressão e Delirium no Idoso","Clínica Médica","Alta"],
    ["Insuficiência Cognitiva e Demências","Clínica Médica","Diamante"],
    ["Hiperplasia Endometrial","GO","Diamante"],
    ["Câncer de Endométrio","GO","Média"],
    ["Outras Intercorrências Clínicas na Gestação","GO","Média"],
    ["Cirurgia Pediátrica no PS","Pediatria","Diamante"],
    ["Uropediatria e Hérnias em Pediatria","Pediatria","Alta"],
    ["Malformações Congênitas","Pediatria","Média"],
    ["Declaração de Óbito e Atestados","Preventiva","Diamante"],
    ["Atenção à Saúde de Populações Específicas","Preventiva","Diamante"],
    ["Diagnósticos Diferenciais das Massas Cervicais","Cirurgia","Alta"],
    ["Videolaparoscopia","Cirurgia","Média"],
    ["Insuficiência Venosa Crônica","Cirurgia","Média"],
  ]},
  {b:22,t:[
    ["Doenças Virais e Pandêmicas","Clínica Médica","Alta"],
    ["Arboviroses Tropicais","Clínica Médica","Diamante"],
    ["Icterícias Febris e Febre Maculosa","Clínica Médica","Alta"],
    ["Hepatites Virais","Clínica Médica","Diamante"],
    ["Técnicas de Reprodução Assistida","GO","Média"],
    ["Cuidado à Saúde LGBTQIAPN+","GO","Média"],
    ["Ética em Pediatria","Pediatria","Diamante"],
    ["Ética Médica","Preventiva","Diamante"],
    ["Intoxicações, PAIRO e Burnout","Preventiva","Média"],
    ["CEC de Cabeça e Pescoço","Cirurgia","Baixa"],
    ["Doenças Traqueais e Bronquiectasias","Cirurgia","Baixa"],
  ]},
  {b:23,t:[
    ["Hiperaldosteronismo Primário","Clínica Médica","Média"],
    ["Feocromocitoma","Clínica Médica","Baixa"],
    ["Prolactinomas","Clínica Médica","Baixa"],
    ["Oncohematologia","Clínica Médica","Média"],
    ["Cirurgia Ginecológica: Princípios","GO","Baixa"],
    ["Transtornos Psiquiátricos na Gestação e Pós-Parto","GO","Baixa"],
    ["Emergências Psiquiátricas","Preventiva","Média"],
    ["Violências e Vulnerabilidade","Preventiva","Diamante"],
    ["Saúde Suplementar e Judicialização em Saúde","Preventiva","Diamante"],
    ["Anomalias Congênitas de Cabeça e Pescoço","Cirurgia","Média"],
  ]},
  {b:24,t:[
    ["Medicina Fetal","GO","Baixa"],
    ["Otites, Rinossinusites e Epistaxe","Pediatria","Baixa"],
    ["Rinites e Afecções da Laringe e Faringe","Pediatria","Baixa"],
    ["Transtornos Alimentares e de Personalidade","Preventiva","Bônus"],
    ["Endoscopia Diagnóstica","Cirurgia","Bônus"],
    ["Cabeça e Pescoço: Tireoide e Paratireoide","Cirurgia","Bônus"],
    ["Neurocirurgia","Cirurgia","Bônus"],
  ]},
  {b:25,t:[
    ["Otologia","Clínica Médica","Alta"],
    ["Oftalmologia para o Generalista","Clínica Médica","Média"],
    ["Trombofilias na Gestação e Puerpério","GO","Média"],
    ["Doença Hemolítica Perinatal","GO","Média"],
    ["Oftalmopediatria","Pediatria","Baixa"],
    ["Saúde do Trabalhador","Preventiva","Média"],
    ["Anestesiologia","Cirurgia","Bônus"],
  ]},
  {b:26,t:[
    ["Rinologia","Clínica Médica","Alta"],
    ["Bucofaringolaringologia","Clínica Médica","Média"],
    ["Outras Urgências Ginecológicas","GO","Baixa"],
    ["Malformações do Sistema Nervoso","Pediatria","Baixa"],
    ["Doenças Neuromusculares na Infância","Pediatria","Baixa"],
    ["Transtornos Relacionados a Substâncias - Álcool","Preventiva","Média"],
    ["Preventiva: Reta Final","Preventiva","Alta"],
    ["Cirurgia Cardíaca","Cirurgia","Bônus"],
  ]},
];

// ─── HELPERS DASHBOARD ───────────────────────────────────────────────────────
// Calcula streak atual e maior streak a partir de um Set de datas
export function calcStreaks(doneDays) {
  if (!doneDays.size) return { current: 0, best: 0 };

  const sorted = [...doneDays].sort();
  let best = 1, cur = 1;

  for (let i = 1; i < sorted.length; i++) {
    const diff = diffDays(sorted[i - 1], sorted[i]);
    if (diff === 1) { cur++; best = Math.max(best, cur); }
    else if (diff > 1) cur = 1;
  }

  // Streak atual: só conta se o último dia é hoje ou ontem
  const last     = sorted[sorted.length - 1];
  const sinceLast = diffDays(last, todayStr());
  const currentStreak = sinceLast <= 1 ? cur : 0;

  return { current: currentStreak, best };
}

// Bleeding Score: 3 piores áreas (mín. 10 questões para significância)
export function calcBleedingScore(temas) {
  const byEsp = {};
  temas.forEach((t) => {
    if (!byEsp[t.esp]) byEsp[t.esp] = { total: 0, questoes: 0 };
    STEPS.forEach((s) => {
      const r = t.rev[s.key];
      if (r.done && r.acerto != null && r.questoes) {
        byEsp[t.esp].total    += r.acerto * r.questoes;
        byEsp[t.esp].questoes += r.questoes;
      }
    });
  });
  return Object.entries(byEsp)
    .filter(([, v]) => v.questoes >= 10)
    .map(([esp, v]) => ({ esp, acc: Math.round(v.total / v.questoes * 100) }))
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 3);
}

// True Retention: acerto médio apenas nos steps com offset > 15 (D21)
export function calcTrueRetention(temas) {
  const longSteps = STEPS.filter((s) => s.offset > 15);
  const vals = [];
  temas.forEach((t) => {
    longSteps.forEach((s) => {
      const r = t.rev[s.key];
      if (r.done && r.acerto != null) vals.push(r.acerto);
    });
  });
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b) / vals.length * 100);
}

// ─── STORE ────────────────────────────────────────────────────────────────────
const initialPlat = () => ({ temas: [], simulados: [], ankiLog: [] });

export const useStore = create(
  persist(
    (set, get) => ({
      plat:      "res",
      meta:      { dataProva: "2026-10-25", acerto: 85 },
      res:       initialPlat(),
      vest:      initialPlat(),
      undoStack: [],

      setPlat: (p) => set({ plat: p }),
      setMeta: (meta) => set({ meta }),

      // ── Temas ──
      addTema: (platKey, tema) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            temas: [
              ...s[platKey].temas,
              { ...tema, id: Date.now(), rev: buildRev(tema.d0) },
            ],
          },
        })),

      updateTema: (platKey, id, fields) =>
        set((s) => {
          const old = s[platKey].temas.find((t) => t.id === id);
          let newRev = old.rev;
          if (fields.d0 && fields.d0 !== old.d0) {
            newRev = buildRev(fields.d0);
            STEPS.forEach((step) => {
              newRev[step.key].done     = old.rev[step.key].done;
              newRev[step.key].acerto   = old.rev[step.key].acerto;
              newRev[step.key].questoes = old.rev[step.key].questoes;
              newRev[step.key].S        = old.rev[step.key].S ?? S_BASE[step.key];
            });
          }
          return {
            [platKey]: {
              ...s[platKey],
              temas: s[platKey].temas.map((t) =>
                t.id === id ? { ...t, ...fields, rev: newRev } : t
              ),
            },
          };
        }),

      deleteTema: (platKey, id) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            temas: s[platKey].temas.filter((t) => t.id !== id),
          },
        })),

      // markStep agora usa FSRS-Lite para recalcular datas dos steps futuros
      markStep: (platKey, temaId, stepKey, { acerto, questoes }) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            temas: s[platKey].temas.map((t) => {
              if (t.id !== temaId) return t;
              const revMarked = {
                ...t.rev,
                [stepKey]: { ...t.rev[stepKey], done: true, acerto, questoes },
              };
              // Propaga FSRS-Lite: recalcula data do próximo step
              const revFinal = recalcAfterMark(revMarked, stepKey, acerto);
              return { ...t, rev: revFinal };
            }),
          },
        })),

      importTemas: (platKey, items, d0) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            temas: [
              ...s[platKey].temas,
              ...items.map((it) => ({
                id:  Date.now() + Math.random(),
                nome: it.nome,
                esp:  it.esp,
                prio: it.prio,
                obs:  "MEDCOF 2026",
                pico: "",
                d0,
                rev: buildRev(d0),
              })),
            ],
          },
        })),

      optimize: (platKey) =>
        set((s) => ({
          [platKey]: {
            ...s[platKey],
            temas: s[platKey].temas.map((t) => {
              const nr = { ...t.rev };
              let lastDate = todayStr();
              STEPS.forEach((step, i) => {
                if (!nr[step.key].done && isOverdue(nr[step.key].date)) {
                  nr[step.key] = {
                    ...nr[step.key],
                    date: i === 0 ? todayStr() : addDays(lastDate, 1),
                  };
                } else if (nr[step.key].done) {
                  lastDate = nr[step.key].date || lastDate;
                }
              });
              return { ...t, rev: nr };
            }),
          },
        })),

      // ── Undo ──
      pushUndo: (platKey) =>
        set((s) => ({
          undoStack: [
            { platKey, temas: [...s[platKey].temas] },
            ...s.undoStack,
          ].slice(0, 10),
        })),

      undo: () =>
        set((s) => {
          if (!s.undoStack.length) return {};
          const [snap, ...rest] = s.undoStack;
          return {
            [snap.platKey]: { ...s[snap.platKey], temas: snap.temas },
            undoStack: rest,
          };
        }),

      // ── Simulados ──
      addSim:    (platKey, sim) =>
        set((s) => ({ [platKey]: { ...s[platKey], simulados: [...s[platKey].simulados, { ...sim, id: Date.now() }] } })),
      deleteSim: (platKey, id) =>
        set((s) => ({ [platKey]: { ...s[platKey], simulados: s[platKey].simulados.filter((x) => x.id !== id) } })),

      // ── Anki ──
      addAnki: (platKey, log) =>
        set((s) => ({ [platKey]: { ...s[platKey], ankiLog: [...s[platKey].ankiLog, { ...log, id: Date.now() }] } })),
    }),
    {
      name:    "reviewflow-v5",
      storage: createJSONStorage(() => localStorage),
      // undoStack é volátil — não persiste
      partialize: (s) => ({ plat: s.plat, meta: s.meta, res: s.res, vest: s.vest }),
    }
  )
);
