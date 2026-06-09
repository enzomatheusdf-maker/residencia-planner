import fs from "node:fs";
import path from "node:path";

const TARGET_DIRS = ["casos_gerados", "casos_validos"];
const GENERIC_DX = new Set(["variante benigna/autolimitada", "condição grave a excluir"]);

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const includesAny = (haystack, needles) => needles.some((needle) => haystack.includes(needle));

const rules = [
  {
    name: "abortamento_primeiro_trimestre",
    when: (ctx) => includesAny(ctx.all, ["abortamento", "gestacao ectopica", "primeiro trimestre"]),
    dx: ["Ameaça de abortamento", "Abortamento incompleto", "Abortamento infectado", "Gestação ectópica tubária", "Mola hidatiforme"],
  },
  {
    name: "anemia",
    when: (ctx) => includesAny(ctx.all, ["anem", "microcit", "macrocit", "hemolit", "ferropriva", "talassemia"]),
    dx: ["Anemia ferropriva", "Talassemia menor", "Anemia da doença crônica", "Anemia megaloblástica por deficiência de B12", "Anemia hemolítica autoimune"],
  },
  {
    name: "abdome_agudo_obstrutivo",
    when: (ctx) => includesAny(ctx.all, ["obstrucao intestinal", "obstrucao colonica", "abdome agudo obstrutivo", "volvo"]),
    dx: ["Íleo paralítico", "Hérnia encarcerada", "Neoplasia obstrutiva de cólon", "Obstrução intestinal por bridas", "Volvo de sigmoide"],
  },
  {
    name: "abdome_agudo",
    when: (ctx) => includesAny(ctx.all, ["abdome agudo", "peritoneal", "peritonite", "perfurativo", "diverticulite", "apendicite", "isquemia mesenterica"]),
    dx: ["Apendicite aguda", "Diverticulite aguda", "Úlcera péptica perfurada", "Pancreatite aguda", "Isquemia mesentérica aguda", "Colecistite aguda"],
  },
  {
    name: "biliar_hepatica_pancreatica",
    when: (ctx) => includesAny(ctx.all, ["biliar", "vesicula", "colangite", "coledocolitiase", "icter", "hepat", "colestat", "pancreat", "abscesso hepatico"]),
    dx: ["Colecistite aguda", "Colangite aguda", "Coledocolitíase", "Pancreatite aguda biliar", "Hepatite viral aguda", "Abscesso hepático piogênico", "Adenocarcinoma de pâncreas"],
  },
  {
    name: "dispepsia_refluxo_ulcera",
    when: (ctx) => includesAny(ctx.all, ["dispeps", "refluxo", "gastrite", "ulcera", "peptica", "epigastr", "h pylori", "helicobacter"]),
    dx: ["Dispepsia funcional", "Doença do refluxo gastroesofágico", "Úlcera duodenal", "Gastrite associada a Helicobacter pylori", "Câncer gástrico", "Colelitíase sintomática"],
  },
  {
    name: "diarreia_colite_dii",
    when: (ctx) => includesAny(ctx.all, ["diarre", "colite", "crohn", "retocolite", "pseudomembranosa", "disabsort", "malabsort", "celiaca"]),
    dx: ["Gastroenterite viral", "Disenteria bacteriana", "Colite pseudomembranosa", "Doença de Crohn", "Retocolite ulcerativa", "Doença celíaca", "Giardíase"],
  },
  {
    name: "respiratoria_adulto",
    when: (ctx) => includesAny(ctx.all, ["pneum", "dispne", "pulmon", "respirator", "tosse", "pleural", "dpoc", "asma", "tep", "bronquiectasias", "intersticial"]),
    dx: ["Pneumonia adquirida na comunidade", "Tromboembolismo pulmonar", "Exacerbação de DPOC", "Exacerbação asmática no adulto", "Tuberculose pulmonar", "Derrame pleural", "Bronquiectasias"],
  },
  {
    name: "respiratoria_pediatrica",
    when: (ctx) => ctx.area === "pediatria" && includesAny(ctx.all, ["pneum", "bronquiolite", "asma", "coqueluche", "respirator", "tosse"]),
    dx: ["Bronquiolite viral aguda", "Pneumonia bacteriana típica", "Pneumonia atípica", "Exacerbação asmática", "Coqueluche", "Aspiração de corpo estranho"],
  },
  {
    name: "neonatal",
    when: (ctx) => includesAny(ctx.all, ["neonatal", "recem-nascido", "rn", "lactente pequeno", "ictericia neonatal", "desconforto respiratorio neonatal"]),
    dx: ["Sepse neonatal precoce", "Taquipneia transitória do recém-nascido", "Síndrome do desconforto respiratório do recém-nascido", "Síndrome de aspiração meconial", "Hipoglicemia neonatal", "Icterícia fisiológica neonatal"],
  },
  {
    name: "neurologia",
    when: (ctx) => includesAny(ctx.all, ["neurolog", "cefale", "convuls", "encefal", "mening", "avc", "delirium", "demenc", "sincope", "medular", "intracraniana"]),
    dx: ["AVC isquêmico", "Hemorragia intraparenquimatosa hipertensiva", "Meningite bacteriana", "Encefalite herpética", "Migrânea", "Estado de mal epiléptico", "Delirium"],
  },
  {
    name: "cefaleia",
    when: (ctx) => includesAny(ctx.all, ["cefale"]),
    dx: ["Migrânea", "Cefaleia tensional", "Hemorragia subaracnoidea aneurismática", "Arterite de células gigantes", "Meningite bacteriana"],
  },
  {
    name: "cardiovascular",
    when: (ctx) => includesAny(ctx.all, ["coronar", "angina", "card", "valvar", "taqui", "bradi", "sincope", "choque", "pressoric", "hipertens", "insuficiencia cardiaca"]),
    dx: ["Síndrome coronariana aguda", "Tromboembolismo pulmonar", "Insuficiência cardíaca descompensada", "Taquicardia supraventricular paroxística", "Fibrilação atrial com alta resposta ventricular", "Choque séptico", "Choque hipovolêmico"],
  },
  {
    name: "choque",
    when: (ctx) => includesAny(ctx.all, ["choque", "hipoperfus", "hipotensao"]),
    dx: ["Choque séptico", "Choque hipovolêmico", "Choque cardiogênico", "Choque obstrutivo", "Anafilaxia"],
  },
  {
    name: "renal_urinaria",
    when: (ctx) => includesAny(ctx.all, ["renal", "urin", "glomerul", "nefro", "pielonefrite", "cistite", "litíase", "litiase", "ureteral"]),
    dx: ["Cistite aguda", "Pielonefrite aguda", "Pielonefrite obstrutiva", "Cólica renal por cálculo ureteral", "Injúria renal aguda pré-renal", "Necrose tubular aguda", "Glomerulonefrite pós-estreptocócica"],
  },
  {
    name: "gineco_obstetrica",
    when: (ctx) => includesAny(ctx.all, ["gesta", "gestante", "puerper", "parto", "placenta", "uter", "vaginal", "pelvic", "ovario", "endometr", "mama", "amenorreia"]),
    dx: ["Gestação ectópica tubária", "Ameaça de abortamento", "Doença inflamatória pélvica aguda", "Mioma submucoso", "Sangramento anovulatório", "Placenta prévia", "Descolamento prematuro de placenta", "Pré-eclâmpsia"],
  },
  {
    name: "hipertensao_gestacao",
    when: (ctx) => includesAny(ctx.all, ["pre-eclampsia", "eclampsia", "hellp", "hipertensiva da gestacao", "gestacional com"]),
    dx: ["Hipertensão crônica", "Hipertensão gestacional", "Pré-eclâmpsia", "Eclâmpsia", "Síndrome HELLP"],
  },
  {
    name: "corrimento_ist_ulcera",
    when: (ctx) => includesAny(ctx.all, ["corrimento", "ulcera genital", "vulvovaginal", "ist", "sifilis", "herpes", "vaginose", "candidiase"]),
    dx: ["Vaginose bacteriana", "Candidíase vulvovaginal", "Tricomoníase", "Sífilis primária", "Herpes genital", "Cancroide"],
  },
  {
    name: "exantema_febre_arbovirose",
    when: (ctx) => includesAny(ctx.all, ["exant", "arbovir", "febril", "sarampo", "varicela", "dengue", "chikungunya", "zika", "maculosa"]),
    dx: ["Dengue", "Chikungunya", "Zika", "Sarampo", "Varicela", "Escarlatina", "Febre maculosa", "Exantema súbito"],
  },
  {
    name: "pediatria_infecciosa",
    when: (ctx) => ctx.area === "pediatria" && includesAny(ctx.all, ["febre", "infecc", "sepse", "meningite", "pneumonia", "itu", "osteomielite", "artrite septica"]),
    dx: ["Sepse pediátrica", "Meningite bacteriana", "Pneumonia bacteriana típica", "Infecção urinária febril no lactente", "Osteomielite aguda", "Artrite séptica"],
  },
  {
    name: "endocrino_metabolica",
    when: (ctx) => includesAny(ctx.all, ["diabet", "hiperglic", "tireo", "adrenal", "cushing", "aldoster", "prolact", "hipoglic", "metabolic", "obesidade", "dislipid"]),
    dx: ["Cetoacidose diabética", "Estado hiperosmolar hiperglicêmico", "Hipotireoidismo primário", "Doença de Graves", "Insuficiência adrenal primária", "Síndrome de Cushing", "Hiperaldosteronismo primário"],
  },
  {
    name: "eletrolitos",
    when: (ctx) => includesAny(ctx.all, ["sodio", "potassio", "hiponatremia", "hipercalemia", "hipocalemia", "eletrol"]),
    dx: ["Hiponatremia sintomática", "Hipercalemia", "Hipocalemia", "Hipercalcemia", "Hipomagnesemia"],
  },
  {
    name: "reumato_imune",
    when: (ctx) => includesAny(ctx.all, ["artr", "vascul", "lupus", "autoimune", "gota", "osteoartrite", "fibromialgia", "reumat", "kawasaki"]),
    dx: ["Artrite reumatoide", "Lúpus eritematoso sistêmico", "Gota", "Artrite séptica", "Osteoartrite de joelho", "Vasculite por IgA", "Doença de Kawasaki"],
  },
  {
    name: "dermato_partes_moles",
    when: (ctx) => includesAny(ctx.all, ["cutanea", "pele", "dermat", "prur", "escabiose", "impetigo", "celulite", "necrosante", "vulvar"]),
    dx: ["Impetigo", "Celulite bacteriana", "Escabiose", "Dermatite atópica", "Fasciíte necrosante", "Candidíase cutânea"],
  },
  {
    name: "trauma",
    when: (ctx) => includesAny(ctx.all, ["trauma", "traumatic", "fratura", "queimadura", "inalatoria", "hemotorax", "pneumotorax", "pelve", "raquimedular"]),
    dx: ["Choque hemorrágico no trauma", "Pneumotórax hipertensivo traumático", "Hemotórax maciço", "Lesão esplênica traumática", "Fratura pélvica instável", "Trauma raquimedular", "Lesão inalatória por queimadura"],
  },
  {
    name: "toxicos_envenenamento",
    when: (ctx) => includesAny(ctx.all, ["intoxic", "toxic", "envenenamento", "peconh", "organofosforado", "escorpion", "botropico", "tetano"]),
    dx: ["Intoxicação por organofosforado", "Intoxicação por monóxido de carbono", "Intoxicação por paracetamol", "Escorpionismo", "Acidente botrópico", "Tétano"],
  },
  {
    name: "hematologia_oncologia",
    when: (ctx) => includesAny(ctx.all, ["neoplas", "cancer", "tumor", "nodulo", "linfoma", "leucemia", "massa", "carcinoma", "adenocarcinoma", "wilms"]),
    dx: ["Adenocarcinoma colorretal", "Adenocarcinoma gástrico", "Carcinoma hepatocelular", "Adenocarcinoma de pâncreas", "Carcinoma invasivo de mama", "Linfoma de Hodgkin", "Leucemia linfoide aguda"],
  },
  {
    name: "psiquiatria",
    when: (ctx) => includesAny(ctx.all, ["depress", "ansios", "panico", "psicot", "maniaco", "alcool", "abstinencia", "humor"]),
    dx: ["Episódio depressivo maior", "Transtorno de pânico", "Primeiro surto psicótico", "Episódio maníaco", "Abstinência alcoólica", "Transtorno de ansiedade generalizada"],
  },
  {
    name: "oftalmo_otorrino",
    when: (ctx) => includesAny(ctx.all, ["ocular", "otite", "otologia", "rinossinusite", "faring", "orofaringe", "laringe", "glaucoma"]),
    dx: ["Glaucoma agudo de ângulo fechado", "Conjuntivite", "Otite média aguda", "Otite externa", "Rinossinusite aguda", "Faringoamigdalite estreptocócica"],
  },
];

