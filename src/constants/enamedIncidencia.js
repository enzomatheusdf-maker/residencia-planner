// Base de incidência ENAMED mesclada (corpus RESISTATS, 769 tópicos normalizados).
// USO: hotness de subtópico (priorização fina). Não usar share macro cru como peso:
// o corpus super-representa Preventiva (2 blocos). Ver MACRO_PESO_ENAMED abaixo.

export const ENAMED_MACRO_QUESTOES = {
  "Clínica Médica": 134,
  "Cirurgia": 123,
  "Preventiva": 237,
  "Pediatria": 112,
  "GO": 136,
};

export const ENAMED_MACRO_SHARE_CORPUS = {
  "Clínica Médica": 0.181,
  "Cirurgia": 0.166,
  "Preventiva": 0.319,
  "Pediatria": 0.151,
  "GO": 0.183,
};

export const ENAMED_BLUEPRINT = {
  "Clínica Médica": 0.20,
  "Cirurgia": 0.20,
  "Preventiva": 0.20,
  "Pediatria": 0.20,
  "GO": 0.20,
};

export const ENAMED_HOTNESS = {
  "Clínica Médica": {
    "Cardiologia": 0.16,
    "Reumatologia": 0.11,
    "Infectologia": 0.10,
    "Nefrologia": 0.09,
    "Pneumologia": 0.07,
    "Neurologia": 0.07,
    "Gastroenterologia": 0.07,
    "Endocrinologia": 0.05,
    "Emergências Clínicas": 0.04,
    "Hematologia": 0.04,
    "Geriatria": 0.03,
    "Oncologia": 0.03,
    "Psiquiatria": 0.03,
    "Imunologia": 0.02,
  },
  "Cirurgia": {
    "Cirurgia Geral": 0.43,
    "Cirurgia do Aparelho Digestivo": 0.22,
    "Cirurgia Plástica": 0.08,
    "Ortopedia": 0.05,
    "Anestesia": 0.05,
    "Cabeça e Pescoço": 0.04,
    "Endoscopia": 0.03,
    "Cirurgia Torácica": 0.03,
  },
  "Preventiva": {
    "APS / MFC / ESF": 0.40,
    "Epidemiologia": 0.20,
    "Medicina Legal / Ética": 0.15,
    "Política / Gestão / SUS": 0.12,
    "Vigilância em Saúde": 0.07,
    "Saúde do Trabalhador": 0.06,
  },
  "Pediatria": {
    "Infectologia Pediátrica": 0.25,
    "Puericultura": 0.13,
    "Neonatologia": 0.07,
    "Emergências Pediátricas": 0.07,
    "Oncologia Pediátrica": 0.06,
    "Cardiologia Pediátrica": 0.05,
    "Gastro Pediátrica": 0.05,
    "Nefrologia Pediátrica": 0.04,
  },
  "GO": {
    "Ginecologia Geral": 0.23,
    "Ginecologia Endócrina": 0.13,
    "Oncoginecologia": 0.11,
    "Mastologia": 0.04,
    "Uroginecologia": 0.03,
    "Assistência Pré-Natal": 0.11,
    "Gestação Alto Risco": 0.09,
    "Emergências Obstétricas": 0.08,
    "Assistência ao Parto": 0.07,
    "Medicina Fetal": 0.06,
  },
};

