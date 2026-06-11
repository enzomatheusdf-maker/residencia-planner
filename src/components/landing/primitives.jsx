import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeUp, stagger } from "./motion";

export function PrimaryButton({ children, onClick, className = "" }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`med-focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-black text-white shadow-[0_20px_50px_rgba(37,99,235,.32)] transition hover:from-blue-500 hover:to-cyan-400 hover:shadow-[0_24px_64px_rgba(37,99,235,.46)] ${className}`}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.14 }}
    >
      {children}
      <ArrowRight size={17} aria-hidden="true" />
    </motion.button>
  );
}

export function SecondaryButton({ children, onClick, href, className = "" }) {
  const shared = `med-focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-6 py-3 text-sm font-black text-gray-100 transition hover:border-white/25 hover:bg-white/[.08] ${className}`;
  if (href) {
    return <a href={href} className={shared}>{children}</a>;
  }
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={shared}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.14 }}
    >
      {children}
    </motion.button>
  );
}

export function SectionIntro({ eyebrow, title, children, id, gradient = false }) {
  return (
    <motion.div
      id={id}
      className="mx-auto mb-12 max-w-3xl text-center scroll-mt-24"
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      <motion.p variants={fadeUp} className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">
        {eyebrow}
      </motion.p>
      <motion.h2
        variants={fadeUp}
        className={`mt-3 text-3xl font-black tracking-tight md:text-4xl ${
          gradient
            ? "bg-gradient-to-r from-blue-300 via-white to-cyan-300 bg-clip-text text-transparent"
            : "text-white"
        }`}
      >
        {title}
      </motion.h2>
      {children && (
        <motion.p variants={fadeUp} className="mt-4 text-sm leading-7 text-slate-300 md:text-base">
          {children}
        </motion.p>
      )}
    </motion.div>
  );
}

export function Blob({ className }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-[120px] ${className}`}
      aria-hidden="true"
    />
  );
}
