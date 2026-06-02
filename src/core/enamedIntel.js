// src/core/enamedIntel.js
// Selectors puros para transformar dados ENAMED em decisão de estudo.
// Não usa React, Zustand ou efeitos colaterais.

import {
  ENAMED_BLUEPRINT,
  ENAMED_HOTNESS,
  ENAMED_MACRO_QUESTOES,
  MACRO_PESO_ENAMED,
} from "../constants/enamedIncidencia";
import { STEPS } from "./fsrs";
import { findHotnessSubarea } from "./provasStats";

export const AREAS_ENAMED = ["Clínica Médica", "Cirurgia", "GO", "Pediatria", "Preventiva"];

const AREA_ALIASES = {
  "clinica medica": "Clínica Médica",
  "clinica": "Clínica Médica",
  "clínica médica": "Clínica Médica",
  "clínica": "Clínica Médica",
  "cirurgia": "Cirurgia",
  "cirurgia geral": "Cirurgia",
  "go": "GO",
  "ginecologia": "GO",
  "obstetricia": "GO",
  "obstetrícia": "GO",
  "ginecologia e obstetricia": "GO",
  "ginecologia e obstetrícia": "GO",
  "pediatria": "Pediatria",
  "preventiva": "Preventiva",
  "preventiva mfc": "Preventiva",
  "mfc": "Preventiva",
  "medicina de familia": "Preventiva",
  "medicina de família": "Preventiva",
  "saude coletiva": "Preventiva",
  "saúde coletiva": "Preventiva",
  "sus": "Preventiva",
};

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function canonicalArea(value) {
  const normalized = normalizeText(value);
  if (AREA_ALIASES[normalized]) return AREA_ALIASES[normalized];
  return AREAS_ENAMED.find((area) => normalizeText(area) === normalized) || "Outro";
}

export function matchArea(esp, area) {
  return canonicalArea(esp) === canonicalArea(area);
}

function getStepLogs(tema) {
  return STEPS
    .map((step) => tema?.rev?.[step.key])
    .filter((rev) => rev && rev.done);
}

function getAccuracyFromTema(tema) {
  const logs = getStepLogs(tema).filter((rev) => typeof rev.acerto === "number");
  if (!logs.length) return null;
  const avg = logs.reduce((sum, rev) => sum + rev.acerto, 0) / logs.length;
  return Math.round(avg * 100);
}

function getAreaRetention(temas) {
  const values = temas
    .map(getAccuracyFromTema)
    .filter((value) => typeof value === "number");
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getTemaLabel(tema) {
  return tema?.subarea || tema?.subArea || tema?.tema || tema?.nome || tema?.title || "";
}

export function topHotness(area, n = 4) {
  const canonical = canonicalArea(area);
  const hotness = ENAMED_HOTNESS[canonical];
  if (!hotness) return [];
  return Object.entries(hotness)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([subarea, peso]) => ({
      area: canonical,
      subarea,
      peso,
      pct: Math.round(peso * 100),
    }));
}

function getHotTopicsCobertos(area, temasDaArea) {
  const vistos = new Map();
  temasDaArea.forEach((tema) => {
    const label = getTemaLabel(tema);
    const match = findHotnessSubarea(area, label);
    if (match?.subarea && !vistos.has(match.subarea)) {
      vistos.set(match.subarea, {
        subarea: match.subarea,
        peso: match.peso,
        pct: Math.round(match.peso * 100),
        match: match.match,
      });
    }
  });
  return [...vistos.values()].sort((a, b) => b.peso - a.peso);
}

