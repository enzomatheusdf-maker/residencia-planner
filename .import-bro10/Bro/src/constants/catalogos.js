// src/constants/catalogos.js
// Catálogos de tópicos navegáveis para Residência Médica (lendo MEDCOF) e Vestibular

import { MEDCOF } from "../core/fsrs";

export const CATALOGO_RES = MEDCOF;

// Schema de cada entrada: [nome, área, prioOrObj]
// prioOrObj pode ser:
//   string  → "Alta" | "Média" | "Baixa" | "Diamante"  (legado / tópico simples)
//   object  → { prio: "Alta", subs: ["Sub1", "Sub2", ...] }  (tópico com subtópicos)
//
// Cada subtópico em subs é uma unidade iniciável individualmente no ciclo D0→D21.

export const CATALOGO_VEST = [
  { b: 1, nome: "Matemática", t: [
    ["Conjuntos e Lógica", "Exatas", { prio: "Média", subs: [
      "Operações com conjuntos (união, interseção, diferença)",
      "Conjuntos numéricos (N, Z, Q, R)",
      "Lógica proposicional e tabela-verdade",
    ]}],
    ["Funções", "Exatas", { prio: "Alta", subs: [
      "Função afim (linear e constante)",
      "Função quadrática (parábola, vértice, zeros)",
      "Função modular",
      "Função exponencial",
      "Função logarítmica",
      "Função composta e inversa",
    ]}],
    ["Trigonometria", "Exatas", { prio: "Alta", subs: [
      "Razões trigonométricas no triângulo retângulo",
      "Ciclo trigonométrico e arcos",
      "Funções seno, cosseno e tangente",
      "Leis dos senos e cossenos",
      "Equações e inequações trigonométricas",
    ]}],
    ["Sequências: PA e PG", "Exatas", { prio: "Média", subs: [
      "Progressão Aritmética (PA): fórmulas e soma",
      "Progressão Geométrica (PG): fórmulas e soma",
      "Aplicações financeiras básicas",
    ]}],
    ["Matemática Financeira", "Exatas", { prio: "Média", subs: [
      "Juros simples",
      "Juros compostos",
      "Porcentagem e taxas",
      "Desconto e montante",
    ]}],
    ["Análise Combinatória", "Exatas", { prio: "Alta", subs: [
      "Princípio fundamental da contagem",
      "Permutação (simples e com repetição)",
      "Combinação",
      "Arranjo",
    ]}],
    ["Probabilidade", "Exatas", { prio: "Alta", subs: [
      "Espaço amostral e evento",
      "Probabilidade clássica",
      "Probabilidade condicional e independência",
      "Probabilidade de eventos compostos (adição/multiplicação)",
    ]}],
    ["Estatística", "Exatas", { prio: "Média", subs: [
      "Média, mediana e moda",
      "Amplitude e desvio-padrão",
      "Leitura de gráficos e tabelas",
      "Amostragem e pesquisa",
    ]}],
    ["Geometria Plana", "Exatas", { prio: "Alta", subs: [
      "Triângulos: área, congruência e semelhança",
      "Quadriláteros notáveis: área e perímetro",
      "Círculo: arco, setor, comprimento e área",
      "Polígonos regulares",
      "Relações métricas no triângulo retângulo",
    ]}],
    ["Geometria Espacial", "Exatas", { prio: "Média", subs: [
      "Prismas e cilindros: volume e área",
      "Pirâmides e cones: volume e área",
      "Esfera: volume e área",
      "Sólidos de revolução",
    ]}],
    ["Geometria Analítica", "Exatas", { prio: "Alta", subs: [
      "Pontos e distâncias no plano",
      "Reta: equação, coeficientes, posições relativas",
      "Circunferência: equação e posições relativas",
      "Cônicas: elipse, hipérbole, parábola",
    ]}],
    ["Matrizes, Determinantes e Sistemas", "Exatas", { prio: "Média", subs: [
      "Operações com matrizes",
      "Determinante (Sarrus, Laplace)",
      "Sistemas lineares (Cramer, escalonamento)",
      "Inversão de matrizes",
    ]}],
    ["Números Complexos e Polinômios", "Exatas", { prio: "Baixa", subs: [
      "Forma algébrica e trigonométrica",
      "Operações e módulo",
      "Raízes de polinômios (Teorema de Girard)",
      "Divisão de polinômios (Briot-Ruffini)",
    ]}],
  ]},

  { b: 2, nome: "Física", t: [
    ["Mecânica: Cinemática", "Exatas", { prio: "Alta", subs: [
      "MRU: gráficos e equações",
      "MRUV: equações de Torricelli e Bhaskara aplicada",
      "Queda livre e lançamento vertical",
      "Lançamento oblíquo e horizontal",
      "Movimento circular uniforme (MCU)",
    ]}],
    ["Mecânica: Dinâmica", "Exatas", { prio: "Alta", subs: [
      "1ª, 2ª e 3ª Leis de Newton",
      "Plano inclinado e forças de atrito",
      "Força centrípeta e centrífuga",
      "Gravitação Universal (Lei de Newton, Kepler)",
    ]}],
    ["Mecânica: Energia e Impulso", "Exatas", { prio: "Alta", subs: [
      "Trabalho e potência",
      "Energia cinética e teorema trabalho-energia",
      "Energia potencial gravitacional e elástica",
      "Conservação de energia mecânica",
      "Quantidade de movimento e impulso",
      "Colisões (elástica, inelástica, perfeitamente inelástica)",
    ]}],
    ["Mecânica: Estática e Hidrostática", "Exatas", { prio: "Média", subs: [
      "Equilíbrio de forças e torques",
      "Centro de gravidade",
      "Pressão e Princípio de Pascal",
      "Empuxo e Princípio de Arquimedes",
    ]}],
    ["Termologia", "Exatas", { prio: "Alta", subs: [
      "Temperatura, escalas termométricas e conversões",
      "Dilatação térmica (sólidos, líquidos, gases)",
      "Calorimetria: calor específico e capacidade térmica",
      "Mudanças de estado e calor latente",
      "Trocas de calor e equilíbrio térmico",
    ]}],
    ["Termodinâmica", "Exatas", { prio: "Alta", subs: [
      "Gases ideais: Lei de Boyle, Charles, Gay-Lussac",
      "Equação geral dos gases e Equação de Clapeyron",
      "Transformações termodinâmicas (isotérmica, isobárica, isocórica, adiabática)",
      "1ª Lei da Termodinâmica",
      "2ª Lei da Termodinâmica e Ciclo de Carnot",
    ]}],
    ["Óptica", "Exatas", { prio: "Média", subs: [
      "Reflexão da luz e espelhos planos/esféricos",
      "Refração: lei de Snell e índice de refração",
      "Lentes delgadas: equação de Gauss e vergência",
      "Dispersão e cores da luz",
      "Instrumentos ópticos e olho humano",
    ]}],
    ["Ondulatória", "Exatas", { prio: "Média", subs: [
      "Características das ondas: comprimento, frequência, velocidade",
      "Princípio de Huygens: reflexão, refração, difração",
      "Interferência e batimento",
      "Som: velocidade, intensidade, timbre",
      "Efeito Doppler",
    ]}],
    ["Eletrostática", "Exatas", { prio: "Alta", subs: [
      "Carga elétrica e processos de eletrização",
      "Lei de Coulomb",
      "Campo elétrico: ponto, fio e plano",
      "Potencial elétrico e energia potencial",
      "Capacitores: capacitância e energia armazenada",
    ]}],
    ["Eletrodinâmica", "Exatas", { prio: "Alta", subs: [
      "Corrente elétrica e resistência",
      "Lei de Ohm e resistividade",
      "Potência e efeito Joule",
      "Circuitos em série e paralelo (resistores)",
      "Geradores e receptores elétricos",
    ]}],
    ["Eletromagnetismo e Física Moderna", "Exatas", { prio: "Média", subs: [
      "Campo magnético e força magnética",
      "Lei de Ampère e solenóides",
      "Indução eletromagnética (Lei de Faraday-Lenz)",
      "Corrente alternada e transformadores",
      "Efeito fotoelétrico e dualidade onda-partícula",
      "Radioatividade: tipos de radiação e decaimento",
    ]}],
  ]},

  { b: 3, nome: "Química", t: [
    ["Atomística e Tabela Periódica", "Ciências da Natureza", { prio: "Alta", subs: [
      "Modelos atômicos (Dalton, Thomson, Rutherford, Bohr)",
      "Número atômico, massa e isótopos",
      "Configuração eletrônica (Aufbau, Hund, Pauli)",
      "Propriedades periódicas (raio, eletronegatividade, ionização)",
      "Classificação dos elementos na Tabela Periódica",
    ]}],
    ["Ligações Químicas e Geometria Molecular", "Ciências da Natureza", { prio: "Alta", subs: [
      "Ligação iônica: formação e propriedades",
      "Ligação covalente: simples, dupla, tripla e dativa",
      "Geometria molecular (VSEPR): linear, angular, piramidal, tetraédrica",
      "Ligação metálica e propriedades dos metais",
      "Forças intermoleculares (van der Waals, dipolo-dipolo, ligação de H)",
    ]}],
    ["Funções Inorgânicas e Reações", "Ciências da Natureza", { prio: "Alta", subs: [
      "Ácidos: nomenclatura, ionização e força",
      "Bases: nomenclatura, dissociação e força",
      "Sais: formação e nomenclatura",
      "Óxidos: classificação e propriedades",
      "Reações de síntese, análise, dupla troca e deslocamento",
      "Reações de oxirredução (identificar oxidante e redutor)",
    ]}],
    ["Estequiometria", "Ciências da Natureza", { prio: "Alta", subs: [
      "Cálculo de mol e massa molar",
      "Relações estequiométricas em reações",
      "Reagente limitante e excesso",
      "Rendimento de reação",
      "Volume molar de gases (CNTP e STP)",
    ]}],
    ["Soluções", "Ciências da Natureza", { prio: "Média", subs: [
      "Tipos de soluções e solubilidade",
      "Concentração comum (g/L) e molar (mol/L)",
      "Diluição e mistura de soluções",
      "Propriedades coligativas: crioscopia, ebuliscopia, tonoscopia, osmose",
    ]}],
    ["Termoquímica e Cinética", "Ciências da Natureza", { prio: "Média", subs: [
      "Entalpia: exotérmico vs endotérmico",
      "Lei de Hess e diagrama de entalpia",
      "Energia de ligação",
      "Fatores que afetam a velocidade (concentração, T, catalisador)",
      "Teoria das colisões e energia de ativação",
    ]}],
    ["Equilíbrio Químico", "Ciências da Natureza", { prio: "Alta", subs: [
      "Constante de equilíbrio (Kc, Kp)",
      "Princípio de Le Chatelier",
      "Equilíbrio iônico: Ka, Kb, Kw",
      "pH e pOH: cálculo e escala",
      "Produto de solubilidade (Ks) e precipitação",
    ]}],
    ["Eletroquímica", "Ciências da Natureza", { prio: "Média", subs: [
      "Pilhas: funcionamento e potencial",
      "Eletrólise: eletrólise ígnea e aquosa",
      "Lei de Faraday (eletrólise quantitativa)",
      "Corrosão e proteção catódica",
    ]}],
    ["Química Orgânica: Funções e Nomenclatura", "Ciências da Natureza", { prio: "Alta", subs: [
      "Hidrocarbonetos: alcanos, alcenos, alcinos, aromáticos",
      "Funções oxigenadas: álcoois, aldeídos, cetonas, ácidos, ésteres, éteres",
      "Funções nitrogenadas: aminas, amidas, aminoácidos",
      "Isomeria plana (cadeia, posição, função, compensação, tautomeria)",
      "Isomeria espacial: geométrica (cis-trans) e óptica",
    ]}],
    ["Reações Orgânicas e Radioatividade", "Ciências da Natureza", { prio: "Média", subs: [
      "Adição, substituição, eliminação, oxidação",
      "Fermentação, saponificação e condensação",
      "Polímeros: adição e condensação",
      "Radioatividade: partículas α, β, γ e decaimento",
      "Fissão, fusão e aplicações da radioatividade",
    ]}],
  ]},

  { b: 4, nome: "Biologia", t: [
    ["Citologia", "Ciências da Natureza", { prio: "Alta", subs: [
      "Célula procariótica vs eucariótica",
      "Organelas celulares e suas funções",
      "Membrana plasmática: estrutura e transporte",
      "Divisão celular: mitose e meiose",
      "Ciclo celular e controle",
    ]}],
    ["Bioquímica e Metabolismo", "Ciências da Natureza", { prio: "Média", subs: [
      "Carboidratos, lipídios, proteínas e ácidos nucleicos",
      "Enzimas: ação e fatores de influência",
      "Respiração celular aeróbia (glicólise, Krebs, cadeia)",
      "Fermentação (láctica e alcoólica)",
      "Fotossíntese: fase luminosa e ciclo de Calvin",
    ]}],
    ["Genética Mendeliana", "Ciências da Natureza", { prio: "Alta", subs: [
      "1ª Lei de Mendel (dominância e segregação)",
      "2ª Lei de Mendel (segregação independente)",
      "Dominância incompleta e codominância",
      "Alelos múltiplos (ex: sistema ABO)",
      "Epistasia e herança quantitativa",
    ]}],
    ["Genética Cromossômica e Biotecnologia", "Ciências da Natureza", { prio: "Alta", subs: [
      "Herança ligada ao sexo (daltionismo, hemofilia)",
      "Mapa cromossômico e ligação gênica",
      "Síndrome de Down e outras aneuploidias",
      "DNA: estrutura, replicação e síntese proteica",
      "Engenharia genética, PCR, clonagem e transgênicos",
    ]}],
    ["Evolução", "Ciências da Natureza", { prio: "Alta", subs: [
      "Lamarckismo vs Darwinismo",
      "Neodarwinismo: seleção natural e adaptação",
      "Especiação: isolamento reprodutivo e geográfico",
      "Deriva genética e fundadores",
      "Evidências da evolução (fósseis, homologia, filogenia)",
    ]}],
    ["Ecologia", "Ciências da Natureza", { prio: "Alta", subs: [
      "Níveis de organização ecológica",
      "Cadeia e teia alimentar; fluxo de energia",
      "Ciclos biogeoquímicos (C, N, P, H₂O)",
      "Relações ecológicas (predação, parasitismo, comensalismo, mutualismo)",
      "Biomas brasileiros e biomas mundiais",
      "Sucessão ecológica e clímax",
      "Impactos ambientais e sustentabilidade",
    ]}],
    ["Botânica", "Ciências da Natureza", { prio: "Média", subs: [
      "Classificação dos vegetais (algas → angiospermas)",
      "Morfologia das angiospermas (raiz, caule, folha, flor, fruto)",
      "Transporte de seiva (xilema e floema)",
      "Reprodução sexuada e assexuada",
      "Hormônios vegetais e tropismos",
    ]}],
    ["Zoologia", "Ciências da Natureza", { prio: "Média", subs: [
      "Invertebrados: Poríferos → Equinodermos",
      "Vertebrados: Peixes, Anfíbios, Répteis, Aves, Mamíferos",
      "Critérios de classificação animal",
      "Embriologia: segmentação, gastrulação, folhetos germinativos",
    ]}],
    ["Fisiologia Humana", "Ciências da Natureza", { prio: "Alta", subs: [
      "Sistema digestório: enzimas e absorção",
      "Sistema circulatório: coração, vasos e ciclo cardíaco",
      "Sistema respiratório: ventilação e trocas gasosas",
      "Sistema excretor: rim e formação da urina",
      "Sistema nervoso: neurônio, sinapses e SNC/SNP",
      "Sistema endócrino: hormônios e glândulas",
      "Sistema imunológico: imunidade inata e adaptativa",
      "Sistema reprodutor e embriologia humana",
    ]}],
    ["Microbiologia e Imunologia", "Ciências da Natureza", { prio: "Média", subs: [
      "Vírus: estrutura, replicação e doenças virais",
      "Bactérias: estrutura e doenças bacterianas",
      "Protistas e fungos: características e doenças",
      "Vacinas, soros e anticorpos",
      "Doenças e saúde pública (dengue, COVID, tuberculose)",
    ]}],
  ]},

  { b: 5, nome: "História", t: [
    ["Brasil Pré-Colonial e Colônia", "Humanas", { prio: "Alta", subs: [
      "Povos indígenas pré-colombianos",
      "Grandes Navegações e chegada ao Brasil",
      "Escravidão africana e resistência (quilombos)",
      "Economia colonial: açúcar, ouro e pecuária",
      "Invasões e conflitos coloniais (holandeses, jesuítas)",
      "Inconfidência Mineira e Conjuração Baiana",
    ]}],
    ["Brasil Império", "Humanas", { prio: "Alta", subs: [
      "Vinda da família real e período joanino",
      "Independência do Brasil (1822)",
      "Primeiro Reinado: Constituição de 1824",
      "Período Regencial: revoltas (Cabanagem, Balaiada, Farroupilha)",
      "Segundo Reinado: economia cafeeira e abolicionismo",
      "Lei Áurea (1888) e contexto da abolição",
    ]}],
    ["Primeira República (1889–1930)", "Humanas", { prio: "Alta", subs: [
      "Proclamação da República e constituição de 1891",
      "Política do café-com-leite e oligarquias",
      "Contestados, Canudos e Revolta da Vacina",
      "Tenentismo e Semana de Arte Moderna (1922)",
      "Crise de 1929 e fim da República Velha",
    ]}],
    ["Era Vargas (1930–1945 e 1950–1954)", "Humanas", { prio: "Alta", subs: [
      "Revolução de 1930 e Governo Provisório",
      "Constituição de 1934 e Constituição de 1937",
      "Estado Novo: autoritarismo, trabalhismo, industrialização",
      "Brasil na 2ª Guerra Mundial (FEB)",
      "2º Governo Vargas e suicídio (1954)",
    ]}],
    ["Brasil de JK à Ditadura e Redemocratização", "Humanas", { prio: "Alta", subs: [
      "Governo JK: Brasília e desenvolvimentismo",
      "Renúncia de Jânio e João Goulart (reformas de base)",
      "Golpe de 1964 e Regime Militar (AI-5)",
      "Resistência à ditadura: guerrilha e cultura",
      "Abertura política (Geisel, Figueiredo) e Diretas Já",
      "Constituição de 1988 e redemocratização",
    ]}],
    ["Antiguidade e Idade Média", "Humanas", { prio: "Média", subs: [
      "Mesopotâmia, Egito e Pérsia",
      "Grécia: polis, democracia ateniense e cultura",
      "Roma: República, Império e queda",
      "Feudalismo: estrutura e crise do século XIV",
      "Cruzadas e expansão islâmica",
      "Bizâncio e Renascimento Cultural",
    ]}],
    ["Idade Moderna e Contemporânea (Mundo)", "Humanas", { prio: "Alta", subs: [
      "Absolutismo e Mercantilismo",
      "Reformas Protestantes (Lutero, Calvino)",
      "Iluminismo e Revolução Científica",
      "Revoluções Burguesas (Inglesa, Francesa, Americana)",
      "Revolução Industrial e imperialismo do século XIX",
      "1ª e 2ª Guerras Mundiais",
      "Guerra Fria: bipolarização e conflitos",
      "Descolonização da África e Ásia",
      "Nova Ordem Mundial e globalização (pós-1989)",
    ]}],
  ]},

  { b: 6, nome: "Geografia", t: [
    ["Cartografia e Orientação", "Humanas", { prio: "Média", subs: [
      "Coordenadas geográficas (latitude e longitude)",
      "Fusos horários e horário oficial",
      "Escalas e projeções cartográficas",
      "Sensoriamento remoto e GPS",
    ]}],
    ["Geologia, Relevo e Solos", "Humanas", { prio: "Média", subs: [
      "Estrutura interna da Terra e tectônica de placas",
      "Tipos de rochas e intemperismo",
      "Relevos do Brasil e do mundo",
      "Solos: tipos, erosão e conservação",
    ]}],
    ["Climatologia e Hidrografia", "Humanas", { prio: "Alta", subs: [
      "Fatores e elementos do clima",
      "Tipos climáticos no Brasil e no mundo",
      "Aquecimento global e efeito estufa",
      "Bacias hidrográficas do Brasil",
      "Recursos hídricos e conflitos pela água",
    ]}],
    ["Vegetação e Domínios Morfoclimáticos", "Humanas", { prio: "Média", subs: [
      "Biomas brasileiros: Amazônia, Cerrado, Mata Atlântica, Caatinga, Pampa, Pantanal",
      "Biomas mundiais: floresta tropical, taiga, tundra, deserto",
      "Desmatamento e recuperação ambiental",
    ]}],
    ["Geografia Agrária e Indústria", "Humanas", { prio: "Média", subs: [
      "Estrutura fundiária brasileira (latifúndio, MST)",
      "Revolução Verde e agronegócio",
      "Industrialização brasileira e desconcentração industrial",
      "Globalização produtiva e cadeias globais de valor",
    ]}],
    ["Urbanização e População", "Humanas", { prio: "Alta", subs: [
      "Urbanização brasileira e metrópoles",
      "Problemas urbanos (segregação, violência, mobilidade)",
      "Teorias demográficas e transição demográfica",
      "Migrações internas e internacionais",
      "IDH, pobreza e desigualdade",
    ]}],
    ["Geopolítica e Questões Ambientais", "Humanas", { prio: "Alta", subs: [
      "Blocos econômicos (Mercosul, UE, NAFTA)",
      "Conflitos geopolíticos contemporâneos",
      "BRICS e países emergentes",
      "Questões ambientais: desertificação, chuva ácida, camada de ozônio",
      "Conferências ambientais (Estocolmo, Rio 92, Kyoto, Paris)",
    ]}],
  ]},

  { b: 7, nome: "Filosofia", t: [
    ["Filosofia Antiga", "Humanas", { prio: "Média", subs: [
      "Pré-socráticos: arché e cosmologia",
      "Sócrates: método maiêutico e ética",
      "Platão: teoria das Ideias e República",
      "Aristóteles: lógica, ética e política",
      "Epicurismo, Estoicismo e Ceticismo",
    ]}],
    ["Filosofia Medieval e Moderna", "Humanas", { prio: "Alta", subs: [
      "Agostinho e Tomás de Aquino (fé e razão)",
      "Racionalismo: Descartes, Espinosa, Leibniz",
      "Empirismo: Locke, Berkeley, Hume",
      "Iluminismo e Enciclopédia",
      "Kant: crítica da razão e imperativo categórico",
    ]}],
    ["Filosofia Contemporânea", "Humanas", { prio: "Alta", subs: [
      "Hegel: dialética e história",
      "Marx: materialismo histórico e alienação",
      "Nietzsche: niilismo e vontade de potência",
      "Existencialismo (Sartre, Heidegger)",
      "Filosofia analítica e filosofia da linguagem",
    ]}],
    ["Ética e Política", "Humanas", { prio: "Alta", subs: [
      "Ética das virtudes (Aristóteles)",
      "Ética deontológica (Kant)",
      "Utilitarismo (Bentham, Mill)",
      "Contratualismo (Hobbes, Locke, Rousseau, Rawls)",
      "Direitos humanos e cidadania",
    ]}],
  ]},

  { b: 8, nome: "Sociologia", t: [
    ["Clássicos da Sociologia", "Humanas", { prio: "Alta", subs: [
      "Durkheim: fato social, solidariedade e anomia",
      "Weber: ação social, tipos de dominação e ética protestante",
      "Marx: luta de classes, mais-valia e ideologia",
      "Comparação entre os três clássicos",
    ]}],
    ["Cultura, Identidade e Indústria Cultural", "Humanas", { prio: "Média", subs: [
      "Cultura e etnocentrismo vs relativismo cultural",
      "Diversidade cultural e multiculturalismo",
      "Indústria cultural (Escola de Frankfurt)",
      "Meios de comunicação e sociedade",
    ]}],
    ["Trabalho e Globalização", "Humanas", { prio: "Alta", subs: [
      "Transformações do trabalho (taylorismo, fordismo, toyotismo)",
      "Desemprego estrutural e precarização",
      "Globalização: aspectos econômicos, culturais e políticos",
      "Neoliberalismo e críticas",
    ]}],
    ["Movimentos Sociais e Cidadania", "Humanas", { prio: "Alta", subs: [
      "Movimentos sociais clássicos e contemporâneos",
      "Movimentos de gênero, raça e LGBTQIA+",
      "Cidadania: civil, política e social",
      "Democracia, partidos e participação política",
    ]}],
  ]},

  { b: 9, nome: "Linguagens e Português", t: [
    ["Interpretação de Texto e Gêneros Textuais", "Linguagens", { prio: "Alta", subs: [
      "Estratégias de leitura e inferência",
      "Coesão e coerência textual",
      "Tipologia textual: narração, descrição, dissertação",
      "Gêneros textuais: artigo, crônica, notícia, conto",
      "Funções da linguagem (Jakobson)",
    ]}],
    ["Gramática: Morfologia", "Linguagens", { prio: "Média", subs: [
      "Classes de palavras: substantivo, adjetivo, pronome",
      "Verbos: conjugação, tempos e modos",
      "Advérbios, preposições, conjunções",
      "Formação de palavras (derivação e composição)",
      "Fonologia: sílabas, acento e ortografia",
    ]}],
    ["Gramática: Sintaxe", "Linguagens", { prio: "Alta", subs: [
      "Sujeito e predicado (análise do período simples)",
      "Complemento verbal (objeto direto e indireto)",
      "Adjuntos, apostos e vocativos",
      "Período composto por coordenação",
      "Período composto por subordinação (nominal, adverbial, adjetiva)",
      "Regência verbal e nominal",
      "Concordância verbal e nominal",
      "Crase",
    ]}],
    ["Semântica e Variação Linguística", "Linguagens", { prio: "Alta", subs: [
      "Sinonímia, antonímia, polissemia e homonímia",
      "Figuras de linguagem (metáfora, metonímia, ironia, eufemismo...)",
      "Variação linguística: regional, social, histórica, estilística",
      "Norma culta e preconceito linguístico",
      "Pontuação: vírgula, ponto e vírgula, dois pontos",
    ]}],
    ["Literatura: Do Trovadorismo ao Realismo", "Linguagens", { prio: "Alta", subs: [
      "Trovadorismo e Humanismo",
      "Classicismo: Camões",
      "Barroco: Gregório de Matos, Padre Vieira",
      "Arcadismo: Tomás Antônio Gonzaga",
      "Romantismo brasileiro: gerações e características",
      "Realismo e Naturalismo: Machado de Assis, Aluísio Azevedo",
      "Parnasianismo e Simbolismo",
    ]}],
    ["Literatura: Modernismo e Contemporâneo", "Linguagens", { prio: "Alta", subs: [
      "Pré-Modernismo: Euclides da Cunha, Lima Barreto",
      "Semana de Arte Moderna de 1922",
      "Modernismo 1ª fase: Mário e Oswald de Andrade",
      "Modernismo 2ª fase: Drummond, Guimarães Rosa, Clarice Lispector",
      "Modernismo 3ª fase: Drummond, João Cabral",
      "Literatura contemporânea e pós-modernismo",
    ]}],
    ["Língua Estrangeira: Inglês", "Linguagens", { prio: "Média", subs: [
      "Estratégias de leitura em inglês (skimming, scanning)",
      "Falsos cognatos mais cobrados",
      "Tempos verbais (present, past, future, conditionals)",
      "Vocabulário por tema (tecnologia, saúde, meio ambiente)",
    ]}],
    ["Língua Estrangeira: Espanhol", "Linguagens", { prio: "Baixa", subs: [
      "Estratégias de leitura em espanhol",
      "Falsos amigos (embarazada, borracha...)",
      "Ser vs Estar e principais irregulares",
      "Vocabulário cotidiano e temático",
    ]}],
  ]},

  { b: 10, nome: "Redação", t: [
    ["Estrutura Dissertativo-Argumentativa", "Redação", { prio: "Diamante", subs: [
      "Introdução e Tese",
      "Desenvolvimento (D1 e D2)",
      "Conclusão e Proposta de Intervenção",
    ]}],
    ["Repertório Sociocultural", "Redação", { prio: "Alta", subs: [
      "Alusões históricas e filosóficas",
      "Dados estatísticos e notícias",
      "Referências de cultura pop, filmes e livros",
    ]}],
    ["Proposta de Intervenção (Competência 5)", "Redação", { prio: "Diamante", subs: [
      "Agente e Ação",
      "Meio/Modo e Efeito",
      "Detalhamento de um dos elementos",
    ]}],
    ["Coesão e Coerência (Competência 4)", "Redação", { prio: "Alta", subs: [
      "Conectivos interparágrafos",
      "Conectivos intraparágrafos",
      "Evitar repetições de palavras",
    ]}],
    ["Treino Cronometrado (texto completo)", "Redação", { prio: "Alta", subs: [
      "Redação modelo ENEM completa",
      "Redação modelo FUVEST/Vunesp",
      "Planejamento de texto em 15 minutos",
    ]}],
  ]},

  { b: 11, nome: "Artes", t: [
    ["Artes Visuais: Pré-História ao Renascimento", "Linguagens", { prio: "Média", subs: [
      "Arte rupestre e civilizações antigas (Egito, Grécia, Roma)",
      "Arte Medieval: mosaico e iluminura",
      "Renascimento: Leonardo, Michelangelo, Rafael",
      "Perspectiva e naturalismo renascentista",
    ]}],
    ["Artes Visuais: Barroco ao Modernismo", "Linguagens", { prio: "Média", subs: [
      "Barroco: Caravaggio e dramaticidade",
      "Neoclassicismo e Romantismo",
      "Impressionismo: Monet, Renoir",
      "Pós-impressionismo: Van Gogh, Cézanne, Gauguin",
    ]}],
    ["Vanguardas Europeias", "Linguagens", { prio: "Alta", subs: [
      "Expressionismo e Fauvismo",
      "Cubismo: Picasso e Braque",
      "Futurismo e Construtivismo",
      "Dadaísmo e Surrealismo: Dalí, Magritte",
      "Abstraccionismo",
    ]}],
    ["Arte Brasileira", "Linguagens", { prio: "Alta", subs: [
      "Arte colonial: Barroco mineiro e Aleijadinho",
      "Missão Artística Francesa e Academia Imperial",
      "Semana de Arte Moderna de 1922: Di Cavalcanti, Anita Malfatti",
      "Tarsila do Amaral: Pau-Brasil e Antropofagia",
      "Arte concreta e neoconcreta brasileira",
      "Arte contemporânea brasileira",
    ]}],
    ["Música: Elementos e História", "Linguagens", { prio: "Baixa", subs: [
      "Elementos musicais: ritmo, melodia, harmonia, timbre",
      "Música clássica: Bach, Mozart, Beethoven",
      "Música popular do século XX: jazz, blues, rock",
    ]}],
    ["Música Brasileira", "Linguagens", { prio: "Média", subs: [
      "Choro e Samba: origens e características",
      "Bossa Nova: João Gilberto, Tom Jobim",
      "MPB e Tropicália: Caetano, Gil, Chico Buarque",
      "Baião, Forró e Funk: música regional e popular",
    ]}],
    ["Artes Cênicas e Cinema", "Linguagens", { prio: "Baixa", subs: [
      "Teatro Grego: tragédia e comédia",
      "Teatro moderno: Stanislavski, Brecht",
      "Teatro brasileiro: Arena e Oficina",
      "Cinema: linguagem audiovisual e Cinema Novo",
    ]}],
  ]},
];

// Helper: extrair prio e subs de uma entrada do catálogo
export function parseCatalogEntry(item) {
  const [nome, esp, prioOrObj] = item;
  const prio = typeof prioOrObj === "string" ? prioOrObj : (prioOrObj?.prio || "Média");
  const subs = typeof prioOrObj === "object" && Array.isArray(prioOrObj?.subs) ? prioOrObj.subs : [];
  return { nome, esp, prio, subs };
}

export function getSubtopics(plat, esp) {
  if (plat !== "vest") {
    const list = [];
    CATALOGO_RES.forEach(block => {
      block.t.forEach(topic => {
        const [nome, topicEsp] = topic;
        if (topicEsp === esp) list.push(nome);
      });
    });
    return Array.from(new Set(list));
  }
  const match = CATALOGO_VEST.find(x => x.nome === esp);
  if (!match) return [];
  const subs = [];
  match.t.forEach(topic => {
    const { subs: topicSubs } = parseCatalogEntry(topic);
    if (topicSubs && topicSubs.length > 0) {
      subs.push(...topicSubs);
    }
  });
  return Array.from(new Set(subs));
}
