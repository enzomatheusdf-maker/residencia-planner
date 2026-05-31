# MEDREV — BLOCO D: Banco de Casos Clínicos v2 + “Já domino” no Cronograma e na Âncora Clínica

> **Executor:** Claude Code / VSCodex  
> **Modelo sugerido:** `gpt-5.3-codex`  
> **Reasoning effort:** `high`  
> **Modo:** agent, com aprovação manual para comandos destrutivos.  
> **Objetivo:** implementar o banco de casos clínicos v2 e adicionar a ação “Já domino” apenas em temas não iniciados, com validação curta, tanto no cronograma quanto na Âncora Clínica dos 6 passos.

---

## 0. Decisões de produto já aprovadas

Implemente exatamente estas decisões:

1. O botão **“Já domino”** aparece **somente em temas não iniciados**.
2. Ao clicar, abre um **modal simples** com:
   - “Iniciar validação agora”
   - “Validar depois”
3. A validação, por enquanto, é **manual/externa**: o aluno informa total de questões e acertos após resolver questões fora do app.
4. Critério de validação:
   - mínimo de **15 questões**
   - mínimo de **80% de acerto**
5. Se validado:
   - 80–89% → agenda revisão inicial em **D7**
   - >=90% → agenda revisão inicial em **D14**
6. Tema validado por “Já domino” **não conta como dominado definitivo**.
   - Deve contar como `validado_previo`, `preDominado` ou equivalente.
   - Só vira “dominado” após revisão futura bem-sucedida.
7. Banco de casos clínicos: **12 casos**, cobrindo 5 áreas.
8. Estilo dos casos: **híbrido**.
   - Vinheta objetiva no estilo ENAMED/RES.
   - SCT e diferenciais para treinar incerteza clínica real.
9. Além do botão no cronograma, inserir a mesma ação **“Já domino”** na **Âncora Clínica dos 6 passos**.

---

## 1. Regras inegociáveis

Antes de editar:

```bash
git status --short
npm run check:mojibake
```

Durante a edição:

- Salvar tudo em **UTF-8 sem BOM**.
- Não usar Windows-1252/Latin-1.
- Não introduzir mojibake.
- Não introduzir emoji hardcoded em botões, badges ou KPIs. Use `lucide-react`.
- Não instalar bibliotecas novas.
- Não fazer `commit`, `deploy` ou `push` neste bloco.
- Manter lógica pura em `src/core/*`.
- UI fica em `src/components/*`.
- Estado persistente deve entrar no Zustand e na migração/merge manual do store.

---

## 2. Escopo do Bloco D

Este bloco tem dois subprojetos:

```txt
D1 — Reescrever src/constants/casosClinicos.js com schema v2 e 12 casos.
D2 — Adicionar “Já domino” no cronograma e na Âncora Clínica dos 6 passos.
```

Arquivos prováveis:

```txt
src/constants/casosClinicos.js       [REWRITE]
src/core/domainValidation.js         [PATCH ou EXTEND, se existir]
src/core/domainValidation.test.js    [PATCH ou NOVO]
src/core/store.js                    [PATCH]
src/components/*Cronograma*.jsx      [PATCH — localizar arquivo real]
src/components/*Focus*.jsx           [PATCH se contiver os 6 passos]
src/constants/stepDefinitions.js     [PATCH se a Âncora Clínica vier daqui]
src/components/DominioPrevioModal.jsx [NOVO, se não existir modal reutilizável]
```

Não altere ainda:

```txt
src/components/RaciocinioClinico.jsx
src/core/illnessScript.js
src/core/enamedIntel.js
src/components/EnamedMapa.jsx
```

Exceto se for necessário apenas para corrigir import quebrado.

---

## 3. D1 — Banco de Casos Clínicos v2

### 3.1 Reescrever `src/constants/casosClinicos.js`

Substitua o arquivo inteiro por um banco v2.

Contrato de cada caso:

```js
{
  id: "kebab-case-unico",
  area: "Clínica Médica" | "Cirurgia" | "GO" | "Pediatria" | "Preventiva",
  subarea: "string compatível com ENAMED_HOTNESS ou HOTNESS_KEYWORDS",
  tema: "nome educacional",
  temaMedcof: "string que deve casar com um tema real em MEDCOF/fsrs.js",
  dificuldade: "facil" | "media" | "dificil",

  vinheta: "caso clínico curto",
  problemRepKeywords: ["4-8 termos esperados"],

  diferenciais: [
    {
      dx: "Diagnóstico",
      plausibilidade: "alta" | "media" | "baixa",
      mustNotMiss: true,
      pista: "por que considerar"
    }
  ],

  script: {
    enabling: "condições predisponentes/contexto",
    fault: "fisiopatologia/defeito central",
    consequences: "manifestações esperadas",
    management: "conduta geral para prova/educação"
  },

  workup: ["exames/avaliações"],
  diagnosticoFinal: "diagnóstico final",
  justificativa: "por que esse dx vence",
  justificativaKeywords: ["termos para validar justificativa"],

  sct: [
    {
      hipotese: "hipótese avaliada",
      novaInfo: "informação nova",
      efeitoPainel: -2 | -1 | 0 | 1 | 2,
      racional: "interpretação"
    }
  ],

  anamnese: {
    queixa: "queixa-guia",
    roteiro: [
      { bloco: "nome", perguntasChave: ["..."] }
    ],
    redFlags: ["..."]
  }
}
```

### 3.2 Regras de qualidade dos casos

- Cada caso deve ter pelo menos 3 diferenciais.
- Cada caso deve ter pelo menos 1 `mustNotMiss`, quando clinicamente aplicável.
- Cada caso deve ter 2 ou 3 itens de SCT.
- `temaMedcof` deve tentar casar com nomes reais do `MEDCOF` em `src/core/fsrs.js`.
- Se o nome exato não existir, ajuste para o nome mais próximo existente no repo. Não deixe string impossível.
- Use conteúdo educacional e voltado a prova; não transformar isso em ferramenta assistencial para paciente real.
- Evite condutas excessivamente específicas se houver risco de desatualização; prefira conduta geral de prova.
- Manter PT-BR com acentos corretos.

### 3.3 Conteúdo paste-ready para `src/constants/casosClinicos.js`

Use este conteúdo como base. Depois valide os `temaMedcof` contra o `MEDCOF` real do repo e ajuste nomes se necessário.

