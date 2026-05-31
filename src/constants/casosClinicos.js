// src/constants/casosClinicos.js
// Banco de casos de raciocínio clínico. Conteúdo expansível pelo usuário.
// Cada caso suporta illness script, caso estruturado, SCT e anamnese.

export const CASOS_CLINICOS = [
  {
    id: "apendicite-classica",
    area: "Cirurgia",
    subarea: "Cirurgia Geral",
    tema: "Apendicite Aguda",
    dificuldade: "media",
    vinheta: "Homem, 24 anos, dor periumbilical há 18h que migrou para fossa ilíaca direita, anorexia, náusea e febre baixa.",
    script: {
      enabling: "Pico 10-30 anos; obstrução do lúmen apendicular (fecálito, hiperplasia linfoide).",
      fault: "Obstrução -> distensão -> isquemia -> translocação bacteriana -> inflamação transmural.",
      consequences: "Dor migratória peri-FID, Blumberg, anorexia, febre baixa, leucocitose com desvio.",
      management: "Apendicectomia; ATB; abscesso >4cm -> drenagem + ATB e cirurgia intervalar.",
    },
    diferenciais: [
      { dx: "Apendicite aguda", plausibilidade: "alta", pista: "Dor migratória + Blumberg + anorexia." },
      { dx: "Adenite mesentérica", plausibilidade: "media", pista: "Mais comum em jovens, pós-IVAS." },
      { dx: "Cólica ureteral", plausibilidade: "baixa", pista: "Dor em cólica, hematúria, sem migração típica." },
    ],
    workup: ["Hemograma", "EAS", "USG/TC de abdome se dúvida"],
    diagnosticoFinal: "Apendicite aguda",
    justificativa: "Quadro clássico migratório + irritação peritoneal localizada em FID.",
    sct: [
      { hipotese: "Apendicite aguda", novaInfo: "USG mostra apêndice de 4 mm compressível", efeitoPainel: -2, racional: "Apêndice fino/compressível fala contra." },
      { hipotese: "Apendicite aguda", novaInfo: "TC com apendicolito e borramento de gordura", efeitoPainel: +2, racional: "Achados confirmatórios." },
    ],
    anamnese: {
      queixa: "Dor abdominal",
      roteiro: [
        { bloco: "Caracterização (OPQRST)", perguntasChave: ["Início e migração?", "Tipo e intensidade?", "Fatores de melhora/piora?"] },
        { bloco: "Associados", perguntasChave: ["Febre?", "Náusea/vômito/anorexia?", "Hábito intestinal?"] },
      ],
      redFlags: ["Sinais de peritonite difusa", "Instabilidade hemodinâmica"],
    },
  },
  {
    id: "pre-eclampsia-grave",
    area: "GO",
    subarea: "Gestação Alto Risco",
    tema: "Pré-eclâmpsia",
    dificuldade: "dificil",
    vinheta: "Gestante 34 sem, PA 165/110, cefaleia e escotomas, proteinúria significativa.",
    script: {
      enabling: "Primigesta, extremos de idade, HAS prévia, gemelar; após 20 sem.",
      fault: "Disfunção placentária -> lesão endotelial sistêmica e vasoespasmo.",
      consequences: "HAS + proteinúria/lesão de órgão-alvo; sinais de gravidade (cefaleia, escotomas, epigastralgia).",
      management: "Sulfato de magnésio (prevenção de eclâmpsia) + anti-hipertensivo + decisão sobre parto.",
    },
    diferenciais: [
      { dx: "Pré-eclâmpsia com sinais de gravidade", plausibilidade: "alta", pista: "PA elevada + sintomas neurológicos." },
      { dx: "HAS crônica", plausibilidade: "media", pista: "Anterior a 20 sem." },
    ],
    workup: ["PA seriada", "Proteinúria", "Função hepática/renal", "Plaquetas (HELLP)"],
    diagnosticoFinal: "Pré-eclâmpsia com sinais de gravidade",
    justificativa: "HAS após 20 sem + sintomas de gravidade.",
    sct: [
      { hipotese: "Pré-eclâmpsia grave", novaInfo: "Plaquetas 80 mil + TGO elevada", efeitoPainel: +2, racional: "Sugere HELLP." },
    ],
    anamnese: {
      queixa: "Cefaleia na gestação",
      roteiro: [
        { bloco: "Sinais de gravidade", perguntasChave: ["Escotomas?", "Epigastralgia?", "Edema súbito?"] },
      ],
      redFlags: ["Eclâmpsia iminente", "Sinais de HELLP"],
    },
  },
];
