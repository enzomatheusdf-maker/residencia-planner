// src/constants/stepDefinitions.js

export const STEP_DEFINITIONS_RES = [
  {
    id: 'pretest',
    title: 'Pré-teste',
    description: 'Responda 5 questões antes da leitura',
    instruction: `Vá ao MedEvo. Pesquise o tema. Resolva 5 questões sem estudo. \nMarque as respostas (certo/errado). Objetivo: criar ganchos cognitivos.`,
    justification: `O pré-teste força recuperação antes da consolidação. \nMesmo errando, o cérebro marca os pontos-chave que vão aparecer na leitura. \nEfeito de teste antes (pré-teste) = d=0.73 vs teste depois = d=0.35.\n[Fonte: Roediger & Karpicke 2006, Journal of Experimental Psychology]`,
    duration: 10,
    icon: '📝'
  },
  {
    id: 'leitura',
    title: 'Leitura Ativa em Blocos',
    description: 'Leia 8-12 páginas com mini brain dump entre blocos',
    instruction: `Para cada bloco de 8-12 páginas:\n1. Escreva a pergunta-missão (o que quero aprender neste bloco?)\n2. Leia o bloco inteiro\n3. Feche o material\n4. Escreva mini brain dump (2-3 linhas, o que lembrou?)\n5. Abra o material e sublinha SÓ o que esqueceu\n6. Próximo bloco`,
    justification: `Free recall entre blocos força consolidação por recuperação ativa. \nVocê não decora, você recupera. Reduz esquecimento de 50% vs leitura passiva.\nO micro brain dump entre blocos = testing effect distribuído.`,
    duration: 45,
    icon: '📖'
  },
  {
    id: 'esqueleto',
    title: 'Esqueleto Mental',
    description: 'Esboce a hierarquia do tema (material fechado)',
    instruction: `Com o material FECHADO, faça um diagrama mental ou outline:\n- Epidemiologia (quem/quando/onde)\n- Fisiopatologia (por quê)\n- Clínica (como aparece)\n- Diagnóstico (como confirmar)\n- Tratamento (como tratar)\n- Complicações (o que pode dar errado)\n\nNão precisa estar perfeito. É só pra saber se consegue estruturar o tema.`,
    justification: `Hierarquia reduz carga cognitiva e cria schema mental. \nQuando você volta para a prova, a estrutura já está lá, \nfacilitando recuperação em contextos novos (transfer).`,
    duration: 10,
    icon: '🧠'
  },
  {
    id: 'braindump',
    title: 'Brain Dump Final D0',
    description: 'Escreva o tema inteiro de memória (3 minutos)',
    instruction: `Cronômetro 3 minutos. Material FECHADO. \nEscreva TUDO que lembrar sobre o tema — não é pra ser perfeito, é pra ser esforço. \nDepois compare com o material e note o que faltou.`,
    justification: `Free recall no D0 força consolidação profunda. \nEfeito de teste livre = d=0.74 de efeito de aprendizado vs pré-teste isolado. \nVocê não só aprende, como descobre o que NÃO aprendeu (metacognição).`,
    duration: 3,
    icon: '🎯'
  },
  {
    id: 'questoes',
    title: 'Questões MedEvo',
    description: 'Resolva 15-20 questões e categorize os erros',
    instruction: `1. Vá ao MedEvo, pesquise o tema, resolva 15-20 questões\n2. Corrija TUDO de uma vez (não questão a questão)\n3. Para cada ERRO, categorize:\n   - Fato atômico? → Vai ficar um card Anki\n   - Raciocínio? → Refaça o esqueleto\n   - Distração/leitura? → Refaz o passo anterior\n4. Registre os acertos e o total`,
    justification: `Prática distribuída com feedback imediato aumenta transferência. \nA categorização força metacognição — você aprende a aprender, \nnão só memoriza conteúdo (aprendizagem profunda).`,
    duration: 25,
    icon: '✍️'
  },
  {
    id: 'anki',
    title: 'Flashcards Anki',
    description: 'Crie cards SÓ dos fatos atômicos que erraram',
    instruction: `No Anki, crie 1 card por fato que ERROU. Formato:\n\nFRENTE: contexto clínico mínimo + pergunta com cloze {{c1::resposta}}\nVERSO: resposta curta (1-2 linhas) + contexto adicional + fonte\n\nExemplo:\n  FRENTE: Apendicite com abscesso >4cm: {{c1::drenagem percutânea + ATB}}\n  VERSO: Intervalar 6-8 semanas. Peritonite geral → cirurgia imediata.\n\n⚠️ REGRAS:\n- 1 card = 1 fato = 1 resposta (atômico)\n- Prefira cloze a básico\n- Nunca listas >4 itens\n- Sempre âncora clínica`,
    justification: `Cards atômicos de 1 fato têm custo-benefício melhor. \nEvita ilusão de domínio e pensamento dependente de domínio. \nVocê revisa cards menores, mais rápido, com melhor retention.`,
    duration: 10,
    icon: '🔤'
  }
];

