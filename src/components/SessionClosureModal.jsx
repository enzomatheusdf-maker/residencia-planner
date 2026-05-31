import React, { useEffect, useMemo, useState } from "react";
import { Btn, Modal, Textarea } from "./Primitives";

const OUTCOME_OPTIONS = [
  { key: "bom", label: "Bom" },
  { key: "medio", label: "Medio" },
  { key: "ruim", label: "Ruim" },
];

const ISSUE_OPTIONS = [
  { key: "conteudo", label: "Conteudo" },
  { key: "raciocinio", label: "Raciocinio" },
  { key: "tempo", label: "Tempo" },
  { key: "distracao", label: "Distracao" },
  { key: "energia", label: "Energia" },
  { key: "nenhum", label: "Nada" },
];

const ADJUSTMENT_OPTIONS = [
  { key: "revisar", label: "Revisar" },
  { key: "questoes", label: "Questoes externas" },
  { key: "caso", label: "Caso clinico" },
  { key: "anki", label: "Anki" },
  { key: "descanso", label: "Descanso" },
  { key: "manter", label: "Manter" },
];

export default function SessionClosureModal({
  open,
  source = "focus",
  tema = "",
  area = "",
  initial = null,
  onSkip,
  onSave,
  onClose,
}) {
  const normalizedInitial = useMemo(
    () => ({
      outcome: initial?.outcome || "medio",
      mainIssue: initial?.mainIssue || "nenhum",
      nextAdjustment: initial?.nextAdjustment || "revisar",
      confidence: initial?.confidence || "media",
      note: initial?.note || "",
    }),
    [initial]
  );

  const [outcome, setOutcome] = useState(normalizedInitial.outcome);
  const [mainIssue, setMainIssue] = useState(normalizedInitial.mainIssue);
  const [nextAdjustment, setNextAdjustment] = useState(normalizedInitial.nextAdjustment);
  const [note, setNote] = useState(normalizedInitial.note);

  useEffect(() => {
    if (!open) return;
    setOutcome(normalizedInitial.outcome);
    setMainIssue(normalizedInitial.mainIssue);
    setNextAdjustment(normalizedInitial.nextAdjustment);
    setNote(normalizedInitial.note);
  }, [open, normalizedInitial]);

  if (!open) return null;

  const handleSave = () => {
    if (onSave) {
      onSave({
        source,
        tema,
        area,
        outcome,
        mainIssue,
        confidence: normalizedInitial.confidence,
        nextAdjustment,
        note: note.trim(),
      });
    }
    if (onClose) onClose();
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
    if (onClose) onClose();
  };

  return (
    <Modal onClose={handleSkip}>
      <div className="space-y-4 text-left">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-blue-400 font-black">Fechamento rapido</p>
          <h3 className="text-base font-black text-white mt-1">Transforme resultado em proxima acao</h3>
          {(tema || area) && (
            <p className="text-xs text-gray-400 mt-1">{[tema, area].filter(Boolean).join(" · ")}</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Como foi?</p>
          <div className="grid grid-cols-3 gap-2">
            {OUTCOME_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setOutcome(option.key)}
                className={`rounded-xl px-3 py-2 text-xs font-bold border transition-all ${
                  outcome === option.key
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">O que mais atrapalhou?</p>
          <div className="grid grid-cols-2 gap-2">
            {ISSUE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setMainIssue(option.key)}
                className={`rounded-xl px-3 py-2 text-xs font-bold border transition-all ${
                  mainIssue === option.key
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Proximo ajuste</p>
          <div className="grid grid-cols-2 gap-2">
            {ADJUSTMENT_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setNextAdjustment(option.key)}
                className={`rounded-xl px-3 py-2 text-xs font-bold border transition-all ${
                  nextAdjustment === option.key
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Nota opcional</p>
          <Textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Uma frase curta para lembrar o ajuste da proxima sessao."
          />
        </div>

        <div className="flex gap-2">
          <Btn className="flex-1" onClick={handleSave}>
            Salvar
          </Btn>
          <Btn variant="ghost" className="flex-1" onClick={handleSkip}>
            Pular
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

