import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SectionIntro } from "./primitives";
import { fadeUp, stagger } from "./motion";
import useReducedMotion from "../../hooks/useReducedMotion";

const inputs = [
  "Cronograma", "Questões", "Erros", "Simulados", "Anki", "Revisão", "Raciocínio clínico",
];

const motorCriterios = [
  "Prioridade do tema",
  "Tempo disponível",
  "Dificuldade registrada",
  "Risco de esquecimento",
  "Atraso no plano",
];

export default function HowItThinks() {
  const isReduced = useReducedMotion();

  const chipVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section id="como-funciona" className="border-y border-white/8 bg-[#070810] px-4 py-24 scroll-mt-16 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Como funciona"
          title="O MedRev transforma sinais soltos em decisão diária."
        />

        <motion.div
          className="mx-auto mt-4 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {/* Entradas */}
          <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-white/[.02] p-5">
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Você traz</p>
            <div className="flex flex-wrap gap-2">
              {inputs.map((label, i) => (
                <motion.span
                  key={label}
                  className="rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-[11px] font-bold text-slate-300"
                  variants={chipVariants}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                >
                  {label}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Conector → */}
          <motion.div
            className="hidden items-center justify-center md:flex"
            variants={fadeUp}
          >
            <motion.div
              className="flex items-center gap-1 text-slate-600"
              initial={isReduced ? { opacity: 0 } : { opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              style={{ transformOrigin: "left" }}
            >
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-slate-600" />
              <ArrowRight size={16} />
            </motion.div>
          </motion.div>

          {/* Motor */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-blue-400/25 bg-gradient-to-br from-blue-500/12 via-transparent to-cyan-500/10 p-5 shadow-[0_0_50px_rgba(59,130,246,.10)]"
          >
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">Motor</p>
            <p className="mb-4 text-sm font-black text-white">Mentor de decisão</p>
            <ul className="space-y-2">
              {motorCriterios.map((c) => (
                <li key={c} className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400/50" />
                  {c}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Conector → */}
          <motion.div
            className="hidden items-center justify-center md:flex"
            variants={fadeUp}
          >
            <motion.div
              className="flex items-center gap-1 text-slate-600"
              initial={isReduced ? { opacity: 0 } : { opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              style={{ transformOrigin: "left" }}
            >
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-slate-600" />
              <ArrowRight size={16} />
            </motion.div>
          </motion.div>

          {/* Saída */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[.04] p-5"
          >
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Resultado</p>
            <p className="text-sm font-black text-white">Próxima ação</p>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              Uma fila priorizada para o seu dia de hoje.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
