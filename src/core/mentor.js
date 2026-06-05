// src/core/mentor.js
// Pure functional engine for Mentor feedback and diagnosis logic

import { calcTrend, calcProjecao } from "../hooks/useMetrics";
import { detectErrorPatterns } from "./errorPatterns";
import { getReadinessData } from "./readiness";
import { useStore } from "./store";

const PHRASES = {
  sessao_concluida_high: [
    { id: "sc_high_1", text: "{userName}, {tema} está consolidado. Acerto {acerto}% — acima da meta. O FSRS agendou o próximo passo para {data}. No ritmo atual você domina esse tema antes da prova." },
    { id: "sc_high_2", text: "{userName}, {acerto}% em {tema} é um resultado excelente. A curva FSRS foi empurrada para {data}. Mantenha esse padrão e a aprovação é consequência." },
    { id: "sc_high_3", text: "Excelente performance, {userName}. {tema} foi agendado para {data} com acerto de {acerto}%. O planejamento está funcionando." },
    { id: "sc_high_4", text: "Domínio total em {tema}, {userName}. {acerto}% de acerto. Próxima parada: {data}. Continue assim!" }
  ],
  sessao_concluida_mid: [
    { id: "sc_mid_1", text: "{tema} está progredindo. {acerto}% é sólido, mas a meta é 80%. O que mais te pegou? Revise os erros por raciocínio antes de {data} — não deixa pra depois." },
    { id: "sc_mid_2", text: "{userName}, acerto de {acerto}% em {tema}. É bom, mas podemos subir. Foco em tapar os furos antes de {data}." },
    { id: "sc_mid_3", text: "Progresso consistente em {tema}: {acerto}%. A revisão está agendada para {data}. Ajuste os detalhes dos seus erros hoje." },
    { id: "sc_mid_4", text: "{tema} revisado com {acerto}%. Está na média, mas seu potencial é acima de 80%. Analise os distractors antes da revisão de {data}." }
  ],
  sessao_concluida_low: [
    { id: "sc_low_1", text: "{tema} ainda não fixou bem — {acerto}%. Isso é perfeitamente normal: indica que vale a pena reestudar a base antes de seguir adiante. É para isso que serve revisar.", tone: "gentil" },
    { id: "sc_low_2", text: "Identifiquei que {tema} precisa de um reforço extra. O rendimento de {acerto}% sugere que revisar a base agora vai evitar dores de cabeça no futuro. Vamos juntos?", tone: "gentil" },
    { id: "sc_low_3", text: "Rendimento de {acerto}% em {tema}. Que tal focar em entender as causas dos erros antes de avançar? Assim garantimos um progresso mais consistente.", tone: "neutro" },
    { id: "sc_low_4", text: "Atenção em {tema}, {userName}. Esse rendimento de {acerto}% mostra que o conteúdo ainda está instável. Um ajuste na base hoje vai economizar muito tempo amanhã.", tone: "firme" }
  ],
  atrasado: [
    { id: "atr_1", text: "Faz uns dias que {tema} não aparece. Sem problemas: já reorganizei a fila para caber no seu ritmo. Bora retomar por ele?", tone: "gentil" },
    { id: "atr_2", text: "Oi, {userName}. {tema} está aguardando revisão. Retomar agora custa muito menos esforço do que parece — uns minutinhos e você restabelece a curva.", tone: "gentil" },
    { id: "atr_3", text: "{tema} é uma boa prioridade hoje. Reencaixar esse assunto na memória agora garante que você não perca o progresso anterior.", tone: "neutro" },
    { id: "atr_4", text: "O algoritmo de revisão programou {tema} para hoje. Estudar hoje protege o esforço que você já investiu nele. Vamos nessa?", tone: "firme" }
  ],
  streak: [
    { id: "str_1", text: "{streak} dias seguidos. Isso não é motivação — é sistema. Você já internalizou o ritmo. A partir daqui o estudo fica mais fácil, não mais difícil." },
    { id: "str_2", text: "Sensacional, {userName}! {streak} dias seguidos de foco. Você está construindo o hábito dos aprovados." },
    { id: "str_3", text: "{streak} dias de consistência inabalável. O cérebro adora rotina. Mantenha o foco!" },
    { id: "str_4", text: "Impressionante. {streak} dias no MedRev. A concorrência não acompanha quem estuda todo santo dia." }
  ],
  vies: [
    { id: "vies_1", text: "Você declarou confiança {confiancaMedia}/5 em {especialidade}, mas está acertando {acerto}%. Delta de {delta} pontos por {sessoes} sessões. Isso é excesso de confiança — o maior inimigo da aprovação." },
    { id: "vies_2", text: "{userName}, cuidado: sua percepção em {especialidade} ({confiancaMedia}/5) está desconectada do acerto real de {acerto}%. Ajuste a autocrítica para não ser surpreendido na prova." },
    { id: "vies_3", text: "Viés detectado em {especialidade}. Confiança {confiancaMedia}/5 vs {acerto}% de acerto. Estudar com a falsa sensação de domínio é perigoso. Revise com mais atenção." }
  ],
  primeiro_acesso: [
    { id: "pa_1", text: "Começou! O primeiro passo é o mais difícil. Você tem {totalFila} itens na fila. Isso vai levar aprox. {tempoEstimado} minutos." },
    { id: "pa_2", text: "Bom te ver focado, {userName}. Temos {totalFila} revisões agendadas hoje. Estudo ativo nelas, previsão de {tempoEstimado} minutos." },
    { id: "pa_3", text: "Dia de estudo iniciado. {totalFila} temas aguardando sua revisão ativa. Em cerca de {tempoEstimado} minutos você zera a fila de hoje." }
  ],
  meta_diaria: [
    { id: "md_1", text: "Fila zerada. Você fez {totalQuestoes} questões hoje. Cada questão hoje é uma questão que você vai acertar na prova." },
    { id: "md_2", text: "Meta cumprida! {totalQuestoes} questões resolvidas. O Mentor está orgulhoso. Aproveite o descanso, amanhã tem mais." },
    { id: "md_3", text: "Fila limpa com sucesso, {userName}. {totalQuestoes} questões feitas. Consistência é o segredo. Até amanhã!" }
  ],
  sessao_interleaved: [
    { id: "si_1", text: "Você concluiu uma sessão intercalada para os subtemas de {parentTopic}. A ciência da aprendizagem (Firth et al., 2021) sugere que misturar assuntos melhora a diferenciação mental em exames cumulativos." },
    { id: "si_2", text: "Prática intercalada concluída! A evidência sugere que contrastar conceitos similares de {parentTopic} ajuda a evitar confusões na hora da prova." }
  ],
  erro_padrao_detectado: [
    { id: "epd_lacuna", text: "Seus erros em {especialidade} são de base, não de raciocínio. Volte ao conteúdo-base, não faça apenas questões (Ericsson, 1993)." },
    { id: "epd_raciocinio", text: "Você sabe o conteúdo de {especialidade} mas erra na lógica. Foque em revisar questões comentadas em vez de reler a teoria (Deng et al., 2015)." },
    { id: "epd_distracao", text: "Identifiquei muitos erros por desatenção/distração em {especialidade}. Reveja seu horário de estudos e nível de cansaço." }
  ],
  // ─── VESTIBULAR-SPECIFIC ────────────────────────────────────────────────────
  vest_acerto_alto: [
    { id: "va_high_1", text: "{userName}, {acerto}% em {tema} é top. Com esse acerto, essa área não vai te derrubar na {prova}. O FSRS agendou o reforço para {data}." },
    { id: "va_high_2", text: "Domínio sólido em {tema}: {acerto}%. O algoritmo empurrou a próxima revisão para {data}. Continue nesse ritmo e a nota de corte vira formalidade." },
    { id: "va_high_3", text: "{acerto}% em {tema} — resultado de elite, {userName}. Próximo reforço em {data}. Mantenha isso e as outras áreas serão o diferencial." }
  ],
  vest_acerto_baixo: [
    { id: "va_low_1", text: "Identifiquei que {tema} está abaixo da meta com {acerto}%. O que acha de reforçar a base teórica antes de avançar? Assim protegemos seu progresso.", tone: "gentil" },
    { id: "va_low_2", text: "Alerta de atenção em {tema}: {acerto}%. Identificar se é lacuna de conteúdo ou distração é o primeiro passo para recalibrar seu foco.", tone: "neutro" },
    { id: "va_low_3", text: "{userName}, o acerto de {acerto}% em {tema} sugere que o conteúdo ainda está instável. Sugiro fortemente focar em revisar a teoria antes de acumular novas revisões.", tone: "firme" }
  ],
  vest_segunda_tentativa: [
    { id: "vst_1", text: "Segunda tentativa, {userName}. Você já sabe o que não funcionou. Agora é hora de atacar com precisão — não quantidade. Foco no que a {prova} mais cobra." },
    { id: "vst_2", text: "Quem chega na segunda tentativa com método vence. Você tem vantagem sobre quem tenta pela primeira vez: você conhece o exame. Use isso a seu favor." },
    { id: "vst_3", text: "O ciclo FSRS foi desenhado para exatamente isso: identificar onde você sangra e eliminar a hemorragia antes da prova. Confie no processo." }
  ],
  vest_ansiedade: [
    { id: "vans_1", text: "Nota de corte parece distante? Normal nessa fase. O que importa é a inclinação da curva — e a sua está subindo. Siga o algoritmo, não o pânico." },
    { id: "vans_2", text: "{userName}, a ansiedade é sinal de que você se importa. Mas ela não estuda por você. Mais 30 minutos de foco agora valem mais que 3 horas de preocupação." },
    { id: "vans_3", text: "Cada sessão concluída hoje é menos lacuna na prova. O processo não para de funcionar. Você precisa aparecer — o algoritmo faz o resto." }
  ],
  vest_semana_prova: [
    { id: "vsp_1", text: "Semana da prova, {userName}. Nada de conteúdo novo. Só revisão das pendências da fila. O cérebro precisa consolidar, não de mais informação.", tone: "firme" },
    { id: "vsp_2", text: "Últimos dias. Priorize: 1) dormir bem, 2) comer direito, 3) revisar a fila. Nessa ordem. Rendimento cognitivo na prova depende dos 3.", tone: "neutro" },
    { id: "vsp_3", text: "O que você sabe, você sabe. Agora é sobre execução, não aprendizado. Foco, respiração e confiança no processo.", tone: "gentil" }
  ],
  ciclo_pos_d21: [
    { id: "pd21_1", text: "{userName}, {tema} fechou o ciclo D0→D21. Não some do mapa: o FSRS agora agenda reforços com intervalos crescentes (45, 90+ dias) só quando sua retenção real pedir. Você revisa menos e lembra mais.", tone: "gentil" },
    { id: "pd21_2", text: "Ciclo completo em {tema}. A partir daqui entra em manutenção: revisões raras e espaçadas, calculadas pela sua estabilidade (S). Quanto melhor seu acerto, mais longe a próxima.", tone: "firme" },
    { id: "pd21_3", text: "{tema} consolidado. O D21 não é o fim — é quando o tema vira memória de longo prazo. Eu te chamo de volta só no ponto ótimo de esquecimento, pra não desperdiçar seu tempo.", tone: "gentil" },
    { id: "pd21_4", text: "Pronto! {tema} está na fase de manutenção de longo prazo. O algoritmo FSRS agora aumenta o espaçamento de forma exponencial (45, 90+ dias). O aprendizado está sedimentado.", tone: "neutro" }
  ],
  etapa_d1: [
    { id: "e_d1_1", text: "D1 é recuperação ativa: escrever de memória (Brain Dump) sem olhar o material. Esse esforço é o que fixa — não é reler, é lembrar. (Karpicke & Blunt, 2011)", tone: "neutro" },
    { id: "e_d1_2", text: "A força da sua memória é criada na dificuldade de puxar a informação. Forçar a mente no Brain Dump hoje reduz pela metade sua chance de esquecer amanhã.", tone: "firme" },
    { id: "e_d1_3", text: "Brain Dump agora. Não consulte nada por 5 minutos. Tente reescrever de cabeça os pontos principais. Errar e forçar a busca mental reconsolida as sinapses.", tone: "firme" },
    { id: "e_d1_4", text: "Resgate ativo no D1: colocar o cérebro para trabalhar. O esforço inicial no Brain Dump é a parte cientificamente comprovada mais importante do método.", tone: "gentil" }
  ],
  etapa_d4: [
    { id: "e_d4_1", text: "D4: agora questões. Testar é estudar — o efeito teste supera reler na retenção de longo prazo. (Adesope et al., 2017)", tone: "neutro" },
    { id: "e_d4_2", text: "Questões ativas hoje. Errar e ler a justificativa agora ativa a sua memória episódica, blindando você contra distratores na hora da prova.", tone: "gentil" },
    { id: "e_d4_3", text: "Prática de teste: fazer questões é muito melhor do que reler resumos. O cérebro aprende a buscar respostas sob pressão.", tone: "firme" },
    { id: "e_d4_4", text: "Hora do treino real. O rendimento nas questões de D4 calibra a estabilidade inicial do tema. Resolva com atenção plena.", tone: "firme" }
  ],
  etapa_d7: [
    { id: "e_d7_1", text: "D7: questões + flashcards. Você está espaçando no ponto certo da curva de esquecimento. Espaçar > amontoar. (Dunlosky et al., 2013)", tone: "neutro" },
    { id: "e_d7_2", text: "Hora de acoplar as questões aos flashcards do Anki. O espaçamento ideal no D7 evita que o tema caia no esquecimento profundo.", tone: "gentil" },
    { id: "e_d7_3", text: "Sétimo dia: consolidação. Revisar no ponto exato de esquecimento economiza tempo e aumenta a retenção de longo prazo.", tone: "gentil" },
    { id: "e_d7_4", text: "Questões e Anki. O reforço no D7 solidifica a curva. Mantenha os flashcards em dia para manter o tema fresco.", tone: "firme" }
  ],
  etapa_d21: [
    { id: "e_d21_1", text: "D21 intercalado: misturar temas parecidos treina seu cérebro a diferenciar — exatamente o que a prova cobra. (Foster et al., 2019)", tone: "neutro" },
    { id: "e_d21_2", text: "Sessão interleaved no D21. Ao misturar tópicos, você simula as condições reais do exame, onde as questões vêm misturadas.", tone: "gentil" },
    { id: "e_d21_3", text: "Último passo do ciclo principal: prática misturada. Treinar a flexibilidade cognitiva hoje prepara você para qualquer surpresa.", tone: "gentil" },
    { id: "e_d21_4", text: "Chegamos ao D21. Misturar subtemas força você a discernir diagnósticos diferenciais parecidos. Foco total.", tone: "firme" }
  ],
  dia_sem_fila: [
    { id: "dsf_1", text: "Fila zerada. Nada para hoje! Descansar também é parte do método — sua retenção de longo prazo agradece.", tone: "gentil" },
    { id: "dsf_2", text: "Curva sob controle e fila limpa. Aproveite o tempo livre para descansar ou fazer atividades físicas. Equilíbrio é chave.", tone: "gentil" },
    { id: "dsf_3", text: "Parabéns, {userName}, sua fila está limpa. Dê férias parciais ao cérebro hoje para consolidar os estudos da semana.", tone: "neutro" },
    { id: "dsf_4", text: "Sem pendências no FSRS por hoje. O descanso estratégico é essencial para a saúde cognitiva e fixação das memórias.", tone: "firme" }
  ],
  descanso_saudavel: [
    { id: "ds_1", text: "Está tudo bem descansar, {userName}. A curva de esquecimento do algoritmo de revisão tolera pausas estratégicas. O importante é voltar com foco.", tone: "gentil" },
    { id: "ds_2", text: "Estudo de alta performance exige descanso de qualidade. Salvei sua ofensiva hoje para você se recuperar sem culpa.", tone: "gentil" },
    { id: "ds_3", text: "Descanso estratégico é parte do método, {userName}. Ofensiva mantida. Durma bem e volte quando estiver pronto.", tone: "neutro" },
    { id: "ds_4", text: "Pausa necessária. Sua ofensiva está congelada e protegida. Lembre-se: consistência não é exaustão.", tone: "firme" }
  ],
  streak_perdida: [
    { id: "str_lost_1", text: "A sequência zerou, mas o que você aprendeu não. Recomeçar no dia 1 com método é melhor que manter streak no piloto automático. Bora?", tone: "gentil" },
    { id: "str_lost_2", text: "A ofensiva recomeça hoje, {userName}. O importante é a constância do aprendizado acumulado, não um contador. De volta ao trabalho!", tone: "neutro" }
  ],
  modo_reduzido_aquisicao_pendente: [
    { id: "mr_aq_p_1", text: "Hoje tá pesado. Tema novo agora vira tempo jogado fora — encoding exausto não fixa. Bora só nas {n} revisões que já estão maduras? Elas pedem menos e rendem mais. O tema novo te espera amanhã." }
  ],
  modo_reduzido_aquisicao_descanso: [
    { id: "mr_aq_d_1", text: "Você zerou as revisões e hoje não é dia de tema novo. Descansar não é falha — é o que consolida o que você já aprendeu. Te vejo amanhã, inteiro." }
  ],
  modo_reduzido_recuperacao: [
    { id: "mr_rec_1", text: "Dia difícil? Então vamos no essencial: um recall rápido e 10 questões de {tema}. Mantém a curva sem te quebrar." }
  ],
  fluencia: [
    { id: "flu_1", text: "Errar e ter que reconstruir a resposta é o que fixa de verdade. Releitura passa a sensação de domínio, mas é ilusão de fluência (Bjork). Confie no esforço de hoje.", tone: "neutro" },
    { id: "flu_2", text: "Se a sessão pareceu difícil, ótimo sinal: esforço de recuperação = memória de longo prazo. O que é fácil agora costuma sumir na semana que vem.", tone: "gentil" },
    { id: "flu_3", text: "Não meça aprendizado pela facilidade do momento. Espaçar e errar dói mais hoje e rende muito mais na prova (storage strength > retrieval strength).", tone: "firme" }
  ],
  transicao_modo_prova: [
    { id: "tmp_1", text: "Seus números dizem que você passou da fase de aprender e entrou na fase de treinar pra prova. Quer que eu reescreva seu plano em modo simulado? Você ainda pode revisar pontos fracos quando eles aparecerem." }
  ],
  tema_consolidando: [
    { id: "tc_1", text: "Você já viu o essencial de {area} e está em {acerto}%. Parar de ver teoria nova e focar em fazer questões em volume é o que te ajuda a alcançar a meta de 80%. Sugiro focar na prática de questões para consolidar." }
  ],
  tema_voltou_fila: [
    { id: "tvf_1", text: "{tema} caiu pra {acerto}% no simulado. Saiu do modo prova, voltou pra fila de questões. Sem drama — é pra isso que serve simular." }
  ],
  boas_vindas_retorno: [
    { id: "bv_ret_1", text: "Bom te ver de volta, {userName}. Você já acumulou {totalRevisoesFeitas} revisões e tem {prontidao}% de prontidão. Vamos reajustar o ritmo? Temos {pending} revisões ({tempoEstimado} min) hoje.", tone: "gentil" },
    { id: "bv_ret_2", text: "Bem-vindo de volta, {userName}. Com {totalRevisoesFeitas} revisões feitas e {prontidao}% de prontidão, seu potencial está guardado. De volta ao foco com {pending} pendências hoje.", tone: "neutro" }
  ],
  boas_vindas_inicio: [
    { id: "bv_ini_1", text: "Seja muito bem-vindo, {userName}! Sua jornada de elite começa agora. O algoritmo já está pronto para mapear sua curva de esquecimento. Qual tema iniciamos?", tone: "gentil" },
    { id: "bv_ini_2", text: "Olá, {userName}! Primeiro acesso concluído. Cada grande conquista começa com a coragem de iniciar. Vamos cadastrar o primeiro assunto do dia?", tone: "gentil" }
  ],
  boas_vindas_streak: [
    { id: "bv_str_1", text: "Consistência incrível, {userName}! Você já fez {totalRevisoesFeitas} revisões e sua prontidão está em {prontidao}%. Esses {streakCurrent} dias seguidos provam seu foco. Bora liquidar as {pending} revisões de hoje?", tone: "gentil" },
    { id: "bv_str_2", text: "{streakCurrent} dias seguidos de consistência, {userName}. Com {totalRevisoesFeitas} revisões feitas e {prontidao}% de prontidão, a vaga se aproxima. Foco nas {pending} de hoje!", tone: "neutro" }
  ],
  boas_vindas_pendente: [
    { id: "bv_pen_1", text: "Olá, {userName}. Você já concluiu {totalRevisoesFeitas} revisões com prontidão de {prontidao}%. Hoje temos {pending} temas agendados ({tempoEstimado} min). Bora recall ativo!", tone: "gentil" },
    { id: "bv_pen_2", text: "Hoje temos {pending} tópicos na fila, {userName}. Com {totalRevisoesFeitas} revisões feitas e prontidão em {prontidao}%, continue firme no método para proteger sua curva.", tone: "neutro" }
  ],
  boas_vindas_zerada: [
    { id: "bv_zero_1", text: "Fila zerada e mente blindada, {userName}! Você já fez {totalRevisoesFeitas} revisões e sua prontidão é de {prontidao}%. Descanse sem culpa hoje.", tone: "gentil" },
    { id: "bv_zero_2", text: "Manutenção em dia! Fila zerada hoje, {userName}. Com {totalRevisoesFeitas} revisões e {prontidao}% de prontidão, seu cérebro merece o descanso para consolidar.", tone: "neutro" }
  ],
  calibracao_excesso_confianca: [
    { id: "cal_over_1", text: "{userName}, sua previsão de acerto está muito otimista. Cuidado com a ilusão de fluência: achar que domina o assunto antes de testar de verdade é o maior risco. Ajuste a autocrítica." },
    { id: "cal_over_2", text: "Você está estimando acertos acima do real. Estudar com a falsa sensação de facilidade prejudica a retenção. Tente focar mais nos erros por distração." }
  ],
  calibracao_subestima: [
    { id: "cal_under_1", text: "Excelente surpresa, {userName}: seu acerto real está superando sua previsão. Você sabe mais do que pensa! Acredite na sua curva de esquecimento consolidada." },
    { id: "cal_under_2", text: "Você está subestimando seu desempenho. Confie mais no recall ativo e na estabilidade que o Anki e o FSRS criaram." }
  ],
  calibracao_calibrado: [
    { id: "cal_ok_1", text: "Sua percepção está perfeitamente alinhada com seu acerto real. Essa alta autoconsciência cognitiva permite priorizar o que realmente precisa de foco. Excelente." },
    { id: "cal_ok_2", text: "Calibração ideal, {userName}. Você conhece perfeitamente seus limites cognitivos, o que otimiza seu tempo de estudo." }
  ],
  calibracao_coletando: [
    { id: "cal_col_1", text: "Ainda estou reunindo dados. Continue informando sua previsão antes das revisões ativas para calibrarmos seu viés." }
  ],
  estado_new: [
    { id: "st_new_1", text: "Comece pequeno hoje: 1 tema já cria tração real. Depois o ritmo vem com consistência." }
  ],
  estado_current: [
    { id: "st_cur_1", text: "Ritmo estável. Mantenha o plano de hoje e preserve a curva de retenção." }
  ],
  estado_at_risk: [
    { id: "st_risk_1", text: "Seu ritmo está caindo. Faça um bloco curto agora para não perder a sequência da semana." }
  ],
  estado_dormant: [
    { id: "st_dorm_1", text: "Retome com um passo mínimo: 20 minutos e um único tema. Começar pequeno já conta como virada." }
  ],
  estado_resurrected: [
    { id: "st_res_1", text: "Boa volta. Mantenha leve hoje: um bloco curto bem feito é melhor que tentar compensar tudo." }
  ]
};

