import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { SegmentedControl } from "../ui";
import { SectionIntro } from "./primitives";

const antesItems = [
  "Planilha separada do restante.",
  "Banco de questões, Anki e cursinho em ilhas separadas.",
  "Simulado vira só uma nota.",
  "Erros esquecidos após a questão.",
  "Revisão depende de memória ou planilha manual.",
  "Você decide sozinho o que fazer todo dia.",
];

const depoisItems = [
  "Plano diário conectado ao cronograma.",
  "Revisão espaçada por tema integrada.",
  "Erro vira ação corretiva.",
  "Simulado ajusta prioridade do plano.",
  "Anki entra na rotina como tarefa.",
  "Mentor mostra o próximo passo.",
];

const panelVariants = {
  enter: { opacity: 0, x: 16 },
  center: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.18 } },
};

export default function BeforeAfter() {
  const [modo, setModo] = useState("antes");

  return (
    <section className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div className="h-[500px] w-[500px] rounded-full bg-blue-600/5 blur-[120px]" />
      </div>
      <div className="relative mx-auto max-w-5xl">
        <SectionIntro eyebrow="Transformação" title="Do improviso ao sistema." gradient />

        {/* Toggle */}
        <div className="mb-10 flex justify-center">
          <SegmentedControl
            ariaLabel="Antes ou depois do MedRev"
            value={modo}
            onChange={setModo}
            options={[
              { value: "antes", label: "Sem o MedRev" },
              { value: "depois", label: "Com o MedRev" },
            ]}
          />
        </div>

        {/* Painel animado */}
        <AnimatePresence mode="wait">
          {modo === "antes" ? (
            <motion.div
              key="antes"
              variants={panelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="mx-auto max-w-2xl rounded-2xl border border-white/8 bg-white/[.02] p-7"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                  <X size={16} aria-hidden="true" />
                </div>
                <span className="text-sm font-black text-slate-400">Sem o MedRev</span>
              </div>
              <ul className="space-y-4">
                {antesItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-500">
                    <span className="mt-0.5 shrink-0 text-slate-700">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : (
            <motion.div
              key="depois"
              variants={panelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="mx-auto max-w-2xl rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-blue-500/8 via-transparent to-cyan-500/8 p-7 shadow-[0_0_80px_rgba(6,182,212,.07)]"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-400/25 bg-emerald-400/12 text-emerald-300 shadow-[0_0_24px_rgba(52,211,153,.15)]">
                  <Check size={16} aria-hidden="true" />
                </div>
                <span className="text-sm font-black text-white">Com o MedRev</span>
              </div>
              <ul className="space-y-4">
                {depoisItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-200">
                    <Check size={15} className="mt-0.5 shrink-0 text-cyan-400" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint de toggle para mobile */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Alterne para ver a diferença.
        </p>
      </div>
    </section>
  );
}
