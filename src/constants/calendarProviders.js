export const CALENDAR_PROVIDER_IDS = {
  MEDCOF: "medcof",
  USER_IMPORTED: "user_import",
  CUSTOM: "custom",
};

export const CALENDAR_PROVIDERS = [
  {
    id: CALENDAR_PROVIDER_IDS.MEDCOF,
    label: "MEDCOF",
    kind: "official",
    description: "Plano-base MEDCOF já integrado ao catálogo de Residência.",
  },
  {
    id: CALENDAR_PROVIDER_IDS.USER_IMPORTED,
    label: "Importado",
    kind: "user_import",
    description: "Cronograma externo importado por texto/JSON do próprio usuário.",
  },
  {
    id: CALENDAR_PROVIDER_IDS.CUSTOM,
    label: "Custom",
    kind: "custom",
    description: "Trilho montado manualmente para seu contexto.",
  },
];

// Amostra DEV baseada em cronograma importável do usuário.
// Não é cronograma oficial de plataforma externa.
export const DEV_ESTRATEGIA_SAMPLE = [
  { semana: "Semana 1", ordem: 1, areaOriginal: "CARDIOLOGIA", temaOriginal: "Hipertensão Arterial Sistêmica (Parte 1): Diagnóstico, Classificação, Avaliação" },
  { semana: "Semana 1", ordem: 2, areaOriginal: "CIRURGIA", temaOriginal: "Trauma - Avaliação Inicial, Vias Aéreas e Trauma Torácico" },
  { semana: "Semana 1", ordem: 3, areaOriginal: "GINECOLOGIA", temaOriginal: "Rastreamento do Câncer de Colo Uterino" },
  { semana: "Semana 1", ordem: 4, areaOriginal: "PEDIATRIA", temaOriginal: "Bronquiolite" },
  { semana: "Semana 1", ordem: 5, areaOriginal: "PREVENTIVA", temaOriginal: "Estratégia Saúde da Família e APS" },

  { semana: "Semana 2", ordem: 1, areaOriginal: "CARDIOLOGIA", temaOriginal: "Insuficiência Cardíaca (Parte 2): Tratamento" },
  { semana: "Semana 2", ordem: 2, areaOriginal: "CIRURGIA", temaOriginal: "Abdome Agudo Inflamatório - Apendicite Aguda" },
  { semana: "Semana 2", ordem: 3, areaOriginal: "ENDOCRINO", temaOriginal: "Diabetes Mellitus - Complicações Agudas" },
  { semana: "Semana 2", ordem: 4, areaOriginal: "OBSTETRÍCIA", temaOriginal: "Síndromes Hipertensivas da Gestação" },
  { semana: "Semana 2", ordem: 5, areaOriginal: "INFECTOLOGIA", temaOriginal: "Tuberculose" },

  { semana: "Semana 3", ordem: 1, areaOriginal: "GASTRO", temaOriginal: "Hemorragia Digestiva Alta" },
  { semana: "Semana 3", ordem: 2, areaOriginal: "NEFROLOGIA", temaOriginal: "Injúria Renal Aguda" },
  { semana: "Semana 3", ordem: 3, areaOriginal: "PNEUMO", temaOriginal: "Asma e DPOC no Adulto" },
  { semana: "Semana 3", ordem: 4, areaOriginal: "GO", temaOriginal: "Hemorragia Pós-Parto" },
  { semana: "Semana 3", ordem: 5, areaOriginal: "PSIQUIATRIA", temaOriginal: "Transtornos de Humor" },

  { semana: "Semana 4", ordem: 1, areaOriginal: "CIRURGIA", temaOriginal: "Abdome Agudo Inflamatório - Colecistite e Colangite Aguda" },
  { semana: "Semana 4", ordem: 2, areaOriginal: "PEDIATRIA", temaOriginal: "Icterícia Neonatal" },
  { semana: "Semana 4", ordem: 3, areaOriginal: "PREVENTIVA", temaOriginal: "Rastreamentos na Atenção Primária" },
  { semana: "Semana 4", ordem: 4, areaOriginal: "NEURO", temaOriginal: "AVC Isquêmico e Hemorrágico" },
  { semana: "Semana 4", ordem: 5, areaOriginal: "ORTOPEDIA", temaOriginal: "Fraturas Expostas: conduta inicial" },
];
