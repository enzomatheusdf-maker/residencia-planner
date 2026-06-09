import fs from "node:fs";

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function classifyTema(tema) {
  const nome = `${tema.nome} ${tema.area}`.toLowerCase();
  const nonClinicalPatterns = [
    "sus",
    "legislação",
    "legislacao",
    "financiamento",
    "epidemiol",
    "estudos",
    "ensaio",
    "metanálise",
    "metanalise",
    "medicina baseada",
    "ética",
    "etica",
    "declaração de óbito",
    "declaracao de obito",
    "atestado",
    "judicialização",
    "judicializacao",
    "saúde suplementar",
    "saude suplementar",
    "vigilância em saúde",
    "vigilancia em saude",
    "atenção primária",
    "atencao primaria",
    "redes de atenção",
    "redes de atencao",
    "estratégia saúde da família",
    "estrategia saude da familia",
    "ferramentas da aps",
    "método clínico centrado",
    "metodo clinico centrado",
    "telemedicina",
    "publicidade médica",
    "publicidade medica",
    "saúde do trabalhador",
    "saude do trabalhador",
    "acidente de trabalho",
    "saúde socioecológica",
    "saude socioecologica",
    "processo epidêmico",
    "processo epidemico",
    "determinação social",
    "determinacao social",
    "indicadores de saúde",
    "indicadores de saude",
    "testes diagnósticos",
    "testes diagnosticos",
    "significância estatística",
    "significancia estatistica",
    "intervalo de confiança",
    "intervalo de confianca",
    "medidas de associação",
    "medidas de associacao",
    "associação x causalidade",
    "associacao x causalidade",
    "classificação dos estudos",
    "classificacao dos estudos",
  ];

  if (nonClinicalPatterns.some((pattern) => nome.includes(pattern))) {
    return {
      status: "nao_clinico_ou_metodologico",
      reason: "Tema conceitual, metodológico, administrativo ou transversal; não deve virar illness script clínico sem formato próprio.",
    };
  }

  const broadPatterns = [
    "miscelânea",
    "miscelanea",
    "introdução",
    "introducao",
    "princípios",
    "principios",
    "avaliação",
    "avaliacao",
    "propedêutica",
    "propedeutica",
    "principais sintomas",
    "grandes síndromes",
    "grandes sindromes",
    "outras",
    "encerramento",
    "anatomia",
    "embriologia",
    "fisiologia",
    "esteroidogênese",
    "esteroidogenese",
    "classificação",
    "classificacao",
    "tratamento",
    "pré-operatório",
    "pre-operatorio",
    "pós-operatório",
    "pos-operatorio",
    "perioperatório",
    "perioperatorio",
    "suporte avançado",
    "suporte avancado",
    "bls",
    "acls",
    "pals",
    "vacinação",
    "vacinacao",
    "antibióticos",
    "antibioticos",
  ];

  if (broadPatterns.some((pattern) => nome.includes(pattern))) {
    return {
      status: "precisa_decomposicao_humana",
      reason: "Tema amplo/transversal; gerar caso diretamente teria alto risco de entidade arbitrária.",
    };
  }

  return {
    status: "pendente_revisao_clinica",
    reason: "Tema potencialmente clínico, mas ainda precisa decomposição/checagem antes de geração em massa.",
  };
}

const temas = readJson("temas.json", []);
const entidades = readJson("entidades.json", []);
const naoClinicos = readJson("temas_nao_clinicos.json", []);
const coveredTemaIds = new Set(entidades.map((item) => item.temaId));
const nonClinicalTemaIds = new Set(naoClinicos.map((item) => item.temaId));

const rows = temas.map((tema) => {
  const entidadesDoTema = entidades.filter((item) => item.temaId === tema.id);
  if (entidadesDoTema.length) {
    return {
      ...tema,
      status: "ja_tem_caso",
      reason: `${entidadesDoTema.length} entidade(s) já gerada(s).`,
      entidades: entidadesDoTema.map((item) => item.cid),
    };
  }

  if (nonClinicalTemaIds.has(tema.id)) {
    return {
      ...tema,
      status: "nao_clinico_ou_metodologico",
      reason: naoClinicos.find((item) => item.temaId === tema.id)?.motivo || "Tema já registrado como não clínico.",
      entidades: [],
    };
  }

  return {
    ...tema,
    ...classifyTema(tema),
    entidades: [],
  };
});

const summary = rows.reduce((acc, row) => {
  acc[row.status] = (acc[row.status] || 0) + 1;
  return acc;
}, {});

const output = {
  generatedAt: new Date().toISOString(),
  policy: "Pare se houver risco de alucinação: temas sem entidade atômica segura ficam bloqueados para revisão.",
  summary,
  rows,
};

fs.writeFileSync("casos_restantes_bloqueados.json", JSON.stringify(output, null, 2));
console.log("Resumo:", summary);
