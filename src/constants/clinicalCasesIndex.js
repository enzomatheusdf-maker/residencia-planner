import { generatedClinicalCaseIndex } from "./generatedClinicalCasesIndex";

export const baseClinicalCaseIndex = [
  {
    id: "apendicite-classica",
    area: "Cirurgia",
    subarea: "Cirurgia Geral",
    tema: "Apendicite Aguda",
    titulo: "Apendicite Aguda",
  },
  {
    id: "pre-eclampsia-grave",
    area: "GO",
    subarea: "Gestação Alto Risco",
    tema: "Pré-eclâmpsia",
    titulo: "Pré-eclâmpsia",
  },
  {
    id: "dor-toracica-coronariana",
    area: "Clínica Médica",
    subarea: "Cardiologia",
    tema: "Dor Torácica Coronariana",
    titulo: "Dor Torácica Coronariana",
  },
  {
    id: "trauma-abdominal",
    area: "Cirurgia",
    subarea: "Trauma",
    tema: "Trauma Abdominal",
    titulo: "Trauma Abdominal",
  },
  {
    id: "sindromes-hipertensivas-gestacao",
    area: "GO",
    subarea: "Obstetricia",
    tema: "Sindromes Hipertensivas na Gestacao",
    titulo: "Sindromes Hipertensivas na Gestacao",
  },
  {
    id: "diarreia-aguda-pediatria",
    area: "Pediatria",
    subarea: "Gastroenterologia",
    tema: "Diarreia Aguda em Pediatria",
    titulo: "Diarreia Aguda em Pediatria",
  },
  {
    id: "atencao-primaria-saude",
    area: "Preventiva",
    subarea: "APS",
    tema: "Atencao Primaria a Saude",
    titulo: "Atencao Primaria a Saude",
  },
];

export const CLINICAL_CASES_INDEX = [
  ...baseClinicalCaseIndex,
  ...generatedClinicalCaseIndex,
];

export function findClinicalCaseIndexById(id) {
  const normalized = String(id || "");
  if (!normalized) return null;
  return CLINICAL_CASES_INDEX.find((caso) => caso.id === normalized) || null;
}