```js
// src/constants/casosClinicos.js
// Banco de casos de Raciocínio Clínico (schema v2).
// Conteúdo educacional para treinamento de residência/ENAMED.
// Cada caso alimenta: problem representation -> hipóteses -> illness script -> SCT -> justificativa -> reencontro espaçado.
// REGRA: area canônica RES; temaMedcof deve casar com tema real da grade MEDCOF em fsrs.js quando possível.

export const CASOS_CLINICOS = [
  // ───────────────────────────────────────────────────────────────────────────
  // CIRURGIA
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: "apendicite-classica",
    area: "Cirurgia",
    subarea: "Cirurgia Geral",
    tema: "Apendicite Aguda",
    temaMedcof: "Apendicite Aguda",
    dificuldade: "media",
    vinheta:
      "Homem, 24 anos, dor periumbilical há 18 horas que migrou para fossa ilíaca direita, associada a anorexia, náusea e febre baixa. Dor à descompressão brusca em FID.",
    problemRepKeywords: ["agudo", "homem jovem", "dor migratória", "fossa ilíaca direita", "febril", "horas"],
    diferenciais: [
      { dx: "Apendicite aguda", plausibilidade: "alta", pista: "Dor migratória, anorexia, febre baixa e irritação peritoneal localizada." },
      { dx: "Adenite mesentérica", plausibilidade: "media", pista: "Pode simular apendicite em jovem, geralmente pós-IVAS e com menos peritonismo." },
      { dx: "Cólica ureteral", plausibilidade: "baixa", pista: "Dor em cólica, irradiação para genitália e hematúria favorecem cálculo." },
      { dx: "Torção testicular/causa gonadal", plausibilidade: "baixa", mustNotMiss: true, pista: "Dor abdominal baixa pode mascarar causa escrotal em homem jovem." }
    ],
    script: {
      enabling: "Adolescentes e adultos jovens; obstrução luminal por fecálito ou hiperplasia linfoide.",
      fault: "Obstrução do lúmen apendicular leva a distensão, isquemia, translocação bacteriana e inflamação transmural.",
      consequences: "Dor visceral periumbilical que migra para FID, anorexia, náuseas, febre baixa, leucocitose e sinais de irritação peritoneal.",
      management: "Jejum, analgesia, hidratação, antibiótico perioperatório e avaliação cirúrgica para apendicectomia; imagem se apresentação duvidosa."
    },
    workup: ["Hemograma", "PCR", "EAS", "Beta-hCG se mulher em idade fértil", "USG ou TC de abdome se dúvida diagnóstica"],
    diagnosticoFinal: "Apendicite aguda",
    justificativa:
      "A combinação de dor migratória para FID, anorexia, febre baixa e irritação peritoneal localizada sustenta apendicite aguda.",
    justificativaKeywords: ["migr", "fossa", "blumberg", "peritone", "anorex", "febre"],
    sct: [
      { hipotese: "Apendicite aguda", novaInfo: "TC mostra apêndice de 11 mm com apendicolito e borramento da gordura periapendicular.", efeitoPainel: 2, racional: "Achado tomográfico típico aumenta muito a probabilidade." },
      { hipotese: "Apendicite aguda", novaInfo: "USG mostra apêndice fino, compressível e sem líquido livre.", efeitoPainel: -2, racional: "Apêndice compressível e sem sinais inflamatórios reduz fortemente a hipótese." },
      { hipotese: "Apendicite aguda", novaInfo: "EAS mostra hematúria importante e dor irradiando para testículo.", efeitoPainel: -1, racional: "Aumenta probabilidade de cólica ureteral, embora não exclua totalmente." }
    ],
    anamnese: {
      queixa: "Dor abdominal aguda",
      roteiro: [
        { bloco: "Caracterização", perguntasChave: ["Início e migração da dor?", "Relação com movimento/tosse?", "Tipo e intensidade?"] },
        { bloco: "Associados", perguntasChave: ["Anorexia?", "Náuseas/vômitos?", "Febre?", "Sintomas urinários?"] },
        { bloco: "Diferenciais críticos", perguntasChave: ["Dor testicular?", "História ginecológica se aplicável?", "Uso de anticoagulantes?"] }
      ],
      redFlags: ["Peritonite difusa", "Instabilidade hemodinâmica", "Dor testicular aguda", "Sinais de perfuração"]
    }
  },

  {
    id: "abdome-agudo-obstrutivo",
    area: "Cirurgia",
    subarea: "Cirurgia Geral",
    tema: "Abdome Agudo Obstrutivo",
    temaMedcof: "Abdome Agudo Obstrutivo",
    dificuldade: "media",
    vinheta:
      "Mulher, 62 anos, com laparotomia prévia, apresenta dor abdominal em cólica há 2 dias, distensão progressiva, vômitos biliosos e parada de eliminação de gases e fezes.",
    problemRepKeywords: ["subagudo", "cólica", "distensão", "vômitos", "parada de gases", "cirurgia prévia"],
    diferenciais: [
      { dx: "Obstrução intestinal por bridas", plausibilidade: "alta", pista: "Cirurgia abdominal prévia é principal fator de risco para bridas." },
      { dx: "Hérnia encarcerada", plausibilidade: "media", mustNotMiss: true, pista: "Sempre examinar orifícios herniários em abdome obstrutivo." },
      { dx: "Neoplasia obstrutiva de cólon", plausibilidade: "media", mustNotMiss: true, pista: "Idade avançada e sintomas obstrutivos exigem considerar tumor." },
      { dx: "Íleo paralítico", plausibilidade: "baixa", pista: "Menos cólica e mais silêncio abdominal; comum no pós-operatório/metabólico." }
    ],
    script: {
      enabling: "Cirurgia abdominal prévia, hérnias, neoplasia colorretal, doença inflamatória ou aderências.",
      fault: "Bloqueio mecânico do trânsito intestinal causa acúmulo de gás e líquido, distensão proximal e risco de sofrimento vascular.",
      consequences: "Dor em cólica, distensão, vômitos, parada de gases/fezes, ruídos hidroaéreos aumentados inicialmente e desidratação.",
      management: "Jejum, hidratação venosa, correção eletrolítica, sonda nasogástrica se vômitos/distensão, imagem e cirurgia se estrangulamento ou falha clínica."
    },
    workup: ["Exame de hérnias", "Eletrólitos e função renal", "Lactato se suspeita de isquemia", "Radiografia de abdome", "TC de abdome com contraste se disponível"],
    diagnosticoFinal: "Obstrução intestinal mecânica por bridas",
    justificativa:
      "Dor em cólica, distensão, vômitos, parada de eliminação e antecedente de laparotomia sustentam obstrução mecânica por bridas.",
    justificativaKeywords: ["brida", "obstru", "cólica", "distensão", "gases", "laparotomia"],
    sct: [
      { hipotese: "Obstrução por bridas", novaInfo: "TC mostra pneumatose intestinal e líquido livre.", efeitoPainel: -1, racional: "Mantém obstrução, mas muda o foco para isquemia/estrangulamento e cirurgia urgente." },
      { hipotese: "Obstrução por bridas", novaInfo: "Exame físico mostra hérnia inguinal dolorosa, irredutível.", efeitoPainel: -2, racional: "Hérnia encarcerada passa a explicar melhor o quadro." },
      { hipotese: "Obstrução mecânica", novaInfo: "Paciente está no 1º pós-operatório, sem cólicas e com ruídos ausentes.", efeitoPainel: -1, racional: "Favorece íleo paralítico." }
    ],
    anamnese: {
      queixa: "Parada de eliminação e distensão",
      roteiro: [
        { bloco: "Padrão obstrutivo", perguntasChave: ["Última evacuação?", "Última eliminação de gases?", "Vômitos biliosos ou fecaloides?"] },
        { bloco: "Fatores de risco", perguntasChave: ["Cirurgias prévias?", "Hérnias conhecidas?", "Perda de peso ou sangramento intestinal?"] },
        { bloco: "Gravidade", perguntasChave: ["Dor contínua intensa?", "Febre?", "Tontura ou síncope?"] }
      ],
      redFlags: ["Dor contínua intensa", "Febre/taquicardia", "Lactato elevado", "Peritonite", "Hérnia irredutível"]
    }
  },

  {
    id: "colecistite-aguda",
    area: "Cirurgia",
    subarea: "Cirurgia Geral",
    tema: "Colecistite Aguda",
    temaMedcof: "Colecistite Aguda",
    dificuldade: "media",
    vinheta:
      "Mulher, 45 anos, dor contínua em hipocôndrio direito há 12 horas após refeição gordurosa, náuseas, febre baixa e sinal de Murphy positivo.",
    problemRepKeywords: ["mulher", "dor contínua", "hipocôndrio direito", "pós-prandial", "febre", "murphy"],
    diferenciais: [
      { dx: "Colecistite aguda", plausibilidade: "alta", pista: "Dor persistente em HCD, febre e Murphy positivo." },
      { dx: "Cólica biliar", plausibilidade: "media", pista: "Dor pós-prandial, mas costuma ser autolimitada e sem febre." },
      { dx: "Colangite aguda", plausibilidade: "baixa", mustNotMiss: true, pista: "Febre, icterícia e dor em HCD; pode evoluir com sepse." },
      { dx: "Hepatite aguda", plausibilidade: "baixa", pista: "Mal-estar, icterícia e transaminases muito elevadas." }
    ],
    script: {
      enabling: "Litíase biliar, sexo feminino, meia-idade, obesidade, perda ponderal rápida.",
      fault: "Obstrução do ducto cístico por cálculo provoca inflamação da vesícula e possível infecção secundária.",
      consequences: "Dor persistente em HCD, Murphy positivo, febre, leucocitose, náuseas e espessamento da parede vesicular ao USG.",
      management: "Jejum, analgesia, hidratação, antibiótico quando indicado e colecistectomia videolaparoscópica preferencialmente precoce."
    },
    workup: ["Hemograma", "Bilirrubinas e enzimas canaliculares", "Transaminases", "Amilase/lipase se dúvida", "Ultrassonografia de abdome"],
    diagnosticoFinal: "Colecistite aguda calculosa",
    justificativa:
      "Dor contínua em HCD, febre, Murphy positivo e contexto pós-prandial favorecem inflamação vesicular por cálculo.",
    justificativaKeywords: ["murphy", "hipocôndrio", "febre", "vesícula", "cálculo", "contínua"],
    sct: [
      { hipotese: "Colecistite aguda", novaInfo: "USG mostra cálculo impactado no colo, parede vesicular espessada e líquido perivesicular.", efeitoPainel: 2, racional: "Achados típicos confirmam a hipótese." },
      { hipotese: "Colecistite aguda", novaInfo: "Dor cessou completamente em 40 minutos e paciente está afebril.", efeitoPainel: -1, racional: "Favorece cólica biliar simples." },
      { hipotese: "Colecistite aguda", novaInfo: "Paciente apresenta icterícia, hipotensão e confusão mental.", efeitoPainel: -1, racional: "Alerta para colangite grave, diagnóstico e conduta diferentes." }
    ],
    anamnese: {
      queixa: "Dor em hipocôndrio direito",
      roteiro: [
        { bloco: "Dor biliar", perguntasChave: ["Relação com alimentação gordurosa?", "Duração da dor?", "Irradiação para dorso/ombro?"] },
        { bloco: "Infecção/obstrução", perguntasChave: ["Febre?", "Icterícia?", "Colúria/acolia?"] },
        { bloco: "Gravidade", perguntasChave: ["Confusão?", "Hipotensão?", "Vômitos persistentes?"] }
      ],
      redFlags: ["Icterícia com febre", "Hipotensão", "Confusão mental", "Peritonite"]
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // CLÍNICA MÉDICA
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: "scasst-dor-toracica",
    area: "Clínica Médica",
    subarea: "Cardiologia",
    tema: "Dor Torácica Coronariana",
    temaMedcof: "Dor Torácica Coronariana",
    dificuldade: "dificil",
    vinheta:
      "Homem, 58 anos, hipertenso e tabagista, apresenta dor retroesternal em aperto há 40 minutos, irradiada para mandíbula, com sudorese e náuseas.",
    problemRepKeywords: ["homem", "agudo", "retroesternal", "aperto", "irradiada", "fatores de risco", "minutos"],
    diferenciais: [
      { dx: "Síndrome coronariana aguda", plausibilidade: "alta", pista: "Dor típica, fatores de risco e sintomas autonômicos." },
      { dx: "Dissecção de aorta", plausibilidade: "baixa", mustNotMiss: true, pista: "Dor súbita, rasgante, irradiada para dorso e assimetria de pulsos/PA." },
      { dx: "Tromboembolismo pulmonar", plausibilidade: "baixa", mustNotMiss: true, pista: "Dispneia súbita, dor pleurítica, taquicardia e fatores de risco para TVP." },
      { dx: "Pericardite", plausibilidade: "baixa", pista: "Dor pleurítica que melhora ao inclinar o tronco para frente." }
    ],
    script: {
      enabling: "Idade, hipertensão, tabagismo, diabetes, dislipidemia e história familiar.",
      fault: "Ruptura ou erosão de placa aterosclerótica causa trombose coronariana e redução do fluxo miocárdico.",
      consequences: "Dor anginosa, sudorese, náuseas, alterações de ST/T no ECG e elevação de troponina quando há necrose.",
      management: "ECG precoce, estratificação com/sem supra, antiagregação/anticoagulação conforme cenário e reperfusão urgente no IAM com supra."
    },
    workup: ["ECG em até 10 minutos", "Troponina seriada", "RX de tórax se dúvida", "Função renal e eletrólitos", "Ecocardiograma conforme caso"],
    diagnosticoFinal: "Síndrome coronariana aguda",
    justificativa:
      "Dor anginosa típica, fatores de risco e sintomas autonômicos sustentam SCA; ECG e troponina classificam o subtipo.",
    justificativaKeywords: ["dor", "angin", "tropon", "ecg", "coronar", "supra"],
    sct: [
      { hipotese: "IAM com supra de ST", novaInfo: "ECG mostra supra de ST em DII, DIII e aVF.", efeitoPainel: 2, racional: "Confirma IAM com supra inferior e indica reperfusão." },
      { hipotese: "SCA", novaInfo: "Dor é totalmente reproduzível à palpação da parede torácica.", efeitoPainel: -1, racional: "Reduz probabilidade, mas não exclui em paciente de risco." },
      { hipotese: "SCA", novaInfo: "Há assimetria de pressão entre os braços e dor migrando para dorso.", efeitoPainel: -1, racional: "Aumenta suspeita de dissecção de aorta, um must-not-miss." }
    ],
    anamnese: {
      queixa: "Dor torácica",
      roteiro: [
        { bloco: "Caracterização", perguntasChave: ["Tipo da dor?", "Duração?", "Irradiação?", "Relação com esforço?"] },
        { bloco: "Sintomas associados", perguntasChave: ["Sudorese?", "Náuseas?", "Dispneia?", "Síncope?"] },
        { bloco: "Risco", perguntasChave: ["HAS/DM/tabagismo?", "História familiar?", "Uso de cocaína?"] }
      ],
      redFlags: ["Instabilidade hemodinâmica", "Síncope", "Dor migratória para dorso", "Assimetria de pulsos", "Dispneia intensa"]
    }
  },

  {
    id: "cetoacidose-diabetica",
    area: "Clínica Médica",
    subarea: "Endocrinologia",
    tema: "Cetoacidose Diabética",
    temaMedcof: "Emergências Hiperglicêmicas - CAD e EHH",
    dificuldade: "media",
    vinheta:
      "Mulher, 19 anos, DM1, apresenta poliúria, polidipsia, dor abdominal, vômitos e respiração profunda. Glicemia capilar 480 mg/dL e hálito cetônico.",
    problemRepKeywords: ["jovem", "DM1", "hiperglicemia", "vômitos", "kussmaul", "desidratação", "agudo"],
    diferenciais: [
      { dx: "Cetoacidose diabética", plausibilidade: "alta", pista: "DM1, hiperglicemia, cetose, acidose e respiração de Kussmaul." },
      { dx: "Estado hiperglicêmico hiperosmolar", plausibilidade: "baixa", pista: "Mais comum em DM2/idoso, com hiperosmolaridade e pouca cetose." },
      { dx: "Abdome agudo cirúrgico", plausibilidade: "baixa", mustNotMiss: true, pista: "Dor abdominal da CAD pode simular abdome cirúrgico; reavaliar após correção." }
    ],
    script: {
      enabling: "DM1, omissão de insulina, infecção, infarto, estresse metabólico ou primodescompensação.",
      fault: "Deficiência de insulina e excesso de hormônios contrarreguladores geram lipólise, cetogênese e acidose metabólica.",
      consequences: "Hiperglicemia, cetonemia/cetonúria, acidose, desidratação, Kussmaul, dor abdominal e distúrbios de potássio.",
      management: "Hidratação venosa, monitorização, reposição de potássio conforme nível sérico, insulina regular e tratamento do fator precipitante."
    },
    workup: ["Glicemia", "Gasometria", "Cetonemia ou cetonúria", "Eletrólitos com potássio seriado", "Função renal", "Investigação de gatilho infeccioso"],
    diagnosticoFinal: "Cetoacidose diabética",
    justificativa:
      "DM1 com hiperglicemia, cetose clínica, vômitos, Kussmaul e desidratação sugere CAD até prova em contrário.",
    justificativaKeywords: ["dm1", "ceton", "acidose", "kussmaul", "potássio", "insulina"],
    sct: [
      { hipotese: "Cetoacidose diabética", novaInfo: "Gasometria mostra pH 7,18 e bicarbonato 10 mEq/L.", efeitoPainel: 2, racional: "Acidose metabólica confirma componente essencial da CAD." },
      { hipotese: "Cetoacidose diabética", novaInfo: "Potássio inicial é 2,9 mEq/L.", efeitoPainel: -1, racional: "Não exclui CAD, mas muda a prioridade: repor potássio antes da insulina." },
      { hipotese: "Cetoacidose diabética", novaInfo: "pH normal, glicemia 780 mg/dL e osmolaridade muito elevada em idoso DM2.", efeitoPainel: -2, racional: "Favorece EHH." }
    ],
    anamnese: {
      queixa: "Vômitos e hiperglicemia",
      roteiro: [
        { bloco: "Descompensação", perguntasChave: ["Usou insulina?", "Sintomas infecciosos?", "Poliúria/polidipsia?"] },
        { bloco: "Gravidade", perguntasChave: ["Rebaixamento?", "Diurese?", "Dor abdominal intensa?"] },
        { bloco: "Gatilhos", perguntasChave: ["Infecção urinária/respiratória?", "IAM?", "Gestação?"] }
      ],
      redFlags: ["Choque", "Rebaixamento de consciência", "Hipocalemia grave", "Sepse"]
    }
  },

  {
    id: "pneumonia-comunitaria",
    area: "Clínica Médica",
    subarea: "Pneumologia",
    tema: "Pneumonia Adquirida na Comunidade",
    temaMedcof: "Pneumonia Adquirida na Comunidade",
    dificuldade: "facil",
    vinheta:
      "Homem, 67 anos, febre, tosse produtiva e dispneia há 3 dias. Ausculta com crepitações em base direita. Saturação 91% em ar ambiente.",
    problemRepKeywords: ["idoso", "febre", "tosse produtiva", "dispneia", "agudo", "crepitações", "hipoxemia"],
    diferenciais: [
      { dx: "Pneumonia adquirida na comunidade", plausibilidade: "alta", pista: "Síndrome infecciosa respiratória baixa com achado focal." },
      { dx: "Insuficiência cardíaca descompensada", plausibilidade: "media", pista: "Dispneia e crepitações, mas febre e escarro favorecem infecção." },
      { dx: "Tromboembolismo pulmonar", plausibilidade: "baixa", mustNotMiss: true, pista: "Dispneia súbita, dor pleurítica, taquicardia e fatores trombóticos." },
      { dx: "Tuberculose pulmonar", plausibilidade: "baixa", pista: "Curso subagudo/crônico, sudorese noturna, perda de peso." }
    ],
    script: {
      enabling: "Idade avançada, tabagismo, DPOC, comorbidades, aspiração e imunossupressão.",
      fault: "Infecção do parênquima pulmonar gera inflamação alveolar, consolidação e prejuízo de troca gasosa.",
      consequences: "Febre, tosse, escarro, dor pleurítica, dispneia, crepitações, hipoxemia e infiltrado radiológico.",
      management: "Avaliar gravidade, oxigênio se necessário, antibiótico empírico conforme cenário e decisão ambulatorial/enfermaria/UTI."
    },
    workup: ["Oximetria", "Radiografia de tórax", "Hemograma se moderada/grave", "Função renal se internar", "Culturas em casos graves"],
    diagnosticoFinal: "Pneumonia adquirida na comunidade",
    justificativa:
      "Febre, tosse produtiva, dispneia, hipoxemia e crepitações focais sustentam pneumonia comunitária.",
    justificativaKeywords: ["febre", "tosse", "crepita", "infiltrado", "hipox", "pneumonia"],
    sct: [
      { hipotese: "Pneumonia comunitária", novaInfo: "RX mostra consolidação lobar em base direita.", efeitoPainel: 2, racional: "Consolidação focal confirma síndrome pneumônica." },
      { hipotese: "Pneumonia comunitária", novaInfo: "BNP muito elevado e edema agudo bilateral no RX.", efeitoPainel: -1, racional: "Favorece insuficiência cardíaca, embora infecção possa coexistir." },
      { hipotese: "Pneumonia comunitária", novaInfo: "Dispneia começou subitamente após cirurgia recente.", efeitoPainel: -1, racional: "Aumenta suspeita de TEP." }
    ],
    anamnese: {
      queixa: "Tosse e dispneia",
      roteiro: [
        { bloco: "Infecção", perguntasChave: ["Febre?", "Escarro?", "Dor pleurítica?", "Tempo de sintomas?"] },
        { bloco: "Gravidade", perguntasChave: ["Dispneia em repouso?", "Confusão?", "Baixa ingesta?", "Saturação?"] },
        { bloco: "Risco", perguntasChave: ["DPOC?", "Aspiração?", "Internação recente?", "Imunossupressão?"] }
      ],
      redFlags: ["Hipoxemia", "Confusão", "Hipotensão", "Taquipneia importante", "Sepse"]
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // GO
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: "pre-eclampsia-grave",
    area: "GO",
    subarea: "Gestação Alto Risco",
    tema: "Síndromes Hipertensivas na Gestação",
    temaMedcof: "Síndromes Hipertensivas na Gestação",
    dificuldade: "dificil",
    vinheta:
      "Gestante de 34 semanas, primigesta, PA 165/110 mmHg, cefaleia intensa, escotomas e proteinúria significativa.",
    problemRepKeywords: ["gestante", "34 semanas", "hipertensão", "proteinúria", "cefaleia", "escotomas", "gravidade"],
    diferenciais: [
      { dx: "Pré-eclâmpsia com sinais de gravidade", plausibilidade: "alta", pista: "HAS após 20 semanas com proteinúria e sintomas neurológicos." },
      { dx: "Síndrome HELLP", plausibilidade: "media", mustNotMiss: true, pista: "Plaquetopenia, hemólise e enzimas hepáticas elevadas." },
      { dx: "HAS crônica", plausibilidade: "baixa", pista: "Hipertensão antes de 20 semanas ou prévia à gestação." },
      { dx: "Eclâmpsia", plausibilidade: "baixa", mustNotMiss: true, pista: "Convulsão em contexto de pré-eclâmpsia." }
    ],
    script: {
      enabling: "Primigesta, extremos de idade, gestação múltipla, HAS, DM, doença renal e história prévia.",
      fault: "Placentação anormal causa disfunção endotelial sistêmica, vasoespasmo e lesão de órgão-alvo.",
      consequences: "Hipertensão após 20 semanas, proteinúria ou lesão de órgão-alvo, cefaleia, escotomas, epigastralgia e risco de eclâmpsia/HELLP.",
      management: "Sulfato de magnésio para prevenção de convulsão, controle pressórico e avaliação de interrupção da gestação conforme gravidade e idade gestacional."
    },
    workup: ["PA seriada", "Proteinúria", "Hemograma com plaquetas", "TGO/TGP", "LDH", "Bilirrubinas", "Creatinina", "Avaliação fetal"],
    diagnosticoFinal: "Pré-eclâmpsia com sinais de gravidade",
    justificativa:
      "PA grave após 20 semanas, proteinúria e sintomas neurológicos caracterizam pré-eclâmpsia com sinais de gravidade.",
    justificativaKeywords: ["20 semanas", "proteinúria", "cefaleia", "escotomas", "magnésio", "gravidade"],
    sct: [
      { hipotese: "Pré-eclâmpsia grave", novaInfo: "Plaquetas 72 mil, TGO elevada e LDH alto.", efeitoPainel: 2, racional: "Aumenta suspeita de HELLP associada." },
      { hipotese: "Pré-eclâmpsia grave", novaInfo: "PA elevada já era documentada antes da gestação.", efeitoPainel: -1, racional: "Sugere HAS crônica, embora possa haver pré-eclâmpsia sobreposta." },
      { hipotese: "Eclâmpsia iminente", novaInfo: "Paciente apresenta crise convulsiva tônico-clônica.", efeitoPainel: 2, racional: "Convulsão define eclâmpsia no contexto." }
    ],
    anamnese: {
      queixa: "Cefaleia na gestação",
      roteiro: [
        { bloco: "Gravidade", perguntasChave: ["Escotomas?", "Epigastralgia?", "Dispneia?", "Convulsão?"] },
        { bloco: "Gestação", perguntasChave: ["Idade gestacional?", "Movimentação fetal?", "Pré-natal?"] },
        { bloco: "Antecedentes", perguntasChave: ["HAS prévia?", "Pré-eclâmpsia anterior?", "Doença renal?"] }
      ],
      redFlags: ["Convulsão", "Plaquetopenia", "Epigastralgia intensa", "Oligúria", "Sofrimento fetal"]
    }
  },

  {
    id: "gestacao-ectopica",
    area: "GO",
    subarea: "Emergências Obstétricas",
    tema: "Gestação Ectópica",
    temaMedcof: "Gestação Ectópica",
    dificuldade: "media",
    vinheta:
      "Mulher, 28 anos, atraso menstrual de 7 semanas, dor pélvica unilateral e sangramento vaginal discreto. Beta-hCG positivo.",
    problemRepKeywords: ["mulher", "atraso menstrual", "dor pélvica", "unilateral", "sangramento", "beta-hCG"],
    diferenciais: [
      { dx: "Gestação ectópica", plausibilidade: "alta", mustNotMiss: true, pista: "Atraso menstrual, dor unilateral, sangramento e beta-hCG positivo." },
      { dx: "Abortamento", plausibilidade: "media", pista: "Sangramento no primeiro trimestre, cólicas e beta-hCG positivo." },
      { dx: "Cisto ovariano roto", plausibilidade: "baixa", pista: "Dor súbita, pode ter líquido livre, mas beta-hCG ajuda a diferenciar." },
      { dx: "Doença inflamatória pélvica", plausibilidade: "baixa", pista: "Dor pélvica, corrimento, febre e dor à mobilização do colo." }
    ],
    script: {
      enabling: "DIP prévia, cirurgia tubária, gravidez ectópica anterior, DIU, reprodução assistida e tabagismo.",
      fault: "Implantação do embrião fora da cavidade uterina, geralmente na tuba, com risco de ruptura e hemoperitônio.",
      consequences: "Atraso menstrual, dor pélvica unilateral, sangramento vaginal, beta-hCG positivo, ausência de gestação intrauterina e instabilidade se rota.",
      management: "Avaliar estabilidade hemodinâmica; beta-hCG seriado e USG transvaginal; tratamento medicamentoso ou cirúrgico conforme estabilidade, tamanho e critérios."
    },
    workup: ["Beta-hCG quantitativo", "Ultrassonografia transvaginal", "Hemograma", "Tipagem/Rh", "Avaliação hemodinâmica"],
    diagnosticoFinal: "Gestação ectópica",
    justificativa:
      "A tríade de atraso menstrual, dor pélvica unilateral e sangramento com beta-hCG positivo exige suspeitar de gestação ectópica.",
    justificativaKeywords: ["atraso", "unilateral", "sangramento", "beta", "ectópica", "tuba"],
    sct: [
      { hipotese: "Gestação ectópica", novaInfo: "USG transvaginal mostra massa anexial e líquido livre.", efeitoPainel: 2, racional: "Achado aumenta muito a probabilidade e alerta para complicação." },
      { hipotese: "Gestação ectópica", novaInfo: "USG mostra gestação intrauterina tópica com batimentos.", efeitoPainel: -2, racional: "Reduz fortemente ectópica na maioria dos cenários." },
      { hipotese: "Gestação ectópica rota", novaInfo: "Paciente está hipotensa, pálida e com dor abdominal difusa.", efeitoPainel: 2, racional: "Sugere ruptura com hemoperitônio." }
    ],
    anamnese: {
      queixa: "Dor pélvica no primeiro trimestre",
      roteiro: [
        { bloco: "Gestação", perguntasChave: ["DUM?", "Teste positivo?", "Idade gestacional estimada?"] },
        { bloco: "Sangramento/dor", perguntasChave: ["Volume do sangramento?", "Dor unilateral?", "Ombro/dor difusa?"] },
        { bloco: "Risco", perguntasChave: ["DIP prévia?", "Ectópica anterior?", "DIU?", "Cirurgia tubária?"] }
      ],
      redFlags: ["Hipotensão", "Síncope", "Dor abdominal difusa", "Sinais de choque", "Líquido livre"]
    }
  },

  {
    id: "hemorragia-pos-parto-atonia",
    area: "GO",
    subarea: "Emergências Obstétricas",
    tema: "Hemorragia Pós-Parto",
    temaMedcof: "Hemorragia Pós-Parto",
    dificuldade: "media",
    vinheta:
      "Puérpera imediata após parto vaginal evolui com sangramento volumoso, útero amolecido e aumentado, taquicardia e palidez.",
    problemRepKeywords: ["puerpério imediato", "sangramento volumoso", "útero amolecido", "taquicardia", "palidez", "atonia"],
    diferenciais: [
      { dx: "Hemorragia pós-parto por atonia uterina", plausibilidade: "alta", pista: "Sangramento com útero flácido no puerpério imediato." },
      { dx: "Laceração de canal de parto", plausibilidade: "media", pista: "Sangramento persistente com útero contraído." },
      { dx: "Retenção placentária", plausibilidade: "media", mustNotMiss: true, pista: "Placenta incompleta ou não dequitação." },
      { dx: "Coagulopatia", plausibilidade: "baixa", mustNotMiss: true, pista: "Sangramento difuso, história de DPP/óbito fetal/HELLP." }
    ],
    script: {
      enabling: "Sobredistensão uterina, trabalho de parto prolongado, multiparidade, corioamnionite, uso de uterorrelaxantes.",
      fault: "Falha de contração do miométrio impede compressão dos vasos uterinos no sítio placentário.",
      consequences: "Sangramento volumoso, útero amolecido, instabilidade, choque hipovolêmico se não tratado.",
      management: "Massagem uterina, uterotônicos, reposição volêmica/hemoderivados, investigar 4 Ts e escalonar medidas se refratário."
    },
    workup: ["Avaliação de tônus uterino", "Inspeção de canal de parto", "Revisão placentária", "Hemograma", "Coagulograma se grave", "Tipagem/prova cruzada"],
    diagnosticoFinal: "Hemorragia pós-parto por atonia uterina",
    justificativa:
      "Sangramento volumoso no pós-parto imediato com útero flácido é típico de atonia uterina.",
    justificativaKeywords: ["pós-parto", "atonia", "útero", "flácido", "sangramento", "uterotônico"],
    sct: [
      { hipotese: "Atonia uterina", novaInfo: "Após massagem, o útero contrai e o sangramento reduz.", efeitoPainel: 2, racional: "Resposta reforça atonia como causa." },
      { hipotese: "Atonia uterina", novaInfo: "Útero está bem contraído, mas há sangramento vermelho vivo contínuo.", efeitoPainel: -2, racional: "Favorece laceração de trajeto." },
      { hipotese: "Retenção placentária", novaInfo: "Placenta está incompleta ao exame.", efeitoPainel: 2, racional: "Aumenta hipótese de restos placentários." }
    ],
    anamnese: {
      queixa: "Sangramento no pós-parto",
      roteiro: [
        { bloco: "Tempo e volume", perguntasChave: ["Quando iniciou?", "Quantidade estimada?", "Sinais de choque?"] },
        { bloco: "4 Ts", perguntasChave: ["Tônus uterino?", "Trauma?", "Tecido retido?", "Trombina/coagulopatia?"] },
        { bloco: "Fatores de risco", perguntasChave: ["Parto prolongado?", "Gemelar?", "Macrossomia?", "Corioamnionite?"] }
      ],
      redFlags: ["Hipotensão", "Taquicardia", "Rebaixamento", "Sangramento maciço", "Coagulopatia"]
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // PEDIATRIA
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: "bronquiolite-lactente",
    area: "Pediatria",
    subarea: "Pneumologia Pediátrica",
    tema: "Bronquiolite",
    temaMedcof: "Bronquiolite",
    dificuldade: "facil",
    vinheta:
      "Lactente de 4 meses, coriza e tosse há 3 dias, evolui com taquipneia, sibilância difusa, tiragens leves e dificuldade para mamar. Afebril ou febre baixa.",
    problemRepKeywords: ["lactente", "coriza", "tosse", "taquipneia", "sibilância", "mamar", "dias"],
    diferenciais: [
      { dx: "Bronquiolite viral aguda", plausibilidade: "alta", pista: "Primeiro episódio de sibilância em lactente após pródromo viral." },
      { dx: "Asma/sibilância recorrente", plausibilidade: "baixa", pista: "História de episódios prévios e atopia favorecem." },
      { dx: "Pneumonia", plausibilidade: "media", mustNotMiss: true, pista: "Febre alta, toxemia, assimetria auscultatória ou hipoxemia importante." },
      { dx: "Aspiração de corpo estranho", plausibilidade: "baixa", mustNotMiss: true, pista: "Início súbito, engasgo e assimetria." }
    ],
    script: {
      enabling: "Lactentes, sazonalidade viral, exposição a irmãos/creche, prematuridade e cardiopatia aumentam risco.",
      fault: "Infecção viral causa edema, necrose epitelial e muco em pequenas vias aéreas.",
      consequences: "Coriza, tosse, taquipneia, sibilância, tiragens, dificuldade alimentar e hipoxemia em casos graves.",
      management: "Tratamento de suporte: hidratação, oxigênio se hipoxemia, aspiração nasal; evitar broncodilatador/corticoide de rotina."
    },
    workup: ["Diagnóstico clínico", "Oximetria", "RX apenas se dúvida/gravidade", "Avaliar hidratação e esforço respiratório"],
    diagnosticoFinal: "Bronquiolite viral aguda",
    justificativa:
      "Lactente com pródromo viral, primeiro episódio de sibilância, taquipneia e dificuldade alimentar sugere bronquiolite.",
    justificativaKeywords: ["lactente", "viral", "sibil", "taquip", "mamar", "suporte"],
    sct: [
      { hipotese: "Bronquiolite", novaInfo: "Saturação 88% em ar ambiente.", efeitoPainel: 1, racional: "Mantém diagnóstico, mas aumenta gravidade e necessidade de oxigênio." },
      { hipotese: "Bronquiolite", novaInfo: "Início súbito após engasgo com amendoim.", efeitoPainel: -2, racional: "Favorece aspiração de corpo estranho." },
      { hipotese: "Pneumonia", novaInfo: "Febre alta, toxemia e estertores localizados em base direita.", efeitoPainel: 2, racional: "Aumenta pneumonia como diferencial." }
    ],
    anamnese: {
      queixa: "Chiado no lactente",
      roteiro: [
        { bloco: "Episódio atual", perguntasChave: ["Primeiro episódio?", "Coriza/tosse antes?", "Febre?"] },
        { bloco: "Gravidade", perguntasChave: ["Mama quanto?", "Pausas respiratórias?", "Cianose?", "Diurese?"] },
        { bloco: "Risco", perguntasChave: ["Prematuridade?", "Cardiopatia?", "Idade menor que 3 meses?"] }
      ],
      redFlags: ["Apneia", "Cianose", "Hipoxemia", "Recusa alimentar importante", "Exaustão respiratória"]
    }
  },

  {
    id: "diarreia-aguda-desidratacao",
    area: "Pediatria",
    subarea: "Gastroenterologia Pediátrica",
    tema: "Diarreia Aguda e Desidratação",
    temaMedcof: "Diarreia Aguda e Desidratação",
    dificuldade: "media",
    vinheta:
      "Criança de 2 anos com diarreia aquosa e vômitos há 2 dias. Olhos fundos, mucosas secas, bebe avidamente e apresenta turgor lentificado. Sem sangue nas fezes.",
    problemRepKeywords: ["criança", "diarreia aquosa", "vômitos", "desidratação", "olhos fundos", "sem sangue", "dias"],
    diferenciais: [
      { dx: "Gastroenterite aguda com desidratação moderada", plausibilidade: "alta", pista: "Diarreia aquosa sem sangue e sinais clínicos de desidratação." },
      { dx: "Disenteria", plausibilidade: "baixa", pista: "Sangue/muco e febre alta mudam manejo." },
      { dx: "Sepse/abdome cirúrgico", plausibilidade: "baixa", mustNotMiss: true, pista: "Toxemia, letargia, distensão ou sinais peritoneais." },
      { dx: "Desidratação grave", plausibilidade: "media", mustNotMiss: true, pista: "Letargia, incapacidade de beber, pulso fraco e enchimento lento." }
    ],
    script: {
      enabling: "Baixa idade, exposição viral, saneamento precário e baixa ingesta durante o quadro.",
      fault: "Perda intestinal de água e eletrólitos maior que a reposição, levando à contração de volume.",
      consequences: "Diarreia, vômitos, sede, olhos fundos, mucosas secas, alteração do turgor e risco de choque.",
      management: "Classificar desidratação; TRO supervisionada no Plano B; hidratação venosa no Plano C; zinco e manutenção alimentar."
    },
    workup: ["Avaliação clínica do grau de desidratação", "Peso se disponível", "Eletrólitos se grave ou venoso", "Coprocultura apenas em cenários selecionados"],
    diagnosticoFinal: "Diarreia aguda com desidratação moderada",
    justificativa:
      "Olhos fundos, sede ávida e turgor lentificado sem sinais de choque apontam desidratação moderada, manejada com Plano B.",
    justificativaKeywords: ["desidratação", "plano b", "tro", "olhos fundos", "sede", "turgor"],
    sct: [
      { hipotese: "Desidratação moderada", novaInfo: "Criança letárgica, incapaz de beber e com pulso fraco.", efeitoPainel: -2, racional: "Passa para desidratação grave, Plano C." },
      { hipotese: "Gastroenterite viral", novaInfo: "Fezes com sangue e muco, febre alta e tenesmo.", efeitoPainel: -1, racional: "Sugere disenteria." },
      { hipotese: "Plano B", novaInfo: "Criança está ativa, sem olhos fundos e bebe normalmente.", efeitoPainel: -2, racional: "Favorece ausência de desidratação ou Plano A." }
    ],
    anamnese: {
      queixa: "Diarreia e vômitos",
      roteiro: [
        { bloco: "Diarreia", perguntasChave: ["Número de evacuações?", "Sangue/muco?", "Duração?"] },
        { bloco: "Hidratação", perguntasChave: ["Diurese?", "Sede?", "Aceita líquidos?", "Vômitos persistentes?"] },
        { bloco: "Gravidade", perguntasChave: ["Letargia?", "Febre alta?", "Dor abdominal intensa?"] }
      ],
      redFlags: ["Letargia", "Incapacidade de beber", "Sangue nas fezes", "Choque", "Desnutrição grave"]
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // PREVENTIVA
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: "tuberculose-pulmonar-sintomatico",
    area: "Preventiva",
    subarea: "Doenças Infecciosas / Saúde Pública",
    tema: "Tuberculose",
    temaMedcof: "Tuberculose",
    dificuldade: "media",
    vinheta:
      "Homem, 38 anos, tosse há 5 semanas, perda ponderal, sudorese noturna e febre vespertina. Mora com irmão que tratou tuberculose recentemente.",
    problemRepKeywords: ["tosse crônica", "perda ponderal", "sudorese noturna", "febre vespertina", "contato", "semanas"],
    diferenciais: [
      { dx: "Tuberculose pulmonar", plausibilidade: "alta", pista: "Tosse prolongada com sintomas constitucionais e contato." },
      { dx: "Pneumonia bacteriana", plausibilidade: "baixa", pista: "Curso mais agudo, febre e consolidação." },
      { dx: "Neoplasia pulmonar", plausibilidade: "media", mustNotMiss: true, pista: "Tosse crônica, perda de peso, tabagismo e hemoptise." },
      { dx: "Histoplasmose/outra micose", plausibilidade: "baixa", pista: "Pode simular TB em imunossuprimidos ou exposições específicas." }
    ],
    script: {
      enabling: "Contato com TB, vulnerabilidade social, imunossupressão, HIV, diabetes, tabagismo e ambientes fechados.",
      fault: "Infecção por Mycobacterium tuberculosis com resposta granulomatosa e acometimento pulmonar transmissível.",
      consequences: "Tosse prolongada, escarro, hemoptise, febre vespertina, sudorese noturna, perda de peso e alterações radiológicas.",
      management: "Investigar sintomático respiratório com teste molecular rápido/baciloscopia e iniciar tratamento conforme confirmação e protocolos de saúde pública."
    },
    workup: ["Teste molecular rápido para TB", "Baciloscopia/cultura de escarro", "Radiografia de tórax", "Teste de HIV", "Investigação de contatos"],
    diagnosticoFinal: "Tuberculose pulmonar",
    justificativa:
      "Tosse por mais de 3 semanas associada a sintomas constitucionais e contato recente torna tuberculose pulmonar a principal hipótese.",
    justificativaKeywords: ["tosse", "3 semanas", "sudorese", "perda", "contato", "escarro"],
    sct: [
      { hipotese: "Tuberculose pulmonar", novaInfo: "Teste molecular rápido detecta M. tuberculosis.", efeitoPainel: 2, racional: "Confirma microbiologicamente a hipótese." },
      { hipotese: "Tuberculose pulmonar", novaInfo: "Quadro iniciou há 48 horas com febre alta e consolidação lobar.", efeitoPainel: -2, racional: "Favorece pneumonia bacteriana aguda." },
      { hipotese: "Neoplasia pulmonar", novaInfo: "Tabagista pesado com hemoptise e massa no RX.", efeitoPainel: 2, racional: "Aumenta muito neoplasia como diferencial importante." }
    ],
    anamnese: {
      queixa: "Tosse crônica",
      roteiro: [
        { bloco: "Sintomas respiratórios", perguntasChave: ["Duração da tosse?", "Escarro?", "Hemoptise?", "Dispneia?"] },
        { bloco: "Constitucionais", perguntasChave: ["Febre vespertina?", "Sudorese noturna?", "Perda de peso?"] },
        { bloco: "Epidemiologia", perguntasChave: ["Contato com TB?", "HIV?", "Privação de liberdade?", "Abrigo?"] }
      ],
      redFlags: ["Hemoptise volumosa", "Dispneia grave", "Imunossupressão", "Sinais de disseminação"]
    }
  },

  {
    id: "rastreamento-colo-utero",
    area: "Preventiva",
    subarea: "Rastreamento",
    tema: "Rastreamento do Câncer do Colo do Útero",
    temaMedcof: "Rastreamento do Câncer do Colo do Útero",
    dificuldade: "facil",
    vinheta:
      "Mulher, 31 anos, assintomática, procura UBS para consulta de rotina. Iniciou atividade sexual aos 18 anos e nunca realizou exame citopatológico.",
    problemRepKeywords: ["mulher", "31 anos", "assintomática", "rotina", "citopatológico", "rastreamento"],
    diferenciais: [
      { dx: "Rastreamento indicado para câncer do colo do útero", plausibilidade: "alta", pista: "Faixa etária-alvo e vida sexual ativa." },
      { dx: "Investigação diagnóstica de lesão cervical", plausibilidade: "baixa", pista: "Não há sintomas ou lesão visível descrita." },
      { dx: "Rastreamento não indicado", plausibilidade: "baixa", pista: "Seria mais provável fora da faixa etária ou sem indicação conforme protocolo." }
    ],
    script: {
      enabling: "Mulheres na faixa etária-alvo com história de atividade sexual.",
      fault: "Infecção persistente por HPV oncogênico pode gerar lesões precursoras detectáveis pelo citopatológico.",
      consequences: "Paciente geralmente assintomática; rastreamento busca lesões precursoras antes de câncer invasivo.",
      management: "Realizar citopatológico conforme protocolo de rastreamento; orientar periodicidade após resultados iniciais e seguimento se alteração."
    },
    workup: ["Citopatológico do colo uterino", "Avaliar histórico de exames prévios", "Investigar sintomas se presentes", "Registrar resultado e seguimento"],
    diagnosticoFinal: "Rastreamento indicado do câncer do colo do útero",
    justificativa:
      "Mulher de 31 anos, assintomática, com vida sexual e sem rastreamento prévio está no alvo de citopatológico de rotina.",
    justificativaKeywords: ["31 anos", "rastreamento", "citopatológico", "colo", "assintomática", "rotina"],
    sct: [
      { hipotese: "Rastreamento indicado", novaInfo: "Paciente tem 22 anos e iniciou atividade sexual há 1 ano.", efeitoPainel: -2, racional: "Fora da faixa-alvo usual de rastreamento de rotina." },
      { hipotese: "Rastreamento indicado", novaInfo: "Paciente relata sangramento pós-coital recorrente.", efeitoPainel: -1, racional: "Deixa de ser apenas rastreamento; vira investigação diagnóstica." },
      { hipotese: "Seguimento de alteração", novaInfo: "Citopatológico retorna com lesão de alto grau.", efeitoPainel: 2, racional: "Exige fluxo de investigação/encaminhamento conforme protocolo." }
    ],
    anamnese: {
      queixa: "Consulta preventiva",
      roteiro: [
        { bloco: "Histórico preventivo", perguntasChave: ["Já fez citopatológico?", "Quando foi o último?", "Resultado anterior?"] },
        { bloco: "Sintomas", perguntasChave: ["Sangramento pós-coital?", "Corrimento?", "Dor pélvica?"] },
        { bloco: "Contexto", perguntasChave: ["Gestação?", "Imunossupressão?", "História de lesão cervical?"] }
      ],
      redFlags: ["Sangramento pós-coital", "Lesão visível", "Dor pélvica persistente", "Imunossupressão"]
    }
  }
];

export function getCasoClinicoById(id) {
  return CASOS_CLINICOS.find((caso) => caso.id === id) || null;
}

export function getCasosClinicosPorArea(area) {
  return CASOS_CLINICOS.filter((caso) => caso.area === area);
}

export function getCasosClinicosPorTemaMedcof(temaMedcof) {
  return CASOS_CLINICOS.filter((caso) => caso.temaMedcof === temaMedcof);
}

export function listTemasMedcofComCasos() {
  return [...new Set(CASOS_CLINICOS.map((caso) => caso.temaMedcof))];
}
```

