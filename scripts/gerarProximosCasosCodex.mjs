import fs from "node:fs";

const novosNaoClinicos = [
  { temaId: "estudos-longitudinais-coorte-e-caso-controle", nome: "Estudos Longitudinais: Coorte e Caso-Controle", motivo: "Tema metodológico/epidemiológico sem entidade clínica diagnosticável única." },
  { temaId: "antibioticos", nome: "Antibióticos", motivo: "Tema farmacológico transversal; melhor como cards/questões de conduta do que illness script atômico." },
  { temaId: "historia-e-principios-do-sus", nome: "História e Princípios do SUS", motivo: "Tema conceitual de saúde coletiva." },
  { temaId: "legislacao-do-sus-i", nome: "Legislação do SUS I", motivo: "Tema normativo/administrativo." },
];

const cases = [
  ["amenorreia-secundaria__gestacao-inicial", "Gestação inicial", "amenorreia-secundaria", "Amenorreia Secundária", "GO", "Síndrome de amenorreia secundária fisiológica", "atraso menstrual, náuseas matinais e beta-hCG positivo em mulher com ciclos prévios regulares", "amenorreia após ciclos regulares com sinais sistêmicos leves", "Anovulação por SOP", "beta-hCG positivo redefine a investigação antes de causas endócrinas"],
  ["amenorreia-secundaria__insuficiencia-ovariana-prematura", "Insuficiência ovariana prematura", "amenorreia-secundaria", "Amenorreia Secundária", "GO", "Síndrome de amenorreia secundária hipergonadotrófica", "mulher de 34 anos com 8 meses sem menstruar, fogachos e FSH repetidamente elevado", "amenorreia secundária com sintomas hipoestrogênicos antes dos 40 anos", "Hiperprolactinemia", "FSH alto e fogachos favorecem falência ovariana"],
  ["pneumonias-em-pediatria__pneumonia-bacteriana-tipica", "Pneumonia bacteriana típica", "pneumonias-em-pediatria", "Pneumonias em Pediatria", "Pediatria", "Síndrome de consolidação pulmonar febril", "criança de 5 anos com febre alta, tosse, taquipneia, tiragem leve e crepitações localizadas", "criança febril com sinais respiratórios focais e desconforto", "Bronquiolite viral", "focalidade auscultatória e febre alta favorecem consolidação bacteriana"],
  ["pneumonias-em-pediatria__pneumonia-atipica", "Pneumonia atípica", "pneumonias-em-pediatria", "Pneumonias em Pediatria", "Pediatria", "Síndrome respiratória subaguda com dissociação clínico-radiológica", "escolar com tosse seca persistente, febre baixa, cefaleia e ausculta pouco exuberante apesar de infiltrado intersticial", "criança maior com sintomas respiratórios subagudos e poucos achados focais", "Pneumonia bacteriana típica", "curso arrastado e ausculta pobre favorecem agente atípico"],
  ["bronquiolite-e-coqueluche__bronquiolite-viral", "Bronquiolite viral aguda", "bronquiolite-e-coqueluche", "Bronquiolite e Coqueluche", "Pediatria", "Síndrome obstrutiva viral do lactente", "lactente de 5 meses com coriza, tosse, sibilância difusa, tiragem e dificuldade para mamar", "lactente pequeno com pródromo viral e obstrução de vias aéreas inferiores", "Asma em lactente", "primeiro episódio com pródromo viral em lactente favorece bronquiolite"],
  ["bronquiolite-e-coqueluche__coqueluche", "Coqueluche", "bronquiolite-e-coqueluche", "Bronquiolite e Coqueluche", "Pediatria", "Síndrome de tosse paroxística prolongada", "lactente incompletamente vacinado com crises de tosse em salva, guincho inspiratório e vômitos pós-tosse", "tosse paroxística prolongada com repercussão pós-tussígena", "Infecção viral comum", "paroxismos, guincho e vômitos pós-tosse favorecem Bordetella"],
  ["apendicite-aguda__apendicite-aguda", "Apendicite aguda", "apendicite-aguda", "Apendicite Aguda", "Cirurgia", "Síndrome de abdome agudo inflamatório em fossa ilíaca direita", "adolescente com dor que começou periumbilical, migrou para fossa ilíaca direita, anorexia e dor à descompressão", "dor abdominal migratória com sinais de irritação peritoneal localizada", "Gastroenterite aguda", "migração da dor e peritonismo localizado favorecem inflamação apendicular"],
  ["infeccoes-e-gravidez__toxoplasmose-gestacional", "Toxoplasmose gestacional", "infeccoes-e-gravidez", "Infecções e Gravidez", "GO", "Síndrome infecciosa gestacional com risco fetal", "gestante assintomática com soroconversão recente para Toxoplasma em triagem pré-natal", "infecção materna recente detectada por sorologia durante a gestação", "Infecção antiga imune", "soroconversão/avidez baixa indica risco fetal atual"],
  ["infeccoes-e-gravidez__sifilis-na-gestacao", "Sífilis na gestação", "infeccoes-e-gravidez", "Infecções e Gravidez", "GO", "Síndrome de IST gestacional com transmissão vertical evitável", "gestante no segundo trimestre com teste treponêmico reagente e VDRL alto sem tratamento prévio documentado", "gestante com sorologia ativa para IST de transmissão vertical", "Cicatriz sorológica tratada", "título alto sem tratamento adequado exige tratamento materno e parceria"],
  ["infeccoes-e-gravidez__itu-na-gestacao", "Infecção urinária na gestação", "infeccoes-e-gravidez", "Infecções e Gravidez", "GO", "Síndrome urinária gestacional", "gestante com disúria, polaciúria, dor suprapúbica e urocultura positiva, sem febre ou dor lombar", "gestante com sintomas urinários baixos e risco obstétrico associado", "Pielonefrite gestacional", "ausência de febre/dor lombar favorece cistite baixa"],
  ["infeccoes-congenitas__toxoplasmose-congenita", "Toxoplasmose congênita", "infeccoes-congenitas", "Infecções Congênitas", "Pediatria", "Síndrome TORCH com acometimento ocular/neurológico", "recém-nascido com coriorretinite, calcificações intracranianas e hidrocefalia após infecção materna recente", "neonato com sinais oculares e neurológicos de infecção congênita", "Citomegalovírus congênito", "tríade com coriorretinite e hidrocefalia favorece toxoplasmose"],
  ["infeccoes-congenitas__sifilis-congenita", "Sífilis congênita", "infeccoes-congenitas", "Infecções Congênitas", "Pediatria", "Síndrome infecciosa congênita multissistêmica", "recém-nascido de mãe sem tratamento adequado apresenta rinorreia persistente, lesões palmoplantares e hepatoesplenomegalia", "neonato exposto a IST materna com manifestações cutâneo-mucosas e sistêmicas", "Sepse neonatal", "exposição materna e lesões palmoplantares favorecem transmissão treponêmica"],
  ["infeccoes-congenitas__citomegalovirus-congenito", "Citomegalovírus congênito", "infeccoes-congenitas", "Infecções Congênitas", "Pediatria", "Síndrome TORCH com microcefalia e calcificações periventriculares", "neonato pequeno para idade gestacional com petéquias, icterícia, microcefalia e alteração auditiva", "recém-nascido com restrição de crescimento e sinais neurossensoriais congênitos", "Toxoplasmose congênita", "petéquias, surdez e calcificações periventriculares favorecem CMV"],
  ["urgencias-da-vesicula-biliar__colecistite-aguda", "Colecistite aguda", "urgencias-da-vesicula-biliar", "Urgências da Vesícula Biliar", "Cirurgia", "Síndrome dolorosa biliar inflamatória", "mulher de 52 anos com dor persistente em hipocôndrio direito, febre baixa, náuseas e dor à inspiração profunda na palpação", "dor biliar prolongada com sinais inflamatórios locais", "Cólica biliar simples", "dor persistente e febre favorecem inflamação vesicular"],
  ["urgencias-da-vesicula-biliar__colangite-aguda", "Colangite aguda", "urgencias-da-vesicula-biliar", "Urgências da Vesícula Biliar", "Cirurgia", "Síndrome infecciosa biliar obstrutiva", "idoso com febre, dor em hipocôndrio direito, icterícia, confusão e hipotensão", "infecção sistêmica associada a obstrução biliar", "Colecistite aguda", "icterícia e sepse favorecem infecção da via biliar principal"],
  ["urgencias-da-vesicula-biliar__coledocolitiase", "Coledocolitíase", "urgencias-da-vesicula-biliar", "Urgências da Vesícula Biliar", "Cirurgia", "Síndrome colestática obstrutiva por cálculo", "paciente com cólica biliar recorrente, icterícia flutuante, colúria e dilatação de via biliar ao ultrassom", "colestase obstrutiva intermitente em contexto litiásico", "Hepatite viral", "dor biliar e dilatação ductal favorecem obstrução por cálculo"],
  ["abortamento__ameaca-de-abortamento", "Ameaça de abortamento", "abortamento", "Abortamento", "GO", "Síndrome de sangramento no primeiro trimestre com colo fechado", "gestante de 9 semanas com sangramento vaginal discreto, cólicas leves, colo fechado e embrião com batimentos ao ultrassom", "sangramento inicial em gestação tópica viável", "Abortamento inevitável", "colo fechado e vitalidade embrionária favorecem ameaça"],
  ["abortamento__abortamento-incompleto", "Abortamento incompleto", "abortamento", "Abortamento", "GO", "Síndrome de abortamento com restos ovulares", "gestante de 11 semanas com sangramento intenso, cólicas, colo aberto e material heterogêneo persistente na cavidade uterina", "perda gestacional em curso com esvaziamento parcial", "Ameaça de abortamento", "colo aberto e restos intrauterinos favorecem quadro incompleto"],
  ["abortamento__abortamento-infectado", "Abortamento infectado", "abortamento", "Abortamento", "GO", "Síndrome séptica pós-abortamento", "mulher com febre, dor pélvica, secreção fétida e sangramento após procedimento inseguro", "sangramento uterino associado a sinais sistêmicos de infecção pélvica", "Endometrite puerperal", "contexto pós-abortamento e secreção fétida direcionam a fonte"],
  ["gestacao-ectopica__gestacao-ectopica-tubaria", "Gestação ectópica tubária", "gestacao-ectopica", "Gestação Ectópica", "GO", "Síndrome de dor pélvica e sangramento no primeiro trimestre", "mulher com atraso menstrual, dor pélvica unilateral, sangramento escasso e beta-hCG positivo sem saco intrauterino esperado", "gestação inicial com dor lateralizada e ausência de implantação intrauterina confirmada", "Abortamento inicial", "dor unilateral e ausência de saco intrauterino com beta-hCG compatível favorecem ectópica"],
  ["dermatoses-e-infeccoes-de-partes-moles__impetigo", "Impetigo", "dermatoses-e-infeccoes-de-partes-moles", "Dermatoses e Infecções de Partes Moles", "Pediatria", "Síndrome de infecção cutânea superficial crostosa", "criança com lesões periorais superficiais, crostas melicéricas e prurido leve sem febre importante", "infecção superficial de pele com crostas amareladas em área exposta", "Herpes simples", "crostas melicéricas e múltiplas erosões superficiais favorecem impetigo"],
  ["dermatoses-e-infeccoes-de-partes-moles__celulite-bacteriana", "Celulite bacteriana", "dermatoses-e-infeccoes-de-partes-moles", "Dermatoses e Infecções de Partes Moles", "Pediatria", "Síndrome infecciosa cutânea profunda não purulenta", "criança com placa dolorosa, quente, eritematosa e mal delimitada em perna após escoriação", "inflamação cutânea profunda com porta de entrada e dor local", "Erisipela", "bordas mal delimitadas e acometimento mais profundo favorecem celulite"],
  ["dermatoses-e-infeccoes-de-partes-moles__escabiose", "Escabiose", "dermatoses-e-infeccoes-de-partes-moles", "Dermatoses e Infecções de Partes Moles", "Pediatria", "Síndrome pruriginosa contagiosa familiar", "criança com prurido noturno intenso, pápulas em espaços interdigitais e familiares coçando", "dermatose pruriginosa noturna com agregação domiciliar", "Dermatite atópica", "prurido noturno e contatos sintomáticos favorecem infestação"],
  ["diverticulite-aguda__diverticulite-nao-complicada", "Diverticulite aguda não complicada", "diverticulite-aguda", "Diverticulite Aguda", "Cirurgia", "Síndrome de dor inflamatória em fossa ilíaca esquerda", "adulto de 59 anos com dor em quadrante inferior esquerdo, febre baixa, leucocitose e tomografia sem abscesso", "dor localizada à esquerda com inflamação colônica sem complicação", "Cólica renal", "febre e espessamento colônico favorecem inflamação diverticular"],
  ["diverticulite-aguda__diverticulite-complicada", "Diverticulite aguda complicada", "diverticulite-aguda", "Diverticulite Aguda", "Cirurgia", "Síndrome de abdome inflamatório com coleção/peritonite", "idosa com dor em fossa ilíaca esquerda, febre, defesa localizada e tomografia com abscesso pericólico", "inflamação colônica associada a complicação local", "Colite infecciosa", "coleção pericólica favorece complicação diverticular"],
  ["cirrose-hepatica-i__ascite-cirrotica", "Ascite cirrótica", "cirrose-hepatica-i", "Cirrose Hepática I", "Clínica Médica", "Síndrome ascítica por hipertensão portal", "homem com doença hepática crônica, aumento abdominal progressivo, macicez móvel e edema de membros inferiores", "paciente hepatopata com acúmulo líquido abdominal e sinais de hipertensão portal", "Ascite neoplásica", "estigmas hepáticos e hipertensão portal favorecem causa cirrótica"],
  ["cirrose-hepatica-i__peritonite-bacteriana-espontanea", "Peritonite bacteriana espontânea", "cirrose-hepatica-i", "Cirrose Hepática I", "Clínica Médica", "Síndrome infecciosa em paciente cirrótico com ascite", "cirrótico com ascite passa a ter febre, dor abdominal leve e confusão, sem foco infeccioso claro", "hepatopata ascítico com deterioração clínica e febre", "Apendicite aguda", "ascite prévia e sintomas discretos favorecem infecção do líquido ascítico"],
  ["pac-pneumonia-adquirida-na-comunidade__pneumonia-comunitaria", "Pneumonia adquirida na comunidade", "pac-pneumonia-adquirida-na-comunidade", "PAC - Pneumonia Adquirida na Comunidade", "Clínica Médica", "Síndrome de consolidação pulmonar adquirida na comunidade", "adulto com febre, tosse produtiva, dor pleurítica e crepitações focais após início fora do hospital", "infecção respiratória baixa aguda com sinais de consolidação", "Bronquite aguda", "crepitações focais e febre sustentada favorecem acometimento alveolar"],
  ["pac-pneumonia-adquirida-na-comunidade__pneumonia-comunitaria-grave", "Pneumonia adquirida na comunidade grave", "pac-pneumonia-adquirida-na-comunidade", "PAC - Pneumonia Adquirida na Comunidade", "Clínica Médica", "Síndrome pneumônica comunitária com gravidade sistêmica", "idoso com febre, tosse, confusão, FR 32, PA 86/52 e SatO2 88% em ar ambiente", "infecção respiratória baixa com instabilidade e disfunção sistêmica", "Pneumonia leve ambulatorial", "hipotensão, hipoxemia e confusão indicam gravidade"],
  ["descolamento-prematuro-de-placenta__descolamento-prematuro-placenta", "Descolamento prematuro de placenta", "descolamento-prematuro-de-placenta", "Descolamento Prematuro de Placenta", "GO", "Síndrome hemorrágica dolorosa da segunda metade da gestação", "gestante hipertensa de 34 semanas com dor abdominal súbita, útero hipertônico, sangramento escuro e sofrimento fetal", "sangramento tardio doloroso com hipertonia uterina e risco fetal", "Placenta prévia", "dor e hipertonia favorecem descolamento, não inserção baixa indolor"],
];

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function buildEntity(row) {
  return {
    cid: row[0],
    entidade: row[1],
    sindrome: row[5],
    incidencia: "alta",
    temaId: row[2],
    temaNome: row[3],
    area: row[4],
    prio: "Diamante",
  };
}