export const STEP_DEFINITIONS_VEST_EXATAS = [
  {
    id: 'pretest',
    title: 'Pré-teste',
    description: 'Resolva 3–5 questões antes de estudar',
    instruction: `Vá ao seu banco de questões. Pesquise o tópico. Resolva 3–5 questões SEM ter estudado ainda.\nMarque o que acertou/errou. Objetivo: criar ganchos cognitivos e revelar lacunas antes da leitura.`,
    justification: `O pré-teste força recuperação antes da consolidação.\nMesmo errando, o cérebro marca os pontos-chave que vão aparecer no estudo.\nPretesting effect: d=0.73 vs estudo direto d=0.35. [Roediger & Karpicke 2006]`,
    duration: 10,
    icon: '📝'
  },
  {
    id: 'leitura',
    title: 'Resolução Guiada',
    description: 'Ver conceito → resolver exemplo sozinho → comparar',
    instruction: `Para cada conceito do tópico:\n1. Leia a teoria/fórmula uma vez\n2. Feche o material\n3. Tente resolver o exemplo sozinho\n4. Abra e compare — anote onde divergiu\n5. Próximo conceito\n\nFoco: entender o PORQUÊ de cada passo, não só o resultado.`,
    justification: `Resolução guiada (worked example → fade) supera leitura passiva em exatas.\nO contraste entre sua tentativa e o gabarito cria aprendizado por erro produtivo.\n[Sweller 1988, Cognitive Load Theory]`,
    duration: 45,
    icon: '📖'
  },
  {
    id: 'esqueleto',
    title: 'Mapa do Tópico',
    description: 'Material fechado: fórmulas, quando aplicar, pegadinhas',
    instruction: `Com o material FECHADO, monte o esqueleto do tópico:\n- Fórmulas-chave (e o que cada variável significa)\n- Quando aplicar cada fórmula (condição/contexto)\n- Pegadinhas comuns em prova\n- Unidades e conversões críticas\n- Conexões com outros tópicos`,
    justification: `Esquemas mentais reduzem carga cognitiva e aceleram recuperação em prova.\nQuando a estrutura já está organizada, o raciocínio flui mais rápido sob pressão.\n[Schema Theory, Piaget / Ausubel]`,
    duration: 10,
    icon: '🧠'
  },
  {
    id: 'braindump',
    title: 'Brain Dump Final',
    description: 'Escreva tudo de memória (3 min)',
    instruction: `Cronômetro 3 minutos. Material FECHADO.\nEscreva de cabeça:\n- Todas as fórmulas que lembra\n- Os passos de resolução do problema-tipo\n- As pegadinhas e condições de aplicação\n\nDepois compare com o esqueleto e note o que faltou.`,
    justification: `Free recall no final do D0 fixa a estrutura antes da primeira revisão.\nd=0.74 de efeito de aprendizado. Você descobre o que NÃO aprendeu (metacognição).`,
    duration: 3,
    icon: '🎯'
  },
  {
    id: 'questoes',
    title: 'Bateria de Questões',
    description: 'Resolva 15–20 questões e categorize os erros',
    instruction: `1. Vá ao seu banco de questões, pesquise o tópico, resolva 15–20 questões\n2. Corrija tudo de uma vez\n3. Para cada ERRO, categorize:\n   - Fórmula errada? → Reveja o esqueleto\n   - Aplicou a fórmula certa no contexto errado? → Reveja "quando aplicar"\n   - Erro de conta / unidade? → Descuido\n   - Conteúdo nunca visto? → Marque para novo D0\n4. Registre os acertos e o total`,
    justification: `Prática distribuída com feedback imediato aumenta transferência.\nCategorizar o erro força metacognição — você aprende a aprender, não só executa.`,
    duration: 25,
    icon: '✍️'
  },
  {
    id: 'anki',
    title: 'Flashcards de Fórmulas',
    description: 'Crie cards das fórmulas e conceitos que errou',
    instruction: `No Anki (ou caderno), crie 1 card por fórmula/conceito que ERROU:\n\nFRENTE: contexto do problema + lacuna {{c1::resposta}}\nVERSO: fórmula completa + quando usar + exemplo numérico rápido\n\nExemplos:\n  FRENTE: MRU com v=10 m/s e t=5s: d = {{c1::50 m}}\n  FRENTE: Energia cinética: Ec = {{c1::½mv²}}\n\n⚠️ 1 card = 1 fato. Nunca listas longas.`,
    justification: `Cards atômicos de fórmulas têm custo-benefício maior do que reler a teoria.\nRevisão espaçada de fórmulas = base do desempenho em exatas.`,
    duration: 10,
    icon: '🔤'
  }
];