### 3.4 Validação do banco

Crie ou atualize teste:

```txt
src/constants/casosClinicos.test.js
```

Testes mínimos:

```js
import { CASOS_CLINICOS } from "./casosClinicos";

describe("CASOS_CLINICOS schema v2", () => {
  test("tem pelo menos 12 casos", () => {
    expect(CASOS_CLINICOS.length).toBeGreaterThanOrEqual(12);
  });

  test("ids são únicos", () => {
    const ids = CASOS_CLINICOS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("todos os casos têm campos essenciais", () => {
    for (const caso of CASOS_CLINICOS) {
      expect(caso.id).toBeTruthy();
      expect(caso.area).toBeTruthy();
      expect(caso.temaMedcof).toBeTruthy();
      expect(caso.vinheta).toBeTruthy();
      expect(caso.problemRepKeywords.length).toBeGreaterThanOrEqual(4);
      expect(caso.diferenciais.length).toBeGreaterThanOrEqual(3);
      expect(caso.script.enabling).toBeTruthy();
      expect(caso.script.fault).toBeTruthy();
      expect(caso.script.consequences).toBeTruthy();
      expect(caso.script.management).toBeTruthy();
      expect(caso.sct.length).toBeGreaterThanOrEqual(2);
      expect(caso.anamnese.roteiro.length).toBeGreaterThanOrEqual(2);
    }
  });

  test("SCT usa efeitoPainel entre -2 e 2", () => {
    for (const caso of CASOS_CLINICOS) {
      for (const item of caso.sct) {
        expect(item.efeitoPainel).toBeGreaterThanOrEqual(-2);
        expect(item.efeitoPainel).toBeLessThanOrEqual(2);
      }
    }
  });
});
```

