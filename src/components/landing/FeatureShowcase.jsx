import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Brain, CalendarDays, Check, ClipboardCheck, FileSearch, Layers, Stethoscope } from "lucide-react";
import { SectionIntro } from "./primitives";

const tabs = [
  {
    value: "plano",
    label: "Plano",
    icon: CalendarDays,
    headline: "Seu cronograma vira fila executável.",
    bullets: ["Temas distribuídos até a prova", "Prioridade ajustada ao desempenho", "Importa ou monta do zero"],
    mockup: (
      <div className="space-y-2">
        {["Cardiologia — semana 3", "Pediatria — semana 4", "Cirurgia — semana 4"].map((t) => (
          <div key={t} className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-xs text-slate-300">
            <CalendarDays size={13} className="shrink-0 text-blue-300" />
            {t}
          </div>
        ))}
      </div>
    ),
  },
  {
    value: "fsrs",
    label: "FSRS",
    icon: Layers,
    headline: "Revisões por tema no momento certo.",
    bullets: ["D0, D1, D4, D7, D21 por tema", "Teste de domínio antes de marcar como dominado", "Sem checklist infinito"],
    mockup: (
      <div className="flex flex-wrap gap-2">
        {[["D0", "blue"], ["D1", "cyan"], ["D4", "purple"], ["D7", "emerald"], ["D21", "slate"]].map(([d, c]) => (
          <span key={d} className={`rounded-full border px-3 py-1.5 text-[11px] font-black border-${c}-400/25 bg-${c}-400/10 text-${c}-200`}>{d}</span>
        ))}
        <div className="mt-3 w-full rounded-xl border border-white/8 bg-black/20 p-3 text-xs text-slate-400">
          Próxima revisão: Pré-eclâmpsia (D7) — amanhã
        </div>
      </div>
    ),
  },
  {
    value: "erros",
    label: "Erros",
    icon: ClipboardCheck,
    headline: "Cada erro aponta uma ação.",
    bullets: ["Classifica por tipo (conteúdo, raciocínio, interpretação)", "Vira tarefa de correção", "Alimenta a prioridade do plano"],
    mockup: (
      <div className="space-y-2">
        {[
          { tipo: "Conteúdo", qtd: "4 erros", cor: "red" },
          { tipo: "Raciocínio", qtd: "3 erros", cor: "amber" },
          { tipo: "Interpretação", qtd: "1 erro", cor: "orange" },
        ].map(({ tipo, qtd, cor }) => (
          <div key={tipo} className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-xs">
            <span className="text-slate-300">{tipo}</span>
            <span className={`font-black text-${cor}-300`}>{qtd}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    value: "simulados",
    label: "Simulados",
    icon: FileSearch,
    headline: "O simulado muda o plano.",
    bullets: ["Registra desempenho por área", "Audita padrão de erros", "Reordena prioridades automaticamente"],
    mockup: (
      <div className="space-y-2.5">
        <div className="rounded-xl border border-white/8 bg-black/20 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Último simulado</p>
          <p className="mt-1 text-sm font-black text-white">67% — Clínica Médica</p>
        </div>
        <div className="text-xs text-slate-400">↳ Área ajustada: Cardiologia subiu de prioridade</div>
      </div>
    ),
  },
  {
    value: "raciocinio",
    label: "Raciocínio Clínico",
    icon: Brain,
    headline: "Treino de decisão, não decoreba.",
    bullets: ["Illness scripts e diferenciais", "Casos progressivos", "Conduta estruturada"],
    mockup: (
      <div className="space-y-2">
        <div className="rounded-xl border border-white/8 bg-black/20 p-3 text-xs">
          <p className="font-black text-white">Caso — Dor torácica</p>
          <p className="mt-1 text-slate-400">Hipótese principal · Diferenciais · Conduta</p>
        </div>
        <div className="flex gap-2 text-[11px]">
          {["Hipótese", "Diferencial", "Conduta"].map((s) => (
            <span key={s} className="rounded-full border border-white/8 bg-white/[.03] px-2 py-1 text-slate-400">{s}</span>
          ))}
        </div>
      </div>
    ),
  },
  {
    value: "anki",
    label: "Anki",
    icon: Stethoscope,
    headline: "O Anki entra na rotina.",
    bullets: ["Adesão e cards do dia registrados", "Novos vs revisados no plano", "Dentro da fila diária"],
    mockup: (
      <div className="space-y-2">
        {[["Cards hoje", "42", "cyan"], ["Again", "8", "red"], ["Novos", "12", "emerald"]].map(([l, v, c]) => (
          <div key={l} className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-xs">
            <span className="text-slate-400">{l}</span>
            <span className={`font-black text-${c}-300`}>{v}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    value: "stats",
    label: "Estatísticas",
    icon: BarChart3,
    headline: "Métricas que viram decisão.",
    bullets: ["Por área e por prova", "Atraso e risco de esquecimento", "Próxima ação clara"],
    mockup: (
      <div className="space-y-2">
        {[["Retenção geral", "71%", "blue"], ["Temas em atraso", "3", "amber"], ["Áreas cobertas", "8/12", "emerald"]].map(([l, v, c]) => (
          <div key={l} className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-xs">
            <span className="text-slate-400">{l}</span>
            <span className={`font-black text-${c}-300`}>{v}</span>
          </div>
        ))}
      </div>
    ),
  },
];

const panelVariants = {
  enter: { opacity: 0, y: 8 },
  center: { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.16 } },
};

export default function FeatureShowcase() {
  const [active, setActive] = useState("plano");
  const activeTab = tabs.find((t) => t.value === active);

  return (
    <section id="recursos" className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div className="h-[400px] w-[600px] rounded-full bg-blue-600/6 blur-[120px]" />
      </div>
      <div className="relative mx-auto max-w-7xl">
        <SectionIntro eyebrow="Recursos" title="Tudo conectado ao plano diário." />

        {/* Tab bar */}
        <div
          role="tablist"
          aria-label="Recursos do MedRev"
          className="mb-8 flex flex-wrap justify-center gap-2"
        >
          {tabs.map(({ value, label, icon: Icon }) => {
            const isActive = value === active;
            return (
              <button
                key={value}
                role="tab"
                aria-selected={isActive}
                aria-controls={`feature-panel-${value}`}
                id={`feature-tab-${value}`}
                type="button"
                onClick={() => setActive(value)}
                className={`med-focus-ring flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-black transition ${
                  isActive
                    ? "border-blue-400/35 bg-blue-500/15 text-white shadow-[0_0_24px_rgba(59,130,246,.15)]"
                    : "border-white/8 bg-white/[.02] text-slate-400 hover:border-white/15 hover:text-slate-200"
                }`}
              >
                <Icon size={13} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <AnimatePresence mode="wait">
          {activeTab && (
            <motion.div
              key={active}
              id={`feature-panel-${active}`}
              role="tabpanel"
              aria-labelledby={`feature-tab-${active}`}
              variants={panelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="mx-auto max-w-4xl"
            >
              <div className="med-card grid gap-8 rounded-2xl p-6 md:grid-cols-2 md:p-8">
                <div>
                  <p className="mb-4 text-xl font-black leading-snug text-white">{activeTab.headline}</p>
                  <ul className="space-y-3">
                    {activeTab.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-sm text-slate-300">
                        <Check size={15} className="mt-0.5 shrink-0 text-cyan-400" aria-hidden="true" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-white/8 bg-black/20 p-4">
                  {activeTab.mockup}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