const areaFallback = {
  "clínica médica": ["Pneumonia adquirida na comunidade", "Tromboembolismo pulmonar", "Síndrome coronariana aguda", "Sepse", "Doença autoimune sistêmica"],
  "go": ["Gestação ectópica tubária", "Doença inflamatória pélvica aguda", "Sangramento uterino anormal", "Pré-eclâmpsia", "Endometriose"],
  "pediatria": ["Sepse pediátrica", "Pneumonia bacteriana típica", "Infecção urinária febril no lactente", "Meningite bacteriana", "Gastroenterite aguda"],
  "cirurgia": ["Apendicite aguda", "Obstrução intestinal", "Colecistite aguda", "Pancreatite aguda", "Trauma abdominal"],
  "preventiva": ["Episódio depressivo maior", "Transtorno de pânico", "Tuberculose pulmonar", "Hanseníase tuberculoide", "Dengue"],
};

function collectCases(dir) {
  const cases = [];
  for (const file of fs.readdirSync(dir).filter((entry) => entry.endsWith(".json"))) {
    const fullPath = path.join(dir, file);
    const json = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    cases.push({ file, fullPath, json });
  }
  return cases;
}

function uniqueNamed(list, self) {
  const seen = new Set();
  const selfNorm = normalize(self);
  const output = [];
  for (const item of list) {
    const dx = typeof item === "string" ? item : item?.dx;
    if (!dx || GENERIC_DX.has(dx)) continue;
    const key = normalize(dx);
    if (!key || key === selfNorm || seen.has(key)) continue;
    seen.add(key);
    output.push(dx);
  }
  return output;
}