Se Jest não estiver configurado para esse caminho, ajuste ao padrão do repo.

---

## 4. D2 — “Já domino” no Cronograma e na Âncora Clínica

### 4.1 Conceito de produto

O botão **não** marca o tema como dominado.

Ele inicia uma **validação de domínio prévio**:

> Use quando você já estudou esse tema antes. O sistema cria uma validação curta. Se você confirmar bom desempenho, o tema pula a exposição inicial e entra no ciclo de revisão com espaçamento maior. Se o desempenho for baixo, ele volta ao fluxo normal. Isso evita perder tempo, mas protege contra falsa confiança.

### 4.2 Onde o botão deve aparecer

Adicionar o botão em dois lugares:

1. **Card de tema do cronograma**
   - Apenas se o tema estiver **não iniciado**.
   - Botão secundário, menor que o CTA principal.
   - Texto: `Já domino`
   - Ícone: `CheckCircle2` ou `BadgeCheck` de `lucide-react`.

2. **Âncora Clínica nos 6 passos**
   - Na etapa/box onde o aluno conecta o tema a uma vinheta clínica.
   - Exibir como ação secundária:
     - `Já domino este tema`
   - Deve abrir o mesmo modal e usar a mesma lógica do cronograma.
   - A intenção aqui é excelente: no momento em que o aluno vê a âncora clínica, ele pode reconhecer que já domina o tema e validar sem passar por todo o estudo inicial.