export const STEP_DEFINITIONS_VEST_HUMANAS = [
  {
    id: 'pretest',
    title: 'Pré-teste',
    description: 'Resolva 3–5 questões antes de estudar',
    instruction: `Vá ao seu banco de questões. Pesquise o tópico. Resolva 3–5 questões SEM ter estudado ainda.\nSão questões de interpretação/análise — ativar conhecimento prévio e criar perguntas que a leitura vai responder.`,
    justification: `Pré-teste cria "lacunas cognitivas" que o cérebro busca preencher durante a leitura.\nResulta em leitura mais ativa e retenção superior. [Roediger & Karpicke 2006]`,
    duration: 10,
    icon: '📝'
  },
  {
    id: 'leitura',
    title: 'Leitura com Pergunta-Missão',
    description: 'Leia com perguntas-guia e mini brain dump entre blocos',
    instruction: `Antes de ler, defina sua pergunta-missão: "O que quero entender neste tópico?"\n\nPara cada bloco (5–8 páginas ou 15 min de vídeo):\n1. Escreva a pergunta-missão do bloco\n2. Leia/assista o bloco\n3. Feche o material — escreva 2–3 linhas respondendo a pergunta\n4. Continue para o próximo bloco`,
    justification: `Pergunta-missão direciona atenção seletiva. Mini brain dump entre blocos é\ntesting effect distribuído: retém 50% mais que leitura passiva.`,
    duration: 50,
    icon: '📖'
  },
  {
    id: 'esqueleto',
    title: 'Mapa do Tópico',
    description: 'Material fechado: causas, processo, consequências',
    instruction: `Com o material FECHADO, monte a estrutura do tópico:\n- Contexto histórico / Causas (por que aconteceu?)\n- Processo / Como se desenvolveu\n- Consequências / Impactos\n- Conceitos-chave (termos, datas, personagens)\n- Conexões com atualidade / outros tópicos`,
    justification: `Estrutura causal (causa→processo→consequência) é o modelo mental\nque as questões de humanidades cobram. Treinar o esqueleto = treinar a resposta.`,
    duration: 10,
    icon: '🧠'
  },
  {
    id: 'braindump',
    title: 'Brain Dump Final',
    description: 'Escreva tudo de memória (3 min)',
    instruction: `Cronômetro 3 minutos. Material FECHADO.\nEscreva de cabeça:\n- Causas do evento/fenômeno\n- Como se desenvolveu\n- Consequências\n- Conceitos e nomes importantes\n\nDepois compare com o esqueleto e note o que faltou.`,
    justification: `Free recall final força consolidação profunda.\nVocê descobre exatamente o que ainda não está organizado na memória.`,
    duration: 3,
    icon: '🎯'
  },
  {
    id: 'questoes',
    title: 'Bateria de Questões',
    description: 'Resolva 15–20 questões e categorize os erros',
    instruction: `1. Vá ao seu banco de questões, pesquise o tópico, resolva 15–20 questões\n2. Corrija tudo de uma vez\n3. Para cada ERRO, categorize:\n   - Fato não memorizado? → Vai para flashcard\n   - Interpretou errado o enunciado? → Treino de leitura\n   - Confundiu conceitos? → Revisão do esqueleto\n   - Descuido? → Atenção na releitura\n4. Registre os acertos e o total`,
    justification: `Categorizar o erro em humanidades é crítico: a maioria dos erros\nnão é falta de conteúdo, é interpretação. Identificar isso muda o treino.`,
    duration: 25,
    icon: '✍️'
  },
  {
    id: 'anki',
    title: 'Resumo-Relâmpago',
    description: 'Síntese de 5 linhas + flashcards de fatos atômicos',
    instruction: `Escreva um resumo de 5 linhas do tópico (datas, conceitos, nomes críticos).\n\nPara CADA fato atômico que errou, crie um card:\nFRENTE: pergunta direta sobre o fato\nVERSO: resposta curta + contexto\n\nExemplos:\n  FRENTE: Ano da Proclamação da República no Brasil\n  VERSO: 1889. Marechal Deodoro da Fonseca. Monarquia → República sem plebiscito.\n\n⚠️ 1 card = 1 fato. Evite listas longas.`,
    justification: `Em humanidades, flashcards são para fatos atômicos (datas, nomes, conceitos).\nO resumo-relâmpago fixa a estrutura; o Anki fixa os fatos pontuais.`,
    duration: 10,
    icon: '🔤'
  }
];

