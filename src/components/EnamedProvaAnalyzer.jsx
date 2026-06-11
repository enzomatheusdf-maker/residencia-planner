import React, { useMemo, useState } from "react";
import { ClipboardCheck, Send } from "lucide-react";
import { analyzeProvaEnamed } from "../core/provaAnalyzer";
import { useStore } from "../core/store";
import { Btn, Input } from "./Primitives";
import { ERROR_TYPE } from "../core/errorTaxonomy";
import SessionClosureModal from "./SessionClosureModal";
import EmptyState from "./EmptyState";
import { MotionCard, MotionPresence, MotionProgressBar, MotionSection, MotionStep } from "./motion";

const AREAS = ["Clínica Médica", "Cirurgia", "GO", "Pediatria", "Preventiva"];

export default function EnamedProvaAnalyzer() {
  const registrarAnaliseEnamed = useStore((s) => s.registrarAnaliseEnamed);
  const enamedAnalises = useStore((s) => s.enamedAnalises || []);
  const addSessionReflection = useStore((s) => s.addSessionReflection);
  const rebuildActionInboxForToday = useStore((s) => s.rebuildActionInboxForToday);
  const showToast = useStore((s) => s.showToast);
  const [nome, setNome] = useState("Simulado ENAMED");
  const [total, setTotal] = useState("100");
  const [acertos, setAcertos] = useState("");
  const [highConfidenceErrors, setHighConfidenceErrors] = useState("0");
  const [lowConfidenceHits, setLowConfidenceHits] = useState("0");
  const [tempoExcedidoCount, setTempoExcedidoCount] = useState("0");
  const [areas, setAreas] = useState(
    AREAS.map((area) => ({ area, total: "20", acertos: "" }))
  );
  const [resultado, setResultado] = useState(null);
  const [showClosure, setShowClosure] = useState(false);
  const [closureDraft, setClosureDraft] = useState(null);

  const canSubmit = useMemo(() => {
    const t = Number(total);
    const a = Number(acertos);
    return Number.isFinite(t) && t > 0 && Number.isFinite(a) && a >= 0 && a <= t;
  }, [total, acertos]);

  const onSubmit = () => {
    if (!canSubmit) return;

    const syntheticErrors = [
      ...Array.from({ length: Number(highConfidenceErrors || 0) }, () => ({ acertou: false, confianca: "alta" })),
      ...Array.from({ length: Number(lowConfidenceHits || 0) }, () => ({ acertou: true, confianca: "baixa" })),
      ...Array.from({ length: Number(tempoExcedidoCount || 0) }, () => ({ acertou: false, tempoExcedido: true })),
    ];

    const payload = {
      nome,
      total: Number(total),
      acertos: Number(acertos),
      areas: areas.map((a) => ({
        area: a.area,
        total: Number(a.total || 0),
        acertos: Number(a.acertos || 0),
      })),
      errors: syntheticErrors,
    };
    const analise = analyzeProvaEnamed(payload);
    setResultado(analise);
    registrarAnaliseEnamed(analise);

    const dominant = analise?.errors?.dominante;
    const mainIssue =
      dominant === ERROR_TYPE.REASONING
        ? "raciocinio"
        : dominant === ERROR_TYPE.TIME
        ? "tempo"
        : dominant === ERROR_TYPE.CONTENT
        ? "conteudo"
        : dominant === ERROR_TYPE.DISTRACTION || dominant === ERROR_TYPE.INTERPRETATION
        ? "distracao"
        : "nenhum";
    setClosureDraft({
      source: "prova",
      tema: analise.nome,
      area: analise.resumo?.areaCritica || "",
      outcome: analise.pctGeral >= 80 ? "bom" : analise.pctGeral >= 65 ? "medio" : "ruim",
      mainIssue,
      nextAdjustment: analise.pctGeral >= 80 ? "manter" : "revisar",
    });
    setShowClosure(true);
  };

  return (
    <MotionSection as="div" className="bg-[#111113] border border-white/5 rounded-2xl p-4 space-y-3 text-left">
      <div className="flex items-center gap-2">
        <ClipboardCheck size={16} className="text-blue-400" />
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-200">Analisador ENAMED</h3>
      </div>

      {enamedAnalises.length === 0 && !resultado && (
        <EmptyState
          icon={ClipboardCheck}
          title="Ainda sem analise de prova"
          description="Voce pode comecar com acertos por area. Nao precisa cadastrar questao por questao."
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da prova" />
        <Input type="number" min="1" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="Total" />
        <Input type="number" min="0" max={total || undefined} value={acertos} onChange={(e) => setAcertos(e.target.value)} placeholder="Acertos" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Input
          type="number"
          min="0"
          value={highConfidenceErrors}
          onChange={(e) => setHighConfidenceErrors(e.target.value)}
          placeholder="Erros com alta confianca"
        />
        <Input
          type="number"
          min="0"
          value={lowConfidenceHits}
          onChange={(e) => setLowConfidenceHits(e.target.value)}
          placeholder="Acertos com baixa confianca"
        />
        <Input
          type="number"
          min="0"
          value={tempoExcedidoCount}
          onChange={(e) => setTempoExcedidoCount(e.target.value)}
          placeholder="Questoes estourando tempo"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {areas.map((item, idx) => (
          <MotionCard key={item.area} interactive={false} className="border border-white/5 rounded-xl p-2.5 bg-black/20">
            <p className="text-[11px] font-semibold text-gray-300 mb-1">{item.area}</p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min="0"
                value={item.total}
                onChange={(e) => setAreas((prev) => prev.map((row, i) => (i === idx ? { ...row, total: e.target.value } : row)))}
                placeholder="Total"
              />
              <Input
                type="number"
                min="0"
                max={item.total || undefined}
                value={item.acertos}
                onChange={(e) => setAreas((prev) => prev.map((row, i) => (i === idx ? { ...row, acertos: e.target.value } : row)))}
                placeholder="Acertos"
              />
            </div>
          </MotionCard>
        ))}
      </div>

      <Btn onClick={onSubmit} disabled={!canSubmit} className="w-full">
        <Send size={14} /> Enviar para o Mentor
      </Btn>

      <MotionPresence>
      {resultado && (
        <MotionStep stepKey="resultado-enamed" className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 space-y-2">
          <p className="text-xs text-gray-200 font-semibold">
            Acerto geral: <span className="text-blue-300">{resultado.pctGeral}%</span>
          </p>
          <MotionProgressBar value={resultado.pctGeral} className="h-1.5 rounded-full bg-white/5 overflow-hidden" />
          <p className="text-[11px] text-gray-400">{resultado.resumo.recomendacao}</p>
          {resultado?.errors?.dominante && (
            <p className="text-[11px] text-gray-300">
              Erro dominante: <span className="font-bold text-white">{resultado.errors.dominante}</span>
            </p>
          )}
          {resultado.areas.length > 0 && (
            <ul className="text-[11px] text-gray-300 space-y-1">
              {resultado.areas.slice(0, 3).map((a) => (
                <li key={a.area}>
                  {a.area}: {a.pct}% (prioridade {a.prioridade})
                </li>
              ))}
            </ul>
          )}
        </MotionStep>
      )}
      </MotionPresence>
      <SessionClosureModal
        open={showClosure}
        source={closureDraft?.source || "prova"}
        tema={closureDraft?.tema || nome}
        area={closureDraft?.area || ""}
        initial={closureDraft}
        onSave={(payload) => {
          if (addSessionReflection) addSessionReflection(payload);
          if (rebuildActionInboxForToday) rebuildActionInboxForToday();
          if (showToast) showToast("Fechamento da prova salvo.");
          setShowClosure(false);
        }}
        onSkip={() => setShowClosure(false)}
        onClose={() => setShowClosure(false)}
      />
    </MotionSection>
  );
}
