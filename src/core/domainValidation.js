// src/core/domainValidation.js
// Lógica de validação de domínio prévio.
// Totalmente puro (sem efeitos colaterais): recebe dados, devolve decisões.

import { STEPS, S_BASE, addDays, todayStr, getAreaPrior } from "./fsrs";
import { PESO_AREA_ENAMED } from "../constants/enamedIncidencia";

// Pesos de incidência por especialidade (RES). Quanto maior, mais o tema deve
// permanecer ativo mesmo com domínio alto.
const PESO_ESP = {
  "Clínica Médica": 3.0,
  "Preventiva":     2.5,
  "Cirurgia":       2.0,
  "GO":             2.0,
  "Pediatria":      2.0,
  "Outro":          1.0,
  // Vestibular — áreas com alto peso de prova
  "Exatas":                1.8,
  "Ciências da Natureza":  1.6,
  "Linguagens":            1.4,
  "Humanas":               1.2,
  "Redação":               2.0,
};

/**
 * Classifica o domínio com base no % de acerto.
 * @returns {"alto"|"intermediario"|"insuficiente"}
 */
export function classificarDominio(pctAcerto) {
  if (pctAcerto >= 85) return "alto";
  if (pctAcerto >= 70) return "intermediario";
  return "insuficiente";
}

/**
 * Dados da classificação para exibição na UI.
 */
export const DOMINIO_META = {
  alto: {
    label: "Domínio Alto",
    desc: "Manutenção espaçada — ciclo pulado para revisão periódica.",
    color: "#10b981",
  },
  intermediario: {
    label: "Domínio Intermediário",
    desc: "Ciclo reduzido — ênfase nas revisões de erros.",
    color: "#f59e0b",
  },
  insuficiente: {
    label: "Domínio Insuficiente",
    desc: "Ciclo completo mantido.",
    color: "#f87171",
  },
};

/**
 * Calcula o intervalo inicial de manutenção ajustado por domínio e incidência.
 *
 * Domínio alto + incidência baixa  → intervalo maior (tema pode esperar)
 * Domínio alto + incidência alta   → intervalo menor (tema deve voltar cedo)
 * Domínio intermediário            → ciclo reduzido (D0+D4+D21), sem manutenção direta
 */
function calcIntervaloManutencao(pctAcerto, esp, importancia) {
  const pesoBruto = PESO_ESP[esp] || 1.0;
  const pesoImportancia = importancia === "CRITICA" ? 3.0 : importancia === "ALTA" ? 2.0 : 1.0;
  const incidencia = (pesoBruto * pesoImportancia) / (3.0 * 3.0); // normaliza 0–1

  // Base: 45 dias (intervalo inicial do d21→manutencao normal).
  // Domínio alto ajusta para cima; incidência alta puxa de volta para baixo.
  const base = 45;
  const bonusDominio = Math.round((pctAcerto - 85) * 0.6); // 0–9 dias extra
  const penalIncidencia = Math.round(incidencia * 25);      // 0–25 dias a menos
  return Math.max(14, base + bonusDominio - penalIncidencia);
}

/**
 * Gera o objeto `rev` adequado para cada classificação de domínio.
 *
 * "alto"          → pula direto para manutenção espaçada
 * "intermediario" → ciclo reduzido: mantém d0(se não feito), d4, d21; remove d1/d7
 * "insuficiente"  → rev padrão sem alteração (ciclo completo)
 */
export function buildRevComDominio(d0, esp, importancia, classificacao, pctAcerto) {
  const prior = getAreaPrior(esp);
  const hoje = todayStr();
  const baseDate = d0 >= hoje ? d0 : hoje;

  if (classificacao === "insuficiente") {
    // Mantém ciclo completo — usa buildRev normal (store chama buildRev).
    return null;
  }

  if (classificacao === "alto") {
    const intervalo = calcIntervaloManutencao(pctAcerto, esp, importancia);
    // Marca todos os passos fixos como feitos (com acerto do teste de domínio)
    // e coloca o tema direto em manutenção espaçada.
    const acertoFrac = pctAcerto / 100;
    const rev = {};
    STEPS.forEach((s) => {
      rev[s.key] = {
        date: baseDate,
        done: true,
        acerto: acertoFrac,
        questoes: null,
        S: S_BASE[s.key],
        D: prior.difBase,
        motivosErro: [],
        skippeadoPorDominio: true,
      };
    });
    rev.manutencao = {
      done: false,
      date: addDays(hoje, intervalo),
      S: prior.sMult * 45,
      D: prior.difBase,
      interval: intervalo,
    };
    return rev;
  }

  if (classificacao === "intermediario") {
    // Ciclo reduzido: marca d0 e d1 como feitos; mantém d4, d7, d21 ativos.
    // O foco fica nas revisões (d4+) e nos erros que o aluno cometeu.
    const acertoFrac = pctAcerto / 100;
    const rev = {};
    STEPS.forEach((s, i) => {
      if (s.key === "d0" || s.key === "d1") {
        rev[s.key] = {
          date: baseDate,
          done: true,
          acerto: acertoFrac,
          questoes: null,
          S: S_BASE[s.key],
          D: prior.difBase,
          motivosErro: [],
          skippeadoPorDominio: true,
        };
      } else {
        // Antecipa d4 para 2 dias (urgência), d7 e d21 mantêm offsets normais.
        const offset = s.key === "d4" ? 2 : s.offset;
        rev[s.key] = {
          date: addDays(hoje, offset),
          done: false,
          acerto: null,
          questoes: null,
          S: S_BASE[s.key],
          D: prior.difBase,
          motivosErro: [],
        };
      }
    });
    return rev;
  }

  return null;
}

/**
 * Objeto salvo em `tema.dominio` após validação.
 */
export function criarRegistroDominio(questoes, acertos) {
  const pct = questoes > 0 ? Math.round((acertos / questoes) * 100) : 0;
  return {
    questoes,
    acertos,
    pctAcerto: pct,
    classificacao: classificarDominio(pct),
    validadoEm: todayStr(),
  };
}