### 4.3 Localizar os arquivos reais

Antes de implementar, procure:

```bash
grep -R "Âncora" -n src || true
grep -R "Ancora" -n src || true
grep -R "6 passos" -n src || true
grep -R "Passo" -n src/components src/constants || true
grep -R "Cronograma" -n src/components src/core || true
grep -R "domainValidation" -n src || true
grep -R "dominio" -n src || true
grep -R "onStudy" -n src/components src/core || true
```

Se estiver em PowerShell:

```powershell
Select-String -Path "src\**\*" -Pattern "Âncora","Ancora","6 passos","Passo","Cronograma","domainValidation","dominio","onStudy" -CaseSensitive:$false
```

### 4.4 Regra para “tema não iniciado”

Crie função pura, de preferência em `src/core/domainValidation.js` ou arquivo equivalente.

Nome sugerido:

```js
export function isTemaNaoIniciado(tema = {}) {
  // adaptar ao shape real do repo
}
```

A função deve considerar iniciado se houver qualquer sinal de estudo/revisão:

- `tema.status` diferente de inicial;
- `tema.iniciadoEm`;
- `tema.estudadoEm`;
- `tema.revisoes > 0`;
- `tema.cards > 0` com histórico;
- `tema.fsrs` com `S`, `D`, `reps`, `last_review`;
- `tema.dominioPrevio.status` já iniciado/validado/reprovado;
- qualquer registro de histórico do tema no store.

