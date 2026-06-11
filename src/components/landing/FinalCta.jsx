import React from "react";
import { motion } from "framer-motion";
import { PrimaryButton, Blob } from "./primitives";
import { fadeUp, stagger } from "./motion";

export default function FinalCta({ onSignup }) {
  return (
    <section className="relative px-4 py-24 pb-28 sm:px-6 lg:px-8">
      <Blob className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] bg-blue-600/6" />
      <motion.div
        className="relative mx-auto max-w-5xl rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[.04] via-white/[.022] to-white/[.04] p-10 text-center shadow-[0_30px_100px_rgba(0,0,0,.40)] md:p-14"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <motion.img
          variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } }}
          src={process.env.PUBLIC_URL + "/medrev-full-1024.png"}
          alt="MedRev"
          draggable="false"
          className="med-logo-hero mx-auto mb-8 h-28 w-28 rounded-3xl object-contain [mix-blend-mode:screen]"
        />
        <motion.h2 variants={fadeUp} className="text-3xl font-black tracking-tight text-white md:text-4xl">
          Entre no beta e ajude a construir uma preparação mais inteligente.
        </motion.h2>
        <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300">
          A direção é clara: transformar estudo médico em um sistema diário de decisão.
        </motion.p>
        <motion.div variants={fadeUp} className="mt-8 flex justify-center">
          <PrimaryButton onClick={onSignup}>Começar beta gratuito</PrimaryButton>
        </motion.div>
        <motion.p variants={fadeUp} className="mt-6 text-sm font-semibold text-slate-500">
          Menos improviso. Mais execução.
        </motion.p>
        <motion.p variants={fadeUp} className="mt-2 text-xs text-slate-600">
          O MedRev não decide sua aprovação. Ele organiza o próximo passo.
        </motion.p>
      </motion.div>
    </section>
  );
}
