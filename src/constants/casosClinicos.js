// src/constants/casosClinicos.js
// Banco de casos de raciocínio clínico. Conteúdo expansível pelo usuário.
// Derivado dinamicamente de illnessScripts e caseInstances para retrocompatibilidade.

import { illnessScripts } from "./illnessScripts";
import { caseInstances } from "./caseInstances";

export const CASOS_CLINICOS = illnessScripts.map(script => {
  const instance = caseInstances.find(inst => inst.scriptId === script.id && inst.presentation === "typical") || {};
  return {
    id: script.id,
    area: script.area,
    subarea: script.subtopic,
    tema: script.tema || script.subtopic,
    dificuldade: script.dificuldade || "media",
    vinheta: instance.vignette || "",
    script: {
      enabling: script.enabling,
      fault: script.fault,
      consequences: script.consequences,
      management: script.management,
    },
    diferenciais: script.diferenciais || [],
    workup: script.workup || [],
    diagnosticoFinal: script.diagnosticoFinal || "",
    justificativa: script.justificativa || "",
    sct: script.sct || [],
    anamnese: script.anamnese || { queixa: "", roteiro: [], redFlags: [] }
  };
});