Como o shape real pode variar, implemente defensivo:

```js
export function isTemaNaoIniciado(tema = {}) {
  const dp = tema.dominioPrevio || tema.validacaoDominio || {};
  if (["validacao_pendente", "validado_previo", "reprovado"].includes(dp.status)) return false;

  const sinais = [
    tema.iniciadoEm,
    tema.estudadoEm,
    tema.concluidoEm,
    tema.lastReview,
    tema.last_review,
    tema.revisadoEm,
    tema.status && !["novo", "nao_iniciado", "não_iniciado"].includes(String(tema.status).toLowerCase()),
    Number(tema.revisoes || tema.reviews || tema.reps || 0) > 0,
    Number(tema.acertos || tema.respondidas || tema.totalQuestoes || 0) > 0,
    tema.fsrs && (tema.fsrs.last_review || tema.fsrs.reps > 0 || tema.fsrs.S || tema.fsrs.D)
  ];

  return !sinais.some(Boolean);
}
```

Ajuste aos campos reais depois de inspecionar o store.

### 4.5 Estado novo para validação de domínio prévio

Adicionar no estado do tema ou em mapa por tema, respeitando o shape real.

Shape recomendado:

```js
dominioPrevio: {
  status: "nao_avaliado" | "validacao_pendente" | "validado_previo" | "reprovado",
  iniciadoEm: "YYYY-MM-DD",
  validadoEm: null,
  metodo: "ja_domino",
  questoesAlvo: 15,
  total: null,
  acertos: null,
  percentual: null,
  intervaloInicial: null,
  proximaRevisao: null,
  observacao: null
}
```

