// src/components/RaciocinioClinico.jsx
import React, { useMemo, useState } from "react";
import { Brain, ClipboardList, MessageSquareText, Stethoscope, CheckCircle, Eye, CalendarDays, Pill, AlertTriangle, Plus, RefreshCw } from "lucide-react";
import { CASOS_CLINICOS } from "../constants/casosClinicos";
import { useStore } from "../core/store";
import { Textarea, Field, Input } from "./Primitives";
import { Badge, Button as PremiumButton, Card, Dialog, MetricRing, SegmentedControl, Tooltip } from "./ui";
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
  const meta = useStore((s) => s.meta);
  const setMeta = useStore((s) => s.setMeta);

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
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1-6
  const [temaQuery, setTemaQuery] = useState("");
  const [showTemaDropdown, setShowTemaDropdown] = useState(false);
  const [caseDraft, setCaseDraft] = useState({
    tema: "", temaId: null, area: "", subarea: "", fonte: "custom",
    vinheta: "", novaInfo1: "", novaInfo2: "",
    diagnostico: "", diferenciais: "", conduta: "",
  });

  const temas = useStore((s) => s[plat]?.temas || []);

  const customCases = useMemo(() => Array.isArray(meta?.clinicalCustomCases) ? meta.clinicalCustomCases : [], [meta?.clinicalCustomCases]);
  const allCases = useMemo(() => [...CASOS_CLINICOS, ...customCases], [customCases]);
  const caso = allCases.find((item) => item.id === activeCasoId) || allCases[0];
  const progresso = casosProgresso[caso?.id] || {};
  const raciocinioScore = useMemo(() => calculateClinicalReasoningScore(casosProgresso), [casosProgresso]);
  const casosFeitos = useMemo(
    () => Object.values(casosProgresso || {}).filter((item) => item?.vistos > 0).length,
    [casosProgresso]
  );

  if (!allCases.length) {
    return (
      <Card className="text-center text-gray-500" style={{ padding: 28 }}>
        <p>Banco em construção — crie um caso clínico manual para começar.</p>
        <PremiumButton className="mt-3" onClick={() => setShowCreateCase(true)}>
          <Plus size={15} /> Criar caso clínico
        </PremiumButton>
      </Card>
    );
  }

  const registrar = (payload) => registrarCaso(plat, caso.id, payload);

  const saveCustomCase = () => {
    if (!caseDraft.tema.trim() || !caseDraft.vinheta.trim()) return;
    const nextCase = {
      id: `custom-${Date.now()}`,
      tema: caseDraft.tema.trim(),
      area: caseDraft.area.trim() || "Custom",
      subarea: caseDraft.subarea.trim() || "Caso criado",
      dificuldade: "media",
      vinheta: caseDraft.vinheta.trim(),
      diagnosticoFinal: caseDraft.diagnostico.trim() || "Diagnostico a completar",
      justificativa: "Caso criado manualmente para treino vinculado ao cronograma.",
      workup: ["Definir exames iniciais", "Listar dados discriminantes"],
      diferenciais: [
        { dx: caseDraft.diagnostico.trim() || "Hipotese principal", plausibilidade: "principal", pista: "Compare com sinais discriminantes do caso." },
      ],
      script: {
        predisponentes: "Definir contexto e fatores de risco.",
        fisiopatologia: "Explicar mecanismo central.",
        achados: "Separar achados positivos e negativos importantes.",
        management: caseDraft.conduta.trim() || "Definir conduta educacional.",
      },
      sct: [
        {
          hipotese: caseDraft.diagnostico.trim() || "Hipotese principal",
          novaInfo: "Nova informacao discriminante",
          efeitoPainel: 0,
          racional: "Edite o caso no futuro para detalhar o racional.",
        },
      ],
      anamnese: {
        queixa: "Queixa guia do caso",
        roteiro: [{ bloco: "Dados discriminantes", perguntasChave: ["O que aumenta ou reduz a probabilidade da hipotese?"] }],
        redFlags: ["Definir sinais de alarme"],
      },
    };
    setMeta({ ...meta, clinicalCustomCases: [...customCases, nextCase] });
    setActiveCasoId(nextCase.id);
    setShowCreateCase(false);
    setWizardStep(1);
    setCaseDraft({ tema: "", temaId: null, area: "", subarea: "", fonte: "custom", vinheta: "", novaInfo1: "", novaInfo2: "", diagnostico: "", diferenciais: "", conduta: "" });
    setTemaQuery("");
    if (showToast) showToast("Caso clinico criado e vinculado ao treino.");
  };

  const abrirFechamento = (payload) => {
    setClosureDraft({
      source: "raciocinio",
      tema: caso.tema,
      area: caso.area,
      ...payload,
    });
    setShowClosure(true);
  };

  const marcarPrecisoRelembrar = () => {
    registrar({ precisaRelembrar: true, confianca: 1, acertou: false, nextAdjustment: "illness_script" });
    abrirFechamento({
      outcome: "medio",
      mainIssue: "raciocinio",
      nextAdjustment: "illness_script",
    });
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
    <div className="flex flex-col gap-4 med-animate-in text-left">
      <Card
        variant="elevated"
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ background: "linear-gradient(180deg, rgba(147,51,234,.1), rgba(59,130,246,.045)), var(--med-surface-0)" }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-200">
              <Stethoscope size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <Badge tone="purple">P4 clínico</Badge>
                <Tooltip content="Treino faseado com illness scripts, casos estruturados, Script Concordance e anamnese dirigida.">
                  <span className="grid h-6 w-6 cursor-help place-items-center rounded-full border border-white/10 bg-white/5 text-[10px] font-black text-gray-400">i</span>
                </Tooltip>
              </div>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white">Raciocínio Clínico</h2>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-[12px] leading-relaxed text-gray-400">
            Treine transferência clínica com scripts, diferenciais, SCT, anamnese dirigida e conduta educacional.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex flex-wrap justify-end gap-2">
            <PremiumButton variant="secondary" onClick={() => setShowWhy(true)}>Por que usar?</PremiumButton>
            <PremiumButton onClick={() => setShowCreateCase(true)}><Plus size={15} /> Criar caso clínico</PremiumButton>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <MetricRing value={raciocinioScore || 0} label="score" tone="purple" size={62} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Casos vistos</p>
              <p className="text-2xl font-black text-white tabular-nums">{casosFeitos}</p>
            </div>
          </div>
        </div>
      </Card>

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
          {allCases.map((item) => {
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
                className="w-full text-left transition-all"
                style={{ background: "transparent", border: 0, padding: 0 }}
              >
                <Card interactive selected={ativo} style={{ padding: 12 }}>
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
                </Card>
              </button>
            );
          })}
        </div>

        <Card className="flex flex-col gap-4" style={{ padding: 18 }}>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge tone="blue">{caso.area}</Badge>
              <span className="text-[10px] text-gray-500 font-mono">{caso.id}</span>
              {progresso.vistos > 0 && <Badge tone="green">{progresso.vistos} encontro(s)</Badge>}
            </div>
            <h3 className="text-lg font-black text-white">{caso.tema}</h3>
            <p className="text-[13px] text-gray-300 leading-relaxed mt-2">{caso.vinheta}</p>
            <button
              type="button"
              onClick={marcarPrecisoRelembrar}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] font-black text-amber-200 hover:bg-amber-500/20"
            >
              <RefreshCw size={13} />
              Preciso relembrar
            </button>
          </div>

          <SegmentedControl
            ariaLabel="Fases do treino clínico"
            className="max-w-full overflow-x-auto"
            onChange={setActiveFase}
            options={FASES.map((fase) => ({ value: fase.k, label: fase.label }))}
            value={activeFase}
          />

          {activeFase === "script" && (
            <div className="space-y-3">
              <p className="text-[12px] text-gray-400">Recupere de memória: condições predisponentes, fisiopatologia, achados e conduta. Depois revele o script.</p>
              <PremiumButton onClick={() => setScriptAberto((v) => !v)}><Eye size={15} /> {scriptAberto ? "Ocultar script" : "Revelar script"}</PremiumButton>
              {scriptAberto && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(caso.script).map(([key, value]) => (
                    <Card key={key} style={{ padding: 12, background: "rgba(0,0,0,.22)" }}>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{key}</p>
                      <p className="text-[12px] text-gray-200 mt-1 leading-relaxed">{value}</p>
                    </Card>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <PremiumButton onClick={() => registrarScript(true)}><CheckCircle size={15} /> Recuperei bem</PremiumButton>
                <PremiumButton variant="secondary" onClick={() => registrarScript(false)}>Preciso reencontrar em 2 dias</PremiumButton>
              </div>
            </div>
          )}

          {activeFase === "caso" && (
            <div className="space-y-3">
              <Textarea rows={4} value={diferenciaisLivres} onChange={(e) => setDiferenciaisLivres(e.target.value)} placeholder="Liste seus diferenciais, exames e conduta antes de revelar o painel." />
              <div className="flex flex-wrap gap-2">
                <PremiumButton onClick={() => setCasoRevelado(true)}>Revelar painel</PremiumButton>
                <PremiumButton variant="secondary" onClick={() => registrarCasoEstruturado(true)}>Acertei o diagnóstico</PremiumButton>
                <PremiumButton variant="secondary" onClick={() => registrarCasoEstruturado(false)}>Errei / incompleto</PremiumButton>
              </div>
              {casoRevelado && (
                <div className="space-y-3">
                  <div className="grid gap-2">
                    {caso.diferenciais.map((d) => (
                      <Card key={d.dx} style={{ padding: 12, background: "rgba(0,0,0,.22)" }}>
                        <p className="text-[12px] font-black text-gray-100">{d.dx} <span className="text-[10px] text-gray-500">({d.plausibilidade})</span></p>
                        <p className="text-[12px] text-gray-400 mt-1">{d.pista}</p>
                      </Card>
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
                <Card key={`${item.hipotese}-${idx}`} style={{ padding: 12, background: "rgba(0,0,0,.22)" }}>
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
                </Card>
              ))}
              <PremiumButton onClick={revelarSct}>Comparar com painel</PremiumButton>
            </div>
          )}

          {activeFase === "anamnese" && (
            <div className="space-y-3">
              <p className="text-[12px] text-gray-400">Queixa-guia: <strong className="text-gray-100">{caso.anamnese.queixa}</strong></p>
              {caso.anamnese.roteiro.map((bloco) => (
                <Card key={bloco.bloco} style={{ padding: 12, background: "rgba(0,0,0,.22)" }}>
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
                </Card>
              ))}
              <PremiumButton onClick={revelarAnamnese}>Revelar roteiro e red flags</PremiumButton>
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
                    <PremiumButton onClick={revelarConduta}>
                      <Eye size={14} /> Revelar gabarito de conduta
                    </PremiumButton>
                  )}

                  {/* Gabarito pos-revelacao */}
                  {conductaRevelada && (
                    <div className="space-y-3">
                      <Card className="space-y-3" style={{ padding: 16, background: "rgba(0,0,0,.22)" }}>
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
                      </Card>
                      {/* Score de cobertura */}
                      {(() => {
                        const preenchidos = CONDUTA_FIELDS.filter(
                          (f) => String(conductaRespostas[f.key] || "").trim().length >= 5
                        ).length;
                        const pct = Math.round((preenchidos / CONDUTA_FIELDS.length) * 100);
                        return (
                          <Card className="flex items-center gap-3" style={{ padding: "12px 16px" }}>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Cobertura da conduta</p>
                            <p className={`text-xl font-black tabular-nums ml-auto ${pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400"}`}>
                              {pct}%
                            </p>
                          </Card>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </Card>
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
      <Dialog
        open={showWhy}
        onClose={() => setShowWhy(false)}
        title="Por que usar essa função?"
        description="Raciocínio clínico treina transferência, não só memória."
        wide
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Illness scripts", "Organizam predisponentes, mecanismo, consequências e conduta para reduzir raciocínio solto."],
            ["Casos variantes", "Forçam aplicar o mesmo tema em contexto novo, que é onde questões clínicas cobram discriminação."],
            ["Diferenciais", "Treinam separar hipóteses parecidas pelos dados discriminantes."],
            ["SCT e conduta", "Treinam decisão sob incerteza e justificativa educacional de manejo."],
          ].map(([title, body]) => (
            <Card key={title} style={{ padding: 12 }}>
              <p className="text-[12px] font-bold text-gray-100">{title}</p>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{body}</p>
            </Card>
          ))}
        </div>
      </Dialog>
      {showCreateCase && (() => {
        const filteredTemas = (() => {
          const q = temaQuery.trim().toLowerCase();
          if (!q) return [];
          return temas.filter(t => t.nome.toLowerCase().includes(q)).slice(0, 8);
        })();
        const STEPS_WIZARD = [
          "Escolher tema",
          "Vinheta base",
          "Nova informação 1",
          "Nova informação 2",
          "Diagnóstico e diferenciais",
          "Conduta educacional",
        ];
        const canAdvance = [
          caseDraft.tema.trim().length > 0,
          caseDraft.vinheta.trim().length > 10,
          true,
          true,
          caseDraft.diagnostico.trim().length > 0,
          caseDraft.conduta.trim().length > 0,
        ][wizardStep - 1];

        return (
          <Dialog
            open={showCreateCase}
            onClose={() => { setShowCreateCase(false); setWizardStep(1); }}
            title={STEPS_WIZARD[wizardStep - 1]}
            description={`Criar caso clínico · Passo ${wizardStep}/${STEPS_WIZARD.length}`}
            wide
          >
            <div className="space-y-4 text-left">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {STEPS_WIZARD.map((_, i) => (
                    <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${i < wizardStep ? "bg-blue-500" : "bg-white/10"}`} />
                  ))}
                </div>
              </div>

              {/* Passo 1: Tema */}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <p className="text-[11px] text-gray-400">Vincule o caso a um tema do seu cronograma.</p>
                  <div className="relative">
                    <Input
                      placeholder="Buscar tema no plano..."
                      value={temaQuery}
                      onChange={e => { setTemaQuery(e.target.value); setCaseDraft(d => ({ ...d, tema: e.target.value, temaId: null, area: "" })); setShowTemaDropdown(true); }}
                      onFocus={() => setShowTemaDropdown(true)}
                      onBlur={() => setTimeout(() => setShowTemaDropdown(false), 200)}
                    />
                    {showTemaDropdown && filteredTemas.length > 0 && (
                      <div className="absolute z-50 top-full mt-1 w-full bg-[#18181b] border border-white/15 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                        {filteredTemas.map(t => (
                          <button key={t.id} type="button"
                            className="w-full text-left px-3 py-2 text-[11px] text-gray-200 hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer"
                            onMouseDown={() => { setTemaQuery(t.nome); setCaseDraft(d => ({ ...d, tema: t.nome, temaId: t.id, area: t.esp || "" })); setShowTemaDropdown(false); }}
                          >
                            <span className="font-bold">{t.nome}</span>
                            <span className="text-gray-500 ml-1.5">· {t.esp}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label="Área" info="Preenchida automaticamente ao selecionar o tema.">
                      <Input value={caseDraft.area} onChange={e => setCaseDraft(d => ({ ...d, area: e.target.value }))} placeholder="ex: Cirurgia" />
                    </Field>
                    <Field label="Subárea (opcional)">
                      <Input value={caseDraft.subarea} onChange={e => setCaseDraft(d => ({ ...d, subarea: e.target.value }))} placeholder="ex: Trauma abdominal" />
                    </Field>
                  </div>
                </div>
              )}

              {/* Passo 2: Vinheta */}
              {wizardStep === 2 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-400">Construa o caso base: queixa guia, contexto, dados vitais, achados positivos e negativos importantes.</p>
                  <Textarea rows={5} placeholder="Ex: Paciente masculino, 28 anos, dor abdominal em FID há 12 horas, iniciou em região periumbilical, náuseas, sem febre. Sinal de Blumberg positivo, Rovsing positivo, defesa muscular local." value={caseDraft.vinheta} onChange={e => setCaseDraft(d => ({ ...d, vinheta: e.target.value }))} />
                </div>
              )}

              {/* Passo 3: Nova informação 1 */}
              {wizardStep === 3 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-400">Acrescente um dado clínico/laboratorial que modifica ou confirma a hipótese. Como impacta a probabilidade do diagnóstico?</p>
                  <Textarea rows={4} placeholder="Ex: Leucocitose 14.000 com desvio à esquerda. TC abdominal com espessamento do apêndice e infiltração de gordura periapendicular." value={caseDraft.novaInfo1} onChange={e => setCaseDraft(d => ({ ...d, novaInfo1: e.target.value }))} />
                </div>
              )}

              {/* Passo 4: Nova informação 2 */}
              {wizardStep === 4 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-400">Acrescente um dado que muda conduta ou diagnóstico. Use para criar dilema clínico ou reforçar o raciocínio.</p>
                  <Textarea rows={4} placeholder="Ex: Febre 38.5°C nas últimas 2 horas. Peristaltismo ausente. Defesa abdominal difusa — pensar em perfuração." value={caseDraft.novaInfo2} onChange={e => setCaseDraft(d => ({ ...d, novaInfo2: e.target.value }))} />
                </div>
              )}

              {/* Passo 5: Diagnóstico e diferenciais */}
              {wizardStep === 5 && (
                <div className="space-y-3">
                  <Field label="Diagnóstico central" info="Diagnóstico de referência ou hipótese principal do caso.">
                    <Input value={caseDraft.diagnostico} onChange={e => setCaseDraft(d => ({ ...d, diagnostico: e.target.value }))} placeholder="ex: Apendicite aguda" />
                  </Field>
                  <Field label="Diferenciais principais (separe por vírgula)" info="Hipóteses que devem ser discriminadas.">
                    <Input value={caseDraft.diferenciais} onChange={e => setCaseDraft(d => ({ ...d, diferenciais: e.target.value }))} placeholder="ex: Cólica renal, DIP, hérnia encarcerada" />
                  </Field>
                </div>
              )}

              {/* Passo 6: Conduta */}
              {wizardStep === 6 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-400">Descreva a conduta educacional: exames iniciais, manejo, red flags e contraindicações específicas do caso.</p>
                  <Textarea rows={5} placeholder="Ex: Laparotomia de urgência. Exames: Hb, Ht, leucograma, creatinina, tipagem. Contraindicação a opióides antes do diagnóstico firmado. Red flag: febre alta + defesa difusa = peritonite." value={caseDraft.conduta} onChange={e => setCaseDraft(d => ({ ...d, conduta: e.target.value }))} />
                </div>
              )}

              {/* Botões de navegação */}
              <div className="flex gap-2 pt-2">
                {wizardStep > 1 && <PremiumButton variant="secondary" onClick={() => setWizardStep(s => s - 1)}>Anterior</PremiumButton>}
                {wizardStep < STEPS_WIZARD.length ? (
                  <PremiumButton fullWidth onClick={() => setWizardStep(s => s + 1)} disabled={!canAdvance}>
                    Próximo →
                  </PremiumButton>
                ) : (
                  <PremiumButton fullWidth onClick={saveCustomCase} disabled={!caseDraft.tema.trim() || !caseDraft.vinheta.trim() || !caseDraft.diagnostico.trim()}>
                    Salvar e vincular ao plano
                  </PremiumButton>
                )}
              </div>
            </div>
          </Dialog>
        );
      })()}
    </div>
  );
}
