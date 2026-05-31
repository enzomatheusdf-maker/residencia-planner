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

export const MACRO_PESO_ENAMED = {
  "Clínica Médica": 1.00,
  "Cirurgia": 0.97,
  "Preventiva": 1.10,
  "Pediatria": 0.95,
  "GO": 0.98,
  "Outro": 1.0,
};

export const USAR_CORPUS_CRU = false;