function getHotTopicsPendentes(area, temasDaArea) {
  const cobertos = new Set(getHotTopicsCobertos(area, temasDaArea).map((item) => item.subarea));
  return topHotness(area, 8)
    .filter((item) => !cobertos.has(item.subarea))
    .slice(0, 4);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function classifyArea({ cobertura, retencao, gap }) {
  if (retencao == null && cobertura === 0) return "sem_dados";
  if (gap >= 75) return "critica";
  if (gap >= 45) return "atencao";
  return "ok";
}

function reasonForArea({ cobertura, retencao }) {
  if (retencao == null && cobertura === 0) return "sem dados: comece por um tema quente da área";
  if (retencao == null) return "sem retenção mensurável: faltam revisões concluídas";
  if (cobertura < 35 && retencao < 70) return "baixa cobertura e baixa retenção";
  if (cobertura < 35) return "baixa cobertura";
  if (retencao < 70) return "baixa retenção";
  return "manutenção";
}

export function getEnamedIntel(temas = []) {
  const listaRaw = AREAS_ENAMED.map((area) => {
    const temasDaArea = temas.filter((tema) => matchArea(tema?.esp, area));
    const iniciados = temasDaArea.filter((tema) => !tema?.unstarted);
    const retencao = getAreaRetention(iniciados);
    const cobertura = temasDaArea.length
      ? Math.round((iniciados.length / temasDaArea.length) * 100)
      : 0;

    const pesoBlueprint = ENAMED_BLUEPRINT[area] ?? 0.20;
    const ajuste = MACRO_PESO_ENAMED[area] ?? 1.0;
    const pesoProva = pesoBlueprint * ajuste;

    // Se não há retenção, use cobertura parcial como proxy fraco de domínio.
    // Isso evita falso 100% e mantém a área sem dados como prioridade real.
    const dominioRetencao = retencao != null ? retencao / 100 : 0;
    const dominioCobertura = cobertura / 100;
    const dominio = clamp01((0.70 * dominioRetencao) + (0.30 * dominioCobertura));
    const gapRaw = pesoProva * (1 - dominio);

    const hotTopicsCobertos = getHotTopicsCobertos(area, iniciados);
    const hotTopicsPendentes = getHotTopicsPendentes(area, iniciados);

    return {
      area,
      total: temasDaArea.length,
      iniciados: iniciados.length,
      cobertura,
      retencao,
      pesoBlueprint,
      ajuste,
      pesoProva,
      dominio: Math.round(dominio * 100),
      gapRaw,
      hotTopics: topHotness(area, 4),
      hotTopicsCobertos,
      hotTopicsPendentes,
    };
  });

  const maxGap = Math.max(...listaRaw.map((item) => item.gapRaw), 0.0001);
  const lista = listaRaw
    .map((item) => {
      const gap = Math.round((item.gapRaw / maxGap) * 100);
      return {
        ...item,
        gap,
        status: classifyArea({ ...item, gap }),
        motivo: reasonForArea(item),
      };
    })
    .sort((a, b) => b.gap - a.gap);

  const gargalo = lista[0] || null;
  const areas = Object.fromEntries(lista.map((item) => [item.area, item]));
  const comDados = lista.filter((item) => item.retencao != null || item.cobertura > 0);
  const coberturaGlobal = lista.length
    ? Math.round(lista.reduce((sum, item) => sum + item.cobertura, 0) / lista.length)
    : 0;

  return {
    lista,
    areas,
    gargalo,
    coberturaGlobal,
    temDados: comDados.length > 0,
  };
}

export function calcPreparoEnamed(temas = []) {
  const { lista } = getEnamedIntel(temas);
  const comDado = lista.filter((item) => item.retencao != null || item.cobertura > 0);
  if (!comDado.length) return null;

  const pesoTotal = comDado.reduce((sum, item) => sum + item.pesoProva, 0) || 1;
  const score = comDado.reduce((sum, item) => {
    const retencao = item.retencao != null ? item.retencao : 0;
    const fatorCobertura = 0.50 + 0.50 * (item.cobertura / 100);
    return sum + item.pesoProva * retencao * fatorCobertura;
  }, 0) / pesoTotal;

  return Math.round(score);
}

// Alias temporário se algum patch antigo já chamou calcProntidaoEnamed.
export const calcProntidaoEnamed = calcPreparoEnamed;

/**
 * Retorna dados quantitativos de incidência no ENAMED para um tema específico.
 * Usado pelo balão contextual no modal de tema e no card do cronograma.
 */
export function getEnamedContextBadge(area, temaName) {
  if (!area || !temaName) return null;
  const match = findHotnessSubarea(area, temaName);
  if (!match) return null;
  const totalArea = ENAMED_MACRO_QUESTOES[match.area] ?? null;
  const questoes = totalArea ? Math.round(match.peso * totalArea) : null;
  const nivel = match.normalizado >= 0.7 ? "alto" : match.normalizado >= 0.35 ? "medio" : "baixo";
  return {
    subarea: match.subarea,
    area: match.area,
    questoes,
    pctAbsoluto: Math.round(match.peso * 100),
    normalizado: Math.round(match.normalizado * 100),
    nivel,
    matchType: match.match,
  };
}

export function getEnamedAction(intel) {
  const gargalo = intel?.gargalo;
  if (!gargalo) {
    return {
      title: "Sem dados ENAMED suficientes",
      detail: "Adicione temas e conclua revisões para gerar o mapa.",
      area: null,
    };
  }

  if (gargalo.retencao == null && gargalo.cobertura === 0) {
    return {
      title: `Comece por ${gargalo.area}`,
      detail: `Sem dados na área. Primeiro tópico sugerido: ${gargalo.hotTopics?.[0]?.subarea || "tema quente"}.`,
      area: gargalo.area,
    };
  }

  return {
    title: `Foque ${gargalo.area}`,
    detail: `Motivo: ${gargalo.motivo}. Cobertura ${gargalo.cobertura}%, retenção ${gargalo.retencao ?? "coletando"}.`,
    area: gargalo.area,
  };
}