Se o repo já tiver `domainValidation.js`, reaproveite os nomes e adicione campos compatíveis.

### 4.6 Funções puras de domínio prévio

Em `src/core/domainValidation.js`, adicione ou adapte:

```js
import { addDays, todayStr } from "./fsrs";

export const DOMINIO_PREVIO_MIN_QUESTOES = 15;
export const DOMINIO_PREVIO_MIN_ACERTO = 80;

export function calcularDominioPrevio({ acertos, total }) {
  const a = Number(acertos);
  const t = Number(total);

  if (!Number.isFinite(a) || !Number.isFinite(t) || t <= 0) {
    return {
      valido: false,
      status: "invalido",
      percentual: 0,
      motivo: "Informe total e acertos válidos."
    };
  }

  const percentual = Math.round((a / t) * 100);

  if (t < DOMINIO_PREVIO_MIN_QUESTOES) {
    return {
      valido: false,
      status: "amostra_insuficiente",
      percentual,
      motivo: `Resolva pelo menos ${DOMINIO_PREVIO_MIN_QUESTOES} questões para validar domínio prévio.`
    };
  }

  if (percentual < DOMINIO_PREVIO_MIN_ACERTO) {
    return {
      valido: false,
      status: "reprovado",
      percentual,
      motivo: "Domínio ainda não está estável; o tema volta para o fluxo normal."
    };
  }

  const intervaloInicial = percentual >= 90 ? 14 : 7;

  return {
    valido: true,
    status: "validado_previo",
    percentual,
    intervaloInicial,
    proximaRevisao: addDays(todayStr(), intervaloInicial),
    motivo:
      percentual >= 90
        ? "Domínio prévio forte: tema entra em revisão inicial D14."
        : "Domínio prévio suficiente: tema entra em revisão inicial D7."
  };
}

export function criarValidacaoDominioPrevio() {
  return {
    status: "validacao_pendente",
    iniciadoEm: todayStr(),
    validadoEm: null,
    metodo: "ja_domino",
    questoesAlvo: DOMINIO_PREVIO_MIN_QUESTOES,
    total: null,
    acertos: null,
    percentual: null,
    intervaloInicial: null,
    proximaRevisao: null,
    observacao: null
  };
}

export function finalizarValidacaoDominioPrevio({ acertos, total }) {
  const resultado = calcularDominioPrevio({ acertos, total });

  return {
    status: resultado.valido ? "validado_previo" : "reprovado",
    iniciadoEm: todayStr(),
    validadoEm: todayStr(),
    metodo: "ja_domino",
    questoesAlvo: DOMINIO_PREVIO_MIN_QUESTOES,
    total: Number(total),
    acertos: Number(acertos),
    percentual: resultado.percentual,
    intervaloInicial: resultado.intervaloInicial || null,
    proximaRevisao: resultado.proximaRevisao || null,
    observacao: resultado.motivo
  };
}
```

Se `domainValidation.js` já exporta funções com nomes próximos, não duplique. Integre.

### 4.7 Actions no Zustand

Em `src/core/store.js`, adicionar actions compatíveis com o shape real.

Nomes sugeridos:

```js
iniciarValidacaoDominioPrevio(platKey, temaId)
finalizarValidacaoDominioPrevio(platKey, temaId, { acertos, total })
cancelarValidacaoDominioPrevio(platKey, temaId)
```

Comportamento:

#### `iniciarValidacaoDominioPrevio`

- Só funciona se `isTemaNaoIniciado(tema) === true`.
- Adiciona `dominioPrevio.status = "validacao_pendente"`.
- Não marca como estudado.
- Não marca como dominado.
- Não incrementa streak.
- Não registra acerto.
- Não mexe em métricas de performance.

#### `finalizarValidacaoDominioPrevio`

- Usa `calcularDominioPrevio`.
- Se `validado_previo`:
  - marca `dominioPrevio.status = "validado_previo"`;
  - salva `percentual`, `total`, `acertos`, `proximaRevisao`;
  - agenda revisão inicial D7/D14;
  - pula exposição inicial, se o repo tiver status/etapa;
  - **não** marca `dominado: true`.
