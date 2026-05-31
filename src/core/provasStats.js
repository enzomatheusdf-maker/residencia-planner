// src/core/provasStats.js
// Centralized weights and statistics for ENAMED and Vestibular targets

import { ENAMED_HOTNESS, MACRO_PESO_ENAMED } from "../constants/enamedIncidencia";

export const PESO_AREA_ENAMED = MACRO_PESO_ENAMED;

export const BONUS_RETORNO_RAPIDO = {
  "Preventiva": 0.10,
};

export const PESO_AREA_VEST = {
  "Exatas": 1.0,
  "Humanas": 1.0,
  "Linguagens": 1.0,
  "Ciências da Natureza": 1.0,
  "Redação": 1.0,
};

const AREA_ALIASES = {
  "clinica medica": "Clínica Médica",
  "clinica": "Clínica Médica",
  "cirurgia": "Cirurgia",
  "cirurgia geral": "Cirurgia",
  "preventiva": "Preventiva",
  "preventiva mfc": "Preventiva",
  "preventiva saude publica": "Preventiva",
  "preventiva saude coletiva": "Preventiva",
  "pediatria": "Pediatria",
  "go": "GO",
  "ginecologia": "GO",
  "obstetricia": "GO",
  "outro": "Outro",
};

const HOTNESS_KEYWORDS = {
  "Clínica Médica": {
    "Cardiologia": ["cardio", "coronariana", "has", "insuficiencia cardiaca", "taquiarritmias", "bradiarritmias", "valvares"],
    "Reumatologia": ["reumato", "artrite", "vasculite", "lupus", "espondilo", "fibromialgia", "sjogren"],
    "Infectologia": ["infect", "tuberculose", "hiv", "hepatites", "arboviroses", "sifilis", "antibioticos"],
    "Nefrologia": ["renal", "nefro", "glomerulo", "hidroeletrolitico", "sodio", "potassio", "gasometria"],
    "Pneumologia": ["pneumo", "asma", "dpoc", "pac", "pleural", "tromboembolismo", "ventilacao"],
    "Neurologia": ["neuro", "avc", "cefaleia", "sincope", "meningite", "encefalite"],
    "Gastroenterologia": ["gastro", "cirrose", "hepatica", "dispepsia", "drge", "ulcera", "diarreia"],
    "Endocrinologia": ["diabetes", "tireoide", "hipotireoidismo", "hipertireoidismo", "metabolica", "adrenal"],
  },
  "Cirurgia": {
    "Cirurgia Geral": ["abdome agudo", "apendicite", "trauma", "hernia", "queimadura", "escroto agudo", "pos operatorio", "pre operatorio"],
    "Cirurgia do Aparelho Digestivo": ["vesicula", "pancreatite", "diverticulite", "esofago", "estomago", "figado", "colorretal", "acalasia"],
    "Cirurgia Plástica": ["retalho", "enxerto", "cicatrizacao", "lesoes por pressao"],
    "Ortopedia": ["ortopedia", "musculoesqueletico"],
    "Anestesia": ["anestesia", "anestesico", "sedoanalgesia"],
    "Cabeça e Pescoço": ["cabeca", "pescoco", "tireoide", "paratireoide"],
    "Endoscopia": ["endoscopia", "endoscopica"],
    "Cirurgia Torácica": ["toracica", "torax", "pulmao", "bronquiectasia"],
  },
  "Preventiva": {
    "APS / MFC / ESF": ["aps", "mfc", "esf", "familia", "comunitaria", "pessoa", "primaria"],
    "Epidemiologia": ["epidemi", "estudos", "teste diagnostico", "indicadores", "associacao", "causalidade", "metanalise", "evidencias"],
    "Medicina Legal / Ética": ["etica", "atestado", "obito", "publicidade medica", "legal"],
    "Política / Gestão / SUS": ["sus", "gestao", "politica", "financiamento", "legislacao", "redes"],
    "Vigilância em Saúde": ["vigilancia", "processo epidemico", "quimioprofilaxia"],
    "Saúde do Trabalhador": ["trabalhador", "acidente de trabalho", "pneumoconiose", "burnout"],
  },
  "Pediatria": {
    "Infectologia Pediátrica": ["vacina", "ivai", "pneumonia", "bronquiolite", "coqueluche", "infecc", "hiv", "tuberculose", "meningite", "arbovirose"],
    "Puericultura": ["puericultura", "aleitamento", "alimentacao", "desenvolvimento", "crescimento", "puberdade"],
    "Neonatologia": ["neonatal", "recem nascido", "sepse neonatal", "triagem neonatal", "ictericia"],
    "Emergências Pediátricas": ["emergencia", "convulsao", "pals", "choque", "sepse", "intubacao", "tce"],
    "Oncologia Pediátrica": ["neoplasia", "oncologia"],
    "Cardiologia Pediátrica": ["cardiopatia", "cardio", "miocardite", "has"],
    "Gastro Pediátrica": ["diarreia", "refluxo", "constipacao", "gastro"],
    "Nefrologia Pediátrica": ["nefro", "renal", "itu"],
  },
  "GO": {
    "Ginecologia Geral": ["corrimento", "vaginal", "vulva", "dip", "ulcera genital", "anticoncepcao", "sangramento uterino"],
    "Ginecologia Endócrina": ["amenorreia", "climaterica", "hormonal", "sopc", "hiperprolactinemia", "fisiologia menstrual"],
    "Oncoginecologia": ["colo de utero", "endometrio", "ovario", "oncoginecologia"],
    "Mastologia": ["mama", "mamaria", "mastologia"],
    "Uroginecologia": ["uroginecologia", "incontinencia", "prolapso"],
    "Assistência Pré-Natal": ["pre natal"],
    "Gestação Alto Risco": ["alto risco", "hipertensiva", "pre eclampsia", "diabetes na gestacao", "gemelaridade", "crescimento intrauterino"],
    "Emergências Obstétricas": ["abortamento", "ectopica", "sangramento", "placenta", "descolamento", "hemorragia", "rotura"],
    "Assistência ao Parto": ["parto", "puerperio"],
    "Medicina Fetal": ["fetal", "ultrassonografia obstetrica", "vitalidade"],
  },
};

