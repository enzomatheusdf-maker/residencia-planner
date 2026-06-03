import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarDays,
  CheckCircle,
  Clock,
  Compass,
  SkipForward,
  Target,
  Zap,
} from "lucide-react";
import { useStore } from "../core/store";
import { todayStr } from "../core/fsrs";
import { buildInitialPlanSetup, completePlanSetupPayload } from "../core/onboardingEngine";
import { calculateFeasibility } from "../core/scheduleWizard";

const TOTAL_STEPS = 7;

const DEFAULT_STUDY_DAYS = {
  dom: { active: false, maxNewTopics: 0 },
  seg: { active: true,  maxNewTopics: 3 },
  ter: { active: true,  maxNewTopics: 3 },
  qua: { active: true,  maxNewTopics: 3 },
  qui: { active: true,  maxNewTopics: 3 },
  sex: { active: true,  maxNewTopics: 3 },
  sab: { active: false, maxNewTopics: 0 },
};

const DAY_LABELS = {
  dom: "Dom", seg: "Seg", ter: "Ter", qua: "Qua",
  qui: "Qui", sex: "Sex", sab: "Sab",
};

const VEST_EXAMS = [
  { id: "enem",    label: "ENEM" },
  { id: "fuvest",  label: "Fuvest" },
  { id: "unicamp", label: "Unicamp" },
  { id: "outra",   label: "Outra" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChoiceCard({ selected, label, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-3 transition-all cursor-pointer ${
        selected
          ? "bg-blue-500/15 border-blue-500/30 text-white"
          : "bg-black/25 border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/[0.03]"
      }`}
    >
      <p className="text-[12px] font-black">{label}</p>
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </button>
  );
}

function FeasibilityBadge({ status }) {
  const map = {
    comfortable: ["bg-green-500/15 border-green-500/30 text-green-300",  "Confortável"],
    feasible:    ["bg-blue-500/15 border-blue-500/30 text-blue-300",     "Viável"],
    tight:       ["bg-amber-500/15 border-amber-500/30 text-amber-300",  "Apertado"],
    infeasible:  ["bg-red-500/15 border-red-500/30 text-red-300",        "Inviável"],
  };
  const [cls, label] = map[status] || map.feasible;
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      {label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingWizardV2({ onComplete, onSkip }) {
  const [step,          setStep]          = useState(0);
  const [track,         setTrack]         = useState("res");
  const [horizonMode,   setHorizonMode]   = useState("duration");
  const [horizonMonths, setHorizonMonths] = useState(6);
  const [targetDate,    setTargetDate]    = useState("");
  const [targetExam,    setTargetExam]    = useState("enem");
  const [fonteMode,     setFonteMode]     = useState("medrev_base");
  const [studyDays,     setStudyDays]     = useState(DEFAULT_STUDY_DAYS);
  const [scopeMode,     setScopeMode]     = useState("essential");
  const [feasibility,   setFeasibility]   = useState(null);
  const [firstAction,   setFirstAction]   = useState(null);
  const [finalTopics,   setFinalTopics]   = useState([]);
  const [showSkipWarn,  setShowSkipWarn]  = useState(false);

  const calendarProvider   = useStore((s) => s.calendarProvider);
  const completePlanSetup  = useStore((s) => s.completePlanSetup);
  const setOnboardingTrack = useStore((s) => s.setOnboardingTrack);
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  const fonteTopics = useMemo(() => {
    if (fonteMode === "manual" || fonteMode === "ja_domino") return [];
    const imported = calendarProvider?.importedTopics || [];
    const custom   = calendarProvider?.customTopics   || [];
    return imported.length > 0 ? imported : custom;
  }, [calendarProvider, fonteMode]);

  const buildPlanSetup = useCallback(() => {
    return buildInitialPlanSetup({
      startDate:      todayStr(),
      targetDate:     horizonMode === "target_date" && targetDate ? targetDate : null,
      horizonMode,
      horizonMonths,
      studyDays,
      scopeMode,
      focusMode:    fonteMode,
      institutions: track === "res" ? ["ENAMED"] : [targetExam],
    });
  }, [horizonMode, targetDate, horizonMonths, studyDays, scopeMode, fonteMode, track, targetExam]);

  // Compute feasibility when on StepPreview
  useEffect(() => {
    if (step !== 5) return;
    const ps = buildPlanSetup();
    setFeasibility(calculateFeasibility(ps, fonteTopics));
  }, [step, buildPlanSetup, fonteTopics]);

  // Compute first action when on StepPrimeiraAcao
  useEffect(() => {
    if (step !== 6) return;
    const ps = buildPlanSetup();
    const payload = completePlanSetupPayload(ps, fonteTopics, undefined, todayStr());
    setFirstAction(payload.firstAction);
    setFinalTopics(payload.scheduledTopics);
  }, [step, buildPlanSetup, fonteTopics]);

  function handleNext() {
    if (step === 0) setOnboardingTrack(track);
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  function handleComplete() {
    const ps = { ...buildPlanSetup(), completedAt: todayStr() };
    completePlanSetup(ps, finalTopics);
    // compat vestibularStart para gate v1
    if (track === "vest") {
      useStore.setState((state) => ({
        meta: {
          ...state.meta,
          vestibularStart: {
            completed: true,
            targetExam,
            examDate: targetDate || null,
            planMode: "mentor",
            completedAt: todayStr(),
          },
        },
      }));
    }
    if (onComplete) onComplete();
  }

  function handleSkip() {
    completeOnboarding({ source: "skipped", version: 2, completed: true });
    if (onSkip) onSkip({});
  }

  function toggleDay(key) {
    setStudyDays((prev) => ({
      ...prev,
      [key]: { ...prev[key], active: !prev[key].active },
    }));
  }

  function setDayTopics(key, value) {
    setStudyDays((prev) => ({
      ...prev,
      [key]: { ...prev[key], maxNewTopics: Math.max(1, Math.min(8, value)) },
    }));
  }

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <div className="fixed inset-0 z-[110] bg-[#05050d]/95 backdrop-blur-md p-4 overflow-y-auto">
      <div className="min-h-full flex items-start sm:items-center justify-center">
        <div className="w-full max-w-xl bg-[#0f0f19] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">

          {/* Cabeçalho */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-blue-300 font-black">Configurar plano</p>
              <h2 className="text-xl font-black text-white">Monte seu cronograma</h2>
            </div>
            <span className="text-[11px] text-gray-400 font-bold">{step + 1}/{TOTAL_STEPS}</span>
          </div>

          {/* Barra de progresso */}
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-sky-500 transition-all"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>

          {/* ── Passo 0: Objetivo ─────────────────────────────── */}
          {step === 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-blue-300" />
                <h3 className="text-sm font-bold text-white">Qual é seu objetivo agora?</h3>
              </div>
              <div className="space-y-2">
                <ChoiceCard
                  selected={track === "res"}
                  label="Residência / ENAMED"
                  hint="Prioriza plano de residência médica e trilha ENAMED."
                  onClick={() => setTrack("res")}
                />
                <ChoiceCard
                  selected={track === "vest"}
                  label="Vestibular"
                  hint="Foco em ENEM, Fuvest, Unicamp ou outro vestibular."
                  onClick={() => setTrack("vest")}
                />
              </div>
              <p className="text-[11px] text-gray-500">Você pode alterar isso depois nas configurações.</p>
            </section>
          )}

          {/* ── Passo 1: Data-alvo ────────────────────────────── */}
          {step === 1 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-blue-300" />
                <h3 className="text-sm font-bold text-white">
                  {track === "vest" ? "Qual é sua prova e quando ela ocorre?" : "Quando é sua prova?"}
                </h3>
              </div>

              {track === "vest" && (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">Prova-alvo</p>
                  <div className="grid grid-cols-2 gap-2">
                    {VEST_EXAMS.map((ex) => (
                      <ChoiceCard
                        key={ex.id}
                        selected={targetExam === ex.id}
                        label={ex.label}
                        onClick={() => setTargetExam(ex.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <ChoiceCard
                  selected={horizonMode === "target_date"}
                  label="Tenho uma data específica"
                  hint="Vou informar a data da prova."
                  onClick={() => setHorizonMode("target_date")}
                />
                {horizonMode === "target_date" && (
                  <input
                    type="date"
                    value={targetDate}
                    min={todayStr()}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                )}
                <ChoiceCard
                  selected={horizonMode === "duration"}
                  label="Não sei ainda — estudar por alguns meses"
                  hint="Defina a duração aproximada do plano."
                  onClick={() => setHorizonMode("duration")}
                />
                {horizonMode === "duration" && (
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[11px] text-gray-400">Duração:</span>
                    {[3, 6, 9, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setHorizonMonths(m)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                          horizonMonths === m
                            ? "bg-blue-500/20 border-blue-500/40 text-blue-200"
                            : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Passo 2: Fonte do plano ───────────────────────── */}
          {step === 2 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-300" />
                <h3 className="text-sm font-bold text-white">De onde vem seu cronograma?</h3>
              </div>
              <div className="space-y-2">
                <ChoiceCard
                  selected={fonteMode === "medrev_base"}
                  label={track === "vest" ? "Base MedRev Vestibular" : "Base MedRev (temas importados)"}
                  hint="Usa os temas que você já importou ou o cronograma padrão."
                  onClick={() => setFonteMode("medrev_base")}
                />
                <ChoiceCard
                  selected={fonteMode === "import_text"}
                  label="Importar cronograma (texto / CSV)"
                  hint="Cole ou carregue seu cronograma do cursinho. Pode fazer depois."
                  onClick={() => setFonteMode("import_text")}
                />
                <ChoiceCard
                  selected={fonteMode === "manual"}
                  label="Montar manualmente"
                  hint="Você vai adicionar os temas um a um depois."
                  onClick={() => setFonteMode("manual")}
                />
                {track === "res" && (
                  <ChoiceCard
                    selected={fonteMode === "ja_domino"}
                    label="Já domino — só quero revisar"
                    hint="Sem tópicos novos por enquanto. Use o FSRS puro para revisão."
                    onClick={() => setFonteMode("ja_domino")}
                  />
                )}
              </div>
              {fonteMode === "import_text" && (
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
                  <p className="text-[11px] text-blue-100">
                    Vá em Plano para importar via CSV ou texto. Você pode fazer isso agora ou após concluir a configuração.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* ── Passo 3: Dias e carga ─────────────────────────── */}
          {step === 3 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-300" />
                <h3 className="text-sm font-bold text-white">Quando você estuda?</h3>
              </div>
              <p className="text-[11px] text-gray-400">
                Ative os dias e defina quantos tópicos novos por dia.
                Revisões entram automaticamente — não precisam ser contadas aqui.
              </p>
              <div className="space-y-2">
                {Object.entries(DAY_LABELS).map(([key, label]) => {
                  const day = studyDays[key];
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleDay(key)}
                        className={`w-12 shrink-0 text-center rounded-lg py-1.5 text-[11px] font-bold border transition-colors ${
                          day.active
                            ? "bg-blue-500/20 border-blue-500/40 text-blue-200"
                            : "bg-white/5 border-white/10 text-gray-500"
                        }`}
                      >
                        {label}
                      </button>
                      {day.active && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDayTopics(key, day.maxNewTopics - 1)}
                            className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-5 text-center text-sm font-bold text-white">
                            {day.maxNewTopics}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDayTopics(key, day.maxNewTopics + 1)}
                            className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                          <span className="text-[10px] text-gray-500">tópicos/dia</span>
                          {day.maxNewTopics > 6 && (
                            <span className="text-[10px] text-amber-400 font-bold">alto</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Passo 4: Escopo ───────────────────────────────── */}
          {step === 4 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-blue-300" />
                <h3 className="text-sm font-bold text-white">Quanto você quer cobrir?</h3>
              </div>
              <div className="space-y-2">
                <ChoiceCard
                  selected={scopeMode === "essential"}
                  label="Essencial (recomendado)"
                  hint="Tópicos CRÍTICOS e ALTOS do cronograma. Cobre o que mais cai nas provas."
                  onClick={() => setScopeMode("essential")}
                />
                <ChoiceCard
                  selected={scopeMode === "complete"}
                  label="Completo"
                  hint="Todos os tópicos, incluindo os de menor peso. Requer mais tempo."
                  onClick={() => setScopeMode("complete")}
                />
                <ChoiceCard
                  selected={scopeMode === "intensive"}
                  label="Intensivo"
                  hint="Todos os tópicos com carga máxima. Só para quem tem muito tempo disponível."
                  onClick={() => setScopeMode("intensive")}
                />
              </div>
            </section>
          )}

          {/* ── Passo 5: Preview / Viabilidade ───────────────── */}
          {step === 5 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-blue-300" />
                <h3 className="text-sm font-bold text-white">Verificando viabilidade do plano</h3>
              </div>

              {fonteTopics.length === 0 ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 space-y-2">
                  <p className="text-[12px] font-bold text-amber-200">Sem cronograma importado ainda</p>
                  <p className="text-[11px] text-amber-100/80">
                    {fonteMode === "manual"
                      ? "Você vai adicionar os temas manualmente depois."
                      : fonteMode === "ja_domino"
                      ? "Nenhum tópico novo — só revisões FSRS."
                      : "Importe um cronograma em Plano para ativar a análise de viabilidade."}
                  </p>
                  <p className="text-[11px] text-amber-100/60">
                    Continue para concluir a configuração — você pode importar depois.
                  </p>
                </div>
              ) : feasibility && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-gray-400">Status do plano</p>
                        <p className="text-lg font-black text-white">{feasibility.totalTopics} tópicos</p>
                      </div>
                      <FeasibilityBadge status={feasibility.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <p className="text-gray-500">Capacidade disponível</p>
                        <p className="font-bold text-white">{feasibility.availableCapacity} vagas</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Relação tópicos/vagas</p>
                        <p className="font-bold text-white">{Math.round(feasibility.ratio * 100)}%</p>
                      </div>
                    </div>
                  </div>

                  {feasibility.warnings.length > 0 && (
                    <div className="space-y-1.5">
                      {feasibility.warnings.map((w) => (
                        <div
                          key={w.code}
                          className={`rounded-lg border p-2.5 text-[11px] ${
                            w.severity === "error"
                              ? "border-red-500/25 bg-red-500/10 text-red-200"
                              : "border-amber-500/25 bg-amber-500/10 text-amber-200"
                          }`}
                        >
                          {w.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {feasibility.status === "infeasible" && (
                    <p className="text-[11px] text-gray-400">
                      Dica: volte e reduza o escopo para "Essencial" ou aumente os dias/tópicos por dia.
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ── Passo 6: Primeira ação ────────────────────────── */}
          {step === 6 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400" />
                <h3 className="text-sm font-bold text-white">Seu plano está pronto</h3>
              </div>

              <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 space-y-2">
                <p className="text-[11px] text-green-300 font-bold uppercase tracking-wide">
                  {finalTopics.length > 0
                    ? `${finalTopics.length} tópicos distribuídos`
                    : "Plano configurado"}
                </p>
                {firstAction && !firstAction.isUpcoming ? (
                  <div>
                    <p className="text-[12px] text-white font-bold">
                      Hoje: {firstAction.temaNome || "Primeiro tópico do plano"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      ~{firstAction.estimatedMinutes} min de estudo inicial (D0)
                    </p>
                  </div>
                ) : firstAction && firstAction.isUpcoming ? (
                  <div>
                    <p className="text-[12px] text-white font-bold">
                      Próximo: {firstAction.temaNome || "Primeiro tópico do plano"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Agendado para {firstAction.scheduledDate}
                    </p>
                  </div>
                ) : (
                  <p className="text-[12px] text-white">
                    Importe um cronograma e o Mentor escolherá a próxima ação.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-1.5">
                {[
                  "Revisões FSRS geradas automaticamente após cada estudo",
                  track === "res"
                    ? "Mentor ativo — escolhe a melhor próxima ação"
                    : "Plano vestibular sem conteúdo clínico / ENAMED",
                  "Acesse Plano e veja a sub-aba Agenda para o calendário",
                ].map((line, i) => (
                  <p key={i} className="text-[11px] text-gray-400 flex items-start gap-1.5">
                    <span className="text-blue-400 mt-0.5 shrink-0">—</span>
                    {line}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Aviso de skip */}
          {showSkipWarn && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3">
              <p className="text-[11px] text-amber-100">
                Você pode pular, mas o Mentor terá menos contexto para recomendar ações.
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={isLastStep ? handleComplete : handleNext}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-[12px] font-bold border-none cursor-pointer"
            >
              {isLastStep ? "Começar agora" : "Continuar"}
            </button>

            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-[12px] font-bold border border-white/10 cursor-pointer"
              >
                Voltar
              </button>
            )}

            {!isLastStep && (
              <button
                type="button"
                onClick={() => {
                  if (!showSkipWarn) { setShowSkipWarn(true); return; }
                  handleSkip();
                }}
                className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 text-[12px] font-bold border border-white/10 cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <SkipForward size={13} /> Pular tudo
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
