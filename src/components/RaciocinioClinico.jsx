// src/components/RaciocinioClinico.jsx
import React, { useMemo, useState } from "react";
import { Brain, ClipboardList, MessageSquareText, Stethoscope, CheckCircle, Eye, CalendarDays, Pill, AlertTriangle } from "lucide-react";
import { CASOS_CLINICOS } from "../constants/casosClinicos";
import { useStore } from "../core/store";
import { Btn, Textarea, Tabs, InfoTooltip } from "./Primitives";
import { fmtRelativo } from "../core/fsrs";
import SessionClosureModal from "./SessionClosureModal";
import EmptyState from "./EmptyState";
import { calculateClinicalReasoningScore } from "../core/clinicalReasoningScoring";

const FASES = [
  { k: "script", label: "Illness Scripts", icon: Brain },
  { k: "caso", label: "Casos", icon: ClipboardList },
  { k: "sct", label: "SCT", icon: MessageSquareText },
  { k: "anamnese", label: "Anamnese", icon: Stethoscope },
  { k: "conduta", label: "Conduta", icon: Pill },
];

// Campos da fase de conduta simulada
const CONDUTA_FIELDS = [
  { key: "estabilizacao", label: "Estabilizacao inicial", placeholder: "Vias aereas, acesso venoso, monitoracao, posicao, O2..." },
  { key: "examesIniciais", label: "Exames iniciais", placeholder: "Laboratoriais, imagem, ECG, culturas..." },
  { key: "tratamento", label: "Tratamento definitivo", placeholder: "Cirurgia, clinico, procedimento, internacao..." },
  { key: "medicacoes", label: "Medicacoes e doses", placeholder: "Nome, dose, via, frequencia (uso educacional)" },
  { key: "internacao", label: "Internacao ou ambulatorio", placeholder: "Criterios de internacao / ambulatorio / UTI" },
  { key: "redFlags", label: "Red flags para reavaliacao", placeholder: "Sinais de alarme que exigem reavaliacao imediata" },
  { key: "contraindicacoes", label: "Contraindicacoes relevantes", placeholder: "O que NAO fazer neste caso especifico" },
  { key: "seguimento", label: "Seguimento e retorno", placeholder: "Consulta de retorno, exames de controle, orientacoes de alta" },
];

function dificuldadeClass(dificuldade) {
  if (dificuldade === "dificil") return "text-red-300 bg-red-500/10 border-red-500/20";
  if (dificuldade === "media") return "text-amber-300 bg-amber-500/10 border-amber-500/20";
  return "text-emerald-300 bg-emerald-500/10 border-emerald-500/20";
}

// Removido: calcRaciocinioScore local substituida por calculateClinicalReasoningScore
// de clinicalReasoningScoring.js (fonte canonica unica — P4-A)

