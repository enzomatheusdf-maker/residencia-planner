import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { SectionIntro } from "./primitives";
import { fadeUp, stagger } from "./motion";

const audiences = [
  { title: "Estudante de Medicina", desc: "Quer consistência sem depender de planilhas soltas." },
  { title: "Foco ENAMED", desc: "Precisa priorizar temas de maior retorno e acompanhar evolução." },
  { title: "Preparação para residência", desc: "Usa cursinho, banco ou materiais próprios e quer conectar tudo." },
  { title: "Quem usa Anki", desc: "Quer manter o Anki dentro do plano, não como rotina paralela." },
];

const notFor = [
  "Quer promessa de aprovação.",
  "Procura apenas banco de questões.",
  "Não quer registrar erros, revisões ou simulados.",
  "Quer automação no lugar de estudo ativo.",
];

export default function Audience() {
  return (
    <section className="border-y border-white/8 bg-[#070810] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro eyebrow="Para quem é" title="Feito para rotinas reais de Medicina." />
        <motion.div
          className="grid gap-4 md:grid-cols-4"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {audiences.map(({ title, desc }) => (
            <motion.article key={title} variants={fadeUp} className="med-card rounded-2xl p-5">
              <h3 className="text-sm font-black text-white">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">{desc}</p>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          className="mt-10 rounded-2xl border border-amber-400/12 bg-amber-400/[.03] p-7"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
        >
          <p className="mb-5 text-[11px] font-black uppercase tracking-[0.22em] text-amber-300/80">
            Para quem não é
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {notFor.map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-slate-400">
                <X size={14} className="mt-0.5 shrink-0 text-amber-500/60" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
