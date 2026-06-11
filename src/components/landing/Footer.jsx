import React from "react";

export default function Footer({ onLogin, onSignup }) {
  return (
    <footer className="border-t border-white/8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img
            src={process.env.PUBLIC_URL + "/logo512.png"}
            alt=""
            aria-hidden="true"
            draggable="false"
            className="h-9 w-9 shrink-0 rounded-xl object-contain"
          />
          <div>
            <p className="text-base font-black tracking-tight">
              <span className="text-white">Med</span>
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Rev</span>
            </p>
            <p className="mt-0.5 text-xs">Beta · Educação médica</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-5">
          <button type="button" onClick={onLogin} className="font-bold transition hover:text-white">
            Entrar
          </button>
          <button type="button" onClick={onSignup} className="font-bold transition hover:text-white">
            Começar beta
          </button>
        </div>
      </div>
    </footer>
  );
}
