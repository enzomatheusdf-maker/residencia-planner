import React from "react";
import { motion } from "framer-motion";
import { SectionIntro } from "./primitives";
import useReducedMotion from "../../hooks/useReducedMotion";

const chaosCards = [
  { label: "Cronograma separado", x: -60, y: -20, rotate: -8 },
  { label: "Anki separado", x: 50, y: -30, rotate: 6 },
  { label: "Simulado vira nota", x: -40, y: 28, rotate: -5 },
  { label: "Erro esquecido", x: 55, y: 24, rotate: 7 },
  { label: "Revisão atrasada", x: -55, y: -8, rotate: -6 },
  { label: "Estatística sem decisão", x: 44, y: 10, rotate: 5 },
];

export default function ChaosSection() {
  const isReduced = useReducedMotion();

  return (
    <section className="relative border-y border-white/8 bg-[#070810] px-4 py-24 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div className="h-[400px] w-[400px] rounded-full bg-red-600/5 blur-[120px]" />
      </div>
      <div className="relative mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="O problema"
          title="O problema não é falta de material. É falta de sistema."
        />

        <div className="relative mx-auto max-w-4xl">
          {/* Cards dispersos convergindo */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-5">
            {chaosCards.map(({ label, x, y, rotate }) => (
              <motion.div
                key={label}
                className="med-card rounded-2xl p-4 text-center text-sm font-bold text-slate-300"
                initial={isReduced ? { opacity: 0 } : { opacity: 0, x, y, rotate }}
                whileInView={isReduced ? { opacity: 1 } : { opacity: 1, x: 0, y: 0, rotate: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true, margin: "-40px" }}
              >
                <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-gradient-to-r from-red-500/50 to-orange-500/40" />
                {label}
              </motion.div>
            ))}
          </div>

          {/* Centro: "Plano do dia" → resultado com o MedRev */}
          <motion.div
            className="mx-auto mt-10 max-w-xs rounded-2xl border border-blue-400/25 bg-gradient-to-br from-blue-500/12 via-cyan-500/8 to-transparent p-6 text-center shadow-[0_0_60px_rgba(59,130,246,.12)]"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            viewport={{ once: true, margin: "-40px" }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Com o MedRev</p>
            <p className="mt-2 text-base font-black text-white">Plano do dia</p>
            <p className="mt-2 text-xs text-slate-400">
              O MedRev conecta essas peças em uma fila diária de execução.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