export const ENAMED_SUBTOPIC_ALIASES = {
  "Clínica Médica": {
    "Cardiologia": [
      "cardio",
      "hipertensao",
      "has",
      "insuficiencia cardiaca",
      "icc",
      "iam",
      "infarto",
      "sca",
      "sindrome coronariana",
      "arritmia",
      "valvopatia",
      "endocardite",
    ],
    "Reumatologia": ["reumato", "artrite", "lupus", "vasculite", "gota"],
    "Infectologia": ["infecto", "hiv", "aids", "tuberculose", "tb", "sepse", "antibiotico"],
    "Nefrologia": ["nefro", "ira", "drc", "glomerulonefrite", "dialise", "disturbio eletrolitico"],
    "Pneumologia": ["pneumo", "asma", "dpoc", "pneumonia", "tromboembolismo pulmonar", "tep"],
    "Neurologia": ["neuro", "avc", "ave", "epilepsia", "cefaleia", "demencia"],
    "Gastroenterologia": ["gastro", "hepatologia", "cirrose", "hepatite", "pancreatite", "diarreia"],
    "Endocrinologia": ["endocrino", "diabetes", "dm", "tireoide", "hipotireoidismo", "hipertireoidismo"],
    "Emergências Clínicas": ["emergencia clinica", "urgencia clinica", "choque", "parada", "suporte avancado"],
    "Hematologia": ["hemato", "anemia", "leucemia", "linfoma", "coagulopatia"],
    "Geriatria": ["idoso", "fragilidade", "delirium", "quedas"],
    "Oncologia": ["onco", "cancer", "neoplasia", "quimioterapia"],
    "Psiquiatria": ["psiquiatria", "depressao", "ansiedade", "transtorno bipolar", "psicose"],
    "Imunologia": ["imuno", "alergia", "imunodeficiencia", "anafilaxia"],
  },
  "Cirurgia": {
    "Cirurgia Geral": ["abdome agudo", "apendicite", "hernia", "trauma", "queimadura"],
    "Cirurgia do Aparelho Digestivo": ["cad", "vias biliares", "colecistite", "coledocolitiase", "obstrucao intestinal"],
    "Cirurgia Plástica": ["plastica", "retalho", "enxerto", "ferida"],
    "Ortopedia": ["orto", "fratura", "luxacao", "trauma ortopedico"],
    "Anestesia": ["anestesio", "anestesia", "via aerea", "sedacao"],
    "Cabeça e Pescoço": ["cabeca e pescoco", "tireoide cirurgica", "nodulo cervical"],
    "Endoscopia": ["endoscopia", "colonoscopia", "hemorragia digestiva"],
    "Cirurgia Torácica": ["toracica", "pneumotorax", "dreno de torax"],
  },
  "Preventiva": {
    "APS / MFC / ESF": ["aps", "mfc", "esf", "atencao primaria", "medicina de familia", "saude da familia"],
    "Epidemiologia": ["epidemiologia", "sensibilidade", "especificidade", "risco relativo", "odds ratio", "incidencia"],
    "Medicina Legal / Ética": ["etica", "medicina legal", "bioetica", "sigilo", "atestado", "deontologia"],
    "Política / Gestão / SUS": ["sus", "politica de saude", "gestao", "financiamento", "regionalizacao"],
    "Vigilância em Saúde": ["vigilancia", "notificacao", "surto", "imunizacao", "vacina"],
    "Saúde do Trabalhador": ["trabalhador", "ocupacional", "acidente de trabalho", "ler dort"],
  },
  "Pediatria": {
    "Infectologia Pediátrica": ["infecto pediatrica", "febre na crianca", "exantema", "bronquiolite"],
    "Puericultura": ["puericultura", "crescimento", "desenvolvimento", "aleitamento", "alimentacao infantil"],
    "Neonatologia": ["neonato", "rn", "prematuridade", "ictericia neonatal", "sepse neonatal"],
    "Emergências Pediátricas": ["emergencia pediatrica", "desidratacao", "convulsao febril", "parada pediatrica"],
    "Oncologia Pediátrica": ["onco pediatrica", "leucemia infantil", "tumor pediatrico"],
    "Cardiologia Pediátrica": ["cardio pediatrica", "cardiopatia congenita", "sopro infantil"],
    "Gastro Pediátrica": ["gastro pediatrica", "diarreia aguda", "refluxo infantil", "constipacao infantil"],
    "Nefrologia Pediátrica": ["nefro pediatrica", "itu crianca", "sindrome nefrotica"],
  },
  "GO": {
    "Ginecologia Geral": ["ginecologia", "corrimento", "sangramento uterino", "dor pelvica"],
    "Ginecologia Endócrina": ["gineco endocrina", "amenorreia", "sop", "infertilidade", "climaterio"],
    "Oncoginecologia": ["oncogineco", "cancer de colo", "hpv", "cancer de endometrio", "cancer de ovario"],
    "Mastologia": ["mama", "mastologia", "cancer de mama", "nodulo mamario"],
    "Uroginecologia": ["uro gineco", "incontinencia urinaria", "prolapso"],
    "Assistência Pré-Natal": ["pre natal", "prenatal", "assistencia pre natal", "rotina obstetrica"],
    "Gestação Alto Risco": ["alto risco", "diabetes gestacional", "dheg", "pre eclampsia", "eclampsia"],
    "Emergências Obstétricas": ["emergencia obstetrica", "hemorragia puerperal", "descolamento placenta", "placenta previa"],
    "Assistência ao Parto": ["parto", "trabalho de parto", "puerperio", "cesarea"],
    "Medicina Fetal": ["medicina fetal", "malformacao fetal", "ultrassom obstetrico", "restricao crescimento"],
  },
};

export const MACRO_PESO_ENAMED = {
  "Clínica Médica": 1.00,
  "Cirurgia": 0.97,
  "Preventiva": 1.10,
  "Pediatria": 0.95,
  "GO": 0.98,
  "Outro": 1.0,
};

export const USAR_CORPUS_CRU = false;
