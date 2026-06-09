// src/constants/caseInstances.js
// Banco de Case Instances (vinhetas/instâncias clínicas) de raciocínio clínico.

import { generatedCaseInstances } from "./generatedClinicalCases";

const baseCaseInstances = [
  {
    id: "apendicite-classica",
    scriptId: "apendicite-classica",
    vignette: "Homem, 24 anos, dor periumbilical há 18h que migrou para fossa ilíaca direita, anorexia, náusea e febre baixa.",
    presentation: "typical",
    keyFeatureAnswers: ["USG de abdome", "USG/TC de abdome se dúvida"],
    expertReasoningTrace: [
      "Identificar quadro de dor abdominal aguda com migração típica para fossa ilíaca direita (qualificador temporal agudo).",
      "Reconhecer sinais de irritação peritoneal localizada (Blumberg positivo em fossa ilíaca direita).",
      "Valorizar hiporexia/anorexia como sinal clássico de apendicite aguda.",
      "Considerar exames laboratoriais (hemograma e urina EAS) e imagem (ultrassonografia abdominal de preferência ou TC se necessário)."
    ]
  },
  {
    id: "pre-eclampsia-grave",
    scriptId: "pre-eclampsia-grave",
    vignette: "Gestante 34 sem, PA 165/110, cefaleia e escotomas, proteinúria significativa.",
    presentation: "typical",
    keyFeatureAnswers: ["Administração de sulfato de magnésio", "Sulfato de magnésio"],
    expertReasoningTrace: [
      "Identificar hipertensão grave (PA >= 160/110 mmHg) em gestante após a 20ª semana.",
      "Valorizar a presença de sintomas de iminência de eclâmpsia (cefaleia refratária e escotomas visuais).",
      "Iniciar profilaxia de convulsões imediatamente com sulfato de magnésio pelo esquema adequado.",
      "Monitorar reflexos patelares, frequência respiratória e débito urinário durante a infusão do magnésio.",
      "Programar a interrupção da gestação após estabilização materna."
    ]
  },
  {
    id: "dor-toracica-coronariana",
    scriptId: "dor-toracica-coronariana",
    vignette: "Homem, 58 anos, tabagista e hipertenso, com dor retroesternal em aperto há 40 min, irradiando para MSE, associada a sudorese.",
    presentation: "typical",
    keyFeatureAnswers: ["Eletrocardiograma (ECG)", "ECG", "ECG seriado"],
    expertReasoningTrace: [
      "Reconhecer dor torácica de características anginosas típicas em paciente com múltiplos fatores de risco cardiovascular.",
      "Solicitar e interpretar o eletrocardiograma (ECG) em até 10 minutos da admissão hospitalar.",
      "Diferenciar IAM com supra de ST (indicação de reperfusão imediata) de IAM sem supra/angina instável.",
      "Administrar terapia antiagregante dupla (AAS + inibidor de P2Y12) e anticoagulação plena.",
      "Excluir diagnósticos diferenciais graves, como dissecção de aorta, TEP e pericardite."
    ]
  },
  {
    id: "trauma-abdominal",
    scriptId: "trauma-abdominal",
    vignette: "Homem, 27 anos, apos colisao automobilistica, com dor abdominal difusa, equimose em cinto de seguranca e taquicardia.",
    presentation: "typical",
    keyFeatureAnswers: ["FAST (Focused Assessment with Sonography for Trauma)", "FAST"],
    expertReasoningTrace: [
      "Avaliar o paciente sistematicamente de acordo com o protocolo ABCDE do trauma.",
      "Valorizar o sinal do cinto de segurança e a taquicardia como marcadores de potencial lesão intra-abdominal severa.",
      "Realizar ultrassom FAST à beira do leito para detecção de líquido livre peritoneal/pericárdico.",
      "Definir a conduta baseada na estabilidade hemodinâmica (estável vai para TC de abdome; instável com FAST positivo vai para laparotomia)."
    ]
  },
  {
    id: "sindromes-hipertensivas-gestacao",
    scriptId: "sindromes-hipertensivas-gestacao",
    vignette: "Gestante de 32 semanas, PA 170/110, cefaleia intensa, escotomas e dor em hipocondrio direito.",
    presentation: "typical",
    keyFeatureAnswers: ["Sulfato de magnésio", "Sulfato de magnesio"],
    expertReasoningTrace: [
      "Reconhecer critérios para pré-eclâmpsia com sinais de gravidade (PA sistólica >= 160 ou diastólica >= 110 acompanhada de cefaleia grave, alteração visual ou dor abdominal no quadrante superior direito).",
      "Reconhecer que dor em hipocôndrio direito reflete distensão da cápsula de Glisson (iminência de ruptura hepática / HELLP).",
      "Indicar internação imediata em unidade de terapia intensiva ou obstétrica de alto risco.",
      "Administrar sulfato de magnésio para prevenção de eclâmpsia e planejar controle pressórico cuidadoso."
    ]
  },
  {
    id: "diarreia-aguda-pediatria",
    scriptId: "diarreia-aguda-pediatria",
    vignette: "Lactente de 14 meses com 2 dias de diarreia aquosa, 6 episodios nas ultimas 24h, vomitos e sinais leves de desidratacao.",
    presentation: "typical",
    keyFeatureAnswers: ["Terapia de reidratação oral (TRO)", "TRO", "Reidratação oral"],
    expertReasoningTrace: [
      "Classificar o grau de desidratação da criança baseado em sinais clínicos (olhos fundos, saliva, choro, elasticidade da pele).",
      "Iniciar terapia de reidratação oral (TRO) sob supervisão na unidade de saúde como primeira linha.",
      "Prescrever suplementação de zinco por 10 a 14 dias para redução da duração e recorrência dos episódios.",
      "Orientar a manutenção da amamentação e alimentação habitual, e ensinar sinais de alerta para retorno imediato."
    ]
  },
  {
    id: "atencao-primaria-saude",
    scriptId: "atencao-primaria-saude",
    vignette: "Mulher, 52 anos, hipertensa e diabetica, procura a UBS por piora do controle e dificuldade de acesso aos retornos.",
    presentation: "typical",
    keyFeatureAnswers: ["Longitudinalidade do cuidado", "Longitudinalidade"],
    expertReasoningTrace: [
      "Identificar as barreiras organizacionais e socioeconômicas que impedem o cuidado continuado na APS.",
      "Analisar o caso sob a perspectiva dos atributos essenciais da Atenção Primária (Acesso, Longitudinalidade, Coordenação, Integralidade).",
      "Pactuar um Plano Terapêutico Singular (PTS) compartilhado com a equipe multiprofissional (médico, enfermeiro, ACS, NASF).",
      "Garantir a coordenação do cuidado, integrando fluxos de contrarreferência e facilitando a continuidade longitudinal."
    ]
  },
  {
    id: "apendicite-atypical",
    scriptId: "apendicite-classica",
    vignette: "Mulher, 72 anos, diabética, com dor abdominal difusa e vaga há 3 dias, febre de 37.7°C, confusão mental leve e desidratação, sem sinais clássicos de peritonite.",
    presentation: "atypical",
    keyFeatureAnswers: ["TC de abdome", "Ultrassonografia ou TC de abdome"],
    expertReasoningTrace: [
      "Reconhecer que pacientes idosos e diabéticos apresentam sintomas atípicos de apendicite aguda (ausência de migração típica da dor, febre discreta ou ausente).",
      "Valorizar a presença de dor abdominal vaga e sinais sistêmicos inespecíficos como equivalentes de peritonite localizada ou sepse inicial.",
      "Considerar TC de abdome como exame de escolha devido à menor acurácia do exame físico e USG em idosos.",
      "Iniciar antibioticoterapia de amplo espectro precocemente."
    ]
  },
  {
    id: "dor-toracica-atypical",
    scriptId: "dor-toracica-coronariana",
    vignette: "Mulher, 65 anos, diabética, com queixa de náuseas, sudorese fria e fadiga súbita há 1 hora, sem dor no peito.",
    presentation: "atypical",
    keyFeatureAnswers: ["Eletrocardiograma (ECG)", "ECG"],
    expertReasoningTrace: [
      "Reconhecer equivalente anginoso (náuseas, sudorese, dispneia, fadiga) em paciente idosa e diabética.",
      "Realizar eletrocardiograma (ECG) em até 10 minutos para descartar infarto agudo do miocárdio, mesmo sem queixa de dor.",
      "Valorizar fatores de risco cardiovascular estabelecidos."
    ]
  }
];

export const caseInstances = [...baseCaseInstances, ...generatedCaseInstances];
