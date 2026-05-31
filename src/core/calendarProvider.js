import { ENAMED_HOTNESS } from "../constants/enamedIncidencia";
import { CALENDAR_PROVIDER_IDS, DEV_ESTRATEGIA_SAMPLE } from "../constants/calendarProviders";

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const AREA_SET = new Set([
  "CARDIOLOGIA",
  "CIRURGIA",
  "ENDOCRINO",
  "GASTRO",
  "GINECOLOGIA",
  "GO",
  "INFECTOLOGIA",
  "PEDIATRIA",
  "OBSTETRÍCIA",
  "OBSTETRICIA",
  "PREVENTIVA",
  "NEFROLOGIA",
  "NEURO",
  "PNEUMO",
  "REUMATO",
  "HEMATO",
  "DERMATO",
  "PSIQUIATRIA",
  "ORTOPEDIA",
  "OTORRINO",
  "OFTALMO",
]);

const NAVIGATION_LINE_SET = new Set([
  "DASHBOARD",
  "SIMULADOS",
  "AGENDA",
  "BANCO",
  "CRONOGRAMA",
  "INICIO",
  "INÍCIO",
  "HOME",
]);

const AREA_CANONICA_MAP = {
  CARDIOLOGIA: "Clínica Médica",
  ENDOCRINO: "Clínica Médica",
  GASTRO: "Clínica Médica",
  INFECTOLOGIA: "Clínica Médica",
  NEFROLOGIA: "Clínica Médica",
  NEURO: "Clínica Médica",
  PNEUMO: "Clínica Médica",
  REUMATO: "Clínica Médica",
  HEMATO: "Clínica Médica",
  DERMATO: "Clínica Médica",
  PSIQUIATRIA: "Clínica Médica",

  CIRURGIA: "Cirurgia",
  ORTOPEDIA: "Cirurgia",
  OTORRINO: "Cirurgia",
  OFTALMO: "Cirurgia",

  GINECOLOGIA: "GO",
  GO: "GO",
  OBSTETRÍCIA: "GO",
  OBSTETRICIA: "GO",

  PEDIATRIA: "Pediatria",
  PREVENTIVA: "Preventiva",
};

const TEMA_NORMALIZATION_RULES = [
  ["Abdome Agudo Inflamatório - Apendicite Aguda", "Apendicite Aguda"],
  ["Abdome Agudo Inflamatório - Colecistite e Colangite Aguda", "Colecistite Aguda / Colangite"],
  ["Diabetes Mellitus - Complicações Agudas", "Emergências Hiperglicêmicas - CAD e EHH"],
  ["Síndromes Hipertensivas da Gestação", "Síndromes Hipertensivas na Gestação"],
  ["Rastreamento do Câncer de Colo Uterino", "Rastreamento do Câncer do Colo do Útero"],
  ["Bronquiolite", "Bronquiolite"],
  ["Hemorragia Pós-Parto", "Hemorragia Pós-Parto"],
  ["Tuberculose", "Tuberculose"],
];

function canonicalWeekLabel(value, fallback = "Semana 1") {
  const line = String(value || "").trim();
  const match = line.match(/^semana\s*(\d+)/i);
  if (match) return `Semana ${Number(match[1])}`;
  return line || fallback;
}

function normalizeAreaLabel(area = "") {
  const cleaned = String(area || "")
    .trim()
    .replace(/^[\d\-.:)\s]+/, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
  return cleaned;
}

function areaLooksLikeTag(value = "") {
  const normalized = normalizeAreaLabel(value);
  return AREA_SET.has(normalized);
}

function isNavigationLine(value = "") {
  const cleaned = String(value || "").trim();
  if (!cleaned) return true;
  const up = cleaned.toUpperCase();
  if (NAVIGATION_LINE_SET.has(up)) return true;
  if (/^p(a|á)gina\s+\d+/i.test(cleaned)) return true;
  if (/^\d+\s*\/\s*\d+$/.test(cleaned)) return true;
  if (/^\d+%$/.test(cleaned)) return true;
  if (/^(sum[aá]rio|menu|voltar|pr[oó]xima?|anterior)$/i.test(cleaned)) return true;
  if (/^\d+$/.test(cleaned)) return true;
  return false;
}

function normalizeTemaName(temaOriginal = "") {
  const trimmed = String(temaOriginal || "").trim();
  if (!trimmed) return "";
  const exact = TEMA_NORMALIZATION_RULES.find(([from]) => normalizeText(from) === normalizeText(trimmed));
  return exact ? exact[1] : trimmed;
}

function getAreaCanonica(areaOriginal = "") {
  const key = normalizeAreaLabel(areaOriginal);
  return AREA_CANONICA_MAP[key] || areaOriginal || "Outro";
}

export function mapAreaOriginalToCanonica(areaOriginal = "") {
  return getAreaCanonica(areaOriginal);
}