- Se `reprovado`:
  - marca `dominioPrevio.status = "reprovado"`;
  - mantém tema no fluxo normal.
  - Mostra mensagem formativa.

#### `cancelarValidacaoDominioPrevio`

- Volta para `nao_avaliado` ou remove `dominioPrevio`.
- Não deve alterar progresso.

Como o shape do store pode ser complexo, implemente com helper local para atualizar tema por id/nome sem quebrar outros campos.

### 4.8 Modal de validação

Criar `src/components/DominioPrevioModal.jsx`, se não houver modal reutilizável.

Requisitos:

- Props:
  - `open`
  - `tema`
  - `onClose`
  - `onStartLater`
  - `onSubmit({ acertos, total })`
- Texto do modal:

```txt
Já estudou este tema antes?

Use “Já domino” apenas quando você realmente já domina o conteúdo. O sistema não vai marcar domínio definitivo agora. Ele vai criar uma validação curta.

Como funciona:
1. Resolva pelo menos 15 questões sobre este tema.
2. Informe acertos e total.
3. Se fizer 80% ou mais, o tema pula a exposição inicial e entra no ciclo de revisão.
4. 80–89% agenda revisão D7; 90% ou mais agenda D14.
5. Se ficar abaixo de 80%, o tema volta ao estudo normal.

Isso economiza tempo sem premiar falsa confiança.
```

Botões:

```txt
Validar depois
Salvar resultado
Cancelar
```

Estados:

- Se usuário clicar no botão e escolher “Validar depois”, gravar `validacao_pendente`.
- Se informar acertos/total, finalizar.
- Validar input:
  - `total >= 1`
  - `0 <= acertos <= total`
  - alertar se `total < 15`.

Feedback:

- Validado:
  - `Domínio prévio validado. Próxima revisão: D7/D14.`
- Reprovado:
  - `Domínio ainda não está estável. Tema mantido no fluxo normal.`

### 4.9 Tooltip no botão

Adicionar tooltip/InfoTooltip perto do botão:

```txt
Use quando você já estudou este tema antes. O sistema cria uma validação curta com 15–20 questões. Se você confirmar bom desempenho, pula a exposição inicial e entra direto no ciclo de revisão. Se o desempenho for baixo, o tema volta para estudo normal.
```

### 4.10 Botão no cronograma

No card de tema:

- Mostrar apenas se `isTemaNaoIniciado(tema)`.
- Ação secundária, não ocupar o lugar do botão principal.
- Deve ser acessível em mobile:
  - alvo de toque `min-h-10` ou `min-h-11`;
  - texto visível;
  - ícone `BadgeCheck` ou `CheckCircle2`.

Exemplo de JSX adaptável:

```jsx
{isTemaNaoIniciado(tema) && (
  <div className="mt-2 flex items-center gap-2">
    <button
      type="button"
      onClick={() => abrirDominioPrevio(tema)}
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-400/15"
    >
      <BadgeCheck size={14} />
      Já domino
    </button>
    <InfoTooltip content="Use quando você já estudou este tema antes. O sistema cria uma validação curta com 15–20 questões. Se confirmar bom desempenho, pula a exposição inicial e entra no ciclo de revisão. Se não, volta ao fluxo normal." />
  </div>
)}
```

Adapte classes ao padrão existente.

### 4.11 Botão na Âncora Clínica dos 6 passos

Localize a etapa de Âncora Clínica. Ela pode estar em:

```txt
src/constants/stepDefinitions.js
src/components/FocusMode.jsx
src/components/StudySession.jsx
src/components/Academico.jsx
```

Se a etapa for definida em `stepDefinitions.js`, adicione metadado:

```js
{
  id: "ancora-clinica",
  title: "Âncora Clínica",
  ...
  allowDominioPrevio: true
}
```

No renderer dos 6 passos, quando `step.allowDominioPrevio === true` e `isTemaNaoIniciado(tema)`, renderize:

```jsx
<button
  type="button"
  onClick={() => abrirDominioPrevio(tema)}
  className="..."
>
  <BadgeCheck size={14} />
  Já domino este tema
</button>
```

Texto auxiliar abaixo do botão:

```txt
Se esta âncora clínica já é familiar e você domina o tema, valide com questões e pule a exposição inicial sem burlar o ciclo de revisão.
```

Regras:

- Não mostrar se tema já iniciado.
- Não mostrar se validação pendente/validada/reprovada.
- Usar o mesmo modal e a mesma action do cronograma.
- Não criar lógica duplicada.

---

## 5. Testes obrigatórios

### 5.1 Testes de domínio prévio

Criar ou atualizar `src/core/domainValidation.test.js`:

```js
import {
  calcularDominioPrevio,
  DOMINIO_PREVIO_MIN_QUESTOES,
  DOMINIO_PREVIO_MIN_ACERTO
} from "./domainValidation";

describe("domínio prévio", () => {
  test("rejeita amostra insuficiente", () => {
    const r = calcularDominioPrevio({ acertos: 10, total: 12 });
    expect(r.valido).toBe(false);
    expect(r.status).toBe("amostra_insuficiente");
  });

  test("reprova abaixo de 80%", () => {
    const r = calcularDominioPrevio({ acertos: 11, total: 15 });
    expect(r.valido).toBe(false);
    expect(r.status).toBe("reprovado");
    expect(r.percentual).toBeLessThan(DOMINIO_PREVIO_MIN_ACERTO);
  });

  test("valida com 80-89 e agenda D7", () => {
    const r = calcularDominioPrevio({ acertos: 12, total: 15 });
    expect(r.valido).toBe(true);
    expect(r.status).toBe("validado_previo");
    expect(r.intervaloInicial).toBe(7);
  });

  test("valida com 90+ e agenda D14", () => {
    const r = calcularDominioPrevio({ acertos: 18, total: 20 });
    expect(r.valido).toBe(true);
    expect(r.status).toBe("validado_previo");
    expect(r.intervaloInicial).toBe(14);
  });

  test("rejeita valores inválidos", () => {
    expect(calcularDominioPrevio({ acertos: 20, total: 10 }).valido).toBe(false);
    expect(calcularDominioPrevio({ acertos: -1, total: 15 }).valido).toBe(false);
  });
});
```

Atenção: a função paste-ready acima precisa validar `acertos <= total` e `acertos >= 0`. Se não tiver, adicione antes dos testes.

### 5.2 Teste do banco de casos

Rodar:

```bash
npm test -- --watchAll=false --runInBand
```

Se o setup do CRA não aceitar `--runInBand`, use:

```bash
npm test -- --watchAll=false
```

### 5.3 Teste manual de UI

Validar manualmente:

1. Abrir cronograma.
2. Encontrar tema não iniciado.
3. Ver botão **Já domino**.
4. Clicar.
5. Escolher `Validar depois`.
6. Confirmar que o tema fica com status de validação pendente.
7. Reabrir o mesmo tema e confirmar que o botão não aparece duplicado.
8. Criar outro tema não iniciado.
9. Inserir 12/15.
10. Confirmar `validado_previo`, D7, não dominado.
11. Inserir 18/20.
12. Confirmar `validado_previo`, D14, não dominado.
13. Inserir 10/15.
14. Confirmar `reprovado`, tema segue no fluxo normal.
15. Entrar nos 6 passos.
16. Ir até **Âncora Clínica**.
17. Confirmar botão **Já domino este tema** apenas se tema não iniciado.
18. Confirmar que abre o mesmo modal.
19. Confirmar que o botão não aparece em tema já iniciado.

---

## 6. Comandos finais do bloco

No fim deste bloco, rode:

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
git status --short
```

Se `npm test -- --watchAll=false` não funcionar por limitação do setup, rode o comando de teste padrão do repo e documente o motivo.

Não faça:

```bash
git commit
firebase deploy
git push
```

Isso fica para o bloco final.

---

## 7. Critérios de aceite

O Bloco D está aprovado se:

- `src/constants/casosClinicos.js` tem 12 casos v2.
- Todos os casos têm `temaMedcof`.
- Todos os casos têm `problemRepKeywords`, `diferenciais`, `script`, `sct`, `anamnese`.
- O app compila.
- O botão **Já domino** aparece somente em temas não iniciados.
- O botão aparece também na **Âncora Clínica dos 6 passos**.
- O clique abre modal de validação.
- `Validar depois` cria validação pendente.
- Resultado manual com >=15 questões e >=80% valida domínio prévio.
- 80–89% agenda D7.
- >=90% agenda D14.
- <80% mantém estudo normal.
- Validação prévia não conta como domínio definitivo.
- `npm run check:mojibake` passa.
- `npm run build` passa.

---

## 8. Nota para o executor

Não transforme “Já domino” em atalho para inflar métrica. A função correta é **economizar tempo de quem já sabe**, com validação mínima contra excesso de confiança.

A melhor experiência é:

```txt
Aluno reconhece tema familiar
→ clica “Já domino”
→ faz 15–20 questões
→ se performa bem, entra em revisão espaçada
→ se performa mal, volta ao fluxo normal sem punição moral
```

Isso é a diferença entre aceleração inteligente e autoengano.
