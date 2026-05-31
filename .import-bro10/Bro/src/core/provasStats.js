// src/core/provasStats.js
// Centralized weights and statistics for ENAMED and Vestibular targets

export const PESO_AREA_ENAMED = {
  "Clínica Médica": 1.28,
  "GO": 1.21,
  "Cirurgia": 1.19,
  "Pediatria": 1.19,
  "Preventiva": 1.12,
  "Outro": 1.0,
};

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

export function getAreaWeight(plat, area, meta = {}) {
  if (plat === "res") {
    return PESO_AREA_ENAMED[area] || 1.0;
  }
  
  // Vestibular can override weights dynamically in meta.pesosArea
  if (meta?.pesosArea && meta.pesosArea[area] !== undefined) {
    return meta.pesosArea[area];
  }
  
  return PESO_AREA_VEST[area] || 1.0;
}