/**
 * Interpolates a string template with variables.
 */
export function interpolate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (m, key) => {
    return vars[key] !== undefined ? vars[key] : m;
  });
}

/**
 * Pures selects a randomized phrase for a situation, avoiding recent ones.
 * Updates local storage history when called (if browser context is available).
 */
export function getMentorPhrase(situation, vars, recentPhrases = [], plat = "res", tom = "neutro") {
  let options = PHRASES[situation];
  if (!options || options.length === 0) return { text: "", id: "" };

  // Filtragem por tom estrita
  if (tom) {
    const strictTone = options.filter(o => o.tone === tom);
    if (strictTone.length > 0) {
      options = strictTone;
    } else {
      options = options.filter(o => {
        if (tom === "gentil" && o.tone === "firme") return false;
        if (tom === "firme" && o.tone === "gentil") return false;
        return true;
      });
    }
  }

  let available = options.filter(o => !recentPhrases.includes(o.id));
  if (available.length === 0) {
    available = options; // fallback if all were recently used
  }

  const selected = available[Math.floor(Math.random() * available.length)];
  if (!selected) {
    return {
      text: "Força nos estudos! Vamos focar na revisão de hoje.",
      id: ""
    };
  }
  let text = selected.text;

  if (plat === "vest") {
    // Purge medical jargon
    text = text.replace(/\{especialidade\}/g, "{materia}");
    text = text.replace(/especialidade/g, "área");
    text = text.replace(/sangrando/g, "com lacunas críticas");
    text = text.replace(/MedRev/g, "Bro");
    text = text.replace(/FSRS/g, "algoritmo de revisão");
    text = text.replace(/D0→D21/g, "de estudos");
  }

  return {
    text: interpolate(text, { ...vars, materia: vars.especialidade || vars.materia }),
    id: selected.id
  };
}

