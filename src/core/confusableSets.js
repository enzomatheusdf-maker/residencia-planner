// src/core/confusableSets.js

function normalize(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s]/g, "") // Remove punctuation
    .trim();
}

function matchNames(n1, n2) {
  const s1 = normalize(n1);
  const s2 = normalize(n2);
  if (!s1 || !s2) return false;
  if (s1 === s2) return true;

  // Check simple substring if length is at least 3
  if (s1.length >= 3 && s2.length >= 3) {
    if (s1.includes(s2) || s2.includes(s1)) return true;
  }

  // Helper for acronym matching (e.g. TEP or SCA)
  const getAcronym = (s) => {
    const words = s.split(/\s+/).filter(Boolean);
    if (words.length <= 1) return "";
    return words.map((w) => w[0]).join("");
  };

  const acr1 = getAcronym(s1);
  const acr2 = getAcronym(s2);
  if (acr1 && acr1 === s2) return true;
  if (acr2 && acr2 === s1) return true;

  // Check for common medical abbreviations shared in both
  const abbreviations = ["sca", "tep", "iam"];
  for (const abb of abbreviations) {
    if (s1.includes(abb) && s2.includes(abb)) return true;
  }

  // Check common clinical stems/roots matching for clinical terms
  const stems = ["pericard", "coronar", "tromboembol", "aort", "apendic", "ureter", "hipertens", "pre eclamp"];
  for (const stem of stems) {
    if (s1.includes(stem) && s2.includes(stem)) return true;
  }

  return false;
}

/**
 * Builds confusable sets of themes based on shared parentTopic and shared case differentials.
 * @param {Array} temas Array of theme objects.
 * @param {Array} casos Array of clinical case objects.
 * @returns {Array} List of confusable sets: [{key, members, reason}]
 */
export function buildConfusableSets(temas = [], casos = []) {
  const sets = [];

  // 1. Group by parentTopic
  const parentGroups = {};
  for (const tema of temas) {
    if (tema && tema.parentTopic) {
      const parent = tema.parentTopic.trim();
      if (parent) {
        if (!parentGroups[parent]) {
          parentGroups[parent] = [];
        }
        parentGroups[parent].push(tema.id);
      }
    }
  }

  for (const [parent, memberIds] of Object.entries(parentGroups)) {
    if (memberIds.length >= 2) {
      sets.push({
        key: `parent:${parent}`,
        members: Array.from(new Set(memberIds)),
        reason: "mesmo macrotema",
      });
    }
  }

  // 2. Group by shared differentials in cases
  for (const caso of casos) {
    if (caso && caso.diferenciais && Array.isArray(caso.diferenciais)) {
      const caseTemaName = caso.tema;
      const diffNames = caso.diferenciais.map((d) => d.dx).filter(Boolean);
      const allNames = [caseTemaName, ...diffNames].filter(Boolean);

      const matchedIds = [];
      for (const tema of temas) {
        if (tema && tema.nome) {
          const isMatch = allNames.some((name) => matchNames(tema.nome, name));
          if (isMatch) {
            matchedIds.push(tema.id);
          }
        }
      }

      if (matchedIds.length >= 2) {
        sets.push({
          key: `case:${caso.id || caso.tema}`,
          members: Array.from(new Set(matchedIds)),
          reason: "diagnóstico diferencial",
        });
      }
    }
  }

  return sets;
}
