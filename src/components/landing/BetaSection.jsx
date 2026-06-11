import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { PrimaryButton, Blob } from "./primitives";
import { fadeUp, stagger } from "./motion";

const inclui = [
  "Cronograma e agenda",
  "Revisão espaçada (FSRS)",
  "Dashboard",
  "Simulados e análise",
  "Auditoria de erros",
  "Raciocínio clínico",
  "Anki Audit",
  "Estatísticas",
];

export default function BetaSection({ onSignup }) {
  return (
    <section id="beta" className="relative px-4 py-24 sm:px-6 lg:px-8">
      <Blob className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] bg-blue-600/7" />
      <div className="relative mx-auto max-w-5xl">
        <div className="rounded-[32px] border border-blue-400/18 bg-gradient-to-br from-blue-500/14 via-white/[.022] to-cyan-400/10 p-8 shadow-[0_40px_130px_rgba(0,0,0,.42)] md:p-10">
          <div className="grid gap-10 lg:grid-cols-[.95fr_1.05fr]">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              <motion.p variants={fadeUp} className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">
                Beta gratuito
              </motion.p>
              <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
                Beta gratuito. Construído com estudantes reais.
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-4 text-sm leading-7 text-slate-300">
                O MedRev está em fase beta. Algumas funções ainda podem mudar conforme o feedback dos estudantes.
              </motion.p>
              <motion.div variants={fadeUp}>
                <PrimaryButton onClick={onSignup} className="mt-7">
                  Participar do beta gratuito
                </PrimaryButton>
              </motion.div>
              <motion.p variants={fadeUp} className="mt-3 text-xs text-slate-500">
                Sem cobrança nesta fase. Algumas funções podem mudar durante o beta.
              </motion.p>
            </motion.div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
              <p className="text-base font-black text-white">Incluído no beta</p>
              <p className="mt-0.5 text-sm font-bold text-cyan-200">100% gratuito</p>
              <motion.ul
                className="mt-5 grid gap-2.5 sm:grid-cols-2"
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
              >
                {inclui.map((item) => (
                  <motion.li
                    key={item}
                    variants={fadeUp}
                    className="flex items-center gap-2 text-sm text-slate-200"
                  >
                    <Check size={15} className="shrink-0 text-emerald-300" aria-hidden="true" />
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
