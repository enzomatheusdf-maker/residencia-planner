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

// ─── CATÁLOGO ESTRATÉGIA MED — Extensivo 50 Semanas ────────────────────────
// Importado de Cronograma_Estrategia_Extensivo_Completo.md
export const CATALOGO_ESTRATEGIA_MED = [
  {b:1,nome:"Semana 1",t:[["Hipertensão Arterial Sistêmica (Parte 1): Diagnóstico, Classificação, Avaliação","Cardiologia","Alta"],["Trauma - Avaliação Inicial, Vias Aéreas e Trauma Torácico","Cirurgia","Alta"],["Anatomia e Embriologia do Trato Genital Feminino","Ginecologia","Média"],["Modificações Fisiológicas da Gestação","Obstetrícia","Alta"],["Imunizações","Pediatria","Diamante"],["História do SUS","Preventiva","Alta"]]},
  {b:2,nome:"Semana 2",t:[["Trauma - Choque","Cirurgia","Alta"],["Introdução ao Diabetes Mellitus","Endocrino","Alta"],["Disfagia, Alterações Estruturais e Distúrbios da Motilidade do Esôfago","Gastro","Média"],["Ciclo Menstrual","Ginecologia","Alta"],["Antibióticos","Infectologia","Diamante"],["Aleitamento Materno","Pediatria","Diamante"]]},
  {b:3,nome:"Semana 3",t:[["Hipertensão Arterial Sistêmica (Parte 2): Tratamento","Cardiologia","Diamante"],["Trauma Abdominal e Pélvico","Cirurgia","Alta"],["Doença Renal Crônica (DRC) - Parte I","Nefrologia","Alta"],["Pré-Natal","Obstetrícia","Diamante"],["Crescimento","Pediatria","Alta"],["Princípios e Diretrizes do SUS","Preventiva","Diamante"]]},
  {b:4,nome:"Semana 4",t:[["Trauma Populações Especiais (Pediátrico, Gestante e Idosos)","Cirurgia","Média"],["Diabetes Mellitus Tipo 2","Endocrino","Diamante"],["Miomatose Uterina","Ginecologia","Alta"],["Tuberculose","Infectologia","Diamante"],["Anatomia, Fisiologia e Semiologia Neurológica","Neuro","Alta"],["Puberdade","Pediatria","Alta"]]},
  {b:5,nome:"Semana 5",t:[["Hipertensão Arterial Sistêmica (Parte 3): Secundária e Crise Hipertensiva","Cardiologia","Alta"],["Trauma de Face e Cervical","Cirurgia","Média"],["Bacia Obstétrica, Pelvimetria e Estática Fetal","Obstetrícia","Alta"],["Diagnóstico Nutricional","Pediatria","Alta"],["Introdução a Pneumologia","Pneumo","Média"],["Marcos legais do Sistema Único de Saúde","Preventiva","Alta"]]},
  {b:6,nome:"Semana 6",t:[["Trauma Vascular de Extremidades e Musculoesquelético","Cirurgia","Média"],["Diabetes Mellitus - Insulinoterapia e Cirurgia Metabólica","Endocrino","Alta"],["Doença do Refluxo Gastroesofágico, Esofagites Não-Pépticas e Ingestão de Corpo Estranho","Gastro","Alta"],["Adenomiose","Ginecologia","Alta"],["Leptospirose","Infectologia","Média"],["Desenvolvimento Neuropsicomotor","Pediatria","Alta"]]},
  {b:7,nome:"Semana 7",t:[["Insuficiência Cardíaca (Parte 1): Classificação, Fisiopatologia, Diagnóstico","Cardiologia","Diamante"],["Queimaduras e Trauma Elétrico","Cirurgia","Alta"],["Endometriose","Ginecologia","Diamante"],["Mecanismo de Parto e Fases Clínicas do Parto","Obstetrícia","Alta"],["Deficiências Vitamínicas e Profilaxias","Pediatria","Alta"],["Financiamento em Saúde","Preventiva","Alta"]]},
  {b:8,nome:"Semana 8",t:[["Urgências Abdominais - Abdome Agudo","Cirurgia","Diamante"],["Diabetes Mellitus - Complicações Agudas","Endocrino","Alta"],["Malária","Infectologia","Alta"],["Doença Renal Crônica (DRC) - Parte II","Nefrologia","Alta"],["Coma e Alterações da Consciência","Neuro","Alta"],["Cuidados Neonatais","Pediatria","Diamante"]]},
  {b:9,nome:"Semana 9",t:[["Insuficiência Cardíaca (Parte 2): Tratamento","Cardiologia","Alta"],["Abdome Agudo Inflamatório - Apendicite Aguda","Cirurgia","Diamante"],["Pólipos Uterinos","Ginecologia","Média"],["Partograma e Distocias","Obstetrícia","Alta"],["Reanimação neonatal","Pediatria","Alta"],["Processos de Descentralização e Regionalização do SUS","Preventiva","Alta"]]},
  {b:10,nome:"Semana 10",t:[["Abdome Agudo Inflamatório - Colecistite e Colangite Aguda","Cirurgia","Alta"],["Diabetes Mellitus - Complicações Crônicas","Endocrino","Alta"],["Anatomofisiologia Gástrica, Gastrites, Gastroparesia e Dispepsia Funcional","Gastro","Alta"],["Síndrome Febril Íctero-Hemorrágica","Infectologia","Alta"],["Distúrbios Respiratórios do Período Neonatal","Pediatria","Alta"],["Introdução à Reumatologia","Reumato","Média"]]},
  {b:11,nome:"Semana 11",t:[["Insuficiência Cardíaca Aguda","Cardiologia","Alta"],["Abdome Agudo Inflamatório - Diverticulite Aguda","Cirurgia","Alta"],["Dor Pélvica Crônica e Dismenorreia","Ginecologia","Alta"],["Assistência ao Parto","Obstetrícia","Diamante"],["Distúrbios Metabólicos Neonatais","Pediatria","Alta"],["Atenção Primária à Saúde","Preventiva","Diamante"]]},
  {b:12,nome:"Semana 12",t:[["Abdome Agudo Perfurativo","Cirurgia","Alta"],["Diabetes Mellitus - Hiperglicemia Hospitalar","Endocrino","Média"],["Abdome Agudo em Ginecologia","Ginecologia","Alta"],["Neutropenia Febril e Febre de Origem Indeterminada","Infectologia","Alta"],["Lesão Renal Aguda (LRA)","Nefrologia","Diamante"],["Infecções Congênitas","Pediatria","Alta"]]},
  {b:13,nome:"Semana 13",t:[["Dislipidemia e Estratificação de Risco Cardiovascular","Cardiologia","Alta"],["Abdome Agudo Obstrutivo","Cirurgia","Alta"],["Cefaleias","Neuro","Alta"],["Parto Vaginal Operatório","Obstetrícia","Alta"],["Icterícia e Sepse Neonatal","Pediatria","Alta"],["Políticas de Saúde","Preventiva","Alta"]]},
  {b:14,nome:"Semana 14",t:[["Abdome Agudo Vascular","Cirurgia","Alta"],["Perioperatório - Controle Glicêmico e Manejo dos Glicocorticóides","Endocrino","Média"],["Doença Ulcerosa Péptica, IBPs e H. Pylori","Gastro","Diamante"],["Assistência à Vítima de Violência Sexual","Ginecologia","Alta"],["HIV","Infectologia","Diamante"],["Síndromes Genéticas, Erros Inatos do Metabolismo e da Imunidade","Pediatria","Alta"]]},
  {b:15,nome:"Semana 15",t:[["Doença Arterial Coronariana Estável (DAC Estável)","Cardiologia","Diamante"],["Abdome Agudo Hemorrágico","Cirurgia","Alta"],["Indução do Parto e Pós-Datismo","Obstetrícia","Alta"],["Pneumonias na Infância","Pediatria","Diamante"],["Derrame Pleural","Pneumo","Alta"],["Medicina de Família e Comunidade","Preventiva","Alta"]]},
  {b:16,nome:"Semana 16",t:[["Medicina Perioperatória","Cirurgia","Alta"],["Tireoide - Fisiologia, Semiologia e Avaliação Diagnóstica","Endocrino","Alta"],["Sangramento Uterino Anormal","Ginecologia","Diamante"],["Endocardite Bacteriana - Endocardite Infecciosa","Infectologia","Alta"],["Infecção do Trato Urinário","Nefrologia","Diamante"],["Bronquiolite","Pediatria","Alta"]]},
  {b:17,nome:"Semana 17",t:[["SCASSST - Síndrome Coronária Aguda Sem Supra do Segmento ST","Cardiologia","Diamante"],["Resposta Endócrino-Metabólica ao Trauma","Cirurgia","Média"],["Amenorreia","Ginecologia","Alta"],["Hemorragia Pós-Parto","Obstetrícia","Diamante"],["Coqueluche","Pediatria","Alta"],["Saúde do Idoso","Preventiva","Alta"]]},
  {b:18,nome:"Semana 18",t:[["Nutrição em Cirurgia e Aceleração da Recuperação Pós-Operatória","Cirurgia","Média"],["Tireoide - Hipotireoidismo","Endocrino","Diamante"],["Anatomia e Fisiologia do Pâncreas e Neoplasias Pancreáticas","Gastro","Alta"],["Arboviroses (Dengue, Chikungunya e Zika)","Infectologia","Diamante"],["Demências","Neuro","Alta"],["Asma","Pediatria","Diamante"]]},
  {b:19,nome:"Semana 19",t:[["IAMCSST (Infarto Agudo do Miocárdio com Supradesnivelamento de Segmento ST)","Cardiologia","Diamante"],["Complicações Pós-Operatórias","Cirurgia","Alta"],["Síndrome dos Ovários Policísticos","Ginecologia","Diamante"],["Infecção Puerperal","Obstetrícia","Alta"],["Fibrose Cística","Pediatria","Alta"],["Ética Médica","Preventiva","Diamante"]]},
  {b:20,nome:"Semana 20",t:[["Cicatrização de Feridas","Cirurgia","Média"],["Tireoide - Tireotoxicose: Diagnóstico, Etiologia, Tratamento","Endocrino","Alta"],["Pneumonias Bacterianas","Infectologia","Diamante"],["Distúrbios Ácido-Básicos","Nefrologia","Alta"],["Doenças Exantemáticas","Pediatria","Alta"],["Doença Pulmonar Obstrutiva Crônica (DPOC)","Pneumo","Diamante"]]},
  {b:21,nome:"Semana 21",t:[["Semiologia Cardíaca","Cardiologia","Alta"],["Hérnias da Parede Abdominal","Cirurgia","Alta"],["Planejamento Familiar","Ginecologia","Alta"],["Sangramento da Primeira Metade","Obstetrícia","Diamante"],["Tuberculose na Infância","Pediatria","Alta"],["Processo Saúde-Doença","Preventiva","Alta"]]},
  {b:22,nome:"Semana 22",t:[["Cirurgia Bariátrica e Metabólica","Cirurgia","Alta"],["Obesidade e Síndrome Metabólica","Endocrino","Alta"],["Pancreatite Aguda e Crônica","Gastro","Diamante"],["Climatério e Terapia Hormonal","Ginecologia","Alta"],["Animais Peçonhentos","Infectologia","Alta"],["Febre na Pediatria","Pediatria","Alta"]]},
  {b:23,nome:"Semana 23",t:[["Fibrilação e Flutter Atrial","Cardiologia","Diamante"],["Vesícula e Vias Biliares","Cirurgia","Alta"],["Epilepsias","Neuro","Diamante"],["Sangramento da Segunda Metade","Obstetrícia","Diamante"],["Cardiopatias Congênitas","Pediatria","Alta"],["Medidas de Saúde Coletiva - Indicadores de Morbidade","Preventiva","Alta"]]},
  {b:24,nome:"Semana 24",t:[["Proctologia","Cirurgia","Alta"],["Metabolismo Ósseo e Mineral - Hipercalcemia","Endocrino","Média"],["Infertilidade Conjugal","Ginecologia","Alta"],["Sepse","Infectologia","Diamante"],["Análise da Gasometria Arterial","Nefrologia","Alta"],["Diarreia","Pediatria","Diamante"]]},
  {b:25,nome:"Semana 25",t:[["Taquiarritmias","Cardiologia","Diamante"],["Cirurgia Infantil - Parte I","Cirurgia","Alta"],["Prematuridade e Trabalho de Parto Prematuro","Obstetrícia","Diamante"],["Doença do Refluxo Gastroesofágico em Pediatria","Pediatria","Alta"],["Tromboembolismo Pulmonar (TEP)","Pneumo","Diamante"],["Medidas de Saúde Coletiva - Indicadores de Mortalidade","Preventiva","Alta"]]},
  {b:26,nome:"Semana 26",t:[["Cirurgia Infantil - Parte II","Cirurgia","Alta"],["Metabolismo Ósseo e Mineral - Hipocalcemia","Endocrino","Média"],["Anatomia e Fisiologia do Cólon e Síndrome do Intestino Irritável","Gastro","Alta"],["Síndrome Pré-Menstrual","Ginecologia","Média"],["Micoses Invasivas","Infectologia","Alta"],["Infecção de Trato Urinário em Pediatria","Pediatria","Alta"]]},
  {b:27,nome:"Semana 27",t:[["Bradiarritmias","Cardiologia","Alta"],["Cirurgia Infantil - Parte III","Cirurgia","Alta"],["Cervicites","Ginecologia","Alta"],["Rotura Prematura de Membranas","Obstetrícia","Alta"],["Doença de Kawasaki","Pediatria","Alta"],["Medidas de Saúde Coletiva - Indicadores Demográficos","Preventiva","Alta"]]},
  {b:28,nome:"Semana 28",t:[["Cirurgia Vascular","Cirurgia","Alta"],["Metabolismo Ósseo e Mineral - Osteoporose e Doença de Paget","Endocrino","Alta"],["Meningites (Infecções do SNC)","Infectologia","Diamante"],["Doenças Glomerulares","Nefrologia","Alta"],["Acidentes Vasculares Cerebrais","Neuro","Diamante"],["Febre Reumática","Pediatria","Diamante"]]},
  {b:29,nome:"Semana 29",t:[["Parada Cardiorrespiratória (PCR)","Cardiologia","Diamante"],["Urologia","Cirurgia","Alta"],["Doença Inflamatória Pélvica","Ginecologia","Diamante"],["Abortamento de Repetição","Obstetrícia","Alta"],["Emergências Pediátricas","Pediatria","Diamante"],["Processos Epidêmicos e Epidemiologia das Doenças Infecciosas","Preventiva","Alta"]]},
  {b:30,nome:"Semana 30",t:[["Cirurgia Plástica","Cirurgia","Média"],["Adrenal - Hipocortisolismo (Insuficiência Adrenal)","Endocrino","Alta"],["Distúrbios Disabsortivos","Gastro","Alta"],["Hepatoesplenomegalias Infecciosas","Infectologia","Alta"],["Choque em Pediatria","Pediatria","Diamante"],["Pneumologia Intensiva","Pneumo","Alta"]]},
  {b:31,nome:"Semana 31",t:[["Síncope","Cardiologia","Alta"],["Cirurgia Torácica","Cirurgia","Alta"],["Úlceras Genitais","Ginecologia","Alta"],["Gestação Múltipla","Obstetrícia","Alta"],["Convulsão Febril","Pediatria","Diamante"],["Vigilância em Saúde","Preventiva","Alta"]]},
  {b:32,nome:"Semana 32",t:[["Temas Gerais em Cirurgia","Cirurgia","Alta"],["Adrenal - Hipercortisolismo (Síndrome de Cushing)","Endocrino","Alta"],["Vulvovaginites","Ginecologia","Alta"],["Influenza","Infectologia","Alta"],["Nefrolitíase","Nefrologia","Alta"],["Anafilaxia e Urticária","Pediatria","Alta"]]},
  {b:33,nome:"Semana 33",t:[["Eletrocardiograma","Cardiologia","Diamante"],["Doenças Neuromusculares (Neuropatias, Miopatias, Junção, Neurônio Motor)","Neuro","Alta"],["Síndromes Hipertensivas da Gestação","Obstetrícia","Diamante"],["Hiperplasia Adrenal Congênita","Pediatria","Alta"],["Sistemas de Informação em Saúde","Preventiva","Alta"],["Artrite Reumatoide","Reumato","Diamante"]]},
  {b:34,nome:"Semana 34",t:[["Adrenal - Feocromocitoma, Hiperaldosteronismo e Incidentaloma","Endocrino","Alta"],["Doença Inflamatória Intestinal","Gastro","Diamante"],["Rastreamento do Câncer de Colo Uterino","Ginecologia","Diamante"],["Introdução ao Estudo das Anemias","Hemato","Alta"],["Parasitoses","Infectologia","Alta"],["Alergia Alimentar","Pediatria","Alta"]]},
  {b:35,nome:"Semana 35",t:[["Síndromes Aórticas Agudas","Cardiologia","Alta"],["Diabetes Mellitus na Gestação","Obstetrícia","Diamante"],["Obesidade Infantil e na Adolescência","Pediatria","Alta"],["Asma","Pneumo","Diamante"],["Pesquisa Epidemiológica e Medidas de Associação","Preventiva","Alta"],["Espondiloartrites","Reumato","Alta"]]},
  {b:36,nome:"Semana 36",t:[["Hipófise - Hiperprolactinemia","Endocrino","Alta"],["Câncer de Colo Uterino","Ginecologia","Diamante"],["Anemias Microcíticas","Hemato","Diamante"],["Covid 19","Infectologia","Alta"],["Distúrbios do Potássio","Nefrologia","Alta"],["Constipação Intestinal","Pediatria","Alta"]]},
  {b:37,nome:"Semana 37",t:[["Choque","Cardiologia","Diamante"],["Tumores Anexiais e Câncer de Ovário","Ginecologia","Alta"],["Distúrbios do Movimento","Neuro","Alta"],["Sífilis na Gestação e Sífilis Congênitas","Obstetrícia","Diamante"],["Desnutrição na Infância","Pediatria","Alta"],["Testes Diagnósticos","Preventiva","Diamante"]]},
  {b:38,nome:"Semana 38",t:[["Neoplasias Endócrinas Múltiplas","Endocrino","Alta"],["Hemorragia Digestiva Alta Varicosa","Gastro","Alta"],["Anemias Macrocíticas","Hemato","Alta"],["Infecções Relacionadas à Assistência em Saúde","Infectologia","Alta"],["Hipertensão Arterial na Criança e Adolescente","Pediatria","Alta"],["Artrites Microcristalinas","Reumato","Alta"]]},
  {b:39,nome:"Semana 39",t:[["Cardiomiopatias","Cardiologia","Alta"],["Doenças de Vulva e Vagina","Ginecologia","Alta"],["Ultrassom em Obstetrícia","Obstetrícia","Alta"],["Púrpura de Hennoch Schonlein-Vasculite por IGA","Pediatria","Alta"],["Estatística Médica","Preventiva","Alta"],["Dependência Química","Psiquiatria","Alta"]]},
  {b:40,nome:"Semana 40",t:[["Anemias Hemolíticas","Hemato","Alta"],["Raiva, Tétano, Mordedura e Arranhadura Animal","Infectologia","Alta"],["Distúrbios do Sódio - Disnatremias","Nefrologia","Alta"],["Artrite Idiopática Juvenil","Pediatria","Alta"],["Neoplasias Pulmonares","Pneumo","Alta"],["Artropatias Infecciosas","Reumato","Alta"]]},
  {b:41,nome:"Semana 41",t:[["Histologia e Fisiologia da Pele e Lesões Elementares","Dermato","Alta"],["Câncer do Corpo do Útero","Ginecologia","Alta"],["Traumatismo Cranioencefálico","Neuro","Diamante"],["Vitalidade Fetal","Obstetrícia","Alta"],["Tópicos em Pediatria","Pediatria","Alta"],["Bases de Saúde do Trabalhador e Normas Regulamentadoras","Preventiva","Alta"]]},
  {b:42,nome:"Semana 42",t:[["Dermatoses Infecciosas","Dermato","Alta"],["Hemorragia Digestiva Alta Não Varicosa","Gastro","Diamante"],["Doenças Benignas da Mama","Ginecologia","Alta"],["Anemias Associadas a Condições Não Hematológicas","Hemato","Média"],["Sífilis e Outras ISTs","Infectologia","Diamante"],["Transtornos do Humor","Psiquiatria","Diamante"],["Vasculites","Reumato","Alta"]]},
  {b:43,nome:"Semana 43",t:[["Hanseníase","Dermato","Diamante"],["Introdução a Hepatologia","Gastro","Alta"],["Hemostasia I: Conceitos Básicos e Anticoagulantes","Hemato","Alta"],["Alteração do Volume de Líquido Amniótico","Obstetrícia","Alta"],["Doenças da Coluna Vertebral","Ortopedia","Alta"],["Infecções de Vias Aéreas Superiores - Parte I","Otorrino","Alta"],["Transtornos de Ansiedade","Psiquiatria","Diamante"],["Doenças Autoimunes do Tecido Conjuntivo - Parte 1","Reumato","Alta"]]},
  {b:44,nome:"Semana 44",t:[["Oncologia Cutânea (Câncer de Pele)","Dermato","Alta"],["Hepatites Virais","Gastro","Diamante"],["Rastreamento do Câncer de Mama","Ginecologia","Diamante"],["Hemostasia II: Doenças Hemostáticas","Hemato","Alta"],["Túbulo-Interstício Renal","Nefrologia","Alta"],["Doenças do Ombro e Cotovelo","Ortopedia","Alta"],["Infecções de Vias Aéreas Superiores - Parte II","Otorrino","Alta"],["Transtornos Psicóticos","Psiquiatria","Alta"],["Doenças Autoimunes do Tecido Conjuntivo - Parte 2","Reumato","Alta"]]},
  {b:45,nome:"Semana 45",t:[["Dermatoses Eczematosas","Dermato","Alta"],["Câncer de Mama","Ginecologia","Diamante"],["Leucemias Agudas","Hemato","Alta"],["Distúrbios do Sono","Neuro","Alta"],["Restrição de Crescimento Fetal e Óbito Fetal","Obstetrícia","Alta"],["Síndrome do Olho Vermelho","Oftalmo","Alta"],["Doenças da Mão e Síndromes Compressivas","Ortopedia","Alta"],["Infecções de Vias Aéreas Superiores - Parte III","Otorrino","Alta"],["Intoxicações Exógenas","Psiquiatria","Alta"],["Doenças do Osso e da Cartilagem","Reumato","Alta"]]},
  {b:46,nome:"Semana 46",t:[["Farmacodermias","Dermato","Alta"],["Hemorragia Digestiva Baixa","Gastro","Alta"],["Cirrose Hepática","Gastro","Diamante"],["Incontinência Urinária","Ginecologia","Alta"],["Leucemias Crônicas, Linfomas, Mielodisplasias","Hemato","Alta"],["Córnea e Cristalino","Oftalmo","Alta"],["Oncologia Ortopédica e Osteomielite","Ortopedia","Alta"],["Otoneurologia, Vertigens e Audiologia","Otorrino","Alta"],["Psiquiatria Infantil","Psiquiatria","Alta"],["Síndromes Dolorosas Crônicas","Reumato","Alta"]]},
  {b:47,nome:"Semana 47",t:[["Dermatoses Papuloescamosas","Dermato","Alta"],["Neoplasias de Estômago e Esôfago","Gastro","Alta"],["Prolapso de Órgãos Pélvicos","Ginecologia","Alta"],["Mieloma Múltiplo (Gamopatias Monoclonais)","Hemato","Alta"],["Infecções Congênitas na Gestação","Obstetrícia","Alta"],["Quadril Pediátrico","Ortopedia","Alta"],["Ombro e Joelho Pediátrico","Ortopedia","Alta"],["Cirurgia de Cabeça e Pescoço - Laringologia, Apneia","Otorrino","Alta"],["Transtornos Alimentares","Psiquiatria","Alta"],["Reumatologia Pediátrica","Reumato","Alta"]]},
  {b:48,nome:"Semana 48",t:[["Dermatoses Vesicobolhosas","Dermato","Alta"],["Polipose Intestinal e Câncer Colorretal","Gastro","Diamante"],["Outras Causas de Hepatopatia Crônica","Gastro","Alta"],["Medicina Transfusional","Hemato","Alta"],["Glaucoma","Oftalmo","Alta"],["Desenvolvimento Ortopédico da Criança","Ortopedia","Alta"],["Maus Tratos","Ortopedia","Alta"],["Cirurgia de Cabeça e Pescoço - Nódulos Tireoide","Otorrino","Alta"],["Transtornos de Personalidade","Psiquiatria","Alta"],["Miscelânea em Reumatologia","Reumato","Média"]]},
  {b:49,nome:"Semana 49",t:[["Síndromes Verrucosas","Dermato","Alta"],["Hepatopatias Autoimunes","Gastro","Alta"],["Complicações da Cirrose Hepática","Gastro","Diamante"],["Doenças Desmielinizantes e Encefalites Autoimunes","Neuro","Alta"],["Aloimunização Materna e Doença Hemolítica Perinatal","Obstetrícia","Alta"],["Conceitos Básicos do Trauma Ortopédico","Ortopedia","Alta"],["Fratura Exposta","Ortopedia","Alta"],["Cirurgia de Cabeça e Pescoço - Neoplasias Benignas e Malignas","Otorrino","Alta"],["Psicofarmacologia","Psiquiatria","Alta"],["TOC, Transtornos Somáticos, Dissociativos e Estresse","Psiquiatria","Alta"]]},
  {b:50,nome:"Semana 50",t:[["Piodermites","Dermato","Alta"],["Miscelânea em Dermatologia","Dermato","Média"],["Síndrome Hepatorrenal e Síndrome Hepatopulmonar","Gastro","Alta"],["Tumores Hepáticos","Gastro","Alta"],["Distúrbios da Refração","Oftalmo","Alta"],["Complicações do Trauma Ortopédico","Ortopedia","Alta"],["Fraturas e Luxações","Ortopedia","Alta"],["Politrauma Ortopédico","Ortopedia","Alta"],["Psicopatologia","Psiquiatria","Alta"],["Psiquiatria Social e Reforma Psiquiátrica","Psiquiatria","Alta"]]},
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
