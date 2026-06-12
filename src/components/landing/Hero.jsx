import React from "react";
import { motion } from "framer-motion";
import { Check, Play, Sparkles } from "lucide-react";
import { PrimaryButton, SecondaryButton, Blob } from "./primitives";
import { fadeUp, stagger, scaleIn } from "./motion";
import useReducedMotion from "../../hooks/useReducedMotion";

const mockItems = [
  { title: "Revisar Pré-eclâmpsia", detail: "Revisão espaçada", badge: "D7", badgeTone: "blue" },
  { title: "Estudar Tuberculose", detail: "Tema novo do cronograma", badge: "D0", badgeTone: "cyan" },
  { title: "Corrigir 8 erros do simulado", detail: "Interpretação e raciocínio", badge: "Erros", badgeTone: "amber" },
  { title: "Zerar Anki", detail: "Cards revisados + novos", badge: "Anki", badgeTone: "emerald" },
];

const badgeColors = {
  blue: "border-blue-400/25 bg-blue-400/12 text-blue-200",
  cyan: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
  amber: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
};

function AnimatedMockPanel() {
  const isReduced = useReducedMotion();

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, x: -16 },
    show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };
  const reducedItem = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.4 } },
  };

  return (
    <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1220] p-5 shadow-[0_40px_120px_rgba(0,0,0,.55)]">
      <Blob className="inset-x-0 top-0 h-32 w-full bg-cyan-400/10" />
      <Blob className="-bottom-10 -right-10 h-48 w-48 bg-blue-600/14" />
      <div className="relative rounded-2xl border border-white/10 bg-white/[.03] p-5">
        {/* Header */}
        <motion.div
          variants={isReduced ? reducedItem : fadeUp}
          className="flex items-center justify-between gap-3 border-b border-white/8 pb-4"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-300">Comando do dia</p>
            <h3 className="mt-1 text-xl font-black text-white">Hoje: 4 tarefas · 2h20</h3>
          </div>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-emerald-400/25 bg-emerald-400/12 text-emerald-300 shadow-[0_0_28px_rgba(52,211,153,.18)]">
            <Check size={19} aria-hidden="true" />
          </div>
        </motion.div>

        {/* Progress bar */}
        <div className="my-4">
          <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold text-slate-500">
            <span>Progresso do dia</span><span>0 / 4</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[.06]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
              initial={{ width: 0 }}
              whileInView={{ width: "0%" }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
              viewport={{ once: true }}
            />
          </div>
        </div>

        {/* Task list */}
        <motion.div
          className="space-y-2.5"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {mockItems.map(({ title, detail, badge, badgeTone }) => (
            <motion.div
              key={title}
              variants={isReduced ? reducedItem : itemVariants}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/8 bg-black/20 p-3"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-300/70 shadow-[0_0_14px_rgba(34,211,238,.5)]" />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-black text-white">{title}</span>
                <span className="block truncate text-[11px] text-slate-400">{detail}</span>
              </span>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black ${badgeColors[badgeTone]}`}>
                {badge}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Próxima ação — pulse sutil */}
        <motion.div
          className="mt-4 rounded-2xl border border-blue-400/25 bg-blue-500/12 p-3.5"
          animate={isReduced ? {} : { scale: [1, 1.025, 1], boxShadow: ["0 0 0 rgba(59,130,246,.0)", "0 0 32px rgba(59,130,246,.18)", "0 0 0 rgba(59,130,246,.0)"] }}
          transition={isReduced ? {} : { duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">Próxima ação</p>
          <p className="mt-1 text-[13px] font-black text-white">Começar revisão de Pré-eclâmpsia</p>
        </motion.div>
      </div>
    </div>
  );
}

export default function Hero({ onLogin, onSignup }) {
  return (
    <section className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
      <Blob className="-left-20 top-0 h-[520px] w-[520px] bg-blue-600/12" />
      <Blob className="-right-20 top-32 h-[400px] w-[400px] bg-cyan-500/10" />

      {/* Copy */}
      <motion.div
        className="relative z-10 max-w-3xl"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.img
          variants={scaleIn}
          src={process.env.PUBLIC_URL + "/logo512.png"}
          alt="MedRev"
          draggable="false"
          className="med-logo-hero mb-7 h-16 w-16 rounded-2xl object-contain [mix-blend-mode:screen]"
        />
        <motion.div
          variants={fadeUp}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/[.08] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-200"
        >
          <Sparkles size={13} aria-hidden="true" />
          Beta gratuito para estudantes de Medicina
        </motion.div>
        <motion.h1
          variants={fadeUp}
          className="mt-7 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          Seu{" "}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
            sistema operacional de estudos
          </span>{" "}
          para residência médica.
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg"
        >
          Cronograma, revisões, erros, simulados, Anki e raciocínio clínico em uma fila diária de execução.
        </motion.p>
        <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-3 sm:flex-row">
          <PrimaryButton onClick={onSignup}>Começar beta gratuito</PrimaryButton>
          <SecondaryButton href="#como-funciona">
            <Play size={17} aria-hidden="true" />
            Ver como funciona
          </SecondaryButton>
        </motion.div>
        <motion.p variants={fadeUp} className="mt-5 text-xs font-semibold text-slate-500">
          Sem cobrança nesta fase.
        </motion.p>
      </motion.div>

      {/* Mockup */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      >
        <AnimatedMockPanel />
      </motion.div>
    </section>
  );
}
