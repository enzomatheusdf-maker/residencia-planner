import React, { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  ["Como funciona", "#como-funciona"],
  ["Recursos", "#recursos"],
  ["Método", "#metodo"],
  ["Beta", "#beta"],
  ["FAQ", "#faq"],
];

export default function Navbar({ onLogin, onSignup }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 12);
  });

  return (
    <motion.header
      className="sticky top-0 z-40 border-b border-white/8"
      animate={{ backgroundColor: scrolled ? "rgba(5,7,13,0.96)" : "rgba(5,7,13,0.85)" }}
      transition={{ duration: 0.24 }}
      style={{ backdropFilter: "blur(20px)" }}
    >
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
        aria-label="Navegação principal"
      >
        <a href="#topo" className="med-focus-ring med-logo-entrance flex items-center gap-2.5 rounded-lg">
          <img
            src={process.env.PUBLIC_URL + "/logo512.png"}
            alt=""
            aria-hidden="true"
            draggable="false"
            className="h-9 w-9 shrink-0 rounded-xl object-contain shadow-[0_0_22px_rgba(56,189,248,.25)]"
          />
          <span className="text-lg font-black tracking-tight">
            <span className="text-white">Med</span>
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Rev</span>
          </span>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-xs font-bold text-slate-400 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLogin}
            className="med-focus-ring hidden rounded-xl border border-white/10 bg-white/[.03] px-4 py-2.5 text-xs font-black text-slate-200 transition hover:bg-white/[.07] sm:inline-flex"
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={onSignup}
            className="med-focus-ring rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-black text-white shadow-[0_12px_32px_rgba(37,99,235,.30)] transition hover:from-blue-500 hover:to-cyan-400"
          >
            Começar beta
          </button>
          <button
            type="button"
            className="med-focus-ring grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[.03] text-slate-300 lg:hidden"
            aria-label="Abrir menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
            className="border-t border-white/8 bg-[#05070d]/98 px-4 pb-4 lg:hidden"
          >
            <nav className="mt-4 flex flex-col gap-1">
              {navLinks.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-xl px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/[.04] hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); onLogin?.(); }}
                  className="rounded-xl border border-white/10 bg-white/[.03] py-3 text-sm font-black text-slate-200"
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); onSignup?.(); }}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 text-sm font-black text-white"
                >
                  Começar beta gratuito
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