const MOJIBAKE_MARKER_CODES = new Set([0xc2, 0xc3, 0xe2]);

function repairMojibake(value) {
  const text = String(value ?? "");
  const hasMarker = Array.from(text).some((char) => MOJIBAKE_MARKER_CODES.has(char.charCodeAt(0)));
  if (!hasMarker || typeof TextDecoder === "undefined") return text;

  try {
    const bytes = Uint8Array.from(Array.from(text).map((char) => char.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return decoded || text;
  } catch {
    return text;
  }
}

function normalizeText(value) {
  return repairMojibake(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getCanonicalArea(area) {
  const normalized = normalizeText(area);
  if (AREA_ALIASES[normalized]) return AREA_ALIASES[normalized];

  return Object.keys(MACRO_PESO_ENAMED).find((key) => normalizeText(key) === normalized) || area;
}

function getAreaHotness(area) {
  const canonicalArea = getCanonicalArea(area);
  return ENAMED_HOTNESS[canonicalArea] || null;
}

function getAreaAverage(area) {
  const hotness = getAreaHotness(area);
  if (!hotness) return null;
  const values = Object.values(hotness);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getAreaMax(area) {
  const hotness = getAreaHotness(area);
  if (!hotness) return null;
  return Math.max(...Object.values(hotness));
}

function hasMeaningfulOverlap(candidate, label) {
  const candidateWords = normalizeText(candidate).split(" ").filter((word) => word.length >= 4);
  const labelWords = normalizeText(label).split(" ").filter((word) => word.length >= 4);
  return labelWords.some((word) => candidateWords.includes(word));
}

export function findHotnessSubarea(area, subarea) {
  const hotness = getAreaHotness(area);
  const canonicalArea = getCanonicalArea(area);
  const normalizedSubarea = normalizeText(subarea);
  if (!hotness || !normalizedSubarea) return null;

  const exactLabel = Object.keys(hotness).find((label) => normalizeText(label) === normalizedSubarea);
  if (exactLabel) {
    return {
      area: canonicalArea,
      subarea: exactLabel,
      peso: hotness[exactLabel],
      normalizado: hotness[exactLabel] / getAreaMax(canonicalArea),
      match: "exact",
    };
  }

  const keywordLabels = HOTNESS_KEYWORDS[canonicalArea] || {};
  const keywordLabel = Object.keys(keywordLabels).find((label) =>
    keywordLabels[label].some((keyword) => normalizedSubarea.includes(normalizeText(keyword)))
  );
  if (keywordLabel && hotness[keywordLabel] !== undefined) {
    return {
      area: canonicalArea,
      subarea: keywordLabel,
      peso: hotness[keywordLabel],
      normalizado: hotness[keywordLabel] / getAreaMax(canonicalArea),
      match: "keyword",
    };
  }

  const overlapLabel = Object.keys(hotness).find((label) => hasMeaningfulOverlap(subarea, label));
  if (overlapLabel) {
    return {
      area: canonicalArea,
      subarea: overlapLabel,
      peso: hotness[overlapLabel],
      normalizado: hotness[overlapLabel] / getAreaMax(canonicalArea),
      match: "overlap",
    };
  }

  return null;
}

export function getHotnessSubarea(area, subarea) {
  const match = findHotnessSubarea(area, subarea);
  if (match) return match.peso;
  return getAreaAverage(area);
}

export function getAreaWeight(plat, area, meta = {}) {
  if (plat === "res") {
    return MACRO_PESO_ENAMED[getCanonicalArea(area)] || 1.0;
  }

  // Vestibular can override weights dynamically in meta.pesosArea.
  if (meta?.pesosArea && meta.pesosArea[area] !== undefined) {
    return meta.pesosArea[area];
  }

  return PESO_AREA_VEST[area] || 1.0;
}