function buildIndexes(cases) {
  const byTopic = new Map();
  const bySyndrome = new Map();
  for (const item of cases) {
    const script = item.json.script || {};
    const topicKey = normalize(script.subtopico);
    const syndromeKey = normalize(script.sindrome);
    if (!byTopic.has(topicKey)) byTopic.set(topicKey, []);
    if (!bySyndrome.has(syndromeKey)) bySyndrome.set(syndromeKey, []);
    byTopic.get(topicKey).push(script.entidade);
    bySyndrome.get(syndromeKey).push(script.entidade);
  }
  return { byTopic, bySyndrome };
}

function ruleCandidates(script) {
  const ctx = {
    area: normalize(script.area),
    syndrome: normalize(script.sindrome),
    topic: normalize(script.subtopico),
    entity: normalize(script.entidade),
  };
  ctx.all = `${ctx.area} ${ctx.syndrome} ${ctx.topic} ${ctx.entity}`;

  return rules.flatMap((rule) => (rule.when(ctx) ? rule.dx : []));
}

function candidatesFor(script, currentDifferentials, indexes) {
  const topicKey = normalize(script.subtopico);
  const syndromeKey = normalize(script.sindrome);
  const areaKey = normalize(script.area);
  const candidates = [
    ...uniqueNamed(currentDifferentials, script.entidade),
    ...uniqueNamed(indexes.bySyndrome.get(syndromeKey) || [], script.entidade),
    ...uniqueNamed(indexes.byTopic.get(topicKey) || [], script.entidade),
    ...uniqueNamed(ruleCandidates(script), script.entidade),
    ...uniqueNamed(areaFallback[areaKey] || [], script.entidade),
  ];
  return uniqueNamed(candidates, script.entidade).slice(0, 4);
}