export function normalizeCalendarTopic(raw = {}, providerId = CALENDAR_PROVIDER_IDS.USER_IMPORTED) {
  const temaOriginal = String(raw.temaOriginal || raw.tema || raw.title || raw.nome || "").trim();
  const temaNormalizado = normalizeTemaName(raw.temaNormalizado || temaOriginal);
  const areaOriginal = String(raw.areaOriginal || raw.area || "").trim() || "Outro";
  const areaCanonica = raw.areaCanonica || getAreaCanonica(areaOriginal);
  const semana = canonicalWeekLabel(raw.semana, "Semana 1");
  const ordem = raw.ordem != null ? Number(raw.ordem) : null;
  const temaMedcofMatch = raw.temaMedcofMatch || null;
  const mappingStatus = raw.mappingStatus || (temaMedcofMatch ? "mapeado" : "pendente");
  const enamedScore = Number(raw.enamedScore || 0);
  const casoClinicoIds = Array.isArray(raw.casoClinicoIds) ? raw.casoClinicoIds : [];
  const hasCasoClinico = Boolean(raw.hasCasoClinico || casoClinicoIds.length > 0);
  const dia = raw.dia || null;

  return {
    id: raw.id || `${providerId}-${normalizeText(temaOriginal)}-${normalizeText(semana)}-${ordem ?? "o"}-${dia || "d"}`,
    providerId,
    temaOriginal,
    temaNormalizado,
    temaMedcofMatch,
    areaOriginal,
    areaCanonica,
    area: areaCanonica,
    semana,
    ordem,
    dia,
    mappingStatus,
    enamedScore,
    hasCasoClinico,
    casoClinicoIds,
    sourceType: raw.sourceType || "user_import",
    meta: raw.meta || {},
  };
}

export function parseEstrategiaText(input = "") {
  const lines = String(input)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const items = [];
  let semanaAtual = "Semana 1";
  let currentArea = null;
  let ordemSemana = 0;

  lines.forEach((line, idx) => {
    if (isNavigationLine(line)) return;

    const weekMatch = line.match(/^semana\s*(\d+)/i);
    if (weekMatch) {
      semanaAtual = `Semana ${Number(weekMatch[1])}`;
      ordemSemana = 0;
      currentArea = null;
      return;
    }

    if (areaLooksLikeTag(line)) {
      currentArea = normalizeAreaLabel(line);
      return;
    }

    const dayPattern = line.match(/^(segunda|terca|terça|quarta|quinta|sexta|sabado|sábado|domingo)\s*[-:]\s*(.+)$/i);
    if (dayPattern) {
      ordemSemana += 1;
      items.push(
        normalizeCalendarTopic(
          {
            semana: semanaAtual,
            ordem: ordemSemana,
            dia: dayPattern[1],
            temaOriginal: dayPattern[2],
            areaOriginal: currentArea || "Outro",
            meta: { parseMode: "legacy_day_line", lineNumber: idx + 1 },
          },
          CALENDAR_PROVIDER_IDS.USER_IMPORTED
        )
      );
      return;
    }

    ordemSemana += 1;
    items.push(
      normalizeCalendarTopic(
        {
          semana: semanaAtual,
          ordem: ordemSemana,
          areaOriginal: currentArea || "Outro",
          temaOriginal: line,
          meta: { parseMode: "area_topic", lineNumber: idx + 1 },
        },
        CALENDAR_PROVIDER_IDS.USER_IMPORTED
      )
    );
  });

  return items;
}

export function parseCalendarImport(raw = "", formatHint = "text") {
  if (formatHint === "json") {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => normalizeCalendarTopic(item, CALENDAR_PROVIDER_IDS.USER_IMPORTED));
  }
  return parseEstrategiaText(raw);
}

export function matchMedcofTopic(topic = "", medcofTopics = []) {
  const target = normalizeText(topic);
  let best = null;
  let bestScore = 0;
  medcofTopics.forEach((item) => {
    const nome = normalizeText(item?.nome || item?.tema || "");
    if (!nome) return;
    let score = 0;
    if (nome === target) score = 1;
    else if (nome.includes(target) || target.includes(nome)) score = 0.75;
    else {
      const tokens = target.split(" ").filter(Boolean);
      const hits = tokens.filter((t) => nome.includes(t)).length;
      score = tokens.length ? hits / tokens.length : 0;
    }
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  });
  return { best, score: bestScore };
}

function inferEnamedHotness(area = "", tema = "") {
  const table = ENAMED_HOTNESS[area] || {};
  const temaNorm = normalizeText(tema);
  let best = 0;
  Object.entries(table).forEach(([sub, peso]) => {
    const subNorm = normalizeText(sub);
    if (temaNorm.includes(subNorm) || subNorm.includes(temaNorm)) {
      best = Math.max(best, Number(peso || 0));
    }
  });
  return best;
}

export function attachCalendarIntelligence(topic = {}) {
  const temaRef = topic.temaNormalizado || topic.temaOriginal;
  const hotness = inferEnamedHotness(topic.areaCanonica || topic.area, temaRef);
  const mappingStatus = topic.mappingStatus || (topic.temaMedcofMatch ? "mapeado" : "pendente");
  return {
    ...topic,
    mappingStatus,
    enamedScore: topic.enamedScore != null ? Number(topic.enamedScore) : hotness,
    hasCasoClinico: Boolean(topic.hasCasoClinico || (topic.casoClinicoIds || []).length > 0),
    intelligence: {
      enamedHotness: hotness,
      priority: Math.round((0.6 + hotness * 0.4) * 100),
    },
  };
}

export function getProviderSeed(providerId) {
  if (providerId === CALENDAR_PROVIDER_IDS.USER_IMPORTED) {
    return DEV_ESTRATEGIA_SAMPLE.map((item) =>
      normalizeCalendarTopic({ ...item, sourceType: "dev_seed" }, providerId)
    );
  }
  return [];
}