export default function RaciocinioClinico() {
  const plat = useStore((s) => s.plat);
  const registrarCaso = useStore((s) => s.registrarCasoClinico || s.registrarCaso);
  const casosProgresso = useStore((s) => s[plat]?.casosProgresso || {});
  const addSessionReflection = useStore((s) => s.addSessionReflection);
  const rebuildActionInboxForToday = useStore((s) => s.rebuildActionInboxForToday);
  const showToast = useStore((s) => s.showToast);

  const [activeCasoId, setActiveCasoId] = useState(CASOS_CLINICOS[0]?.id || "");
  const [activeFase, setActiveFase] = useState("script");
  const [scriptAberto, setScriptAberto] = useState(false);
  const [diferenciaisLivres, setDiferenciaisLivres] = useState("");
  const [casoRevelado, setCasoRevelado] = useState(false);
  const [sctRespostas, setSctRespostas] = useState({});
  const [sctRevelado, setSctRevelado] = useState(false);
  const [anamneseChecks, setAnamneseChecks] = useState({});
  const [anamneseRevelada, setAnamneseRevelada] = useState(false);
  const [showClosure, setShowClosure] = useState(false);
  const [closureDraft, setClosureDraft] = useState(null);
  // P4-D: fase conduta
  const [conductaAvisoAceito, setConductaAvisoAceito] = useState(false);
  const [conductaRespostas, setConductaRespostas] = useState({});
  const [conductaRevelada, setConductaRevelada] = useState(false);

  const caso = CASOS_CLINICOS.find((item) => item.id === activeCasoId) || CASOS_CLINICOS[0];
  const progresso = casosProgresso[caso?.id] || {};
  const raciocinioScore = useMemo(() => calculateClinicalReasoningScore(casosProgresso), [casosProgresso]);
  const casosFeitos = useMemo(
    () => Object.values(casosProgresso || {}).filter((item) => item?.vistos > 0).length,
    [casosProgresso]
  );

  if (!CASOS_CLINICOS.length) {
    return (
      <div className="bg-[#111113] border border-white/5 rounded-2xl p-8 text-center text-gray-500">
        Banco em construção — adicione casos em `casosClinicos.js`.
      </div>
    );
  }

  const registrar = (payload) => registrarCaso(plat, caso.id, payload);

  const abrirFechamento = (payload) => {
    setClosureDraft({
      source: "raciocinio",
      tema: caso.tema,
      area: caso.area,
      ...payload,
    });
    setShowClosure(true);
  };

  const registrarScript = (ok) => {
    registrar({ fase1Ok: ok, confianca: ok ? 4 : 2, acertou: ok });
    setScriptAberto(false);
    abrirFechamento({
      outcome: ok ? "bom" : "medio",
      mainIssue: ok ? "nenhum" : "raciocinio",
      nextAdjustment: ok ? "manter" : "caso",
    });
  };

  const registrarCasoEstruturado = (acertou) => {
    registrar({ fase2Acerto: acertou ? 100 : 0, confianca: acertou ? 4 : 2, acertou });
    setCasoRevelado(true);
    abrirFechamento({
      outcome: acertou ? "bom" : "ruim",
      mainIssue: acertou ? "nenhum" : "raciocinio",
      nextAdjustment: acertou ? "manter" : "caso",
    });
  };

  const revelarSct = () => {
    setSctRevelado(true);
    const total = caso.sct.length || 1;
    const score = caso.sct.reduce((sum, item, idx) => {
      const resposta = Number(sctRespostas[idx]);
      if (Number.isNaN(resposta)) return sum;
      const diff = Math.abs(resposta - item.efeitoPainel);
      return sum + Math.max(0, 100 - diff * 25);
    }, 0);
    const sctAcerto = Math.round(score / total);
    registrar({ sctAcerto, confianca: sctAcerto >= 75 ? 4 : 2, acertou: sctAcerto >= 75 });
    abrirFechamento({
      outcome: sctAcerto >= 80 ? "bom" : sctAcerto >= 60 ? "medio" : "ruim",
      mainIssue: sctAcerto < 80 ? "raciocinio" : "nenhum",
      nextAdjustment: sctAcerto < 80 ? "caso" : "manter",
    });
  };

  const revelarAnamnese = () => {
    setAnamneseRevelada(true);
    const totalPerguntas = caso.anamnese.roteiro.reduce((sum, bloco) => sum + bloco.perguntasChave.length, 0);
    const marcadas = Object.values(anamneseChecks).filter(Boolean).length;
    registrar({ anamneseCobertura: totalPerguntas ? Math.round((marcadas / totalPerguntas) * 100) : 0, acertou: marcadas >= Math.ceil(totalPerguntas * 0.6) });
    abrirFechamento({
      outcome: marcadas >= Math.ceil(totalPerguntas * 0.6) ? "bom" : "medio",
      mainIssue: marcadas >= Math.ceil(totalPerguntas * 0.6) ? "nenhum" : "raciocinio",
      nextAdjustment: marcadas >= Math.ceil(totalPerguntas * 0.6) ? "manter" : "caso",
    });
  };

  // P4-D: revelar e pontuar conduta simulada
  const revelarConduta = () => {
    setConductaRevelada(true);
    // Score por cobertura: campos preenchidos / total
    const preenchidos = CONDUTA_FIELDS.filter((f) =>
      String(conductaRespostas[f.key] || "").trim().length >= 5
    ).length;
    const managementScore = Math.round((preenchidos / CONDUTA_FIELDS.length) * 100);
    registrar({
      managementScore,
      acertou: managementScore >= 60,
      confianca: managementScore >= 75 ? 4 : 2,
    });
    abrirFechamento({
      outcome: managementScore >= 80 ? "bom" : managementScore >= 60 ? "medio" : "ruim",
      mainIssue: managementScore < 80 ? "raciocinio" : "nenhum",
      nextAdjustment: managementScore < 80 ? "caso" : "manter",
    });
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-up text-left">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope size={20} className="text-blue-400" />
            <h2 className="text-[15px] font-bold text-gray-100">Raciocínio Clínico</h2>
            <InfoTooltip texto="Treino faseado com illness scripts, casos estruturados, Script Concordance e anamnese dirigida." />
          </div>
          <p className="text-[12px] text-gray-500 mt-1">Casos vistos: {Object.values(casosProgresso).filter((p) => p?.vistos > 0).length}</p>
        </div>
        <div className="bg-[#111113] border border-white/5 rounded-2xl p-3 min-w-[150px]">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Raciocínio Clínico</p>
          <p className="text-3xl font-black text-blue-400 tabular-nums">{raciocinioScore != null ? `${raciocinioScore}%` : "—"}</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
        {casosFeitos === 0 && (
          <EmptyState
            icon={Stethoscope}
            title="Treine seu primeiro caso clinico"
            description="Comece com um caso ligado ao seu cronograma ou um caso recomendado pelo Mentor."
            primaryAction={{
              label: "Iniciar caso",
              onClick: () => {
                setActiveCasoId(CASOS_CLINICOS[0]?.id || "");
                setActiveFase("caso");
              },
            }}
            className="lg:col-span-2"
          />
        )}
        <div className="flex flex-col gap-2">
          {CASOS_CLINICOS.map((item) => {
            const ativo = item.id === caso.id;
            const p = casosProgresso[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveCasoId(item.id);
                  setScriptAberto(false);
                  setCasoRevelado(false);
                  setSctRevelado(false);
                  setAnamneseRevelada(false);
                  setConductaRevelada(false);
                  setConductaRespostas({});
                  setConductaAvisoAceito(false);
                }}
                className={`text-left rounded-2xl border p-3 transition-all ${ativo ? "bg-blue-500/10 border-blue-500/30" : "bg-[#111113] border-white/5 hover:border-white/10"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-black text-gray-100">{item.tema}</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${dificuldadeClass(item.dificuldade)}`}>
                    {item.dificuldade}
                  </span>
                </div>
                <p className="text-[10.5px] text-gray-500 mt-1">{item.area} · {item.subarea}</p>
                {p?.proximaData && (
                  <p className="text-[10px] text-blue-300 mt-2 flex items-center gap-1">
                    <CalendarDays size={11} /> reencontro {fmtRelativo(p.proximaData)}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded">{caso.area}</span>
              <span className="text-[10px] text-gray-500 font-mono">{caso.id}</span>
              {progresso.vistos > 0 && <span className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">{progresso.vistos} encontro(s)</span>}
            </div>
            <h3 className="text-lg font-black text-white">{caso.tema}</h3>
            <p className="text-[13px] text-gray-300 leading-relaxed mt-2">{caso.vinheta}</p>
          </div>

          <Tabs items={FASES} active={activeFase} onChange={setActiveFase} />

          {activeFase === "script" && (
            <div className="space-y-3">
              <p className="text-[12px] text-gray-400">Recupere de memória: condições predisponentes, fisiopatologia, achados e conduta. Depois revele o script.</p>
              <Btn onClick={() => setScriptAberto((v) => !v)} className="gap-2"><Eye size={15} /> {scriptAberto ? "Ocultar script" : "Revelar script"}</Btn>
              {scriptAberto && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(caso.script).map(([key, value]) => (
                    <div key={key} className="bg-black/30 border border-white/5 rounded-xl p-3">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{key}</p>
                      <p className="text-[12px] text-gray-200 mt-1 leading-relaxed">{value}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Btn onClick={() => registrarScript(true)}><CheckCircle size={15} /> Recuperei bem</Btn>
                <Btn variant="ghost" onClick={() => registrarScript(false)}>Preciso reencontrar em 2 dias</Btn>
              </div>
            </div>
          )}

          {activeFase === "caso" && (
            <div className="space-y-3">
              <Textarea rows={4} value={diferenciaisLivres} onChange={(e) => setDiferenciaisLivres(e.target.value)} placeholder="Liste seus diferenciais, exames e conduta antes de revelar o painel." />
              <div className="flex flex-wrap gap-2">
                <Btn onClick={() => setCasoRevelado(true)}>Revelar painel</Btn>
                <Btn variant="ghost" onClick={() => registrarCasoEstruturado(true)}>Acertei o diagnóstico</Btn>
                <Btn variant="ghost" onClick={() => registrarCasoEstruturado(false)}>Errei / incompleto</Btn>
              </div>
              {casoRevelado && (
                <div className="space-y-3">
                  <div className="grid gap-2">
                    {caso.diferenciais.map((d) => (
                      <div key={d.dx} className="bg-black/30 border border-white/5 rounded-xl p-3">
                        <p className="text-[12px] font-black text-gray-100">{d.dx} <span className="text-[10px] text-gray-500">({d.plausibilidade})</span></p>
                        <p className="text-[12px] text-gray-400 mt-1">{d.pista}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[12px] text-gray-300"><strong className="text-white">Workup:</strong> {caso.workup.join(", ")}</p>
                  <p className="text-[12px] text-gray-300"><strong className="text-white">Diagnóstico:</strong> {caso.diagnosticoFinal}. {caso.justificativa}</p>
                </div>
              )}
            </div>
          )}

          {activeFase === "sct" && (
            <div className="space-y-3">
              {caso.sct.map((item, idx) => (
                <div key={`${item.hipotese}-${idx}`} className="bg-black/30 border border-white/5 rounded-xl p-3">
                  <p className="text-[12px] text-gray-200"><strong>Hipótese:</strong> {item.hipotese}</p>
                  <p className="text-[12px] text-gray-400 mt-1"><strong>Nova informação:</strong> {item.novaInfo}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {[-2, -1, 0, 1, 2].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSctRespostas((prev) => ({ ...prev, [idx]: value }))}
                        className={`min-h-11 px-3 rounded-xl border text-xs font-black ${Number(sctRespostas[idx]) === value ? "bg-blue-600 text-white border-blue-500" : "bg-white/5 text-gray-400 border-white/10"}`}
                      >
                        {value > 0 ? `+${value}` : value}
                      </button>
                    ))}
                  </div>
                  {sctRevelado && (
                    <p className="text-[12px] text-gray-300 mt-3">
                      Painel: <strong className="text-white">{item.efeitoPainel > 0 ? `+${item.efeitoPainel}` : item.efeitoPainel}</strong>. {item.racional}
                    </p>
                  )}
                </div>
              ))}
              <Btn onClick={revelarSct}>Comparar com painel</Btn>
            </div>
          )}

          {activeFase === "anamnese" && (
            <div className="space-y-3">
              <p className="text-[12px] text-gray-400">Queixa-guia: <strong className="text-gray-100">{caso.anamnese.queixa}</strong></p>
              {caso.anamnese.roteiro.map((bloco) => (
                <div key={bloco.bloco} className="bg-black/30 border border-white/5 rounded-xl p-3">
                  <p className="text-[12px] font-black text-gray-100 mb-2">{bloco.bloco}</p>
                  <div className="grid gap-2">
                    {bloco.perguntasChave.map((pergunta) => (
                      <label key={pergunta} className="flex items-center gap-2 text-[12px] text-gray-300 min-h-11">
                        <input
                          type="checkbox"
                          checked={!!anamneseChecks[pergunta]}
                          onChange={(e) => setAnamneseChecks((prev) => ({ ...prev, [pergunta]: e.target.checked }))}
                        />
                        {pergunta}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <Btn onClick={revelarAnamnese}>Revelar roteiro e red flags</Btn>
              {anamneseRevelada && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-red-300 font-black">Red flags</p>
                  <p className="text-[12px] text-gray-200 mt-1">{caso.anamnese.redFlags.join(", ")}</p>
                </div>
              )}
            </div>
          )}

          {/* P4-D: Conduta / Prescricao simulada */}
          {activeFase === "conduta" && (
            <div className="space-y-4">
              {/* Aviso educacional obrigatorio — deve ser aceito antes de prosseguir */}
              {!conductaAvisoAceito ? (
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-400 mt-0.5 shrink-0" />
                    <div className="space-y-2">
                      <p className="text-[13px] font-bold text-amber-300">Aviso obrigatorio antes de continuar</p>
                      <p className="text-[12px] text-gray-300 leading-relaxed">
                        Esta fase simula a elaboracao de conduta e prescricao para fins exclusivamente educacionais.
                      </p>
                      <ul className="space-y-1.5 mt-2">
                        {[
                          "Nao aplicar qualquer decisao terapeutica em pacientes reais com base neste exercicio.",
                          "Doses e medicamentos sugeridos sao hipoteticos e nao substituem diretrizes clinicas vigentes.",
                          "Utilize esta fase apenas para treinar raciocinio de conduta, nao para prescricao real.",
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11.5px] text-gray-400">
                            <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConductaAvisoAceito(true)}
                    className="w-full py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 font-bold text-[12px] rounded-xl transition-colors"
                  >
                    Entendi — iniciar simulacao educacional
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[12px] text-gray-400 leading-relaxed">
                    Simule a conduta completa para <strong className="text-gray-200">{caso.tema}</strong>.
                    Preencha o maximo que conseguir antes de revelar o gabarito.
                  </p>

                  {/* Lembrete compacto pos-aceite */}
                  <div className="flex items-center gap-2 bg-amber-950/10 border border-amber-500/10 rounded-xl px-3 py-2">
                    <AlertTriangle size={11} className="text-amber-500 shrink-0" />
                    <p className="text-[10px] text-amber-600">Uso educacional. Nao aplicar em paciente real.</p>
                  </div>

                  {/* Campos de conduta simulada */}
                  <div className="space-y-3">
                    {CONDUTA_FIELDS.map((field) => (
                      <div key={field.key} className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          {field.label}
                        </label>
                        <Textarea
                          rows={2}
                          value={conductaRespostas[field.key] || ""}
                          onChange={(e) =>
                            setConductaRespostas((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Indicador de preenchimento */}
                  {!conductaRevelada && (() => {
                    const preenchidos = CONDUTA_FIELDS.filter(
                      (f) => String(conductaRespostas[f.key] || "").trim().length >= 5
                    ).length;
                    return (
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${(preenchidos / CONDUTA_FIELDS.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 shrink-0">
                          {preenchidos}/{CONDUTA_FIELDS.length} campos
                        </span>
                      </div>
                    );
                  })()}

                  {!conductaRevelada && (
                    <Btn onClick={revelarConduta}>
                      <Eye size={14} /> Revelar gabarito de conduta
                    </Btn>
                  )}

                  {/* Gabarito pos-revelacao */}
                  {conductaRevelada && (
                    <div className="space-y-3">
                      <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3">
                        <p className="text-[10px] uppercase tracking-wider text-blue-300 font-bold">Gabarito educacional</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Conduta base</p>
                            <p className="text-[12px] text-gray-200 leading-relaxed">
                              {caso.script?.management || "Conduta especifica nao descrita neste caso."}
                            </p>
                          </div>
                          {caso.workup?.length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Workup inicial</p>
                              <p className="text-[12px] text-gray-200 leading-relaxed">
                                {caso.workup.join(", ")}
                              </p>
                            </div>
                          )}
                        </div>
                        {caso.anamnese?.redFlags?.length > 0 && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                            <p className="text-[10px] uppercase tracking-wider text-red-300 font-black mb-1">Red flags</p>
                            <p className="text-[12px] text-gray-200">{caso.anamnese.redFlags.join(", ")}</p>
                          </div>
                        )}
                      </div>
                      {/* Score de cobertura */}
                      {(() => {
                        const preenchidos = CONDUTA_FIELDS.filter(
                          (f) => String(conductaRespostas[f.key] || "").trim().length >= 5
                        ).length;
                        const pct = Math.round((preenchidos / CONDUTA_FIELDS.length) * 100);
                        return (
                          <div className="flex items-center gap-3 bg-[#111113] border border-white/5 rounded-xl px-4 py-3">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Cobertura da conduta</p>
                            <p className={`text-xl font-black tabular-nums ml-auto ${pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400"}`}>
                              {pct}%
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <SessionClosureModal
        open={showClosure}
        source={closureDraft?.source || "raciocinio"}
        tema={closureDraft?.tema || caso?.tema || ""}
        area={closureDraft?.area || caso?.area || ""}
        initial={closureDraft}
        onSave={(payload) => {
          if (addSessionReflection) addSessionReflection(payload);
          if (rebuildActionInboxForToday) rebuildActionInboxForToday();
          if (showToast) showToast("Fechamento do caso salvo.");
          setShowClosure(false);
        }}
        onSkip={() => setShowClosure(false)}
        onClose={() => setShowClosure(false)}
      />
    </div>
  );
}
