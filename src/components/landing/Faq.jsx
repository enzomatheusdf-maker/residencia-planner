import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SectionIntro } from "./primitives";
import useReducedMotion from "../../hooks/useReducedMotion";

const faqItems = [
  { q: "O MedRev tem banco de questões?", a: "Não. O MedRev organiza seu estudo, revisões, erros, simulados e execução. Você pode usar o banco de questões que já preferir." },
  { q: "O beta é gratuito?", a: "Sim. O acesso é gratuito durante a fase beta." },
  { q: "Preciso abandonar meu cursinho?", a: "Não. A ideia é conectar seu cronograma, seus materiais e sua rotina dentro de um sistema operacional de estudo." },
  { q: "O MedRev substitui o Anki?", a: "Não necessariamente. Ele pode acompanhar sua rotina de Anki e usar esses dados no seu plano." },
  { q: "O MedRev garante aprovação?", a: "Não. Nenhuma plataforma séria deve prometer aprovação. O MedRev ajuda a organizar execução, revisão e correção de erros." },
  { q: "Posso importar meu cronograma?", a: "A proposta é permitir cronogramas prontos, customizados e importados, com evolução durante o beta." },
  { q: "O que significa FSRS por tema?", a: "É uma forma de controlar revisões espaçadas por tema, considerando o momento certo de reencontro com aquele conteúdo." },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(null);
  const isReduced = useReducedMotion();

  const toggle = (i) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <section id="faq" className="border-y border-white/8 bg-[#070810] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <SectionIntro eyebrow="FAQ" title="Perguntas frequentes." />
        <div className="grid gap-2.5">
          {faqItems.map(({ q, a }, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={q}
                className={`overflow-hidden rounded-2xl border transition-colors ${
                  isOpen ? "border-cyan-300/20 bg-cyan-300/[.022]" : "border-white/8 bg-white/[.02]"
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  className="med-focus-ring flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  onClick={() => toggle(i)}
                >
                  <span className="text-sm font-black text-white">{q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 text-slate-500"
                  >
                    <ChevronDown size={17} />
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
                      <p className="px-6 pb-5 text-sm leading-7 text-slate-400">{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
