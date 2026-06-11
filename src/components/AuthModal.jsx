// AuthModal.jsx - Modal de Login/Signup
import React, { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, Loader, X } from "lucide-react";
import { criarConta, fazerLogin, resetarSenha } from "../services/firebase";
import { MedRevLogo } from "./Primitives";

export default function AuthModal({ onSuccess, initialMode = "login", onClose }) {
  const [modo, setModo] = useState(initialMode === "signup" ? "signup" : "login"); // login, signup ou reset
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [manterConectado, setManterConectado] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setMensagemSucesso(null);
    setCarregando(true);

    try {
      if (modo === "reset") {
        const resultado = await resetarSenha(email);
        if (resultado.sucesso) {
          setMensagemSucesso("E-mail de redefinição de senha enviado com sucesso! Verifique sua caixa de entrada.");
        } else {
          setErro(resultado.erro);
        }
      } else {
        let resultado;
        if (modo === "signup") {
          resultado = await criarConta(email, senha, nome, manterConectado);
        } else {
          resultado = await fazerLogin(email, senha, manterConectado);
        }

        if (resultado.sucesso) {
          onSuccess(resultado.user);
        } else {
          setErro(resultado.erro);
        }
      }
    } catch (err) {
      setErro("Erro ao processar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-[#111113] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Fechar login"
          >
            <X size={16} />
          </button>
        )}

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex">
            <MedRevLogo size="lg" showTagline />
          </div>
        </div>

        {/* Tabs login/signup (hidden in reset mode) */}
        {modo !== "reset" ? (
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5 mb-6">
            {[["login","Entrar"],["signup","Criar Conta"]].map(([k, l]) => (
              <button key={k} type="button" onClick={() => { setModo(k); setErro(null); setMensagemSucesso(null); }}
                className={`flex-1 py-2 rounded-lg text-[13px] font-bold transition-all ${modo === k ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow" : "text-gray-500 hover:text-gray-300"}`}>
                {l}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center mb-6">
            <h3 className="text-[14px] font-bold text-gray-200">Recuperar Senha</h3>
            <p className="text-[11px] text-gray-500 mt-1">Informe seu e-mail cadastrado para redefinir sua senha.</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome (apenas signup) */}
          {modo === "signup" && (
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
                Nome
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-gray-600" />
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-gray-600" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu-email@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Senha (hidden in reset mode) */}
          {modo !== "reset" && (
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
                Senha
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-gray-600" />
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-3 text-gray-600 hover:text-gray-400"
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex justify-between items-center mt-1.5">
                {modo === "signup" ? (
                  <p className="text-xs text-gray-500">
                    Mínimo 6 caracteres
                  </p>
                ) : (
                  <div />
                )}
                {modo === "login" && (
                  <button
                    type="button"
                    onClick={() => { setModo("reset"); setErro(null); setMensagemSucesso(null); }}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Manter Conectado (hidden in reset mode) */}
          {modo !== "reset" && (
            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="manterConectado"
                checked={manterConectado}
                onChange={(e) => setManterConectado(e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
              />
              <label htmlFor="manterConectado" className="text-xs font-semibold text-gray-400 select-none cursor-pointer hover:text-gray-300 transition-colors">
                Manter conectado
              </label>
            </div>
          )}

          {/* Erro */}
          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-xs text-red-400">{erro}</p>
            </div>
          )}

          {/* Mensagem Sucesso */}
          {mensagemSucesso && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              <p className="text-xs text-emerald-400">{mensagemSucesso}</p>
            </div>
          )}

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-xs"
          >
            {carregando && <Loader size={16} className="animate-spin" />}
            {modo === "login" ? "Entrar" : modo === "signup" ? "Criar Conta" : "Enviar E-mail de Redefinição"}
          </button>
        </form>

        {/* Voltar ao login no reset mode */}
        {modo === "reset" && (
          <button
            type="button"
            onClick={() => { setModo("login"); setErro(null); setMensagemSucesso(null); }}
            className="w-full text-center text-xs font-semibold text-gray-500 hover:text-gray-300 transition-colors mt-4"
          >
            Voltar para o login
          </button>
        )}
      </div>
    </div>
  );
}