export function getMentorVoice({ situation, userName, pending, streakCurrent, meta, plat, tom = "neutro", totalSessions, totalRevisoesFeitas = 0, prontidao = 0 }) {
  if (situation === "boas_vindas_diario" && Math.random() < (1 / 6)) {
    return "A única coisa que rouba o nosso conhecimento é o tempo: o que não revemos, se perde.";
  }

  const tempoEstimado = Math.round(pending * 1.5);
  const vars = { userName, pending, streakCurrent, tempoEstimado, totalRevisoesFeitas, prontidao };
  
  let key = situation;
  let effectiveTone = tom;
  const daysGap = (() => {
    if (!meta?.lastActiveDate) return 0;
    const last = new Date(meta.lastActiveDate);
    const now = new Date();
    const diffMs = now.setHours(0, 0, 0, 0) - last.setHours(0, 0, 0, 0);
    return Number.isFinite(diffMs) ? Math.max(0, Math.floor(diffMs / 86400000)) : 0;
  })();

  if (situation === "boas_vindas_diario" && daysGap >= 3) {
    key = "boas_vindas_retorno";
    effectiveTone = "gentil";
  }

  if (meta?.isExhaustedNow) {
    key = meta?.streakFreezeUsed ? "descanso_saudavel" : "descanso";
    effectiveTone = "gentil";
  }

  if (situation === "boas_vindas_diario") {
    if (meta?.isRetornoAcolhedor) {
      key = "boas_vindas_retorno";
    } else if (totalSessions === 0 || meta?.totalSessions === 0 || !meta?.lastActiveDate) {
      key = "boas_vindas_inicio";
    } else if (streakCurrent >= 3) {
      key = "boas_vindas_streak";
    } else if (pending === 0) {
      key = "boas_vindas_zerada";
    } else {
      key = "boas_vindas_pendente";
    }
  }
  
  const recent = getRecentPhrases();
  const phrase = getMentorPhrase(key, vars, recent, plat, effectiveTone);
  if (phrase.id) {
    trackRecentPhrase(phrase.id);
  }
  return phrase.text;
}

