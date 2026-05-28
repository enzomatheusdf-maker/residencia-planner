// AuthModal.jsx - Modal de Login/Signup
import React, { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, Loader } from "lucide-react";
import { criarConta, fazerLogin } from "../firebaseAuth";

export default function AuthModal({ onSuccess }) {
  const [modo, setModo] = useState("login"); // login ou signup
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      let resultado;
      if (modo === "signup") {
        resultado = await criarConta(email, senha, nome);
      } else {
        resultado = await fazerLogin(email, senha);
      }

      if (resultado.sucesso) {
        onSuccess(resultado.user);
      } else {
        setErro(resultado.erro);
      }
    } catch (err) {
      setErro("Erro ao processar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#111113] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white mb-2">
            {modo === "login" ? "Entrar" : "Criar Conta"}
          </h1>
          <p className="text-sm text-gray-500">
            {modo === "login"
              ? "Acesse sua conta pessoal"
              : "Crie sua conta para começar"}
          </p>
        </div>

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
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 outline-none focus:border-violet-500 transition-colors"
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
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 outline-none focus:border-violet-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Senha */}
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
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-gray-600 outline-none focus:border-violet-500 transition-colors"
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
            {modo === "signup" && (
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 6 caracteres
              </p>
            )}
          </div>

          {/* Erro */}
          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-xs text-red-400">{erro}</p>
            </div>
          )}

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {carregando && <Loader size={16} className="animate-spin" />}
            {modo === "login" ? "Entrar" : "Criar Conta"}
          </button>
        </form>

        {/* Toggle modo */}
        <div className="text-center mt-6 pt-6 border-t border-white/5">
          <p className="text-sm text-gray-500">
            {modo === "login" ? "Não tem conta? " : "Já tem conta? "}
            <button
              onClick={() => {
                setModo(modo === "login" ? "signup" : "login");
                setErro(null);
              }}
              className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
            >
              {modo === "login" ? "Criar agora" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