function buildCase(row) {
  const [cid, entidade, temaId, temaNome, area, sindrome, vignette, representation, confundivel, discriminator] = row;
  const typical = buildInstance({ cid, entidade, area, sindrome, vignette, representation, confundivel, discriminator, presentation: "typical" });
  const atypical = buildInstance({
    cid,
    entidade,
    area,
    sindrome,
    vignette: `${vignette} Na apresentação menos clássica, a intensidade dos achados é menor, mas o padrão sindrômico permanece reconhecível.`,
    representation: `${representation} com sinais menos exuberantes`,
    confundivel,
    discriminator,
    presentation: "atypical",
  });

  return {
    script: {
      id: cid,
      entidade,
      area,
      subtopico: temaNome,
      sindrome,
      incidenciaEnamed: "alta",
      enabling: ["contexto clínico compatível", "fator de risco ou faixa etária típica"],
      fault: "Processo fisiopatológico central compatível com a entidade e sua síndrome de apresentação.",
      consequences: ["manifestação cardinal da síndrome", "risco de complicação se o padrão não for reconhecido"],
      management: ["representar o problema", "comparar diferenciais da síndrome", "definir conduta inicial segura"],
      redFlags: ["instabilidade clínica", "sinais de gravidade", "falha de resposta inicial"],
      keyFeatures: [
        {
          prompt: "Determinar a síndrome antes do diagnóstico específico.",
          expectedAction: "Traduzir a vinheta em representação do problema e síndrome guarda-chuva.",
          isCritical: true,
        },
        {
          prompt: "Comparar o confundível principal.",
          expectedAction: "Usar a pista discriminadora para separar diagnósticos próximos.",
          isCritical: true,
        },
      ],
      pertinentNegatives: ["sem achado dominante que explique melhor o quadro por outro grupo sindrômico"],
      discriminators: [{ vs: confundivel, feature: discriminator }],
      commonErrors: [{ tipo: "fechamento_precoce", armadilha: "fechar diagnóstico sem comparar diferenciais da mesma síndrome" }],
    },
    instances: [typical, atypical],
  };
}

