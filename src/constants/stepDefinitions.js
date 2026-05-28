// src/constants/stepDefinitions.js
export const STEP_DEFINITIONS = [
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
    instruction: `1. Vá ao MedEvo, pesquise o tema, resolva 15-20 questões\n2. Corrija TUDO de uma vez (não questão a questão)\n3. Para cada ERRO, categorize:\n   - Fato atômico? → Vai ficar um card Anki (em breve)\n   - Raciocínio? → Refaça este step inteiro (volte ao esqueleto)\n   - Distração/leitura? → Refaz o step anterior\n4. Anote a % de acerto (ex: 14/20 = 70%)`,
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