function hardenDir(dir) {
  if (!fs.existsSync(dir)) return { dir, files: 0, changed: 0, unresolved: [] };

  const cases = collectCases(dir);
  const indexes = buildIndexes(cases);
  const unresolved = [];
  let changed = 0;

  for (const item of cases) {
    const script = item.json.script;
    if (!script) continue;
    const baseCandidates = candidatesFor(script, item.json.instances?.[0]?.differentials || [], indexes);
    if (baseCandidates.length < 3) {
      unresolved.push({ file: item.file, entidade: script.entidade, sindrome: script.sindrome, candidates: baseCandidates });
      continue;
    }

    let fileChanged = false;
    for (const instance of item.json.instances || []) {
      const instanceCandidates = candidatesFor(script, instance.differentials || [], indexes);
      const dxs = instanceCandidates.length >= 3 ? instanceCandidates.slice(0, 3) : baseCandidates.slice(0, 3);
      const nextDifferentials = dxs.map((dx, index) => ({
        dx,
        plausibilidade: index === 0 ? "alta" : "media",
        pista: index === 0
          ? "principal confundível nomeado a comparar dentro da mesma apresentação sindrômica"
          : "diferencial nomeado da mesma síndrome ou apresentação clínica próxima",
      }));
      const nextSindromica = dxs;

      if (JSON.stringify(instance.differentials) !== JSON.stringify(nextDifferentials)) {
        instance.differentials = nextDifferentials;
        fileChanged = true;
      }
      if (instance.determinacaoSindromica && JSON.stringify(instance.determinacaoSindromica.diferenciaisDaSindrome) !== JSON.stringify(nextSindromica)) {
        instance.determinacaoSindromica.diferenciaisDaSindrome = nextSindromica;
        fileChanged = true;
      }
      if (instance._revisar) {
        instance._revisar = "Rascunho gerado localmente pelo Codex; diferenciais nomeados foram endurecidos por regra sindrômica e exigem revisão médica antes de publicar.";
      }
    }

    item.json._hardening = {
      differentials: "placeholders genericos substituidos por diagnosticos nomeados por subtopico/sindrome/catalogo local",
      reviewedAt: new Date().toISOString(),
    };

    if (fileChanged) {
      fs.writeFileSync(item.fullPath, JSON.stringify(item.json, null, 2));
      changed += 1;
    }
  }

  return { dir, files: cases.length, changed, unresolved };
}

const results = TARGET_DIRS.map(hardenDir);
fs.writeFileSync("diferenciais_hardening_report.json", JSON.stringify(results, null, 2));

for (const result of results) {
  console.log(`${result.dir}: arquivos=${result.files} alterados=${result.changed} pendentes=${result.unresolved.length}`);
}

const unresolved = results.flatMap((result) => result.unresolved.map((item) => ({ dir: result.dir, ...item })));
if (unresolved.length) {
  console.error("Pendentes de hardening:", JSON.stringify(unresolved, null, 2));
  process.exitCode = 1;
}