const fallbackDiferenciaisPorArea = {
  "Clínica Médica": ["Pneumonia adquirida na comunidade", "Tromboembolismo pulmonar", "Síndrome coronariana aguda", "Sepse"],
  GO: ["Gestação ectópica tubária", "Doença inflamatória pélvica aguda", "Abortamento inicial", "Pré-eclâmpsia"],
  Pediatria: ["Pneumonia bacteriana típica", "Infecção urinária febril", "Sepse pediátrica", "Gastroenterite aguda"],
  Cirurgia: ["Apendicite aguda", "Obstrução intestinal", "Colecistite aguda", "Trauma abdominal"],
  Preventiva: ["Tuberculose pulmonar", "Dengue", "Episódio depressivo maior", "Transtorno de pânico"],
};

function differentialSeed(area, primary, self) {
  const seen = new Set([String(self || "").toLowerCase()]);
  return [primary, ...(fallbackDiferenciaisPorArea[area] || fallbackDiferenciaisPorArea["Clínica Médica"])]
    .filter(Boolean)
    .filter((dx) => {
      const key = dx.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

function buildInstance({ cid, entidade, area, sindrome, vignette, representation, confundivel, discriminator, presentation }) {
  const diferenciais = differentialSeed(area, confundivel, entidade);
  return {
    id: `${cid}-${presentation}`,
    scriptId: cid,
    presentation,
    vignette,
    determinacaoSindromica: {
      prompt: "Antes do diagnóstico específico, qual síndrome melhor representa este quadro?",
      problemRepresentation: representation,
      sindromeCorreta: sindrome,
      opcoes: [sindrome, "Síndrome infecciosa inespecífica", "Síndrome funcional sem alarme"],
      justificativa: `A combinação de achados aponta para ${sindrome}; ${discriminator}.`,
      diferenciaisDaSindrome: diferenciais,
    },
    differentials: diferenciais.map((dx, index) => ({
      dx,
      plausibilidade: index === 0 ? "alta" : "media",
      pista: index === 0
        ? "principal confundível nomeado a comparar"
        : "diferencial nomeado da mesma apresentação sindrômica ou de apresentação próxima",
    })),
    workupChave: ["avaliar gravidade", "confirmar a síndrome com exame dirigido", "solicitar exame complementar conforme risco"],
    diagnosticoFinal: entidade,
    justificativa: `A representação do problema e a pista discriminadora favorecem ${entidade}. Rascunho para revisão humana antes de publicação.`,
    expertReasoningTrace: [
      "Representar o problema com qualificadores semânticos.",
      "Escolher a síndrome guarda-chuva.",
      "Comparar diferenciais da mesma síndrome antes de fechar diagnóstico.",
    ],
    _revisar: "Rascunho gerado localmente pelo Codex; revisar conteúdo médico antes de publicar.",
  };
}

fs.mkdirSync("casos_gerados", { recursive: true });

const entidadesAtuais = readJson("entidades.json", []);
const existentes = new Set(entidadesAtuais.map((item) => item.cid));
const novasEntidades = cases.map(buildEntity).filter((item) => !existentes.has(item.cid));

for (const row of cases) {
  const [cid] = row;
  fs.writeFileSync(`casos_gerados/${cid}.json`, JSON.stringify(buildCase(row), null, 2));
}

fs.writeFileSync("entidades.json", JSON.stringify([...entidadesAtuais, ...novasEntidades], null, 2));

const atuaisNaoClinicos = readJson("temas_nao_clinicos.json", []);
const naoClinicosIds = new Set(atuaisNaoClinicos.map((item) => item.temaId));
const nextNaoClinicos = [...atuaisNaoClinicos, ...novosNaoClinicos.filter((item) => !naoClinicosIds.has(item.temaId))];
fs.writeFileSync("temas_nao_clinicos.json", JSON.stringify(nextNaoClinicos, null, 2));

const fila = readJson("fila_revisar.json", { revisar: [], invalidos: [] });
const revisar = Array.from(new Set([...(fila.revisar || []), ...cases.map(([cid]) => cid)]));
fs.writeFileSync("fila_revisar.json", JSON.stringify({
  ...fila,
  updatedAt: new Date().toISOString(),
  revisar,
  invalidos: fila.invalidos || [],
  observacao: "Todos os casos gerados localmente são rascunhos para revisão humana antes de publicação.",
}, null, 2));

console.log("Novos casos gerados:", cases.length);
console.log("Total de entidades:", entidadesAtuais.length + novasEntidades.length);
console.log("Temas não clínicos:", nextNaoClinicos.length);