/**
 * Saves a phrase ID to the local storage recent list to avoid 7-day repetition.
 */
export function trackRecentPhrase(phraseId) {
  if (typeof window === "undefined" || !phraseId) return;
  try {
    const raw = localStorage.getItem("medrev_recent_mentor_phrases");
    let list = raw ? JSON.parse(raw) : [];
    
    // Keep last 25 phrase IDs
    list = [phraseId, ...list.filter(id => id !== phraseId)].slice(0, 25);
    localStorage.setItem("medrev_recent_mentor_phrases", JSON.stringify(list));
  } catch (e) {
    console.error("Erro ao rastrear frase recente do Mentor:", e);
  }
}

/**
 * Reads the list of recent phrase IDs from localStorage.
 */
export function getRecentPhrases() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("medrev_recent_mentor_phrases");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Runs analytics on study logs and returns diagnostic insights.
 * @param {string} userName
 * @param {Array} temas
 * @param {Array} doneReviews - Flattened list of completed review steps
 * @param {string} plat - Platform: "res" or "vest"
 * @param {Object} meta - Store meta (provasAlvo, isSegundaTentativa, areaPuxouBaixo, notaCorteAlvo)
 */
export function getMentorDiagnosis(userName, temas, doneReviews, temaStats = {}, plat = "res", meta = {}) {
  const totalSessions = doneReviews.length;

  // 1. Calibração (Dias 1-7 ou menos de 7 sessões concluídas)
  if (totalSessions < 7) {
    const rem = 7 - totalSessions;
    return {
      status: "calibracao",
      message: `Ainda estou aprendendo seu perfil. Complete mais ${rem} ${rem === 1 ? "sessão" : "sessões"} para eu gerar seu primeiro diagnóstico.`
    };
  }

  const insights = [];

  // Insight A: Horário ótimo de estudo
  const statsList = Object.values(temaStats).flat();
  if (statsList.length >= 6) {
    const morningAcc = [];
    const afternoonAcc = [];
    const nightAcc = [];

    statsList.forEach(s => {
      if (s.acerto == null || !s.completedAt) return;
      const hour = new Date(s.completedAt).getHours();
      if (hour < 12) morningAcc.push(s.acerto);
      else if (hour < 18) afternoonAcc.push(s.acerto);
      else nightAcc.push(s.acerto);
    });

    const avgMorning = morningAcc.length >= 3 ? (morningAcc.reduce((a,b)=>a+b, 0)/morningAcc.length) * 100 : null;
    const avgAfternoon = afternoonAcc.length >= 3 ? (afternoonAcc.reduce((a,b)=>a+b, 0)/afternoonAcc.length) * 100 : null;
    const avgNight = nightAcc.length >= 3 ? (nightAcc.reduce((a,b)=>a+b, 0)/nightAcc.length) * 100 : null;

    // Check which is best and compare
    if (avgMorning !== null && avgNight !== null && Math.abs(avgMorning - avgNight) >= 6) {
      if (avgMorning > avgNight) {
        insights.push({
          type: "horario",
          text: `Notei que você rende muito melhor pela manhã: ${Math.round(avgMorning)}% de acerto vs ${Math.round(avgNight)}% à noite.`,
          confidence: statsList.length >= 10 ? "alta" : "média",
          action: { type: "agendar", time: "09:00", label: "Agendar lembrete pra 09:00" }
        });
      } else {
        insights.push({
          type: "horario",
          text: `Notei que você rende muito melhor no período da noite: ${Math.round(avgNight)}% de acerto vs ${Math.round(avgMorning)}% pela manhã.`,
          confidence: statsList.length >= 10 ? "alta" : "média",
          action: { type: "agendar", time: "20:00", label: "Agendar lembrete pra 20:00" }
        });
      }
    } else if (avgAfternoon !== null && avgNight !== null && Math.abs(avgAfternoon - avgNight) >= 6) {
      if (avgAfternoon > avgNight) {
        insights.push({
          type: "horario",
          text: `Notei que você rende muito melhor no período da tarde: ${Math.round(avgAfternoon)}% de acerto vs ${Math.round(avgNight)}% à noite.`,
          confidence: statsList.length >= 10 ? "alta" : "média",
          action: { type: "agendar", time: "15:00", label: "Agendar lembrete pra 15:00" }
        });
      } else {
        insights.push({
          type: "horario",
          text: `Notei que você rende muito melhor à noite: ${Math.round(avgNight)}% de acerto vs ${Math.round(avgAfternoon)}% pela tarde.`,
          confidence: statsList.length >= 10 ? "alta" : "média",
          action: { type: "agendar", time: "20:00", label: "Agendar lembrete pra 20:00" }
        });
      }
    }
  }

  // Insight B: GARGALO de aprovação (uma área <60% reprova mesmo com outras fortes)
  const espAcc = {};
  doneReviews.forEach(r => {
    if (r.acerto == null || !r.esp) return;
    if (!espAcc[r.esp]) espAcc[r.esp] = [];
    espAcc[r.esp].push(r.acerto);
  });
  const espAvgs = Object.entries(espAcc).map(([esp, vals]) => ({
    esp,
    avg: (vals.reduce((a,b)=>a+b, 0)/vals.length) * 100,
    count: vals.length
  }));
  const gargalo = espAvgs.filter(x => x.count >= 2).sort((a,b) => a.avg - b.avg)[0];
  if (gargalo && gargalo.avg < 60) {
    insights.push({
      type: "gargalo",
      text: `${gargalo.esp} está em ${Math.round(gargalo.avg)}% — abaixo da linha de corte. Uma única área muito fraca reprova mesmo com as outras fortes. Priorize ${gargalo.esp} antes de abrir temas novos.`,
      confidence: gargalo.count >= 5 ? "alta" : "média",
      priority: 100,
      action: { type: "focar", esp: gargalo.esp, label: `Focar ${gargalo.esp} agora` }
    });
  } else if (gargalo && gargalo.avg < 75) {
    insights.push({
      type: "alerta",
      text: `Atenção com ${gargalo.esp}: média de ${Math.round(gargalo.avg)}%. Ainda dá tempo de fortalecer — revise as pendências antes de avançar.`,
      confidence: gargalo.count >= 5 ? "alta" : "média",
      priority: 60,
      action: { type: "focar", esp: gargalo.esp, label: `Focar ${gargalo.esp} agora` }
    });
  }

  // Insight C: Tendência de acerto
  const recentAcc = doneReviews.filter(r => r.acerto != null).map(r => r.acerto * 100);
  if (recentAcc.length >= 6) {
    const trendVals = recentAcc.slice(-8);
    const trend = calcTrend(trendVals);
    if (trend !== null) {
      if (trend > 0.4) {
        insights.push({
          type: "tendencia_alta",
          text: `Tendência de alta: sua precisão nas revisões subiu cerca de ${Math.round(trend * 3)}% nos últimos ciclos. Mantenha a consistência.`,
          confidence: recentAcc.length >= 10 ? "alta" : "média"
        });
      } else if (trend < -0.4) {
        insights.push({
          type: "tendencia_baixa",
          text: `Cuidado: tendência de queda de ${Math.round(Math.abs(trend) * 3)}% nos acertos recentes. Estude os erros por raciocínio.`,
          confidence: recentAcc.length >= 10 ? "alta" : "média"
        });
      }
    }
  }

  // Insight D: Viés metacognitivo
  const withConf = doneReviews.filter(r => r.confianca != null && r.acerto != null);
  if (withConf.length >= 4) {
    const avgConf = withConf.reduce((a,b) => a + b.confianca, 0) / withConf.length; // 1-5 scale
    const avgAcc = (withConf.reduce((a,b) => a + b.acerto, 0) / withConf.length) * 100;
    const confPercent = avgConf * 20; // convert 1-5 to 0-100%
    const delta = confPercent - avgAcc;

    if (delta > 15) {
      insights.push({
        type: "vies_excesso",
        text: `Viés de excesso de confiança detectado: percepção de domínio em ${Math.round(confPercent)}% vs acerto real de ${Math.round(avgAcc)}%. Seja mais autocrítico.`,
        confidence: withConf.length >= 8 ? "alta" : "média"
      });
    } else if (delta < -15) {
      insights.push({
        type: "vies_inseguranca",
        text: `Insegurança produtiva: você está acertando mais do que estima (percepção de ${Math.round(confPercent)}% vs acerto real de ${Math.round(avgAcc)}%). Confie no seu progresso.`,
        confidence: withConf.length >= 8 ? "alta" : "média"
      });
    }
  }

  // Insight E: Vestibular-specific insights
  if (plat === "vest") {
    const filtered = (meta?.provasAlvo || []).filter(p => ["UnB", "UFG"].includes(p));
    const provaAlvo = filtered[0] || "UnB";

    // E1: Segunda tentativa encouragement (early stage)
    if (meta?.isSegundaTentativa && totalSessions < 15) {
      insights.push({
        type: "horario",
        text: plat === "vest"
          ? `Segunda tentativa com método, ${userName}. Você conhece o ${provaAlvo} — agora o FSRS vai eliminar as lacunas com precisão absoluta.`
          : `Segunda tentativa com método, ${userName}. Você conhece o ${provaAlvo} — agora o FSRS vai eliminar as lacunas com precisão cirúrgica.`,
        confidence: "alta"
      });
    }

    // E2: Declared weak area still low
    if (meta?.areaPuxouBaixo) {
      const areaData = espAvgs.find(e => e.esp === meta.areaPuxouBaixo);
      if (areaData && areaData.avg < 70) {
        insights.push({
          type: "alerta",
          text: `${meta.areaPuxouBaixo} continua sendo seu ponto crítico: ${Math.round(areaData.avg)}% de acerto. A fila inteligente está priorizando ela — siga as sugestões.`,
          confidence: areaData.count >= 5 ? "alta" : "média",
          action: { type: "focar", esp: meta.areaPuxouBaixo, label: `Focar ${meta.areaPuxouBaixo} agora` }
        });
      }
    }

    // E3: Nota de corte gap warning
    if (meta?.notaCorteAlvo > 0 && gargalo && gargalo.avg < 60) {
      insights.push({
        type: "tendencia_baixa",
        text: `Com ${gargalo.esp} em ${Math.round(gargalo.avg)}%, você está em risco de não atingir a nota de corte de ${meta.notaCorteAlvo}%. Priorize essa área hoje.`,
        confidence: gargalo.count >= 5 ? "alta" : "média",
        action: { type: "focar", esp: gargalo.esp, label: `Focar ${gargalo.esp} agora` }
      });
    }
  }

  // Insight R: Reflexão sobre o Método (F4)
  try {
    const readiness = getReadinessData({ temas, simulados: useStore.getState()[plat]?.simulados || [], meta, plat });
    const priorityList = readiness?.priorityList || [];
    const redZoneAreas = priorityList.filter(p => p.zona === "vermelha");
    
    if (redZoneAreas.length > 0) {
      for (const areaObj of redZoneAreas) {
        const areaName = areaObj.area;
        const areaReviews = doneReviews.filter(r => r.esp && r.esp.toLowerCase().trim() === areaName.toLowerCase().trim() && r.acerto != null);
        if (areaReviews.length >= 2) {
          const recentAreaAcc = (areaReviews.slice(-3).reduce((sum, r) => sum + r.acerto, 0) / Math.min(3, areaReviews.length)) * 100;
          if (recentAreaAcc < 55) {
            const tomSelected = meta?.tomMentor || "gentil";
            const msg = tomSelected === "firme"
              ? `${areaName} veio abaixo de novo (média de ${Math.round(recentAreaAcc)}%). Você está fazendo o Brain Dump (D1) e as questões D4/D7, ou pulando etapas? O método protege quando seguido inteiro.`
              : `${areaName} está abaixo da meta recente (${Math.round(recentAreaAcc)}%). Lembra de seguir o método completo: o Brain Dump (D1) e as questões (D4/D7) são fundamentais para segurar a curva. O método te protege se você o seguir inteiro.`;
            
            insights.push({
              type: "alerta",
              text: msg,
              confidence: "alta",
              action: { type: "focar", esp: areaName, label: `Revisar ${areaName}` }
            });
            break;
          }
        }
      }
    }
  } catch (err) {
    console.error("Erro ao calcular insight de reflexao_metodo:", err);
  }

  // Insight EP: Error pattern detection
  const errPatterns = detectErrorPatterns(doneReviews);
  errPatterns.forEach(pat => {
    const espCount = espAcc[pat.esp]?.length || 0;
    insights.push({
      type: "tendencia_baixa",
      text: pat.text,
      confidence: espCount >= 5 ? "alta" : "média",
      action: { type: "focar", esp: pat.esp, label: `Focar ${pat.esp} agora` }
    });
  });

  // Insight EH: Exhaustion detection / Guardrail de Bem-estar (Parte 9)
  const sortedStats = statsList
    .filter(s => s && s.completedAt)
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

  let consecutiveExhausted = 0;
  let hasExhaustion = false;
  for (let i = 0; i < sortedStats.length; i++) {
    const s = sortedStats[i];
    const dateObj = new Date(s.completedAt);
    const hour = dateObj.getHours();
    const isNight = hour >= 23 || hour < 5;
    const isHighAnxiety = s.ansiedade === "Alta" || s.ansiedade === "alta";
    if (isNight && isHighAnxiety) {
      consecutiveExhausted++;
      if (consecutiveExhausted >= 3) {
        hasExhaustion = true;
      }
    } else {
      consecutiveExhausted = 0;
    }
  }

  if (hasExhaustion) {
    insights.push({
      type: "alerta",
      text: "Vi 3 noites seguidas de estudo tarde com ansiedade alta. Rendimento cai e retenção também. Hoje, durma — é estratégia, não preguiça.",
      confidence: "alta",
      action: { type: "aliviar", label: "Aliviar minha fila de amanhã" }
    });
  }

  // Fallback se não disparar nenhum insight específico
  if (insights.length === 0) {
    insights.push({
      type: "geral",
      text: "Seu ritmo de estudos está equilibrado. Continue alimentando o FSRS diariamente para calibrarmos ainda mais os alertas."
    });
  }

  const hasTendenciaBaixa = insights.some((ins) => ins.type === "tendencia_baixa");
  const hasViesExcesso = insights.some((ins) => ins.type === "vies_excesso");
  if (hasTendenciaBaixa || hasViesExcesso) {
    insights.push({
      type: "fluencia",
      text: "Dificuldade e erro com recuperação ativa são sinais de aprendizado real. Evite releitura passiva e siga no esforço ativo.",
      confidence: "média",
      priority: 70
    });
  }

  // 2. Diagnóstico Completo (Dias 30+ ou 30 sessões concluídas)
  let projInfo = null;
  if (totalSessions >= 30) {
    const allAccs = doneReviews.filter(r => r.acerto != null).map(r => r.acerto * 100);
    const projScore = calcProjecao(allAccs, 5);
    projInfo = {
      score: projScore,
      text: projScore >= 80 
        ? `Projeção de aprovação de ${projScore}% — acima da meta crítica. Mantenha a blindagem de estudos.`
        : `Projeção atual em ${projScore}%. Precisamos elevar as revisões ativas de pontos fracos para cruzar a meta de 80%.`
    };
  }

  const prioritizedInsights = insights
    .map((ins) => ({ priority: 50, ...ins }))
    .sort((a, b) => (b.priority || 50) - (a.priority || 50))
    .map(({ priority, ...rest }) => rest);

  return {
    status: totalSessions >= 30 ? "completo" : "ativo",
    insights: prioritizedInsights.slice(0, 3), // limit to top 3 insights
    projection: projInfo
  };
}

export function isExhaustionDetected(temaStats = {}, doneReviews = []) {
  const currentHour = new Date().getHours();
  const isNight = currentHour >= 22 || currentHour < 5;
  if (!isNight) return false;

  const statsList = Object.values(temaStats).flat();
  const sortedStats = statsList
    .filter(s => s && s.completedAt)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  if (sortedStats.length === 0) return false;
  const recentStat = sortedStats[0];
  const isRecentAnxietyHigh = recentStat.ansiedade === "Alta" || recentStat.ansiedade === "alta";
  if (!isRecentAnxietyHigh) return false;

  const recentAcc = doneReviews.filter(r => r.acerto != null).map(r => r.acerto * 100);
  if (recentAcc.length >= 4) {
    const trendVals = recentAcc.slice(-6);
    const trend = calcTrend(trendVals);
    if (trend !== null && trend < 0) {
      return true;
    }
  }

  return isNight && isRecentAnxietyHigh;
}

