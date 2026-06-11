import React, { useMemo, useState } from "react";
import { Brain, CalendarDays, Compass, SkipForward } from "lucide-react";
import { getRecommendedDefaultsForGoal } from "../core/onboarding";
import { MotionPresence, MotionProgressBar, MotionStep } from "./motion";

const GOAL_OPTIONS = [
  { id: "enamed", label: "ENAMED", hint: "Prioriza trilha ENAMED e recomendações por área." },
  { id: "residencia", label: "Residência médica", hint: "Prioriza plano de residência e rotina clínica." },
  { id: "ambos", label: "Os dois", hint: "Combina ENAMED e residência no mesmo fluxo." },
];

const CALENDAR_OPTIONS = [
  { id: "medcof", label: "Cronogramas prontos", hint: "Base pronta para começar agora." },
  { id: "estrategia_extensivo_user", label: "Estratégia MED", hint: "Importe seu calendário ou configure depois." },
  { id: "custom", label: "Personalizado", hint: "Monte seu plano manualmente." },
];

const MODE_OPTIONS = [
  { id: "mentor", label: "Modo Mentor recomendado", hint: "O app escolhe a próxima melhor ação." },
  { id: "manual", label: "Modo Manual", hint: "Você vê mais painéis e decide o fluxo." },
];

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
      <p className="text-[11px] text-gray-400 mt-1">{hint}</p>
    </button>
  );
}

export default function OnboardingWizard({ onComplete, onSkip, onOpenImport }) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("enamed");
  const [calendarProvider, setCalendarProvider] = useState("medcof");
  const [startMode, setStartMode] = useState("mentor");
  const [showSkipWarn, setShowSkipWarn] = useState(false);

  const recommended = useMemo(() => getRecommendedDefaultsForGoal(goal), [goal]);

  const payload = {
    step: 2,
    goal,
    calendarProvider,
    mentorMode: startMode === "mentor",
    modules: {
      ...recommended.modules,
      raciocinioClinico: true,
    },
    completed: true,
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#05050d]/95 backdrop-blur-md p-4 overflow-y-auto">
      <div className="min-h-full flex items-start sm:items-center justify-center">
        <div className="w-full max-w-xl bg-[#0f0f19] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-blue-300 font-black">Primeiros 2 minutos</p>
              <h2 className="text-xl font-black text-white">Vamos configurar seu início</h2>
            </div>
            <span className="text-[11px] text-gray-400 font-bold">{step + 1}/3</span>
          </div>

          <MotionProgressBar value={((step + 1) / 3) * 100} className="h-1.5 rounded-full bg-white/5 overflow-hidden" />

          <MotionPresence>
          <MotionStep stepKey={step} className="min-h-[190px]">
          {step === 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-blue-300" />
                <h3 className="text-sm font-bold text-white">Qual é seu foco agora?</h3>
              </div>
              <div className="space-y-2">
                {GOAL_OPTIONS.map((item) => (
                  <ChoiceCard
                    key={item.id}
                    selected={goal === item.id}
                    label={item.label}
                    hint={item.hint}
                    onClick={() => setGoal(item.id)}
                  />
                ))}
              </div>
              <p className="text-[11px] text-gray-500">Isso muda o peso das recomendações do Mentor. Você pode alterar depois.</p>
            </section>
          )}

          {step === 1 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-blue-300" />
                <h3 className="text-sm font-bold text-white">Como você quer organizar os temas?</h3>
              </div>
              <div className="space-y-2">
                {CALENDAR_OPTIONS.map((item) => (
                  <ChoiceCard
                    key={item.id}
                    selected={calendarProvider === item.id}
                    label={item.label}
                    hint={item.hint}
                    onClick={() => setCalendarProvider(item.id)}
                  />
                ))}
              </div>
              {calendarProvider === "estrategia_extensivo_user" && (
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
                  <p className="text-[11px] text-blue-100">Você pode importar agora ou configurar depois sem travar o acesso.</p>
                  {onOpenImport && (
                    <button
                      type="button"
                      onClick={onOpenImport}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold border-none cursor-pointer"
                    >
                      Importar agora
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          {step === 2 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-blue-300" />
                <h3 className="text-sm font-bold text-white">Como você quer começar?</h3>
              </div>
              <div className="space-y-2">
                {MODE_OPTIONS.map((item) => (
                  <ChoiceCard
                    key={item.id}
                    selected={startMode === item.id}
                    label={item.label}
                    hint={item.hint}
                    onClick={() => setStartMode(item.id)}
                  />
                ))}
              </div>
            </section>
          )}
          </MotionStep>
          </MotionPresence>

          {showSkipWarn && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3">
              <p className="text-[11px] text-amber-100">
                Você pode pular, mas o Mentor terá menos contexto.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                if (step === 2) {
                  if (onComplete) onComplete(payload);
                  return;
                }
                setStep((value) => Math.min(2, value + 1));
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-[12px] font-bold border-none cursor-pointer"
            >
              {step === 2 ? "Entrar no MedRev" : "Continuar"}
            </button>

            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((value) => Math.max(0, value - 1))}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-[12px] font-bold border border-white/10 cursor-pointer"
              >
                Voltar
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (!showSkipWarn) {
                  setShowSkipWarn(true);
                  return;
                }
                if (onSkip) onSkip(payload);
              }}
              className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 text-[12px] font-bold border border-white/10 cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <SkipForward size={13} /> Pular
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