export const STEP_DEFINITIONS_VEST_REDACAO = [
  {
    id: 'leitura',
    title: 'Leitura do Tema',
    description: 'Analise o tema e colete repertório',
    instruction: `1. Leia o tema proposto e as coletâneas (se houver)\n2. Identifique a "polêmica central" (qual tensão o tema levanta?)\n3. Anote 3 repertórios (dados, fatos históricos, citações, obras) que conectam ao tema\n4. Defina seu ponto de vista / tese`,
    justification: `A leitura de coletânea ativa esquemas temáticos que facilitam a escrita.\nDefinir a tese antes de escrever elimina a redação sem coerência.`,
    duration: 15,
    icon: '📖'
  },
  {
    id: 'esqueleto',
    title: 'Planejamento da Redação',
    description: 'Monte o esqueleto: tese, argumentos, proposta',
    instruction: `Com base na análise, monte o esqueleto:\n- INTRODUÇÃO: Contextualização + Tese (1 parágrafo)\n- DESENVOLVIMENTO 1: Argumento 1 + repertório + desenvolvimento\n- DESENVOLVIMENTO 2: Argumento 2 + repertório + desenvolvimento\n- CONCLUSÃO: Proposta de intervenção (quem faz, como, com qual finalidade)\n\nEsboce em tópicos antes de escrever.`,
    justification: `Planejar antes de escrever reduz drasticamente reescritas e aumenta coerência.\nO ENEM penaliza redações sem estrutura clara.`,
    duration: 10,
    icon: '🧠'
  },
  {
    id: 'braindump',
    title: 'Escrita da Redação',
    description: 'Escreva o texto completo',
    instruction: `Escreva a redação completa seguindo o esqueleto.\nMeta: 25–30 linhas (ENEM), linguagem formal, sem uso de "eu".\n\nFique atento:\n- Conectivos coesivos entre parágrafos\n- Proposta de intervenção com os 5 agentes (Comp. 5 ENEM)\n- Evite repetições lexicais`,
    justification: `A prática de escrita com esqueleto definido é o treino mais eficaz\npara desenvolver fluência e estrutura argumentativa.`,
    duration: 40,
    icon: '🎯'
  },
  {
    id: 'questoes',
    title: 'Autoavaliação pelas 5 Competências',
    description: 'Avalie sua redação por competência',
    instruction: `Leia sua redação e avalie cada competência (1–200 pts cada):\n\n1. Norma culta (gramática, ortografia, pontuação)\n2. Compreensão do tema e gênero dissertativo-argumentativo\n3. Coerência, coesão e seleção de argumentos\n4. Recursos coesivos (conectivos, referências, progressão)\n5. Proposta de intervenção (agente, ação, efeito, finalidade, meio)\n\nAnote onde perdeu pontos e por quê.`,
    justification: `Autoavaliação estruturada por critério treina o mesmo olhar da banca\ne acelera a melhora porque você atua nos pontos certos.`,
    duration: 15,
    icon: '✍️'
  },
  {
    id: 'anki',
    title: 'Revisão e Registro',
    description: 'Corrija e registre repertórios para reutilizar',
    instruction: `1. Corrija os pontos que você avaliou como perdas\n2. Registre os repertórios usados (para reutilizar em temas similares)\n3. Anote uma frase que resumiu bem seu argumento — é um modelo reutilizável\n4. Avalie a nota estimada (soma das 5 competências × 2 = nota/1000)`,
    justification: `Repertório acumulado é um ativo de longo prazo na redação.\nCada texto bem revisado vira modelo para textos futuros.`,
    duration: 10,
    icon: '🔤'
  }
];

