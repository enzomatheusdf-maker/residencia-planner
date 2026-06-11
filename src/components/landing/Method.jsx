import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Brain, CalendarDays, ChevronDown, ShieldCheck, Stethoscope, Target } from "lucide-react";
import { SectionIntro } from "./primitives";
import { fadeUp, stagger } from "./motion";
import useReducedMotion from "../../hooks/useReducedMotion";

const metodoCards = [
  {
    id: "recuperacao",
    Icon: Brain,
    title: "Prática de recuperação",
    summary: "Você testa o que lembra antes de revisar.",
    detail: "Recuperar ativamente o conteúdo da memória é mais eficaz do que reler. O MedRev estrutura os momentos de retomada por tema antes da revisão completa.",
  },
  {
    id: "espacada",
    Icon: CalendarDays,
    title: "Revisão espaçada",
    summary: "Temas retornam no momento certo, sem depender de planilha.",
    detail: "Com FSRS por tema, cada conteúdo retorna em D0, D1, D4, D7, D21 conforme a retenção registrada, maximizando o tempo de estudo.",
  },
  {
    id: "auditoria",
    Icon: ShieldCheck,
    title: "Auditoria de erros",
    summary: "Cada erro aponta uma ação.",
    detail: "Erros são classificados por tipo (conteúdo, raciocínio, interpretação, distração, tempo, calibração) e se convertem em tarefas de correção concretas.",
  },
  {
    id: "simulados",
    Icon: Target,
    title: "Simulados com consequência",
    summary: "O simulado não vira só uma nota. Ele muda prioridades.",
    detail: "Após registrar um simulado, o sistema ajusta a prioridade das áreas com base no desempenho e nos padrões de erro identificados.",
  },
  {
    id: "raciocinio",
    Icon: Stethoscope,
    title: "Raciocínio clínico",
    summary: "Casos, illness scripts e diferenciais entram no treino.",
    detail: "Além de conteúdo, médico residência exige treinamento de decisão. O MedRev estrutura casos progressivos com hipóteses, diferenciais e conduta.",
  },
];

export default function Method() {
  const [open, setOpen] = useState(null);
  const isReduced = useReducedMotion();

  return (
    <section id="metodo" className="relative border-y border-white/8 bg-[#070810] px-4 py-24 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -right-20 top-20 h-80 w-80 rounded-full bg-cyan-500/7 blur-[120px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Método"
          title="Um método de estudo, não só um app."
          gradient
        >
          Desenhado em torno de ciência da aprendizagem.
        </SectionIntro>

        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {metodoCards.map(({ id, Icon, title, summary, detail }) => {
            const isOpen = open === id;
            return (
              <motion.div
                key={id}
                variants={fadeUp}
                className="med-card overflow-hidden rounded-2xl"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  className="med-focus-ring flex w-full items-start gap-4 p-5 text-left"
                  onClick={() => setOpen(isOpen ? null : id)}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-blue-400/20 bg-blue-400/10 text-blue-300">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-white">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{summary}</p>
                  </div>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-0.5 shrink-0 text-slate-600"
                  >
                    <ChevronDown size={16} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={isReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={isReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <p className="border-t border-white/8 px-5 py-4 text-xs leading-6 text-slate-400">
                        {detail}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
