import React from "react";
import { motion } from "framer-motion";
import { SectionIntro } from "./primitives";
import { fadeUp, stagger } from "./motion";

const cards = [
  { title: "Sem promessa de aprovação", desc: "Nenhuma plataforma séria deve prometer isso. O MedRev organiza execução, revisão e decisão." },
  { title: "Sem cobrança nesta fase", desc: "Acesso 100% gratuito durante o beta." },
  { title: "Sem substituir seu cursinho", desc: "O MedRev conecta o que você já usa. Não é mais uma fonte de conteúdo." },
  { title: "Você usa seus materiais", desc: "Seus próprios cadernos, banco de questões, Anki e cronograma." },
  { title: "O MedRev organiza a execução", desc: "A direção é clara: transformar estudo médico em decisão diária." },
];

export default function Transparency() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Transparência"
          title="Sem promessa de aprovação. Com sistema de execução."
        />
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {cards.map(({ title, desc }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              className="rounded-2xl border border-slate-700/40 bg-white/[.02] p-5"
            >
              <div className="mb-3 h-0.5 w-8 rounded-full bg-gradient-to-r from-blue-500/50 to-cyan-500/40" />
              <p className="text-sm font-black text-white">{title}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