const VEST_EXATAS_ESPS = ["Exatas", "Ciências da Natureza", "Matemática", "Física", "Química", "Biologia"];

export function getStepDefinitions(plat, esp) {
  if (plat !== "vest") return STEP_DEFINITIONS_RES;
  if (esp === "Redação") return STEP_DEFINITIONS_VEST_REDACAO;
  if (VEST_EXATAS_ESPS.includes(esp)) return STEP_DEFINITIONS_VEST_EXATAS;
  return STEP_DEFINITIONS_VEST_HUMANAS;
}

export const BRAIN_DUMP_FIELDS = {
  res: [
    { k: "epidemiologia", label: "📍 Epidemiologia / Fatores de Risco", placeholder: "Quem é afetado? Grupos de risco, incidência..." },
    { k: "fisiopatologia", label: "🔬 Fisiopatologia / Mecanismo", placeholder: "O que causa a patologia? Anatomia, fisiologia..." },
    { k: "diagnostico", label: "🔍 Critérios Diagnósticos", placeholder: "Sinais clínicos, exames de triagem e confirmatórios..." },
    { k: "conduta", label: "💊 Conduta Inicial & Tratamento", placeholder: "Tratamento de suporte, medicamentos, cirurgia..." },
    { k: "complicacoes", label: "⚠️ Complicações / Padrões de Erro", placeholder: "Distratores de prova frequentes, falha terapêutica..." }
  ],
  vest_exatas: [
    { k: "formulas", label: "📐 Fórmulas-chave", placeholder: "Escreva todas as fórmulas que lembra..." },
    { k: "quando_aplicar", label: "🎯 Quando aplicar cada fórmula", placeholder: "Condições e contextos de uso..." },
    { k: "pegadinhas", label: "⚠️ Pegadinhas e armadilhas comuns", placeholder: "O que as provas costumam explorar..." },
    { k: "passos", label: "🔢 Passos de resolução do problema-tipo", placeholder: "Como você resolveria um problema padrão deste tópico..." },
    { k: "unidades", label: "📏 Unidades e conversões críticas", placeholder: "Quais conversões são necessárias..." }
  ],
  vest_humanas: [
    { k: "contexto", label: "🌍 Contexto e Causas", placeholder: "Por que aconteceu? Quais foram as causas..." },
    { k: "processo", label: "📅 Processo e Desenvolvimento", placeholder: "Como se desenvolveu? Principais eventos..." },
    { k: "consequencias", label: "💥 Consequências e Impactos", placeholder: "O que mudou depois? Impactos de curto e longo prazo..." },
    { k: "conceitos", label: "🔑 Conceitos e Nomes-Chave", placeholder: "Termos técnicos, personagens, datas importantes..." },
    { k: "conexoes", label: "🔗 Conexões com Atualidade", placeholder: "Como este tema se conecta ao presente..." }
  ],
  vest_redacao: [
    { k: "tese", label: "💡 Tese / Ponto de Vista", placeholder: "Qual é a sua posição sobre o tema..." },
    { k: "arg1", label: "1️⃣ Argumento 1 + Repertório", placeholder: "Primeiro argumento e evidência que o sustenta..." },
    { k: "arg2", label: "2️⃣ Argumento 2 + Repertório", placeholder: "Segundo argumento e evidência..." },
    { k: "proposta", label: "🛠️ Proposta de Intervenção", placeholder: "Quem faz, como faz, com qual finalidade, por qual meio..." }
  ]
};

export function getBrainDumpFields(plat, esp) {
  if (plat !== "vest") return BRAIN_DUMP_FIELDS.res;
  if (esp === "Redação") return BRAIN_DUMP_FIELDS.vest_redacao;
  if (VEST_EXATAS_ESPS.includes(esp)) return BRAIN_DUMP_FIELDS.vest_exatas;
  return BRAIN_DUMP_FIELDS.vest_humanas;
}

// Legacy export for any existing direct imports
export const STEP_DEFINITIONS = STEP_DEFINITIONS_RES;
