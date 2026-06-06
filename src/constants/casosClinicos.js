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
  {
    id: "dor-toracica-coronariana",
    area: "Cl\u00ednica M\u00e9dica",
    subarea: "Cardiologia",
    tema: "Dor Tor\u00e1cica Coronariana",
    dificuldade: "media",
    vinheta: "Homem, 58 anos, tabagista e hipertenso, com dor retroesternal em aperto h\u00e1 40 min, irradiando para MSE, associada a sudorese.",
    script: {
      enabling: "Idade, tabagismo, hipertens\u00e3o, diabetes e dislipidemia aumentam o risco de SCA.",
      fault: "Rotura de placa ateroscler\u00f3tica com forma\u00e7\u00e3o de trombo e isquemia mioc\u00e1rdica.",
      consequences: "Dor anginosa t\u00edpica, altera\u00e7\u00f5es de ST/T, troponina elevada e instabilidade hemodin\u00e2mica em casos graves.",
      management: "Monitorizacao, AAS, antiagregacao, anticoagulacao e estrategia de reperfusao conforme ECG e tempo.",
    },
    diferenciais: [
      { dx: "SCA com supra", plausibilidade: "alta", pista: "Dor tipica com supra persistente de ST." },
      { dx: "Disseccao de aorta", plausibilidade: "media", pista: "Dor subita, lancinante e assimetria de pulsos." },
      { dx: "TEP", plausibilidade: "baixa", pista: "Dispneia aguda com fator de risco tromboembolico." },
      { dx: "Pericardite", plausibilidade: "baixa", pista: "Dor piora em decúbito dorsal e melhora ao sentar (posição genupeitoral)." },
    ],
    workup: ["ECG seriado", "Troponina", "Radiografia de torax"],
    diagnosticoFinal: "Sindrome coronariana aguda",
    justificativa: "Dor anginosa tipica em paciente de alto risco com achados compatíveis no ECG e nos marcadores.",
    sct: [
      { hipotese: "SCA", novaInfo: "ECG com supra de ST em parede inferior", efeitoPainel: +2, racional: "Torna IAM com supra a hipotese principal." },
      { hipotese: "SCA", novaInfo: "Dor piora com inspiracao profunda e palpacao local", efeitoPainel: -1, racional: "Reduz a probabilidade de dor coronariana." },
    ],
    anamnese: {
      queixa: "Dor toracica",
      roteiro: [
        { bloco: "Caracterizacao", perguntasChave: ["Inicio e duracao?", "Irradiacao?", "Relacao com esforco?"] },
        { bloco: "Risco", perguntasChave: ["HAS/DM/tabagismo?", "Evento semelhante previo?", "Sinais de instabilidade?"] },
      ],
      redFlags: ["Instabilidade hemodinamica", "Supra de ST", "Dor com sincope"],
    },
  },
  {
    id: "trauma-abdominal",
    area: "Cirurgia",
    subarea: "Trauma",
    tema: "Trauma Abdominal",
    dificuldade: "media",
    vinheta: "Homem, 27 anos, apos colisao automobilistica, com dor abdominal difusa, equimose em cinto de seguranca e taquicardia.",
    script: {
      enabling: "Mecanismo contuso de alta energia, uso de cinto, desaceleracao e queda de grande altura.",
      fault: "Lesao de orgaos solidos ou ocos com sangramento e contaminacao peritoneal.",
      consequences: "Dor abdominal, defesa, hipotensao, distensao, FAST positivo ou queda de hemoglobina.",
      management: "ABCDE, reposicao hemostatica, FAST/TC conforme estabilidade e laparotomia quando indicado.",
    },
    diferenciais: [
      { dx: "Trauma abdominal com hemoperitonio", plausibilidade: "alta", pista: "Dor + choque + FAST positivo." },
      { dx: "Lesao de viscera oca", plausibilidade: "media", pista: "Sinal do cinto e irritacao peritoneal progressiva." },
      { dx: "Contusao de parede", plausibilidade: "baixa", pista: "Dor localizada sem sinais sistemicos." },
    ],
    workup: ["FAST", "Hemograma seriado", "TC de abdome se estavel"],
    diagnosticoFinal: "Trauma abdominal com suspeita de lesao intra-abdominal",
    justificativa: "Mecanismo relevante associado a dor abdominal, sinais de sangramento e marcador de alta energia.",
    sct: [
      { hipotese: "Hemoperitonio", novaInfo: "FAST positivo em Morrison", efeitoPainel: +2, racional: "Aumenta fortemente a chance de sangramento intra-abdominal." },
      { hipotese: "Lesao abdominal relevante", novaInfo: "Paciente estavel, FAST negativo e dor localizada superficial", efeitoPainel: -1, racional: "Reduz probabilidade de lesao intra-abdominal grave." },
    ],
    anamnese: {
      queixa: "Dor abdominal apos trauma",
      roteiro: [
        { bloco: "Mecanismo", perguntasChave: ["Qual foi a dinamica do trauma?", "Houve desaceleracao ou cinto?", "Perda de consciencia?"] },
        { bloco: "Repercussao", perguntasChave: ["Dor difusa ou localizada?", "Vomitos?", "Tontura ou lipotimia?"] },
      ],
      redFlags: ["Instabilidade hemodinamica", "FAST positivo", "Peritonite"],
    },
  },
  {
    id: "sindromes-hipertensivas-gestacao",
    area: "GO",
    subarea: "Obstetricia",
    tema: "Sindromes Hipertensivas na Gestacao",
    dificuldade: "dificil",
    vinheta: "Gestante de 32 semanas, PA 170/110, cefaleia intensa, escotomas e dor em hipocondrio direito.",
    script: {
      enabling: "Primigesta, gestacao gemelar, HAS cronica, doenca renal e antecedentes de pre-eclampsia.",
      fault: "Placentacao anomala com disfuncao endotelial sistemica e vasoespasmo.",
      consequences: "HAS apos 20 semanas, proteinuria ou lesao de orgao-alvo, e risco de eclampsia/HELLP.",
      management: "Controle pressorico, sulfato de magnesio, vigilancia materno-fetal e avaliacao do momento do parto.",
    },
    diferenciais: [
      { dx: "Pre-eclampsia com sinais de gravidade", plausibilidade: "alta", pista: "HAS grave + sintomas neurologicos ou dor em HD." },
      { dx: "HAS cronica descompensada", plausibilidade: "media", pista: "Historia previa antes de 20 semanas." },
      { dx: "Cefaleia primaria", plausibilidade: "baixa", pista: "Sem HAS ou alteracoes laboratoriais." },
    ],
    workup: ["PA seriada", "Proteinuria", "Plaquetas", "TGO/TGP", "Creatinina"],
    diagnosticoFinal: "Pre-eclampsia com sinais de gravidade",
    justificativa: "Hipertensao grave apos 20 semanas com sinais clinicos compativeis com gravidade.",
    sct: [
      { hipotese: "Pre-eclampsia grave", novaInfo: "Plaquetas 90 mil e TGO elevada", efeitoPainel: +2, racional: "Aproxima o quadro de HELLP." },
      { hipotese: "Pre-eclampsia grave", novaInfo: "PA normalizada e ausencia de lesao de orgao-alvo", efeitoPainel: -1, racional: "Reduz a chance de gravidade sustentada." },
    ],
    anamnese: {
      queixa: "Cefaleia na gestacao",
      roteiro: [
        { bloco: "Gravidade", perguntasChave: ["Escotomas?", "Dor em HD?", "Dispneia ou oliguria?"] },
        { bloco: "Contexto", perguntasChave: ["Semanas gestacionais?", "HAS previa?", "Movimentos fetais?"] },
      ],
      redFlags: ["PA >= 160/110", "Sinais de HELLP", "Convulsao"],
    },
  },
  {
    id: "diarreia-aguda-pediatria",
    area: "Pediatria",
    subarea: "Gastroenterologia",
    tema: "Diarreia Aguda em Pediatria",
    dificuldade: "media",
    vinheta: "Lactente de 14 meses com 2 dias de diarreia aquosa, 6 episodios nas ultimas 24h, vomitos e sinais leves de desidratacao.",
    script: {
      enabling: "Crianca pequena, exposicao alimentar, creche e sazonalidade para gastroenterites virais.",
      fault: "Inflamacao infecciosa intestinal com perda hidroeletrolitica e risco de desidratacao.",
      consequences: "Fezes liquidas, vomitos, irritabilidade, diminuicao da diurese e sinais de desidratacao.",
      management: "Classificar desidratacao, reidratacao oral ou EV conforme gravidade, zinco e orientacao alimentar.",
    },
    diferenciais: [
      { dx: "Gastroenterite aguda viral", plausibilidade: "alta", pista: "Quadro agudo com diarreia aquosa e vomitos." },
      { dx: "Diarreia invasiva", plausibilidade: "media", pista: "Sangue, febre alta e toxemia." },
      { dx: "Intolerancia alimentar", plausibilidade: "baixa", pista: "Curso mais arrastado sem sindrome infecciosa." },
    ],
    workup: ["Avaliar sinais de desidratacao", "Glicemia se letargia", "Exames laboratoriais apenas se grave"],
    diagnosticoFinal: "Diarreia aguda com desidratacao leve",
    justificativa: "Historia aguda de perdas gastrointestinais com sinais clinicos de desidratacao sem toxemia.",
    sct: [
      { hipotese: "Desidratacao leve", novaInfo: "Crianca sem lagrimas, olhos fundos e enchimento capilar lento", efeitoPainel: +1, racional: "Aponta para desidratacao mais importante." },
      { hipotese: "Gastroenterite viral simples", novaInfo: "Fezes com sangue e febre alta persistente", efeitoPainel: -2, racional: "Sugere etiologia invasiva e muda a abordagem." },
    ],
    anamnese: {
      queixa: "Diarreia",
      roteiro: [
        { bloco: "Perdas", perguntasChave: ["Numero de evacuacoes?", "Vomitos associados?", "Aceita liquidos?"] },
        { bloco: "Gravidade", perguntasChave: ["Diurese reduziu?", "Febre?", "Sangue nas fezes?"] },
      ],
      redFlags: ["Letargia", "Sangue nas fezes", "Choque"],
    },
  },
  {
    id: "atencao-primaria-saude",
    area: "Preventiva",
    subarea: "APS",
    tema: "Atencao Primaria a Saude",
    dificuldade: "media",
    vinheta: "Mulher, 52 anos, hipertensa e diabetica, procura a UBS por piora do controle e dificuldade de acesso aos retornos.",
    script: {
      enabling: "Condicoes cronicas, vulnerabilidade social e necessidade de coordenacao longitudinal.",
      fault: "Fragmentacao do cuidado e baixa continuidade comprometem prevencao, controle e acesso.",
      consequences: "Descompensacoes evitaveis, perda de seguimento, uso inadequado da rede e pior experiencia do usuario.",
      management: "Reforcar atributos da APS: acesso, longitudinalidade, coordenacao do cuidado e plano compartilhado.",
    },
    diferenciais: [
      { dx: "Falha de coordenacao na APS", plausibilidade: "alta", pista: "Multimorbidade com seguimento irregular e necessidade de coordenacao." },
      { dx: "Baixa adesao isolada", plausibilidade: "media", pista: "Nao explica sozinha barreiras de acesso e fragmentacao." },
      { dx: "Evento agudo sem componente organizacional", plausibilidade: "baixa", pista: "Caso centrado em atributos da rede." },
    ],
    workup: ["Revisar plano terapeutico", "Mapear barreiras de acesso", "Checar vinculo com equipe de referencia"],
    diagnosticoFinal: "Necessidade de reordenacao do cuidado na APS",
    justificativa: "O caso pede leitura por atributos da APS e coordenacao do cuidado, nao apenas conduta biomedica isolada.",
    sct: [
      { hipotese: "APS bem coordenada", novaInfo: "Paciente sem equipe de referencia e sem retorno agendado", efeitoPainel: -2, racional: "Reduz fortemente a percepcao de coordenacao." },
      { hipotese: "APS resolutiva", novaInfo: "Plano compartilhado com enfermagem, medico e ACS, com seguimento definido", efeitoPainel: +2, racional: "Reforca longitudinalidade e coordenacao." },
    ],
    anamnese: {
      queixa: "Dificuldade de seguimento na UBS",
      roteiro: [
        { bloco: "Acesso", perguntasChave: ["Consegue marcar retorno?", "Tem ACS de referencia?", "Falta medicacao com frequencia?"] },
        { bloco: "Coordenacao", perguntasChave: ["Ja foi encaminhada?", "Houve contrarreferencia?", "Plano foi pactuado com a equipe?"] },
      ],
      redFlags: ["Perda completa de seguimento", "Complicacao aguda sem referencia", "Falta de acesso a medicacao essencial"],
    },
  },
];
